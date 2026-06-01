from django.contrib import admin
from .models import VendorProfile, Product, Order, OrderItem, Payout


@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ('shop_name', 'user_email', 'phone', 'payout_schedule', 'available_balance', 'pending_balance', 'created_at')
    search_fields = ('shop_name', 'user__email')
    list_filter = ('payout_schedule',)
    ordering = ('-created_at',)

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User Email'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'vendor', 'price', 'available', 'stock_quantity', 'created_at')
    search_fields = ('name', 'vendor__shop_name')
    list_filter = ('available', 'vendor')
    ordering = ('-created_at',)
    actions = ('mark_available', 'mark_unavailable')

    @admin.action(description='Mark selected products as available')
    def mark_available(self, request, queryset):
        updated = queryset.update(available=True)
        self.message_user(request, f'Marked {updated} product(s) available')

    @admin.action(description='Mark selected products as unavailable')
    def mark_unavailable(self, request, queryset):
        updated = queryset.update(available=False)
        self.message_user(request, f'Marked {updated} product(s) unavailable')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'tourist_email', 'vendor', 'order_total', 'payment_status', 'order_status', 'created_at')
    inlines = [OrderItemInline]
    list_filter = ('payment_status', 'order_status', 'vendor')
    search_fields = ('tourist__email', 'id')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'

    def tourist_email(self, obj):
        return obj.tourist.email
    tourist_email.short_description = 'Customer'


@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ('id', 'vendor', 'amount', 'status', 'payout_method', 'scheduled_at', 'processed_at', 'created_at')
    list_filter = ('status', 'payout_method')
    search_fields = ('vendor__shop_name', 'vendor__user__email')
    ordering = ('-processed_at', '-created_at')
