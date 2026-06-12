#初始專案結構
news-assistant/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── style.css       
├── js/
│   ├── store.js      (負責管理 localStorage 與全域變數狀態)
│   ├── api.js        (負責所有與後端溝通的 fetch 請求)
│   ├── ui.js         (負責產出 HTML 字串的純函式元件)
│   └── main.js       (主程式：負責事件監聽、初始化、控制流程)  
│
├── backend/
│   ├── main.py             (先用範例：FastAPI 伺服器)
│   ├── init_db.py          (先用範例：初始化 SQLite 資料庫腳本)
│   └── requirements.txt    (先用範例：後端套件清單)
│
└── crawler/
    ├── crawler.py          (先用範例：Python 爬蟲腳本)
    └── requirements.txt    (先用範例：爬蟲套件清單)


#本機端運行流程
1. Terminal 1
cd backend
pip install -r requirements.txt
python init_db.py         # 初始化生成 data/news.db
python -m uvicorn main:app --reload # 啟動 FastAPI，預設在 port 8000

2. Terminal 2
cd crawler
pip install -r requirements.txt
python crawler.py         # 抓取資料寫入剛剛建好的資料庫
![alt text](image-1.png)

3. Terminal 3
至 frontend/index.html 中右鍵使用 VSCode 的 Live Server 套件啟動

