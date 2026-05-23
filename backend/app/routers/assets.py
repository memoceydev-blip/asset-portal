from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, asc, cast, desc, func, or_, select
from sqlalchemy.orm import Session

from app.auth import verify_token
from app.db import get_db
from app.models import Asset, Department
from app.schemas import AssetListResponse

router = APIRouter(prefix="/api/v1/assets", tags=["assets"])

SORTABLE_COLUMNS = {
    "id": Asset.id,
    "tag": Asset.tag,
    "status": Asset.status,
    "owner": Asset.owner,
    "owner_id": Asset.owner_id,
    "location": Asset.location,
    "os": Asset.os,
    "type": Asset.type,
}


@router.get("", response_model=AssetListResponse)
def list_assets(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    sort_by: str = Query("id"),
    sort_dir: str = Query("asc"),
    search: str | None = Query(None),
    status_filter: str | None = Query(None),
    owner_filter: str | None = Query(None),
    location_filter: str | None = Query(None),
    db: Session = Depends(get_db),
    token_payload: dict = Depends(verify_token),
):
    username = token_payload.get("preferred_username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="preferred_username is missing from token",
        )

    prefix = username[:6]
    department_id = db.execute(
        select(Department.id).where(Department.prefix == prefix)
    ).scalar_one_or_none()

    if department_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No department mapping found for user prefix",
        )

    stmt = select(Asset).where(Asset.owner_id == department_id)

    filters = []

    if search:
        pattern = f"%{search}%"
        filters.append(
            or_(
                cast(Asset.id, String).ilike(pattern),
                Asset.tag.ilike(pattern),
                Asset.status.ilike(pattern),
                Asset.owner.ilike(pattern),
                cast(Asset.owner_id, String).ilike(pattern),
                Asset.location.ilike(pattern),
                Asset.os.ilike(pattern),
                Asset.type.ilike(pattern),
            )
        )

    if status_filter:
        filters.append(Asset.status == status_filter)

    if owner_filter:
        filters.append(Asset.owner == owner_filter)

    if location_filter:
        filters.append(Asset.location == location_filter)

    if filters:
        stmt = stmt.where(*filters)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()

    sort_column = SORTABLE_COLUMNS.get(sort_by, Asset.id)
    order_clause = desc(sort_column) if sort_dir.lower() == "desc" else asc(sort_column)

    stmt = (
        stmt.order_by(order_clause)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = db.execute(stmt).scalars().all()

    return AssetListResponse(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
    )
