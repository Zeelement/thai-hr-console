"""
Django 配置。

业务数据默认存 SQL Server（mssql-django）。
为便于本机无 SQL Server 时做结构校验，可用 HR_DB_ENGINE=sqlite 临时回退；
该回退仅影响连接目标，不改变模型与迁移文件。
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get("HR_SECRET_KEY", "hr-console-local-dev-key-change-me")
DEBUG = os.environ.get("HR_DEBUG", "1") == "1"
ALLOWED_HOSTS = [h.strip() for h in os.environ.get("HR_ALLOWED_HOSTS", "*").split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "hrapi",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

def _mssql_engine():
    """mssql-django 1.x 模块名为 mssql_django，2.x 为 mssql；自动探测以兼容两者。"""
    for name in ("mssql", "mssql_django"):
        try:
            __import__(name + ".base")
            return name
        except ImportError:
            continue
    return "mssql"  # 未安装时交给 Django 给出明确的导入错误


# ---------------- 数据库 ----------------
def _mssql_config(name):
    """构造一个 SQL Server 连接配置；建库与业务连接共用同一套连接参数。

    HR_DB_LOCAL=1 时走本机 Shared Memory（HOST=lpc:localhost、PORT 留空），
    用于 SQL Server 未启用 TCP/IP 的场景；此时 mssql-django 不会拼接端口。
    """
    local_mode = os.environ.get("HR_DB_LOCAL", "0") == "1"
    host = "lpc:localhost" if local_mode else os.environ.get("HR_DB_HOST", "localhost")
    port = "" if local_mode else os.environ.get("HR_DB_PORT", "1433")
    return {
        "ENGINE": _mssql_engine(),
        "NAME": name,
        "USER": os.environ.get("HR_DB_USER", "sa"),
        "PASSWORD": os.environ.get("HR_DB_PASSWORD", ""),
        "HOST": host,
        "PORT": port,
        "OPTIONS": {
            "driver": os.environ.get("HR_DB_DRIVER", "ODBC Driver 17 for SQL Server"),
            "extra_params": os.environ.get(
                "HR_DB_EXTRA_PARAMS", "TrustServerCertificate=yes"
            ),
        },
    }


if os.environ.get("HR_DB_ENGINE", "mssql").lower() == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": _mssql_config(os.environ.get("HR_DB_NAME", "HRConsole")),
        # 仅供自动建库使用：连到系统库 master，其余参数与业务库一致。
        "master": _mssql_config("master"),
    }

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "zh-hans"
TIME_ZONE = "Asia/Bangkok"
USE_I18N = True
USE_TZ = True

# 前端静态资源仍位于项目根目录，仅在开发环境由 Django 白名单提供。
STATIC_URL = "static/"
STATICFILES_DIRS = []
DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

APPEND_SLASH = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

# JWT
JWT_EXPIRE_SECONDS = int(os.environ.get("HR_JWT_EXPIRE_SECONDS", "28800"))  # 8 小时
