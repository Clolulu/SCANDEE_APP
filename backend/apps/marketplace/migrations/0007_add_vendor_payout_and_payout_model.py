from decimal import Decimal
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0006_add_order_confirmation_pin_hash_and_timestamps'),
    ]

    operations = [
        migrations.AddField(
            model_name='vendorprofile',
            name='bank_account_holder',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='bank_account_number',
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='bank_name',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='payout_schedule',
            field=models.CharField(choices=[('HOURLY', 'Hourly'), ('DAILY', 'Daily'), ('WEEKLY', 'Weekly')], default='HOURLY', max_length=20),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='available_balance',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='pending_balance',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='lifetime_earnings',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=12),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='last_payout_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.CreateModel(
            name='Payout',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=12)),
                ('status', models.CharField(choices=[('PENDING', 'Pending'), ('PROCESSING', 'Processing'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')], default='PENDING', max_length=20)),
                ('payout_method', models.CharField(choices=[('SIMULATED', 'Simulated'), ('BANK_TRANSFER', 'Bank transfer')], default='SIMULATED', max_length=20)),
                ('bank_name', models.CharField(blank=True, max_length=255)),
                ('bank_account_holder', models.CharField(blank=True, max_length=255)),
                ('bank_account_number', models.CharField(blank=True, max_length=64)),
                ('scheduled_at', models.DateTimeField()),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('vendor', models.ForeignKey(on_delete=models.CASCADE, related_name='payouts', to='marketplace.vendorprofile')),
            ],
        ),
    ]
