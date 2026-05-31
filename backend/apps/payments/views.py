import requests
from django.conf import settings
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Transaction
from .serializers import CreateChargeSerializer
from apps.marketplace.models import Order

class CreateChargeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CreateChargeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = Order.objects.filter(id=serializer.validated_data['order_id'], tourist=request.user).first()
        if not order:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        if order.payment_status == 'paid':
            return Response({'detail': 'Order already paid.'}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            'amount': int(order.charge_amount * 100),
            'currency': 'thb',
            'card': serializer.validated_data['omise_token'],
            'description': f'Order {order.id} payment',
        }
        if not settings.OMISE_SECRET_KEY:
            # TODO: Replace with real Omise charge later.
            fake_charge_id = f'demo-charge-{order.id}'
            Transaction.objects.update_or_create(
                order=order,
                defaults={
                    'omise_charge_id': fake_charge_id,
                    'payment_status': 'successful',
                    'amount': order.charge_amount,
                },
            )
            order.mark_paid()
            return Response({'charge': {'id': fake_charge_id, 'status': 'successful', 'amount': int(order.charge_amount * 100)}, 'pickup_pin': order.pin_code})

        response = requests.post(
            'https://api.omise.co/charges',
            data=payload,
            auth=(settings.OMISE_SECRET_KEY, ''),
        )
        data = response.json()
        if response.status_code in (200, 201):
            Transaction.objects.update_or_create(
                order=order,
                defaults={
                    'omise_charge_id': data['id'],
                    'payment_status': data['status'],
                    'amount': order.charge_amount,
                },
            )
            if data['status'] == 'successful':
                order.mark_paid()
                return Response({'charge': data, 'pickup_pin': order.pin_code})
            order.payment_status = 'FAILED'
            order.order_status = 'FAILED'
            order.save(update_fields=['payment_status', 'order_status'])
            return Response({'charge': data}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'detail': data}, status=status.HTTP_400_BAD_REQUEST)

class OmiseWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        event = request.data
        if event.get('object') != 'event':
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event['key'] == 'charge.complete':
            charge = event['data']
            order_id = charge['description'].split()[-2]
            order = Order.objects.filter(id=order_id).first()
            if order:
                if charge['status'] == 'successful':
                    order.mark_paid()
                else:
                    order.payment_status = 'FAILED'
                    order.order_status = 'FAILED'
                    order.save(update_fields=['payment_status', 'order_status'])
                Transaction.objects.update_or_create(
                    order=order,
                    defaults={
                        'omise_charge_id': charge['id'],
                        'payment_status': charge['status'],
                        'amount': order.charge_amount,
                    },
                )
        return Response({'received': True})
