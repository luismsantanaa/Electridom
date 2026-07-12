"""DetectedSpace model — represents a room/space detected in a plan."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Double, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DetectedSpace(Base):
    """Represents a detected room/space in an architectural plan."""

    __tablename__ = "detected_spaces"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("plans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    space_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    area_m2: Mapped[float | None] = mapped_column(
        Double,
        nullable=True,
    )
    perimeter_m: Mapped[float | None] = mapped_column(
        Double,
        nullable=True,
    )
    vertices: Mapped[dict | list] = mapped_column(
        JSONB,
        nullable=False,
    )
    confidence: Mapped[float | None] = mapped_column(
        Double,
        nullable=True,
    )
    classification_method: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationships
    plan: Mapped["Plan"] = relationship(  # noqa: F821
        "Plan",
        back_populates="detected_spaces",
    )

    def __repr__(self) -> str:
        return f"<DetectedSpace(id={self.id}, name={self.name}, area={self.area_m2})>"
