from django.db import models
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .models import VendorProfile, Product, Order
from .serializers import VendorProfileSerializer, ProductSerializer, OrderSerializer

class IsVendor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'vendor'

class VendorProfileView(generics.RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = VendorProfile.objects.all()
    serializer_class = VendorProfileSerializer
    lookup_url_kwarg = 'vendor_id'

    def get_object(self):
        vendor_id = self.kwargs.get(self.lookup_url_kwarg)
        queryset = self.get_queryset()
        try:
            return queryset.get(id=vendor_id)
        except VendorProfile.DoesNotExist:
            return queryset.get(user_id=vendor_id)

class VendorListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = VendorProfile.objects.select_related('user').all()
    serializer_class = VendorProfileSerializer

class VendorProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    parser_classes = [MultiPartParser, FormParser]
    queryset = VendorProfile.objects.select_related('user').all()
    serializer_class = VendorProfileSerializer

    def get_object(self):
        return self.request.user.vendor_profile

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('vendor').all()
    serializer_class = ProductSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsVendor()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        if not hasattr(self.request.user, 'vendor_profile'):
            raise PermissionDenied('Only vendors may create products.')
        serializer.save(vendor=self.request.user.vendor_profile)

    def get_queryset(self):
        vendor_id = self.request.query_params.get('vendor')
        if vendor_id:
            queryset = self.queryset.filter(
                models.Q(vendor__id=vendor_id) |
                models.Q(vendor__user_id=vendor_id)
            )
            if self.request.user.is_authenticated and self.request.user.role == 'vendor' and str(self.request.user.id) == str(vendor_id):
                return queryset
            return queryset.filter(available=True)

        if self.request.user.is_authenticated and self.request.user.role == 'vendor':
            return self.queryset.filter(vendor__user=self.request.user)

        return self.queryset.filter(available=True)

    def check_object_permissions(self, request, obj):
        if self.action in ['update', 'partial_update', 'destroy']:
            if obj.vendor.user != request.user:
                self.permission_denied(request)
        super().check_object_permissions(request, obj)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('tourist', 'vendor').prefetch_related('items').all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'vendor':
            return self.queryset.filter(vendor__user=user)
        return self.queryset.filter(tourist=user)

    def perform_create(self, serializer):
        if self.request.user.role != 'tourist':
            raise PermissionDenied('Only tourists can create orders.')
        vendor = serializer.validated_data.get('vendor')
        if not vendor or vendor.user.role != 'vendor':
            raise PermissionDenied('Vendor must be a valid vendor profile.')
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify_pin(self, request, pk=None):
        order = self.get_object()
        if request.user.role != 'vendor' or order.vendor.user != request.user:
            return Response({'detail': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        pin_code = request.data.get('pin_code')
        if pin_code == order.pin_code:
            order.order_status = 'completed'
            order.save(update_fields=['order_status'])
            return Response({'status': 'completed'})
        return Response({'detail': 'Invalid PIN'}, status=status.HTTP_400_BAD_REQUEST)
