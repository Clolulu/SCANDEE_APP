from rest_framework import serializers
from .models import Transaction
from apps.marketplace.models import Order

class CreateChargeSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    omise_token = serializers.CharField()

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('id', 'order', 'omise_charge_id', 'payment_status', 'amount', 'created_at')
