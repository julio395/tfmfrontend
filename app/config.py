import os
from dotenv import load_dotenv
import secrets

load_dotenv()

# Generar claves secretas
flask_secret_key = secrets.token_hex(32)
jwt_secret_key = secrets.token_hex(32)

print("=== Claves generadas ===")
print(f"SECRET_KEY={flask_secret_key}")
print(f"JWT_SECRET_KEY={jwt_secret_key}")
print("======================")

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', flask_secret_key)
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', jwt_secret_key)
    JWT_ALGORITHM = 'HS256'
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hora en segundos 