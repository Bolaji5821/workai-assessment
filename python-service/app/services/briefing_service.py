from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.briefing import Briefing, BriefingKeyPoint, BriefingMetric, BriefingRisk
from app.schemas.briefing import (
    BriefingCreate,
    BriefingReportData,
    BriefingUpdate,
)


def create_briefing(db: Session, payload: BriefingCreate) -> Briefing:
    """Create a new briefing with all related data."""
    briefing = Briefing(
        company_name=payload.company_name.strip(),
        ticker=payload.ticker.strip().upper(),
        sector=payload.sector.strip(),
        analyst_name=payload.analyst_name.strip(),
        summary=payload.summary.strip(),
        recommendation=payload.recommendation.strip(),
    )
    
    db.add(briefing)
    db.flush()  # Get the ID without committing
    
    # Add key points
    for i, key_point in enumerate(payload.key_points):
        db_key_point = BriefingKeyPoint(
            briefing_id=briefing.id,
            point_text=key_point.text.strip(),
            display_order=i,
        )
        db.add(db_key_point)
    
    # Add risks
    for i, risk in enumerate(payload.risks):
        db_risk = BriefingRisk(
            briefing_id=briefing.id,
            risk_text=risk.text.strip(),
            display_order=i,
        )
        db.add(db_risk)
    
    # Add metrics if provided
    if payload.metrics:
        for i, metric in enumerate(payload.metrics):
            db_metric = BriefingMetric(
                briefing_id=briefing.id,
                metric_name=metric.name.strip(),
                metric_value=metric.value.strip(),
                display_order=i,
            )
            db.add(db_metric)
    
    db.commit()
    db.refresh(briefing)
    return briefing


def get_briefing_by_id(db: Session, briefing_id: int) -> Optional[Briefing]:
    """Get a briefing by ID with all related data."""
    # Use joinedload to eagerly load relationships
    from sqlalchemy.orm import joinedload
    
    query = (
        select(Briefing)
        .options(
            joinedload(Briefing.key_points),
            joinedload(Briefing.risks),
            joinedload(Briefing.metrics),
        )
        .where(Briefing.id == briefing_id)
    )
    
    result = db.execute(query)
    briefing = result.unique().scalar_one_or_none()
    
    # Sort related data by display_order
    if briefing:
        briefing.key_points.sort(key=lambda x: x.display_order)
        briefing.risks.sort(key=lambda x: x.display_order)
        briefing.metrics.sort(key=lambda x: x.display_order)
    
    return briefing


def update_briefing(db: Session, briefing_id: int, payload: BriefingUpdate) -> Optional[Briefing]:
    """Update a briefing and its related data."""
    briefing = db.get(Briefing, briefing_id)
    if not briefing:
        return None
    
    # Update main briefing fields if provided
    if payload.company_name is not None:
        briefing.company_name = payload.company_name.strip()
    if payload.ticker is not None:
        briefing.ticker = payload.ticker.strip().upper()
    if payload.sector is not None:
        briefing.sector = payload.sector.strip()
    if payload.analyst_name is not None:
        briefing.analyst_name = payload.analyst_name.strip()
    if payload.summary is not None:
        briefing.summary = payload.summary.strip()
    if payload.recommendation is not None:
        briefing.recommendation = payload.recommendation.strip()
    
    # Reset generated status if content is updated
    if any(field is not None for field in [
        payload.company_name, payload.ticker, payload.sector,
        payload.analyst_name, payload.summary, payload.recommendation,
        payload.key_points, payload.risks, payload.metrics
    ]):
        briefing.is_generated = False
        briefing.generated_at = None
    
    briefing.updated_at = datetime.utcnow()
    
    # Update key points if provided
    if payload.key_points is not None:
        # Delete existing key points
        db.query(BriefingKeyPoint).filter(BriefingKeyPoint.briefing_id == briefing_id).delete()
        # Add new key points
        for i, key_point in enumerate(payload.key_points):
            db_key_point = BriefingKeyPoint(
                briefing_id=briefing_id,
                point_text=key_point.text.strip(),
                display_order=i,
            )
            db.add(db_key_point)
    
    # Update risks if provided
    if payload.risks is not None:
        # Delete existing risks
        db.query(BriefingRisk).filter(BriefingRisk.briefing_id == briefing_id).delete()
        # Add new risks
        for i, risk in enumerate(payload.risks):
            db_risk = BriefingRisk(
                briefing_id=briefing_id,
                risk_text=risk.text.strip(),
                display_order=i,
            )
            db.add(db_risk)
    
    # Update metrics if provided
    if payload.metrics is not None:
        # Delete existing metrics
        db.query(BriefingMetric).filter(BriefingMetric.briefing_id == briefing_id).delete()
        # Add new metrics
        for i, metric in enumerate(payload.metrics):
            db_metric = BriefingMetric(
                briefing_id=briefing_id,
                metric_name=metric.name.strip(),
                metric_value=metric.value.strip(),
                display_order=i,
            )
            db.add(db_metric)
    
    db.commit()
    db.refresh(briefing)
    return briefing


def delete_briefing(db: Session, briefing_id: int) -> bool:
    """Delete a briefing and all its related data."""
    briefing = db.get(Briefing, briefing_id)
    if not briefing:
        return False
    
    db.delete(briefing)
    db.commit()
    return True


def mark_briefing_as_generated(db: Session, briefing_id: int) -> Optional[Briefing]:
    """Mark a briefing as generated and set the generated timestamp."""
    briefing = db.get(Briefing, briefing_id)
    if briefing:
        briefing.is_generated = True
        briefing.generated_at = datetime.utcnow()
        briefing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(briefing)
    return briefing


def get_briefing_report_data(db: Session, briefing_id: int) -> Optional[BriefingReportData]:
    """Get briefing data formatted for report generation."""
    briefing = get_briefing_by_id(db, briefing_id)
    if not briefing:
        return None
    
    return BriefingReportData(
        company_name=briefing.company_name,
        ticker=briefing.ticker,
        sector=briefing.sector,
        analyst_name=briefing.analyst_name,
        summary=briefing.summary,
        recommendation=briefing.recommendation,
        key_points=[point.point_text for point in briefing.key_points],
        risks=[risk.risk_text for risk in briefing.risks],
        metrics=[{"name": metric.metric_name, "value": metric.metric_value} for metric in briefing.metrics],
        generated_at=briefing.generated_at or datetime.utcnow(),
    )


def list_briefings(db: Session, limit: int = 100, offset: int = 0) -> list[Briefing]:
    """List briefings with pagination."""
    query = (
        select(Briefing)
        .order_by(Briefing.created_at.desc(), Briefing.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return list(db.scalars(query).all())