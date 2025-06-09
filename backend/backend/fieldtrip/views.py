from django.http import JsonResponse
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view
from drf_yasg import openapi

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