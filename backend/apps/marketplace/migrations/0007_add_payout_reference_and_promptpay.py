from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0007_add_vendor_payout_and_payout_model'),
    ]

    operations = [
        migrations.AddField(
            model_name='vendorprofile',
            name='promptpay_id',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='payout',
            name='reference_number',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.AddField(
            model_name='payout',
            name='promptpay_id',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
