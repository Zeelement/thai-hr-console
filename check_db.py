"""Database preflight for start.bat.

Prints the connection parameters that are actually in effect (password is never
printed) and attempts a real connection. Kept separate from application code so
a failed connection produces a short, readable message instead of a traceback.
"""
import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django  # noqa: E402

django.setup()

from django.conf import settings  # noqa: E402
from django.db import connection  # noqa: E402

cfg = settings.DATABASES["default"]
engine = cfg["ENGINE"]
print("  Engine : %s" % engine)

if engine == "django.db.backends.sqlite3":
    print("  File   : %s" % cfg["NAME"])
else:
    print("  Host   : %s" % cfg["HOST"])
    print("  Port   : %s" % cfg["PORT"])
    print("  DB     : %s" % cfg["NAME"])
    print("  User   : %s" % cfg["USER"])
    print("  Driver : %s" % cfg.get("OPTIONS", {}).get("driver", "(default)"))

try:
    connection.ensure_connection()
except Exception as exc:  # noqa: BLE001 - preflight must show any failure plainly
    detail = " ".join(str(exc).split())
    print("  [FAIL] %s" % detail[:400])
    print("  Check: server running? host/port correct? database exists?")
    print("         credentials / ODBC driver valid?")
    sys.exit(1)

print("  [OK] Database is reachable.")
