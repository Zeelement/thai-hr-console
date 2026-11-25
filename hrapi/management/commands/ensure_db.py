"""Create the business database if it does not exist yet.

Connects to the system database 'master' using the same host/credentials as the
business database, then issues CREATE DATABASE when the target is missing.
SQLite mode is a no-op. Safe to run repeatedly (idempotent).
"""
import re

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connections


class Command(BaseCommand):
    help = "Create the configured SQL Server database if it is missing."

    def handle(self, *args, **options):
        databases = getattr(settings, "DATABASES", {})
        if "master" not in databases:
            self.stdout.write("SQLite mode - skipping database creation.")
            return

        db_name = databases["default"]["NAME"]
        # 库名来自配置，做最小校验后再拼接进 DDL，防止注入。
        if not re.fullmatch(r"[A-Za-z0-9_]+", str(db_name)):
            raise CommandError(
                "HR_DB_NAME contains unsupported characters; "
                "use letters, digits and underscore only."
            )

        try:
            with connections["master"].cursor() as cursor:
                cursor.execute(
                    "SELECT CASE WHEN DB_ID(%s) IS NULL THEN 0 ELSE 1 END",
                    [db_name],
                )
                exists = bool(cursor.fetchone()[0])
                if not exists:
                    cursor.execute("CREATE DATABASE [%s]" % db_name)
        except Exception as exc:  # noqa: BLE001 - surface a short, clear cause
            detail = " ".join(str(exc).split())
            raise CommandError(
                "Cannot create database '%s' via master: %s" % (db_name, detail[:400])
            )

        if not exists:
            self.stdout.write(self.style.SUCCESS("Database '%s' created." % db_name))
        else:
            self.stdout.write("Database '%s' already exists." % db_name)
