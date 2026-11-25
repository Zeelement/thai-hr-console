from django.urls import include, path

from hrapi import views

urlpatterns = [
    path("api/", include("hrapi.urls")),
    path("", views.index, name="index"),
    # 仅暴露前端运行所需文件，避免把 manage.py / settings 等暴露出去。
    path("<path:asset>", views.frontend_asset, name="frontend-asset"),
]
