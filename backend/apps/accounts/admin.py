from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'role', 'is_staff', 'created_at')
    search_fields = ('email', 'full_name')
    list_filter = ('role', 'is_staff')
