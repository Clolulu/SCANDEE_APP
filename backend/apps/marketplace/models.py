import random
from decimal import Decimal
from datetime import timedelta
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.hashers import check_password, make_password

class VendorProfile(models.Model):
    PAYOUT_SCHEDULE_HOURLY = 'HOURLY'
    PAYOUT_SCHEDULE_DAILY = 'DAILY'
    PAYOUT_SCHEDULE_EVERY_3_DAYS = 'EVERY_3_DAYS'
    PAYOUT_SCHEDULE_WEEKLY = 'WEEKLY'
    PAYOUT_SCHEDULE_CHOICES = (
        (PAYOUT_SCHEDULE_HOURLY, 'Hourly'),
        (PAYOUT_SCHEDULE_DAILY, 'Daily'),
        (PAYOUT_SCHEDULE_EVERY_3_DAYS, 'Every 3 days'),
        (PAYOUT_SCHEDULE_WEEKLY, 'Weekly'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vendor_profile')
    shop_name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    logo_image = models.ImageField(upload_to='vendor_logos/', blank=True, null=True)
    banner_image = models.ImageField(upload_to='vendor_banners/', blank=True, null=True)
    address = models.TextField(blank=True)
    business_hours = models.CharField(max_length=255, blank=True)
    qr_code = models.CharField(max_length=255, blank=True)
    bank_name = models.CharField(max_length=255, blank=True)
    bank_account_holder = models.CharField(max_length=255, blank=True)
    bank_account_number = models.CharField(max_length=64, blank=True)
    promptpay_id = models.CharField(max_length=255, blank=True)
    promptpay_type = models.CharField(
        max_length=20,
        choices=(
            ('PHONE', 'Phone'),
            ('NATIONAL_ID', 'National ID'),
            ('MERCHANT_ID', 'Merchant ID'),
            ('UNKNOWN', 'Unknown'),
        ),
        blank=True,
    )
    promptpay_qr_image = models.ImageField(upload_to='promptpay_qr_codes/', blank=True, null=True)
    payout_schedule = models.CharField(max_length=20, choices=PAYOUT_SCHEDULE_CHOICES, default=PAYOUT_SCHEDULE_HOURLY)
    available_balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    pending_balance = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    lifetime_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    last_payout_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def vendor_id(self):
        return self.user_id

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if not self.qr_code and self.pk:
            self.qr_code = f'/store/{self.id}'
            super().save(update_fields=['qr_code'])

    def add_pending_payout(self, amount: Decimal):
        if not amount or amount <= Decimal('0.00'):
            return
        self.pending_balance = (self.pending_balance + amount).quantize(Decimal('0.01'))
        self.save(update_fields=['pending_balance'])

    def release_pending_to_available(self, amount: Decimal):
        if not amount or amount <= Decimal('0.00'):
            return
        self.pending_balance = max(self.pending_balance - amount, Decimal('0.00'))
        self.available_balance = (self.available_balance + amount).quantize(Decimal('0.01'))
        self.lifetime_earnings = (self.lifetime_earnings + amount).quantize(Decimal('0.01'))
        self.save(update_fields=['pending_balance', 'available_balance', 'lifetime_earnings'])

    def next_payout_at(self, now=None):
        if now is None:
            now = timezone.now()
        if self.payout_schedule == self.PAYOUT_SCHEDULE_HOURLY:
            return now
        if self.last_payout_at is None:
            return now
        if self.payout_schedule == self.PAYOUT_SCHEDULE_DAILY:
            return self.last_payout_at + timedelta(days=1)
        if self.payout_schedule == self.PAYOUT_SCHEDULE_EVERY_3_DAYS:
            return self.last_payout_at + timedelta(days=3)
        if self.payout_schedule == self.PAYOUT_SCHEDULE_WEEKLY:
            return self.last_payout_at + timedelta(days=7)
        return now

    def is_payout_due(self, now=None):
        if now is None:
            now = timezone.now()
        if self.payout_schedule == self.PAYOUT_SCHEDULE_HOURLY:
            return True
        if self.last_payout_at is None:
            return True
        elapsed = now - self.last_payout_at
        if self.payout_schedule == self.PAYOUT_SCHEDULE_DAILY:
            return elapsed.days >= 1
        if self.payout_schedule == self.PAYOUT_SCHEDULE_EVERY_3_DAYS:
            return elapsed.days >= 3
        if self.payout_schedule == self.PAYOUT_SCHEDULE_WEEKLY:
            return elapsed.days >= 7
        return False

    def __str__(self):
        return self.shop_name

class Product(models.Model):
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', blank=True, null=True)
    available = models.BooleanField(default=True)
    stock_quantity = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Order(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('FAILED', 'Failed'),
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    )
    ORDER_STATUS_CHOICES = (
        ('PENDING_PAYMENT', 'Pending payment'),
        ('PAID', 'Paid'),
        ('PREPARING', 'Preparing'),
        ('READY_FOR_PICKUP', 'Ready for pickup'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    )

    tourist = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='orders')
    order_total = models.DecimalField(max_digits=10, decimal_places=2)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    charge_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gateway_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    vendor_payout = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    platform_profit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    order_status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='PENDING_PAYMENT')
    pin_code = models.CharField(max_length=128, blank=True)
    confirmation_pin_hash = models.CharField(max_length=128, blank=True)
    prepared_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def mark_paid(self):
        if self.payment_status in ['PAID', 'paid']:
            return
        self.payment_status = 'PAID'
        self.order_status = 'PAID'
        self.save(update_fields=['payment_status', 'order_status'])
        self.vendor.add_pending_payout(self.vendor_payout)
        if not self.confirmation_pin_hash:
            self.generate_pin()

    def complete(self):
        if self.order_status in ['COMPLETED', 'completed']:
            return
        self.order_status = 'COMPLETED'
        self.completed_at = timezone.now()
        self.vendor.release_pending_to_available(self.vendor_payout)
        self.save(update_fields=['order_status', 'completed_at'])

    def set_confirmation_pin(self, raw_pin: str | None = None):
        if raw_pin is None:
            raw_pin = f'{random.randint(1000, 9999):04d}'
        self.pin_code = raw_pin
        self.confirmation_pin_hash = make_password(raw_pin)
        self.save(update_fields=['pin_code', 'confirmation_pin_hash'])
        return raw_pin

    def generate_pin(self):
        return self.set_confirmation_pin()

    def check_pin(self, raw_pin: str):
        if not self.confirmation_pin_hash:
            return False
        return check_password(raw_pin, self.confirmation_pin_hash)

    @property
    def is_completed(self):
        """Check if order is in a terminal/completed state"""
        completed_statuses = ['COMPLETED', 'completed', 'FAILED', 'failed', 'CANCELLED', 'cancelled']
        return self.order_status in completed_statuses

    @property
    def is_current(self):
        """Check if order is active/in-progress"""
        return not self.is_completed

    def __str__(self):
        return f'Order #{self.id} from {self.tourist.email}'
    class Meta:
        ordering = ['-created_at']

class Payout(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    )
    METHOD_CHOICES = (
        ('SIMULATED', 'Simulated'),
        ('PROMPTPAY', 'PromptPay'),
        ('BANK_TRANSFER', 'Bank transfer'),
    )

    vendor = models.ForeignKey(VendorProfile, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference_number = models.CharField(max_length=64, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    payout_method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='SIMULATED')
    bank_name = models.CharField(max_length=255, blank=True)
    bank_account_holder = models.CharField(max_length=255, blank=True)
    bank_account_number = models.CharField(max_length=64, blank=True)
    promptpay_id = models.CharField(max_length=255, blank=True)
    # Future-proof fields for external transfer integrations
    destination_account = models.CharField(max_length=512, blank=True)
    transfer_reference = models.CharField(max_length=128, blank=True)
    transfer_status = models.CharField(max_length=32, blank=True)
    scheduled_at = models.DateTimeField()
    processed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Payout #{self.id} to {self.vendor.shop_name} for {self.amount}'
    class Meta:
        ordering = ['-processed_at', '-created_at']

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.subtotal = self.product.price * self.quantity
        super().save(*args, **kwargs)
