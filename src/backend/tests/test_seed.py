from app.mock.maze import build_seed_maze
from app.models import ExecutionStatus
from app.mock.seed import (
    build_seed_execution, build_seed_path,
    build_seed_metrics, build_seed_events,
)


def test_maze_dimensions(): #16x16 originalmente
    maze = build_seed_maze()
    assert maze.size == len(maze.grid)
    for row in maze.grid:
        assert len(row) == maze.size


def test_maze_start_and_goal_inside_grid():
    maze = build_seed_maze()
    n = maze.size
    assert 0 <= maze.start.row < n
    assert 0 <= maze.start.col < n
    assert 0 <= maze.goal.row < n
    assert 0 <= maze.goal.col < n
    assert maze.start != maze.goal


def test_walls_are_symmetric():
    """
    Se a célula (r,c) tem parede leste, a (r,c+1) tem parede oeste.
    Se tem parede sul, a (r+1,c) tem parede norte. E vice-versa.
    """
    maze = build_seed_maze()
    n = maze.size

    for r in range(n):
        for c in range(n):
            cell = maze.grid[r][c]

            if c + 1 < n:
                neighbor = maze.grid[r][c + 1]
                assert cell.parede_leste == neighbor.parede_oeste, \
                    f"Parede L/O inconsistente entre ({r},{c}) e ({r},{c+1})"
            else:
                assert cell.parede_leste, f"Borda leste faltando em ({r},{c})"

            if r + 1 < n:
                neighbor = maze.grid[r + 1][c]
                assert cell.parede_sul == neighbor.parede_norte, \
                    f"Parede N/S inconsistente entre ({r},{c}) e ({r+1},{c})"
            else:
                assert cell.parede_sul, f"Borda sul faltando em ({r},{c})"

            if c == 0:
                assert cell.parede_oeste, f"Borda oeste faltando em ({r},{c})"
            if r == 0:
                assert cell.parede_norte, f"Borda norte faltando em ({r},{c})"


def test_borders_are_closed():
    """A borda externa do labirinto deve ser totalmente fechada."""
    maze = build_seed_maze()
    n = maze.size

    for i in range(n):
        assert maze.grid[0][i].parede_norte, f"Borda norte aberta em col {i}"
        assert maze.grid[3][i].parede_sul, f"Borda sul aberta em col {i}"
        assert maze.grid[i][0].parede_oeste, f"Borda oeste aberta em row {i}"
        assert maze.grid[i][3].parede_leste, f"Borda leste aberta em row {i}"


def test_path_starts_at_maze_start():
    maze = build_seed_maze()
    path = build_seed_path()
    assert path[0].row == maze.start.row
    assert path[0].col == maze.start.col

def test_path_ends_at_goal():
    """O path DEVE terminar exatamente no goal."""
    maze = build_seed_maze()
    path = build_seed_path()
    assert len(path) > 0, "Path vazio"
    last = path[-1]
    assert last.row == maze.goal.row and last.col == maze.goal.col, (
        f"Path termina em ({last.row},{last.col}), "
        f"goal é ({maze.goal.row},{maze.goal.col})"
    )


def test_path_steps_are_orthogonal_neighbors():
    path = build_seed_path()
    for a, b in zip(path, path[1:]):
        dr = abs(a.row - b.row)
        dc = abs(a.col - b.col)
        assert dr + dc == 1, f"Passo não-ortogonal: {a} -> {b}"


def test_path_does_not_cross_walls():
    maze = build_seed_maze()
    path = build_seed_path()
    for a, b in zip(path, path[1:]):
        cell = maze.grid[a.row][a.col]
        dr = b.row - a.row
        dc = b.col - a.col
        if dr == -1:
            assert not cell.parede_norte, f"Atravessou parede N em {a} -> {b}"
        elif dr == 1:
            assert not cell.parede_sul, f"Atravessou parede S em {a} -> {b}"
        elif dc == -1:
            assert not cell.parede_oeste, f"Atravessou parede O em {a} -> {b}"
        elif dc == 1:
            assert not cell.parede_leste, f"Atravessou parede L em {a} -> {b}"


def test_execution_shape():
    from app.models import ExecutionStatus, ExecutionResult
    s = build_seed_execution()
    assert s.id == "0847"
    assert s.labirinto_id == "maze_4x4"
    assert s.algorithm == "Flood Fill"
    assert s.status == ExecutionStatus.finished
    assert s.resultado == ExecutionResult.success
    assert s.iniciada_em <= s.finalizada_em
    assert s.tempo_total_ms is not None and s.tempo_total_ms >= 0
    assert s.criado_em <= s.iniciada_em

def test_session_status_matches_path_completion():
    """Status e path têm que concordar."""
    s = build_seed_execution()
    maze = build_seed_maze()
    path = build_seed_path()
    last = path[-1]
    reached = (last.row, last.col) == (maze.goal.row, maze.goal.col)

    if s.status.value == ExecutionStatus.finished:
        assert reached, "Sessão 'finished' mas path não chegou ao goal"
    elif s.status.value == ExecutionStatus.running:
        assert not reached, "Sessão 'running' mas path já chegou ao goal"


def test_metrics_ranges():
    m = build_seed_metrics()
    assert m.speed_cm_s >= 0
    assert m.rpm >= 0
    assert 0 <= m.battery_pct <= 100


def test_events_chronological():
    events = build_seed_events()
    assert len(events) > 0
    for a, b in zip(events, events[1:]):
        assert a.timestamp <= b.timestamp, "Eventos fora de ordem"
    assert events[0].message.lower().startswith("sessão iniciada")