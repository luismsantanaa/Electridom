"""Plan model — represents an uploaded PDF/DXF plan file."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Plan(Base):
    """Represents an uploaded architectural plan (PDF or DXF)."""

    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )
    file_type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
    )
    storage_key: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
    )
    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    processing_status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
    )
    processing_result: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )
    processing_error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    detected_spaces: Mapped[list["DetectedSpace"]] = relationship(  # noqa: F821
        "DetectedSpace",
        back_populates="plan",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return (
            f"<Plan(id={self.id}, filename={self.original_filename}, "
            f"status={self.processing_status})>"
        )
