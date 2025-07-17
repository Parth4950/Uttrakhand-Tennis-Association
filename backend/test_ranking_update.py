#!/usr/bin/env python3
"""
Test script for ranking updates
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_ranking_updates():
    """Test ranking updates for players with multiple events"""
    print("Testing ranking updates...")
    
    # First login as admin
    login_data = {
        "username": "admin",
        "password": "uta2025"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        if response.status_code != 200:
            print("Login failed")
            return
        
        token = response.json()['access_token']
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get all registrations
        response = requests.get(f"{BASE_URL}/api/admin/registrations", headers=headers)
        if response.status_code != 200:
            print("Failed to get registrations")
            return
        
        registrations = response.json()
        print(f"Got {len(registrations)} registrations")
        
        # Find a player with multiple events
        player_events = {}
        for reg in registrations:
            player_id = reg['player_id']
            if player_id not in player_events:
                player_events[player_id] = []
            player_events[player_id].append(reg)
        
        # Find a player with multiple events
        multi_event_player = None
        for player_id, events in player_events.items():
            if len(events) > 1:
                multi_event_player = events[0]
                break
        
        if not multi_event_player:
            print("No player found with multiple events")
            return
        
        player_id = multi_event_player['player_id']
        player_name = multi_event_player['player_name']
        print(f"Testing with player: {player_name} (ID: {player_id})")
        
        # Test updating rankings for each event
        for event in player_events[player_id]:
            event_name = event['event_name']
            current_ranking = event.get('ranking')
            
            print(f"  Testing event: {event_name} (current ranking: {current_ranking})")
            
            # Try to update ranking
            new_ranking = 10 if not current_ranking else current_ranking + 1
            ranking_data = {
                "player_id": player_id,
                "event_name": event_name,
                "ranking": new_ranking
            }
            
            response = requests.post(f"{BASE_URL}/api/partners/update-ranking", json=ranking_data)
            print(f"    Update status: {response.status_code}")
            
            if response.status_code == 200:
                print(f"    Successfully updated ranking to {new_ranking}")
            else:
                print(f"    Failed: {response.text}")
        
        # Verify the updates
        print("\n Verifying updates...")
        response = requests.get(f"{BASE_URL}/api/admin/registrations", headers=headers)
        if response.status_code == 200:
            updated_registrations = response.json()
            for reg in updated_registrations:
                if reg['player_id'] == player_id:
                    print(f"  {reg['event_name']}: Ranking {reg.get('ranking', 'None')}")
        
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_ranking_updates() 