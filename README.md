# 🚀 CRM Dashboard

Hệ thống quản lý CRM Dashboard (Products, Categories, Users...)

---

## 📦 Tech Stack

* Frontend: React + TypeScript
* Backend: Node.js + Express
* Database: (MongoDB / MySQL / PostgreSQL)

---

## ⚙️ Setup Project

### 1. Clone repository

```bash
git clone <your-repo-url>
cd crm-dashboard
```

---

### 2. Cài đặt dependencies

```bash
npm install
```

---

## ▶️ Run Project

### 🔹 Chạy Backend Server

```bash
npm run server
```

---

### 🔹 Chạy Frontend

```bash
npm run dev
```

---

### 🔹 Chạy Database

> ⚠️ Tùy theo loại database bạn đang dùng:

#### Nếu dùng MongoDB:

```bash
mongod
```

#### Nếu dùng MySQL:

```bash
sudo service mysql start
```

---

## 🌿 Git Workflow

```bash
main
 └── crm-dashboard
      └── feature/*
```

* Tạo branch mới từ `crm-dashboard`
* Tạo Pull Request để merge
* Yêu cầu approve trước khi merge

---

## 📁 Folder Structure

```
src/
 ├── assets/
 ├── components/
 ├── pages/
 ├── services/
 ├── hooks/
 ├── store/
 ├── utils/
 ├── types/
 ├── layouts/
 └── config/
```

---

## 🧑‍💻 Scripts

| Command        | Description      |
| -------------- | ---------------- |
| npm run dev    | Chạy frontend    |
| npm run server | Chạy backend     |
| npm run build  | Build production |

---

## 📌 Notes

* Không push trực tiếp lên `crm-dashboard`
* Luôn tạo Pull Request trước khi merge
* Code phải pass review trước khi merge

---

## 📄 License

MIT License
