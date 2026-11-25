from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health, name="api-health"),
    path("auth/login/", views.login, name="api-login"),
    path("state/", views.state, name="api-state"),
]
