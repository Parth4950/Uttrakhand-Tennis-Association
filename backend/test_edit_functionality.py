#!/usr/bin/env python3
"""
Test script for player edit functionality
"""
import requests
import json
from db import get_db_connection

BASE_URL = "http://localhost:5000"

def test_edit_functionality():
    """Test the edit functionality"""
    
    print("🧪 Testing player edit functionality...")
    
    # First, let's check if there are any players in the database
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        if not connection:
            print("❌ Database connection failed")
            return
        
        cursor = connection.cursor()
        
        # Get all players
        cursor.execute("SELECT id, name, whatsapp_number, email FROM tbl_players LIMIT 5")
        players = cursor.fetchall()
        
        if not players:
            print("❌ No players found in database. Please register some players first.")
            return
        
        print(f"✅ Found {len(players)} players in database:")
        for player in players:
            print(f"  - ID: {player[0]}, Name: {player[1]}, WhatsApp: {player[2]}")
        
        # Test with the first player
        test_player = players[0]
        player_id = test_player[0]
        
        print(f"\n🧪 Testing edit for player ID: {player_id}")
        
        # Test the update endpoint
        update_data = {
            "name": test_player[1] + " (Updated)",
            "whatsapp_number": test_player[2],
            "date_of_birth": "1990-01-01",
            "email": test_player[3] or "test@example.com",
            "city": "Test City",
            "shirt_size": "M",
            "short_size": "L",
            "food_pref": "vegetarian",
            "stay_y_or_n": True,
            "fee_paid": False
        }
        
        try:
            response = requests.put(
                f"{BASE_URL}/api/players/{player_id}",
                headers={"Content-Type": "application/json"},
                data=json.dumps(update_data)
            )
            
            print(f"📊 Update response status: {response.status_code}")
            print(f"📊 Update response body: {response.text}")
            
            if response.status_code == 200:
                print("✅ Player update successful!")
                
                # Verify the update in database
                cursor.execute("SELECT name, email, city FROM tbl_players WHERE id = %s", (player_id,))
                updated_player = cursor.fetchone()
                if updated_player:
                    print(f"✅ Database verification - Name: {updated_player[0]}, Email: {updated_player[1]}, City: {updated_player[2]}")
                else:
                    print("❌ Database verification failed - player not found")
                    
            elif response.status_code == 400:
                print("❌ Bad request - check the data format")
            elif response.status_code == 404:
                print("❌ Player not found")
            else:
                print(f"❌ Unexpected response: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error testing update: {e}")
            
        # Test the dashboard endpoint
        try:
            response = requests.get(f"{BASE_URL}/api/players/dashboard/{player_id}")
            
            print(f"\n📊 Dashboard response status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Dashboard data retrieved successfully!")
                print(f"👤 Player: {data['player']['name']}")
                print(f"📅 Events: {len(data['events'])}")
                for event in data['events']:
                    print(f"  - {event['event_name']}: {event['partner_name']}")
            elif response.status_code == 404:
                print("❌ Player dashboard not found")
            else:
                print(f"❌ Unexpected dashboard response: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error testing dashboard: {e}")
            
    except Exception as e:
        print(f"❌ Error in test: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def test_whatsapp_duplicate_check():
    """Test WhatsApp duplicate checking during edit"""
    
    print("\n🧪 Testing WhatsApp duplicate checking...")
    
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        if not connection:
            print("❌ Database connection failed")
            return
        
        cursor = connection.cursor()
        
        # Get two different players
        cursor.execute("SELECT id, whatsapp_number FROM tbl_players LIMIT 2")
        players = cursor.fetchall()
        
        if len(players) < 2:
            print("❌ Need at least 2 players to test duplicate checking")
            return
        
        player1_id, player1_whatsapp = players[0]
        player2_id, player2_whatsapp = players[1]
        
        print(f"Testing with Player 1 (ID: {player1_id}, WhatsApp: {player1_whatsapp})")
        print(f"Trying to update Player 2 (ID: {player2_id}) with Player 1's WhatsApp")
        
        # Try to update player2 with player1's WhatsApp number
        update_data = {
            "name": "Test Player",
            "whatsapp_number": player1_whatsapp,  # Use player1's WhatsApp
            "date_of_birth": "1990-01-01",
            "email": "test@example.com",
            "city": "Test City",
            "shirt_size": "M",
            "short_size": "L",
            "food_pref": "vegetarian",
            "stay_y_or_n": False,
            "fee_paid": False
        }
        
        try:
            response = requests.put(
                f"{BASE_URL}/api/players/{player2_id}",
                headers={"Content-Type": "application/json"},
                data=json.dumps(update_data)
            )
            
            print(f"📊 Duplicate check response status: {response.status_code}")
            print(f"📊 Response body: {response.text}")
            
            if response.status_code == 400:
                print("✅ Duplicate WhatsApp check working correctly!")
            elif response.status_code == 200:
                print("❌ Duplicate WhatsApp check failed - should have rejected")
            else:
                print(f"❌ Unexpected response: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error testing duplicate check: {e}")
            
    except Exception as e:
        print(f"❌ Error in duplicate test: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    print("🚀 Starting edit functionality tests...")
    test_edit_functionality()
    test_whatsapp_duplicate_check()
    print("\n✅ Edit functionality tests completed!") 