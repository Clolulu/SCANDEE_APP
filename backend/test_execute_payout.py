import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.marketplace.models import VendorProfile

User = get_user_model()

vendor_user = User.objects.filter(role='vendor').first()
if not vendor_user:
    # create a vendor user for testing
    vendor_user = User.objects.create_user(email='vendor-test@example.com', password='testpass123', role='vendor')

vendor_profile, created = VendorProfile.objects.get_or_create(user=vendor_user, defaults={'shop_name':'Test Vendor'})

# ensure vendor has available balance
vendor_profile.available_balance = Decimal('50.00')
vendor_profile.save(update_fields=['available_balance'])

refresh = RefreshToken.for_user(vendor_user)
access = str(refresh.access_token)

client = APIClient()
client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

print('Posting to /api/store/payouts/execute_now/ as user', vendor_user.email)
resp = client.post('/api/store/payouts/execute_now/', {}, HTTP_HOST='localhost')
print('status_code=', resp.status_code)
try:
    print('data=', resp.data)
except Exception:
    print('content=', getattr(resp, 'content', resp))

# Show vendor balances after
vendor_profile.refresh_from_db()
print('vendor.available_balance=', vendor_profile.available_balance)
print('vendor.last_payout_at=', vendor_profile.last_payout_at)

# Show latest payout
from apps.marketplace.models import Payout
p = Payout.objects.filter(vendor=vendor_profile).order_by('-created_at').first()
print('latest payout:', p and (p.id, p.amount, p.status, p.reference_number, p.payout_method, p.promptpay_id))
