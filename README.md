# HEATSENSE.AI 🌡️🤖
### Urban Heat Survival Planner & Microclimate Intelligence System

HEATSENSE.AI (also known as *Thermal Mind*) is an advanced microclimate planning and logistics system designed to mitigate the effects of the **Urban Heat Island (UHI)** effect. Focused on the metropolitan region of Bengaluru, the application aggregates real-time weather metrics, simulates thermal stress levels, models cooling interventions, and coordinates cooling resource logistics.

---

## 🚀 Features

- **Interactive Bengaluru Heatmap**: Full Leaflet-based geospatial mapping visualizing ward-level heat, NDVI (green cover), and population densities.
- **3D Heat Wave Visualization**: A stunning 3D simulation of thermal waves rendered in real-time using Three.js, React Three Fiber, and `@react-three/drei`.
- **Real-Time Weather Integration**: Dynamic weather mapping retrieving real-time local temperatures in Bengaluru using the OpenWeatherMap API.
- **Microclimate Simulation Engine**: Model the impact of green roofs, cool pavements, and urban forestry on ward temperature and cooling demands.
- **Twilio SMS Alert System**: WhatsApp and SMS alert integration using Twilio to notify citizens and logistics teams of high heat anomalies.
- **Logistics & Strategic Intervention**: Coordinate water tanker distributions, air quality monitors, and community cooling centers with real-time supply routing.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React (Vite-powered, fast HMR)
- **3D Graphics**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **Geospatial Mapping**: React-Leaflet
- **Animations**: GSAP (GreenSock Animation Platform)
- **Styling**: Vanilla CSS with custom theme design system

### Backend
- **Framework**: FastAPI (Python)
- **Data Engineering**: Pandas, NumPy
- **Communication Services**: Twilio REST API
- **Deployment Server**: Uvicorn

---

## 📦 Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+

### 1. Environment Configuration
Create a `.env` file in the root directory:
```env
# OpenWeatherMap API Key (for real-time Bengaluru weather data)
OPENWEATHER_API_KEY=your_openweathermap_api_key

# Twilio Credentials (for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886
```

### 2. Backend Setup
Navigate to the root directory and install Python packages (e.g., using `pip`):
```bash
pip install fastapi uvicorn pandas numpy twilio
```
Run the FastAPI server:
```bash
python backend/main.py
```
The backend server will run on `http://localhost:8000`. You can access the auto-generated documentation at `http://localhost:8000/docs`.

### 3. Frontend Setup
Install frontend dependencies:
```bash
npm install
```
Start the development server:
```bash
npm run dev
```
The React frontend will be served at `http://localhost:5173`.

---

## 📡 API Endpoints

The FastAPI backend exposes the following core endpoints:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/zones` | `GET` | Returns list of Bengaluru wards with temperature, NDVI, and population |
| `/api/clusters` | `GET` | Identifies heat anomaly clusters and hot-spots |
| `/api/simulate` | `POST` | Simulates temperature reduction based on selected cooling interventions |
| `/api/send-sms` | `POST` | Dispatches WhatsApp alerts using Twilio integration |

---

## 🤝 Contribution

This repository is actively maintained. Contributions, bug reports, and pull requests are welcome!
