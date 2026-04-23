from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction

from .models import *
from .serializers import *
from .helpers import *
from apps.main.models import MUTUALLY_EXCLUSIVE_CHECKLIST_ITEMS
from apps.utils.custom_permissions import IsTeacher, IsStudent, IsAuxiliar
from apps.equipment.models import EquipmentInUse, EducationalInstitutionEquipment


class HealthDataLogViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = HealthDataLog.objects.select_related(
        'owner', 'viewer', 'fieldtrip').all()
    serializer_class = HealthDataLogSerializer

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'user'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsTeacher()]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if user.role == 'teacher':
            return queryset
        if user.role == 'student':
            return queryset.filter(owner=user)
        raise PermissionDenied("No tiene permisos para acceder a los logs de salud.")

    @swagger_auto_schema(
        operation_description="Obtener logs de salud de un estudiante.",
        manual_parameters=[
            openapi.Parameter(
                'user-id', openapi.IN_QUERY, description="ID del usuario", type=openapi.TYPE_INTEGER
            )
        ],
        responses={200: HealthDataLogSerializer(many=True)}
    )
    @action(detail=False, methods=['GET'])
    def user(self, request):
        requester = request.user
        user_id = request.query_params.get('user-id')

        if requester.role == 'student':
            user_id = requester.id
        elif not user_id:
            return Response({"error": "user-id is required"}, status=status.HTTP_400_BAD_REQUEST)

        instances = self.get_queryset().filter(owner=user_id)
        serializer = HealthDataLogSerializer(instances, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HealthSpecificViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = HealthSpecific.objects.all()
    serializer_class = HealthSpecificSerializer


class PastHealthGralViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = HealthGral.objects.filter(situation=1)
    serializer_class = HealthGralSerializer


class CurrentHealthGralViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = HealthGral.objects.filter(situation=2)
    serializer_class = HealthGralSerializer


class HealthGralCreateAPIView(APIView):
    permission_classes = (IsAuthenticated, IsTeacher | IsAuxiliar)

    @swagger_auto_schema(
        operation_description="Crear un nuevo item de salud general.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["item", "situation"],
            properties={
                "item": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre del item"),
                "situation": openapi.Schema(
                    type=openapi.TYPE_INTEGER,
                    description="1: Ha presentado, 2: Presenta",
                ),
            },
        ),
        responses={201: HealthGralSerializer()},
    )
    def post(self, request):
        serializer = HealthGralSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(HealthGralSerializer(instance).data, status=status.HTTP_201_CREATED)


class UserAllergyViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = User.objects.all()
    serializer_class = UserAllergySerializer


class FieldtripViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, IsTeacher | IsAuxiliar)
    queryset = Fieldtrip.objects.prefetch_related('course', 'teacher').all()
    serializer_class = FieldtripSerializer

    def perform_create(self, serializer):
        try:
            teacher_id = self.request.data.get('teacher_id')
            equipment_data = self.request.data.get('equipment', [])
            
            if not teacher_id:
                teacher = self.request.user
            else:
                teacher = get_object_or_404(User, pk=teacher_id)
            
            fieldtrip = serializer.save(teacher=teacher)
            
            FieldtripAttendee.objects.get_or_create(
                user=teacher,
                fieldtrip=fieldtrip
            )
            
            # Create equipment records if provided
            if equipment_data:
                for equipment_item in equipment_data:
                    equipment_id = equipment_item.get('id')
                    quantity = equipment_item.get('quantity', 0)
                    
                    if equipment_id and quantity > 0:
                        try:
                            # Get the institution from the fieldtrip's course
                            institution = fieldtrip.course.institution
                            
                            # Get the EducationalInstitutionEquipment for this equipment and institution
                            inst_equipment = EducationalInstitutionEquipment.objects.get(
                                institution=institution,
                                type_id=equipment_id
                            )
                            
                            # Create EquipmentInUse record
                            EquipmentInUse.objects.create(
                                fieldtrip=fieldtrip,
                                item_in_stock=inst_equipment,
                                quantity=quantity
                            )
                        except EducationalInstitutionEquipment.DoesNotExist:
                            pass
            
            return fieldtrip
        except Exception as e:
            import traceback
            print(f"Error in perform_create: {str(e)}")
            print(traceback.format_exc())
            raise

    @swagger_auto_schema(
        operation_description="Crea un log de salud para un estudiante.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "owner": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del dueño del log"),
                "viewer": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID de la persona que ve el log"),
                "fieldtrip": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID de la salida a campo"),
            },
        ),
    )
    @action(detail=False, methods=['POST'])
    def chart(self, request):
        owner_id = request.data.get("owner")
        viewer_id = request.data.get("viewer")
        fieldtrip_id = request.data.get("fieldtrip")

        owner = get_object_or_404(User, pk=owner_id)
        viewer = get_object_or_404(User, pk=viewer_id)
        fieldtrip = get_object_or_404(Fieldtrip, pk=fieldtrip_id)

        HealthDataLog.objects.create(
            owner=owner, viewer=viewer, fieldtrip=fieldtrip)

        substance_allergies = owner.allergies.filter(category=1)
        med_allergies = owner.allergies.filter(category=2)
        blood_type = owner.get_blood_type_display()
        full_name = f"{owner.names} {owner.surnames}"

        data = {
            "fullName": full_name,
            "bloodType": blood_type,
            "substanceAllergies": [allergy.type for allergy in substance_allergies],
            "medAllergies": [allergy.type for allergy in med_allergies],
            "emergencyContact": {
                "name": owner.emergency_contact,
                "phone": owner.emergency_number,
            }}
        return Response(data, status=status.HTTP_201_CREATED)


class FieldtripMetricsAPIView(APIView):
    permission_classes = (IsAuthenticated, IsTeacher | IsAuxiliar)

    @swagger_auto_schema(
        operation_description="Recuperar estadísticas de salud y alergias de los estudiantes asistentes a una salida a campo.",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "diseases": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "name": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre de la enfermedad"),
                                "count": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad de estudiantes con la enfermedad"),
                            },
                        ),
                        description="Lista de enfermedades y su conteo",
                    ),
                    "allergies": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "name": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre de la alergia"),
                                "count": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad de estudiantes con la alergia"),
                            },
                        ),
                        description="Lista de alergias y su conteo",
                    ),
                },
            )
        },
    )
    def get(self, request, id, format=None):
        # Solo asistentes que sean estudiantes
        attendees = FieldtripAttendee.objects.filter(
            fieldtrip_id=id, user__role='student'
        )

        # Enfermedades
        diseases = HealthGral.objects.filter(situation=2)
        disease_names = [disease.item for disease in diseases]
        disease_counts = {name: 0 for name in disease_names}

        for attendee in attendees:
            health_statuses = HealthGralStatus.objects.filter(
                user=attendee.user, fieldtrip_id=id, item__situation=2, status=True
            )
            for status_obj in health_statuses:
                disease_name = status_obj.item.item
                if disease_name in disease_counts:
                    disease_counts[disease_name] += 1

        # Alergias
        allergy_counts = {}
        for attendee in attendees:
            allergies = attendee.user.allergies.all()
            for allergy in allergies:
                allergy_type = allergy.type
                allergy_counts[allergy_type] = allergy_counts.get(allergy_type, 0) + 1

        diseases_list = [{"name": name, "count": count} for name, count in disease_counts.items()]
        allergies_list = [{"name": name, "count": count} for name, count in allergy_counts.items()]

        if len(diseases_list) < 2:
            diseases_list = []

        data = {
            "diseases": diseases_list,
            "allergies": allergies_list,
        }
        return Response(data, status=status.HTTP_200_OK)


class FieldtripSignupViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, IsStudent)
    queryset = FieldtripSignup.objects.select_related(
        'user', 'fieldtrip').all()
    serializer_class = FieldtripSignupSerializer

    @swagger_auto_schema(
        operation_description="Completar el registro de un usuario para una salida a campo.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "checklist_status": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "item": openapi.Schema(type=openapi.TYPE_INTEGER, description="Item del Checklist"),
                            "status": openapi.Schema(type=openapi.TYPE_BOOLEAN, description="Estado"),
                        },
                    ),
                ),
                "health_general": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "item": openapi.Schema(type=openapi.TYPE_INTEGER, description="Item de salud general"),
                            "status": openapi.Schema(type=openapi.TYPE_BOOLEAN, description="Estado"),
                        },
                    ),
                ),
                "health_specific": openapi.Schema(
                    type=openapi.TYPE_ARRAY,
                    items=openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            "item": openapi.Schema(type=openapi.TYPE_INTEGER, description="Item de salud específico"),
                            "value": openapi.Schema(type=openapi.TYPE_STRING, description="Valor"),
                        },
                    ),
                ),
            },
        ),
        responses={200: openapi.Response("Signup completed successfully.")}
    )
    @action(detail=False, methods=['POST'])
    def complete_signup(self, request):
        user_id = request.data.get("user")
        fieldtrip_id = request.data.get("fieldtrip")

        if not user_id or not fieldtrip_id:
            return Response(
                {"error": "Both 'user' and 'fieldtrip' are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = get_object_or_404(User, pk=user_id)
        fieldtrip = get_object_or_404(Fieldtrip, pk=fieldtrip_id)

        data = request.data

        try:
            with transaction.atomic():
                # Clean up legacy rows where checklist item was deleted and became NULL.
                ChecklistStatus.objects.filter(
                    user=user,
                    fieldtrip=fieldtrip,
                    item__isnull=True,
                ).delete()

                checklist_status_objects = []
                checklist_items = data.get("checklist_status", [])
                exclusive_true_item_ids = [
                    checklist_item["item"]
                    for checklist_item in checklist_items
                    if checklist_item.get("status", False)
                    and get_object_or_404(Checklist, pk=checklist_item["item"]).item
                    in MUTUALLY_EXCLUSIVE_CHECKLIST_ITEMS
                ]

                existing_exclusive_true = list(
                    ChecklistStatus.objects.filter(
                        user=user,
                        fieldtrip=fieldtrip,
                        status=True,
                        item__item__in=MUTUALLY_EXCLUSIVE_CHECKLIST_ITEMS,
                    ).values_list("item_id", flat=True)
                )

                selected_exclusive_item_id = None
                if exclusive_true_item_ids:
                    if len(exclusive_true_item_ids) == 1:
                        selected_exclusive_item_id = exclusive_true_item_ids[0]
                    else:
                        current_selected_id = existing_exclusive_true[0] if len(existing_exclusive_true) == 1 else None
                        if current_selected_id in exclusive_true_item_ids:
                            selected_exclusive_item_id = next(
                                (
                                    item_id
                                    for item_id in exclusive_true_item_ids
                                    if item_id != current_selected_id
                                ),
                                exclusive_true_item_ids[-1],
                            )
                        else:
                            selected_exclusive_item_id = exclusive_true_item_ids[-1]

                # Replace the previous exclusive selection with the new one.
                exclusive_qs = ChecklistStatus.objects.filter(
                    user=user,
                    fieldtrip=fieldtrip,
                ).filter(
                    item__item__in=MUTUALLY_EXCLUSIVE_CHECKLIST_ITEMS,
                )

                if selected_exclusive_item_id:
                    exclusive_qs.exclude(item_id=selected_exclusive_item_id).delete()
                else:
                    exclusive_qs.delete()

                for checklist_item in checklist_items:
                    checklist = get_object_or_404(Checklist, pk=checklist_item["item"])

                    # Keep only affirmative selection for exclusive options.
                    if checklist.item in MUTUALLY_EXCLUSIVE_CHECKLIST_ITEMS and not checklist_item["status"]:
                        ChecklistStatus.objects.filter(
                            user=user,
                            fieldtrip=fieldtrip,
                            item=checklist,
                        ).delete()
                        continue

                    if (
                        checklist.item in MUTUALLY_EXCLUSIVE_CHECKLIST_ITEMS
                        and selected_exclusive_item_id
                        and checklist_item["item"] != selected_exclusive_item_id
                    ):
                        checklist_item = {**checklist_item, "status": False}

                    checklist_status, _ = ChecklistStatus.objects.update_or_create(
                        user=user,
                        fieldtrip=fieldtrip,
                        item=checklist,
                        defaults={"status": checklist_item["status"]},
                    )
                    checklist_status_objects.append(checklist_status)

                health_general_objects = []
                for health_gral_item in data.get("health_general", []):
                    health_gral = get_object_or_404(
                        HealthGral, pk=health_gral_item["item"])
                    health_gral_status, created = HealthGralStatus.objects.get_or_create(
                        user=user,
                        fieldtrip=fieldtrip,
                        item=health_gral,
                        defaults={"status": health_gral_item["status"]},
                    )
                    if not created:
                        health_gral_status.status = health_gral_item["status"]
                        health_gral_status.save()
                    health_general_objects.append(health_gral)

                health_specific_objects = []
                for health_specific_item in data.get("health_specific", []):
                    health_specific = get_object_or_404(
                        HealthSpecific, pk=health_specific_item["item"]
                    )
                    health_specific_value, created = HealthSpecificValue.objects.get_or_create(
                        user=user,
                        fieldtrip=fieldtrip,
                        item=health_specific,
                        defaults={"value": health_specific_item["value"]},
                    )
                    if not created:
                        health_specific_value.value = health_specific_item["value"]
                        health_specific_value.save()
                    health_specific_objects.append(health_specific)

                fieldtrip_signup, created = FieldtripSignup.objects.get_or_create(
                    user=user,
                    fieldtrip=fieldtrip,
                )
                fieldtrip_signup.checklist_status.set(checklist_status_objects)
                fieldtrip_signup.health_general.set(health_general_objects)
                fieldtrip_signup.health_specific.set(health_specific_objects)
                fieldtrip_signup.save()

                fieldtrip_attendee, created = FieldtripAttendee.objects.get_or_create(
                    user=user,
                    fieldtrip=fieldtrip,
                )
                fieldtrip_attendee.signup_complete = True
                fieldtrip_attendee.save()
        except DjangoValidationError as error:
            return Response({"error": error.message_dict}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"success": True}, status=status.HTTP_200_OK)


class FieldtripHealthChartAPIView(APIView):
    permission_classes = (IsAuthenticated, IsTeacher)

    @swagger_auto_schema(
        operation_description="Recuperar la información de salud de un usuario en una salida a campo.",
        manual_parameters=[
            openapi.Parameter("user", openapi.IN_QUERY,
                              type=openapi.TYPE_INTEGER, description="ID del usuario"),
            openapi.Parameter("fieldtrip", openapi.IN_QUERY,
                              type=openapi.TYPE_INTEGER, description="ID de la salida a campo"),
        ],
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "hasPresented": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(type=openapi.TYPE_STRING),
                        description="Lista de problemas de salud que ha presentado",
                    ),
                    "presents": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(type=openapi.TYPE_STRING),
                        description="Lista de problemas de salud que presenta actualmente",
                    ),
                    "healthSpecific": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "item": openapi.Schema(type=openapi.TYPE_STRING, description="Item de salud específico"),
                                "value": openapi.Schema(type=openapi.TYPE_STRING, description="Valor"),
                            },
                        ),
                        description="Lista de valores de salud específicos",
                    ),
                },
            )
        },
    )
    def get(self, request, user, fieldtrip, format=None):
        serializer = FieldtripHealthChartSerializer(
            data={"user": user, "fieldtrip": fieldtrip})
        if serializer.is_valid():
            healthGral = HealthGralStatus.objects.filter(
                user=user, fieldtrip=fieldtrip)
            hasPresented = [
                instance.item.item for instance in healthGral if instance.item.situation == 1]
            presents = [
                instance.item.item for instance in healthGral if instance.item.situation == 2]
            healthSpecific = HealthSpecificValue.objects.filter(
                user=user, fieldtrip=fieldtrip)
            healthSpecificList = [
                {"item": instance.item.item, "value": instance.value} for instance in healthSpecific]
            data = {
                "hasPresented": hasPresented,
                "presents": presents,
                "healthSpecific": healthSpecificList
            }
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FieldtripSignUpStatusAPIView(APIView):
    permission_classes = (IsAuthenticated, IsStudent)

    @swagger_auto_schema(
        operation_description="Recupera el checklist del usuario autenticado para una salida a campo, solo si el registro está completo.",
    )
    def get(self, request, id):
        user = request.user
        fieldtrip = get_object_or_404(Fieldtrip, pk=id)

        selected_checklist_item_id = ChecklistStatus.objects.filter(
            user=user,
            fieldtrip=fieldtrip,
            status=True,
            item__item__in=MUTUALLY_EXCLUSIVE_CHECKLIST_ITEMS,
        ).values_list('item_id', flat=True).first()

        # Verifica si el usuario está inscrito y ha completado el registro
        try:
            attendee = FieldtripAttendee.objects.get(user=user, fieldtrip=fieldtrip)
        except FieldtripAttendee.DoesNotExist:
            return Response(
                {
                    "signup_complete": False,
                    "selected_checklist_item_id": selected_checklist_item_id,
                },
                status=status.HTTP_200_OK,
            )

        if not attendee.signup_complete:
            return Response(
                {
                    "signup_complete": False,
                    "selected_checklist_item_id": selected_checklist_item_id,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "signup_complete": True,
                "selected_checklist_item_id": selected_checklist_item_id,
            },
            status=status.HTTP_200_OK,
        )


