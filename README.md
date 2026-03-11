# WorkAI Backend Engineering Assessment

This repository contains the completed solution for the WorkAI backend engineering assessment. It implements two independent services within a mono-repo structure:

- **InsightOps (Python Service)**: A FastAPI-based service for generating investment briefing reports.
- **TalentFlow (TypeScript Service)**: A NestJS-based service for candidate document processing and AI summarization.

##  Features Implemented

###  Python Service (InsightOps)
- **Briefing Management**: Complete CRUD operations for investment briefings.
- **Report Generation**: Professional HTML report generation using Jinja2 templates.
- **Data Modeling**: Normalized PostgreSQL schema with SQLAlchemy ORM.
- **Validation**: Strict data validation using Pydantic models.
- **Testing**: Comprehensive test suite using Pytest.

### TypeScript Service (TalentFlow)
- **Candidate Management**: Unified RESTful API for creating and listing candidates (`/candidates`).
- **Document Processing**: Secure document upload and storage metadata management.
- **AI Integration**: Asynchronous candidate summarization using Gemini API (with fallback).
- **Queue System**: Robust job queue for background processing of summaries.
- **Architecture**: Modular NestJS design with TypeORM and Repository pattern.

##  Prerequisites

- **Docker**: For running the PostgreSQL database.
- **Python 3.12+**: For the InsightOps service.
- **Node.js 22+**: For the TalentFlow service.

## 🏁 Quick Start Guide

### 1. Start the Database
The services share a PostgreSQL instance running in Docker.

```bash
docker compose up -d postgres
```

### 2. Python Service (InsightOps) setup
Open a terminal in `python-service/`:

```bash
cd python-service
# Setup environment
cp .env.example .env
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python -m app.db.run_migrations up

# Start server
python -m uvicorn app.main:app --reload --port 8000
```
- **API Docs**: http://localhost:8000/docs
- **Run Tests**: `pytest`

### 3. TypeScript Service (TalentFlow) setup
Open a terminal in `ts-service/`:

```bash
cd ts-service
# Setup environment
cp .env.example .env
npm install

# Run migrations
npm run migration:run

# Start server
npm run start:dev
```

- **Run Tests**: `npm test`

##  Testing with Postman

### InsightOps (Python)
- **Create Briefing**: `POST /briefings`
- **Generate Report**: `POST /briefings/{id}/generate`
- **View HTML**: `GET /briefings/{id}/html`

### TalentFlow (TypeScript)
> **Note**: Requires headers `x-user-id: user123` and `x-workspace-id: workspace123`
- **Create Candidate**: `POST /candidates`
- **Upload Document**: `POST /candidates/{id}/documents`
- **Generate Summary**: `POST /candidates/{id}/summaries/generate`

##  Project Structure

```
.
├── python-service/       # InsightOps Service (FastAPI)
│   ├── app/              # Application source code
│   ├── db/               # Database migrations & config
│   └── tests/            # Pytest suite
├── ts-service/           # TalentFlow Service (NestJS)
│   ├── src/              # Source code (Candidates, LLM, Queue)
│   └── test/             # E2E tests
└── docker-compose.yml    # Shared infrastructure
```

##  Implementation Notes

Detailed notes on design decisions and architecture can be found in [NOTES.md](NOTES.md).
