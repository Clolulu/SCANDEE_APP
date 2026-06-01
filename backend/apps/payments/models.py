from django.db import models
from django.conf import settings
from apps.marketplace.models import Order

class Transaction(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='transaction')
    omise_charge_id = models.CharField(max_length=255)
    payment_status = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Transaction {self.omise_charge_id} for order {self.order_id}'
    class Meta:
        ordering = ['-created_at']
