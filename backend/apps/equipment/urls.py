from django.urls import path

from .views import FieldtripEquipmentAPIView

app_name = "equipment"

urlpatterns = [
    path(
        "fieldtrip/<int:id>/equipment/",
        FieldtripEquipmentAPIView.as_view(),
        name="fieldtrip-equipment",
    ),
]
