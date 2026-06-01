from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import create_router
from app.database import Database
from app.repositories.task_repository import TaskRepository
from app.services.config_service import ConfigService
from app.services.orchestrator import ResearchOrchestrator


def create_app() -> FastAPI:
    database = Database()
    repository = TaskRepository(database)
    config_service = ConfigService(repository)
    config_service.bootstrap_runtime_defaults()
    orchestrator = ResearchOrchestrator(repository)

    app = FastAPI(title="Independent Research Module", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(create_router(orchestrator, repository, config_service))

    @app.get("/")
    def root():
        return {"message": "Independent Research Module API"}

    return app


app = create_app()
