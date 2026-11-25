"""页面入口、登录签发令牌、带 JWT 的 state 读写接口。"""
import json
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.contrib.auth import authenticate
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.static import serve

from .auth import issue_token, require_jwt
from .models import (
    AppSetting,
    Attendance,
    Department,
    Device,
    Document,
    Employee,
    Payroll,
    Punch,
)

BASE_DIR = Path(settings.BASE_DIR)

# 前端仍以原生文件形式放在项目根目录；仅暴露运行所需文件。
ASSET_WHITELIST = {"app.js", "data.js", "styles.css", "api.js", "main.js"}


def _json_safe(value):
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    return value


def _rows(queryset):
    return _json_safe(list(queryset.values()))


def index(request):
    html = (BASE_DIR / "index.html").read_text(encoding="utf-8")
    return HttpResponse(html, content_type="text/html; charset=utf-8")


def frontend_asset(request, asset):
    if asset in ASSET_WHITELIST or asset.startswith("vendor/"):
        return serve(request, asset, document_root=str(BASE_DIR))
    return HttpResponse("Not Found", status=404)


def health(request):
    return JsonResponse({"ok": True})


@csrf_exempt
def login(request):
    if request.method != "POST":
        return JsonResponse({"code": 405, "message": "Method Not Allowed"}, status=405)
    try:
        body = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"code": 400, "message": "请求格式不正确"}, status=400)
    user = authenticate(
        request,
        username=str(body.get("username", "")).strip(),
        password=str(body.get("password", "")),
    )
    if user is None or not user.is_active:
        return JsonResponse({"code": 401, "message": "用户名或密码错误"}, status=401)
    return JsonResponse(
        {
            "token": issue_token(user),
            "username": user.username,
            "expiresIn": int(settings.JWT_EXPIRE_SECONDS),
        }
    )


def _serialize_state():
    setting_row = AppSetting.objects.first()
    if setting_row is None:
        return {"seeded": False, "state": None}

    setting = _json_safe(setting_row.__dict__)
    meta = {
        "version": setting.pop("version", 2),
        "createdAt": setting.pop("createdAt", ""),
        "seeded": setting.pop("seeded", True),
    }
    setting.pop("id", None)
    setting.pop("_state", None)

    state = {
        "version": meta["version"],
        "settings": setting,
        "departments": _rows(Department.objects.all()),
        "employees": _rows(Employee.objects.all()),
        "attendance": _rows(Attendance.objects.all()),
        "punches": _rows(Punch.objects.all()),
        "devices": _rows(Device.objects.all()),
        "payroll": _rows(Payroll.objects.all()),
        "documents": _rows(Document.objects.all()),
        "meta": meta,
    }
    return {"seeded": True, "state": state}


@csrf_exempt
@require_jwt
def state(request):
    """一次性读写整个业务 state，字段与前端现有 state 完全一致。"""
    if request.method == "GET":
        return JsonResponse(_serialize_state())

    if request.method != "PUT":
        return JsonResponse({"code": 405, "message": "Method Not Allowed"}, status=405)

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        return JsonResponse({"code": 400, "message": "请求格式不正确"}, status=400)

    if not isinstance(payload.get("settings"), dict) or not isinstance(payload.get("employees"), list):
        return JsonResponse({"code": 400, "message": "数据结构不正确"}, status=400)

    try:
        _replace_state(payload)
    except Exception as exc:  # 避免把数据库细节暴露给前端
        return JsonResponse({"code": 500, "message": "保存失败：%s" % exc}, status=500)
    return JsonResponse({"ok": True})


@transaction.atomic
def _replace_state(payload):
    setting_data = dict(payload["settings"])
    meta = dict(payload.get("meta") or {})
    setting_data["version"] = meta.get("version", payload.get("version", 2))
    setting_data["createdAt"] = meta.get("createdAt", "")
    setting_data["seeded"] = meta.get("seeded", True)

    AppSetting.objects.all().delete()
    for model in (Department, Employee, Attendance, Punch, Device, Payroll, Document):
        model.objects.all().delete()

    _create_rows(AppSetting, [setting_data])
    _create_rows(Department, payload.get("departments") or [])
    _create_rows(Employee, payload.get("employees") or [])
    _create_rows(Attendance, payload.get("attendance") or [])
    _create_rows(Punch, payload.get("punches") or [])
    _create_rows(Device, payload.get("devices") or [])
    _create_rows(Payroll, payload.get("payroll") or [])
    _create_rows(Document, payload.get("documents") or [])


def _create_rows(model, rows):
    fields = {f.name for f in model._meta.fields}
    objects = []
    for row in rows:
        if not isinstance(row, dict):
            continue
        data = {k: v for k, v in row.items() if k in fields}
        if model is AppSetting:
            data["id"] = 1
        objects.append(model(**data))
    if objects:
        model.objects.bulk_create(objects)
