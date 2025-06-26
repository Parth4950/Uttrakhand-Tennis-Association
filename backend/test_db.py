import pymysql
from config import Config

conn = pymysql.connect(**Config.DB_CONFIG)
cur = conn.cursor()
cur.execute("SHOW TABLES;")
tables = cur.fetchall()
print(tables)
conn.close()
