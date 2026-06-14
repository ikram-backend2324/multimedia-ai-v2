import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-insecure-key-change-me")
DEBUG = os.getenv("DJANGO_DEBUG", "True") == "True"

# ALLOWED_HOSTS: comma-separated env var, e.g. "myapp.onrender.com,www.example.com"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]

# Render provides the external hostname automatically
RENDER_HOST = os.getenv("RENDER_EXTERNAL_HOSTNAME")
if RENDER_HOST:
    ALLOWED_HOSTS.append(RENDER_HOST)

# In DEBUG (local dev) allow everything if nothing was set
if DEBUG and not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["*"]

# CSRF trusted origins (needed for POST forms over HTTPS in production)
CSRF_TRUSTED_ORIGINS = [
    f"https://{h}" for h in ALLOWED_HOSTS if h not in ("*", "localhost", "127.0.0.1")
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "core",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
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
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.template.context_processors.i18n",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = []

# --- Internationalization ---
from django.utils.translation import gettext_lazy as _

LANGUAGE_CODE = "uz"
LANGUAGES = [
    ("uz", _("O'zbekcha")),
    ("kaa", _("Qaraqalpaqsha")),
]
LOCALE_PATHS = [BASE_DIR / "locale"]
TIME_ZONE = "Asia/Tashkent"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise: compressed static file serving in production
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Allow request bodies up to ~5 MB so base64-encoded images for /api/vision/
# (cap: 2 MB raw → ~2.7 MB base64 + JSON overhead) are accepted before the view
# itself enforces the stricter MAX_IMAGE_BYTES limit.
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

# --- OpenRouter ---
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-v4-flash")
# Multimodal (vision) model for /api/vision/ — accepts images. Defaults to a
# Llama 4 Maverick variant on OpenRouter.
OPENROUTER_VISION_MODEL = os.getenv("OPENROUTER_VISION_MODEL", "meta-llama/llama-4-maverick")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Register Karakalpak (kaa) as a custom language Django doesn't ship by default
import django.conf.locale
if "kaa" not in django.conf.locale.LANG_INFO:
    django.conf.locale.LANG_INFO["kaa"] = {
        "bidi": False,
        "code": "kaa",
        "name": "Karakalpak",
        "name_local": "Qaraqalpaqsha",
    }
