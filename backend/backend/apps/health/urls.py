from django.urls import path
from .views import FieldtripSignupViewSet, FieldtripHealthChartAPIView, LatestFieldtripHealthAPIView, FieldtripMetricsAPIView, FieldtripSignUpStatusAPIView

app_name = "health"

urlpatterns = [
    path(
        "fieldtrip/signup/",
        FieldtripSignupViewSet.as_view({'post': 'complete_signup'}),
        name="fieldtrip-signup",
    ),
    path(
        "fieldtrip/<int:fieldtrip>/chart/<int:user>/",
        FieldtripHealthChartAPIView.as_view(),
        name="fieldtrip-chart",
    ),
    path(
        "fieldtrip/<int:id>/metrics/",
        FieldtripMetricsAPIView.as_view(),
        name="fieldtrip-metrics",
    ),
    path(
        "fieldtrip/<int:id>/signup-status/",
        FieldtripSignUpStatusAPIView.as_view(),
        name="fieldtrip-signup-status",
    ),
    path(
        "fieldtrip/latest-health/",
        LatestFieldtripHealthAPIView.as_view(),
        name="latest-fieldtrip-health",
    ),
]