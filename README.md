# dm1lx.de DDNS Service

Ein vollständiger Dynamic DNS Service für die Domain dm1lx.de mit Web-Dashboard, API und Client-Scripts.

## 🏗️ Architektur

```
*.dm1lx.de → 3.72.176.165 (A Record)
                ↓
        DDNS Server (Node.js)
                ↓
        Upstash Redis Database
                ↑
        Web Dashboard (Next.js + Clerk)
                ↑
        Client Scripts (Python)
```

## 📁 Projektstruktur

```
dm1lx.de/
├── ddns-server/          # Node.js DDNS Server
├── frontend/             # Next.js Web Dashboard
├── client-scripts/       # Python Client Scripts
└── docs/                 # Dokumentation
```

## 🚀 Features

- **Web Dashboard**: Hostname-Verwaltung mit Clerk Authentication
- **API**: RESTful API für Router und Scripts
- **Client Scripts**: Python Script für automatische IP-Updates
- **Logging**: Vollständige IP-Change Historie
- **Rate Limiting**: Schutz vor Missbrauch
- **Sicherheit**: JWT-Token basierte Authentifizierung

## 🛠️ Installation

### 1. DDNS Server (auf 3.72.176.165)

```bash
cd ddns-server
npm install
cp .env.example .env
# .env konfigurieren
npm start
```

### 2. Frontend (Vercel Deployment)

```bash
cd frontend
npm install
# Clerk und Umgebungsvariablen konfigurieren
npm run build
# Auf Vercel deployen
```

### 3. Client Script

```bash
cd client-scripts
pip install -r requirements.txt
python ddns-updater.py --create-config config.json
# config.json bearbeiten
python ddns-updater.py --config config.json
```

## ⚙️ Konfiguration

### DDNS Server (.env)

```env
REDIS_URL=redis://default:password@host:6379
PORT=3000
NODE_ENV=production
JWT_SECRET=your_secret_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_DDNS_API_URL=http://3.72.176.165:3000
```

### Client Script (config.json)

```json
{
  "hostname": "myhome",
  "token": "your_api_token_from_dashboard",
  "server_url": "http://3.72.176.165:3000",
  "ip_detection_service": "https://api.ipify.org",
  "log_file": "/var/log/ddns-updater.log",
  "check_interval": 300
}
```

## 📖 API Dokumentation

### Authentication

Alle API-Calls benötigen einen Bearer Token:

```bash
Authorization: Bearer YOUR_API_TOKEN
```

### Endpoints

#### IP Update (für Router/Scripts)

```bash
POST /update
Content-Type: application/json

{
  "hostname": "myhome",
  "ip": "192.168.1.100"
}
```

#### DNS Resolution

```bash
GET /myhome
# oder
GET /myhome.dm1lx.de

Response:
{
  "hostname": "myhome",
  "ip": "192.168.1.100",
  "ttl": 300,
  "lastUpdated": "2024-01-01T12:00:00Z"
}
```

#### Hostname Management

```bash
# Liste aller Hostnames
GET /api/hostnames

# Neuen Hostname erstellen
POST /api/hostnames
{
  "hostname": "myhome",
  "ip": "192.168.1.100",
  "ttl": 300
}

# Hostname aktualisieren
PUT /api/hostnames/myhome
{
  "ip": "192.168.1.101",
  "ttl": 600
}

# Hostname löschen
DELETE /api/hostnames/myhome

# Logs abrufen
GET /api/hostnames/myhome/logs
```

## 🔧 Client Script Verwendung

### Einmalige Aktualisierung

```bash
python ddns-updater.py --hostname myhome --token YOUR_TOKEN
```

### Mit spezifischer IP

```bash
python ddns-updater.py --hostname myhome --token YOUR_TOKEN --ip 192.168.1.100
```

### Als Daemon (kontinuierliche Überwachung)

```bash
python ddns-updater.py --config config.json --daemon
```

### Systemd Service Installation

```bash
cd client-scripts
chmod +x install.sh
sudo ./install.sh
```

## 🔒 Sicherheit

- **JWT Tokens**: Sichere API-Authentifizierung
- **Rate Limiting**: Schutz vor Brute-Force-Angriffen
- **Input Validation**: Alle Eingaben werden validiert
- **CORS**: Konfigurierte Cross-Origin-Requests
- **Helmet**: Security Headers für Express

## 📊 Monitoring

### Logs

- Server: `ddns-server/logs/`
- Client: Konfigurierbar in `config.json`

### Health Check

```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 3600
}
```

## 🚨 Troubleshooting

### Häufige Probleme

1. **Token ungültig**: Token im Dashboard neu generieren
2. **Hostname nicht gefunden**: Hostname im Dashboard erstellen
3. **IP-Update fehlgeschlagen**: Netzwerkverbindung prüfen
4. **Rate Limit erreicht**: Warten oder Intervall erhöhen

### Debug-Modus

```bash
# Server
NODE_ENV=development npm run dev

# Client
python ddns-updater.py --hostname test --token TOKEN --ip 1.2.3.4
```

## 📝 Limits

- **Hostnames pro Account**: 2
- **API Requests**: 100 pro 15 Minuten
- **Log Einträge**: 100 pro Hostname
- **Token Gültigkeit**: 1 Jahr

## 🤝 Support

Bei Problemen oder Fragen:

1. Logs prüfen
2. API-Dokumentation konsultieren
3. GitHub Issues erstellen

## 📄 Lizenz

MIT License - siehe LICENSE Datei für Details.