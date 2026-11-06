# 🌐 Backend REST API Service

A lightweight, zero-dependency Node.js HTTP microservice providing game session telemetry, server-side score verification, global leaderboards, and contact form processing for Mini Game Arcade.

---

## 🚀 Running The Backend

```bash
cd backend
npm start
```
Default port: `http://localhost:4000`

---

## 📡 REST API Endpoints

### 1. Health Status
* **Endpoint:** `GET /health`
* **Response:**
  ```json
  {
    "status": "healthy",
    "service": "mini-game-arcade-api",
    "uptimeSeconds": 42.5,
    "timestamp": "2026-11-07T02:00:00.000Z"
  }
  ```

### 2. Record Session
* **Endpoint:** `POST /api/sessions`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "gameId": "fruit-slice",
    "score": 145,
    "durationSeconds": 48.2,
    "difficulty": "standard"
  }
  ```

### 3. Fetch Leaderboard
* **Endpoint:** `GET /api/leaderboard/:gameId`
* **Parameters:** `gameId` (`fruit-slice` or `memory-match`)

### 4. Submit Contact
* **Endpoint:** `POST /api/contact`
* **Body:**
  ```json
  {
    "name": "Alex",
    "email": "alex@example.com",
    "subject": "Arcade Feedback",
    "message": "Love the fruit slicing physics!"
  }
  ```

