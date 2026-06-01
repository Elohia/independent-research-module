from __future__ import annotations

import os

from app.config import DEFAULT_GLM_BASE_URL, DEFAULT_GLM_MODEL, SHARED_QUANT_ENV_PATH
from app.repositories.task_repository import TaskRepository
from app.schemas import AiSettings, SearchSettings


class ConfigService:
    def __init__(self, repository: TaskRepository):
        self.repository = repository

    def get_search_settings(self) -> dict:
        return self.repository.get_config("search_settings", SearchSettings().model_dump())

    def update_search_settings(self, value: dict) -> dict:
        validated = SearchSettings.model_validate(value)
        return self.repository.set_config("search_settings", validated.model_dump())

    def get_ai_settings(self) -> dict:
        return self.repository.get_config("ai_settings", AiSettings().model_dump())

    def update_ai_settings(self, value: dict) -> dict:
        validated = AiSettings.model_validate(value)
        return self.repository.set_config("ai_settings", validated.model_dump())

    def bootstrap_runtime_defaults(self) -> None:
        glm_api_key = self._discover_glm_api_key()
        if not glm_api_key:
            return
        self._bootstrap_search_defaults()
        self._bootstrap_ai_defaults(glm_api_key)

    def _bootstrap_search_defaults(self) -> None:
        current = SearchSettings.model_validate(self.get_search_settings())
        should_upgrade = all(config.mode == "local" for config in current.providers.values())
        if not should_upgrade:
            return
        upgraded = SearchSettings.model_validate(
            {
                "request_timeout_seconds": max(10, current.request_timeout_seconds),
                "providers": {
                    name: {
                        **config.model_dump(),
                        "mode": "fallback",
                    }
                    for name, config in current.providers.items()
                },
            }
        )
        self.repository.set_config("search_settings", upgraded.model_dump())

    def _bootstrap_ai_defaults(self, glm_api_key: str) -> None:
        current = AiSettings.model_validate(self.get_ai_settings())
        should_upgrade = (
            current.mode == "local"
            and not current.base_url
            and not current.api_key
            and not current.model
        )
        if not should_upgrade:
            return
        upgraded = AiSettings.model_validate(
            {
                "mode": "openai_compatible",
                "base_url": DEFAULT_GLM_BASE_URL,
                "api_key": glm_api_key,
                "model": DEFAULT_GLM_MODEL,
                "temperature": 0.2,
                "request_timeout_seconds": max(20, current.request_timeout_seconds),
            }
        )
        self.repository.set_config("ai_settings", upgraded.model_dump())

    def _discover_glm_api_key(self) -> str:
        env_key = (os.environ.get("GLM_API_KEY") or "").strip()
        if env_key:
            return env_key
        if not SHARED_QUANT_ENV_PATH.exists():
            return ""
        try:
            for raw_line in SHARED_QUANT_ENV_PATH.read_text(encoding="utf-8").splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, value = line.split("=", 1)
                if key.strip() == "GLM_API_KEY":
                    return value.strip()
        except OSError:
            return ""
        return ""
