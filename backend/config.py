import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

class Config:
    """Base configuration settings."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'default-dev-secret-key-12345')
    FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
    
    # Maximum upload size: default 16MB
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    
    # Firebase settings
    FIREBASE_CREDENTIALS_PATH = os.environ.get('FIREBASE_CREDENTIALS_PATH', 'config/firebase-key.json')
    FIREBASE_STORAGE_BUCKET = os.environ.get('FIREBASE_STORAGE_BUCKET')
    
    # Groq settings
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')

class DevelopmentConfig(Config):
    """Development configuration settings."""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Testing configuration settings."""
    DEBUG = True
    TESTING = True
    SECRET_KEY = 'test-secret-key'

class ProductionConfig(Config):
    """Production configuration settings."""
    DEBUG = False
    TESTING = False

# Map config names to config classes
config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig
}

def get_config(config_name=None):
    """Retrieve config class by environment name."""
    if not config_name:
        config_name = os.environ.get('FLASK_ENV', 'development')
    return config_by_name.get(config_name, DevelopmentConfig)

def verify_startup_config():
    """Validates configuration parameters at application boot, logging warnings or raising errors on invalid setups."""
    import logging
    log = logging.getLogger(__name__)
    
    env = os.environ.get('FLASK_ENV', 'development')
    groq_key = os.environ.get('GROQ_API_KEY')
    bucket_name = os.environ.get('FIREBASE_STORAGE_BUCKET')
    
    if env == 'production':
        missing = []
        if not groq_key or groq_key.startswith("gsk_your_groq"):
            missing.append("GROQ_API_KEY")
        if not bucket_name:
            missing.append("FIREBASE_STORAGE_BUCKET")
            
        if missing:
            critical_err = f"CRITICAL Startup Failure: Missing required production credentials: {', '.join(missing)}"
            log.critical(critical_err)
            raise ValueError(critical_err)
    else:
        # Development warnings
        if not groq_key or groq_key.startswith("gsk_your_groq"):
            log.warning("System Boot Alert: GROQ_API_KEY is not configured. StudyAI will run on simulated LLM outputs.")
        if not bucket_name:
            log.warning("System Boot Alert: FIREBASE_STORAGE_BUCKET is not configured. StudyAI will fall back to local in-memory states.")
