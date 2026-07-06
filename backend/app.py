import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
from config import get_config

# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app(config_name=None):
    """Application factory for Flask application."""
    app = Flask(__name__)
    
    # Load configuration settings
    config_class = get_config(config_name)
    app.config.from_object(config_class)
    
    # Validate startup configuration values
    from config import verify_startup_config
    verify_startup_config()
    
    # Setup CORS for API endpoints
    cors_origins = os.environ.get('ALLOWED_CORS_ORIGINS', '*')
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})
    
    # Initialize Firebase Admin SDK
    init_firebase(app)
    
    # Register blueprints for routing
    register_blueprints(app)
    
    # Register global HTTP error handlers
    register_error_handlers(app)
    
    # Base healthcheck route
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'env': app.config['FLASK_ENV'],
            'firebase_initialized': len(firebase_admin._apps) > 0
        }), 200

    @app.route('/', methods=['GET'])
    def index():
        return jsonify({
            'name': 'StudyAI API',
            'version': '1.0.0',
            'description': 'Production-ready educational AI platform backend'
        }), 200

    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        if app.config.get('FLASK_ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response
        
    return app

def register_error_handlers(app):
    """Register custom and default exception handlers."""
    from utils.errors import APIException
    from utils.response import make_error_response
    from werkzeug.exceptions import HTTPException
    
    @app.errorhandler(APIException)
    def handle_api_exception(err):
        logger.error(f"APIException: {err.error_code} - {err.detail}")
        return err.to_response()
        
    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        logger.error(f"HTTPException: {err.name} - {err.description}")
        return make_error_response(
            message=err.description,
            error_code=f"HTTP_{err.code}",
            status_code=err.code
        )

    @app.errorhandler(Exception)
    def handle_unhandled_exception(err):
        logger.error(f"Unhandled Exception: {str(err)}", exc_info=True)
        return make_error_response(
            message="An unexpected error occurred. Please try again later.",
            error_code="INTERNAL_SERVER_ERROR",
            status_code=500
        )

def init_firebase(app):
    """Initializes Firebase Admin SDK."""
    import json
    cred_path = app.config['FIREBASE_CREDENTIALS_PATH']
    bucket_name = app.config['FIREBASE_STORAGE_BUCKET']
    firebase_json_str = os.environ.get('FIREBASE_CREDENTIALS_JSON')
    
    if not firebase_admin._apps:
        try:
            if firebase_json_str:
                logger.info("Initializing Firebase with credentials from FIREBASE_CREDENTIALS_JSON env variable.")
                cred_dict = json.loads(firebase_json_str)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': bucket_name
                })
            elif os.path.exists(cred_path):
                logger.info(f"Initializing Firebase with key from: {cred_path}")
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred, {
                    'storageBucket': bucket_name
                })
            else:
                logger.warning(f"Firebase credentials file not found at {cred_path}. Attempting to use default credentials...")
                try:
                    firebase_admin.initialize_app(options={
                        'storageBucket': bucket_name
                    })
                    logger.info("Firebase initialized with Application Default Credentials.")
                except Exception as adc_err:
                    logger.error(f"Application Default Credentials initialization failed: {adc_err}")
        except Exception as e:
            logger.error(f"Firebase Admin SDK initialization error: {e}")

def register_blueprints(app):
    """Registers Flask blueprints for different api endpoints."""
    try:
        from routes.auth import auth_bp
        from routes.upload import upload_bp
        from routes.summary import summary_bp
        from routes.flashcards import flashcards_bp
        from routes.quiz import quiz_bp
        from routes.schedule import schedule_bp
        from routes.analytics import analytics_bp
        
        app.register_blueprint(auth_bp)
        app.register_blueprint(upload_bp)
        app.register_blueprint(summary_bp)
        app.register_blueprint(flashcards_bp)
        app.register_blueprint(quiz_bp)
        app.register_blueprint(schedule_bp)
        app.register_blueprint(analytics_bp)
        
        logger.info("Successfully registered API blueprints.")
    except ImportError as e:
        logger.error(f"Failed to register blueprints due to import error: {e}")

# Application instantiation
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = app.config.get('DEBUG', True)
    print(f"Starting StudyAI Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)
