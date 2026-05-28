from decimal import Decimal

from django.conf import settings
from rest_framework import serializers
from .models import VendorProfile, Product, Order, OrderItem
from apps.accounts.serializers import UserSerializer

class VendorProfileSerializer(serializers.ModelSerializer):
    vendor_id = serializers.IntegerField(source='user_id', read_only=True)
    owner_name = serializers.CharField(source='user.full_name', read_only=True)
    owner_email = serializers.EmailField(source='user.email', read_only=True)
    phone_number = serializers.CharField(source='phone', required=False, allow_blank=True)
    logo_image = serializers.ImageField(required=False, allow_null=True)
    banner_image = serializers.ImageField(required=False, allow_null=True)
    logo_image_url = serializers.SerializerMethodField(read_only=True)
    banner_image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = VendorProfile
        fields = (
            'id',
            'vendor_id',
            'owner_name',
            'owner_email',
            'shop_name',
            'description',
            'category',
            'phone_number',
            'address',
            'business_hours',
            'logo_image',
            'logo_image_url',
            'banner_image',
            'banner_image_url',
            'qr_code',
            'created_at',
        )

    def get_logo_image_url(self, obj):
        if not obj.logo_image:
            return None
        request = self.context.get('request')
        url = obj.logo_image.url
        return request.build_absolute_uri(url) if request else url

    def get_banner_image_url(self, obj):
        if not obj.banner_image:
            return None
        request = self.context.get('request')
        url = obj.banner_image.url
        return request.build_absolute_uri(url) if request else url

class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Product
        fields = ('id', 'vendor', 'name', 'description', 'price', 'image', 'image_url', 'available', 'stock_quantity', 'created_at')
        read_only_fields = ('vendor',)

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), source='product', write_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'product_id', 'quantity', 'subtotal')
        read_only_fields = ('subtotal',)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    tourist = UserSerializer(read_only=True)
    order_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    service_fee = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    charge_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    gateway_fee = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    vendor_payout = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    platform_profit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id',
            'tourist',
            'vendor',
            'order_total',
            'service_fee',
            'charge_amount',
            'gateway_fee',
            'vendor_payout',
            'platform_profit',
            'payment_status',
            'order_status',
            'pin_code',
            'items',
            'created_at',
        )
        read_only_fields = (
            'tourist',
            'order_total',
            'service_fee',
            'charge_amount',
            'gateway_fee',
            'vendor_payout',
            'platform_profit',
            'payment_status',
            'order_status',
            'pin_code',
        )

    def validate(self, attrs):
        vendor = attrs.get('vendor')
        items = attrs.get('items', [])

        if not items:
            raise serializers.ValidationError({'items': 'Order must include at least one product.'})

        invalid_items = [item for item in items if item['product'].vendor != vendor]
        if invalid_items:
            raise serializers.ValidationError({'items': 'All products must belong to the selected vendor.'})

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        vendor = validated_data['vendor']
        order_total = Decimal('0.00')
        for item in items_data:
            product = item['product']
            order_total += product.price * item['quantity']

        platform_fee_percent = getattr(settings, 'PLATFORM_FEE_PERCENT', Decimal('5'))
        omise_fee_percent = getattr(settings, 'OMISE_FEE_PERCENT', Decimal('3.65'))

        service_fee = (order_total * platform_fee_percent / Decimal('100')).quantize(Decimal('0.01'))
        charge_amount = (order_total + service_fee).quantize(Decimal('0.01'))
        gateway_fee = (charge_amount * omise_fee_percent / Decimal('100')).quantize(Decimal('0.01'))
        vendor_payout = order_total.quantize(Decimal('0.01'))
        platform_profit = (charge_amount - gateway_fee - vendor_payout).quantize(Decimal('0.01'))

        if charge_amount <= vendor_payout:
            raise serializers.ValidationError('Charge amount must be greater than vendor payout.')
        if platform_profit < Decimal('0.00'):
            raise serializers.ValidationError('Platform profit cannot be negative.')

        order = Order.objects.create(
            tourist=self.context['request'].user,
            order_total=order_total,
            service_fee=service_fee,
            charge_amount=charge_amount,
            gateway_fee=gateway_fee,
            vendor_payout=vendor_payout,
            platform_profit=platform_profit,
            **validated_data,
        )
        for item_data in items_data:
            OrderItem.objects.create(order=order, product=item_data['product'], quantity=item_data['quantity'])
        order.generate_pin()
        return order
