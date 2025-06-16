# dm1lx.de DDNS API Dokumentation

## Basis URL

```
http://3.72.176.165:3000
```

## Authentifizierung

Alle API-Endpoints (außer DNS-Resolution) benötigen einen Bearer Token:

```http
Authorization: Bearer YOUR_API_TOKEN
```

API-Tokens können im Web-Dashboard generiert werden.

## Rate Limiting

- **Limit**: 100 Requests pro 15 Minuten pro IP
- **Headers**: `Retry-After` bei Überschreitung

## Endpoints

### 🔍 Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600
}
```

---

### 🔄 IP Update (für Router/Scripts)

Aktualisiert die IP-Adresse für einen Hostname.

```http
POST /update
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "hostname": "myhome",
  "ip": "192.168.1.100"
}
```

**Response (200):**
```json
{
  "success": true,
  "hostname": "myhome",
  "ip": "192.168.1.100",
  "lastUpdated": "2024-01-01T12:00:00.000Z"
}
```

**Fehler:**
- `400`: Validation failed
- `401`: Unauthorized
- `403`: Hostname gehört nicht zum User
- `404`: Hostname nicht gefunden

---

### 🌐 DNS Resolution

Löst einen Hostname zu seiner IP-Adresse auf.

```http
GET /{hostname}
```

**Beispiele:**
```http
GET /myhome
GET /myhome.dm1lx.de
```

**Response (200):**
```json
{
  "hostname": "myhome",
  "ip": "192.168.1.100",
  "ttl": 300,
  "lastUpdated": "2024-01-01T12:00:00.000Z"
}
```

**Fehler:**
- `404`: Hostname nicht gefunden

---

### 📋 Hostname Management

#### Liste aller Hostnames

```http
GET /api/hostnames
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
[
  {
    "hostname": "myhome",
    "ip": "192.168.1.100",
    "ttl": 300,
    "userId": "user_123",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "lastUpdated": "2024-01-01T12:00:00.000Z",
    "updatedBy": "api"
  }
]
```

#### Neuen Hostname erstellen

```http
POST /api/hostnames
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "hostname": "myhome",
  "ip": "192.168.1.100",
  "ttl": 300
}
```

**Validation:**
- `hostname`: 1-63 Zeichen, nur Buchstaben, Zahlen, Bindestriche
- `ip`: Gültige IPv4-Adresse
- `ttl`: 60-86400 Sekunden (optional, default: 300)

**Response (201):**
```json
{
  "hostname": "myhome",
  "ip": "192.168.1.100",
  "ttl": 300,
  "userId": "user_123",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "lastUpdated": "2024-01-01T12:00:00.000Z",
  "updatedBy": "dashboard"
}
```

**Fehler:**
- `400`: Validation failed / Maximum limit reached (2)
- `409`: Hostname bereits vorhanden

#### Hostname aktualisieren

```http
PUT /api/hostnames/{hostname}
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "ip": "192.168.1.101",
  "ttl": 600
}
```

**Response (200):**
```json
{
  "hostname": "myhome",
  "ip": "192.168.1.101",
  "ttl": 600,
  "userId": "user_123",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "lastUpdated": "2024-01-01T12:30:00.000Z",
  "updatedBy": "dashboard"
}
```

#### Hostname löschen

```http
DELETE /api/hostnames/{hostname}
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Hostname deleted"
}
```

---

### 📊 Logs

#### Hostname Logs abrufen

```http
GET /api/hostnames/{hostname}/logs
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
[
  {
    "hostname": "myhome",
    "oldIp": "192.168.1.100",
    "newIp": "192.168.1.101",
    "timestamp": "2024-01-01T12:30:00.000Z",
    "updatedBy": "api",
    "userAgent": "dm1lx-ddns-updater/1.0"
  },
  {
    "hostname": "myhome",
    "action": "created",
    "ip": "192.168.1.100",
    "timestamp": "2024-01-01T10:00:00.000Z",
    "updatedBy": "dashboard"
  }
]
```

---

### 🔑 Token Management

#### API Token erstellen

```http
POST /api/tokens
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "user_123",
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresIn": "1 year"
}
```

#### API Token widerrufen

```http
DELETE /api/tokens/{tokenId}
Authorization: Bearer YOUR_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token revoked"
}
```

---

## Fehler-Codes

| Code | Bedeutung |
|------|-----------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request - Validation Error |
| 401 | Unauthorized - Invalid/Missing Token |
| 403 | Forbidden - Access Denied |
| 404 | Not Found |
| 409 | Conflict - Resource Already Exists |
| 429 | Too Many Requests - Rate Limited |
| 500 | Internal Server Error |

## Beispiel-Requests

### cURL Beispiele

```bash
# IP aktualisieren
curl -X POST http://3.72.176.165:3000/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"hostname":"myhome","ip":"192.168.1.100"}'

# DNS Resolution
curl http://3.72.176.165:3000/myhome

# Hostnames auflisten
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://3.72.176.165:3000/api/hostnames

# Neuen Hostname erstellen
curl -X POST http://3.72.176.165:3000/api/hostnames \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"hostname":"test","ip":"1.2.3.4","ttl":300}'
```

### Python Beispiele

```python
import requests

# Konfiguration
API_URL = "http://3.72.176.165:3000"
TOKEN = "your_api_token_here"
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# IP aktualisieren
response = requests.post(
    f"{API_URL}/update",
    json={"hostname": "myhome", "ip": "192.168.1.100"},
    headers=HEADERS
)
print(response.json())

# Hostnames abrufen
response = requests.get(f"{API_URL}/api/hostnames", headers=HEADERS)
hostnames = response.json()
print(hostnames)
```

### JavaScript Beispiele

```javascript
const API_URL = 'http://3.72.176.165:3000';
const TOKEN = 'your_api_token_here';

// IP aktualisieren
const updateIP = async (hostname, ip) => {
  const response = await fetch(`${API_URL}/update`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ hostname, ip })
  });
  
  return response.json();
};

// Hostnames abrufen
const getHostnames = async () => {
  const response = await fetch(`${API_URL}/api/hostnames`, {
    headers: {
      'Authorization': `Bearer ${TOKEN}`
    }
  });
  
  return response.json();
};
```

## Router Integration

### FritzBox

FritzBox unterstützt Custom DDNS Provider:

1. **Einstellungen** → **Internet** → **Freigaben** → **DynDNS**
2. **DynDNS-Anbieter**: Benutzerdefiniert
3. **Update-URL**: 
   ```
   http://3.72.176.165:3000/update
   ```
4. **Domainname**: `myhome.dm1lx.de`
5. **Benutzername**: `Bearer YOUR_TOKEN`
6. **Kennwort**: (leer lassen)

### OpenWrt

```bash
# /etc/config/ddns
config service 'dm1lx'
    option enabled '1'
    option service_name 'dm1lx.de'
    option domain 'myhome.dm1lx.de'
    option username 'Bearer YOUR_TOKEN'
    option password ''
    option update_url 'http://3.72.176.165:3000/update'
    option check_interval '5'
    option check_unit 'minutes'
```

## Monitoring

### Prometheus Metrics

Der Server kann Prometheus Metrics exportieren (optional):

```http
GET /metrics
```

### Logging

Alle API-Calls werden geloggt:

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "IP updated for myhome: 192.168.1.100 -> 192.168.1.101 by user user_123",
  "service": "ddns-server"
}
```