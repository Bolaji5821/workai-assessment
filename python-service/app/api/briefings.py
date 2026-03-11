from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.briefing import (
    BriefingCreate,
    BriefingRead,
    BriefingReportData,
    BriefingUpdate,
)
from app.services.briefing_service import (
    create_briefing,
    get_briefing_by_id,
    update_briefing,
    delete_briefing,
    get_briefing_report_data,
    mark_briefing_as_generated,
)

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.post("", response_model=BriefingRead, status_code=status.HTTP_201_CREATED)
def create_briefing_endpoint(
    payload: BriefingCreate,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingRead:
    """Create a new briefing with structured data."""
    briefing = create_briefing(db, payload)
    return BriefingRead.model_validate(briefing)


@router.get("/{briefing_id}", response_model=BriefingRead)
def get_briefing(
    briefing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingRead:
    """Retrieve a single briefing by ID with all related data."""
    briefing = get_briefing_by_id(db, briefing_id)
    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with id {briefing_id} not found",
        )
    return BriefingRead.model_validate(briefing)


@router.put("/{briefing_id}", response_model=BriefingRead)
def update_briefing_endpoint(
    briefing_id: int,
    payload: BriefingUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingRead:
    """Update an existing briefing with structured data."""
    briefing = update_briefing(db, briefing_id, payload)
    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with id {briefing_id} not found",
        )
    return BriefingRead.model_validate(briefing)


@router.delete("/{briefing_id}")
def delete_briefing_endpoint(
    briefing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str]:
    """Delete a briefing and all its related data."""
    success = delete_briefing(db, briefing_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with id {briefing_id} not found",
        )
    
    return {"message": f"Briefing with id {briefing_id} successfully deleted"}


@router.post("/{briefing_id}/generate", response_model=BriefingRead)
def generate_briefing_report(
    briefing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> BriefingRead:
    """Generate a report for an existing briefing and mark it as generated."""
    briefing = get_briefing_by_id(db, briefing_id)
    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with id {briefing_id} not found",
        )
    
    # Mark as generated
    briefing = mark_briefing_as_generated(db, briefing_id)
    return BriefingRead.model_validate(briefing)


@router.get("/{briefing_id}/html")
def get_briefing_html_report(
    briefing_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> Response:
    """Get the rendered HTML report for a briefing."""
    briefing = get_briefing_by_id(db, briefing_id)
    if not briefing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Briefing with id {briefing_id} not found",
        )
    
    if not briefing.is_generated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Briefing with id {briefing_id} has not been generated yet",
        )
    
    # Get report data and render HTML
    report_data = get_briefing_report_data(db, briefing_id)
    if not report_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate report data",
        )
    
    # Render HTML template using proper Jinja2 templates
    from app.services.report_formatter import render_briefing_report
    html_content = render_briefing_report(report_data)
    
    return Response(content=html_content, media_type="text/html")