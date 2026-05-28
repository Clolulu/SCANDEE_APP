import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import Client
from apps.accounts.management.commands.seed_demo_users import Command
from apps.accounts.models import User
from apps.marketplace.models import VendorProfile, Product

if __name__ == '__main__':
    Command().handle()
    client = Client(HTTP_HOST='localhost')
    print('Testing login for buyer@test.com...')
    response = client.post('/api/auth/login/', data=json.dumps({'email': 'buyer@test.com', 'password': 'test123'}), content_type='application/json', HTTP_HOST='localhost')
    print('Status:', response.status_code)
    if response.status_code != 200:
        print('Response:', response.content)
        raise SystemExit('Buyer login failed')
    data = response.json()
    print('Response:', data)

    buyer = User.objects.get(email='buyer@test.com')
    vendor_user = User.objects.get(email='vendor@test.com')
    vendor_profile = VendorProfile.objects.filter(user=vendor_user).first()
    if not vendor_profile:
        raise SystemExit('Vendor profile missing')

    product, created = Product.objects.get_or_create(
        vendor=vendor_profile,
        name='Demo Product',
        defaults={
            'description': 'Demo product for auth smoke test.',
            'price': 99.99,
            'available': True,
            'stock_quantity': 10,
        },
    )
    if created:
        print('Created demo product for vendor.')

    headers = {'HTTP_HOST': 'localhost'}
    client.defaults.update(headers)
    token = data['access']
    client.defaults['HTTP_AUTHORIZATION'] = f'Bearer {token}'

    print('Creating order...')
    total_amount = float(product.price) * 1
    order_response = client.post(
        '/api/store/orders/',
        data=json.dumps({
            'vendor': vendor_profile.id,
            'items': [{'product_id': product.id, 'quantity': 1}],
        }),
        content_type='application/json',
        **headers,
    )
    print('Order status:', order_response.status_code)
    if order_response.status_code not in (200, 201):
        print('Order response:', order_response.content)
        raise SystemExit('Order creation failed')
    order_data = order_response.json()
    print('Order created:', order_data)

    print('Charging order...')
    charge_response = client.post(
        '/api/payments/charge/',
        data=json.dumps({'order_id': order_data['id'], 'omise_token': 'tok_test_12345'}),
        content_type='application/json',
        **headers,
    )
    print('Charge status:', charge_response.status_code)
    print('Charge response:', charge_response.json())
    if charge_response.status_code != 200:
        raise SystemExit('Charge failed')
    print('Payment flow smoke test passed.')
