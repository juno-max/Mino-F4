# AgentQL Integration Guide

## ✅ Setup Complete

Your MINO application is now fully integrated with AgentQL for automated web scraping!

### What's Been Configured

1. **AgentQL SDK**: Installed `agentql` and `playwright` packages
2. **API Key**: Set in `.env.local` (secured in .gitignore)
3. **Browser**: Chromium installed for headless automation
4. **Backend**: Jobs and sessions system ready
5. **Frontend**: Real-time session monitoring with polling

## 🚀 How to Use

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Create a Project with Instructions

Example project instruction:
```
Extract the price for {service} at {location}
```

The placeholders `{service}` and `{location}` will be replaced with values from your CSV columns.

### 3. Upload CSV with Data

Your CSV should have:
- **URL column**: The website to scrape (mark as "URL" in schema)
- **Data columns**: Fields to extract (e.g., "price", "service_name")
- **Ground truth columns** (optional): Expected values for accuracy testing (prefix with "gt_" or suffix with "_gt")

Example CSV:
```csv
website,service,location,gt_price
https://example-salon.com,Haircut,New York,45
https://another-salon.com,Manicure,Los Angeles,35
```

### 4. Run Test Execution

When executing a batch, you can choose:

**Mock Mode** (for testing the flow):
```json
{
  "executionType": "test",
  "sampleSize": 3,
  "useAgentQL": false
}
```

**AgentQL Mode** (real web scraping):
```json
{
  "executionType": "test",
  "sampleSize": 3,
  "useAgentQL": true
}
```

### 5. Monitor Sessions

- After execution starts, navigate to `/sessions/[sessionId]`
- The page auto-updates every 2 seconds during execution
- View screenshots captured at each step
- See extracted data in real-time
- Check historic sessions for previous attempts

## 📊 How It Works

### Execution Flow

1. **Job Creation**: Each CSV row creates a persistent job
2. **Session Start**: A new session is created for each execution attempt
3. **Browser Launch**: Chromium opens in headless mode
4. **Navigation**: AgentQL navigates to the target URL
5. **Data Extraction**: Uses natural language queries to find and extract data
6. **Screenshot Capture**: Takes screenshots at key steps
7. **Accuracy Check**: Compares against ground truth (if provided)
8. **Status Update**: Updates job and session status in database

### AgentQL Query Format

The system automatically builds queries based on your column schema:

```javascript
// For columns: price, service_name, availability
const query = `
{
  price(number)
  service_name
  availability
}
`
```

AgentQL uses AI to understand the semantic meaning and locate the data on the page.

## 🔧 Customizing Data Extraction

### Edit the AgentQL Executor

File: `lib/agentql-executor.ts`

#### Add Custom Query Logic

```typescript
// Add semantic descriptions to help AgentQL
const queryFields = dataColumns.map(col => {
  if (col.name === 'price') {
    return 'price(number)'  // Extract as number
  }
  if (col.name === 'phone') {
    return 'phone_number'  // Alternative name
  }
  return col.name
}).join('\n  ')
```

#### Add Wait Conditions

```typescript
// Wait for specific content before extraction
await page.waitForTimeout(2000)  // Wait 2 seconds
// or
await page.waitForSelector('selector')  // Wait for element
```

#### Handle Pagination or Modals

```typescript
// Before data extraction, handle modals
try {
  const closeButton = await page.queryElements(`{ close_button }`)
  await closeButton.close_button.click()
} catch (e) {
  // No modal present
}
```

## 🐛 Troubleshooting

### AgentQL API Key Not Working
- Check `.env.local` has the correct key
- Restart the dev server after updating `.env.local`
- Verify key at https://dev.agentql.com/

### Browser Not Launching
```bash
# Reinstall Playwright browsers
npx playwright install chromium
```

### TypeScript Errors
```bash
# Regenerate types
npm run db:generate
```

### Data Not Extracting
- Check console logs for AgentQL query and result
- Verify the page has the data you're looking for
- Try simplifying column names (e.g., "price" instead of "service_price_usd")
- Use browser dev tools to inspect the target website

### Session Not Updating
- Check that polling is working (Network tab in browser dev tools)
- Verify API endpoints return data: `/api/sessions/[id]`
- Look for errors in terminal logs

## 📝 Example Use Cases

### Use Case 1: Restaurant Menu Pricing
**CSV Columns**: `url`, `dish_name`, `gt_price`
**Project Instructions**: "Extract the price for {dish_name}"
**AgentQL extracts**: Price from menu pages

### Use Case 2: Product Availability
**CSV Columns**: `url`, `product_name`, `gt_in_stock`
**Project Instructions**: "Check if {product_name} is in stock"
**AgentQL extracts**: Availability status

### Use Case 3: Service Hours
**CSV Columns**: `url`, `location`, `gt_hours`
**Project Instructions**: "Find business hours for the {location} location"
**AgentQL extracts**: Operating hours

## 🔐 Security Notes

- ✅ `.env.local` is in `.gitignore` (API key is safe)
- ✅ Never commit `.env.local` to version control
- ✅ Use environment variables for production deployment
- ✅ Rotate API keys if exposed

## 📚 Resources

- [AgentQL Documentation](https://docs.agentql.com)
- [AgentQL JavaScript SDK](https://docs.agentql.com/javascript-sdk)
- [Playwright Documentation](https://playwright.dev)

## 🎯 Next Steps

1. **Test with mock data first** (`useAgentQL: false`)
2. **Try AgentQL on simple pages** (clear, well-structured sites)
3. **Refine project instructions** for better accuracy
4. **Add more columns** as you understand the data structure
5. **Scale up sample size** once accuracy is good

Happy scraping! 🎉
