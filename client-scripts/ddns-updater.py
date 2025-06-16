#!/usr/bin/env python3
"""
dm1lx.de DDNS Updater Script
============================

Dieses Script aktualisiert automatisch die IP-Adresse für einen DDNS-Hostname.
Es kann als Cronjob oder von Routern verwendet werden.

Verwendung:
    python ddns-updater.py --hostname myhome --token YOUR_API_TOKEN
    python ddns-updater.py --hostname myhome --token YOUR_API_TOKEN --ip 192.168.1.100
    python ddns-updater.py --config config.json

Konfigurationsdatei (config.json):
{
    "hostname": "myhome",
    "token": "your_api_token_here",
    "server_url": "http://3.72.176.165:3000",
    "ip_detection_service": "https://api.ipify.org",
    "log_file": "/var/log/ddns-updater.log",
    "check_interval": 300
}
"""

import argparse
import json
import logging
import requests
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

class DDNSUpdater:
    def __init__(self, config: Dict[str, Any]):
        self.hostname = config['hostname']
        self.token = config['token']
        self.server_url = config.get('server_url', 'http://3.72.176.165:3000')
        self.ip_detection_service = config.get('ip_detection_service', 'https://api.ipify.org')
        self.log_file = config.get('log_file')
        self.check_interval = config.get('check_interval', 300)
        
        # Setup logging
        self.setup_logging()
        
        # Session for connection reuse
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {self.token}',
            'User-Agent': 'dm1lx-ddns-updater/1.0'
        })

    def setup_logging(self):
        """Setup logging configuration"""
        log_format = '%(asctime)s - %(levelname)s - %(message)s'
        
        if self.log_file:
            logging.basicConfig(
                level=logging.INFO,
                format=log_format,
                handlers=[
                    logging.FileHandler(self.log_file),
                    logging.StreamHandler(sys.stdout)
                ]
            )
        else:
            logging.basicConfig(
                level=logging.INFO,
                format=log_format,
                handlers=[logging.StreamHandler(sys.stdout)]
            )
        
        self.logger = logging.getLogger(__name__)

    def get_current_ip(self) -> Optional[str]:
        """Get current public IP address"""
        try:
            response = self.session.get(self.ip_detection_service, timeout=10)
            response.raise_for_status()
            ip = response.text.strip()
            
            # Validate IP format
            parts = ip.split('.')
            if len(parts) != 4 or not all(0 <= int(part) <= 255 for part in parts):
                raise ValueError(f"Invalid IP format: {ip}")
            
            return ip
        except Exception as e:
            self.logger.error(f"Failed to get current IP: {e}")
            return None

    def get_hostname_info(self) -> Optional[Dict[str, Any]]:
        """Get current hostname information from DDNS server"""
        try:
            url = f"{self.server_url}/info/{self.hostname}"
            response = self.session.get(url, timeout=10)
            
            if response.status_code == 404:
                self.logger.error(f"Hostname '{self.hostname}' not found")
                return None
            
            response.raise_for_status()
            return response.json()
        except Exception as e:
            self.logger.error(f"Failed to get hostname info: {e}")
            return None

    def update_ip(self, ip: str) -> bool:
        """Update IP address for hostname"""
        try:
            url = f"{self.server_url}/update"
            data = {
                'hostname': self.hostname,
                'ip': ip
            }
            
            response = self.session.post(url, json=data, timeout=10)
            
            if response.status_code == 401:
                self.logger.error("Authentication failed - check your API token")
                return False
            elif response.status_code == 403:
                self.logger.error(f"Access denied - hostname '{self.hostname}' does not belong to you")
                return False
            elif response.status_code == 404:
                self.logger.error(f"Hostname '{self.hostname}' not found")
                return False
            
            response.raise_for_status()
            result = response.json()
            
            self.logger.info(f"Successfully updated {self.hostname}.dm1lx.de to {ip}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to update IP: {e}")
            return False

    def run_once(self, force_ip: Optional[str] = None) -> bool:
        """Run update once"""
        # Get current IP
        if force_ip:
            current_ip = force_ip
            self.logger.info(f"Using forced IP: {current_ip}")
        else:
            current_ip = self.get_current_ip()
            if not current_ip:
                return False

        # Get current hostname info
        hostname_info = self.get_hostname_info()
        if not hostname_info:
            return False

        # Check if IP changed
        if hostname_info.get('ip') == current_ip:
            self.logger.info(f"IP unchanged ({current_ip}), no update needed")
            return True

        # Update IP
        old_ip = hostname_info.get('ip', 'unknown')
        self.logger.info(f"IP changed from {old_ip} to {current_ip}, updating...")
        
        return self.update_ip(current_ip)

    def run_daemon(self):
        """Run as daemon with periodic checks"""
        self.logger.info(f"Starting DDNS updater daemon for {self.hostname}.dm1lx.de")
        self.logger.info(f"Check interval: {self.check_interval} seconds")
        
        while True:
            try:
                self.run_once()
            except KeyboardInterrupt:
                self.logger.info("Daemon stopped by user")
                break
            except Exception as e:
                self.logger.error(f"Unexpected error in daemon: {e}")
            
            time.sleep(self.check_interval)

def load_config(config_file: str) -> Dict[str, Any]:
    """Load configuration from JSON file"""
    try:
        with open(config_file, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Error: Configuration file '{config_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in configuration file: {e}")
        sys.exit(1)

def create_sample_config(filename: str):
    """Create a sample configuration file"""
    config = {
        "hostname": "myhome",
        "token": "your_api_token_here",
        "server_url": "http://3.72.176.165:3000",
        "ip_detection_service": "https://api.ipify.org",
        "log_file": "/var/log/ddns-updater.log",
        "check_interval": 300
    }
    
    with open(filename, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"Sample configuration created: {filename}")
    print("Please edit the file and add your hostname and API token.")

def main():
    parser = argparse.ArgumentParser(
        description='dm1lx.de DDNS Updater',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument('--hostname', help='DDNS hostname (without .dm1lx.de)')
    parser.add_argument('--token', help='API token from dashboard')
    parser.add_argument('--ip', help='Force specific IP address (optional)')
    parser.add_argument('--config', help='Configuration file path')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon')
    parser.add_argument('--create-config', help='Create sample configuration file')
    parser.add_argument('--server-url', default='http://3.72.176.165:3000', 
                       help='DDNS server URL (default: http://3.72.176.165:3000)')
    
    args = parser.parse_args()
    
    # Create sample config
    if args.create_config:
        create_sample_config(args.create_config)
        return
    
    # Load configuration
    if args.config:
        config = load_config(args.config)
    else:
        if not args.hostname or not args.token:
            parser.error("Either --config or both --hostname and --token are required")
        
        config = {
            'hostname': args.hostname,
            'token': args.token,
            'server_url': args.server_url
        }
    
    # Create updater
    updater = DDNSUpdater(config)
    
    # Run
    if args.daemon:
        updater.run_daemon()
    else:
        success = updater.run_once(args.ip)
        sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()