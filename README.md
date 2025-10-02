# Visa Requirements Web Application - MVP

A web application that helps users find visa requirements, application procedures, and necessary documentation for traveling between countries.

## Features

### Public Interface
- Select passport country, residence country, and destination
- View detailed visa requirements including:
  - Visa status (required/not required/visa on arrival/eVisa)
  - Required documents checklist
  - Step-by-step application process
  - Embassy/consulate contact information
  - Application fees and processing times
  - Useful links (application forms, booking)
- Print-friendly checklist
- Data freshness indicators

### Admin Panel
- Secure JWT-based authentication
- Dashboard with statistics and recent activity
- Manage visa requirement data
- Manual scraping triggers for country combinations
- **AI-powered scraping** (optional) using Google Gemini API
- View scraping logs (success/failure)
- Configure settings (data expiry, scraping parameters)

## Technology Stack

- **Frontend**: React + Vite + Tailwind CSS + React Router
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Scraping**: Axios + Cheerio
- **Authentication**: JWT

## Project Structure

```
visaassistant/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth & error handling
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── scrapers/        # Web scraping logic
│   │   ├── utils/           # Utilities
│   │   └── server.js        # Entry point
│   ├── database.sqlite
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/       # Admin panel components
│   │   │   ├── public/      # Public interface components
│   │   │   ├── Login.jsx
│   │   │   └── Layout.jsx
│   │   ├── services/
│   │   │   └── api.js       # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies (already done):
```bash
npm install
```

3. Initialize database:
```bash
npm run init-db
```

4. Start the server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Admin Credentials

- **Username**: admin
- **Password**: admin123

⚠️ **Important**: Change these credentials in production!

## Initial Countries

The application comes pre-seeded with 4 countries:
- Switzerland (CH)
- Germany (DE)
- Saudi Arabia (SA)
- Egypt (EG)

## API Endpoints

### Public APIs
- `GET /api/countries` - Get list of active countries
- `GET /api/visa-requirements?passport=XX&residence=XX&destination=XX` - Get visa requirements
- `GET /api/health` - Health check

### Admin APIs (Authentication Required)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/visa-requirements` - Get all visa requirements
- `POST /api/admin/scrape/:id` - Trigger scraping for specific requirement
- `POST /api/admin/scrape-all` - Bulk scraping
- `GET /api/admin/logs` - Get scraping logs
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

## Usage

### Public Users
1. Visit `http://localhost:5173`
2. Select your passport country, residence country, and destination
3. Click "Get Visa Requirements"
4. View detailed information and print if needed

### Administrators
1. Visit `http://localhost:5173/admin`
2. Login with admin credentials
3. Access dashboard, manage data, view logs, and configure settings

## Scraping System

The scraping system uses a flexible architecture:
- **BaseScraper**: Abstract class with common scraping utilities
- **Country-specific scrapers**: Implement scraping logic for each destination country
- **ScrapingManager**: Coordinates scraping operations

### Adding New Scrapers

1. Create a new scraper in `backend/src/scrapers/` (e.g., `franceScraper.js`)
2. Extend `BaseScraper` and implement the `scrape()` method
3. Register the scraper in `scrapingManager.js`

## Configuration

### Environment Variables (backend/.env)
- `PORT` - Server port (default: 5000)
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)
- `DATA_EXPIRY_DAYS` - Days before data is considered stale (default: 14)

### Admin Settings (configurable via UI)
- Data expiry period
- Scraping retry attempts
- Scraping delay between requests

## Development Notes

- The scrapers currently return placeholder data
- Actual implementation requires tailoring to specific embassy/government websites
- Always respect robots.txt and terms of service
- Use appropriate delays between scraping requests
- Store source URLs for transparency

## Adding Countries and Visa Requirements

**See [ADDING_COUNTRIES.md](ADDING_COUNTRIES.md) for detailed instructions.**

Quick commands to add new countries and combinations:

```bash
cd backend

# List current countries
node listCountries.js

# Add a new country
node addCountry.js "Country Name" "CODE"

# Add a visa requirement combination
node addVisaRequirement.js PASSPORT_CODE RESIDENCE_CODE DESTINATION_CODE

# Example: Add UK and create US -> UK combination
node addCountry.js "United Kingdom" "GB"
node addVisaRequirement.js US US GB
```

The application will automatically use **OpenAI GPT-3.5-turbo** to scrape visa requirements for any country combination without a custom scraper.

## Next Steps

1. Add more countries using the helper scripts
2. Implement custom scrapers for specific embassies
3. Implement automated scraping schedules
4. Add user authentication for saved searches
5. Enhance error handling and logging
6. Add tests

## License

ISC