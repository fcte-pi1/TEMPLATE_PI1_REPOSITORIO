from app.models import Execution, Maze, PathPoint, Metrics, Event
from app.mock.maze import build_seed_maze
from app.mock.seed import (
    build_seed_execution,
    build_seed_metrics,
    build_seed_path,
    build_seed_events,
)


class AppState:
    """Estado em memória do mock. Um singleton por processo."""

    def __init__(self) -> None:
        self.execution: Execution | None = build_seed_execution()
        self.maze: Maze = build_seed_maze()
        self.path: list[PathPoint] = build_seed_path()
        self.metrics: Metrics = build_seed_metrics()
        self.events: list[Event] = build_seed_events()

    def reset(self) -> None:
        """Recria tudo — útil em testes."""
        self.__init__()


state = AppState()