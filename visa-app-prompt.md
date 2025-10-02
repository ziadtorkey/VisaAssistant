# Visa Requirements Web Application - MVP Build Instructions

## Project Overview
Build a web application that helps users find visa requirements, application procedures, and necessary documentation for traveling between countries. The system uses web scraping to gather current information and caches it in a database.

## Technology Stack
- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Scraping**: Puppeteer/Playwright + Cheerio
- **Authentication**: JWT or session-based for admin panel

## Phase 1 Scope

### Initial Countries (Start Small)
- **Switzerland**
- **Germany** 
- **Saudi Arabia**
- **Egypt**

### Visa Type Focus
- Tourist visa (short stay) only

### Core Features

#### 1. Public User Interface
- **Single Page Application** with clean, modern design
- User selects:
  - Passport country (dropdown)
  - Country of residence (dropdown)
  - Destination country (dropdown)
- "Get Visa Requirements" button
- Results display section showing:
  - Visa requirement status (visa required/not required/visa on arrival)
  - Detailed step-by-step guide
  - Required documents checklist
  - Where to apply (embassy vs third-party like VFS Global)
  - Contact information (address, phone, website links)
  - Application form links
  - Visa fees
  - Processing time estimates
  - Appointment booking links (if available)
- "Print Checklist" button to generate printer-friendly version
- Data freshness indicator ("Last updated: X days ago")
- Fallback message if data unavailable

#### 2. Admin Panel (`/admin` route)
- **Login page** with authentication
- **Dashboard** showing:
  - Total country combinations in database
  - Data coverage statistics (how many combinations have data)
  - Data freshness (oldest/newest records)
  - Recent scraping logs
  - Failed scraping attempts

- **Countries Management**:
  - View list of active countries
  - Add/remove countries from the active list
  
- **Data Management**:
  - View all cached visa requirement combinations
  - See last update timestamp for each combination
  - Manually trigger re-scraping for specific combinations
  - Bulk re-scrape all combinations
  - Delete stale data
  
- **Settings**:
  - Configure data expiry period (default: 14 days)
  - Set scraping retry attempts
  - Configure scraping delays/timeouts

- **Scraping Logs**:
  - View successful scraping events
  - View failed scraping attempts with error messages
  - Export logs

#### 3. Data Scraping System

**Scraping Strategy:**
- Pre-populate data through admin panel (not real-time per user request)
- Admin manually triggers scraping for country combinations
- Scraping sources should target official government websites:
  - Embassy websites
  - Immigration/foreign affairs ministry sites
  - VFS Global and similar visa application centers
  - IATA Travel Centre for verification

**Scraping Requirements:**
- Extract from official sources:
  - Visa requirement (required/not required/visa on arrival/eVisa)
  - Required documents list
  - Application process steps
  - Where to apply (embassy address, VFS center locations)
  - Contact details (phone, email, website)
  - Application form URLs
  - Checklist URLs
  - Visa fees (with currency)
  - Processing times
  - Appointment booking links
  
- **Error Handling**:
  - Log failed scraping attempts with:
    - Timestamp
    - Country combination
    - Error message/reason
    - URL attempted
  - Return graceful error to admin panel
  - Mark combination as "data unavailable"

- **Data Storage**:
  - Store scraped data with metadata:
    - Source URLs
    - Scraping timestamp
    - Data expiry status
    - Scraping success/failure status

#### 4. Database Schema

**Tables needed:**

```sql
-- Countries table
countries (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL, -- ISO 2-letter code
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Visa requirements table
visa_requirements (
  id INTEGER PRIMARY KEY,
  passport_country_id INTEGER,
  residence_country_id INTEGER,
  destination_country_id INTEGER,
  visa_status TEXT, -- required/not_required/visa_on_arrival/evisa
  required_documents TEXT, -- JSON array
  application_steps TEXT, -- JSON array or long text
  application_location TEXT, -- embassy/vfs/etc
  contact_info TEXT, -- JSON with address, phone, email, website
  application_form_url TEXT,
  checklist_url TEXT,
  visa_fee TEXT,
  processing_time TEXT,
  booking_link TEXT,
  source_urls TEXT, -- JSON array of scraped URLs
  last_updated DATETIME,
  data_status TEXT, -- fresh/stale/unavailable
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (passport_country_id) REFERENCES countries(id),
  FOREIGN KEY (residence_country_id) REFERENCES countries(id),
  FOREIGN KEY (destination_country_id) REFERENCES countries(id),
  UNIQUE(passport_country_id, residence_country_id, destination_country_id)
)

-- Scraping logs table
scraping_logs (
  id INTEGER PRIMARY KEY,
  visa_requirement_id INTEGER,
  status TEXT, -- success/failure
  error_message TEXT,
  scraped_urls TEXT, -- JSON array
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visa_requirement_id) REFERENCES visa_requirements(id)
)

-- Admin users table
admin_users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)

-- Settings table
settings (
  id INTEGER PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### 5. API Endpoints

**Public APIs:**
- `GET /api/countries` - Get list of active countries
- `GET /api/visa-requirements?passport=XX&residence=XX&destination=XX` - Get visa requirements
- `GET /api/health` - Health check

**Admin APIs (Authentication Required):**
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/countries` - Get all countries
- `POST /api/admin/countries` - Add new country
- `DELETE /api/admin/countries/:id` - Remove country
- `GET /api/admin/visa-requirements` - Get all cached combinations
- `POST /api/admin/scrape/:id` - Trigger scraping for specific combination
- `POST /api/admin/scrape-all` - Trigger bulk scraping
- `DELETE /api/admin/visa-requirements/:id` - Delete cached data
- `GET /api/admin/logs` - Get scraping logs
- `GET /api/admin/settings` - Get settings
- `PUT /api/admin/settings` - Update settings

