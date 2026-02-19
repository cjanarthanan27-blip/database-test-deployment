# Water Tracker - LAN Migration & Server Setup Guide

This guide explains how to move the Water Tracker project to another PC and set it up as a server so that other users on the same Local Area Network (LAN) can access the website.

## Prerequisites on the New PC
Before moving the files, ensure the new PC has the following installed:
1. **Python (3.10+)**: Required for the Django backend.
2. **Node.js**: Required for the Vite frontend.
3. **Git** (Optional): Useful for cloning but not strictly required if transferring via USB.

---

## Step 1: Transfer Project Files
1. Copy the entire `DatabaseTest` folder to the new PC.
2. Place it in a simple path like `C:\DatabaseTest` or `D:\DatabaseTest`.

---

## Step 2: Install Dependencies
Run these commands in the terminal inside the project directory:

### Backend Setup
```powershell
# Navigate to the project root
pip install -r requirements.txt
```

### Frontend Setup
```powershell
cd apps/water_tracker/frontend
npm install
```

---

## Step 3: Find the New PC's IP Address
Other users will connect using this IP.
1. Open Command Prompt (`cmd`).
2. Type `ipconfig` and press Enter.
3. Look for **IPv4 Address** (e.g., `192.168.1.50`). **Note this down.**

---

## Step 4: Update Configuration for LAN Access

### A. Update Frontend API URL
The frontend needs to know where the backend is located.
1. Open `apps/water_tracker/frontend/src/services/api.js`.
2. Change `API_URL` from `localhost` to the new IP address:
```javascript
// Change this line:
const API_URL = 'http://192.168.1.50:8000/api/'; // Replace with your IP
```

### B. Update Backend Settings
1. Open `rathinamHR/settings.py`.
2. Update `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`:
```python
# In rathinamHR/settings.py
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "YOUR_NEW_IP", "*"]
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://YOUR_NEW_IP:5173",
]
```

### C. Update Startup Script (Optional)
Open `start_servers.bat` and update the echo messages so they show the correct URL to your users.

---

## Step 5: Windows Firewall Setup
To allow other PCs to connect, you must allow ports **8000** and **5173** through the firewall:
1. Search for "Windows Defender Firewall with Advanced Security".
2. Go to **Inbound Rules** -> **New Rule**.
3. Select **Port** -> **TCP**.
4. Enter `8000, 5173` in "Specific local ports".
5. Select **Allow the connection**.
6. Name it "Water Tracker LAN Access".

---

## Step 6: Start the Servers
Use the existing batch file:
```powershell
./start_servers.bat
```

---

## How Other Users Connect
Other users on your network can now open their browser and go to:
`http://YOUR_NEW_SERVER_IP:5173`
