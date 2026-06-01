import logging
from django.db import models
from django.utils import timezone
from rest_framework import viewsets, permissions, status, generics
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.http import Http404
from .models import VendorProfile, Product, Order, Payout
from .serializers import VendorProfileSerializer, VendorProfilePrivateSerializer, ProductSerializer, OrderSerializer, PayoutSerializer
from .services import PayoutService

logger = logging.getLogger(__name__)

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
        # Try to find by profile id or by associated user id. Return 404 if not found.
        obj = queryset.filter(models.Q(id=vendor_id) | models.Q(user_id=vendor_id)).first()
        if not obj:
            raise Http404('Vendor profile not found')
        return obj

    def get(self, request, *args, **kwargs):
        obj = self.get_object()
        serializer = self.get_serializer(obj)
        logger.debug('VendorProfileView.get returning data for vendor_id=%s data=%s', kwargs.get('vendor_id'), serializer.data)
        return Response(serializer.data)

class VendorListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = VendorProfile.objects.select_related('user').all()
    serializer_class = VendorProfileSerializer

class VendorProfileMeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]
    parser_classes = [MultiPartParser, FormParser]
    queryset = VendorProfile.objects.select_related('user').all()
    serializer_class = VendorProfilePrivateSerializer

    def get_object(self):
        return self.request.user.vendor_profile

    def patch(self, request, *args, **kwargs):
        logger.debug('VendorProfileMeView.patch called user=%s data_keys=%s file_keys=%s',
                     getattr(request, 'user', None), list(request.data.keys()), list(request.FILES.keys()))

        instance = self.get_object()
        partial = True
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            logger.debug('VendorProfileMeView.validation_errors=%s', serializer.errors)
            # Format field errors for frontend
            fields = {k: (v if isinstance(v, str) else ' '.join([str(i) for i in v])) for k, v in serializer.errors.items()}
            return Response({'success': False, 'message': 'Validation error', 'fields': fields}, status=status.HTTP_400_BAD_REQUEST)

        try:
            self.perform_update(serializer)
            logger.debug('VendorProfileMeView.patch updated_data=%s', serializer.data)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            logger.exception('VendorProfileMeView.patch failed for user=%s', getattr(request, 'user', None))
            return Response({'success': False, 'message': 'Vendor profile update failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
    queryset = Order.objects.select_related('tourist', 'vendor').prefetch_related('items').all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'vendor':
            return self.queryset.filter(vendor__user=user).order_by('-created_at')
        return self.queryset.filter(tourist=user)

    def create(self, request, *args, **kwargs):
        logger.debug('OrderViewSet.create request.user=%s request.data=%s', request.user, request.data)
        try:
            response = super().create(request, *args, **kwargs)
            logger.info('Order created successfully for user=%s order_data=%s', request.user, response.data)
            return response
        except Exception as exc:
            logger.exception('Failed to create order via OrderViewSet')
            return Response({'success': False, 'message': 'Unable to create order.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        logger.debug('OrderViewSet.perform_create serializer.validated_data=%s', serializer.validated_data)
        if self.request.user.role != 'tourist':
            raise PermissionDenied('Only tourists can create orders.')
        vendor = serializer.validated_data.get('vendor')
        if not vendor or vendor.user.role != 'vendor':
            raise PermissionDenied('Vendor must be a valid vendor profile.')
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsVendor])
    def start_preparing(self, request, pk=None):
        order = self.get_object()
        if order.vendor.user != request.user:
            return Response({'detail': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        if order.order_status not in ['PAID', 'paid']:
            return Response({'detail': 'Only paid orders can be moved to preparing.'}, status=status.HTTP_400_BAD_REQUEST)
        order.order_status = 'PREPARING'
        order.prepared_at = timezone.now()
        order.save(update_fields=['order_status', 'prepared_at'])
        return Response({'status': 'PREPARING', 'order_status': order.order_status, 'prepared_at': order.prepared_at})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsVendor])
    def ready_for_pickup(self, request, pk=None):
        order = self.get_object()
        if order.vendor.user != request.user:
            return Response({'detail': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        if order.order_status not in ['PREPARING', 'preparing']:
            return Response({'detail': 'Only preparing orders can be marked ready.'}, status=status.HTTP_400_BAD_REQUEST)
        order.order_status = 'READY_FOR_PICKUP'
        order.save(update_fields=['order_status'])
        return Response({'status': 'READY_FOR_PICKUP', 'order_status': order.order_status})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsVendor])
    def verify_pin(self, request, pk=None):
        order = self.get_object()
        if order.vendor.user != request.user:
            return Response({'detail': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        if order.order_status in ['COMPLETED', 'completed']:
            return Response({'status': 'COMPLETED', 'order_status': order.order_status})
        if order.order_status not in ['READY_FOR_PICKUP', 'ready_for_pickup']:
            return Response({'detail': 'Order must be ready for pickup before verification.'}, status=status.HTTP_400_BAD_REQUEST)
        pin_code = request.data.get('pin_code')
        if not pin_code:
            return Response({'detail': 'PIN is required.'}, status=status.HTTP_400_BAD_REQUEST)
        if order.check_pin(pin_code):
            order.complete()
            return Response({'status': 'COMPLETED', 'order_status': order.order_status, 'completed_at': order.completed_at})
        return Response({'detail': 'Invalid PIN'}, status=status.HTTP_400_BAD_REQUEST)


class CreateOrderView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        logger.debug('CreateOrderView.create request.user=%s request.data=%s', request.user, request.data)
        try:
            response = super().create(request, *args, **kwargs)
            logger.info('Order created successfully for user=%s order_data=%s', request.user, response.data)
            return response
        except Exception:
            logger.exception('Failed to create order via CreateOrderView')
            return Response({'success': False, 'message': 'Unable to create order.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def perform_create(self, serializer):
        logger.debug('CreateOrderView.perform_create serializer.validated_data=%s', serializer.validated_data)
        if self.request.user.role != 'tourist':
            raise PermissionDenied('Only tourists can create orders.')
        vendor = serializer.validated_data.get('vendor')
        if not vendor or vendor.user.role != 'vendor':
            raise PermissionDenied('Vendor must be a valid vendor profile.')
        serializer.save()


class MyOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.select_related('tourist', 'vendor').prefetch_related('items').filter(tourist=self.request.user).order_by('-created_at')


class VendorOrdersView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def get_queryset(self):
        return Order.objects.select_related('tourist', 'vendor').prefetch_related('items').filter(vendor__user=self.request.user).order_by('-created_at')


class VerifyPinView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVendor]

    def post(self, request):
        order_id = request.data.get('order_id')
        pin_code = request.data.get('pin_code')
        if not order_id or not pin_code:
            return Response({'detail': 'Order ID and PIN are required.'}, status=status.HTTP_400_BAD_REQUEST)
        order = get_object_or_404(Order, id=order_id, vendor__user=request.user)
        if order.order_status not in ['READY_FOR_PICKUP', 'ready_for_pickup']:
            return Response({'detail': 'Order must be ready for pickup before verification.'}, status=status.HTTP_400_BAD_REQUEST)
        if order.check_pin(pin_code):
            order.complete()
            return Response({'status': 'COMPLETED', 'order_status': order.order_status, 'completed_at': order.completed_at})
        return Response({'detail': 'Invalid PIN'}, status=status.HTTP_400_BAD_REQUEST)

class PayoutViewSet(viewsets.ReadOnlyModelViewSet):
    # Prefer ordering by processed_at (actual payout date) then created_at as a fallback
    queryset = Payout.objects.select_related('vendor').order_by('-processed_at', '-created_at')
    serializer_class = PayoutSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'vendor':
            return self.queryset.filter(vendor__user=user)
        return self.queryset.none()

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsVendor])
    def execute_now(self, request):
        # Detailed logging and JSON-only error responses for payout execution
        user = getattr(request, 'user', None)
        vendor = getattr(user, 'vendor_profile', None)

        logger.debug('Payout execute_now called by user=%s vendor=%s data=%s', getattr(user, 'id', None), getattr(vendor, 'id', None), request.data)

        if vendor is None:
            logger.warning('Payout execute_now denied: user has no vendor_profile user=%s', getattr(user, 'id', None))
            return Response({'error': 'Vendor authentication failed.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            available = getattr(vendor, 'available_balance', None)
            logger.debug('Vendor available_balance=%s', available)
        except Exception:
            available = None

        if not available or available <= 0:
            logger.info('Payout execute_now aborted: insufficient available balance for vendor=%s available=%s', vendor.id, available)
            return Response({'error': 'No eligible balance available for payout.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payout = PayoutService.execute_simulated_payout(vendor)
            serializer = self.get_serializer(payout)
            logger.info('Payout executed successfully vendor=%s payout=%s user=%s', vendor.id, getattr(payout, 'reference_number', payout.id), getattr(user, 'id', None))
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as exc:
            # Expected validation errors from service
            logger.warning('Payout execution validation error for vendor=%s: %s', vendor.id if vendor else None, str(exc))
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception('Unexpected error while executing payout for vendor=%s', vendor.id if vendor else None)
            return Response({'error': 'Internal server error while executing payout.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
