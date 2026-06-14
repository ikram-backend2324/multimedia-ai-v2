# Multimedia tizimlariga qo'llaniladigan AI modellari

A Django website about AI models applied to multimedia systems (image, audio, video),
with an animated landing page, interactive diagrams, a live multimodal pipeline schema,
and a specialized AI chat assistant powered by OpenRouter (DeepSeek V4 Flash).

The UI and the AI's responses are available in **Uzbek (UZ)** and **Karakalpak (QQ)**.
Switching the language in the navbar changes both the interface text and the language
the AI answers in.

The image-recognition section has **four** model options:

1. **Tez** — MobileNetV2 α=0.5, browser-side, ~5 MB
2. **Balans** — MobileNetV2 α=1.0, browser-side, ~16 MB (default)
3. **Aniq** — MobileNetV2 α=1.0 with top-5 candidates, browser-side
4. **Aqlli AI** (PRO) — server-side multimodal vision model (e.g. Llama 4 Maverick)
   via OpenRouter. Returns a structured description directly in the chosen language.
   Requires `OPENROUTER_API_KEY` + credits; configured via `OPENROUTER_VISION_MODEL`.

## Tech stack
- Django + SQLite + Django templates
- Vanilla JS + CSS (canvas animations, scroll reveals, animated charts)
- OpenRouter API → `deepseek/deepseek-v4-flash`
- Django i18n / gettext for translations (locale: `uz`, `kaa`)

## Setup

1. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate        # Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Add your OpenRouter API key. Open the `.env` file and replace the placeholder:
   ```
   OPENROUTER_API_KEY=sk-or-v1-PASTE_YOUR_KEY_HERE
   ```
   (Get a key at https://openrouter.ai/keys — never commit this file.)

4. Run database migrations:
   ```bash
   python manage.py migrate
   ```

5. Compile translations (so Karakalpak text shows up):
   ```bash
   python manage.py compilemessages
   ```
   > Requires GNU `gettext`. On Ubuntu/Debian: `sudo apt install gettext`.
   > On Windows, install gettext or use the precompiled `.mo` already included.

6. Start the server:
   ```bash
   python manage.py runserver
   ```
   Open http://127.0.0.1:8000/

## Deploying to Render

This project is Render-ready. A `render.yaml` blueprint is included, or configure
manually in the dashboard:

**Build Command:**
```
pip install -r requirements.txt && python download_models.py && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py create_default_superuser
```

**Start Command:**
```
gunicorn config.wsgi:application
```

### AI model files (important)

The image-recognition feature uses MobileNetV2. By default the TensorFlow.js
library downloads the model weights from Google (`storage.googleapis.com`). On some
networks this fails with `ERR_QUIC_PROTOCOL_ERROR` or is very slow.

To make it reliable, `download_models.py` downloads the model files into
`static/models/` so the site serves them from **your own domain** instead of Google.
This runs automatically in the build command above. The site logic is:

1. If `static/models/<variant>/model.json` exists → load from your site (reliable, fast)
2. Otherwise → fall back to Google's CDN (still works, just less reliable)

So even if the download step fails, the site keeps working. To set up models locally:
```
python download_models.py
python manage.py collectstatic --noinput
```

**Environment variables** (set these in the Render dashboard, not in `.env`):
- `OPENROUTER_API_KEY` — your real key (mark as secret)
- `OPENROUTER_MODEL` — `deepseek/deepseek-v4-flash` (chat + describe endpoints)
- `OPENROUTER_VISION_MODEL` — `meta-llama/llama-4-maverick` (Vision / "Aqlli AI" mode;
  must be a multimodal model. **Paid** — needs OpenRouter credits.)
- `DJANGO_SECRET_KEY` — a long random string (Render can auto-generate)
- `DJANGO_DEBUG` — `False`
- `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_PASSWORD`, `DJANGO_SUPERUSER_EMAIL`
  — optional; only needed if you want an admin account auto-created on deploy

Render automatically provides `RENDER_EXTERNAL_HOSTNAME`, which the settings pick up
for `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS` — no manual host config needed. If you
add a custom domain, also set `ALLOWED_HOSTS=yourdomain.com`.

Notes:
- Static files are served by **WhiteNoise** with `CompressedStaticFilesStorage`, so no
  separate static host or CDN is required.
- `compilemessages` is intentionally left out of the build command because Render's
  Python runtime lacks `gettext`. The compiled `.mo` for Karakalpak is already bundled.
- SQLite on Render's free tier uses ephemeral disk — data resets on each deploy. For
  persistent data, attach a Render disk or switch to Render PostgreSQL.

## Project structure
```
multimedia_ai/
├── manage.py
├── requirements.txt
├── .env                     # your secrets (not committed)
├── .env.example             # template
├── config/                  # settings, urls, wsgi
├── core/                    # views + chat API logic
├── templates/               # base.html, home.html
├── static/css/style.css     # all styling + animations
├── static/js/main.js        # particles, charts, schema, chat
└── locale/
    ├── uz/LC_MESSAGES/       # Uzbek (source language)
    └── kaa/LC_MESSAGES/      # Karakalpak translations
```

## Editing translations
The page strings live in the templates wrapped in `{% trans %}`. Source text is Uzbek.
Karakalpak translations are in `locale/kaa/LC_MESSAGES/django.po`. After editing:
```bash
python manage.py makemessages -l kaa
python manage.py compilemessages
```

## Sections
1. **Hero** — animated neural-network particle background
2. **Modallik** — three modalities (image / audio / video)
3. **Tarix** — timeline of key models, 2012 → 2024
4. **Taqqoslash** — animated ImageNet accuracy bars + generative-model radar chart
5. **Sxema** — live multimodal pipeline animation (signals flow into a Transformer core)
6. **Chat** — specialized multimedia-AI assistant

## Notes
- The AI is constrained by a system prompt to only answer multimedia-AI questions
  and to reply in the currently selected language.
- Karakalpak is a low-resource language; the model will attempt answers in it, but
  quality may be weaker than Uzbek. A native-speaker review of `django.po` is recommended.
- For production: set `DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, run
  `python manage.py collectstatic`, and serve behind a real WSGI server.

## API endpoints

All three endpoints return JSON, accept `POST`, and use the language returned by
Django's `get_language()` (i.e. whichever language the user picked in the navbar).

| Endpoint | Body | Response | Errors |
|---|---|---|---|
| `/api/chat/` | `{message, history}` | `{reply}` | 400/502/503/504 |
| `/api/describe/` | `{label, label_local}` | `{description}` | 400/502/503/504 |
| `/api/vision/` | `{image: "<data URL or base64>"}` | `{object, description, model}` | 400/413/502/503/504 |

`/api/vision/` is the backend for the "Aqlli AI" model card. It forwards the image
to `OPENROUTER_VISION_MODEL` and returns the object name + a sectioned description
(definition, interesting facts, where it's found) in the user's language.

Image-size policy for `/api/vision/`:
- Browser downscales to max 1024 px (longest side) before sending, JPEG quality 0.85
- Backend rejects any payload > 2 MB raw with HTTP 413
- Django request-body limit is bumped to 5 MB to accommodate base64 overhead

Error status codes:
- `400` — malformed JSON / no image
- `413` — image exceeds 2 MB
- `502` — upstream error (incl. OpenRouter `402` "credits exhausted")
- `503` — `OPENROUTER_API_KEY` not configured
- `504` — model timed out (try a smaller image)
