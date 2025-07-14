from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from db import get_db_connection  # Adjust path if needed

players_bp = Blueprint('players', __name__)

@players_bp.route('', methods=['POST'])
def create_or_update_player():
    data = request.get_json()   
    print('[DEBUG] Received player update:', data)
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        player_id = data.get('id')  # Only present if editing
        whatsapp = (data.get('whatsapp_number') or '').strip()
        print(f'[DEBUG] Checking for duplicate WhatsApp: {whatsapp}, player_id: {player_id}')

        # Check for duplicate WhatsApp number (exclude current user if editing)
        if player_id:
            cursor.execute("SELECT id FROM tbl_players WHERE whatsapp_number = %s AND id != %s", (whatsapp, player_id))
        else:
            cursor.execute("SELECT id FROM tbl_players WHERE whatsapp_number = %s", (whatsapp,))
        if cursor.fetchone():
            return jsonify({'error': 'WhatsApp number already registered'}), 400

        if player_id:
            # UPDATE existing player
            print('[DEBUG] About to update player:')
            print('  address:', data.get('address'))
            print('  emergency_contact:', data.get('emergency_contact'))
            print('  playing_experience:', data.get('playing_experience'))
            query = """
                UPDATE tbl_players SET
                    name = %s, whatsapp_number = %s, date_of_birth = %s, email = %s, city = %s,
                    shirt_size = %s, short_size = %s, food_pref = %s, stay_y_or_n = %s, fee_paid = %s,
                    address = %s, emergency_contact = %s, playing_experience = %s, medical_conditions = %s
                WHERE id = %s
            """
            values = (
                data.get('name'),
                whatsapp,
                data.get('date_of_birth'),
                data.get('email'),
                data.get('city'),
                data.get('shirt_size'),
                data.get('short_size'),
                data.get('food_pref'),
                data.get('stay_y_or_n', False),
                data.get('fee_paid', False),
                data.get('address'),
                data.get('emergency_contact'),
                data.get('playing_experience'),
                data.get('medical_conditions'),
                player_id
            )
            cursor.execute(query, values)
            connection.commit()
            return jsonify({'message': 'Player updated successfully', 'id': player_id})
        else:
            # INSERT new player
            print('[DEBUG] About to insert player:')
            print('  address:', data.get('address'))
            print('  emergency_contact:', data.get('emergency_contact'))
            print('  playing_experience:', data.get('playing_experience'))
            query = """
                INSERT INTO tbl_players (
                    name, whatsapp_number, date_of_birth, email, city, 
                    shirt_size, short_size, food_pref, stay_y_or_n, fee_paid,
                    address, emergency_contact, playing_experience, medical_conditions
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            values = (
                data.get('name'),
                whatsapp,
                data.get('date_of_birth'),
                data.get('email'),
                data.get('city'),
                data.get('shirt_size'),
                data.get('short_size'),
                data.get('food_pref'),
                data.get('stay_y_or_n', False),
                data.get('fee_paid', False),
                data.get('address'),
                data.get('emergency_contact'),
                data.get('playing_experience'),
                data.get('medical_conditions')
            )
            cursor.execute(query, values)
            connection.commit()
            return jsonify({'message': 'Player created successfully', 'id': cursor.lastrowid})

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()



@players_bp.route('', methods=['GET'])
@jwt_required()
def get_players():
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT * FROM tbl_players ORDER BY created_at DESC")
        rows = cursor.fetchall()

        columns = [desc[0] for desc in cursor.description]
        players = [dict(zip(columns, row)) for row in rows]

        return jsonify(players)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()


@players_bp.route('/dashboard/<int:player_id>', methods=['GET'])
def get_player_dashboard(player_id):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # Get player info
        cursor.execute("SELECT * FROM tbl_players WHERE id = %s", (player_id,))
        player_row = cursor.fetchone()
        if not player_row:
            return jsonify({'error': 'Player not found'}), 404

        columns = [desc[0] for desc in cursor.description]
        player = dict(zip(columns, player_row))

        # Get player's events and partners
        cursor.execute("""
            SELECT 
                pt.event_name,
                pt.partner_id,
                CASE 
                    WHEN pt.partner_id IS NOT NULL THEN partner.name
                    ELSE 'No partner assigned'
                END as partner_name,
                pt.ranking
            FROM tbl_partners pt
            LEFT JOIN tbl_players partner ON pt.partner_id = partner.id
            WHERE pt.user_id = %s
            ORDER BY pt.event_name
        """, (player_id,))
        event_rows = cursor.fetchall()
        event_columns = [desc[0] for desc in cursor.description]
        events = [dict(zip(event_columns, row)) for row in event_rows]

        return jsonify({
            'player': player,
            'events': events
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()
@players_bp.route('/ranking', methods=['PUT'])
def update_ranking():
    data = request.get_json()
    user_id = data.get('user_id')
    event_name = data.get('event_name')
    ranking = data.get('ranking')

    # Validate input
    if not all([user_id, event_name, ranking is not None]):
        return jsonify({'error': 'Missing user_id, event_name, or ranking'}), 400

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.callproc('UpdatePlayerRanking', (user_id, event_name, ranking))
        connection.commit()
        return jsonify({'message': 'Ranking updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        if cursor: cursor.close()
        if connection: connection.close()

@players_bp.route('/<int:player_id>', methods=['PUT'])
def update_player(player_id):
    data = request.get_json()
    print('[DEBUG] PUT update_player:', data)
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        whatsapp = (data.get('whatsapp_number') or '').strip()
        print(f'[DEBUG] PUT Checking for duplicate WhatsApp: {whatsapp}, player_id: {player_id}')
        # Check for duplicate WhatsApp number (exclude current user)
        cursor.execute("SELECT id FROM tbl_players WHERE whatsapp_number = %s AND id != %s", (whatsapp, player_id))
        if cursor.fetchone():
            return jsonify({'error': 'WhatsApp number already registered'}), 400
        # UPDATE existing player
        query = """
            UPDATE tbl_players SET
                name = %s, whatsapp_number = %s, date_of_birth = %s, email = %s, city = %s,
                shirt_size = %s, short_size = %s, food_pref = %s, stay_y_or_n = %s, fee_paid = %s,
                address = %s, emergency_contact = %s, playing_experience = %s, medical_conditions = %s
            WHERE id = %s
        """
        values = (
            data.get('name'),
            whatsapp,
            data.get('date_of_birth'),
            data.get('email'),
            data.get('city'),
            data.get('shirt_size'),
            data.get('short_size'),
            data.get('food_pref'),
            data.get('stay_y_or_n', False),
            data.get('fee_paid', False),
            data.get('address'),
            data.get('emergency_contact'),
            data.get('playing_experience'),
            data.get('medical_conditions'),
            player_id
        )
        cursor.execute(query, values)
        connection.commit()
        return jsonify({'message': 'Player updated successfully', 'id': player_id})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if cursor: cursor.close()
        if connection: connection.close()
