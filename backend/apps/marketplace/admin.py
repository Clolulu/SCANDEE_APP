from django.contrib import admin
from .models import VendorProfile, Product, Order, OrderItem

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('shop_name', 'user', 'phone', 'created_at')
    search_fields = ('shop_name', 'user__email')

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'vendor', 'price', 'available', 'stock_quantity')
    list_filter = ('available',)

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'tourist', 'vendor', 'order_total', 'service_fee', 'charge_amount', 'gateway_fee', 'vendor_payout', 'platform_profit', 'payment_status', 'order_status', 'created_at')
    inlines = [OrderItemInline]
    list_filter = ('payment_status', 'order_status')
