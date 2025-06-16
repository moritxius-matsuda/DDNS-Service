# DDNS Service for dm1lx.de

This project provides a DDNS (Dynamic DNS) service where hostnames under the `*.dm1lx.de` domain can be dynamically mapped to IP addresses using Redis for storage.

## Features

- Dynamic DNS updates via web interface
- Clerk authentication for secure access
- API endpoint for router updates
- Redis storage for hostname-IP mappings
- Modern web interface with Next.js

## Setup

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create a `.env.local` file in the frontend directory with:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuZG0xbHguZGUk
CLERK_SECRET_KEY=sk_live_5lgucoOVTBC3XMbPkH18AqnmIqKuBNhNGoFT0YwZ40
```

3. Run the development server:
```bash
npm run dev
```

### Router Update Script

The router update script is located at `update_ddns.py`. You can use it to update your DDNS record from your router:

```bash
python update_ddns.py --hostname yourdevice.dm1lx.de --ip YOUR_IP_ADDRESS --api-key YOUR_API_KEY
```

## Usage

1. Sign in to the web interface using your Clerk credentials
2. Navigate to the dashboard
3. Enter your desired hostname (must end with .dm1lx.de) and IP address
4. Click "Update DDNS Record" to save the mapping

## API

The API endpoint for programmatic updates is available at:

`POST /api/update`

Request body:
```json
{
  "hostname": "yourdevice.dm1lx.de",
  "ipAddress": "192.168.1.100"
}
```

## Security

- All updates require authentication
- Hostnames must end with .dm1lx.de
- IP addresses are validated
- Redis connection is secured with credentials
