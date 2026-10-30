import os
from dotenv import load_dotenv

# Cargar variables del archivo .env (debe estar en backend/.env)
load_dotenv()

class Config:
    """
    Configuración central de la aplicación.
    Todas las variables sensibles se leen desde el .env para no exponerlas en el código.
    """

    # --- Base de datos ---
    # Por defecto usa SQLite local; en producción docker-compose.prod.yml provee DATABASE_URL (Postgres)
    # Algunos proveedores usan el esquema 'postgres://' pero SQLAlchemy requiere 'postgresql://'
    _db_url = os.getenv('DATABASE_URL', 'sqlite:///ecommerce.db')
    if _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql://', 1)
    # SQLAlchemy 2.1 usa psycopg (v3) por defecto con 'postgresql://'; el proyecto instala psycopg2
    if _db_url.startswith('postgresql://'):
        _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # Desactiva señales innecesarias de SQLAlchemy

    # --- Seguridad ---
    # Si no hay SECRET_KEY en el .env, se genera una aleatoria (no persistente entre reinicios)
    _secret = os.getenv('SECRET_KEY')
    _jwt_secret = os.getenv('JWT_SECRET_KEY') or _secret
    if not _secret:
        import secrets
        _secret = secrets.token_hex(32)
    if not _jwt_secret:
        import secrets
        _jwt_secret = secrets.token_hex(32)
    SECRET_KEY = _secret
    JWT_SECRET_KEY = _jwt_secret
    JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', '24'))

    # --- CORS ---
    # Orígenes permitidos separados por coma en el .env. Ej: http://localhost:3000,https://miweb.com
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')

    # --- Uploads de imágenes ---
    # En producción docker-compose.prod.yml fija UPLOAD_FOLDER=/app/uploads (volumen persistente)
    # En desarrollo local: guarda en frontend/public/Images
    _default_upload = os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'public', 'Images')
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', _default_upload)

    # --- Correo electrónico (Flask-Mail via Gmail) ---
    # Para activar: configurar MAIL_USERNAME y MAIL_PASSWORD (App Password de Google) en el .env
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME', '')
    MAIL_RECIPIENT = os.getenv('MAIL_RECIPIENT', 'dbohorkz@gmail.com')

    # --- Resend (servicio de correo) ---
    RESEND_API_KEY = os.getenv('RESEND_API_KEY', '')
    MAIL_RECIPIENT = os.getenv('MAIL_RECIPIENT', 'dbohorkz@gmail.com')

    # --- Admin ---
    ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')

    # --- Cloudinary (almacenamiento de imágenes) ---
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')

    # --- Integraciones opcionales ---
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')  # Para el chatbot con IA (no activo aún)
