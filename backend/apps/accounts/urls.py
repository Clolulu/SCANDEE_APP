from django.urls import path
from .views import (
    RegisterTouristView,
    RegisterVendorView,
    LoginView,
    CustomerAccountView,
    ChangePasswordView,
    RefreshTokenView,
    VendorAccountView,
)

urlpatterns = [
    path('register/tourist/', RegisterTouristView.as_view(), name='register-tourist'),
    path('register/customer/', RegisterTouristView.as_view(), name='register-customer'),
    path('register/vendor/', RegisterVendorView.as_view(), name='register-vendor'),
    path('login/', LoginView.as_view(), name='login'),
    path('account/', CustomerAccountView.as_view(), name='account'),
    path('account/change-password/', ChangePasswordView.as_view(), name='account-change-password'),
    path('vendor/account/', VendorAccountView.as_view(), name='vendor-account'),
    path('refresh/', RefreshTokenView.as_view(), name='token-refresh'),
]
