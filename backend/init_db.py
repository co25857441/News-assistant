import sqlite3
import os

DB_DIR = "data"
DB_PATH = os.path.join(DB_DIR, "news.db")

def init_db():
    if not os.path.exists(DB_DIR):
        os.makedirs(DB_DIR)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 1. 建立新聞資料表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            summary TEXT,
            category TEXT,
            region TEXT,
            source TEXT,
            source_url TEXT UNIQUE,
            image_url TEXT,
            published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            popularity INTEGER DEFAULT 0
        )
    ''')
    
    # 2. 建立星座運勢資料表 (新增這段)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS horoscopes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            zodiac TEXT UNIQUE,
            symbol TEXT,
            work INTEGER,
            money INTEGER,
            health INTEGER,
            love INTEGER,
            tip TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ 資料庫初始化完成！(包含新聞與星座資料表)")

if __name__ == "__main__":
    init_db()