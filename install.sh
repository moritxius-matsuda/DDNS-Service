#!/bin/bash

# Installation script for DM1LX DDNS Service
# Run as root: sudo ./install.sh

set -e

echo "Installing DM1LX DDNS Service..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo ./install.sh)"
    exit 1
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Create ddns user
if ! id "ddns" &>/dev/null; then
    echo "Creating ddns user..."
    useradd -r -s /bin/false -d /opt/dm1lx-ddns ddns
fi

# Create installation directory
INSTALL_DIR="/opt/dm1lx-ddns"
echo "Creating installation directory: $INSTALL_DIR"
mkdir -p $INSTALL_DIR

# Copy files
echo "Copying files..."
cp -r dns-server/ $INSTALL_DIR/
cp -r lib/ $INSTALL_DIR/
cp package.json $INSTALL_DIR/
cp .env.local $INSTALL_DIR/

# Set ownership
chown -R ddns:ddns $INSTALL_DIR

# Install dependencies
echo "Installing dependencies..."
cd $INSTALL_DIR
sudo -u ddns npm install --production

# Install systemd service
echo "Installing systemd service..."
cp dns-server.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable dns-server

# Start service
echo "Starting DNS server..."
systemctl start dns-server

# Check status
sleep 2
if systemctl is-active --quiet dns-server; then
    echo "✓ DNS server is running"
    systemctl status dns-server --no-pager
else
    echo "✗ DNS server failed to start"
    systemctl status dns-server --no-pager
    exit 1
fi

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Configure your domain's DNS to point *.dm1lx.de to this server's IP"
echo "2. Deploy the frontend to Vercel"
echo "3. Test DNS resolution: nslookup test.dm1lx.de $(hostname -I | awk '{print $1}')"
echo ""
echo "Service management:"
echo "  Start:   sudo systemctl start dns-server"
echo "  Stop:    sudo systemctl stop dns-server"
echo "  Status:  sudo systemctl status dns-server"
echo "  Logs:    sudo journalctl -u dns-server -f"