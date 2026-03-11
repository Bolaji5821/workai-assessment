
# Project Implementation Notes

## Architecture Overview

This repository contains two microservices demonstrating different backend patterns:

1.  **TalentFlow (TypeScript/NestJS)**: A candidate document intake service using an **async worker pattern**. It features a clean architecture with TypeORM, interface-based LLM abstraction (Gemini), and a queue-based processing workflow.
2.  **InsightOps (Python/FastAPI)**: A briefing report generator using **clean architecture**. It features SQLAlchemy 2.0, Pydantic validation, and server-side HTML generation with Jinja2.

## Key Design Decisions

### Schema Design
- **Normalized Relations**: Both services use fully normalized PostgreSQL schemas to ensure data integrity and reduce redundancy.
- **Audit Trails**: All core entities include `created_at` and `updated_at` timestamps for compliance.
- **Access Control**: The TypeScript service implements a workspace-based data model to enforce isolation between tenant data.

### Technical Patterns
- **Provider Abstraction (TS)**: The LLM integration is hidden behind a `SummarizationProvider` interface, allowing runtime switching between the real Gemini API and a fake provider for robust testing.
- **Service Layer (Python)**: Business logic is decoupled from the API layer, enabling easier testing and potential reuse of logic across different interfaces (e.g., CLI vs API).
- **Template-Based Reporting (Python)**: Jinja2 was chosen over manual string concatenation for HTML generation to prevent XSS vulnerabilities and maintain code readability.

## Future Improvements

If I had more time, I would implement the following:

1.  **Persistent Queue**: Replace the in-memory queue in the TypeScript service with **Redis** or **RabbitMQ** to ensure job durability and support worker scaling.
2.  **Authentication**: Replace the header-based fake auth with a proper **OAuth2/JWT** implementation using a provider like Auth0.
3.  **PDF Generation**: Extend the Python service to convert the HTML reports into downloadable **PDFs** using a library like WeasyPrint.
4.  **External Data**: Integrate real financial APIs (e.g., Yahoo Finance) into the Python service to auto-populate briefing metrics.

For detailed implementation notes, please refer to:
- [ts-service/NOTES.md](ts-service/NOTES.md)
- [python-service/NOTES.md](python-service/NOTES.md)
