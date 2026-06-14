#!/usr/bin/env python3
"""
AI model fayllarini yuklab olish skripti
========================================

Bu skript MobileNet model fayllarini Google serveridan yuklab,
loyihaning static/models/ papkasiga joylashtiradi. Shundan keyin sayt
modellarni o'z domeningizdan yuklaydi — Google'ga bog'liq bo'lmaydi va
QUIC xatosi (ERR_QUIC_PROTOCOL_ERROR) yo'qoladi.

ISHLATISH (kompyuteringizda, internet bor joyda — bir marta):
    python download_models.py

Skript 3 ta modelni yuklaydi:
    - fast      (MobileNetV2 alpha=0.5, ~5 MB)  -> static/models/fast/
    - balanced  (MobileNetV2 alpha=1.0, ~14 MB) -> static/models/balanced/
    - accurate  (MobileNetV2 alpha=1.0, ~14 MB) -> static/models/accurate/

Eslatma: balanced va accurate bir xil model (alpha=1.0). "accurate" rejimi
ko'proq nomzodni tahlil qiladi. Joy tejash uchun bitta nusxa ishlatiladi.

Yuklab bo'lgach, modellar avtomatik ravishda saytda ishlaydi.
"""
import json
import os
import sys
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE, "static", "models")

# TF.js MobileNetV2 modellari. mobilenet kutubxonasi modelUrl berilganda
# tf.loadGraphModel(modelUrl) ni chaqiradi — demak bizga standart TF.js
# GraphModel formati (model.json + .bin shardlar) kerak.
# Har bir variant uchun bir nechta ma'lum host manzilini sinab ko'ramiz
# (biri ishlamasa keyingisi).
MODELS = {
    "fast": [
        "https://storage.googleapis.com/tfhub-tfjs-modules/google/imagenet/mobilenet_v2_050_224/classification/3/model.json",
        "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_050_224/classification/3/default/1/model.json?tfjs-format=file",
    ],
    "balanced": [
        "https://storage.googleapis.com/tfhub-tfjs-modules/google/imagenet/mobilenet_v2_100_224/classification/3/model.json",
        "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v2_100_224/classification/3/default/1/model.json?tfjs-format=file",
    ],
}
# "accurate" balanced bilan bir xil — alohida yuklamaymiz, JS uni balanced'dan oladi.


def download(url, dest):
    print(f"  yuklanmoqda: {os.path.basename(dest)} ...", end=" ", flush=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        with open(dest, "wb") as f:
            f.write(data)
        print(f"OK ({len(data)//1024} KB)")
        return data
    except Exception as e:
        print(f"XATO: {e}")
        return None


def fetch_model(key, url_candidates):
    out_dir = os.path.join(MODELS_DIR, key)
    os.makedirs(out_dir, exist_ok=True)

    print(f"\n[{key}] modeli:")
    # Try each candidate model.json URL until one works
    manifest = None
    base_url = None
    for model_json_url in url_candidates:
        data = download(model_json_url, os.path.join(out_dir, "model.json"))
        if data is None:
            continue
        try:
            manifest = json.loads(data.decode("utf-8"))
            # base url = everything before the last '/', stripping any query string
            base_url = model_json_url.split("?")[0].rsplit("/", 1)[0]
            break
        except Exception:
            manifest = None
    if manifest is None:
        print(f"  !! {key} model.json yuklanmadi (hamma manzillar ishlamadi).")
        return False

    # binary shard fayllari (model.json ichida ko'rsatilgan)
    paths = []
    for group in manifest.get("weightsManifest", []):
        paths.extend(group.get("paths", []))
    if not paths:
        print("  !! shard fayllar topilmadi (manifest bo'sh).")
        return False
    ok = True
    for p in paths:
        d = download(f"{base_url}/{p}", os.path.join(out_dir, p))
        if d is None:
            ok = False
    return ok


def main():
    print("=" * 56)
    print(" AI model fayllarini yuklab olish")
    print("=" * 56)
    os.makedirs(MODELS_DIR, exist_ok=True)

    results = {}
    for key, urls in MODELS.items():
        results[key] = fetch_model(key, urls)

    # accurate = balanced nusxasi
    bal = os.path.join(MODELS_DIR, "balanced")
    acc = os.path.join(MODELS_DIR, "accurate")
    if results.get("balanced") and os.path.isdir(bal):
        import shutil
        if os.path.isdir(acc):
            shutil.rmtree(acc)
        shutil.copytree(bal, acc)
        print("\n[accurate] balanced nusxasi sifatida yaratildi.")
        results["accurate"] = True

    print("\n" + "=" * 56)
    done = [k for k, v in results.items() if v]
    failed = [k for k, v in results.items() if not v]
    if done:
        print(f" Tayyor: {', '.join(done)}")
        print(" Modellar static/models/ papkasiga saqlandi.")
        print(" Endi 'python manage.py collectstatic' ni ishga tushiring")
        print(" yoki saytni qayta deploy qiling.")
    if failed:
        print(f" Yuklanmadi: {', '.join(failed)}")
        print(" Internet aloqasini tekshiring va qayta urinib ko'ring.")
        print(" (Sayt baribir ishlaydi — model Google CDN'dan yuklanadi.)")
    print("=" * 56)
    # Build jarayonini to'xtatmaslik uchun har doim 0 qaytaramiz.
    # Model yuklanmasa ham sayt CDN zaxirasi bilan ishlaydi.
    return 0


if __name__ == "__main__":
    sys.exit(main())
