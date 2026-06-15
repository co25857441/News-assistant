# 新聞小助手 News Assistant

新聞小助手是一個前後端分離的個人化新聞網站。前端使用JavaScript 模組化撰寫，後端使用 FastAPI 提供 API，資料儲存在 SQLite，並由獨立 Python 爬蟲腳本定期抓取新聞、天氣與星座資料。

## 特色功能

- 個人化 onboarding：選擇興趣、台灣縣市與星座。
- 今日推薦新聞：依照使用者興趣與新聞熱度排序。
- 熱門新聞：顯示爬蟲抓到的熱門分類新聞。
- 新聞搜尋與標籤篩選：支援標題、摘要、分類、地區搜尋。
- 收藏新聞：目前使用 localStorage 保存收藏清單與快照。
- 已讀新聞視覺回饋：點開新聞後會在 localStorage 記錄已讀狀態。
- 天氣與星座：由爬蟲寫入 SQLite，再由 FastAPI 提供給前端。
- AI 摘要開關：可在個性化設定中控制爬蟲是否呼叫 OpenAI API 產生摘要。

## 目前程式碼架構

```text
news-assistant/
├─ frontend/
│  ├─ index.html
│  ├─ css/
│  │  └─ style.css
│  ├─ js/
│  │  ├─ api.js        # 前端 API 呼叫
│  │  ├─ main.js       # 前端事件、狀態流程、畫面切換
│  │  ├─ store.js      # 前端狀態與 localStorage
│  │  └─ ui.js         # HTML render functions
│  └─ *.png, *.jpg     # 背景圖、welcome 圖片等
├─ backend/
│  ├─ main.py          # FastAPI API，目前集中處理 news/weather/horoscope/settings
│  ├─ requirements.txt
│  └─ data/
│     └─ news_live.db  # SQLite database
├─ crawler/
│  ├─ test.py          # 爬蟲、資料清理、SQLite 寫入、OpenAI 摘要呼叫
│  └─ requirements.txt
├─ requirements.txt    # 專案整體 Python 依賴
├─ .env                # 本機環境變數，不提交 git
└─ README.md
```

## Tech Stack

- Frontend：HTML、CSS、Vanilla JavaScript ES Modules
- Backend：FastAPI、Uvicorn
- Database：SQLite
- Crawler：Python、Requests、BeautifulSoup4
- External APIs：Open-Meteo、OpenAI Responses API
- Local persistence：Browser localStorage
- Future auth-ready packages：Passlib、PyJWT、python-multipart、email-validator

## Local Setup & Run

### 1. 建立 Python 虛擬環境

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

如果只想分開安裝，也可以使用：

```powershell
pip install -r backend\requirements.txt
pip install -r crawler\requirements.txt
```

### 2. 設定環境變數

在專案根目錄建立 `.env`，或在終端機設定環境變數：

```env
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4o-mini
```

專案使用 `python-dotenv` 在爬蟲啟動時自動讀取根目錄 `.env`，再透過環境變數取得 `OPENAI_API_KEY` 與 `OPENAI_MODEL`。`.env` 已加入 `.gitignore`，不會被提交到版本控制。若沒有設定 API key，爬蟲會使用備用摘要，不會呼叫 OpenAI。

### 3. 初始化資料庫與爬蟲資料

爬蟲會自動建立 `backend/data/news_live.db`，並建立下列表格：

- `news`
- `horoscopes`
- `weather`
- `settings`

執行：

```powershell
python crawler\test.py
```

### 4. 啟動 FastAPI 後端

```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```

API 預設位置：

```text
http://127.0.0.1:8000/api
```

主要 API：

- `GET /api/news`
- `GET /api/weather?region=台中市`
- `GET /api/horoscope?zodiac=牡羊座`
- `GET /api/settings`
- `POST /api/settings/ai-summary`

### 5. 啟動前端

前端是靜態頁面，可以使用 VS Code Live Server 開啟：

```text
frontend/index.html
```

目前後端 CORS 允許：

- `http://127.0.0.1:5500`
- `http://localhost:5500`
- `http://127.0.0.1:5501`
- `http://localhost:5501`

## 登入與註冊功能整併策略

目前專案尚未真正接上登入後端；前端收藏、偏好與已讀狀態主要存在 localStorage。整併夥伴的登入功能時，建議照以下順序進行。

### 1. 先確認對方提供的合約

請先向夥伴確認：

- 使用的資料庫：SQLite、PostgreSQL、MySQL 或其他。
- 使用者表格欄位：`id`, `email`, `password_hash`, `name`, `created_at` 等。
- API 路由：例如 `/auth/register`, `/auth/login`, `/auth/me`, `/auth/logout`。
- Token 格式：JWT access token、refresh token、session cookie。
- 密碼雜湊方式：bcrypt、argon2 或其他。
- 前端 token 儲存方式：localStorage、sessionStorage、HttpOnly cookie。

### 2. 後端整併建議

建議把登入 API 拆成獨立 router：

```text
backend/routers/auth.py
backend/services/auth_service.py
backend/models/user.py
backend/core/security.py
```

如果對方也是 FastAPI：

1. 將她的 auth router 掛到目前 `app`：
   ```python
   app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
   ```
2. 把資料庫連線統一到同一個 `database.py`。
3. 把密碼雜湊、JWT 建立與驗證集中到 `core/security.py`。

