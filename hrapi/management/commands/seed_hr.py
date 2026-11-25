"""创建/更新默认登录账号（可用 HR_ADMIN_USER / HR_ADMIN_PASS 覆盖）。"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "创建或更新人事工作台默认登录账号"

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.environ.get("HR_ADMIN_USER", "admin")
        password = os.environ.get("HR_ADMIN_PASS", "admin123")
        user, created = User.objects.get_or_create(
            username=username,
            defaults={"is_staff": True, "is_active": True},
        )
        user.set_password(password)
        user.is_staff = True
        user.is_active = True
        user.save()
        action = "已创建" if created else "已更新"
        self.stdout.write(self.style.SUCCESS("%s 默认账号：%s" % (action, username)))
