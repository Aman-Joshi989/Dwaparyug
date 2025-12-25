// lib/db.ts
import { Pool, QueryResult, QueryResultRow, types } from 'pg';
import { unstable_cache } from 'next/cache';

// ✅ Custom parsers (prevent unwanted Date conversions)
types.setTypeParser(1082, (value) => value); // DATE
types.setTypeParser(types.builtins.DATE, (value) => value);
types.setTypeParser(types.builtins.TIMESTAMP, (value) => value);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => value);

// ✅ Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL is not defined in environment variables');
}

// ✅ Create a global pooled connection (optimized for Neon + Indian users)
let globalPool: Pool;

if (!(global as any).pgPool) {
  globalPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Increased for better concurrency (Neon supports up to 100)
    min: 2, // Keep minimum connections alive
    idleTimeoutMillis: 60000, // 60 seconds (increased for better reuse)
    connectionTimeoutMillis: 10000, // 10 seconds (London to India latency)
    ssl: {
      rejectUnauthorized: false, // Neon requires SSL
    },
    // Performance optimizations
    application_name: 'dwaparyug_app',
    statement_timeout: 30000, // 30 seconds max query time
    query_timeout: 30000,
  });

  // Connection event logging for debugging
  globalPool.on('connect', () => {
    console.log('✅ Database connection established');
  });

  globalPool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
  });

  (global as any).pgPool = globalPool;
} else {
  globalPool = (global as any).pgPool;
}

export const pool = globalPool;

/**
 * 🔹 Generic query executor with built-in error handling and logging
 */
async function executeQuery<T extends QueryResultRow>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<QueryResult<T>> {
  const startTime = Date.now();
  const client = await pool.connect();
  
  try {
    const result = await client.query<T>({ text: query, values: params });
    const duration = Date.now() - startTime;
    
    // Log slow queries (>500ms indicates potential issues with London DB)
    if (duration > 500) {
      console.warn(`⚠️ Slow query (${duration}ms):`, query.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw new Error('Database query failed');
  } finally {
    client.release();
  }
}

/**
 * 🔹 CACHED SELECT Query - Essential for reducing London->India latency
 */
export async function CachedSelectQuery<T extends QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[],
  cacheOptions: {
    revalidate?: number | false; // seconds to cache
    tags?: string[];
  } = { revalidate: 60 }
): Promise<T[]> {
  const cacheKey = [text, ...(params || []).map(p => String(p))];
  
  return unstable_cache(
    async () => {
      const result = await executeQuery<T>(text, params);
      return result.rows;
    },
    cacheKey,
    {
      revalidate: cacheOptions.revalidate ?? 60,
      tags: [...(cacheOptions.tags || []), 'database'],
    }
  )();
}

/**
 * 🔹 SELECT Query (Non-cached - use sparingly)
 */
export async function SelectQuery<T extends QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  const result = await executeQuery<T>(text, params);
  return result.rows;
}

/**
 * 🔹 INSERT Query with cache invalidation
 */
export async function InsertQuery<T extends QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[],
  invalidateTags?: string[]
): Promise<QueryResult<T>> {
  const result = await executeQuery<T>(text, params);
  
  // Invalidate cache tags if provided
  if (invalidateTags && invalidateTags.length > 0) {
    const { revalidateTag } = await import('next/cache');
    invalidateTags.forEach(tag => revalidateTag(tag));
  }
  
  return result;
}

/**
 * 🔹 UPDATE Query with cache invalidation
 */
export async function UpdateQuery<T extends QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[],
  invalidateTags?: string[]
): Promise<QueryResult<T>> {
  const result = await executeQuery<T>(text, params);
  
  if (invalidateTags && invalidateTags.length > 0) {
    const { revalidateTag } = await import('next/cache');
    invalidateTags.forEach(tag => revalidateTag(tag));
  }
  
  return result;
}

/**
 * 🔹 DELETE Query with cache invalidation
 */
export async function DeleteQuery<T extends QueryResultRow>(
  text: string,
  params?: (string | number | boolean | null)[],
  invalidateTags?: string[]
): Promise<QueryResult<T>> {
  const result = await executeQuery<T>(text, params);
  
  if (invalidateTags && invalidateTags.length > 0) {
    const { revalidateTag } = await import('next/cache');
    invalidateTags.forEach(tag => revalidateTag(tag));
  }
  
  return result;
}

/**
 * 🔹 Direct client access (for transactions)
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * 🔹 Transaction helper with automatic rollback
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 🔹 Batch query executor (reduces round trips to London)
 */
export async function batchSelectQuery<T extends QueryResultRow>(
  queries: Array<{ text: string; params?: any[] }>
): Promise<T[][]> {
  const client = await pool.connect();
  
  try {
    const results = await Promise.all(
      queries.map(({ text, params }) => 
        client.query<T>({ text, values: params })
      )
    );
    return results.map(r => r.rows);
  } catch (error) {
    console.error('❌ Batch query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 🔹 Health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await SelectQuery<{ now: string }>('SELECT NOW() as now');
    return result.length > 0;
  } catch {
    return false;
  }
}

// Common cache tags for easy revalidation
export const CacheTags = {
  DONATIONS: 'donations',
  USERS: 'users',
  EVENTS: 'events',
  BLOG: 'blog',
  PRODUCTS: 'products',
  TESTIMONIALS: 'testimonials',
  DATABASE: 'database',
} as const;