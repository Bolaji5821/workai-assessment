
# Backend Engineering Assessment Starter

This repository is a standalone starter for the backend engineering take-home assessment.
It contains two independent services in a shared mono-repo:

- `python-service/` (InsightOps): FastAPI + SQLAlchemy + manual SQL migrations
- `ts-service/` (TalentFlow): NestJS + TypeORM

The repository is intentionally incomplete for assessment features. Candidates should build within the existing structure and patterns.

## Submission Details

- **Public GitHub Repository**: [Link to your public GitHub repository here]

## Prerequisites

- Docker
- Python 3.12
- Node.js 22+
- npm

## Start Postgres

From the repository root:

```bash
docker compose up -d postgres
```

This starts PostgreSQL on `localhost:5432` with:

- database: `assessment_db`
- user: `assessment_user`
- password: `assessment_pass`

## Service Guides

For detailed setup, running instructions, migrations, and tests, please refer to the individual service READMEs:

- **Python Service**: [python-service/README.md](python-service/README.md)
  - Setup & Run
  - Database Migrations
  - Running Tests (`pytest`)
- **TypeScript Service**: [ts-service/README.md](ts-service/README.md)
  - Setup & Run
  - Database Migrations (`npm run migration:run`)
  - Running Tests (`npm test`)

## Implementation Notes

A summary of design decisions, schema choices, and future improvements can be found in [NOTES.md](NOTES.md).

Detailed implementation notes for each service are available at:
- [ts-service/NOTES.md](ts-service/NOTES.md)
- [python-service/NOTES.md](python-service/NOTES.md)

## Notes

- Keep your solution focused on the assessment tasks.
- Do not replace the project structure with a different architecture.