#### 6. Key Implementation Details

**Data Freshness Logic:**
- When user requests visa requirements:
  - Check if data exists in database
  - Check if `last_updated` is within expiry period (configurable, default 14 days)
  - If fresh: return data
  - If stale: return data with warning message "Data may be outdated"
  - If unavailable: show fallback message with link to official sources

**Scraping Best Practices:**
- Use respectful delays between requests (2-3 seconds)
- Set proper User-Agent headers
- Handle timeouts gracefully
- Retry failed requests (configurable, default 3 attempts)
- Cache successful responses
- Log all scraping activities

**Security:**
- Use bcrypt for password hashing
- Implement CSRF protection
- Rate limiting on API endpoints
- Sanitize all user inputs
- Use prepared statements for SQL queries

**UI/UX Requirements:**
- Mobile-responsive design
- Loading states during data fetch
- Clear error messages
- Accessible (ARIA labels, keyboard navigation)
- Print-friendly checklist format
- Professional, clean interface using Tailwind CSS

## Project Structure

```
visa-requirements-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── authController.js
│   │   │   └── visaController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── Country.js
│   │   │   ├── VisaRequirement.js
│   │   │   ├── ScrapingLog.js
│   │   │   └── AdminUser.js
│   │   ├── routes/
│   │   │   ├── admin.js
│   │   │   ├── auth.js
│   │   │   └── visa.js
│   │   ├── scrapers/
│   │   │   ├── baseScraper.js
│   │   │   ├── switzerlandScraper.js
│   │   │   ├── germanyScraper.js
│   │   │   └── scrapingManager.js
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   └── validators.js
│   │   └── server.js
│   ├── database.sqlite
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── CountriesManager.jsx
│   │   │   │   ├── DataManager.jsx
│   │   │   │   ├── Settings.jsx
│   │   │   │   └── ScrapingLogs.jsx
│   │   │   ├── public/
│   │   │   │   ├── CountrySelector.jsx
│   │   │   │   ├── VisaResults.jsx
│   │   │   │   └── PrintableChecklist.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Layout.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

## Initial Setup Instructions

1. **Initialize Project:**
   - Create project directory structure
   - Initialize npm in both backend and frontend folders
   - Install dependencies

2. **Backend Dependencies:**
   ```bash
   express, sqlite3, bcryptjs, jsonwebtoken, cors, dotenv, 
   puppeteer, cheerio, axios, express-rate-limit, helmet
   ```

3. **Frontend Dependencies:**
   ```bash
   react, react-dom, react-router-dom, axios, tailwindcss
   ```

4. **Database Setup:**
   - Create SQLite database
   - Run migration scripts to create tables
   - Seed initial countries (Switzerland, Germany, Saudi Arabia, Egypt)
   - Create default admin user (username: admin, password should be prompted during setup)

5. **Environment Variables:**
   ```
   PORT=5000
   JWT_SECRET=<generate-secure-secret>
   NODE_ENV=development
   DATA_EXPIRY_DAYS=14
   ```

## Development Priorities

**Phase 1 - MVP (Current):**
1. Set up project structure
2. Implement database and models
3. Build admin authentication
4. Create basic admin panel UI
5. Implement scraping system for one country pair (test with Switzerland ↔ Egypt)
6. Build public user interface
7. Test and refine

**Future Enhancements (Post-MVP):**
- Add more countries
- Multiple visa types (business, student, etc.)
- User accounts and saved searches
- Email notifications
- Comparison feature
- API rate limiting tiers
- Advanced analytics
- Mobile app
- Multi-language support

## Testing Requirements

- Test scraping with actual embassy websites
- Test data freshness logic
- Test admin panel CRUD operations
- Test print functionality
- Test error handling and fallbacks
- Test authentication and authorization
- Cross-browser testing
- Mobile responsiveness testing

## Notes

- Start with manual testing; automated tests can be added later
- Focus on Switzerland and Egypt combination first as proof of concept
- Scraping patterns will differ per country - build flexible scraper architecture
- Keep scraping respectful and legal (check robots.txt, terms of service)
- Consider adding source attribution in the results
- Store raw HTML responses for debugging scraping issues
- Add monitoring for scraping failures

## Success Criteria for MVP

✅ Admin can log in securely
✅ Admin can view all country combinations
✅ Admin can manually trigger scraping for a combination
✅ Scraping successfully extracts visa requirements from at least one country combination
✅ Public users can select countries and view visa requirements
✅ Data freshness is tracked and displayed
✅ Users can print a checklist
✅ Failed scraping attempts are logged
✅ Admin can configure data expiry period
✅ Application runs locally without issues

---

**Ready to build!** Start with the backend structure and database setup, then move to the scraping system, followed by the admin panel, and finally the public interface.