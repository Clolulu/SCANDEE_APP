#!/usr/bin/env python3
import os
import sys

# Ensure project settings are available
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# Add the Django project folder (contains the `backend` package) to PYTHONPATH
sys.path.insert(0, os.path.join(repo_root, 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

try:
    import django
    django.setup()
except Exception as exc:
    print('Failed to setup Django:', exc)
    raise

from apps.accounts.models import User

def create_or_update_superuser(email: str, password: str):
    user = User.objects.filter(email=email).first()
    if not user:
        User.objects.create_superuser(email=email, password=password)
        print('SUPERUSER_CREATED')
        return
    # update existing user
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.role = 'admin'
    user.save()
    print('SUPERUSER_UPDATED')

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print('Usage: create_admin.py EMAIL PASSWORD')
        sys.exit(2)
    create_or_update_superuser(sys.argv[1], sys.argv[2])
