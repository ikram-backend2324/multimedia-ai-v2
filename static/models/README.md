# AI Model fayllari

Bu papka MobileNet model fayllari uchun.

## Modellarni yuklab olish

Loyiha ildizida quyidagini ishga tushiring:

```
python download_models.py
```

Bu 3 ta modelni yuklab, shu papkaga joylashtiradi:
- `fast/`     — MobileNetV2 alpha=0.5 (~5 MB)
- `balanced/` — MobileNetV2 alpha=1.0 (~14 MB)
- `accurate/` — balanced nusxasi

## Nega kerak?

Modellar Google serveridan (storage.googleapis.com) yuklanganda ba'zi
tarmoqlarda `ERR_QUIC_PROTOCOL_ERROR` xatosi chiqadi. Modellarni o'z
saytingizdan berish bu muammoni butunlay hal qiladi.

Agar bu papkada model fayllari bo'lmasa, sayt avtomatik ravishda
Google CDN'dan yuklashga qaytadi (zaxira variant).
