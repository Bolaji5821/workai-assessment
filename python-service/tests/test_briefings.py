
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool
from collections.abc import Generator

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.briefing import Briefing

@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    Base.metadata.create_all(bind=engine)

    def override_get_db() -> Generator[Session, None, None]:
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)

def test_create_and_get_briefing(client: TestClient) -> None:
    # Create a briefing
    briefing_data = {
        "company_name": "Test Corp",
        "ticker": "TEST",
        "sector": "Technology",
        "analyst_name": "John Doe",
        "summary": "A test summary",
        "recommendation": "Buy",
        "key_points": [{"text": "Point 1"}, {"text": "Point 2"}],
        "risks": [{"text": "Risk 1"}],
        "metrics": [{"name": "Revenue", "value": "1M"}]
    }
    
    response = client.post("/briefings", json=briefing_data)
    assert response.status_code == 201
    data = response.json()
    assert data["company_name"] == "Test Corp"
    assert len(data["key_points"]) == 2
    
    briefing_id = data["id"]
    
    # Get the briefing
    response = client.get(f"/briefings/{briefing_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == briefing_id
    assert data["ticker"] == "TEST"

def test_generate_report(client: TestClient) -> None:
    # Create a briefing first
    briefing_data = {
        "company_name": "Report Corp",
        "ticker": "RPT",
        "sector": "Energy",
        "analyst_name": "Jane Doe",
        "summary": "Report summary",
        "recommendation": "Hold",
        "key_points": [{"text": "Key Point"}],
        "risks": [{"text": "Key Risk"}]
    }
    
    create_response = client.post("/briefings", json=briefing_data)
    briefing_id = create_response.json()["id"]
    
    # Generate report
    response = client.post(f"/briefings/{briefing_id}/generate")
    assert response.status_code == 200
    assert response.json()["is_generated"] is True
    
    # Get HTML report
    response = client.get(f"/briefings/{briefing_id}/html")
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/html; charset=utf-8"
    assert "Report Corp" in response.text
    assert "RPT" in response.text

def test_briefing_not_found(client: TestClient) -> None:
    response = client.get("/briefings/999")
    assert response.status_code == 404

def test_html_not_generated(client: TestClient) -> None:
    # Create a briefing
    briefing_data = {
        "company_name": "Draft Corp",
        "ticker": "DRFT",
        "sector": "Retail",
        "analyst_name": "John Smith",
        "summary": "Draft summary",
        "recommendation": "Sell",
        "key_points": [{"text": "Point"}],
        "risks": [{"text": "Risk"}]
    }
    
    create_response = client.post("/briefings", json=briefing_data)
    briefing_id = create_response.json()["id"]
    
    # Try to get HTML without generating
    response = client.get(f"/briefings/{briefing_id}/html")
    assert response.status_code == 400
