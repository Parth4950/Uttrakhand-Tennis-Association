#!/usr/bin/env python3
"""
Test script for user login functionality
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_user_login():
    """Test the user login endpoint"""
    
    # Test case 1: Valid credentials (if any exist in DB)
    print("🧪 Testing user login...")
    
    # First, let's check if there are any users in the database
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            print("✅ Server is running")
        else:
            print("❌ Server is not responding")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server. Make sure it's running on localhost:5000")
        return
    
    # Test with sample data
    test_data = {
        "whatsapp": "+919876543210",
        "date_of_birth": "1990-01-01"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/user-login",
            headers={"Content-Type": "application/json"},
            data=json.dumps(test_data)
        )
        
        print(f"📊 Response status: {response.status_code}")
        print(f"📊 Response body: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Login successful!")
                print(f"👤 User: {data['user']['player']['name']}")
                print(f"📅 Events: {len(data['user']['events'])}")
            else:
                print("❌ Login failed")
        elif response.status_code == 401:
            print("❌ Invalid credentials (expected if no matching user)")
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")

def test_database_connection():
    """Test database connection"""
    print("\n🔍 Testing database connection...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/debug-db")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Database connected: {data.get('connected_to', 'Unknown')}")
        else:
            print("❌ Database connection failed")
    except Exception as e:
        print(f"❌ Error testing database: {e}")

if __name__ == "__main__":
    print("🚀 Starting login tests...")
    test_database_connection()
    test_user_login()
    print("\n✅ Tests completed!") 