from pydantic import BaseModel, Field

class Cell(BaseModel):
    """
    Convenção de eixos:
      row cresce para baixo (sul), col cresce para a direita (leste).

      parede_norte: parede entre (row, col) e (row - 1, col)
      parede_sul:   parede entre (row, col) e (row + 1, col)
      parede_leste: parede entre (row, col) e (row, col + 1)
      parede_oeste: parede entre (row, col) e (row, col - 1)
    """
    parede_norte: bool = False
    parede_sul: bool = False
    parede_leste: bool = False
    parede_oeste: bool = False

class Position(BaseModel):
    row: int
    col: int

class Maze(BaseModel):
    size: int               #16
    grid: list[list[Cell]] = Field(..., description="grid[row][col]")  #16x16
    start: Position
    goal: Position