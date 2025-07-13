#!/usr/bin/env python3
"""
Debug script to check registrations in the database
"""
from db import get_db_connection

def check_registrations():
    """Check all registrations in the database"""
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        if not connection:
            print("❌ Database connection failed")
            return
        
        cursor = connection.cursor()
        
        # Check all players
        print("🔍 Checking all players...")
        cursor.execute("SELECT id, name, whatsapp_number FROM tbl_players ORDER BY id")
        players = cursor.fetchall()
        print(f"Found {len(players)} players:")
        for player in players:
            print(f"  Player {player[0]}: {player[1]} ({player[2]})")
        
        # Check all events
        print("\n🔍 Checking all events...")
        cursor.execute("SELECT event_name FROM tbl_eventname ORDER BY event_name")
        events = cursor.fetchall()
        print(f"Found {len(events)} events:")
        for event in events:
            print(f"  - {event[0]}")
        
        # Check all registrations
        print("\n🔍 Checking all registrations...")
        cursor.execute("""
            SELECT 
                p.id as player_id,
                p.name as player_name,
                pt.event_name,
                pt.partner_id,
                pt.ranking,
                partner.name as partner_name
            FROM tbl_players p
            INNER JOIN tbl_partners pt ON p.id = pt.user_id
            LEFT JOIN tbl_players partner ON pt.partner_id = partner.id
            ORDER BY p.name, pt.event_name
        """)
        registrations = cursor.fetchall()
        
        print(f"Found {len(registrations)} registrations:")
        for reg in registrations:
            partner_info = f" (Partner: {reg[5]})" if reg[5] else " (No partner)"
            ranking_info = f" [Ranking: {reg[4]}]" if reg[4] else " [No ranking]"
            print(f"  {reg[1]} (ID: {reg[0]}) -> {reg[2]}{partner_info}{ranking_info}")
        
        # Check players with multiple events
        print("\n🔍 Checking players with multiple events...")
        cursor.execute("""
            SELECT 
                p.id as player_id,
                p.name as player_name,
                COUNT(pt.event_name) as event_count,
                GROUP_CONCAT(pt.event_name ORDER BY pt.event_name) as events
            FROM tbl_players p
            INNER JOIN tbl_partners pt ON p.id = pt.user_id
            GROUP BY p.id, p.name
            HAVING COUNT(pt.event_name) > 1
            ORDER BY p.name
        """)
        multi_event_players = cursor.fetchall()
        
        if multi_event_players:
            print(f"Found {len(multi_event_players)} players with multiple events:")
            for player in multi_event_players:
                print(f"  {player[1]} (ID: {player[0]}): {player[2]} events - {player[3]}")
        else:
            print("No players found with multiple events")
            
    except Exception as e:
        print(f"❌ Error checking registrations: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

def check_specific_player(player_id):
    """Check registrations for a specific player"""
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        if not connection:
            print("❌ Database connection failed")
            return
        
        cursor = connection.cursor()
        
        # Get player info
        cursor.execute("SELECT id, name, whatsapp_number FROM tbl_players WHERE id = %s", (player_id,))
        player = cursor.fetchone()
        if not player:
            print(f"❌ Player with ID {player_id} not found")
            return
        
        print(f"🔍 Checking registrations for player {player[1]} (ID: {player[0]}):")
        
        # Get all registrations for this player
        cursor.execute("""
            SELECT 
                pt.event_name,
                pt.partner_id,
                pt.ranking,
                partner.name as partner_name
            FROM tbl_partners pt
            LEFT JOIN tbl_players partner ON pt.partner_id = partner.id
            WHERE pt.user_id = %s
            ORDER BY pt.event_name
        """, (player_id,))
        registrations = cursor.fetchall()
        
        if registrations:
            print(f"Found {len(registrations)} registrations:")
            for reg in registrations:
                partner_info = f" (Partner: {reg[3]})" if reg[3] else " (No partner)"
                ranking_info = f" [Ranking: {reg[2]}]" if reg[2] else " [No ranking]"
                print(f"  {reg[0]}{partner_info}{ranking_info}")
        else:
            print("No registrations found for this player")
            
    except Exception as e:
        print(f"❌ Error checking player registrations: {e}")
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()

if __name__ == "__main__":
    print("🚀 Starting registration debug...")
    check_registrations()
    
    # You can also check a specific player by uncommenting the line below
    # check_specific_player(1)  # Replace 1 with the actual player ID 