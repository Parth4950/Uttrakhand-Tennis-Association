from flask import Blueprint, jsonify
from db import get_db_connection  

events_bp = Blueprint('events', __name__)

@events_bp.route('', methods=['GET'])
def get_events():
    connection = None
    cursor = None
    
    try:
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500

        cursor = connection.cursor()
        cursor.execute("SELECT * FROM tbl_eventname ORDER BY event_name")
        rows = cursor.fetchall()

        # Convert result to list of dicts
        columns = [desc[0] for desc in cursor.description]
        events = [dict(zip(columns, row)) for row in rows]

        return jsonify(events)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
