#!/bin/bash

# DDNS Update Script for dm1lx.de (Shell version for routers)
# Usage: ./update_ddns.sh hostname api_key [ip] [server]

# Configuration
HOSTNAME="$1"
API_KEY="$2"
IP="$3"
SERVER="${4:-https://yourdomain.com}"

# Check required parameters
if [ -z "$HOSTNAME" ] || [ -z "$API_KEY" ]; then
    echo "Usage: $0 <hostname> <api_key> [ip] [server]"
    echo "Example: $0 myhost ddns_abc123def456 192.168.1.100"
    exit 1
fi

# Function to get public IP if not provided
get_public_ip() {
    # Try multiple services
    for service in "https://api.ipify.org" "https://ipv4.icanhazip.com" "https://checkip.amazonaws.com"; do
        IP=$(curl -s --connect-timeout 10 "$service" 2>/dev/null | tr -d '\n\r')
        if [ -n "$IP" ] && [[ $IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo "$IP"
            return 0
        fi
    done
    return 1
}

# Get IP if not provided
if [ -z "$IP" ]; then
    echo "Getting current public IP..."
    IP=$(get_public_ip)
    if [ $? -ne 0 ] || [ -z "$IP" ]; then
        echo "Error: Could not determine public IP address"
        exit 1
    fi
    echo "Detected IP: $IP"
fi

# Validate IP format
if ! [[ $IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    echo "Error: Invalid IP address format: $IP"
    exit 1
fi

# Prepare JSON data
JSON_DATA=$(cat <<EOF
{
    "hostname": "$HOSTNAME",
    "apiKey": "$API_KEY",
    "ip": "$IP"
}
EOF
)

# Make API request
echo "Updating $HOSTNAME.dm1lx.de to $IP..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$JSON_DATA" \
    --connect-timeout 30 \
    "$SERVER/api/ddns/update")

# Parse response
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ Update successful!"
    
    # Try to parse JSON response (if jq is available)
    if command -v jq >/dev/null 2>&1; then
        echo "  Hostname: $(echo "$BODY" | jq -r '.hostname // "Unknown"')"
        echo "  IP: $(echo "$BODY" | jq -r '.ip // "Unknown"')"
        echo "  Updated: $(echo "$BODY" | jq -r '.updated // "Unknown"')"
    else
        echo "  Response: $BODY"
    fi
    exit 0
else
    echo "✗ Update failed (HTTP $HTTP_CODE)"
    
    # Try to extract error message
    if command -v jq >/dev/null 2>&1; then
        ERROR=$(echo "$BODY" | jq -r '.error // "Unknown error"')
        echo "  Error: $ERROR"
    else
        echo "  Response: $BODY"
    fi
    exit 1
fi