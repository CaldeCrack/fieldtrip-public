from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User, MedicalInstitution, Diet, Allergy
from .forms import CustomUserCreationForm, CustomUserChangeForm


class CustomUserAdmin(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    list_display = (
        "email",
        "names",
        "surnames",
        "is_superuser",
        "is_staff",
        "is_active",
        "role",
    )
    readonly_fields = ("last_login", "date_joined")
    list_filter = (
        "email",
        "names",
        "surnames",
        "is_superuser",
        "is_staff",
        "is_active",
        "role",
    )
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "email",
                    "password",
                    "names",
                    "surnames",
                    "registration_number",
                    "RUT",
                    "blood_type",
                    "diet_type",
                    "diet_info",
                    "allergies",
                    "preferred_medical_institution",
                    "emergency_contact",
                    "emergency_number",
                )
            },
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_staff",
                    "is_active",
                    "role",
                    "has_previous_experience",
                    "date_joined",
                    "last_login",
                )
            },
        ),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "names",
                    "surnames",
                    "registration_number",
                    "RUT",
                    "blood_type",
                    "diet_type",
                    "diet_info",
                    "allergies",
                    "emergency_contact",
                    "emergency_number",
                    "preferred_medical_institution",
                    "role",
                    "has_previous_experience",
                    "is_superuser",
                    "is_staff",
                    "is_active",
                ),
            },
        ),
    )
    search_fields = ("email", "names", "surnames", "RUT")
    ordering = ("email",)


@admin.register(MedicalInstitution)
class MedicalInstitutionAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    ordering = ('name',)


@admin.register(Diet)
class DietAdmin(admin.ModelAdmin):
    list_display = ('type',)
    search_fields = ('type',)
    ordering = ('type',)


@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display = ('type', 'category',)
    search_fields = ('type', 'category',)
    ordering = ('type', 'category',)


admin.site.register(User, CustomUserAdmin)
