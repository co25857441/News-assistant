from fastapi import Body, FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5501", "http://localhost:5501"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DATA_DIR, "news_live.db")
os.makedirs(DATA_DIR, exist_ok=True)

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def ensure_settings_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)
    cursor.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
        ("ai_news_summary", "0"),
    )
    conn.commit()
    conn.close()

def read_ai_summary_setting():
    ensure_settings_table()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key = ?", ("ai_news_summary",))
    row = cursor.fetchone()
    conn.close()
    return bool(row and row[0] == "1")

# ==========================================
# 1. 新聞 API
# ==========================================
@app.get("/api/news")
def get_news():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT *
            FROM (
                SELECT
                    news.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY category
                        ORDER BY published_at DESC, popularity DESC, id DESC
                    ) AS category_rank
                FROM news
            )
            WHERE category_rank <= 20
            ORDER BY published_at DESC, popularity DESC
        """)
        news_list = cursor.fetchall()
    except sqlite3.OperationalError:
        news_list = []
    conn.close()
    return news_list

@app.get("/api/settings")
def get_settings():
    return {"ai_news_summary": read_ai_summary_setting()}

@app.post("/api/settings/ai-summary")
def update_ai_summary(payload: dict = Body(...)):
    enabled = bool(payload.get("enabled"))
    ensure_settings_table()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """,
        ("ai_news_summary", "1" if enabled else "0"),
    )
    conn.commit()
    conn.close()
    return {"ai_news_summary": enabled}

# ==========================================
# 2. 星座 API (從資料庫讀取爬蟲抓來的資料)
# ==========================================
@app.get("/api/horoscope")
def get_horoscope(zodiac: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM horoscopes WHERE zodiac = ?", (zodiac,))
        data = cursor.fetchone()
    except sqlite3.OperationalError:
        data = None
    conn.close()
    
    # 如果資料庫還沒爬到該星座，給一個預設值防呆
    if not data:
        return {
            "sign": zodiac, "symbol": "✦", 
            "work": 3, "money": 3, "health": 3, "love": 3, 
            "tip": "今日運勢平穩，請保持好心情！"
        }
    
    # 配合前端需要的格式
    data["sign"] = data["zodiac"]
    return data

# ==========================================
# 3. 天氣 API (優先讀取 test.py 寫入的真實天氣資料)
# ==========================================
@app.get("/api/weather")
def get_weather(region: str = "台灣"):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    try:
        if region == "台灣":
            cursor.execute("SELECT region AS area, weather, temp, rain FROM weather ORDER BY updated_at DESC LIMIT 3")
            rows = cursor.fetchall()
        else:
            cursor.execute("SELECT region AS area, weather, temp, rain FROM weather WHERE region = ?", (region,))
            rows = cursor.fetchall()
    except sqlite3.OperationalError:
        rows = []
    conn.close()
    if rows:
        return rows

    city_weather = {
        "台北市": {"area": "台北市", "weather": "多雲", "temp": "28°C", "rain": "30%"},
        "新北市": {"area": "新北市", "weather": "多雲", "temp": "28°C", "rain": "35%"},
        "桃園市": {"area": "桃園市", "weather": "多雲", "temp": "29°C", "rain": "25%"},
        "台中市": {"area": "台中市", "weather": "晴", "temp": "29°C", "rain": "20%"},
        "台南市": {"area": "台南市", "weather": "晴", "temp": "31°C", "rain": "15%"},
        "高雄市": {"area": "高雄市", "weather": "晴", "temp": "31°C", "rain": "10%"},
        "基隆市": {"area": "基隆市", "weather": "短暫雨", "temp": "27°C", "rain": "45%"},
        "新竹市": {"area": "新竹市", "weather": "多雲", "temp": "29°C", "rain": "20%"},
        "嘉義市": {"area": "嘉義市", "weather": "晴", "temp": "31°C", "rain": "15%"},
        "新竹縣": {"area": "新竹縣", "weather": "多雲", "temp": "28°C", "rain": "25%"},
        "苗栗縣": {"area": "苗栗縣", "weather": "多雲", "temp": "28°C", "rain": "25%"},
        "彰化縣": {"area": "彰化縣", "weather": "晴", "temp": "30°C", "rain": "20%"},
        "南投縣": {"area": "南投縣", "weather": "午後雷陣雨", "temp": "29°C", "rain": "50%"},
        "雲林縣": {"area": "雲林縣", "weather": "晴", "temp": "31°C", "rain": "15%"},
        "嘉義縣": {"area": "嘉義縣", "weather": "晴", "temp": "31°C", "rain": "15%"},
        "屏東縣": {"area": "屏東縣", "weather": "晴", "temp": "32°C", "rain": "20%"},
        "宜蘭縣": {"area": "宜蘭縣", "weather": "短暫雨", "temp": "27°C", "rain": "45%"},
        "花蓮縣": {"area": "花蓮縣", "weather": "多雲", "temp": "28°C", "rain": "30%"},
        "台東縣": {"area": "台東縣", "weather": "晴", "temp": "29°C", "rain": "20%"},
        "澎湖縣": {"area": "澎湖縣", "weather": "晴", "temp": "29°C", "rain": "10%"},
        "金門縣": {"area": "金門縣", "weather": "晴", "temp": "28°C", "rain": "10%"},
        "連江縣": {"area": "連江縣", "weather": "多雲", "temp": "26°C", "rain": "20%"},
    }
    if region in city_weather:
        return [city_weather[region]]
    if region == "台灣":
        return [city_weather["台北市"], city_weather["台中市"], city_weather["高雄市"]]
    return [city_weather["台北市"]]
