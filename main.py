from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import sqlite3
import bcrypt
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "users.db"

# Veritabanını kur
def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin BOOLEAN NOT NULL DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Veri Modelleri
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# 1. KAYIT OLMA SİSTEMİ
@app.post("/api/register")
def register_user(user: UserRegister, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT * FROM users WHERE email=?", (user.email,))
    if c.fetchone():
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")
    
    hashed_pw = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    is_admin = 1 if user.email == "admin@modukeys.com" else 0
    
    c.execute("INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)",
              (user.name, user.email, hashed_pw, is_admin))
    db.commit()
    return {"message": "Kayıt başarıyla oluşturuldu. Giriş yapabilirsiniz."}

# 2. GİRİŞ YAPMA SİSTEMİ
@app.post("/api/login")
def login_user(user: UserLogin, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT * FROM users WHERE email=?", (user.email,))
    db_user = c.fetchone()
    
    if not db_user or not bcrypt.checkpw(user.password.encode('utf-8'), db_user['password'].encode('utf-8')):
        raise HTTPException(status_code=400, detail="E-posta veya şifre hatalı.")
    
    return {
        "message": "Giriş başarılı!", 
        "user_name": db_user['name'],
        "user_email": db_user['email'],
        "is_admin": bool(db_user['is_admin'])
    }

# ==========================================
# 3. YÖNETİCİ (ADMİN) İŞLEMLERİ
# ==========================================

# Kullanıcı listesini getirir
@app.get("/api/admin/users")
def get_all_users(db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT id, name, email, is_admin FROM users")
    users = [{"id": row['id'], "name": row['name'], "email": row['email'], "is_admin": bool(row['is_admin'])} for row in c.fetchall()]
    return users

# İstenen kullanıcıyı (ID ile) siler
@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: sqlite3.Connection = Depends(get_db)):
    c = db.cursor()
    c.execute("SELECT is_admin FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı.")
    if row['is_admin']:
        raise HTTPException(status_code=400, detail="Admin kullanıcısı silinemez.")
        
    c.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()
    return {"message": "Kullanıcı başarıyla silindi."}

# ==========================================

# Statik dosyaları (HTML, CSS, JS) sunmak için
app.mount("/", StaticFiles(directory=".", html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8082, reload=True)
