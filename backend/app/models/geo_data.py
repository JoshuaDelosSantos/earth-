"""GeoDataPoint model for storing normalised OSINT geospatial data."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Float, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry

from app.models.base import Base


class GeoDataPoint(Base):
    __tablename__ = "geo_data_points"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    geometry: Mapped[str] = mapped_column(Geometry("GEOMETRY", srid=4326))
    properties: Mapped[dict] = mapped_column(JSONB, default=dict)
    magnitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    event_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
