import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from apps.marketplace.models import VendorProfile, Product

vp = VendorProfile.objects.first()
print('vendor profile:', vp and vp.id, vp and vp.user_id, vp and vp.shop_name)
print('products by vendor pk:', list(Product.objects.filter(vendor__id=vp.id).values('id', 'name', 'available', 'stock_quantity')))
print('products by vendor user id:', list(Product.objects.filter(vendor__user_id=vp.user_id).values('id', 'name')))
