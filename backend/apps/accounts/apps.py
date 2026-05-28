import os
import sys
from django.apps import AppConfig

class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'
    verbose_name = 'Accounts'

    def ready(self):
        if os.environ.get('RUN_MAIN') != 'true':
            return
        if any(arg in sys.argv for arg in ['makemigrations', 'migrate', 'collectstatic', 'shell', 'test', 'flush']):
            return
        try:
            from .demo import create_demo_accounts
            create_demo_accounts()
        except Exception:
            pass
