#範例爬蟲假資料，實際爬取邏輯請依照目標網站結構調整
import sqlite3
import os
from datetime import datetime

# 指向 backend 的資料庫位置
DB_PATH = os.path.join("..", "backend", "data", "news.db")

def save_news_to_db(news_item):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO news (title, summary, category, region, source, source_url, image_url, published_at, popularity)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            news_item['title'], news_item['summary'], news_item['category'], 
            news_item['region'], news_item['source'], news_item['source_url'],
            news_item['image_url'], datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            news_item.get('popularity', 50)
        ))
        conn.commit()
        print(f"✅ 成功新增新聞: {news_item['title']}")
    except sqlite3.IntegrityError:
        pass # 新聞已存在，略過
    finally:
        conn.close()

# ==========================================
# 新增：儲存星座運勢到資料庫
# ==========================================
def save_horoscope_to_db(h_item):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        # 使用 REPLACE INTO，如果星座已經存在就覆蓋更新（保持最新的一筆）
        cursor.execute('''
            REPLACE INTO horoscopes (zodiac, symbol, work, money, health, love, tip, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            h_item['zodiac'], h_item['symbol'], h_item['work'], h_item['money'],
            h_item['health'], h_item['love'], h_item['tip'], 
            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        ))
        conn.commit()
        print(f"🌟 成功更新星座運勢: {h_item['zodiac']}")
    except Exception as e:
        print(f"❌ 發生錯誤: {e}")
    finally:
        conn.close()

def run_crawler():
    print("啟動綜合爬蟲 (新聞 + 星座)...")
    
    # 1. 爬新聞 (此處為假資料，後續請替換為 BeautifulSoup 真實爬蟲)
    mock_news = [
        {
            "title": "台南深夜米糕老店！粒粒分明不膩口",
            "summary": "微焦蚵仔煎勾芡極少更涮嘴，吸引大量排隊人潮。",
            "category": "美食文化", "region": "台灣", "source": "美食快報",
            "source_url": "https://example.com/news/3",
            "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=600&q=80",
            "popularity": 92
        },
        {
            "title": "全球暖化加劇！北極冰層融化速度創新高",
            "summary": "科學家警告，若不立即減碳，未來幾十年內將面臨嚴重氣候災難。",
            "category": "環境氣候", "region": "全球", "source": "環境周刊",
            "source_url": "https://example.com/news/4",
            "image_url": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
            "popularity": 88
        },
        {
            "title": "台積電創新高！AI 伺服器需求持續強勁",
            "summary": "受到生成式 AI 發展帶動，國內半導體大廠訂單爆滿，股價再度刷新歷史紀錄。",
            "category": "科技AI",
            "region": "台灣",
            "source": "科技新聞網",
            "source_url": "https://example.com/news/1",
            "image_url": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
            "popularity": 99
        },
        {
            "title": "全球碳排放最新報告：減少速度仍未達標",
            "summary": "聯合國發布年度氣候報告，呼籲各國應加快綠能轉型腳步。",
            "category": "環境氣候",
            "region": "全球",
            "source": "環境周刊",
            "source_url": "https://example.com/news/2",
            "image_url": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80",
            "popularity": 85
        }
    ]
    for item in mock_news:
        save_news_to_db(item)

    # 2. 爬星座 (此處為假資料，後續請替換為 BeautifulSoup 真實爬蟲)
    mock_horoscopes = [
        {"zodiac": "牡羊座", "symbol": "♈", "work": 4, "money": 3, "health": 4, "love": 3, "tip": "火星能量強勁，適合展開計畫，今天主動出擊會很有收穫。"},
        {"zodiac": "金牛座", "symbol": "♉", "work": 4, "money": 4, "health": 3, "love": 3, "tip": "穩定中有小突破，務實安排支出與行程，效率會特別好。"},
        # 可以自己補齊其他星座...
    ]
    for item in mock_horoscopes:
        save_horoscope_to_db(item)
        
    print("爬蟲執行完畢。")

if __name__ == "__main__":
    if not os.path.exists(DB_PATH):
        print("找不到資料庫，請先執行 backend/init_db.py")
    else:
        run_crawler()