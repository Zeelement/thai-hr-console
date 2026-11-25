"""简洁 JWT 鉴权：签发、校验、401 统一响应。"""
import time
from functools import wraps

import jwt
from django.conf import settings
from django.http import JsonResponse

ALGORITHM = "HS256"


def unauthorized(message):
    return JsonResponse({"code": 401, "message": message}, status=401)


def issue_token(user):
    now = int(time.time())
    payload = {
        "uid": user.pk,
        "username": user.username,
        "iat": now,
        "exp": now + int(settings.JWT_EXPIRE_SECONDS),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token):
    """返回 (payload, None) 或 (None, 'expired'|'invalid')。"""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM]), None
    except jwt.ExpiredSignatureError:
        return None, "expired"
    except jwt.InvalidTokenError:
        return None, "invalid"


def require_jwt(view_func):
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith("Bearer "):
            return unauthorized("未登录")
        token = header[7:].strip()
        if not token:
            return unauthorized("未登录")
        payload, err = decode_token(token)
        if err == "expired":
            return unauthorized("登录已过期，请重新登录")
        if err == "invalid":
            return unauthorized("令牌无效，请重新登录")
        request.jwt_user = payload
        return view_func(request, *args, **kwargs)

    return wrapped
