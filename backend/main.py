from fastapi import Body, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
#from passlib.context import CryptContext
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
import json

app = FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key="change-this-secret-key"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500", "http://127.0.0.1:5501", "http://localhost:5501"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DATA_DIR, "news_live.db")
USER_DB_PATH = os.path.join(DATA_DIR, "user.db")
os.makedirs(DATA_DIR, exist_ok=True)
#pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
#password_hash = generate_password_hash(schemes=["bcrypt"], deprecated="auto")

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

def ensure_users_table():
    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            interests TEXT DEFAULT '[]',
            region TEXT DEFAULT '',
            zodiac TEXT DEFAULT '',
            ai_news_summary INTEGER DEFAULT 0
        )
    """)
    cursor.execute("PRAGMA table_info(users)")
    user_columns = {row[1] for row in cursor.fetchall()}
    for column, definition in {
        "interests": "TEXT DEFAULT '[]'",
        "region": "TEXT DEFAULT ''",
        "zodiac": "TEXT DEFAULT ''",
        "ai_news_summary": "INTEGER DEFAULT 0",
    }.items():
        if column not in user_columns:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {column} {definition}")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bookmarks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            news_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, news_id),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    conn.commit()
    conn.close()

def get_current_user_id(request: Request):
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    return int(user_id)

def parse_interests(value):
    try:
        data = json.loads(value or "[]")
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []

def serialize_prefs(row):
    if not row:
        return {"interests": [], "region": "", "zodiac": "", "ai_news_summary": False}
    return {
        "interests": parse_interests(row.get("interests")),
        "region": row.get("region") or "",
        "zodiac": row.get("zodiac") or "",
        "ai_news_summary": bool(row.get("ai_news_summary")),
    }

# ==========================================
# 0. 使用者登入 / 註冊 API
# ==========================================

@app.post("/api/register")
def register(payload: dict = Body(...)):
    ensure_users_table()

    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    if not name or not email or not password:
        return {
            "success": False,
            "message": "請完整填寫姓名、Email 和密碼"
        }

    if len(password) < 6:
        return {
            "success": False,
            "message": "密碼至少需要 6 個字元"
        }

    password_hash = generate_password_hash(password)

    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (name, email, password_hash)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return {
            "success": False,
            "message": "這個 Email 已經註冊過了"
        }

    conn.close()

    return {
        "success": True,
        "message": "註冊成功"
    }


@app.post("/api/login")
def login(request: Request, payload: dict = Body(...)):
    ensure_users_table()

    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    conn = sqlite3.connect(USER_DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    )
    user = cursor.fetchone()
    conn.close()

    if not user:
        return {
            "success": False,
            "message": "帳號或密碼錯誤"
        }

    if not check_password_hash(user["password_hash"], password):
        return {
            "success": False,
            "message": "帳號或密碼錯誤"
        }

    request.session["user_id"] = user["id"]
    request.session["user_name"] = user["name"]
    request.session["user_email"] = user["email"]

    return {
        "success": True,
        "message": "登入成功",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"]
        }
    }

@app.get("/api/me")
def me(request: Request):
    if "user_id" not in request.session:
        return {
            "logged_in": False
        }

    return {
        "logged_in": True,
        "user": {
            "id": request.session["user_id"],
            "name": request.session["user_name"],
            "email": request.session["user_email"]
        }
    }


@app.post("/api/logout")
def logout(request: Request):
    request.session.clear()

    return {
        "success": True,
        "message": "已登出"
    }

@app.get("/api/me/prefs")
def get_my_prefs(request: Request):
    user_id = get_current_user_id(request)
    if not user_id:
        return {"success": False, "message": "請先登入"}

    ensure_users_table()
    conn = sqlite3.connect(USER_DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("SELECT interests, region, zodiac, ai_news_summary FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return {"success": True, "prefs": serialize_prefs(row)}

@app.put("/api/me/prefs")
def update_my_prefs(request: Request, payload: dict = Body(...)):
    user_id = get_current_user_id(request)
    if not user_id:
        return {"success": False, "message": "請先登入"}

    interests = payload.get("interests") or []
    if not isinstance(interests, list):
        interests = []
    interests = [str(item) for item in interests if str(item).strip()]
    region = str(payload.get("region") or "").strip()
    zodiac = str(payload.get("zodiac") or "").strip()

    ensure_users_table()
    conn = sqlite3.connect(USER_DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()
    cursor.execute("SELECT ai_news_summary FROM users WHERE id = ?", (user_id,))
    existing_user = cursor.fetchone() or {}
    if "ai_news_summary" in payload:
        ai_news_summary = 1 if bool(payload.get("ai_news_summary")) else 0
    else:
        ai_news_summary = int(existing_user.get("ai_news_summary") or 0)
    cursor.execute(
        "UPDATE users SET interests = ?, region = ?, zodiac = ?, ai_news_summary = ? WHERE id = ?",
        (json.dumps(interests, ensure_ascii=False), region, zodiac, ai_news_summary, user_id),
    )
    conn.commit()
    conn.close()
    return {
        "success": True,
        "prefs": {
            "interests": interests,
            "region": region,
            "zodiac": zodiac,
            "ai_news_summary": bool(ai_news_summary),
        },
    }

@app.get("/api/me/bookmarks")
def get_my_bookmarks(request: Request):
    user_id = get_current_user_id(request)
    if not user_id:
        return {"success": False, "message": "請先登入", "bookmarks": []}

    ensure_users_table()
    user_conn = sqlite3.connect(USER_DB_PATH)
    user_cursor = user_conn.cursor()
    user_cursor.execute(
        "SELECT news_id FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC, id DESC",
        (user_id,),
    )
    news_ids = [row[0] for row in user_cursor.fetchall()]
    user_conn.close()

    if not news_ids:
        return {"success": True, "bookmarks": []}

    placeholders = ",".join("?" for _ in news_ids)
    news_conn = sqlite3.connect(DB_PATH)
    news_conn.row_factory = dict_factory
    news_cursor = news_conn.cursor()
    try:
        news_cursor.execute(f"SELECT * FROM news WHERE id IN ({placeholders})", news_ids)
        rows = news_cursor.fetchall()
    except sqlite3.OperationalError:
        rows = []
    news_conn.close()

    news_by_id = {int(row["id"]): row for row in rows}
    bookmarks = [news_by_id[news_id] for news_id in news_ids if news_id in news_by_id]
    return {"success": True, "bookmarks": bookmarks}

@app.post("/api/me/bookmarks/{news_id}")
def add_my_bookmark(request: Request, news_id: int):
    user_id = get_current_user_id(request)
    if not user_id:
        return {"success": False, "message": "請先登入"}

    ensure_users_table()
    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR IGNORE INTO bookmarks (user_id, news_id) VALUES (?, ?)",
        (user_id, news_id),
    )
    conn.commit()
    conn.close()
    return {"success": True, "news_id": news_id}

@app.delete("/api/me/bookmarks/{news_id}")
def remove_my_bookmark(request: Request, news_id: int):
    user_id = get_current_user_id(request)
    if not user_id:
        return {"success": False, "message": "請先登入"}

    ensure_users_table()
    conn = sqlite3.connect(USER_DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM bookmarks WHERE user_id = ? AND news_id = ?",
        (user_id, news_id),
    )
    conn.commit()
    conn.close()
    return {"success": True, "news_id": news_id}

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
def get_settings(request: Request):
    user_id = get_current_user_id(request)
    if user_id:
        ensure_users_table()
        conn = sqlite3.connect(USER_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT ai_news_summary FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row is not None:
            return {"ai_news_summary": bool(row[0])}
    return {"ai_news_summary": read_ai_summary_setting()}

@app.post("/api/settings/ai-summary")
def update_ai_summary(request: Request, payload: dict = Body(...)):
    enabled = bool(payload.get("enabled"))
    user_id = get_current_user_id(request)
    if user_id:
        ensure_users_table()
        user_conn = sqlite3.connect(USER_DB_PATH)
        user_cursor = user_conn.cursor()
        user_cursor.execute(
            "UPDATE users SET ai_news_summary = ? WHERE id = ?",
            (1 if enabled else 0, user_id),
        )
        user_conn.commit()
        user_conn.close()

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
            "overall": 3, "love": 3, "career": 3, "wealth": 3, 
            "tip": "今日運勢平穩，請保持好心情！"
        }
    
    # 配合前端需要的格式
    data["sign"] = data["zodiac"]
    data["overall"] = data.get("overall") or data.get("health") or 3
    data["love"] = data.get("love") or 3
    data["career"] = data.get("career") or data.get("work") or 3
    data["wealth"] = data.get("wealth") or data.get("money") or 3
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
