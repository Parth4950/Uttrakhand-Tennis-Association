#!/usr/bin/env python3
"""
Test script to verify Mixed Doubles ranking updates
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_mixed_doubles_ranking():
    """Test updating rankings for Mixed Doubles teams"""
    
    # First, let's get all registrations to see the current state
    print("🔍 Getting all registrations...")
    try:
        response = requests.get(f"{BASE_URL}/api/admin/registrations")
        if response.status_code == 200:
            registrations = response.json()
            print(f"Found {len(registrations)} total registrations")
            
            # Filter for Mixed Doubles
            mixed_doubles = [reg for reg in registrations if reg['event_name'] == 'Mixed Doubles']
            print(f"Found {len(mixed_doubles)} Mixed Doubles registrations:")
            
            for reg in mixed_doubles:
                partner_info = f" (Partner: {reg['partner_name']})" if reg['partner_name'] else " (No partner)"
                ranking_info = f" [Ranking: {reg['ranking']}]" if reg['ranking'] else " [No ranking]"
                print(f"  {reg['player_name']} (ID: {reg['player_id']}) -> Mixed Doubles{partner_info}{ranking_info}")
            
            # Find a team without ranking to test
            teams_without_ranking = []
            for reg in mixed_doubles:
                if reg['partner_id'] and not reg['ranking']:
                    teams_without_ranking.append(reg)
            
            if teams_without_ranking:
                test_reg = teams_without_ranking[0]
                print(f"\n🧪 Testing ranking update for {test_reg['player_name']} (ID: {test_reg['player_id']}) in Mixed Doubles")
                
                # Test updating the ranking
                test_ranking = 5
                update_data = {
                    'player_id': test_reg['player_id'],
                    'event_name': 'Mixed Doubles',
                    'ranking': test_ranking
                }
                
                print(f"📝 Updating ranking to {test_ranking}...")
                update_response = requests.post(
                    f"{BASE_URL}/api/partners/update-ranking",
                    json=update_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                if update_response.status_code == 200:
                    print("✅ Ranking updated successfully!")
                    
                    # Verify the update
                    verify_response = requests.get(f"{BASE_URL}/api/admin/registrations")
                    if verify_response.status_code == 200:
                        updated_registrations = verify_response.json()
                        updated_reg = next((r for r in updated_registrations 
                                          if r['player_id'] == test_reg['player_id'] 
                                          and r['event_name'] == 'Mixed Doubles'), None)
                        
                        if updated_reg and updated_reg['ranking'] == test_ranking:
                            print(f"✅ Verification successful! New ranking: {updated_reg['ranking']}")
                        else:
                            print(f"❌ Verification failed! Expected: {test_ranking}, Got: {updated_reg['ranking'] if updated_reg else 'None'}")
                    else:
                        print(f"❌ Failed to verify update: {verify_response.status_code}")
                else:
                    print(f"❌ Failed to update ranking: {update_response.status_code}")
                    print(f"Response: {update_response.text}")
            else:
                print("ℹ️ No teams found without rankings to test")
                
        else:
            print(f"❌ Failed to get registrations: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during test: {e}")

if __name__ == "__main__":
    print("Starting Mixed Doubles ranking test...")
    test_mixed_doubles_ranking()
    print("Test completed!") 