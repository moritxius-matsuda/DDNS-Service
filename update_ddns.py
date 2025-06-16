import redis
import requests
import argparse
from typing import Optional

def update_ddns(hostname: str, ip_address: str, api_key: str) -> dict:
    """
    Update the DDNS record for a hostname with a new IP address.
    
    Args:
        hostname: The hostname to update (e.g., "mydevice.dm1lx.de")
        ip_address: The new IP address
        api_key: Your API key for authentication
    
    Returns:
        dict: Response from the API
    """
    
    # Connect to Redis
    r = redis.Redis.from_url("redis://default:qUDOoKa6WE6zgtiEU59VHsnGxxX3dJPC@redis-19438.c300.eu-central-1-1.ec2.redns.redis-cloud.com:19438")
    
    # Update the hostname in Redis
    r.set(hostname, ip_address)
    
    # Return success response
    return {
        "status": "success",
        "hostname": hostname,
        "ip_address": ip_address,
        "timestamp": r.get(f"{hostname}:last_update").decode() if r.exists(f"{hostname}:last_update") else None
    }

def main():
    parser = argparse.ArgumentParser(description='Update DDNS record')
    parser.add_argument('--hostname', required=True, help='The hostname to update (e.g., mydevice.dm1lx.de)')
    parser.add_argument('--ip', required=True, help='The new IP address')
    parser.add_argument('--api-key', required=True, help='Your API key for authentication')
    
    args = parser.parse_args()
    
    try:
        result = update_ddns(args.hostname, args.ip, args.api_key)
        print(f"Successfully updated {args.hostname} to {args.ip}")
    except Exception as e:
        print(f"Error updating DDNS: {str(e)}")

if __name__ == "__main__":
    main()
