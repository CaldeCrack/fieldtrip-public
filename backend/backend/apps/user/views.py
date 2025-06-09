from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import status
from rest_framework.generics import GenericAPIView, UpdateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.views import APIView
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework_simplejwt.tokens import RefreshToken


from . import serializers
from .models import *
from apps.utils.custom_permissions import IsTeacher

User = get_user_model()


class UserRegistrationAPIView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = serializers.UserRegistrationSerializer

    @swagger_auto_schema(
        operation_description="Registrar un nuevo usuario.",
        request_body=serializers.UserRegistrationSerializer,
        responses={
            201: openapi.Response("Usuario registrado exitosamente."),
            400: "Error en la solicitud."
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        med_allergies_data = request.data["med_allergies"]
        substance_allergies_data = request.data["substance_allergies"]
        allergies = []
        for item in med_allergies_data + substance_allergies_data:
            allergies.append(Allergy.objects.get(pk=item["_id"]))
        user.allergies.set(allergies)
        user.save()
        serializer = serializers.BasicUserSerializer(user)
        custom_payload = {"is_student": user.role ==
                          'student', "is_teacher": user.role == 'teacher',
                          'blood_type': user.blood_type}
        token = RefreshToken.for_user(user)
        token["custom_data"] = custom_payload
        data = serializer.data
        data["tokens"] = {"refresh": str(
            token), "access": str(token.access_token)}
        return Response(data, status=status.HTTP_201_CREATED)


class UserLoginAPIView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = serializers.UserLoginSerializer

    @swagger_auto_schema(
        operation_description="Iniciar sesión de un usuario.",
        request_body=serializers.UserLoginSerializer,
        responses={
            200: openapi.Response("Inicio de sesión exitoso."),
            400: "Error en la solicitud."
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        serializer = serializers.BasicUserSerializer(user)
        blood_types = User.BLOOD_TYPES
        blood_type = None
        for id_val, val in blood_types:
            if id_val == user.blood_type:
                blood_type = val
        custom_payload = {"is_student": user.role ==
                          'student', "is_teacher": user.role == 'teacher',
                          'blood_type': user.blood_type}
        token = RefreshToken.for_user(user)
        token["custom_data"] = custom_payload
        data = serializer.data
        data["tokens"] = {"refresh": str(
            token), "access": str(token.access_token)}
        return Response(data, status=status.HTTP_200_OK)


class UserResetPasswordAPIView(GenericAPIView):
    permission_classes = (AllowAny,)
    serializer_class = serializers.UserLoginSerializer  # TODO: remove or use

    @swagger_auto_schema(
        operation_description="Enviar un correo para resetear la contraseña.",
        request_body=serializers.PasswordResetSerializer,
        responses={
            200: "Correo enviado exitosamente.",
            404: "No existe un usuario con el correo dado.",
            400: "Error en la solicitud."
        }
    )
    def post(self, request, *args, **kwargs):
        serializer = serializers.PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            user_email = serializer.validated_data["email"]
            try:
                token = (
                    ""  # configure link to send and the view it will redirect them to
                )
                subject = "Restablecimiento de contraseña"
                message = f"Link para crear una nueva contraseña: {token}"
                from_email = "noreply@fieldtrip.cl"
                recipient_list = [user_email]
                send_mail(
                    subject, message, from_email, recipient_list
                )
                return Response(
                    {"message": "Se ha enviado un correo para resetear la contraseña."},
                    status=status.HTTP_200_OK,
                )
            except User.DoesNotExist:
                return Response(
                    {"error": "No existe un usuario con el correo dado."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(UpdateAPIView):
    permission_classes = (IsAuthenticated,)
    queryset = User.objects.all()
    serializer_class = serializers.ChangePasswordSerializer

    @swagger_auto_schema(
        operation_description="Cambiar la contraseña del usuario autenticado.",
        request_body=serializers.ChangePasswordSerializer,
        responses={
            200: "Contraseña cambiada exitosamente.",
            400: "Error en la solicitud."
        }
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)


class UserLogoutAPIView(GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = serializers.UserLoginSerializer  # TODO: remove or use

    @swagger_auto_schema(
        operation_description="Cerrar sesión del usuario autenticado.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "refresh": openapi.Schema(type=openapi.TYPE_STRING, description="Token de refresco.")
            }
        ),
        responses={
            205: "Sesión cerrada exitosamente.",
            400: "Error en la solicitud."
        }
    )
    def post(self, request, *args, **kwargs):
        try:
            refresh_token = request.data["refresh"]
            token = "token"  # RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class BloodChoicesAPIView(APIView):
    @swagger_auto_schema(
        operation_description="Obtener las opciones de tipos de sangre.",
        responses={
            200: openapi.Response(
                description="Lista de tipos de sangre.",
                schema=openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del tipo de sangre."),
                            "value": openapi.Schema(type=openapi.TYPE_STRING, description="Descripción del tipo de sangre.")
                        }
                    )
                )
            )
        }
    )
    def get(self, request, format=None):
        blood_choices = User.BLOOD_TYPES
        blood_dicts = [
            {"id": choice[0], "value": choice[1]} for choice in blood_choices
        ]
        return Response(blood_dicts, status=status.HTTP_200_OK)


class TeacherViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, IsTeacher)
    queryset = User.objects.filter(role='teacher')
    serializer_class = serializers.UserSerializer


class DietViewSet(viewsets.ModelViewSet):
    queryset = Diet.objects.all()
    serializer_class = serializers.DietSerializer
    permission_classes = [IsAuthenticatedOrReadOnly] 


class MedAllergyViewSet(viewsets.ModelViewSet):
    queryset = Allergy.objects.filter(category=2)
    serializer_class = serializers.AllergySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class SubstanceAllergyViewSet(viewsets.ModelViewSet):
    queryset = Allergy.objects.filter(category=1)
    serializer_class = serializers.AllergySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
