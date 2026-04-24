from django.urls import path

from .views import FieldtripEquipmentAPIView, EquipmentListAPIView, FieldtripEquipmentRequestAPIView

app_name = "equipment"

urlpatterns = [
    path(
        "fieldtrip/<int:id>/equipment/",
        FieldtripEquipmentAPIView.as_view(),
        name="fieldtrip-equipment",
    ),
    path(
        "equipment/list/<int:course_id>/",
        EquipmentListAPIView.as_view(),
        name="equipment-list-course",
    ),
    path(
        "fieldtrip/<int:id>/equipment-requests/",
        FieldtripEquipmentRequestAPIView.as_view(),
        name="fieldtrip-equipment-requests",
    ),
    path(
        "fieldtrip/<int:id>/equipment-requests/<int:request_id>/",
        FieldtripEquipmentRequestAPIView.as_view(),
        name="fieldtrip-equipment-request-update",
    ),
]
