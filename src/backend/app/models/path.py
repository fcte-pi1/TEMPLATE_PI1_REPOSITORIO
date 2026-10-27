from pydantic import BaseModel

class PathPoint(BaseModel):
    row: int
    col: int
    