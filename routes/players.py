from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from db import get_db_connection  # Adjust path if needed

players_bp = Blueprint('players', __name__)

@players_bp.route('', methods=['POST'])
def create_player():
    data = request.get_json()
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()
        query = """
        INSERT INTO tbl_players (name, whatsapp_number, date_of_birth, email, city, 
                                 shirt_size, short_size, food_pref, stay_y_or_n, fee_paid)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data.get('name'),
            data.get('whatsapp_number'),
            data.get('date_of_birth'),
            data.get('email'),
            data.get('city'),
            data.get('shirt_size'),
            data.get('short_size'),
            data.get('food_pref'),
            data.get('stay_y_or_n', False),
            data.get('fee_paid', False)
        )
        cursor.execute(query, values)
        connection.commit()
        player_id = cursor.lastrowid
        return jsonify({'message': 'Player created successfully', 'id': player_id})
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
