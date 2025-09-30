from django.shortcuts import get_object_or_404

from apps.main.models import *
from .models import *


def get_or_create_checklist_status(user, fieldtrip, checklist_item, status):
    checklist = get_object_or_404(Checklist, pk=checklist_item["item"])
    checklist_status, created = ChecklistStatus.objects.get_or_create(
        user=user, fieldtrip=fieldtrip, item=checklist,
        defaults={"status": status}
    )
    if not created:
        checklist_status.status = status
        checklist_status.save()
    return checklist_status


def get_or_create_health_gral_status(user, fieldtrip, health_gral_item, status):
    health_gral = get_object_or_404(HealthGral, pk=health_gral_item["item"])
    health_gral_status, created = HealthGralStatus.objects.get_or_create(
        user=user, fieldtrip=fieldtrip, item=health_gral,
        defaults={"status": status}
    )
    if not created:
        health_gral_status.status = status
        health_gral_status.save()
    return health_gral_status


def get_or_create_health_specific_value(user, fieldtrip, health_specific_item, value):
    health_specific = get_object_or_404(
        HealthSpecific, pk=health_specific_item["item"])
    health_specific_value, created = HealthSpecificValue.objects.get_or_create(
        user=user, fieldtrip=fieldtrip, item=health_specific,
        defaults={"value": value}
    )
    if not created:
        health_specific_value.value = value
        health_specific_value.save()
    return health_specific_value
