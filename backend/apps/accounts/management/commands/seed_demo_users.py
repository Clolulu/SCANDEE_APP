from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.marketplace.models import VendorProfile

class Command(BaseCommand):
    help = 'Seed demo buyer, vendor, and admin accounts.'

    def handle(self, *args, **options):
        buyer_email = 'buyer@test.com'
        vendor_email = 'vendor@test.com'
        admin_email = 'admin@test.com'

        buyer, created = User.objects.update_or_create(
            email=buyer_email,
            defaults={
                'full_name': 'Demo Buyer',
                'role': 'tourist',
            },
        )
        buyer.set_password('test123')
        buyer.save()
        self.stdout.write(self.style.SUCCESS(f"Buyer account {'created' if created else 'updated'}: {buyer_email}"))

        vendor, created = User.objects.update_or_create(
            email=vendor_email,
            defaults={
                'full_name': 'Demo Vendor',
                'role': 'vendor',
            },
        )
        vendor.set_password('test123')
        vendor.save()
        vendor_profile, vcreated = VendorProfile.objects.get_or_create(
            user=vendor,
            defaults={
                'shop_name': 'Demo Vendor Shop',
                'phone': '+66 1234 5678',
            },
        )
        if not vcreated:
            vendor_profile.shop_name = 'Demo Vendor Shop'
            vendor_profile.phone = '+66 1234 5678'
            vendor_profile.save()
        self.stdout.write(self.style.SUCCESS(f"Vendor account {'created' if created else 'updated'}: {vendor_email}"))

        from apps.marketplace.models import Product

        demo_products = [
            {
                'name': 'Mango Sticky Rice',
                'description': 'Sweet mango with coconut sticky rice.',
                'price': 120.00,
                'available': True,
                'stock_quantity': 20,
            },
            {
                'name': 'Thai Milk Tea',
                'description': 'Refreshing iced Thai tea with milk.',
                'price': 70.00,
                'available': True,
                'stock_quantity': 30,
            },
            {
                'name': 'Coconut Ice Cream',
                'description': 'Creamy coconut ice cream with toppings.',
                'price': 90.00,
                'available': True,
                'stock_quantity': 15,
            },
        ]

        for item in demo_products:
            Product.objects.update_or_create(
                vendor=vendor_profile,
                name=item['name'],
                defaults={
                    'description': item['description'],
                    'price': item['price'],
                    'available': item['available'],
                    'stock_quantity': item['stock_quantity'],
                },
            )
        self.stdout.write(self.style.SUCCESS('Demo products created or updated for Demo Vendor Shop.'))

        admin, created = User.objects.update_or_create(
            email=admin_email,
            defaults={
                'full_name': 'Admin User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin.set_password('admin123')
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        self.stdout.write(self.style.SUCCESS(f"Admin account {'created' if created else 'updated'}: {admin_email}"))
