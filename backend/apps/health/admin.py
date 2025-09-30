from django.contrib import admin
from .models import *


class HealthDataLogAdmin(admin.ModelAdmin):
    readonly_fields = ("timestamp",)


class FieldtripSignupAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False


admin.site.register(HealthDataLog, HealthDataLogAdmin)
admin.site.register(HealthGral)
admin.site.register(HealthGralStatus)
admin.site.register(HealthSpecific)
admin.site.register(HealthSpecificValue)
admin.site.register(FieldtripSignup, FieldtripSignupAdmin)
