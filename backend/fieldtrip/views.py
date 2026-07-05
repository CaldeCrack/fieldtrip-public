from django.http import JsonResponse
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from drf_yasg import openapi
from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.core.management import call_command

class FrontendAppView(TemplateView):
    template_name = "index.html"

def index(request):
    if request.method == 'GET':
        return render(request, 'index.html')

def expo_redirect(request, path):
    if request.method == 'GET': 
        return redirect(f"/static/_expo/{path}")

def assets_redirect(request, path):
    if request.method == 'GET': 
        return redirect(f"/static/assets/{path}")


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

@swagger_auto_schema(
    method='POST',
    operation_description="Restablece la base de datos de pruebas (solo disponible si IS_TESTING es True).",
    responses={
        200: openapi.Response(
            description="Base de datos restablecida correctamente",
            examples={
                "application/json": {"status": "reset"}
            },
        ),
        404: openapi.Response(description="Endpoint no disponible"),
        500: openapi.Response(description="Error interno del servidor")
    },
)
@api_view(http_method_names=['POST'])
@permission_classes([AllowAny])
def test_reset(request):
    """
    Endpoint para restablecer la base de datos de pruebas.
    Flushed all tables and seeds the minimum lookup data required by the app.
    """
    from django.conf import settings
    from django.http import Http404
    from apps.user.models import Diet, Allergy

    if not getattr(settings, 'IS_TESTING', False):
        raise Http404("Not Found")

    try:
        call_command('flush', interactive=False, verbosity=0)

        for diet_name in [
            'Lacto-vegetariana', 'Ovo-vegetariana', 'Lacto-ovo-vegetariana',
            'Pescetariana', 'Vegana', 'Omnívora',
            'Vegetariana parcial (detallar en el siguiente campo)',
            'Otra (detallar en el siguiente campo)',
        ]:
            Diet.objects.get_or_create(type=diet_name)

        for allergy_name, category in [
            ('Ninguna alergia a sustancias', 1), ('Polen', 1), ('Polvo', 1), ('Látex', 1),
            ('Ninguna alergia a medicamentos', 2), ('Penicilina', 2), ('Ibuprofeno', 2),
        ]:
            Allergy.objects.get_or_create(type=allergy_name, category=category)

        return JsonResponse({"status": "reset"}, status=200)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
