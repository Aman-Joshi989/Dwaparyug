// config/puppeteer.js
const isDev = process.env.NODE_ENV === 'development'
const isVercel = process.env.VERCEL === '1'
const isHeroku = process.env.DYNO !== undefined

const getPuppeteerConfig = () => {
  if (isVercel) {
    // Vercel configuration
    return {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      headless: true
    }
  }
  
  if (isHeroku) {
    // Heroku configuration
    return {
      executablePath: '/app/.apt/usr/bin/google-chrome-stable',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      headless: true
    }
  }
  
  // Default/development configuration
  return {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
}

module.exports = { getPuppeteerConfig }