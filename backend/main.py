from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sqlite3
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join("data", "news.db")

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

# ==========================================
# 1. 新聞 API
# ==========================================
@app.get("/api/news")
def get_news():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM news ORDER BY published_at DESC")
    news_list = cursor.fetchall()
    conn.close()
    return news_list

# ==========================================
# 2. 星座 API (從資料庫讀取爬蟲抓來的資料)
# ==========================================
@app.get("/api/horoscope")
def get_horoscope(zodiac: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM horoscopes WHERE zodiac = ?", (zodiac,))
    data = cursor.fetchone()
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
# 3. 天氣 API (先使用內部寫死的 Demo 資料)
# ==========================================
@app.get("/api/weather")
def get_weather(region: str = "全球"):
    weather_db = {
        "全球": [{"area": "台北", "weather": "多雲", "temp": "28°C", "rain": "30%"}, {"area": "東京", "weather": "晴", "temp": "26°C", "rain": "10%"}],
        "台灣": [{"area": "台北", "weather": "多雲", "temp": "28°C", "rain": "30%"}, {"area": "台中", "weather": "晴", "temp": "29°C", "rain": "20%"}, {"area": "高雄", "weather": "晴", "temp": "31°C", "rain": "10%"}],
        "美國": [{"area": "紐約", "weather": "陰", "temp": "22°C", "rain": "25%"}, {"area": "舊金山", "weather": "晴", "temp": "20°C", "rain": "5%"}],
        "亞洲": [{"area": "東京", "weather": "晴", "temp": "26°C", "rain": "10%"}, {"area": "首爾", "weather": "多雲", "temp": "24°C", "rain": "20%"}],
        "歐洲": [{"area": "巴黎", "weather": "多雲", "temp": "19°C", "rain": "20%"}, {"area": "倫敦", "weather": "陰", "temp": "17°C", "rain": "35%"}]
    }
    # 找不到地區就回傳全球的資料
    return weather_db.get(region, weather_db["全球"])