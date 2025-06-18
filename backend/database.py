
import mysql.connector
from mysql.connector import Error
from config import Config

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            **Config.DB_CONFIG,
            use_unicode=True,
            charset='utf8'
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None
