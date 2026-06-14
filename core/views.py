import json
import requests
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.utils.translation import get_language
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST

# Language names sent to the model so it answers in the chosen language
LANG_NAMES = {
    "uz": "Uzbek (O'zbekcha, latin alifbosida)",
    "kaa": "Karakalpak (Qaraqalpaqsha, latin alifbosida)",
}

SYSTEM_PROMPT = (
    "You are an expert assistant specialized ONLY in AI models applied to "
    "multimedia systems (image, audio, and video). Topics you cover: image "
    "generation (GANs, diffusion models, Stable Diffusion, DALL-E, Midjourney), "
    "image recognition (CNNs, ResNet, ViT, YOLO), speech and audio "
    "(Whisper, Wav2Vec, text-to-speech, music generation), video (video "
    "understanding, generation like Sora, frame interpolation), and multimodal "
    "models (CLIP, multimodal transformers). "
    "If a question is clearly unrelated to multimedia AI, politely steer the user "
    "back to the topic. Keep answers clear, educational and well structured. "
    "You MUST write your entire answer in {lang}. Do not use any other language."
)


def home(request):
    from django.utils.translation import gettext as _
    timeline = [
        {"year": "2012", "name": "AlexNet", "tag": _("Tasvir"), "mod": "img",
         "desc": _("Chuqur CNN ImageNet musobaqasida g'alaba qozonib, zamonaviy AI davrini boshladi.")},
        {"year": "2014", "name": "GAN", "tag": _("Generatsiya"), "mod": "img",
         "desc": _("Generativ raqobat tarmoqlari — ikki tarmoq bir-biriga qarshi o'qib, realistik tasvir yaratadi.")},
        {"year": "2015", "name": "ResNet", "tag": _("Tasvir"), "mod": "img",
         "desc": _("Residual bog'lanishlar 150+ qatlamli tarmoqlarni o'qitishni mumkin qildi.")},
        {"year": "2016", "name": "WaveNet", "tag": _("Audio"), "mod": "aud",
         "desc": _("Tabiiy ovoz sintezi uchun xom audio to'lqinini generatsiya qiluvchi model.")},
        {"year": "2017", "name": "Transformer", "tag": _("Arxitektura"), "mod": "vid",
         "desc": _("\"Attention is all you need\" — barcha modalliklar uchun asos bo'lgan arxitektura.")},
        {"year": "2020", "name": "ViT", "tag": _("Tasvir"), "mod": "img",
         "desc": _("Vision Transformer tasvirni patchlarga bo'lib, transformer bilan qayta ishlaydi.")},
        {"year": "2021", "name": "CLIP", "tag": _("Multimodal"), "mod": "vid",
         "desc": _("Tasvir va matnni bitta makonda bog'lab, nol-misolli tasnifni ochdi.")},
        {"year": "2022", "name": "Whisper", "tag": _("Audio"), "mod": "aud",
         "desc": _("680 ming soat audio asosida o'qitilgan ko'p tilli nutqni aniqlash modeli.")},
        {"year": "2022", "name": "Stable Diffusion", "tag": _("Generatsiya"), "mod": "img",
         "desc": _("Ochiq diffuziya modeli matndan yuqori sifatli tasvir yaratishni ommalashtirdi.")},
        {"year": "2024", "name": "Sora", "tag": _("Video"), "mod": "vid",
         "desc": _("Matndan realistik video generatsiya qiluvchi diffuzion transformer modeli.")},
    ]
    acc_bars = [
        {"name": "AlexNet", "year": "2012", "val": 84, "color": "#3b82f6"},
        {"name": "VGG-16", "year": "2014", "val": 92, "color": "#06b6d4"},
        {"name": "ResNet-152", "year": "2015", "val": 95, "color": "#22d3ee"},
        {"name": "ViT-H", "year": "2020", "val": 97, "color": "#a78bfa"},
        {"name": "CoCa", "year": "2022", "val": 99, "color": "#f472b6"},
    ]

    # Deep model explainer cards (expandable)
    models = [
        {"key": "cnn", "name": "CNN", "full": _("Konvolyutsion neyron tarmoq"), "mod": "img",
         "short": _("Tasvirdagi piksellardan bosqichma-bosqich xususiyatlarni ajratib oladi."),
         "long": _("CNN tasvirni kichik filtrlar (yadrolar) bilan skanerlaydi. Birinchi qatlamlar qirralar va ranglarni, keyingilari shakllar va butun obyektlarni aniqlaydi. Har bir qatlam oldingisidan murakkabroq xususiyatlarni o'rganadi."),
         "use": _("Tasvir tasnifi, yuzni aniqlash, tibbiy tasvir tahlili")},
        {"key": "gan", "name": "GAN", "full": _("Generativ raqobat tarmog'i"), "mod": "img",
         "short": _("Ikki tarmoq raqobatlashib, yangi realistik tasvir yaratadi."),
         "long": _("GAN ikki qismdan iborat: generator soxta tasvir yaratadi, diskriminator esa uni haqiqiydan ajratishga harakat qiladi. Ular bir-biriga qarshi o'qib, generator borgan sari ishonchli natija beradi."),
         "use": _("Yuz generatsiyasi, uslubni ko'chirish, tasvir sifatini oshirish")},
        {"key": "diffusion", "name": "Diffusion", "full": _("Diffuziya modeli"), "mod": "img",
         "short": _("Shovqindan boshlab, bosqichma-bosqich aniq tasvir hosil qiladi."),
         "long": _("Diffuziya modeli avval tasvirga shovqin qo'shishni, so'ngra uni teskari yo'nalishda tozalashni o'rganadi. Generatsiyada u sof shovqindan boshlab, har qadamda biroz tozalab, oxir-oqibat aniq tasvir yaratadi. Stable Diffusion va DALL-E shu asosda ishlaydi."),
         "use": _("Matndan tasvir, inpainting, tasvirni kengaytirish")},
        {"key": "transformer", "name": "Transformer", "full": _("Transformer arxitekturasi"), "mod": "vid",
         "short": _("\"Attention\" mexanizmi orqali kontekstdagi bog'lanishlarni topadi."),
         "long": _("Transformer ma'lumotni ketma-ket emas, parallel qayta ishlaydi. \"Self-attention\" har bir element boshqalarga qanchalik bog'liqligini hisoblaydi. Bu arxitektura matn, tasvir (ViT) va audioda ham asos bo'ldi."),
         "use": _("Til modellari, ViT, multimodal tizimlar")},
        {"key": "whisper", "name": "Whisper", "full": _("Nutqni aniqlash modeli"), "mod": "aud",
         "short": _("Audioni matnga aylantiradi, 90+ tilni qo'llab-quvvatlaydi."),
         "long": _("Whisper audioni spektrogrammaga aylantirib, transformer orqali matnga o'giradi. 680 ming soatlik turli tildagi audio asosida o'qitilgani uchun shovqinli muhitda ham yaxshi ishlaydi."),
         "use": _("Subtitr yaratish, ovozli yordamchilar, tarjima")},
        {"key": "clip", "name": "CLIP", "full": _("Tasvir-matn bog'lovchi"), "mod": "vid",
         "short": _("Tasvir va matnni bitta umumiy makonda bog'laydi."),
         "long": _("CLIP tasvir va uning matnli tavsifini bir vektor makoniga joylashtiradi, shunda mos juftliklar yaqin turadi. Bu modelga oldindan ko'rmagan toifalarni ham tanib olish (zero-shot) imkonini beradi."),
         "use": _("Tasvirni qidirish, nol-misolli tasnif, generativ modellarni boshqarish")},
    ]

    # Comparison table
    table = [
        {"name": "AlexNet", "year": "2012", "type": "CNN", "mod": _("Tasvir"), "params": "60M", "use": _("Tasvir tasnifi")},
        {"name": "GAN", "year": "2014", "type": "GAN", "mod": _("Tasvir"), "params": "—", "use": _("Generatsiya")},
        {"name": "Transformer", "year": "2017", "type": "Transformer", "mod": _("Matn"), "params": "65M", "use": _("Tarjima")},
        {"name": "ViT", "year": "2020", "type": "Transformer", "mod": _("Tasvir"), "params": "86M+", "use": _("Tasnif")},
        {"name": "CLIP", "year": "2021", "type": "Multimodal", "mod": _("Tasvir+Matn"), "params": "400M", "use": _("Bog'lash")},
        {"name": "Whisper", "year": "2022", "type": "Transformer", "mod": _("Audio"), "params": "1.5B", "use": _("Nutq")},
        {"name": "Stable Diffusion", "year": "2022", "type": "Diffusion", "mod": _("Tasvir"), "params": "890M", "use": _("Matndan tasvir")},
        {"name": "Sora", "year": "2024", "type": "Diffusion", "mod": _("Video"), "params": "—", "use": _("Video generatsiya")},
    ]

    # Real-world use cases
    usecases = [
        {"mod": "img", "icon": "scan", "title": _("Tibbiy diagnostika"),
         "desc": _("Rentgen va MRT tasvirlarida kasalliklarni aniqlash, shifokorlarga yordam berish.")},
        {"mod": "aud", "icon": "mic", "title": _("Ovozli yordamchilar"),
         "desc": _("Nutqni tushunish va javob berish — Siri, Alexa va boshqa tizimlar asosi.")},
        {"mod": "vid", "icon": "film", "title": _("Video generatsiya"),
         "desc": _("Matnli tavsifdan to'liq video yaratish, animatsiya va kontent ishlab chiqarish.")},
        {"mod": "img", "icon": "shield", "title": _("Kontent moderatsiyasi"),
         "desc": _("Ijtimoiy tarmoqlarda nomaqbul tasvir va videolarni avtomatik aniqlash.")},
        {"mod": "aud", "icon": "note", "title": _("Musiqa yaratish"),
         "desc": _("AI yangi musiqa kompozitsiyalari va ovoz effektlarini generatsiya qiladi.")},
        {"mod": "vid", "icon": "car", "title": _("Avtonom transport"),
         "desc": _("Real vaqtda video oqimini tahlil qilib, yo'l va to'siqlarni aniqlash.")},
    ]

    # Modality deep-dive pipelines
    deepdives = [
        {"mod": "img", "title": _("Tasvir qanday qayta ishlanadi"),
         "steps": [_("Piksellar"), _("Filtrlar / patchlar"), _("Xususiyatlar"), _("Tasnif yoki generatsiya")]},
        {"mod": "aud", "title": _("Audio qanday qayta ishlanadi"),
         "steps": [_("To'lqin shakli"), _("Spektrogramma"), _("Vaqtli xususiyatlar"), _("Matn yoki ovoz")]},
        {"mod": "vid", "title": _("Video qanday qayta ishlanadi"),
         "steps": [_("Kadrlar"), _("Fazoviy-vaqtli tahlil"), _("Harakat"), _("Tushunish yoki generatsiya")]},
    ]

    return render(request, "home.html", {
        "timeline": timeline, "acc_bars": acc_bars, "models": models,
        "table": table, "usecases": usecases, "deepdives": deepdives,
        "labels_json": _build_labels(request),
    })


