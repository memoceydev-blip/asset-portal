from pydantic import BaseModel, ConfigDict


class AssetOut(BaseModel):
    id: int
    tag: str | None = None
    status: str | None = None
    owner: str | None = None
    location: str | None = None
    os: str | None = None
    type: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AssetListResponse(BaseModel):
    items: list[AssetOut]
    page: int
    page_size: int
    total: int
