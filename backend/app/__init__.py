import logging
import os
from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.config import Config

# Configuración del logger para toda la aplicación
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# Instancias globales de extensiones — se inicializan dentro de create_app()
db = SQLAlchemy()
mail = Mail()
limiter = Limiter(key_func=get_remote_address, default_limits=[])


def create_app():
    """
    Factory de la aplicación Flask.
    Inicializa extensiones, registra blueprints y crea las tablas de la BD.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar extensiones con la app
    db.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)

    # Permitir peticiones desde el frontend (CORS_ORIGINS viene del .env)
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Headers de seguridad HTTP en todas las respuestas
    @app.after_request
    def set_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response

    # Servir imágenes subidas desde /Images/
    @app.route('/Images/<path:filename>')
    def serve_image(filename):
        upload_folder = app.config.get('UPLOAD_FOLDER')
        os.makedirs(upload_folder, exist_ok=True)
        return send_from_directory(upload_folder, filename)

    # Healthcheck para Docker / monitoreo
    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    # Registrar blueprints (grupos de rutas)
    from app.routes import auth_bp, products_bp, chatbot_bp, orders_bp, testimonials_bp, customers_bp, catalog_bp
    app.register_blueprint(auth_bp)          # /api/auth/
    app.register_blueprint(products_bp)      # /api/products/
    app.register_blueprint(chatbot_bp)       # /api/chatbot/
    app.register_blueprint(orders_bp)        # /api/orders/
    app.register_blueprint(testimonials_bp)  # /api/testimonials/
    app.register_blueprint(customers_bp)     # /api/customers/
    app.register_blueprint(catalog_bp)       # /api/catalog/

    # Crear tablas si no existen y agregar columnas nuevas a tablas existentes
    with app.app_context():
        db.create_all()
        _run_migrations()

    logger.info('App creada correctamente')
    return app


def _run_migrations():
    """Agrega columnas nuevas a tablas existentes si no existen (PostgreSQL + SQLite)."""
    from sqlalchemy import inspect, text

    inspector = inspect(db.engine)

    migrations = [
        ('products', 'sizes', "VARCHAR(500) DEFAULT ''"),
        ('products', 'colors', "VARCHAR(500) DEFAULT ''"),
        ('order_items', 'size', "VARCHAR(50) DEFAULT ''"),
        ('order_items', 'color', "VARCHAR(50) DEFAULT ''"),
        ('orders', 'customer_id', "INTEGER"),
        ('orders', 'contingente', "VARCHAR(50) DEFAULT ''"),
        ('orders', 'source', "VARCHAR(20) DEFAULT 'web'"),
    ]

    for table, column, col_type in migrations:
        if not inspector.has_table(table):
            continue
        existing_cols = [c['name'] for c in inspector.get_columns(table)]
        if column not in existing_cols:
            try:
                with db.engine.begin() as conn:
                    conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {column} {col_type}'))
                logger.info(f'Migración: agregada columna {column} a {table}')
            except Exception as e:
                logger.warning(f'No se pudo agregar {column} a {table}: {e}')
