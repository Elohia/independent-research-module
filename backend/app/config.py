from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = Path(os.environ.get("IRM_DB_PATH", DATA_DIR / "research_module.db"))
WORKSPACE_ROOT = BASE_DIR.parent.parent
SHARED_QUANT_ENV_PATH = WORKSPACE_ROOT / "quant-system" / ".env"
DEFAULT_GLM_BASE_URL = "https://open.bigmodel.cn/api/paas/v4"
DEFAULT_GLM_MODEL = "glm-4-flash"
