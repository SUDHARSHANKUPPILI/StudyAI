import os
from app import create_app

# Create Flask application instance
app = create_app()

if __name__ == '__main__':
    # Determine port from env, defaulting to 5000
    port = int(os.environ.get('PORT', 5000))
    # Determine debug mode from Flask settings
    debug = app.config.get('DEBUG', True)
    
    print(f"Starting StudyAI Flask server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=debug)
