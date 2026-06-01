from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.schemas import AiSettings, HealthResponse, ResearchQuestionPayload, ResearchReport, ResearchTask, SearchSettings


def create_router(orchestrator, repository, config_service) -> APIRouter:
    router = APIRouter(prefix="/api/v1")

    @router.post("/tasks", response_model=ResearchTask)
    def create_task(payload: ResearchQuestionPayload):
        return ResearchTask.model_validate(orchestrator.submit_task(payload.model_dump()))

    @router.get("/tasks", response_model=list[ResearchTask])
    def list_tasks():
        return [ResearchTask.model_validate(item) for item in repository.list_tasks()]

    @router.get("/tasks/{task_id}", response_model=ResearchTask)
    def get_task(task_id: str):
        task = repository.get_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        return ResearchTask.model_validate(task)

    @router.post("/tasks/{task_id}/cancel", response_model=ResearchTask)
    def cancel_task(task_id: str):
        task = orchestrator.cancel_task(task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        return ResearchTask.model_validate(task)

    @router.get("/tasks/{task_id}/iterations")
    def list_iterations(task_id: str):
        if not repository.get_task(task_id):
            raise HTTPException(status_code=404, detail="任务不存在")
        return repository.list_iterations(task_id)

    @router.get("/tasks/{task_id}/report", response_model=ResearchReport)
    def get_report(task_id: str):
        report = repository.get_report(task_id)
        if not report:
            raise HTTPException(status_code=404, detail="报告尚未生成")
        return ResearchReport.model_validate(report)

    @router.get("/config/search-providers", response_model=SearchSettings)
    def get_search_settings():
        return SearchSettings.model_validate(config_service.get_search_settings())

    @router.put("/config/search-providers", response_model=SearchSettings)
    def update_search_settings(payload: SearchSettings):
        return SearchSettings.model_validate(config_service.update_search_settings(payload.model_dump()))

    @router.get("/config/ai", response_model=AiSettings)
    def get_ai_settings():
        return AiSettings.model_validate(config_service.get_ai_settings())

    @router.put("/config/ai", response_model=AiSettings)
    def update_ai_settings(payload: AiSettings):
        return AiSettings.model_validate(config_service.update_ai_settings(payload.model_dump()))

    @router.get("/health", response_model=HealthResponse)
    def get_health():
        return HealthResponse.model_validate(orchestrator.health())

    return router
