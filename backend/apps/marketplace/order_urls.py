from django.urls import path
from .views import CreateOrderView, MyOrdersView, VendorOrdersView, VerifyPinView

urlpatterns = [
    path('create/', CreateOrderView.as_view(), name='order-create'),
    path('my/', MyOrdersView.as_view(), name='my-orders'),
    path('vendor/orders/', VendorOrdersView.as_view(), name='vendor-orders'),
    path('verify-pin/', VerifyPinView.as_view(), name='verify-pin'),
]
