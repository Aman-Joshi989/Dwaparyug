-- 1) Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    mobile_no TEXT NOT NULL,
    dob DATE NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    role_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2) User Roles
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
------------------------------------------------------------------------- done from this point ------------------------------------------------------------------------- 
CREATE TABLE campaign_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    festival_type TEXT,
    overview TEXT,
    details TEXT,
    about_campaign TEXT,
    
    -- Financial fields
    donation_goal DECIMAL(18, 2) NOT NULL DEFAULT 0,
    total_raised DECIMAL(18, 2) DEFAULT 0,
    total_progress_percentage DECIMAL(5, 2) DEFAULT 0,
    
    -- Image fields for Cloudinary
    image TEXT NOT NULL,
    images_array TEXT[],
    
    -- Status and priority
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Active', 'Completed', 'Inactive')) DEFAULT 'Draft',
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'urgent', 'critical')),
    
    -- Campaign details
    location TEXT,
    organizer TEXT,
    verified BOOLEAN DEFAULT FALSE,
    
    -- Statistics
    total_beneficiary INTEGER DEFAULT 0,
    total_donors_till_now INTEGER DEFAULT 0,
    
    -- Dates
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Audit fields
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_campaign_category FOREIGN KEY (category_id) REFERENCES campaign_categories(id),
    CONSTRAINT fk_campaign_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_campaign_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE campaign_products (
    id SERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    indipendent_product_id BIGINT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock INTEGER DEFAULT 0,
    sequence INTEGER DEFAULT 1,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_campaign_products_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_products_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_campaign_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE indipendent_products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    unit_id INTEGER,
    image TEXT,
    min_qty INTEGER DEFAULT 1,
    max_qty INTEGER,
    increment_count INTEGER DEFAULT 1,
    is_flexible_increment_count BOOLEAN DEFAULT TRUE,
    allows_personalization BOOLEAN DEFAULT TRUE,  
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaign_product_units (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_campaign_product_units_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_campaign_product_units_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE campaign_faq (
    id SERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sequence INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_campaign_faq_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_faq_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_campaign_faq_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE campaign_videos (
    id SERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    video_url TEXT NOT NULL,
    video_title TEXT,
    video_description TEXT,
    sequence INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_campaign_videos_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    CONSTRAINT fk_campaign_videos_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_campaign_videos_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);
------------------------------------------------------------------------- to this point  ------------------------------------------------------------------------- 
-- 9) Donation Payment Requests

CREATE TABLE donation_temp_data (
    id BIGSERIAL PRIMARY KEY,
    payment_request_id BIGINT NOT NULL,
    cart_items JSONB NOT NULL,
    form_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_temp_data_payment_request FOREIGN KEY (payment_request_id) REFERENCES donation_payment_requests(id) ON DELETE CASCADE
);

CREATE TABLE donation_payment_requests (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    donation_type TEXT NOT NULL CHECK (donation_type IN ('direct', 'product_based')) DEFAULT 'direct',
    status TEXT NOT NULL CHECK (status IN ('created', 'attempted', 'paid', 'failed', 'cancelled')),
    payment_response JSONB NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_donation_payment_requests_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    CONSTRAINT fk_donation_payment_requests_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 10) Donations Table (Enhanced for tracking)
CREATE TABLE donations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NULL,
    campaign_id BIGINT NOT NULL,
    donation_payment_request_id BIGINT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    
    -- Donation amounts
    donation_amount DECIMAL(18, 2) NOT NULL,
    tip_amount DECIMAL(18, 2) DEFAULT 0,
    total_amount DECIMAL(18, 2) GENERATED ALWAYS AS (donation_amount + tip_amount) STORED,
    
    -- Donation type and details
    donation_type TEXT NOT NULL CHECK (donation_type IN ('direct', 'product_based')) DEFAULT 'direct',
    is_public BOOLEAN DEFAULT FALSE,
    donation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    donated_on_behalf_of TEXT NULL,
    donor_message TEXT,
    
    -- Impact tracking fields
    impact_generated BOOLEAN DEFAULT FALSE, -- Whether this donation has generated impact
    beneficiaries_reached INTEGER DEFAULT 0, -- Number of people helped by this donation
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_donations_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_donations_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    CONSTRAINT fk_donations_payment_request FOREIGN KEY (donation_payment_request_id) REFERENCES donation_payment_requests(id)
);

-- 11) Donation Items (for product-based donations)
CREATE TABLE donation_items (
    id BIGSERIAL PRIMARY KEY,
    donation_id BIGINT NOT NULL,
    campaign_product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_per_unit DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(18, 2) NOT NULL,
    
    -- Status tracking for distribution
    fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'in_batch', 'distributed', 'delivered')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_donation_items_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
    CONSTRAINT fk_donation_items_product FOREIGN KEY (campaign_product_id) REFERENCES campaign_products(id)
);

