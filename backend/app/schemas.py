from pydantic import BaseModel, ConfigDict


class AssetOut(BaseModel):
    id: int
    name: str | None = None
    tag: str | None = None
    status: str | None = None
    owner: str | None = None
    location: str | None = None
    os: str | None = None
    type: str | None = None
    ips: str | None = None
    alias: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AssetListResponse(BaseModel):
    items: list[AssetOut]
    page: int
    page_size: int
    total: int


class AssetSoftwareItem(BaseModel):
    sw_name: str | None = None
    sw_version: str | None = None


class AssetNeighbourItem(BaseModel):
    local_port: str | None = None
    neighbour_port: str | None = None
    network_device: str | None = None


class AssetDetailsResponse(BaseModel):
    asset_id: int
    aliases: list[str]
    kernel: str | None = None
    os_name: str | None = None
    os_family: str | None = None
    os_arch: str | None = None
    code_name: str | None = None
    cpe_name: str | None = None
    vendor: str | None = None
    product_name: str | None = None
    software: list[AssetSoftwareItem]
    neighbour_ports: list[AssetNeighbourItem]
    ip_addresses: list[str]
