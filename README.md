# DM1LX DDNS Service

Ein vollständiger Dynamic DNS Service für die Domain `dm1lx.de`.

## Übersicht

Dieses System besteht aus mehreren Komponenten:

1. **Frontend (Next.js + Vercel + Clerk)** - Web-Interface zur Verwaltung der Hostnames
2. **DNS-Server** - Beantwortet DNS-Anfragen für `*.dm1lx.de`
3. **API** - RESTful API für Updates von Routern und Skripten
4. **Python/Shell-Skripte** - Automatische IP-Aktualisierung

## Setup

### 1. Abhängigkeiten installieren

```bash
npm install
```

### 2. Umgebungsvariablen konfigurieren

Kopieren Sie `.env.local.example` zu `.env.local` und füllen Sie die Werte aus:

```bash
cp .env.local.example .env.local
```

### 3. Frontend starten (Development)

```bash
npm run dev
```

### 4. DNS-Server starten

```bash
npm run dns-server
```

## DNS-Konfiguration

Für die Domain `dm1lx.de` müssen folgende DNS-Einträge gesetzt werden:

```
*.dm1lx.de    A    3.72.176.165
```

Der Server auf `3.72.176.165` läuft dann den DNS-Server, der die Subdomains zu den richtigen IP-Adressen auflöst.

## Verwendung

### Web-Interface

1. Besuchen Sie die Website
2. Melden Sie sich mit Clerk an
3. Verwalten Sie Ihre Hostnames über das Dashboard
4. Kopieren Sie Ihren API-Schlüssel für automatische Updates

### Python-Skript

```bash
# Installation der Abhängigkeiten
pip install requests

# Hostname aktualisieren
python scripts/update_ddns.py --hostname meinhost --api-key your-api-key

# Mit spezifischer IP
python scripts/update_ddns.py --hostname meinhost --api-key your-api-key --ip 192.168.1.100

# Mit JSON-Output
python scripts/update_ddns.py --hostname meinhost --api-key your-api-key --json
```

### Shell-Skript (für Router)

```bash
# Ausführbar machen
chmod +x scripts/update_ddns.sh

# Hostname aktualisieren
./scripts/update_ddns.sh meinhost your-api-key

# Mit spezifischer IP
./scripts/update_ddns.sh meinhost your-api-key 192.168.1.100
```

### API-Aufrufe

#### Hostname aktualisieren (POST)

```bash
curl -X POST https://yourdomain.com/api/ddns/update \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "meinhost",
    "apiKey": "your-api-key",
    "ip": "192.168.1.100"
  }'
```

#### Hostname aktualisieren (GET - für einfache Router)

```bash
curl "https://yourdomain.com/api/ddns/update?hostname=meinhost&apiKey=your-api-key&ip=192.168.1.100"
```

#### Hostname auflösen

```bash
curl "https://yourdomain.com/api/ddns/resolve?hostname=meinhost"
```

## Deployment

### Frontend (Vercel)

1. Repository zu Vercel verbinden
2. Umgebungsvariablen in Vercel konfigurieren
3. Deploy

### DNS-Server

Der DNS-Server muss auf dem Server mit der IP `3.72.176.165` laufen:

```bash
# Als Service installieren (systemd)
sudo cp dns-server.service /etc/systemd/system/
sudo systemctl enable dns-server
sudo systemctl start dns-server
```

### Systemd Service Datei

Erstellen Sie `/etc/systemd/system/dns-server.service`:

```ini
[Unit]
Description=DM1LX DDNS Server
After=network.target

[Service]
Type=simple
User=ddns
WorkingDirectory=/path/to/dm1lx-ddns
ExecStart=/usr/bin/node dns-server/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Router-Konfiguration

### FritzBox

1. Internet → Freigaben → DynDNS
2. DynDNS-Anbieter: Benutzerdefiniert
3. Update-URL: `https://yourdomain.com/api/ddns/update?hostname=<domain>&apiKey=<pass>&ip=<ipaddr>`
4. Domainname: Ihr Hostname (ohne .dm1lx.de)
5. Benutzername: (leer lassen)
6. Kennwort: Ihr API-Schlüssel

### OpenWrt

Installieren Sie das `ddns-scripts` Paket und konfigurieren Sie:

```bash
# /etc/config/ddns
config service 'dm1lx'
    option enabled '1'
    option service_name 'dm1lx.de'
    option domain 'meinhost'
    option username ''
    option password 'your-api-key'
    option update_url 'https://yourdomain.com/api/ddns/update?hostname=[DOMAIN]&apiKey=[PASSWORD]&ip=[IP]'
    option check_interval '10'
    option check_unit 'minutes'
```

### pfSense

1. Services → Dynamic DNS
2. Service Type: Custom
3. Hostname: Ihr Hostname
4. Username: (leer)
5. Password: Ihr API-Schlüssel
6. Update URL: `https://yourdomain.com/api/ddns/update?hostname=%h&apiKey=%p&ip=%i`

## Cron-Jobs

Für automatische Updates können Sie Cron-Jobs einrichten:

```bash
# Alle 5 Minuten aktualisieren
*/5 * * * * /path/to/scripts/update_ddns.sh meinhost your-api-key

# Oder mit Python-Skript
*/5 * * * * /usr/bin/python3 /path/to/scripts/update_ddns.py --hostname meinhost --api-key your-api-key --quiet
```

## Sicherheit

- API-Schlüssel werden sicher in Redis gespeichert
- Rate-Limiting auf API-Endpunkten
- Validierung aller Eingaben
- HTTPS-only für alle API-Aufrufe

## Monitoring

Der DNS-Server loggt alle Anfragen. Überwachen Sie:

- DNS-Server-Status
- Redis-Verbindung
- API-Response-Zeiten
- Fehlerhafte Update-Versuche

## Troubleshooting

### DNS-Auflösung funktioniert nicht

1. Prüfen Sie, ob der DNS-Server läuft: `sudo systemctl status dns-server`
2. Testen Sie DNS-Anfragen: `nslookup meinhost.dm1lx.de 3.72.176.165`
3. Prüfen Sie die Redis-Verbindung

### API-Updates schlagen fehl

1. Prüfen Sie den API-Schlüssel
2. Validieren Sie das Hostname-Format
3. Prüfen Sie die IP-Adresse
4. Schauen Sie in die Server-Logs

### Hostname wird nicht gefunden

1. Prüfen Sie, ob der Hostname in Redis existiert
2. Stellen Sie sicher, dass der Hostname dem Benutzer gehört
3. Prüfen Sie die Redis-Daten: `redis-cli HGETALL ddns:hostname`

## Support

Bei Problemen oder Fragen erstellen Sie ein Issue im Repository.