import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
from django.contrib import admin
from backend.admin_site import custom_admin_site

django.setup()

print('default registry size:', len(admin.site._registry))
print('default models:', [model._meta.label for model in admin.site._registry])
print('custom registry size:', len(custom_admin_site._registry))
print('custom models:', [model._meta.label for model in custom_admin_site._registry])
