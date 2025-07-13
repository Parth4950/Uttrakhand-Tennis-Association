# db.py
import pymysql
from config import Config
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    try:
        connection = pymysql.connect(**Config.DB_CONFIG)
        
        # Test the connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        
        logger.info("Database connection established successfully")
        return connection
        
    except pymysql.Error as e:
        logger.error(f"Database connection failed: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error connecting to database: {e}")
        return None

def test_db_connection():
    """Test function to verify database connectivity"""
    try:
        connection = get_db_connection()
        if connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT DATABASE()")
                db_name = cursor.fetchone()[0]
                logger.info(f"Successfully connected to database: {db_name}")
            connection.close()
            return True
        else:
            logger.error("Failed to establish database connection")
            return False
    except Exception as e:
        logger.error(f"Database test failed: {e}")
        return False
