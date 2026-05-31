from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.marketplace.services import PayoutService

class Command(BaseCommand):
    help = 'Process scheduled vendor payouts for vendor accounts.'

    def handle(self, *args, **options):
        now = timezone.now()
        processed = PayoutService.process_due_vendor_payouts(now=now)

        if processed == 0:
            self.stdout.write('No payouts were due at this time.')
        else:
            self.stdout.write(self.style.SUCCESS(f'Completed {processed} vendor payout(s).'))