def _build_labels(request):
    """Common ImageNet English labels -> UZ/QQ translations as JSON."""
    import json as _json
    from django.utils.translation import get_language
    lang = get_language() or "uz"
    # (uz, kaa) pairs for frequently-seen objects
    pairs = {
        "cat": ("Mushuk", "Pıshıq"), "Egyptian cat": ("Mushuk", "Pıshıq"),
        "tabby": ("Mushuk", "Pıshıq"), "tiger cat": ("Mushuk", "Pıshıq"),
        "dog": ("It", "İyt"), "Labrador retriever": ("It (Labrador)", "İyt (Labrador)"),
        "golden retriever": ("It (Golden retriever)", "İyt (Golden retriever)"),
        "German shepherd": ("Nemis ovcharkasi", "Nemis ovcharkası"),
        "person": ("Odam", "Adam"), "laptop": ("Noutbuk", "Noutbuk"),
        "notebook": ("Noutbuk", "Noutbuk"), "computer keyboard": ("Klaviatura", "Klaviatura"),
        "cellular telephone": ("Telefon", "Telefon"), "cellphone": ("Telefon", "Telefon"),
        "mouse": ("Sichqoncha", "Tıshqan"), "coffee mug": ("Krujka", "Krujka"),
        "cup": ("Piyola", "Tabaq"), "water bottle": ("Suv shishasi", "Suw shishesi"),
        "wine bottle": ("Shisha", "Shishe"), "banana": ("Banan", "Banan"),
        "orange": ("Apelsin", "Apelsin"), "lemon": ("Limon", "Limon"),
        "apple": ("Olma", "Alma"), "Granny Smith": ("Olma", "Alma"),
        "strawberry": ("Qulupnay", "Qulupnay"), "pizza": ("Pitsa", "Pitsa"),
        "car": ("Mashina", "Mashina"), "sports car": ("Sport mashina", "Sport mashina"),
        "minivan": ("Mikroavtobus", "Mikroavtobus"), "pickup": ("Pikap", "Pikap"),
        "bicycle": ("Velosiped", "Velosiped"), "mountain bike": ("Velosiped", "Velosiped"),
        "motor scooter": ("Skuter", "Skuter"), "book": ("Kitob", "Kitap"),
        "bookcase": ("Kitob javoni", "Kitap javanı"), "chair": ("Stul", "Orındıq"),
        "desk": ("Stol", "Üstel"), "dining table": ("Stol", "Üstel"),
        "clock": ("Soat", "Saat"), "analog clock": ("Soat", "Saat"),
        "digital clock": ("Raqamli soat", "Sanlı saat"), "wall clock": ("Devor soati", "Diywal saatı"),
        "television": ("Televizor", "Televizor"), "monitor": ("Monitor", "Monitor"),
        "flower": ("Gul", "Gúl"), "daisy": ("Romashka", "Romashka"),
        "rose": ("Atirgul", "Gúl"), "sunflower": ("Kungaboqar", "Gúnbaǵar"),
        "tree": ("Daraxt", "Daraqt"), "umbrella": ("Soyabon", "Sayaban"),
        "backpack": ("Ryukzak", "Ryukzak"), "sunglasses": ("Ko'zoynak", "Kózáynek"),
        "running shoe": ("Krossovka", "Krossovka"), "sandal": ("Sandal", "Sandal"),
        "table lamp": ("Stol chirog'i", "Üstel shıraǵı"), "teapot": ("Choynak", "Sháynek"),
        "spoon": ("Qoshiq", "Qasıq"), "plate": ("Tarelka", "Tabaq"),
        "bird": ("Qush", "Qus"), "fish": ("Baliq", "Balıq"),
        "horse": ("Ot", "At"), "cow": ("Sigir", "Sıyır"), "sheep": ("Qo'y", "Qoy"),
        "elephant": ("Fil", "Pil"), "lion": ("Sher", "Arıslan"),
        "bear": ("Ayiq", "Ayıw"), "rabbit": ("Quyon", "Qoyan"),
    }
    idx = 1 if lang == "kaa" else 0
    return _json.dumps({k: v[idx] for k, v in pairs.items()}, ensure_ascii=False)


