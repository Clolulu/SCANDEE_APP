from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0003_alter_product_image_alter_vendorprofile_address_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='order',
            old_name='total_amount',
            new_name='order_total',
        ),
        migrations.RenameField(
            model_name='order',
            old_name='platform_fee',
            new_name='service_fee',
        ),
        migrations.RenameField(
            model_name='order',
            old_name='omise_fee',
            new_name='gateway_fee',
        ),
        migrations.RenameField(
            model_name='order',
            old_name='final_vendor_payout',
            new_name='vendor_payout',
        ),
        migrations.AddField(
            model_name='order',
            name='charge_amount',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name='order',
            name='platform_profit',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
    ]
