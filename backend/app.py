from flask import Flask
from db import get_db_connection
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config

app = Flask(__name__)
from flask import request, make_response

@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = make_response()
        response.status_code = 200
        return response

app.config['JWT_SECRET_KEY'] = Config.JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = Config.JWT_ACCESS_TOKEN_EXPIRES

# Initialize JWT
jwt = JWTManager(app)

# Configure CORS
CORS(
    app,
    origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:8080", "http://localhost:8081",
        "http://localhost:8082", "http://localhost:8083",
        "uttrakhand-tennis-association-git-main-parth-chandnas-projects.vercel.app",
        "uttrakhand-tennis-association-hg76fqlnk-parth-chandnas-projects.vercel.app",
        "uttrakhand-tennis-association-5l5m.vercel.app"
    ],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    supports_credentials=True,
)

# Register blueprints
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

# Health check route
@app.route('/api/health', methods=['GET'])
def health_check():
    return {'status': 'healthy', 'message': 'Server is running'}

# Debug DB connection
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

# Optional: Base route for Render
@app.route('/', methods=['GET'])
def root():
    return {'message': 'Welcome to the Uttrakhand Tennis Association API'}

if __name__ == '__main__':
    print("Starting Flask server...")
    print("Available routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule.rule} [{', '.join(rule.methods)}]")
    app.run(debug=True, host='0.0.0.0', port=5000)
