from django.urls import path
from .views import CreateChargeView, OmiseWebhookView

urlpatterns = [
    path('charge/', CreateChargeView.as_view(), name='create-charge'),
    path('webhook/', OmiseWebhookView.as_view(), name='omise-webhook'),
]
