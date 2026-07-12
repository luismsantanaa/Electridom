# Plan Service — Calculadora Eléctrica RD v2

Microservicio Python (FastAPI) para reconocimiento de planos arquitectónicos PDF/DXF, extracción de espacios y medición de áreas.

## Stack

- **Framework:** FastAPI + Pydantic v2
- **PDF:** PyMuPDF (fitz) + pdf2image + OpenCV
- **DXF:** ezdxf
- **Geometry:** Shapely
- **Async Tasks:** Celery + Redis
- **Database:** PostgreSQL 16 + PostGIS (SQLAlchemy async)
- **Storage:** MinIO (S3-compatible)

## Quick Start

### Prerequisites

- Python 3.12+
- Docker & Docker Compose (for infrastructure)

### Setup

```bash
# 1. Copy environment config
cp .env.example .env

# 2. Start infrastructure (from project root)
docker compose up -d postgres redis minio

# 3. Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 4. Install dependencies
pip install -r requirements/dev.txt

# 5. Run the server
uvicorn app.main:app --reload --port 8000
```

### Run Celery Worker

```bash
celery -A app.tasks.celery_app worker --loglevel=info
```

### Run Tests

```bash
pytest --cov=app -v
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
plan-service/
├── app/
│   ├── main.py              # FastAPI application factory
│   ├── api/
│   │   ├── routes/          # API endpoints
│   │   └── deps.py          # Dependency injection
│   ├── core/
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── database.py      # SQLAlchemy async engine
│   │   ├── storage.py       # MinIO client
│   │   └── celery_app.py    # Celery configuration
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── services/
│   │   ├── dxf/             # DXF parsing pipeline
│   │   ├── pdf/             # PDF parsing pipeline
│   │   └── geometry/        # Geometric operations
│   └── tasks/               # Celery async tasks
├── tests/
├── requirements/
├── Dockerfile
└── pyproject.toml
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (DB, Redis, MinIO) |
| POST | `/api/plans/upload` | Upload PDF/DXF plan |
| GET | `/api/plans` | List plans (paginated) |
| GET | `/api/plans/{id}` | Get plan details |
| GET | `/api/plans/{id}/status` | Get processing status |
| GET | `/api/plans/{id}/result` | Get detected spaces |
| DELETE | `/api/plans/{id}` | Delete plan |
| PATCH | `/api/plans/{id}/spaces/{space_id}` | Update verified space |
