from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VendorProfileView, VendorListView, VendorProfileMeView, ProductViewSet, OrderViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('vendors/', VendorListView.as_view(), name='vendor-list'),
    path('vendor/me/', VendorProfileMeView.as_view(), name='vendor-profile-me'),
    path('vendor/<int:vendor_id>/', VendorProfileView.as_view(), name='vendor-profile'),
    path('', include(router.urls)),
]
