import os
import sys
from pathlib import Path
import traceback

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
from django.contrib.auth import get_user_model
from django.test import Client

django.setup()

User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    try:
        User.objects.create_superuser(email='admin@example.com', password='adminpass')
        print('Created superuser admin@example.com')
    except Exception as e:
        print('Failed creating superuser:', e)
        raise

u = User.objects.filter(is_superuser=True).first()
if not u:
    print('No superuser found/created')
    raise SystemExit(1)

c = Client()
c.force_login(u)

urls = [
    '/admin/',
    '/admin/accounts/user/',
    '/admin/auth/group/',
    '/admin/marketplace/order/',
    '/admin/marketplace/product/',
    '/admin/marketplace/vendorprofile/',
    '/admin/marketplace/payout/',
    '/admin/payments/transaction/',
]

results = []
for url in urls:
    try:
        r = c.get(url, HTTP_HOST='localhost')
        results.append((url, r.status_code, len(r.content)))
    except Exception:
        results.append((url, 'ERROR', traceback.format_exc()))

print(results)
