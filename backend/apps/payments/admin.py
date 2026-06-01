from django.contrib import admin
from .models import Transaction
@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('omise_charge_id', 'order', 'payment_status', 'amount', 'created_at')
    list_filter = ('payment_status',)
    search_fields = ('omise_charge_id', 'order__id')
    ordering = ('-created_at',)
