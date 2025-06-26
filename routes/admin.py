from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from db import get_db_connection  # Adjust import if needed

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/registrations', methods=['GET'])
@jwt_required()
def get_all_registrations():
    connection = None
    cursor = None

    try:
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

        # Convert to list of dictionaries
        columns = [desc[0] for desc in cursor.description]
        registrations = [dict(zip(columns, row)) for row in rows]

        return jsonify(registrations)

    except Exception as e:
        print(f"Database error: {e}")
        return jsonify({'error': str(e)}), 500

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
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("SELECT * FROM event_statistics")
        rows = cursor.fetchall()

        columns = [desc[0] for desc in cursor.description]
        statistics = [dict(zip(columns, row)) for row in rows]

        return jsonify(statistics)

    except Exception as e:
        print(f"Statistics error: {e}")
        return jsonify({'error': str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
