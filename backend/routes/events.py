from flask import Blueprint, jsonify
from database import get_db_connection
from mysql.connector import Error

events_bp = Blueprint('events', __name__)

@events_bp.route('', methods=['GET'])
def get_events():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM tbl_eventname ORDER BY event_name")
        events = cursor.fetchall()
        return jsonify(events)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()
