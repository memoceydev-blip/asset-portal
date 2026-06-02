from sqlalchemy import Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    prefix: Mapped[str] = mapped_column(String, unique=True, index=True)


class ViewSet(Base):
    __tablename__ = "view_set"

    prefix: Mapped[str] = mapped_column(String, primary_key=True, index=True)
    owner_ids: Mapped[str | None] = mapped_column(String)


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str | None] = mapped_column(String)
    tag: Mapped[str | None] = mapped_column(String)
    status: Mapped[str | None] = mapped_column(String)
    owner: Mapped[str | None] = mapped_column(String)
    owner_id: Mapped[int | None] = mapped_column(Integer)
    location: Mapped[str | None] = mapped_column(String)
    os: Mapped[str | None] = mapped_column(String)
    type: Mapped[str | None] = mapped_column(String)
    ips: Mapped[str | None] = mapped_column(String)
    alias: Mapped[str | None] = mapped_column(String)


class AliasInfo(Base):
    __tablename__ = "alias_info"

    asset_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alias: Mapped[str | None] = mapped_column(String, primary_key=True)


class OsInfo(Base):
    __tablename__ = "os_info"

    asset_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    kernel: Mapped[str | None] = mapped_column(String)
    os_name: Mapped[str | None] = mapped_column(String)
    os_family: Mapped[str | None] = mapped_column(String)
    os_arch: Mapped[str | None] = mapped_column(String)
    code_name: Mapped[str | None] = mapped_column(String)
    cpe_name: Mapped[str | None] = mapped_column(String)


class HwInfo(Base):
    __tablename__ = "hw_info"

    asset_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    vendor: Mapped[str | None] = mapped_column(String)
    product_name: Mapped[str | None] = mapped_column(String)


class SwInfo(Base):
    __tablename__ = "sw_info"

    asset_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sw_name: Mapped[str | None] = mapped_column(String, primary_key=True)
    sw_version: Mapped[str | None] = mapped_column(String)


class NetInfo(Base):
    __tablename__ = "net_info"

    asset_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    local_port: Mapped[str | None] = mapped_column(String, primary_key=True)
    network_device: Mapped[str | None] = mapped_column(String, primary_key=True)


class IpInfo(Base):
    __tablename__ = "ip_info"

    asset_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    ip_address: Mapped[str | None] = mapped_column(String, primary_key=True)
