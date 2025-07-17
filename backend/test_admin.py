#!/usr/bin/env python3
"""
Test script for admin functionality
"""
import requests
import json
import sys
from db import test_db_connection

BASE_URL = "http://localhost:5000"

def test_database():
    """Test database connectivity"""
    print("🔍 Testing database connection...")
    if test_db_connection():
        print("Database connection successful")
        return True
    else:
        print("Database connection failed")
        return False

def test_admin_login():
    """Test admin login functionality"""
    print("\nTesting admin login...")
    
    # Test with correct credentials
    login_data = {
        "username": "admin",
        "password": "uta2025"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if 'access_token' in data:
                print("Admin login successful")
                return data['access_token']
            else:
                print("No access token in response")
                return None
        else:
            print(f"Login failed: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to server. Make sure the Flask app is running.")
        return None
    except Exception as e:
        print(f"Login test failed: {e}")
        return None

def test_admin_endpoints(token):
    """Test admin endpoints with authentication"""
    print("\nTesting admin endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test registrations endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/admin/registrations", headers=headers)
        print(f"Registrations endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Registrations endpoint successful - {len(data)} registrations found")
        else:
            print(f"Registrations endpoint failed: {response.text}")
            
    except Exception as e:
        print(f"Registrations test failed: {e}")
    
    # Test statistics endpoint
    try:
        response = requests.get(f"{BASE_URL}/api/admin/statistics", headers=headers)
        print(f"Statistics endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Statistics endpoint successful - {len(data)} events found")
        else:
            print(f"Statistics endpoint failed: {response.text}")
            
    except Exception as e:
        print(f"Statistics test failed: {e}")

def test_ranking_update(token):
    """Test ranking update functionality"""
    print("\nTesting ranking update...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # First get some registrations to test with
    try:
        response = requests.get(f"{BASE_URL}/api/admin/registrations", headers=headers)
        if response.status_code == 200:
            registrations = response.json()
            if registrations:
                # Use the first registration for testing
                reg = registrations[0]
                player_id = reg['player_id']
                event_name = reg['event_name']
                
                ranking_data = {
                    "player_id": player_id,
                    "event_name": event_name,
                    "ranking": 1
                }
                
                response = requests.post(f"{BASE_URL}/api/partners/update-ranking", json=ranking_data)
                print(f"Ranking update status: {response.status_code}")
                
                if response.status_code == 200:
                    print("Ranking update successful")
                else:
                    print(f"Ranking update failed: {response.text}")
            else:
                print("No registrations found to test ranking update")
        else:
            print("Could not get registrations for ranking test")
            
    except Exception as e:
        print(f"Ranking update test failed: {e}")

def main():
    """Main test function"""
    print("Starting admin functionality tests...")
    
    # Test database
    if not test_database():
        print("\nDatabase test failed. Exiting.")
        sys.exit(1)
    
    # Test admin login
    token = test_admin_login()
    if not token:
        print("\nAdmin login failed. Exiting.")
        sys.exit(1)
    
    # Test admin endpoints
    test_admin_endpoints(token)
    
    # Test ranking update
    test_ranking_update(token)
    
    print("\nAll tests completed!")

if __name__ == "__main__":
    main() 