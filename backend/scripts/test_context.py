import os
import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
from django.template import Context, RequestContext
from django.http import HttpRequest

django.setup()

c = Context({'a': 1})
d = c.__copy__()
print('Context', type(d), hasattr(d, 'dicts'), d.dicts)

r = HttpRequest()
r.META = {}
rc = RequestContext(r, {'a': 1})
rd = rc.__copy__()
print('RequestContext', type(rd), hasattr(rd, 'dicts'), hasattr(rd, 'template'), getattr(rd, 'template', None), hasattr(rd, 'render_context'))
