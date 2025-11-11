"""fieldtrip URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.urls import include, re_path

from apps.main.views import *
from apps.user.views import *
from apps.health.views import *
from django.urls import path, re_path

from .views import *

schema_view = get_schema_view(
    openapi.Info(
        title="Fieldtrip API",
        default_version="v1",
        description="Documentación de endpoints para la App Fieldtrip",
        terms_of_service="",
        contact=openapi.Contact(email="x"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)


router = routers.DefaultRouter()
router.register(r"user/diet", DietViewSet)
router.register(r"user/substance-allergy", SubstanceAllergyViewSet, basename='substance-allergy')
router.register(r"user/med-allergy", MedAllergyViewSet, basename='med-allergy')

router.register(r"user/teacher", TeacherViewSet, basename='teachers')

router.register(r"health/specific", HealthSpecificViewSet)
router.register(r"health/past", PastHealthGralViewSet, basename='past-health-general')
router.register(r"health/current", CurrentHealthGralViewSet, basename='current-health-general')
router.register(r"health/log-data", HealthDataLogViewSet)

router.register(r"checklist", ChecklistViewSet, basename='checklist')

router.register(r"course", CourseViewSet)

router.register(r"fieldtrip", FieldtripViewSet, basename='fieldtrip')
router.register(r"fieldtrip-attendee", FieldtripAttendeeViewSet)


urlpatterns = [
    path("admin/", admin.site.urls),
    path('', index, name='index'),
    path('login/', login, name='login'),
    re_path(r'^_expo/(?P<path>.*)$', expo_redirect),
    re_path(r'^assets/(?P<path>.*)$', assets_redirect),
    re_path(r'^favicon.ico$', icon_redirect),
    path("", include("apps.user.urls", namespace="user")),
    path("", include("apps.main.urls", namespace="main")),
    path("", include("apps.health.urls", namespace="health")),
    path("", include(router.urls)),
    path(
        "docs/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^redoc/$",
        schema_view.with_ui("redoc", cache_timeout=0),
        name="schema-redoc",
    ),
]