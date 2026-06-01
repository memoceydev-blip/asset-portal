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
    tag: Mapped[str | None] = mapped_column(String)
    status: Mapped[str | None] = mapped_column(String)
    owner: Mapped[str | None] = mapped_column(String)
    owner_id: Mapped[int | None] = mapped_column(Integer)
    location: Mapped[str | None] = mapped_column(String)
    os: Mapped[str | None] = mapped_column(String)
    type: Mapped[str | None] = mapped_column(String)
