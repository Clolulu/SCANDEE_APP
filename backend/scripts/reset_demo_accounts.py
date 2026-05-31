from apps.accounts.models import User
from apps.marketplace.models import VendorProfile, Product, Order, OrderItem

print('Deleting dependent marketplace data (OrderItems, Orders, Products, VendorProfiles)...')
OrderItem.objects.all().delete()
Order.objects.all().delete()
Product.objects.all().delete()
VendorProfile.objects.all().delete()
print('Dependent marketplace data deleted.')

print('Deleting existing vendor and customer users...')
User.objects.filter(role__in=['vendor', 'tourist']).delete()
print('Deleted.')

print('Creating 2 customer accounts...')
customers = [
    {'email': 'customer1@example.com', 'password': 'Password123!', 'full_name': 'Customer One'},
    {'email': 'customer2@example.com', 'password': 'Password123!', 'full_name': 'Customer Two'},
]
for c in customers:
    u = User.objects.create_user(email=c['email'], password=c['password'], role='tourist', full_name=c['full_name'])
    print('Created customer:', u.email)

print('Creating 4 vendor accounts with VendorProfile...')
vendors = [
    {'email': 'vendor_pizza@example.com', 'password': 'Password123!', 'full_name': 'Pepper Pizza', 'shop_name': 'Pepperoni Palace', 'description': 'Authentic wood-fired pizzas', 'category': 'Food'},
    {'email': 'vendor_coffee@example.com', 'password': 'Password123!', 'full_name': 'Cora Coffee', 'shop_name': "Cora's Cafe", 'description': 'Specialty coffee and pastries', 'category': 'Drink'},
    {'email': 'vendor_dessert@example.com', 'password': 'Password123!', 'full_name': 'Dulce Desserts', 'shop_name': 'Dulce Delights', 'description': 'Desserts and sweets', 'category': 'Dessert'},
    {'email': 'vendor_juice@example.com', 'password': 'Password123!', 'full_name': 'Jules Juices', 'shop_name': 'Juice Junction', 'description': 'Fresh cold-pressed juices', 'category': 'Drink'},
]
for v in vendors:
    u = User.objects.create_user(email=v['email'], password=v['password'], role='vendor', full_name=v['full_name'])
    vp = VendorProfile.objects.create(user=u, shop_name=v['shop_name'], description=v['description'], category=v['category'], phone='', address='', business_hours='09:00-18:00')
    print('Created vendor:', u.email, 'shop:', vp.shop_name)

print('Done.')