-- 12) Personalization Options (Enhanced)
CREATE TABLE personalization_options (
    id BIGSERIAL PRIMARY KEY,
    
    -- This can link to either donation (direct) or donation_item (product-based)
    donation_id BIGINT NULL, -- For direct donations with personalization
    donation_item_id BIGINT NULL, -- For product-based donations with personalization
    -- Personalization fields
    donor_name TEXT,
    donor_country TEXT,
    custom_image TEXT, -- Cloudinary URL for custom image
    is_image_available BOOLEAN DEFAULT FALSE,
    custom_message TEXT,
    donation_purpose TEXT,
    special_instructions TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_personalization_donation FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE,
    CONSTRAINT fk_personalization_donation_item FOREIGN KEY (donation_item_id) REFERENCES donation_items(id) ON DELETE CASCADE,
    CONSTRAINT chk_personalization_link CHECK (
        (donation_id IS NOT NULL AND donation_item_id IS NULL) OR 
        (donation_id IS NULL AND donation_item_id IS NOT NULL)
    )
);

-- 13) Distribution Batches (For organized delivery)
CREATE TABLE distribution_batches (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    batch_name TEXT NOT NULL,
    batch_description TEXT,
    
    -- Planning
    planned_distribution_date DATE,
    planned_location TEXT,
    planned_beneficiaries INTEGER DEFAULT 0,
    
    -- Execution
    actual_distribution_date DATE,
    actual_location TEXT,
    actual_beneficiaries INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'prepared', 'in_progress', 'completed', 'cancelled')),
    
    -- Financial summary
    total_value DECIMAL(18, 2) DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    
    -- Audit
    created_by BIGINT,
    updated_by BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_distribution_batches_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    CONSTRAINT fk_distribution_batches_created_by FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT fk_distribution_batches_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 14) Batch Items (What's included in each batch)
CREATE TABLE batch_items (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL,
    donation_item_id BIGINT NOT NULL,
    quantity_allocated INTEGER NOT NULL,
    
    -- Status
    status TEXT DEFAULT 'allocated' CHECK (status IN ('allocated', 'prepared', 'distributed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_batch_items_batch FOREIGN KEY (batch_id) REFERENCES distribution_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_batch_items_donation_item FOREIGN KEY (donation_item_id) REFERENCES donation_items(id),
    CONSTRAINT uq_batch_donation_item UNIQUE (batch_id, donation_item_id)
);

-- 15) Impact Stories (Showing real change)
CREATE TABLE impact_stories (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    batch_id BIGINT NULL, -- Can be linked to a specific batch
    
    -- Story content
    title TEXT NOT NULL,
    story_content TEXT NOT NULL,
    impact_summary TEXT, -- Brief summary of impact
    
    -- Media
    image_urls TEXT[], -- Multiple images from distribution
    video_urls TEXT[], -- Videos showing impact
    
    -- Impact metrics
    people_helped INTEGER DEFAULT 0,
    families_helped INTEGER DEFAULT 0,
    communities_helped INTEGER DEFAULT 0,
    
    -- Location and timing
    location TEXT,
    impact_date DATE,
    
    -- Status
    is_published BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    
    -- Audit
    posted_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_impact_stories_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    CONSTRAINT fk_impact_stories_batch FOREIGN KEY (batch_id) REFERENCES distribution_batches(id),
    CONSTRAINT fk_impact_stories_posted_by FOREIGN KEY (posted_by) REFERENCES users(id)
);

-- 16) Donation Impact Tracking (Links donations to their impact)
CREATE TABLE donation_impact_tracking (
    id BIGSERIAL PRIMARY KEY,
    donation_id BIGINT NOT NULL,
    impact_story_id BIGINT NOT NULL,
    batch_id BIGINT NULL,
    
    -- Impact details specific to this donation
    contribution_percentage DECIMAL(5, 2), -- What % of the impact this donation contributed
    people_helped_by_this_donation INTEGER DEFAULT 0,
    impact_description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_donation_impact_donation FOREIGN KEY (donation_id) REFERENCES donations(id),
    CONSTRAINT fk_donation_impact_story FOREIGN KEY (impact_story_id) REFERENCES impact_stories(id),
    CONSTRAINT fk_donation_impact_batch FOREIGN KEY (batch_id) REFERENCES distribution_batches(id),
    CONSTRAINT uq_donation_impact UNIQUE (donation_id, impact_story_id)
);

-- 17) Direct Donation Allocations (For direct donations without products)
CREATE TABLE direct_donation_allocations (
    id BIGSERIAL PRIMARY KEY,
    donation_id BIGINT NOT NULL,
    batch_id BIGINT NOT NULL,
    allocated_amount DECIMAL(18, 2) NOT NULL,
    allocation_purpose TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_direct_allocation_donation FOREIGN KEY (donation_id) REFERENCES donations(id),
    CONSTRAINT fk_direct_allocation_batch FOREIGN KEY (batch_id) REFERENCES distribution_batches(id)
);

