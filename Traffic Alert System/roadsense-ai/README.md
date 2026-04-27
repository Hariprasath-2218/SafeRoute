# RoadSense AI — Real-Time Traffic Accident Prediction Platform

Production-style full-stack application: **React 18 + Vite + Tailwind** frontend, **FastAPI + Motor (MongoDB)** backend, **Random Forest / XGBoost** binary classifier with **JWT authentication**, **Leaflet** maps (OpenStreetMap + Nominatim), and **Recharts** analytics.

## Project structure

```
roadsense-ai/
├── frontend/          # React SPA
├── backend/           # FastAPI API + ML artifacts under app/ml/
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB Atlas cluster (or compatible MongoDB URI)
- Dataset CSV (included in the parent folder as `Indian_Traffic_Accident_Dataset.csv` in this workspace)

## Backend setup

```bash
cd backend
pip install -r requirements.txt
```

1. **Configure environment (recommended)**  
   Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI`, `SECRET_KEY`, and optional `DEFAULT_DATASET_PATH`.

2. **Train the model** (generates `app/ml/model.pkl`, `scaler.pkl`, `label_encoders.pkl`, `feature_names.pkl`, `model_meta.json`):

   ```bash
   python -m app.ml.train_model "M:\Traffic Alert System\Indian_Traffic_Accident_Dataset.csv"
   ```

   Or rely on the default path logic inside `train_model.py` when run without arguments from the `backend` directory.

3. **Run the API**:

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

   - OpenAPI docs: `http://172.28.66.246:8001/docs`
   - Health: `GET http://172.28.66.246:8001/health`
   - LAN/mobile test: `http://172.28.66.246:8001/health`

   If mobile cannot reach the API:
   - Ensure phone and PC are on the same Wi-Fi/LAN
   - Allow inbound TCP port `8001` in Windows Firewall
   - Keep `BACKEND_BASE_URL` in mobile `.env` set to `http://172.28.66.246:8001`

### ML maintenance

- `POST /ml/upload-dataset` — multipart CSV stored under `backend/uploads/uploaded_dataset.csv`
- `POST /ml/train` — optional multipart `file` (CSV); otherwise uses upload or `DEFAULT_DATASET_PATH`
- `GET /ml/model-info` — training metrics and metadata

### Indexing

On startup the API creates MongoDB indexes (via pymongo) on:

- `users.email` (unique)
- `predictions.user_id`
- `predictions.created_at`

## Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (see `.env.example`):

```
VITE_API_URL=http://172.28.66.246:8001
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

For **Route risk**, set `VITE_GOOGLE_MAPS_API_KEY` and in [Google Cloud Console](https://console.cloud.google.com/) enable **Geocoding API**. Restrict the key by **HTTP referrer** (e.g. `http://localhost:5174/*`) so it is not wide open. Map search and map clicks (reverse geocode) use this key; the **Map prediction** page still uses OpenStreetMap + Nominatim.

```bash
npm run dev
```

Open the URL Vite prints (often `http://localhost:5173`, or **`http://localhost:5174`** if 5173 is in use), **register**, then use **Dashboard**, **Map prediction**, **Route risk**, and **History**.

The API allows both ports by default via `CORS_ORIGINS`; add more origins in `backend/.env` as a comma-separated list if needed.

JWT is stored as `roadsense_token` in `localStorage` and sent as `Authorization: Bearer <token>`.

## Key API endpoints

| Method | Path             | Notes                |
| ------ | ---------------- | -------------------- |
| POST   | `/auth/register` | Returns JWT + user   |
| POST   | `/auth/login`    | Returns JWT + user   |
| GET    | `/auth/me`       | **Bearer required**  |
| POST   | `/predict/point` | **Bearer required**  |
| POST   | `/predict/route` | **Bearer required**  |
| GET    | `/history/`      | Pagination + filters |
| GET    | `/history/stats` | User aggregates      |
| GET    | `/history/{id}`  | Detail               |
| DELETE | `/history/{id}`  | Delete               |
| GET    | `/health`        | Status               |

## Security notes

- Passwords are **bcrypt-hashed**; plaintext passwords are never stored.
- Override `SECRET_KEY` and Mongo credentials via **environment variables** for any shared or production deployment.
- Nominatim usage should follow the [Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) (appropriate `User-Agent`, rate limits) if you scale traffic.

## License

Provided as sample application code for the RoadSense AI demonstration workspace.
