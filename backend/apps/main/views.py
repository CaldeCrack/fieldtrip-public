from rest_framework import viewsets
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework.exceptions import PermissionDenied, APIException
from django.db import IntegrityError

from .models import *
from .serializers import *
from apps.utils.custom_permissions import IsStudent, IsTeacher, IsAuxiliar


class ChecklistViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, IsStudent)
    serializer_class = ChecklistSerializer
    queryset = Checklist.objects.none()

    def get_queryset(self):
        fieldtrip_id = self.request.query_params.get('fieldtrip_id')

        if not fieldtrip_id:
            return Checklist.objects.none()

        user = self.request.user
        is_attendee = FieldtripAttendee.objects.filter(
            user=user, fieldtrip_id=fieldtrip_id).exists()

        if not is_attendee:
            raise PermissionDenied(
                "No tienes permiso para ver esta lista de verificación.")

        try:
            fieldtrip = Fieldtrip.objects.get(pk=fieldtrip_id)
        except Fieldtrip.DoesNotExist:
            raise ValidationError(
                {"detail": "La salida a campo especificada no existe."})

        checklist_items = fieldtrip.cached_checklist
        return Checklist.objects.filter(item__in=checklist_items)


class CourseViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, IsTeacher)
    queryset = Course.objects.all()
    serializer_class = CourseSerializer


class UserAlreadyRegisteredException(APIException):
    status_code = status.HTTP_409_CONFLICT
    default_detail = "El usuario ya está registrado en esta salida a campo."
    default_code = "user_already_registered"


class FieldtripAttendeeViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = FieldtripAttendee.objects.all()
    serializer_class = FieldtripAttendeeSerializer

    @swagger_auto_schema(
        operation_description="Obtener las salidas a campo de un usuario específico.",
        manual_parameters=[
            openapi.Parameter(
                'user-id', openapi.IN_QUERY, description="ID del usuario", type=openapi.TYPE_INTEGER, required=True
            )
        ],
        responses={
            200: FieldtripAttendeeSerializer(many=True),
            400: "Error en la solicitud.",
            403: "Solicitud no autorizada."
        }
    )
    @action(detail=False, methods=['GET'])
    def user(self, request):
        user_id = request.query_params.get('user-id')
        if user_id is None:
            user_id = request.query_params.get('user_id')

        if user_id is None:
            return Response(
                {"detail": "El parámetro 'user-id' es requerido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": "El parámetro 'user-id' debe ser un entero válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instances = FieldtripAttendee.objects.select_related("fieldtrip", "fieldtrip__teacher").filter(
            user_id=user_id
        )

        data = []
        for attendee in instances:
            fieldtrip = attendee.fieldtrip
            if not fieldtrip:
                continue

            professor = None
            if fieldtrip.teacher:
                professor = f"{fieldtrip.teacher.names} {fieldtrip.teacher.surnames}"

            start_date = fieldtrip.start_date.strftime("%d-%m-%Y") if fieldtrip.start_date else None
            end_date = fieldtrip.end_date.strftime("%d-%m-%Y") if fieldtrip.end_date else None

            data.append(
                {
                    "id": fieldtrip.id,
                    "title": fieldtrip.name,
                    "professor": professor,
                    "startDate": start_date,
                    "endDate": end_date,
                    "invitationCode": fieldtrip.invitation_code,
                }
            )

        return Response(data, status=status.HTTP_200_OK)
    
    def perform_create(self, serializer):
        try:
            serializer.save()
        except IntegrityError:
            raise UserAlreadyRegisteredException()


class FieldtripAttendeesAPIView(APIView):
    permission_classes = (IsAuthenticated, IsTeacher | IsAuxiliar)

    @swagger_auto_schema(
        operation_description="Obtener los asistentes de una salida a campo específica.",
        manual_parameters=[
            openapi.Parameter(
                'id', openapi.IN_PATH, description="ID de la salida a campo", type=openapi.TYPE_INTEGER
            )
        ],
        responses={
            200: FieldtripAttendeeListSerializer(many=True),
            404: "No se encontraron asistentes para esta salida a campo."
        }
    )
    def get(self, request, id, format=None):
        attendees = FieldtripAttendee.objects.filter(
            fieldtrip=id, user__role='student')
        serializer = FieldtripAttendeeListSerializer(attendees, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FieldtripSignupStatusAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    @swagger_auto_schema(
        operation_description="Obtener el estado de registro de un usuario en una salida a campo específica.",
        manual_parameters=[
            openapi.Parameter(
                'user_id',
                openapi.IN_QUERY,
                description="ID del usuario",
                type=openapi.TYPE_INTEGER,
                required=True
            ),
            openapi.Parameter(
                'fieldtrip_id',
                openapi.IN_QUERY,
                description="ID de la salida a campo",
                type=openapi.TYPE_INTEGER,
                required=True
            )
        ],
        responses={
            200: openapi.Response(
                description="Estado del registro del usuario.",
                examples={
                        "application/json": {"signup_complete": True, "is_auxiliar": False}
                }
            ),
            400: "Solicitud inválida.",
            404: "No se encontró el registro del usuario en la salida especificada."
        }
    )
    def get(self, request, format=None):
        user_id = request.query_params.get('user_id')
        fieldtrip_id = request.query_params.get('fieldtrip_id')

        if not user_id or not fieldtrip_id:
            return Response(
                {"detail": "Parámetros 'user_id' y 'fieldtrip_id' son requeridos."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            attendee = FieldtripAttendee.objects.get(user_id=user_id, fieldtrip_id=fieldtrip_id)
        except FieldtripAttendee.DoesNotExist:
            return Response(
                {"detail": "El usuario no está registrado en esta salida a campo."},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "signup_complete": attendee.signup_complete,
                "is_auxiliar": attendee.is_auxiliar,
            },
            status=status.HTTP_200_OK
        )