如果對方使用不同框架，建議保留你目前 FastAPI 作為統一 API 入口，將登入邏輯移植成 FastAPI router，不要讓前端同時呼叫兩個後端。

### 3. 資料庫衝突處理

如果雙方都使用 SQLite：

- 優先合併到同一個 `backend/data/news_live.db`。
- 新增 `users` 與 `bookmarks` 表格，不要修改 `news` 主資料太多。
- 建議表格：
  ```sql
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE bookmarks (
    user_id INTEGER NOT NULL,
    news_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, news_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (news_id) REFERENCES news(id)
  );
  ```

如果對方使用 PostgreSQL：

- 短期：先保留 SQLite 給新聞爬蟲，PostgreSQL 給 auth，但後端 API 要統一。
- 中期：將新聞、收藏、使用者資料全部遷移到 PostgreSQL。
- 長期：使用 ORM 或 migration 工具管理 schema，避免手寫 SQL 分散在各檔案。

### 4. 前端 token 與狀態整併

建議新增：

```text
frontend/js/auth.js
```

職責：

- `login(email, password)`
- `register(payload)`
- `logout()`
- `getCurrentUser()`
- token 儲存與清除

如果使用 JWT：

- 開發期可先放 localStorage：`newsHelper_token`
- 正式環境建議改為 HttpOnly Secure Cookie，降低 XSS 風險

登入後，收藏功能應從 localStorage 遷移到後端：

- 未登入：可暫存在 localStorage
- 登入後：同步 localStorage 收藏到 `bookmarks`
- 登入狀態下：收藏、取消收藏都呼叫 API

## 建議重構方向

目前 `backend/main.py` 和 `crawler/test.py` 都承載太多職責。專案變大後，建議拆成以下結構。

```text
news-assistant/
├─ frontend/
│  ├─ index.html
│  ├─ css/
│  │  └─ style.css
│  └─ js/
│     ├─ api.js
│     ├─ auth.js
│     ├─ main.js
│     ├─ store.js
│     └─ ui.js
├─ backend/
│  ├─ app.py
│  ├─ database.py
│  ├─ core/
│  │  ├─ config.py
│  │  └─ security.py
│  ├─ routers/
│  │  ├─ auth.py
│  │  ├─ news.py
│  │  ├─ weather.py
│  │  ├─ horoscope.py
│  │  └─ settings.py
│  ├─ services/
│  │  ├─ auth_service.py
│  │  ├─ news_service.py
│  │  └─ settings_service.py
│  ├─ schemas/
│  │  ├─ auth.py
│  │  └─ news.py
│  └─ data/
│     └─ news_live.db
├─ crawler/
│  ├─ main.py
│  ├─ config.py
│  ├─ db.py
│  ├─ parsers/
│  │  ├─ ltn.py
│  │  └─ cosmopolitan.py
│  ├─ services/
│  │  ├─ ai_summary.py
│  │  ├─ weather.py
│  │  └─ crawler_runner.py
│  └─ repositories/
│     ├─ news_repository.py
│     ├─ horoscope_repository.py
│     └─ weather_repository.py
├─ requirements.txt
└─ README.md
```

### Backend 拆分職責

- `backend/app.py`：建立 FastAPI app、掛載 middleware 與 routers。
- `backend/database.py`：集中管理 DB path、連線、row factory。
- `backend/core/config.py`：環境變數與設定。
- `backend/core/security.py`：密碼雜湊、JWT encode/decode、token 驗證。
- `backend/routers/news.py`：`/api/news`。
- `backend/routers/weather.py`：`/api/weather`。
- `backend/routers/horoscope.py`：`/api/horoscope`。
- `backend/routers/settings.py`：AI 摘要設定 API。
- `backend/routers/auth.py`：登入、註冊、取得目前使用者。
- `backend/services/*`：商業邏輯，不直接寫在 router 裡。
- `backend/schemas/*`：Pydantic request/response models。

### Crawler 拆分職責

- `crawler/main.py`：爬蟲入口。
- `crawler/config.py`：分類 URL、星座 URL、天氣座標、OpenAI 設定。
- `crawler/db.py`：建立資料表、取得連線。
- `crawler/parsers/ltn.py`：新聞列表、新聞圖片、摘要來源解析。
- `crawler/parsers/cosmopolitan.py`：星座解析與雜訊過濾。
- `crawler/services/ai_summary.py`：OpenAI 摘要與備用摘要。
- `crawler/services/weather.py`：Open-Meteo API。
- `crawler/repositories/*`：寫入 `news`、`horoscopes`、`weather`。

## Requirements 說明

根目錄 `requirements.txt` 是完整開發用依賴，包含目前程式碼會用到的套件，以及整合登入功能建議使用的資安套件。

目前登入尚未接後端，因此以下套件是 auth-ready：

- `passlib[bcrypt]`：密碼雜湊。
- `PyJWT`：JWT token。
- `python-multipart`：FastAPI 表單登入常用。
- `email-validator`：Pydantic EmailStr 驗證常用。
- `python-dotenv`：讀取 `.env`。

如果暫時只跑現有功能，最少需要：

- `fastapi`
- `uvicorn`
- `requests`
- `beautifulsoup4`
- `streamlit`
