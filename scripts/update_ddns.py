#!/usr/bin/env python3
"""
DDNS Update Script for dm1lx.de
Usage: python update_ddns.py --hostname myhost --api-key your-api-key [--ip custom-ip] [--server custom-server]
"""

import argparse
import requests
import json
import sys
import time
from urllib.parse import urljoin

class DDNSUpdater:
    def __init__(self, server_url="https://yourdomain.com"):
        self.server_url = server_url.rstrip('/')
        self.update_endpoint = "/api/ddns/update"
    
    def get_public_ip(self):
        """Get public IP address from external service"""
        try:
            # Try multiple services in case one is down
            services = [
                "https://api.ipify.org",
                "https://ipv4.icanhazip.com",
                "https://checkip.amazonaws.com"
            ]
            
            for service in services:
                try:
                    response = requests.get(service, timeout=10)
                    if response.status_code == 200:
                        return response.text.strip()
                except:
                    continue
            
            raise Exception("Could not determine public IP")
        except Exception as e:
            print(f"Error getting public IP: {e}")
            return None
    
    def update_hostname(self, hostname, api_key, ip=None):
        """Update hostname with given IP or current public IP"""
        try:
            # Use provided IP or get current public IP
            if ip is None:
                ip = self.get_public_ip()
                if ip is None:
                    return False, "Could not determine IP address"
            
            # Prepare request data
            data = {
                "hostname": hostname,
                "apiKey": api_key,
                "ip": ip
            }
            
            # Make request
            url = urljoin(self.server_url, self.update_endpoint)
            response = requests.post(
                url,
                json=data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return True, result
            else:
                try:
                    error = response.json().get('error', 'Unknown error')
                except:
                    error = f"HTTP {response.status_code}"
                return False, error
                
        except requests.exceptions.RequestException as e:
            return False, f"Network error: {e}"
        except Exception as e:
            return False, f"Unexpected error: {e}"
    
    def update_with_retry(self, hostname, api_key, ip=None, max_retries=3, retry_delay=5):
        """Update hostname with retry logic"""
        for attempt in range(max_retries):
            success, result = self.update_hostname(hostname, api_key, ip)
            
            if success:
                return True, result
            
            if attempt < max_retries - 1:
                print(f"Attempt {attempt + 1} failed: {result}")
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                return False, result
        
        return False, "Max retries exceeded"

def main():
    parser = argparse.ArgumentParser(description='Update DDNS hostname for dm1lx.de')
    parser.add_argument('--hostname', required=True, help='Hostname to update (without .dm1lx.de)')
    parser.add_argument('--api-key', required=True, help='API key for authentication')
    parser.add_argument('--ip', help='IP address to set (if not provided, uses current public IP)')
    parser.add_argument('--server', default='https://yourdomain.com', help='DDNS server URL')
    parser.add_argument('--retries', type=int, default=3, help='Number of retry attempts')
    parser.add_argument('--retry-delay', type=int, default=5, help='Delay between retries in seconds')
    parser.add_argument('--quiet', action='store_true', help='Suppress output except errors')
    parser.add_argument('--json', action='store_true', help='Output result as JSON')
    
    args = parser.parse_args()
    
    # Create updater instance
    updater = DDNSUpdater(args.server)
    
    if not args.quiet:
        print(f"Updating {args.hostname}.dm1lx.de...")
        if args.ip:
            print(f"Setting IP to: {args.ip}")
        else:
            print("Using current public IP")
    
    # Update hostname
    success, result = updater.update_with_retry(
        args.hostname, 
        args.api_key, 
        args.ip,
        args.retries,
        args.retry_delay
    )
    
    if args.json:
        # JSON output
        output = {
            "success": success,
            "hostname": f"{args.hostname}.dm1lx.de",
            "result": result
        }
        print(json.dumps(output, indent=2))
    else:
        # Human readable output
        if success:
            if not args.quiet:
                print("✓ Update successful!")
                print(f"  Hostname: {result.get('hostname', f'{args.hostname}.dm1lx.de')}")
                print(f"  IP: {result.get('ip', 'Unknown')}")
                print(f"  Updated: {result.get('updated', 'Unknown')}")
        else:
            print(f"✗ Update failed: {result}")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()