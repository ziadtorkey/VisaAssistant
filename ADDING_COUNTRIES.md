# Adding Countries and Visa Requirements

This guide shows you how to add new countries and visa requirement combinations to the application.

## Quick Start

The application comes with 3 helper scripts in the `backend/` directory:

1. **listCountries.js** - View all countries in the database
2. **addCountry.js** - Add a new country
3. **addVisaRequirement.js** - Add a visa requirement combination

## Step 1: View Current Countries

```bash
cd backend
node listCountries.js
```

Example output:
```
📋 Countries in database:

  ✅ 4. Egypt (EG)
  ✅ 6. France (FR)
  ✅ 2. Germany (DE)
  ✅ 3. Saudi Arabia (SA)
  ✅ 1. Switzerland (CH)
  ✅ 5. United States (US)

📊 Total: 6 countries
📊 Total visa requirement combinations: 6
```

## Step 2: Add a New Country

**Syntax:**
```bash
node addCountry.js "Country Name" "CODE"
```

**Examples:**
```bash
# Add United Kingdom
node addCountry.js "United Kingdom" "GB"

# Add Canada
node addCountry.js "Canada" "CA"

# Add Australia
node addCountry.js "Australia" "AU"

# Add India
node addCountry.js "India" "IN"

# Add Japan
node addCountry.js "Japan" "JP"
```

**Important Notes:**
- Country codes should be 2-letter ISO country codes (e.g., US, GB, FR, DE)
- Country names should be in English
- If the country already exists, you'll get an error message

## Step 3: Add Visa Requirement Combinations

After adding countries, you need to create visa requirement combinations that users can query.

**Syntax:**
```bash
node addVisaRequirement.js PASSPORT_CODE RESIDENCE_CODE DESTINATION_CODE
```

**Examples:**
```bash
# US citizen living in US, traveling to France
node addVisaRequirement.js US US FR

# Indian citizen living in India, traveling to UK
node addVisaRequirement.js IN IN GB

# Swiss citizen living in Germany, traveling to Canada
node addVisaRequirement.js CH DE CA

# Egyptian citizen living in Saudi Arabia, traveling to US
node addVisaRequirement.js EG SA US
```

**What this does:**
- Creates a new visa requirement entry in the database
- Sets the status to "unavailable" (no data yet)
- Shows you the ID and how to scrape it

**Example output:**
```
✅ Added visa requirement combination with ID: 6
   United States (US) -> France (FR)
   Residence: United States (US)

💡 To scrape this combination, use:
   curl -X POST http://localhost:5000/api/admin/scrape/6 -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 4: Scrape Visa Data (Using OpenAI)

Once you've added a combination, you need to scrape the visa requirements data.

### Option A: Using Admin Panel (Easiest)

1. Visit http://localhost:5175/admin
2. Login with `admin` / `admin123`
3. Go to "Data Manager"
4. Find your new combination
5. Click "Scrape" button

### Option B: Using API

```bash
# 1. Login to get token
curl -X POST http://localhost:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. Copy the token from response
# 3. Trigger scraping (replace ID and TOKEN)
curl -X POST http://localhost:5000/api/admin/scrape/6 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Step 5: View Results

### In the Frontend
1. Visit http://localhost:5175
2. Select:
   - **Passport Country**: Where your passport is from
   - **Residence Country**: Where you currently live
   - **Destination Country**: Where you want to travel
3. Click "Get Visa Requirements"

### Using API
```bash
curl "http://localhost:5000/api/visa-requirements?passport=US&residence=US&destination=FR"
```

## Complete Example: Adding Multiple Countries

```bash
cd backend

# Add countries
node addCountry.js "United Kingdom" "GB"
node addCountry.js "Canada" "CA"
node addCountry.js "India" "IN"
node addCountry.js "Australia" "AU"

# Add visa requirement combinations
node addVisaRequirement.js US US GB    # US -> UK
node addVisaRequirement.js GB GB US    # UK -> US
node addVisaRequirement.js IN IN GB    # India -> UK
node addVisaRequirement.js CA CA AU    # Canada -> Australia

# List all countries to verify
node listCountries.js
```

