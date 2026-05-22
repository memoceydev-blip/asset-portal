from sqlalchemy import Integer, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Asset(Base):
    __tablename__ = "assets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    tag: Mapped[str | None] = mapped_column(String)
    status: Mapped[str | None] = mapped_column(String)
    owner: Mapped[str | None] = mapped_column(String)
    location: Mapped[str | None] = mapped_column(String)
    os: Mapped[str | None] = mapped_column(String)
    type: Mapped[str | None] = mapped_column(String)
