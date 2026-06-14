from django.contrib import admin
from django.urls import path
from django.conf.urls.i18n import set_language
from core import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("i18n/setlang/", set_language, name="set_language"),
    path("", views.home, name="home"),
    path("api/chat/", views.chat_api, name="chat_api"),
    path("api/describe/", views.describe_api, name="describe_api"),
    path("api/vision/", views.vision_api, name="vision_api"),
]
