from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0008_alter_order_confirmation_pin_hash_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='vendorprofile',
            name='promptpay_type',
            field=models.CharField(blank=True, choices=[('PHONE', 'Phone'), ('NATIONAL_ID', 'National ID'), ('MERCHANT_ID', 'Merchant ID'), ('UNKNOWN', 'Unknown')], max_length=20),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='promptpay_qr_image',
            field=models.ImageField(blank=True, null=True, upload_to='promptpay_qr_codes/'),
        ),
    ]
