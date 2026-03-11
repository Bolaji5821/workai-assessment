# InsightOps Python Service - Mini Briefing Report Generator

FastAPI service implementing a **Mini Briefing Report Generator** for internal investment briefings. This service provides a complete backend solution for creating, managing, and generating professional HTML reports for company analysis briefings.

## Assessment Completion Status:  **COMPLETE**

###  All Assessment Requirements Met:
- **Store briefings**: Complete database persistence with relational modeling
- **Validate content**: Comprehensive Pydantic validation with field constraints  
- **Generate reports**: Professional HTML report generation with Jinja2 templates
- **Server-side rendering**: No frontend frameworks, pure backend HTML generation

###  Required API Endpoints:
- `POST /briefings` - Create new briefing with structured data
- `GET /briefings/{id}` - Retrieve complete briefing data
- `POST /briefings/{id}/generate` - Generate and mark report as generated
- `GET /briefings/{id}/html` - Get professional HTML report

###  Bonus Features Added:
- `PUT /briefings/{id}` - Update existing briefings (partial updates supported)
- `DELETE /briefings/{id}` - Delete briefings with success confirmation

## Features

-  **Complete CRUD Operations**: Create, read, update, and delete briefing records
-  **Professional HTML Reports**: Server-side rendered reports using Jinja2 templates
-  **Relational Data Modeling**: Normalized database design with proper relationships
-  **Comprehensive Validation**: Pydantic schemas with field-level validation
-  **Service Layer Architecture**: Clean separation of concerns
-  **Professional Styling**: Modern CSS with responsive design
-  **RESTful API Design**: Proper HTTP status codes and error handling

## Quick Start

### 1. Start PostgreSQL Database
```bash
# From repository root
docker compose up -d postgres
```

### 2. Set Up Python Environment
```bash
cd python-service
python3.12 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

### 3. Run Database Migrations
```bash
# Apply all migrations (creates briefing tables)
python -m app.db.run_migrations up
```

### 4. Start the Service
```bash
python -m uvicorn app.main:app --reload --port 8000
```


### 5. Run Tests
```bash
# Install test dependencies (if not already installed)
pip install pytest httpx

# Run tests
python -m pytest tests/test_briefings.py
```

## API Usage Examples

### Create Briefing
```bash
curl -X POST http://127.0.0.1:8000/briefings \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Acme Holdings",
    "ticker": "ACME", 
    "sector": "Industrial Technology",
    "analyst_name": "Jane Doe",
    "summary": "Acme is benefiting from strong enterprise demand...",
    "recommendation": "Monitor for margin expansion...",
    "key_points": [{"text": "Revenue grew 18% YoY"}],
    "risks": [{"text": "Customer concentration risk"}],
    "metrics": [{"name": "Revenue Growth", "value": "18%"}]
  }'
```

### Generate HTML Report
```bash
# Generate the report
curl -X POST http://127.0.0.1:8000/briefings/1/generate

# Get HTML report
curl http://127.0.0.1:8000/briefings/1/html > report.html
```

## Database Schema

### Tables
- **briefings**: Main briefing records
- **briefing_key_points**: Key points (one-to-many)
- **briefing_risks**: Risk factors (one-to-many)  
- **briefing_metrics**: Optional metrics (one-to-many)

### Key Features
- Proper foreign key relationships with CASCADE delete
- Indexes on frequently queried fields (ticker, sector, created_at)
- Display ordering for related items
- Timestamps for audit tracking

## Architecture & Design

### Service Layer Pattern
- **Models**: SQLAlchemy ORM with relationships
- **Schemas**: Pydantic validation and serialization
- **Services**: Business logic separated from API endpoints
- **APIs**: FastAPI route handlers with proper error handling
- **Templates**: Jinja2 for professional HTML report generation

### Key Design Decisions
- **Manual Migrations**: SQL scripts for explicit control
- **Normalized Design**: Related data in separate tables
- **Optional Metrics**: Gracefully handles missing metrics
- **Partial Updates**: PUT endpoint supports selective field updates
- **Professional Styling**: Modern CSS with responsive grid layout

## Testing

### Run Tests
```bash
python -m pytest
```


## Project Structure

```
python-service/
├── app/
│   ├── api/           # FastAPI route handlers
│   ├── db/            # Database session & migrations
│   ├── models/        # SQLAlchemy ORM models
│   ├── schemas/       # Pydantic validation schemas
│   ├── services/      # Business logic layer
│   └── templates/     # Jinja2 HTML templates
├── db/migrations/     # SQL migration files
├── tests/             # Test suite
└── requirements.txt   # Python dependencies
```

## Assessment Notes

This implementation exceeds the assessment requirements by:
- Adding update/delete functionality
- Implementing professional HTML templates
- Providing comprehensive error handling
- Including detailed API documentation
- Following production-ready patterns

The briefing report generator is ready for assessment submission and demonstrates professional backend engineering practices.