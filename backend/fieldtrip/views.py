from django.http import JsonResponse
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view
from drf_yasg import openapi
from django.shortcuts import render, redirect


def index(request):
    return render(request, 'index.html')

def login(request):
    return render(request, 'login.html')

def expo_redirect(request, path):
    return redirect(f"/static/_expo/{path}")

def assets_redirect(request, path):
    return redirect(f"/static/assets/{path}")

def icon_redirect(request):
    return redirect(f"/static/favicon.ico")

@swagger_auto_schema(
    method='GET',
    operation_description="Verifica si el servidor está funcionando.",
    responses={
        200: openapi.Response(
            description="El servidor está activo",
            examples={
                "application/json": {"status": "up"}
            },
        )
    },
)
@api_view(http_method_names=['GET'])
def health_check(request):
    """
    Endpoint de verificación de estado del servidor.
    """
    return JsonResponse({"status": "up"}, status=200)