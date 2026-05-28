from django.db import transaction
from .models import User
from apps.marketplace.models import VendorProfile, Product

DEMO_TOURIST = {
    'email': 'tourist@test.com',
    'password': '12345678',
    'full_name': 'Demo Tourist',
}

DEMO_VENDOR = {
    'email': 'vendor@test.com',
    'password': '12345678',
    'full_name': 'Somchai',
    'shop_name': 'Demo Thai Street Food',
    'phone': '0812345678',
    'description': 'Authentic local Thai street food vendor demo.',
}

DEMO_PRODUCTS = [
    {'name': 'Mango Sticky Rice', 'description': 'Sweet mango, sticky rice, and creamy coconut sauce.', 'price': 120.00},
    {'name': 'Thai Milk Tea', 'description': 'Refreshing iced milk tea with Thai spices.', 'price': 60.00},
    {'name': 'Pad Thai', 'description': 'Classic stir-fried noodles with tamarind sauce.', 'price': 150.00},
]


def create_demo_accounts():
    with transaction.atomic():
        tourist, _ = User.objects.get_or_create(
            email=DEMO_TOURIST['email'],
            defaults={
                'role': 'tourist',
                'full_name': DEMO_TOURIST['full_name'],
            },
        )
        if not tourist.pk:
            return
        if not tourist.check_password(DEMO_TOURIST['password']):
            tourist.set_password(DEMO_TOURIST['password'])
            tourist.save(update_fields=['password'])

        vendor, created = User.objects.get_or_create(
            email=DEMO_VENDOR['email'],
            defaults={
                'role': 'vendor',
                'full_name': DEMO_VENDOR['full_name'],
            },
        )
        if vendor.role != 'vendor':
            vendor.role = 'vendor'
        if not vendor.check_password(DEMO_VENDOR['password']):
            vendor.set_password(DEMO_VENDOR['password'])
        vendor.save()

        vendor_profile, _ = VendorProfile.objects.get_or_create(
            user=vendor,
            defaults={
                'shop_name': DEMO_VENDOR['shop_name'],
                'description': DEMO_VENDOR['description'],
                'phone': DEMO_VENDOR['phone'],
            },
        )
        if not vendor_profile.qr_code:
            vendor_profile.qr_code = f'/store/{vendor_profile.id}'
            vendor_profile.save(update_fields=['qr_code'])

        for product_data in DEMO_PRODUCTS:
            Product.objects.get_or_create(
                vendor=vendor_profile,
                name=product_data['name'],
                defaults={
                    'description': product_data['description'],
                    'price': product_data['price'],
                    'available': True,
                    'stock_quantity': 50,
                },
            )
