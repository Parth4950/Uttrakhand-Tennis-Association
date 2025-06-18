from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from database import get_db_connection
from mysql.connector import Error

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        # Simple admin login for demo
        if username == 'admin' and password == 'uta2025':
            access_token = create_access_token(identity=username)
            return jsonify({
                'access_token': access_token,
                'user': {'username': username, 'role': 'admin'}
            })
        
        return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@auth_bp.route('/user-login', methods=['POST'])
def user_login():
    connection = None
    cursor = None
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        whatsapp = data.get('whatsapp')
        date_of_birth = data.get('date_of_birth')
        
        if not whatsapp or not date_of_birth:
            return jsonify({'error': 'WhatsApp number and date of birth are required'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = connection.cursor(dictionary=True, buffered=True)
        
        # Find user by WhatsApp and date of birth
        cursor.execute(
            "SELECT * FROM tbl_players WHERE whatsapp_number = %s AND date_of_birth = %s", 
            (whatsapp, date_of_birth)
        )
        user = cursor.fetchone()
        
        if user:
            # Close the first cursor and create a new one for the second query
            cursor.close()
            cursor = connection.cursor(dictionary=True, buffered=True)
            
            # Get detailed dashboard data for the user
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
            """, (user['id'],))
            events = cursor.fetchall()
            
            cursor.close()
            cursor = None
            
            return jsonify({
                'success': True,
                'user': {
                    'player': user,
                    'events': events
                }
            })
        else:
            cursor.close()
            cursor = None
            return jsonify({'error': 'Invalid WhatsApp number or date of birth'}), 401
            
    except Error as e:
         print(f"Database error: {e}")
         return jsonify({'error': 'Database error occurred'}), 500
    except Exception as e:
        print(f"User login error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
