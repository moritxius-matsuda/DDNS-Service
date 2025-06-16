#!/bin/bash
# Installation script for dm1lx.de DDNS Updater

set -e

echo "Installing dm1lx.de DDNS Updater..."

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Install directory
INSTALL_DIR="/opt/dm1lx-ddns"
BIN_DIR="/usr/local/bin"
SERVICE_DIR="/etc/systemd/system"

# Create install directory
sudo mkdir -p "$INSTALL_DIR"

# Copy files
sudo cp ddns-updater.py "$INSTALL_DIR/"
sudo cp requirements.txt "$INSTALL_DIR/"
sudo cp config.example.json "$INSTALL_DIR/"

# Install Python dependencies
sudo python3 -m pip install -r "$INSTALL_DIR/requirements.txt"

# Make script executable
sudo chmod +x "$INSTALL_DIR/ddns-updater.py"

# Create symlink in bin directory
sudo ln -sf "$INSTALL_DIR/ddns-updater.py" "$BIN_DIR/ddns-updater"

# Create systemd service file
sudo tee "$SERVICE_DIR/ddns-updater.service" > /dev/null <<EOF
[Unit]
Description=dm1lx.de DDNS Updater
After=network.target

[Service]
Type=simple
User=ddns
Group=ddns
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/python3 $INSTALL_DIR/ddns-updater.py --config $INSTALL_DIR/config.json --daemon
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

# Create ddns user
if ! id "ddns" &>/dev/null; then
    sudo useradd -r -s /bin/false ddns
fi

# Set permissions
sudo chown -R ddns:ddns "$INSTALL_DIR"

echo "Installation completed!"
echo ""
echo "Next steps:"
echo "1. Copy and edit the configuration file:"
echo "   sudo cp $INSTALL_DIR/config.example.json $INSTALL_DIR/config.json"
echo "   sudo nano $INSTALL_DIR/config.json"
echo ""
echo "2. Enable and start the service:"
echo "   sudo systemctl enable ddns-updater"
echo "   sudo systemctl start ddns-updater"
echo ""
echo "3. Check service status:"
echo "   sudo systemctl status ddns-updater"
echo ""
echo "Manual usage:"
echo "   ddns-updater --hostname myhome --token YOUR_TOKEN"