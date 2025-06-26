# db.py
import pymysql
from config import Config

def get_db_connection():
    connection = pymysql.connect(**Config.DB_CONFIG)
    return connection
