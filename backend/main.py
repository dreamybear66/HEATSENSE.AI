import os

# Load environment variables from .env file
for env_path in [".env", "../.env", "backend/.env"]:
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import zones, clusters, simulate, notifications

app = FastAPI(
    title="Thermal Mind API",
    description="Backend for the Urban Heat Survival Planner",
    version="1.0.0"
)

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(zones.router, prefix="/api")
app.include_router(clusters.router, prefix="/api")
app.include_router(simulate.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Thermal Mind API is running. Check /docs for API documentation."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
