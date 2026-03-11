from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class BriefingMetricCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    value: str = Field(min_length=1, max_length=50)


class BriefingMetricRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str = Field(alias="metric_name")
    value: str = Field(alias="metric_value")
    display_order: int
    created_at: datetime


class BriefingKeyPointCreate(BaseModel):
    text: str = Field(min_length=1)


class BriefingKeyPointRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    text: str = Field(alias="point_text")
    display_order: int
    created_at: datetime


class BriefingRiskCreate(BaseModel):
    text: str = Field(min_length=1)


class BriefingRiskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    text: str = Field(alias="risk_text")
    display_order: int
    created_at: datetime


class BriefingCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=200)
    ticker: str = Field(min_length=1, max_length=10)
    sector: str = Field(min_length=1, max_length=100)
    analyst_name: str = Field(min_length=1, max_length=100)
    summary: str = Field(min_length=1)
    recommendation: str = Field(min_length=1)
    key_points: List[BriefingKeyPointCreate] = Field(min_items=1)
    risks: List[BriefingRiskCreate] = Field(min_items=1)
    metrics: Optional[List[BriefingMetricCreate]] = None


class BriefingUpdate(BaseModel):
    """Schema for updating a briefing - all fields are optional"""
    company_name: Optional[str] = Field(None, min_length=1, max_length=200)
    ticker: Optional[str] = Field(None, min_length=1, max_length=10)
    sector: Optional[str] = Field(None, min_length=1, max_length=100)
    analyst_name: Optional[str] = Field(None, min_length=1, max_length=100)
    summary: Optional[str] = Field(None, min_length=1)
    recommendation: Optional[str] = Field(None, min_length=1)
    key_points: Optional[List[BriefingKeyPointCreate]] = None
    risks: Optional[List[BriefingRiskCreate]] = None
    metrics: Optional[List[BriefingMetricCreate]] = None


class BriefingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    is_generated: bool
    generated_at: Optional[datetime]
    key_points: List[BriefingKeyPointRead]
    risks: List[BriefingRiskRead]
    metrics: List[BriefingMetricRead]
    created_at: datetime
    updated_at: datetime


class BriefingReportData(BaseModel):
    """View model for report generation"""
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str
    key_points: List[str]
    risks: List[str]
    metrics: List[dict]  # List of {"name": str, "value": str}
    generated_at: datetime