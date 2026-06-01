from django.contrib import admin
from .models import User
from django.utils.html import format_html


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_active', 'is_staff', 'created_at')
    search_fields = ('email', 'full_name', 'phone_number')
    list_filter = ('role', 'is_active', 'is_staff')
    ordering = ('-created_at',)
    actions = ('activate_accounts', 'deactivate_accounts',)

    @admin.action(description='Activate selected accounts')
    def activate_accounts(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'Activated {updated} account(s)')

    @admin.action(description='Deactivate (suspend) selected accounts')
    def deactivate_accounts(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'Deactivated {updated} account(s)')
