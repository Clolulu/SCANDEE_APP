from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('marketplace', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='vendorprofile',
            name='category',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='logo_image',
            field=models.ImageField(blank=True, null=True, upload_to='vendor_logos/'),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='banner_image',
            field=models.ImageField(blank=True, null=True, upload_to='vendor_banners/'),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='address',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='vendorprofile',
            name='business_hours',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]