# --- Vision (multimodal) prompt ---
VISION_PROMPT = (
    "You are an expert image analyst. The user has uploaded an image and wants a "
    "detailed, engaging explanation of what is in it for a general audience.\n\n"
    "Respond using this EXACT structure:\n"
    "1. First line: ONLY the main object's name as a short phrase (no labels, no "
    "prefix, no period). 1-4 words.\n"
    "2. Then a blank line.\n"
    "3. Then sections — each label on its own line followed by a colon, then the "
    "content. Translate the section labels into the target language. Use these "
    "three sections in this order:\n"
    "   - Description (a short visual description of the scene, 1-2 sentences)\n"
    "   - Interesting facts (3 to 4 separate, educational, surprising facts about "
    "the main object — one short sentence each, on the same paragraph)\n"
    "   - Where it is found (typical context, environment or use, 1-2 sentences)\n\n"
    "Separate sections with a blank line. Do NOT use markdown symbols like # or *. "
    "Do NOT add an extra summary at the end. Keep total length around 150-220 words.\n"
    "You MUST write your ENTIRE answer in {lang}. Translate even the section labels "
    "into {lang}. Do not use any other language."
)

# Hard cap on raw image bytes to keep token costs predictable.
# Frontend should also downscale before sending.
MAX_IMAGE_BYTES = 2 * 1024 * 1024  # 2 MB


