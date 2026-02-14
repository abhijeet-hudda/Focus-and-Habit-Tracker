# Environment Variables Setup

This document explains the environment variables used in the Focus & Habit Tracker frontend.

## Environment Files

- `.env` - Local development configuration (ignored by git)
- `.env.example` - Template for environment variables (checked into git)
- `.env.production` - Production configuration (ignored by git)

## Available Variables

### VITE_API_URL
**Type:** `string`  
**Default:** `http://localhost:8000/api/v2`  
**Description:** Base URL for the backend API. Update this to point to your backend server.

**Development:**
```
VITE_API_URL=http://localhost:8000/api/v2
```

**Production:**
```
VITE_API_URL=https://api.yourdomain.com/api/v2
```

### VITE_APP_NAME
**Type:** `string`  
**Default:** `Focus & Habit Tracker`  
**Description:** Application display name (can be used in UI)

### VITE_API_TIMEOUT
**Type:** `number`  
**Default:** `30000`  
**Description:** API request timeout in milliseconds (30 seconds)

### VITE_DEBUG
**Type:** `boolean`  
**Default:** `false`  
**Description:** Enable debug logging. Set to `true` for development, `false` for production.

## Setup Instructions

1. **Copy the template file:**
   ```bash
   cp .env.example .env
   ```

2. **Update `.env` with your configuration:**
   ```
   VITE_API_URL=http://localhost:8000/api/v2
   VITE_APP_NAME=Focus & Habit Tracker
   VITE_API_TIMEOUT=30000
   VITE_DEBUG=true
   ```

3. **For production, update `.env.production`:**
   ```
   VITE_API_URL=https://api.yourdomain.com/api/v2
   VITE_APP_NAME=Focus & Habit Tracker
   VITE_API_TIMEOUT=30000
   VITE_DEBUG=false
   ```

## How Vite Uses Environment Variables

- **`.env`** - Loaded in all environments
- **`.env.local`** - Loaded in all environments (git ignored)
- **`.env.[mode]`** - Loaded only in specified mode (e.g., `.env.production`)
- **`.env.[mode].local`** - Loaded only in specified mode (git ignored)

## Accessing Variables in Code

```javascript
// In your component or config file
const apiUrl = import.meta.env.VITE_API_URL;
const appName = import.meta.env.VITE_APP_NAME;

// Note: Only variables prefixed with VITE_ are exposed to client-side code
```

## Important Notes

- ✅ `.env.example` should be committed to git
- ❌ `.env` and `.env.*.local` are git ignored and NOT committed
- ⚠️ Never commit sensitive information (API keys, tokens, etc.)
- 🔒 All exposed variables can be seen in the browser, so don't put secrets here
