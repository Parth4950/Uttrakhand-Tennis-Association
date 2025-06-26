
from flask import Flask
from db import get_db_connection
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = Config.JWT_ACCESS_TOKEN_EXPIRES
# Initialize JWT
jwt = JWTManager(app)

# Configure CORS with specific settings - Updated to include port 8083
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:8083"], 
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"])

# Import and register blueprints
try:
    from routes.auth import auth_bp
    from routes.events import events_bp
    from routes.players import players_bp
    from routes.partners import partners_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(events_bp, url_prefix='/api/events')
    app.register_blueprint(players_bp, url_prefix='/api/players')
    app.register_blueprint(partners_bp, url_prefix='/api/partners')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    print("All blueprints registered successfully")
except ImportError as e:
    print(f"Error importing blueprints: {e}")

@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'message': 'Server is running'}

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Available routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
    app.run(debug=True, host='0.0.0.0', port=5000)
@app.route('/api/debug-db', methods=['GET'])
def debug_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT DATABASE();")
        db = cur.fetchone()
        cur.close()
        conn.close()
        return {'connected_to': db[0]}
    except Exception as e:
        return {'error': str(e)}