@require_POST
@csrf_protect
def chat_api(request):
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid request."}, status=400)

    message = (payload.get("message") or "").strip()
    if not message:
        return JsonResponse({"error": "Empty message."}, status=400)

    lang = get_language() or "uz"
    lang = lang if lang in LANG_NAMES else "uz"
    lang_name = LANG_NAMES[lang]

    if not settings.OPENROUTER_API_KEY:
        return JsonResponse(
            {"error": "API key not configured. Add OPENROUTER_API_KEY to your .env file."},
            status=503,
        )

    history = payload.get("history", [])
    messages = [{"role": "system", "content": SYSTEM_PROMPT.format(lang=lang_name)}]
    for h in history[-8:]:
        role = h.get("role")
        content = (h.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": message})

    try:
        resp = requests.post(
            settings.OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Multimedia AI Models",
            },
            json={
                "model": settings.OPENROUTER_MODEL,
                "messages": messages,
                "temperature": 0.6,
                "max_tokens": 1200,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        reply = data["choices"][0]["message"]["content"].strip()
        return JsonResponse({"reply": reply})
    except requests.exceptions.Timeout:
        return JsonResponse({"error": "The model took too long to respond. Try again."}, status=504)
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Connection error: {e}"}, status=502)
    except (KeyError, IndexError, ValueError):
        return JsonResponse({"error": "Unexpected response from the model."}, status=502)


DESCRIBE_PROMPT = (
    "You are an assistant that explains objects detected in images by a computer "
    "vision model (MobileNetV2 trained on ImageNet). The user uploaded a photo and "
    "the model detected the object below. Write a clear, engaging, educational "
    "description of this object for a general audience.\n\n"
    "Structure your answer with these sections (use the section labels translated "
    "into the target language):\n"
    "1. What it is — a short definition (1-2 sentences)\n"
    "2. Key facts — 3 to 4 interesting facts as separate short points\n"
    "3. Where it is found / used — typical context\n"
    "4. How AI recognizes it — one sentence on what visual features a CNN uses to "
    "identify this object.\n\n"
    "Keep it concise but informative (about 120-180 words total). Do NOT use "
    "markdown symbols like # or *. Separate sections with a blank line and put the "
    "section label on its own line followed by a colon. "
    "You MUST write your entire answer in {lang}. Do not use any other language."
)


@require_POST
@csrf_protect
def describe_api(request):
    """Given a detected object label, return a detailed description in the UI language."""
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid request."}, status=400)

    label = (payload.get("label") or "").strip()
    label_uz = (payload.get("label_local") or "").strip()
    if not label:
        return JsonResponse({"error": "No label."}, status=400)

    lang = get_language() or "uz"
    lang = lang if lang in LANG_NAMES else "uz"
    lang_name = LANG_NAMES[lang]

    if not settings.OPENROUTER_API_KEY:
        return JsonResponse(
            {"error": "API key not configured. Add OPENROUTER_API_KEY to your .env file."},
            status=503,
        )

    obj = f"{label_uz} ({label})" if label_uz else label
    messages = [
        {"role": "system", "content": DESCRIBE_PROMPT.format(lang=lang_name)},
        {"role": "user", "content": f"Detected object: {obj}"},
    ]

    try:
        resp = requests.post(
            settings.OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Multimedia AI Models",
            },
            json={
                "model": settings.OPENROUTER_MODEL,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 600,
            },
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()
        reply = data["choices"][0]["message"]["content"].strip()
        return JsonResponse({"description": reply})
    except requests.exceptions.Timeout:
        return JsonResponse({"error": "Timeout. Try again."}, status=504)
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Connection error: {e}"}, status=502)
    except (KeyError, IndexError, ValueError):
        return JsonResponse({"error": "Unexpected response."}, status=502)


@require_POST
@csrf_protect
def vision_api(request):
    """
    Analyze an uploaded image with a multimodal model (OpenRouter vision) and
    return a structured description in the currently selected UI language (UZ/QQ).

    Request JSON: {"image": "<data URL or raw base64>"}
    Response JSON: {"object": "<short name>", "description": "<sectioned text>",
                    "model": "<model id>"}
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"error": "Invalid request."}, status=400)

    image_data = (payload.get("image") or "").strip()
    if not image_data:
        return JsonResponse({"error": "No image provided."}, status=400)

    # Accept either a data URL ("data:image/jpeg;base64,...") or raw base64.
    if image_data.startswith("data:"):
        if "," not in image_data:
            return JsonResponse({"error": "Invalid image format."}, status=400)
        b64_only = image_data.split(",", 1)[1]
        data_url = image_data
    else:
        b64_only = image_data
        data_url = f"data:image/jpeg;base64,{image_data}"

    # base64 expands payload by ~33%; (len * 3) / 4 ≈ raw byte size
    raw_size = (len(b64_only) * 3) // 4
    if raw_size > MAX_IMAGE_BYTES:
        return JsonResponse(
            {"error": "Image too large. Maximum 2MB. Try a smaller or compressed image."},
            status=413,
        )

    lang = get_language() or "uz"
    lang = lang if lang in LANG_NAMES else "uz"
    lang_name = LANG_NAMES[lang]

    if not settings.OPENROUTER_API_KEY:
        return JsonResponse(
            {"error": "API key not configured. Add OPENROUTER_API_KEY to your .env file."},
            status=503,
        )

    messages = [
        {"role": "system", "content": VISION_PROMPT.format(lang=lang_name)},
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Analyze this image. Follow the response structure exactly."},
                {"type": "image_url", "image_url": {"url": data_url}},
            ],
        },
    ]

    try:
        resp = requests.post(
            settings.OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Multimedia AI Models",
            },
            json={
                "model": settings.OPENROUTER_VISION_MODEL,
                "messages": messages,
                "temperature": 0.6,
                "max_tokens": 700,
            },
            timeout=90,
        )
        # OpenRouter returns 402 when the account is out of credits — surface clearly.
        if resp.status_code == 402:
            return JsonResponse(
                {"error": "OpenRouter credits exhausted. Add credits at openrouter.ai/credits."},
                status=502,
            )
        resp.raise_for_status()
        data = resp.json()
        reply = (data["choices"][0]["message"]["content"] or "").strip()
        if not reply:
            return JsonResponse({"error": "Empty model response."}, status=502)

        # First non-empty line is the object name; the rest is the structured body.
        lines = reply.split("\n")
        object_name = ""
        body_start = 0
        for i, line in enumerate(lines):
            if line.strip():
                object_name = line.strip().rstrip(".:")
                body_start = i + 1
                break
        description = "\n".join(lines[body_start:]).lstrip("\n")

        return JsonResponse({
            "object": object_name or reply[:60],
            "description": description,
            "model": settings.OPENROUTER_VISION_MODEL,
        })
    except requests.exceptions.Timeout:
        return JsonResponse(
            {"error": "The vision model took too long to respond. Try a smaller image."},
            status=504,
        )
    except requests.exceptions.RequestException as e:
        return JsonResponse({"error": f"Connection error: {e}"}, status=502)
    except (KeyError, IndexError, ValueError):
        return JsonResponse({"error": "Unexpected response from the vision model."}, status=502)
