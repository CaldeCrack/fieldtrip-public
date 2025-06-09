from django.urls import path

from .views import *

app_name = "main"

urlpatterns = [
    path(
        "fieldtrip/<int:id>/attendees/",
        FieldtripAttendeesAPIView.as_view(),
        name="fieldtrip-attendees",
    ),
]
