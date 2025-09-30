from django.contrib import admin

from .models import *
from .forms import *

@admin.register(Fieldtrip)
class FieldtripAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_date', 'end_date', 'course')
    search_fields = ('name', 'course__name')

admin.site.register(Checklist)
admin.site.register(ChecklistStatus)
admin.site.register(EducationalInstitution)
admin.site.register(Course)
admin.site.register(FieldtripAttendee)