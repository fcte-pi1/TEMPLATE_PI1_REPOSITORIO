from app.main import app
from app.mock import simulation

simulation.start_run()

@app.middleware("http")
async def update_simulation(request, call_next):
    simulation.update()
    return await call_next(request)