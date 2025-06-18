
from flask import Blueprint, request, jsonify
from database import get_db_connection
from mysql.connector import Error

partners_bp = Blueprint('partners', __name__)

@partners_bp.route('', methods=['POST'])
def create_partner():
    data = request.get_json()
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
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
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@partners_bp.route('/available/<event_name>/<int:current_user_id>', methods=['GET'])
def get_available_partners(event_name, current_user_id):
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        # Use the stored procedure
        cursor.callproc('GetAvailablePartners', [event_name, current_user_id])
        
        # Fetch results from the stored procedure
        partners = []
        for result in cursor.stored_results():
            partners = result.fetchall()
        
        return jsonify(partners)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@partners_bp.route('/update-relationship', methods=['POST'])
def update_partner_relationship():
    data = request.get_json()
    event_name = data.get('event_name')
    user1_id = data.get('user1_id')
    user2_id = data.get('user2_id')
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        # Use the stored procedure
        cursor.callproc('UpdatePartnerRelationship', [event_name, user1_id, user2_id])
        connection.commit()
        return jsonify({'message': 'Partner relationship updated successfully'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()

@partners_bp.route('/register-events', methods=['POST'])
def register_player_for_events():
    data = request.get_json()
    player_id = data.get('player_id')
    event1_name = data.get('event1_name')
    partner1_id = data.get('partner1_id')
    event2_name = data.get('event2_name')
    partner2_id = data.get('partner2_id')
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        # Use the stored procedure
        cursor.callproc('RegisterPlayerForEvents', [
            player_id, event1_name, partner1_id, event2_name, partner2_id
        ])
        connection.commit()
        return jsonify({'message': 'Player registered for events successfully'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()
@partners_bp.route('/update-ranking', methods=['POST'])
def update_ranking():
    data = request.get_json()
    player_id = data.get('player_id')
    event_name = data.get('event_name')
    ranking = data.get('ranking')
    
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        query = """
        UPDATE tbl_partners 
        SET ranking = %s 
        WHERE user_id = %s AND event_name = %s
        """
        cursor.execute(query, (ranking, player_id, event_name))
        connection.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'No matching registration found to update'}), 404
            
        return jsonify({'message': 'Ranking updated successfully'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        connection.close()