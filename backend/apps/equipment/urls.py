from django.urls import path

from .views import FieldtripEquipmentAPIView, EquipmentListAPIView

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
]
