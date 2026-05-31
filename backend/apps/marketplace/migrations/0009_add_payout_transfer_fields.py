from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0008_alter_order_confirmation_pin_hash_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='payout',
            name='destination_account',
            field=models.CharField(max_length=512, blank=True),
        ),
        migrations.AddField(
            model_name='payout',
            name='transfer_reference',
            field=models.CharField(max_length=128, blank=True),
        ),
        migrations.AddField(
            model_name='payout',
            name='transfer_status',
            field=models.CharField(max_length=32, blank=True),
        ),
    ]
