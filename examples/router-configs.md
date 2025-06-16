# Router-Konfigurationen für DM1LX DDNS

## FritzBox

1. Gehen Sie zu **Internet → Freigaben → DynDNS**
2. Aktivieren Sie **DynDNS verwenden**
3. Wählen Sie **Benutzerdefiniert** als DynDNS-Anbieter
4. Konfiguration:
   - **Update-URL**: `https://yourdomain.com/api/ddns/update?hostname=<domain>&apiKey=<pass>&ip=<ipaddr>`
   - **Domainname**: `meinhost` (ohne .dm1lx.de)
   - **Benutzername**: (leer lassen)
   - **Kennwort**: Ihr API-Schlüssel

## OpenWrt

### Installation

```bash
opkg update
opkg install ddns-scripts
```

### Konfiguration

Bearbeiten Sie `/etc/config/ddns`:

```bash
config service 'dm1lx'
    option enabled '1'
    option service_name 'dm1lx.de'
    option domain 'meinhost'
    option username ''
    option password 'your-api-key'
    option update_url 'https://yourdomain.com/api/ddns/update?hostname=[DOMAIN]&apiKey=[PASSWORD]&ip=[IP]'
    option check_interval '10'
    option check_unit 'minutes'
    option force_interval '72'
    option force_unit 'hours'
```

### Service starten

```bash
/etc/init.d/ddns enable
/etc/init.d/ddns start
```

## pfSense

1. Gehen Sie zu **Services → Dynamic DNS**
2. Klicken Sie auf **Add**
3. Konfiguration:
   - **Service Type**: Custom
   - **Interface to monitor**: WAN
   - **Hostname**: `meinhost`
   - **Username**: (leer lassen)
   - **Password**: Ihr API-Schlüssel
   - **Update URL**: `https://yourdomain.com/api/ddns/update?hostname=%h&apiKey=%p&ip=%i`
   - **Result Match**: `"success":true`

## Ubiquiti EdgeRouter

```bash
configure
set service dns dynamic interface eth0 service dm1lx host-name meinhost
set service dns dynamic interface eth0 service dm1lx login ''
set service dns dynamic interface eth0 service dm1lx password 'your-api-key'
set service dns dynamic interface eth0 service dm1lx protocol custom
set service dns dynamic interface eth0 service dm1lx server 'yourdomain.com'
set service dns dynamic interface eth0 service dm1lx options 'url=/api/ddns/update?hostname=meinhost&apiKey=your-api-key&ip='
commit
save
```

## MikroTik RouterOS

```bash
/system script add name=ddns-update source={
    :local hostname "meinhost"
    :local apikey "your-api-key"
    :local server "yourdomain.com"
    
    :local currentIP [/ip address get [find interface="ether1"] address]
    :set currentIP [:pick $currentIP 0 [:find $currentIP "/"]]
    
    /tool fetch url="https://$server/api/ddns/update?hostname=$hostname&apiKey=$apikey&ip=$currentIP" mode=https
}

/system scheduler add name=ddns-update interval=5m on-event=ddns-update
```

## ASUS Router (Merlin Firmware)

1. Gehen Sie zu **WAN → DDNS**
2. Aktivieren Sie **Enable the DDNS Client**
3. Konfiguration:
   - **Server**: Custom
   - **Host Name**: `meinhost.dm1lx.de`
   - **User Name or E-mail Address**: (leer)
   - **Password or DDNS Key**: Ihr API-Schlüssel
   - **Optional: Update URL**: `https://yourdomain.com/api/ddns/update?hostname=meinhost&apiKey=<pass>&ip=<ip>`

## Netgear Router

1. Gehen Sie zu **Dynamic DNS**
2. Aktivieren Sie **Use a Dynamic DNS Service**
3. Wählen Sie **No-IP** (als Basis)
4. Konfiguration:
   - **Host Name**: `meinhost.dm1lx.de`
   - **Username**: (leer)
   - **Password**: Ihr API-Schlüssel

## D-Link Router

1. Gehen Sie zu **Tools → Dynamic DNS**
2. Aktivieren Sie **Dynamic DNS**
3. Wählen Sie **Custom** als Provider
4. Konfiguration:
   - **Server Address**: `yourdomain.com`
   - **Host Name**: `meinhost`
   - **Username**: (leer)
   - **Password**: Ihr API-Schlüssel
   - **Update URL**: `/api/ddns/update?hostname=meinhost&apiKey=<password>&ip=<ip>`

## Linksys Router

1. Gehen Sie zu **Smart Wi-Fi Tools → External Storage**
2. Aktivieren Sie **Dynamic DNS**
3. Konfiguration:
   - **DDNS Service**: Other
   - **Hostname**: `meinhost.dm1lx.de`
   - **Username**: (leer)
   - **Password**: Ihr API-Schlüssel
   - **Update URL**: `https://yourdomain.com/api/ddns/update?hostname=meinhost&apiKey=<password>&ip=<ip>`

## Cron-Job (Linux/Unix)

Für Server oder erweiterte Router mit Cron-Unterstützung:

```bash
# Alle 5 Minuten aktualisieren
*/5 * * * * /path/to/scripts/update_ddns.sh meinhost your-api-key >/dev/null 2>&1

# Mit Logging
*/5 * * * * /path/to/scripts/update_ddns.sh meinhost your-api-key >> /var/log/ddns.log 2>&1
```

## Windows Task Scheduler

Für Windows-basierte Router oder Server:

1. Öffnen Sie den Task Scheduler
2. Erstellen Sie eine neue Aufgabe
3. Trigger: Alle 5 Minuten
4. Aktion: Python-Skript ausführen
   ```
   Program: python
   Arguments: C:\path\to\update_ddns.py --hostname meinhost --api-key your-api-key --quiet
   ```

## Testen der Konfiguration

Nach der Konfiguration können Sie testen:

```bash
# DNS-Auflösung testen
nslookup meinhost.dm1lx.de

# API-Endpunkt testen
curl "https://yourdomain.com/api/ddns/resolve?hostname=meinhost"

# Manuelles Update testen
curl -X POST https://yourdomain.com/api/ddns/update \
  -H "Content-Type: application/json" \
  -d '{"hostname": "meinhost", "apiKey": "your-api-key"}'
```

## Troubleshooting

### Häufige Probleme

1. **Router kann HTTPS nicht verwenden**
   - Verwenden Sie HTTP statt HTTPS (weniger sicher)
   - URL: `http://yourdomain.com/api/ddns/update`

2. **Router unterstützt keine benutzerdefinierten URLs**
   - Verwenden Sie einen der Standard-DDNS-Provider als Basis
   - Passen Sie die URL entsprechend an

3. **Update schlägt fehl**
   - Prüfen Sie den API-Schlüssel
   - Stellen Sie sicher, dass der Hostname existiert
   - Prüfen Sie die Router-Logs

4. **DNS-Auflösung funktioniert nicht**
   - Warten Sie bis zu 5 Minuten (TTL)
   - Prüfen Sie die DNS-Server-Logs
   - Testen Sie mit `dig` oder `nslookup`