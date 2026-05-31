from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import authenticate
from .models import User
from apps.marketplace.models import VendorProfile

class UserSerializer(serializers.ModelSerializer):
    profile_image_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'full_name', 'phone_number', 'profile_image_url', 'role', 'created_at')

    def get_profile_image_url(self, obj):
        if not obj.profile_image:
            return None
        request = self.context.get('request')
        url = obj.profile_image.url
        return request.build_absolute_uri(url) if request else url


class CustomerAccountSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(required=False, allow_null=True)
    profile_image_url = serializers.SerializerMethodField(read_only=True)
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, min_length=8, error_messages={'min_length': 'Password must contain at least 8 characters.'})
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'phone_number',
            'profile_image',
            'profile_image_url',
            'current_password',
            'new_password',
            'confirm_password',
            'role',
            'created_at',
        )
        read_only_fields = ('id', 'role', 'created_at', 'profile_image_url')

    def get_profile_image_url(self, obj):
        if not obj.profile_image:
            return None
        request = self.context.get('request')
        url = obj.profile_image.url
        return request.build_absolute_uri(url) if request else url

    def validate_email(self, value):
        user = self.instance
        if user and user.email != value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email address already exists.')
        return value

    def validate(self, attrs):
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        current_password = attrs.get('current_password')

        if new_password or confirm_password:
            if not current_password:
                raise serializers.ValidationError({'current_password': 'Current password is required to change your password.'})
            if new_password != confirm_password:
                raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
            if not self.instance.check_password(current_password):
                raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})

        return attrs

    def update(self, instance, validated_data):
        validated_data.pop('current_password', None)
        validated_data.pop('confirm_password', None)
        new_password = validated_data.pop('new_password', None)

        profile_image = validated_data.pop('profile_image', None)
        if profile_image is not None:
            instance.profile_image = profile_image

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance


class VendorAccountSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='vendor_profile.phone', allow_blank=True, required=False)
    promptpay_id = serializers.CharField(source='vendor_profile.promptpay_id', allow_blank=True, required=False)
    promptpay_type = serializers.CharField(source='vendor_profile.promptpay_type', allow_blank=True, required=False)
    promptpay_qr_image = serializers.ImageField(source='vendor_profile.promptpay_qr_image', required=False, allow_null=True)
    payout_schedule = serializers.ChoiceField(source='vendor_profile.payout_schedule', choices=VendorProfile.PAYOUT_SCHEDULE_CHOICES, required=False)
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, min_length=8, error_messages={'min_length': 'New password must contain at least 8 characters.'})
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'id',
            'email',
            'full_name',
            'role',
            'phone_number',
            'promptpay_id',
            'promptpay_type',
            'promptpay_qr_image',
            'payout_schedule',
            'current_password',
            'new_password',
            'confirm_password',
        )
        read_only_fields = ('id', 'role')

    def validate_email(self, value):
        user = self.instance
        if user and user.email != value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email address already exists.')
        return value

    def validate(self, attrs):
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        current_password = attrs.get('current_password')

        if new_password or confirm_password:
            if not current_password:
                raise serializers.ValidationError({'current_password': 'Current password is required to change your password.'})
            if new_password != confirm_password:
                raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
            if not self.instance.check_password(current_password):
                raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})

        return attrs

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('vendor_profile', {})
        if profile_data:
            vendor_profile = instance.vendor_profile
            for attr, value in profile_data.items():
                setattr(vendor_profile, attr, value)
            vendor_profile.save()

        validated_data.pop('current_password', None)
        validated_data.pop('confirm_password', None)
        new_password = validated_data.pop('new_password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password:
            instance.set_password(new_password)
        instance.save()
        return instance

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8, error_messages={'min_length': 'New password must contain at least 8 characters.'})
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        current_password = attrs.get('current_password')
        new_password = attrs.get('new_password')
        confirm_password = attrs.get('confirm_password')
        user = self.context['request'].user

        if not current_password:
            raise serializers.ValidationError({'current_password': 'Current password is required to change your password.'})
        if new_password != confirm_password:
            raise serializers.ValidationError({'confirm_password': 'New password and confirmation password do not match.'})
        if not user.check_password(current_password):
            raise serializers.ValidationError({'current_password': 'Current password is incorrect.'})

        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user

class RegisterTouristSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[
            UniqueValidator(queryset=User.objects.all(), message='Email address already exists.')
        ],
        error_messages={'invalid': 'Invalid email format.'}
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={'min_length': 'Password must contain at least 8 characters.'}
    )
    full_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'full_name')

    def create(self, validated_data):
        return User.objects.create_user(role='tourist', **validated_data)

class RegisterVendorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[
            UniqueValidator(queryset=User.objects.all(), message='Email address already exists.')
        ],
        error_messages={'invalid': 'Invalid email format.'}
    )
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        error_messages={'min_length': 'Password must contain at least 8 characters.'}
    )
    shop_name = serializers.CharField(write_only=True)
    owner_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'shop_name', 'owner_name', 'phone_number')

    def create(self, validated_data):
        shop_name = validated_data.pop('shop_name')
        owner_name = validated_data.pop('owner_name')
        phone_number = validated_data.pop('phone_number')
        user = User.objects.create_user(
            role='vendor',
            email=validated_data['email'],
            password=validated_data['password'],
            full_name=owner_name,
        )
        from apps.marketplace.models import VendorProfile
        VendorProfile.objects.create(user=user, shop_name=shop_name, phone=phone_number)
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(error_messages={'invalid': 'Invalid email format.'})
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError({'detail': 'Email and password are required.'})

        user = authenticate(email=email, password=password)
        user_obj = User.objects.filter(email=email).first()

        if not user_obj:
            raise serializers.ValidationError({'email': ['Account does not exist. Please register first.']})

        if user_obj and not user_obj.is_active:
            raise serializers.ValidationError({'detail': 'Account disabled. Please contact support.'})

        if not user:
            raise serializers.ValidationError({'password': ['Incorrect password.']})

        attrs['user'] = user
        return attrs
