from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_db_connection  # Adjust import if needed

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/registrations', methods=['GET'])
@jwt_required()
def get_all_registrations():
    connection = None
    cursor = None

    try:
        # Get the current user identity for logging
        current_user = get_jwt_identity()
        print(f"Admin request from user: {current_user}")

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()

        query = """
        SELECT 
            p.id as player_id,
            p.name as player_name,
            p.whatsapp_number,
            p.email,
            p.city,
            pt.event_name,
            pt.partner_id,
            partner.name as partner_name,
            pt.ranking
        FROM tbl_players p
        INNER JOIN tbl_partners pt ON p.id = pt.user_id
        LEFT JOIN tbl_players partner ON pt.partner_id = partner.id
        ORDER BY p.name, pt.event_name
        """

        cursor.execute(query)
        rows = cursor.fetchall()

        if not rows:
            return jsonify([])

        # Convert to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        registrations = [dict(zip(columns, row)) for row in rows]

        print(f"Successfully retrieved {len(registrations)} registrations")
        return jsonify(registrations)

    except Exception as e:
        print(f"Database error in get_all_registrations: {e}")
        return jsonify({'error': f'Database error: {str(e)}'}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@admin_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_event_statistics():
    connection = None
    cursor = None

    try:
        # Get the current user identity for logging
        current_user = get_jwt_identity()
        print(f"Statistics request from admin: {current_user}")

        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        
        # Check if the view exists, if not create it dynamically
        try:
            cursor.execute("SELECT * FROM event_statistics")
        except Exception as e:
            print(f"Event statistics view not found, creating dynamic query: {e}")
            query = """
            SELECT 
                e.event_name,
                COUNT(DISTINCT pt.user_id) as total_players,
                COUNT(CASE WHEN pt.partner_id IS NOT NULL THEN 1 END) as paired_players,
                COUNT(CASE WHEN pt.partner_id IS NULL THEN 1 END) as unpaired_players
            FROM tbl_eventname e
            LEFT JOIN tbl_partners pt ON e.event_name = pt.event_name
            GROUP BY e.event_name
            ORDER BY e.event_name
            """
            cursor.execute(query)
        
        rows = cursor.fetchall()

        if not rows:
            return jsonify([])

        columns = [desc[0] for desc in cursor.description]
        statistics = [dict(zip(columns, row)) for row in rows]

        print(f"Successfully retrieved statistics for {len(statistics)} events")
        return jsonify(statistics)

    except Exception as e:
        print(f"Statistics error: {e}")
        return jsonify({'error': f'Statistics error: {str(e)}'}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
