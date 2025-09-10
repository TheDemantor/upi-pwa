# API Configuration

This directory contains configuration files for managing API endpoints and environments.

## Files

### `api.js`
Main API configuration file that defines:
- Base URL for all API calls
- API endpoints
- Request timeout settings
- Default headers

### `environment.js`
Environment management file that defines different environments:
- **Development**: `http://localhost:5000`
- **Staging**: `https://upi-pwa-staging.onrender.com`
- **Production**: `https://upi-pwa.onrender.com`
- **Custom**: `http://192.168.1.15:5000`

## How to Change API URL

### Method 1: Change Environment (Recommended)
Edit `environment.js` and change the `CURRENT_ENV` variable:

```javascript
const CURRENT_ENV = 'DEVELOPMENT'; // Change this to switch environments
```

### Method 2: Use Environment Variables
Create a `.env.local` file in the client root directory:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Method 3: Direct Configuration
Edit `api.js` and change the `BASE_URL`:

```javascript
const API_CONFIG = {
  BASE_URL: 'http://localhost:5000', // Change this directly
  // ... rest of config
};
```

## Available Environments

| Environment | URL | Description |
|-------------|-----|-------------|
| Development | `http://localhost:5000` | Local development server |
| Staging | `https://upi-pwa-staging.onrender.com` | Staging environment |
| Production | `https://upi-pwa.onrender.com` | Live production environment |
| Custom | `http://192.168.1.15:5000` | Custom IP for local network testing |

## Usage in Components

```javascript
import { api } from '../utils/apiClient';

// Add a transaction
api.addTransaction(transactionData)
  .then(response => console.log(response.data))
  .catch(error => console.error(error));

// Get user transactions
api.getUserTransactions()
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

## API Endpoints

- `POST /api/user/transaction` - Add a new transaction
- `GET /api/user/transactions` - Get all user transactions
- `GET /api/user/pockets` - Get user pockets
- `GET /api` - Health check

## Debugging

The API client includes automatic logging:
- All requests are logged to console
- All responses are logged to console
- Errors are logged with detailed information

Check the browser console to see API call logs.
