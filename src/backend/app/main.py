from fastapi import FastAPI

from app.core.database import test_database_connection
from app.routes import sessions, telemetry


app = FastAPI(
    title="Micromouse API",
    version="0.1.0",
)

app.include_router(sessions.router, prefix="/api")
app.include_router(telemetry.router, prefix="/api")

@app.get("/")
def root():
    return {
        "message": "Micromouse API funcionando"
    }


@app.get("/health")
def health():
    try:
        test_database_connection()

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception as error:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(error),
        }
