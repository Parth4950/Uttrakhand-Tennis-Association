from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from database import get_db_connection
from mysql.connector import Error

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/registrations', methods=['GET'])
@jwt_required()
def get_all_registrations():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
         # Query to get all player registrations with their partners
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
        registrations = cursor.fetchall()
        return jsonify(registrations)
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@admin_bp.route('/statistics', methods=['GET'])
@jwt_required()
def get_event_statistics():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM event_statistics")
        statistics = cursor.fetchall()
        return jsonify(statistics)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()
