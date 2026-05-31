from decimal import Decimal
from django.db import transaction
from django.utils import timezone

from .models import Payout, VendorProfile


class PayoutService:
    @staticmethod
    def generate_reference_number(vendor: VendorProfile) -> str:
        now = timezone.now()
        return f'SCN-{now.strftime("%Y%m%d")}-{vendor.user_id:06d}-{now.strftime("%H%M%S")}'

    @classmethod
    def execute_simulated_payout(cls, vendor: VendorProfile, amount: Decimal | None = None, scheduled_at=None, notes=None) -> Payout:
        if scheduled_at is None:
            scheduled_at = timezone.now()

        if amount is None:
            amount = vendor.available_balance

        if amount is None:
            raise ValueError('Invalid payout amount.')

        amount = Decimal(amount).quantize(Decimal('0.01'))
        if amount <= Decimal('0.00'):
            raise ValueError('No available funds to payout.')

        with transaction.atomic():
            vendor.refresh_from_db()
            if amount > vendor.available_balance:
                raise ValueError('Requested payout exceeds available balance.')

            payout = Payout.objects.create(
                vendor=vendor,
                amount=amount,
                reference_number=cls.generate_reference_number(vendor),
                status='PROCESSING',
                payout_method='SIMULATED',
                bank_name=vendor.bank_name,
                bank_account_holder=vendor.bank_account_holder,
                bank_account_number=vendor.bank_account_number,
                promptpay_id=vendor.promptpay_id,
                scheduled_at=scheduled_at,
                notes=notes or 'Simulated vendor payout executed by payout service.',
            )

            payout.status = 'SUCCESS'
            payout.processed_at = scheduled_at
            payout.save(update_fields=['status', 'processed_at'])

            vendor.available_balance = (vendor.available_balance - amount).quantize(Decimal('0.01'))
            vendor.last_payout_at = scheduled_at
            vendor.save(update_fields=['available_balance', 'last_payout_at'])

        return payout

    @classmethod
    def process_due_vendor_payouts(cls, now=None) -> int:
        if now is None:
            now = timezone.now()

        processed = 0
        eligible_vendors = VendorProfile.objects.filter(available_balance__gt=Decimal('0.00'))

        for vendor in eligible_vendors:
            if not vendor.is_payout_due(now):
                continue

            cls.execute_simulated_payout(
                vendor,
                amount=vendor.available_balance,
                scheduled_at=now,
                notes='Simulated automated scheduled payout executed by payout service.',
            )
            processed += 1

        return processed
