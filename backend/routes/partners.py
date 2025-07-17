from flask import Blueprint, request, jsonify
from db import get_db_connection  

partners_bp = Blueprint('partners', __name__)

@partners_bp.route('', methods=['POST'])
def create_partner():
    data = request.get_json()
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        query = """
        INSERT INTO tbl_partners (event_name, user_id, partner_id)
        VALUES (%s, %s, %s)
        """
        values = (
            data.get('event_name'),
            data.get('user_id'),
            data.get('partner_id')
        )
        cursor.execute(query, values)
        connection.commit()
        return jsonify({'message': 'Partner entry created successfully', 'id': cursor.lastrowid})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()


@partners_bp.route('/available/<event_name>/<int:current_user_id>', methods=['GET'])
def get_available_partners(event_name, current_user_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        print(f"Calling procedure GetAvailablePartners with: event='{event_name}', user_id={current_user_id}")
        cursor.callproc('GetAvailablePartners', [event_name, current_user_id])

        # Try logging the stored results
        result = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description]
        partners = [dict(zip(columns, row)) for row in result]

        return jsonify(partners)

    except Exception as e:
        print("Error in get_available_partners:", str(e))
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()





@partners_bp.route('/update-relationship', methods=['POST'])
def update_partner_relationship():
    data = request.get_json()
    event_name = data.get('event_name')
    user1_id = data.get('user1_id')
    user2_id = data.get('user2_id')

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc('UpdatePartnerRelationship', [event_name, user1_id, user2_id])
        connection.commit()
        return jsonify({'message': 'Partner relationship updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()


@partners_bp.route('/register-events', methods=['POST'])
def register_player_for_events():
    data = request.get_json()
    player_id = data.get('player_id')
    event1_name = data.get('event1_name')
    partner1_id = data.get('partner1_id')
    event2_name = data.get('event2_name')
    partner2_id = data.get('partner2_id')

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc('RegisterPlayerForEvents', [
            player_id, event1_name, partner1_id, event2_name, partner2_id
        ])
        connection.commit()
        return jsonify({'message': 'Player registered for events successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()


@partners_bp.route('/update-ranking', methods=['POST'])
def update_ranking():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    player_id = data.get('player_id')
    event_name = data.get('event_name')
    ranking = data.get('ranking')

    # Validate input data
    if not player_id or not isinstance(player_id, int) or player_id <= 0:
        return jsonify({'error': 'Valid player ID is required'}), 400
    
    if not event_name or not isinstance(event_name, str) or not event_name.strip():
        return jsonify({'error': 'Valid event name is required'}), 400
    
    if not ranking or not isinstance(ranking, int) or ranking <= 0 or ranking > 1000:
        return jsonify({'error': 'Ranking must be a positive number between 1 and 1000'}), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        
        cursor.execute("SELECT id, name FROM tbl_players WHERE id = %s", (player_id,))
        player = cursor.fetchone()
        if not player:
            return jsonify({'error': f'Player with ID {player_id} not found'}), 404
        
        cursor.execute("SELECT event_name FROM tbl_eventname WHERE event_name = %s", (event_name,))
        event = cursor.fetchone()
        if not event:
            return jsonify({'error': f'Event "{event_name}" not found'}), 404
        
        # Check if the registration exists
        check_query = """
        SELECT id FROM tbl_partners 
        WHERE user_id = %s AND event_name = %s
        """
        cursor.execute(check_query, (player_id, event_name))
        existing = cursor.fetchone()
        
        if not existing:
            return jsonify({'error': f'Player {player[1]} (ID: {player_id}) is not registered for event "{event_name}"'}), 404

        # Update the ranking
        query = """
        UPDATE tbl_partners 
        SET ranking = %s 
        WHERE user_id = %s AND event_name = %s
        """
        cursor.execute(query, (ranking, player_id, event_name))
        connection.commit()

        if cursor.rowcount == 0:
            return jsonify({'error': 'No matching registration found to update'}), 404

        print(f"Successfully updated ranking for player {player[1]} (ID: {player_id}) in event {event_name} to {ranking}")
        return jsonify({'message': 'Ranking updated successfully'})
        
    except Exception as e:
        print(f"Error updating ranking: {e}")
        if connection:
            connection.rollback()
        return jsonify({'error': f'Database error: {str(e)}'}), 500
        
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@partners_bp.route('/delete-all/<int:player_id>', methods=['DELETE'])
def delete_all_partners_for_player(player_id):
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("DELETE FROM tbl_partners WHERE user_id = %s", (player_id,))
        connection.commit()
        return jsonify({'message': 'All event registrations deleted for player', 'player_id': player_id})
    except Exception as e:
        if connection:
            connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
