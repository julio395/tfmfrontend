import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MongoDB Configuration
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'tfm')

    # Appwrite Configuration
    APPWRITE_ENDPOINT = os.getenv('APPWRITE_ENDPOINT')
    APPWRITE_PROJECT_ID = os.getenv('APPWRITE_PROJECT_ID')
    APPWRITE_API_KEY = os.getenv('APPWRITE_API_KEY')

    # Server Configuration
    PORT = int(os.getenv('PORT', 5000))
    DEBUG = os.getenv('NODE_ENV') == 'development' 