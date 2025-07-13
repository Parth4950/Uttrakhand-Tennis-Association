from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from db import get_db_connection  # ✅ update this to match your folder structure

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
        
        # Simple admin login
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
        whatsapp = data.get('whatsapp', '').strip()
        date_of_birth = data.get('date_of_birth', '').strip()
        
        if not whatsapp or not date_of_birth:
            return jsonify({'error': 'WhatsApp number and date of birth are required'}), 400
        
        # Normalize WhatsApp number (remove spaces and ensure +91 prefix)
        whatsapp = whatsapp.replace(' ', '')
        if whatsapp.startswith('91') and len(whatsapp) == 12:
            whatsapp = '+' + whatsapp
        elif whatsapp.startswith('6') and len(whatsapp) == 10:
            whatsapp = '+91' + whatsapp
        
        print(f"[DEBUG] Login attempt - WhatsApp: {whatsapp}, DOB: {date_of_birth}")
        
        connection = get_db_connection()
        if not connection:
            print("[ERROR] Database connection failed")
            return jsonify({'error': 'Database connection failed. Please try again later.'}), 500
            
        cursor = connection.cursor()
        
        # First, try exact match
        cursor.execute(
            "SELECT * FROM tbl_players WHERE whatsapp_number = %s AND date_of_birth = %s", 
            (whatsapp, date_of_birth)
        )
        result = cursor.fetchone()
        
        if not result:
            # Try without +91 prefix
            if whatsapp.startswith('+91'):
                whatsapp_alt = whatsapp[3:]
                cursor.execute(
                    "SELECT * FROM tbl_players WHERE whatsapp_number = %s AND date_of_birth = %s", 
                    (whatsapp_alt, date_of_birth)
                )
                result = cursor.fetchone()
        
        if not result:
            # Try with +91 prefix
            if not whatsapp.startswith('+91') and len(whatsapp) == 10:
                whatsapp_alt = '+91' + whatsapp
                cursor.execute(
                    "SELECT * FROM tbl_players WHERE whatsapp_number = %s AND date_of_birth = %s", 
                    (whatsapp_alt, date_of_birth)
                )
                result = cursor.fetchone()
        
        if result:
            columns = [desc[0] for desc in cursor.description]
            user = dict(zip(columns, result))
            print(f"[DEBUG] User found: {user['name']} (ID: {user['id']})")

            cursor.close()
            cursor = connection.cursor()

            cursor.execute("""
                SELECT 
                    pt.event_name,
                    pt.partner_id,
                    IFNULL(partner.name, 'No partner assigned') as partner_name,
                    pt.ranking
                FROM tbl_partners pt
                LEFT JOIN tbl_players partner ON pt.partner_id = partner.id
                WHERE pt.user_id = %s
                ORDER BY pt.event_name
            """, (user['id'],))

            events_result = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description]
            events = [dict(zip(columns, row)) for row in events_result]

            print(f"[DEBUG] Found {len(events)} events for user")

            return jsonify({
                'success': True,
                'user': {
                    'player': user,
                    'events': events
                }
            })
        else:
            print(f"[DEBUG] No user found for WhatsApp: {whatsapp}, DOB: {date_of_birth}")
            return jsonify({'error': 'Invalid WhatsApp number or date of birth'}), 401
            
    except Exception as e:
        print(f"[ERROR] Login error: {e}")
        return jsonify({'error': 'Internal server error. Please try again later.'}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