## How AI Scraping Works

When you trigger scraping for a combination:

1. **Check for Custom Scraper**: The system first checks if there's a country-specific scraper (e.g., `switzerlandScraper.js`)

2. **Fallback to OpenAI**: If no custom scraper exists, it automatically uses OpenAI GPT-3.5-turbo to generate comprehensive visa requirements

3. **Data Saved**: The scraped data is saved to the database with:
   - Visa status (required/not_required/evisa/visa_on_arrival)
   - Required documents (8-12 items)
   - Application steps (6-10 steps)
   - Embassy contact information
   - Fees and processing times
   - Application URLs

## Adding Custom Scrapers (Advanced)

If you want to scrape from a specific embassy website instead of using AI:

1. Create a new scraper file in `backend/src/scrapers/`:
   ```javascript
   // backend/src/scrapers/franceScraper.js
   const BaseScraper = require('./baseScraper');

   class FranceScraper extends BaseScraper {
     async scrape(passportCountry, residenceCountry, destinationCountry) {
       // Your custom scraping logic here
       // See switzerlandScraper.js for DEMO mode example
     }
   }

   module.exports = FranceScraper;
   ```

2. Register it in `backend/src/scrapers/scrapingManager.js`:
   ```javascript
   const FranceScraper = require('./franceScraper');

   const scraperMap = {
     'CH': SwitzerlandScraper,
     'DE': GermanyScraper,
     'FR': FranceScraper,  // Add this line
   };
   ```

## Troubleshooting

### "Country already exists"
- The country is already in the database
- Use `node listCountries.js` to see all countries

### "Combination already exists"
- This passport/residence/destination combination is already added
- You can find it in the admin panel and scrape it again if needed

### "Country not found"
- Make sure you've added all three countries first using `addCountry.js`
- Double-check the country codes (must be exact matches)

### Scraping fails
- Check your OpenAI API key in `backend/.env`
- Check the scraping logs in the admin panel
- Make sure `USE_AI_SCRAPER=true` in `.env`

## Database Schema Reference

### Countries Table
```sql
CREATE TABLE countries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Visa Requirements Table
```sql
CREATE TABLE visa_requirements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  passport_country_id INTEGER,
  residence_country_id INTEGER,
  destination_country_id INTEGER,
  visa_status TEXT,
  required_documents TEXT,
  application_steps TEXT,
  application_location TEXT,
  contact_info TEXT,
  application_form_url TEXT,
  checklist_url TEXT,
  visa_fee TEXT,
  processing_time TEXT,
  booking_link TEXT,
  source_urls TEXT,
  last_updated DATETIME,
  data_status TEXT,
  FOREIGN KEY (passport_country_id) REFERENCES countries(id),
  FOREIGN KEY (residence_country_id) REFERENCES countries(id),
  FOREIGN KEY (destination_country_id) REFERENCES countries(id)
);
```

## FAQ

**Q: How many countries can I add?**
A: Unlimited! The system is designed to scale.

**Q: Do I need to add all combinations manually?**
A: Yes, currently you need to add each combination you want to support. This gives you control over what data is available.

**Q: Can I bulk import countries?**
A: Yes, you can create a simple script to loop through a list. Example:
```bash
countries=("United Kingdom:GB" "Canada:CA" "India:IN" "Japan:JP")
for country in "${countries[@]}"; do
  IFS=':' read -r name code <<< "$country"
  node addCountry.js "$name" "$code"
done
```

**Q: How accurate is the AI-generated visa data?**
A: OpenAI GPT-3.5-turbo provides generally accurate visa information, but you should verify critical details with official embassy sources. The AI is best for getting a quick overview of requirements.

**Q: Can I update the data for a combination?**
A: Yes! Just trigger scraping again for the same combination ID. It will update the existing data.

**Q: How do I remove a country or combination?**
A: You can manually update the database to set `is_active = 0` for countries, or delete visa requirement entries. We can create delete scripts if needed.