class LatestFieldtripHealthAPIView(APIView):
    permission_classes = (IsAuthenticated, IsStudent)

    @swagger_auto_schema(
        operation_description="Devuelve los datos de salud general y específica del usuario autenticado para su última salida a campo.",
        responses={
            200: openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "health_general": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "item": openapi.Schema(type=openapi.TYPE_STRING, description="Item de salud general"),
                                "status": openapi.Schema(type=openapi.TYPE_BOOLEAN, description="Estado"),
                            },
                        ),
                        description="Salud general del usuario",
                    ),
                    "health_specific": openapi.Schema(
                        type=openapi.TYPE_ARRAY,
                        items=openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "item": openapi.Schema(type=openapi.TYPE_STRING, description="Item de salud específico"),
                                "value": openapi.Schema(type=openapi.TYPE_STRING, description="Valor"),
                            },
                        ),
                        description="Salud específica del usuario",
                    ),
                },
            ),
            404: "No hay registros de salidas para este usuario.",
        },
    )
    def get(self, request):
        user = request.user
        attendee = FieldtripAttendee.objects.filter(user=user).order_by('-fieldtrip__start_date').first()
        if not attendee:
            return Response({"error": "No hay registros de salidas para este usuario."}, status=status.HTTP_404_NOT_FOUND)

        fieldtrip = attendee.fieldtrip

        health_general_qs = HealthGralStatus.objects.filter(user=user, fieldtrip=fieldtrip)
        health_general = [
            {
                "item": hgs.item.item,
                "status": hgs.status
            }
            for hgs in health_general_qs
        ]

        health_specific_qs = HealthSpecificValue.objects.filter(user=user, fieldtrip=fieldtrip)
        health_specific = [
            {
                "item": hsv.item.item,
                "value": hsv.value
            }
            for hsv in health_specific_qs
        ]

        data = {
            "health_general": health_general,
            "health_specific": health_specific,
        }
        return Response(data, status=status.HTTP_200_OK)