import os
import sys
import time

from sqlalchemy.exc import OperationalError
from app.core.database import test_database_connection

limite = time.monotonic() + 60

while True:
    try:
        test_database_connection()
        break
    except OperationalError:
        if time.monotonic() >= limite:
            raise

        print("Aguardando o PostgreSQL...", flush=True)
        time.sleep(1)

os.execv(
    sys.executable,
    [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload",
    ],
)