-- Add foreign key constraints
ALTER TABLE campaign_products 
ADD CONSTRAINT fk_campaign_products_unit FOREIGN KEY (unit_id) REFERENCES campaign_product_units(id);

ALTER TABLE users 
ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES user_roles(id);

-- Create comprehensive indexes for analytics and performance
CREATE INDEX idx_campaigns_category_id ON campaigns(category_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_verified ON campaigns(verified);
CREATE INDEX idx_campaigns_end_date ON campaigns(end_date);

CREATE INDEX idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX idx_donations_user_id ON donations(user_id);
CREATE INDEX idx_donations_date ON donations(donation_date);
CREATE INDEX idx_donations_type ON donations(donation_type);
CREATE INDEX idx_donations_impact ON donations(impact_generated);

CREATE INDEX idx_donation_items_donation_id ON donation_items(donation_id);
CREATE INDEX idx_donation_items_product_id ON donation_items(campaign_product_id);
CREATE INDEX idx_donation_items_status ON donation_items(fulfillment_status);

CREATE INDEX idx_personalization_donation_id ON personalization_options(donation_id);
CREATE INDEX idx_personalization_donation_item_id ON personalization_options(donation_item_id);

CREATE INDEX idx_distribution_batches_campaign_id ON distribution_batches(campaign_id);
CREATE INDEX idx_distribution_batches_status ON distribution_batches(status);
CREATE INDEX idx_distribution_batches_date ON distribution_batches(actual_distribution_date);

CREATE INDEX idx_impact_stories_campaign_id ON impact_stories(campaign_id);
CREATE INDEX idx_impact_stories_published ON impact_stories(is_published);
CREATE INDEX idx_impact_stories_featured ON impact_stories(featured);

CREATE INDEX idx_donation_impact_tracking_donation_id ON donation_impact_tracking(donation_id);

-- Insert default data
-- INSERT INTO user_roles (name) VALUES 
-- ('Admin'),
-- ('Campaign Manager'),
-- ('Distribution Manager'),
-- ('Content Manager'),
-- ('User'),
-- ('Donor');

INSERT INTO campaign_categories (name, description) VALUES 
('Education', 'Educational campaigns and initiatives'),
('Healthcare', 'Medical and healthcare related campaigns'),
('Disaster Relief', 'Emergency and disaster relief efforts'),
('Animal Welfare', 'Animal care and protection campaigns'),
('Environment', 'Environmental conservation campaigns'),
('Community Development', 'Community building and development projects'),
('Festival Celebration', 'Religious and cultural festival celebrations'),
('Food & Nutrition', 'Food security and nutrition programs'),
('Women Empowerment', 'Women empowerment initiatives'),
('Child Welfare', 'Child care and protection campaigns');

INSERT INTO campaign_product_units (name, abbreviation) VALUES 
('Piece', 'pcs'),
('Kilogram', 'kg'),
('Gram', 'g'),
('Liter', 'L'),
('Milliliter', 'mL'),
('Meter', 'm'),
('Centimeter', 'cm'),
('Square Meter', 'sq m'),
('Box', 'box'),
('Packet', 'pkt'),
('Bundle', 'bundle'),
('Set', 'set');

-- Create views for analytics and reporting

-- View: Campaign Analytics
CREATE VIEW campaign_analytics AS
SELECT 
    c.id,
    c.title,
    c.donation_goal,
    c.total_raised,
    c.total_progress_percentage,
    c.total_beneficiary,
    c.total_donors_till_now,
    COUNT(DISTINCT d.id) as actual_donations_count,
    COUNT(DISTINCT CASE WHEN d.donation_type = 'direct' THEN d.id END) as direct_donations_count,
    COUNT(DISTINCT CASE WHEN d.donation_type = 'product_based' THEN d.id END) as product_donations_count,
    COALESCE(SUM(d.donation_amount), 0) as actual_amount_raised,
    COUNT(DISTINCT db.id) as distribution_batches_count,
    COUNT(DISTINCT is_tbl.id) as impact_stories_count
FROM campaigns c
LEFT JOIN donations d ON c.id = d.campaign_id
LEFT JOIN distribution_batches db ON c.id = db.campaign_id
LEFT JOIN impact_stories is_tbl ON c.id = is_tbl.campaign_id
GROUP BY c.id, c.title, c.donation_goal, c.total_raised, c.total_progress_percentage, 
         c.total_beneficiary, c.total_donors_till_now;

-- View: Donor Impact Summary
CREATE VIEW donor_impact_summary AS
SELECT 
    d.id as donation_id,
    d.user_id,
    u.full_name as donor_name,
    d.campaign_id as campaign_id,
    c.title as campaign_title,
    d.donation_amount,
    d.donation_type,
    d.donation_date,
    COUNT(dit.id) as impact_stories_count,
    COALESCE(SUM(dit.people_helped_by_this_donation), 0) as total_people_helped,
    STRING_AGG(DISTINCT is_tbl.title, ', ') as impact_story_titles
FROM donations d
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN campaigns c ON d.campaign_id = c.id
LEFT JOIN donation_impact_tracking dit ON d.id = dit.donation_id
LEFT JOIN impact_stories is_tbl ON dit.impact_story_id = is_tbl.id
GROUP BY d.id, d.user_id, u.full_name, d.campaign_id, c.title, 
         d.donation_amount, d.donation_type, d.donation_date;


ALTER TABLE campaigns 
ADD COLUMN beneficiaries INT NOT NULL DEFAULT 100;





CREATE TABLE volunteer_applications (
    id SERIAL PRIMARY KEY,
    
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(15) NOT NULL,
    age INTEGER NOT NULL CHECK (age >= 16 AND age <= 100),
    
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    
    preferred_program VARCHAR(100) NOT NULL,
    availability TEXT[] NOT NULL,  
    time_commitment VARCHAR(50) NOT NULL,
    
    previous_volunteer_experience BOOLEAN NOT NULL,
    volunteer_experience_details TEXT,
    languages VARCHAR(255),
    
    motivation TEXT NOT NULL CHECK (LENGTH(motivation) >= 50),
    goals TEXT NOT NULL CHECK (LENGTH(goals) >= 30),
    
    emergency_contact_name VARCHAR(100) NOT NULL,
    emergency_contact_phone VARCHAR(15) NOT NULL,
    emergency_contact_relationship VARCHAR(50) NOT NULL,
    
    background_check_consent BOOLEAN NOT NULL DEFAULT false,
    terms_and_conditions_accepted BOOLEAN NOT NULL DEFAULT false,
    newsletter_subscription BOOLEAN DEFAULT false,
    
    application_status VARCHAR(20) DEFAULT 'pending' CHECK (application_status IN ('pending', 'reviewing', 'approved', 'rejected', 'withdrawn')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_volunteer_applications_email ON volunteer_applications(email);
CREATE INDEX idx_volunteer_applications_preferred_program ON volunteer_applications(preferred_program);
CREATE INDEX idx_volunteer_applications_status ON volunteer_applications(application_status);
CREATE INDEX idx_volunteer_applications_created_at ON volunteer_applications(created_at);
CREATE INDEX idx_volunteer_applications_active ON volunteer_applications(is_active);

CREATE UNIQUE INDEX idx_volunteer_applications_email_active ON volunteer_applications(email) 
WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_volunteer_applications_updated_at 
    BEFORE UPDATE ON volunteer_applications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE VIEW active_volunteer_applications AS
SELECT 
    id,
    CONCAT(first_name, ' ', last_name) as full_name,
    email,
    phone,
    age,
    CONCAT(address, ', ', city, ' ', zip_code) as full_address,
    preferred_program,
    array_to_string(availability, ', ') as availability_text,
    time_commitment,
    previous_volunteer_experience,
    volunteer_experience_details,
    array_to_string(skills, ', ') as skills_text,
    languages,
    motivation,
    goals,
    CONCAT(emergency_contact_name, ' (', emergency_contact_relationship, ') - ', emergency_contact_phone) as emergency_contact_info,
    background_check_consent,
    terms_and_conditions_accepted,
    newsletter_subscription,
    application_status,
    created_at,
    updated_at
FROM volunteer_applications 
WHERE is_active = true;


ALTER TABLE volunteer_applications 
ADD COLUMN skills INT[] NOT NULL DEFAULT '{}';
    



CREATE TABLE otp_verifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    otp TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP 
 );

 CREATE INDEX idx_otp_verifications_email ON otp_verifications(email);
CREATE INDEX idx_otp_verifications_expires_at ON otp_verifications(expires_at);

ALTER TABLE users
ADD CONSTRAINT users_mobile_no_key UNIQUE (mobile_no);



ALTER TABLE campaigns
ADD COLUMN  code VARCHAR(50);

 
ALTER TABLE campaigns
 ADD COLUMN  is_featured SMALLINT DEFAULT 0;


ALTER TABLE donation_items
ADD COLUMN donation_date TIMESTAMP WITH TIME ZONE  ;



ALTER TABLE indipendent_products
ADD COLUMN min_tat INT DEFAULT 1,
ADD COLUMN max_tat INT DEFAULT 1 ;



ALTER TABLE campaigns
ADD COLUMN mobile_banner_image  TEXT ;


ALTER TABLE campaigns
ADD COLUMN sequence  INT ;


ALTER TABLE personalization_options
ADD COLUMN insta_id  VARCHAR(100),
ADD COLUMN video_wishes  VARCHAR(100) ;