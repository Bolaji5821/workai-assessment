
# Technical Implementation Notes

## Architecture Overview

The candidate document intake and summary workflow follows a **clean architecture pattern** with clear separation of concerns:

```
API Layer (NestJS) → Service Layer → Repository Layer → Database Layer
     ↓                      ↓              ↓                ↓
Controllers/DTOs    Business Logic    TypeORM ORM      PostgreSQL
Validation           Provider Abstraction  Entities       Migrations
```

## Key Technical Decisions

### 1. Database Design

**Normalized Relational Schema**
- **candidate_documents**: Document storage with metadata and relationships
- **candidate_summaries**: Summary records with comprehensive status tracking
- **sample_candidates**: Candidate records with workspace relationships (existing)
- **sample_workspaces**: Workspace records for access control (existing)

**Why this design?**
- **Flexibility**: Easy to add/remove documents and summaries
- **Status Tracking**: Comprehensive status management for async processing
- **Performance**: Strategic indexes on candidate_id, status, and document_type
- **Audit Trail**: Created/updated timestamps for compliance
- **Access Control**: Workspace-based authorization through foreign keys

### 2. Async Processing Architecture

**Queue/Worker Pattern**
- **In-Memory Queue**: Simple implementation for assessment purposes
- **Worker Service**: Background processing with status updates
- **Status Transitions**: Pending → Completed/Failed
- **Error Handling**: Comprehensive error logging and status updates
- **Scalability**: Architecture supports Redis/RabbitMQ integration

**Processing Flow:**
```
1. Client requests summary generation
2. System creates pending summary record
3. Job enqueued to queue service
4. Worker picks up job and processes
5. LLM provider generates summary
6. Summary updated with results or error
7. Client can poll for completion status
```

### 3. LLM Provider Abstraction

**Interface-Based Design**
- **SummarizationProvider**: Standardized interface for all LLM providers
- **Gemini Provider**: Real API integration with structured prompts
- **Fake Provider**: Fallback for testing without API keys
- **Runtime Selection**: Configuration-driven provider selection

**Provider Benefits:**
- **Testability**: Easy to mock for unit tests
- **Flexibility**: Add new providers without changing business logic
- **Configuration**: Runtime provider switching
- **Error Resilience**: Graceful fallbacks

### 4. Access Control Strategy

**Workspace-Based Authorization**
- **Header-Based Auth**: Simple fake auth for assessment
- **Candidate Ownership**: Documents/summaries scoped to candidate workspace
- **Repository Level**: Access control enforced at database query level
- **Consistent Pattern**: Applied across all endpoints uniformly

### 5. CRUD Operations

**Enhanced Resource Management**
- **Update Summary**: Allow manual refinement of AI-generated summaries
- **Delete Operations**: Granular deletion for summaries and documents
- **Cascade Deletion**: Candidate deletion removes all associated resources
- **Access Control**: All operations verify workspace ownership before execution

## Implementation Challenges & Solutions

### 1. TypeORM Array Column Support

**Problem**: PostgreSQL array columns not directly supported in TypeORM decorators
**Solution**: Used `@Column({ array: true })` for string arrays (strengths, concerns)

### 2. Enum Type Safety

**Problem**: String enums need proper TypeScript typing
**Solution**: Created explicit enum types with proper TypeScript definitions

### 3. Async Status Management

**Problem**: Managing status transitions in async processing
**Solution**: Implemented comprehensive status tracking with proper state transitions

### 4. LLM Response Parsing

**Problem**: LLM responses can be malformed or inconsistent
**Solution**: JSON extraction, validation, and fallback to fake provider

## Future Improvements

### 1. Persistent Queue System
Replace the in-memory queue with **Redis** or **RabbitMQ** to ensure job persistence across service restarts and enable horizontal scaling of worker nodes.

### 2. File Storage Integration
Move raw text storage to **S3** or **Google Cloud Storage** instead of storing document content directly in the database, keeping the database lean and performant.

### 3. Comprehensive Authentication
Replace the current header-based fake auth with a real **JWT-based authentication system** (e.g., Auth0 or Firebase Auth) for secure user management.

### 4. Advanced Monitoring
Implement **OpenTelemetry** tracing and metrics to monitor queue depths, processing times, and LLM API latency/costs.

## Code Quality Measures

### 1. Type Safety
- **Full TypeScript**: Comprehensive type definitions throughout
- **DTO Validation**: class-validator decorators for input validation
- **TypeORM Entities**: Proper entity relationships and constraints
