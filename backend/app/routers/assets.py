from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, asc, cast, desc, func, or_, select
from sqlalchemy.orm import Session

from app.auth import verify_token
from app.db import get_db
from app.models import Asset, HostnameAlias, HwInfo, IpInfo, NetInfo, OsInfo, SwInfo, ViewSet
from app.schemas import AssetDetailsResponse, AssetListResponse, AssetSoftwareItem

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


def get_owner_ids_for_user(token_payload: dict, db: Session) -> list[int]:
    username = token_payload.get("preferred_username")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="preferred_username is missing from token",
        )

    prefix = username[:6]
    owner_ids_raw = db.execute(
        select(ViewSet.owner_ids).where(ViewSet.prefix == prefix)
    ).scalar_one_or_none()

    if not owner_ids_raw:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No owner mapping found for user prefix",
        )

    try:
        owner_ids = [
            int(owner_id.strip())
            for owner_id in owner_ids_raw.split(",")
            if owner_id.strip()
        ]
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid owner_ids mapping for user prefix",
        ) from exc

    if not owner_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No owner ids available for user prefix",
        )

    return owner_ids


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
    owner_ids = get_owner_ids_for_user(token_payload, db)

    stmt = select(Asset).where(Asset.owner_id.in_(owner_ids))

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


@router.get("/{asset_id}", response_model=AssetDetailsResponse)
def get_asset_details(
    asset_id: int,
    db: Session = Depends(get_db),
    token_payload: dict = Depends(verify_token),
):
    owner_ids = get_owner_ids_for_user(token_payload, db)

    asset = db.execute(
        select(Asset).where(Asset.id == asset_id, Asset.owner_id.in_(owner_ids))
    ).scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found",
        )

    alias = db.execute(
        select(HostnameAlias.alias).where(HostnameAlias.asset_id == asset_id)
    ).scalar_one_or_none()

    os_info = db.execute(
        select(OsInfo).where(OsInfo.asset_id == asset_id)
    ).scalar_one_or_none()

    hw_info = db.execute(
        select(HwInfo).where(HwInfo.asset_id == asset_id)
    ).scalar_one_or_none()

    software_rows = db.execute(
        select(SwInfo).where(SwInfo.asset_id == asset_id).order_by(asc(SwInfo.sw_name))
    ).scalars().all()

    neighbour_ports = db.execute(
        select(NetInfo.neighbour_port)
        .where(NetInfo.asset_id == asset_id)
        .order_by(asc(NetInfo.neighbour_port))
    ).scalars().all()

    ip_addresses = db.execute(
        select(IpInfo.ip_address)
        .where(IpInfo.asset_id == asset_id)
        .order_by(asc(IpInfo.ip_address))
    ).scalars().all()

    return AssetDetailsResponse(
        asset_id=asset_id,
        alias=alias,
        kernel=os_info.kernel if os_info else None,
        os_name=os_info.os_name if os_info else None,
        os_family=os_info.os_family if os_info else None,
        os_arch=os_info.os_arch if os_info else None,
        code_name=os_info.code_name if os_info else None,
        cn_name=os_info.cn_name if os_info else None,
        vendor=hw_info.vendor if hw_info else None,
        product_name=hw_info.product_name if hw_info else None,
        software=[
            AssetSoftwareItem(sw_name=row.sw_name, sw_version=row.sw_version)
            for row in software_rows
        ],
        neighbour_ports=[port for port in neighbour_ports if port],
        ip_addresses=[ip for ip in ip_addresses if ip],
    )
