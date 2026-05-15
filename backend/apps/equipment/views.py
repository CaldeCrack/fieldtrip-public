from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from django.db import transaction
from django.db.models import Sum

from .models import EducationalInstitutionEquipment, EquipmentRequest, UserEquipment
from apps.utils.custom_permissions import IsTeacher, IsAuxiliar, IsInventoryManager
from apps.main.models import Course, Fieldtrip


class FieldtripEquipmentAPIView(APIView):
	permission_classes = (IsAuthenticated, IsTeacher | IsAuxiliar)

	@swagger_auto_schema(
		operation_description="Recuperar el equipamiento utilizado en una salida a campo.",
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"equipment": openapi.Schema(
						type=openapi.TYPE_ARRAY,
						items=openapi.Schema(
							type=openapi.TYPE_OBJECT,
							properties={
								"id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del registro de equipamiento"),
								"name": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre del equipamiento"),
								"quantity": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad usada"),
							},
						),
						description="Lista de equipamiento usado",
					)
				},
			)
		},
	)
	def get(self, request, id, format=None):
		equipment_requests = (
			EquipmentRequest.objects.select_related("type")
			.filter(fieldtrip_id=id, status="approved", quantity__gt=0)
			.order_by("type__type")
		)

		equipment = [
			{
				"id": item.id,
				"name": item.type.type,
				"quantity": item.quantity,
			}
			for item in equipment_requests
		]

		return Response({"equipment": equipment}, status=status.HTTP_200_OK)


class EquipmentListAPIView(APIView):
	permission_classes = (IsAuthenticated, IsTeacher | IsAuxiliar)

	@swagger_auto_schema(
		operation_description="Recuperar la lista de equipamiento disponible para una institución educacional.",
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"equipment": openapi.Schema(
						type=openapi.TYPE_ARRAY,
						items=openapi.Schema(
							type=openapi.TYPE_OBJECT,
							properties={
								"id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del equipamiento"),
								"name": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre del equipamiento"),
								"quantity": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad disponible"),
							},
						),
						description="Lista de equipamiento disponible",
					)
				},
			)
		},
	)
	def get(self, request, course_id=None, format=None):
		# Get institution_id from course_id if provided
		if course_id:
			try:
				from rest_framework.response import Response

				course = Course.objects.get(pk=course_id)
				institution = course.institution

				if not institution:
					return Response({"equipment": []}, status=200)

				equipment_list = (
					EducationalInstitutionEquipment.objects.select_related("type")
					.filter(institution=institution)
					.order_by("type__type")
				)

				equipment = [
					{
						"id": item.type.id,
						"name": item.type.type,
						"quantity": item.quantity,
					}
					for item in equipment_list
				]
				return Response({"equipment": equipment}, status=status.HTTP_200_OK)

			except Course.DoesNotExist:
				from rest_framework.response import Response
				return Response({"equipment": []}, status=200)


class EducationalInstitutionEquipmentAPIView(APIView):
	permission_classes = (IsAuthenticated, IsInventoryManager)

	@swagger_auto_schema(
		operation_description="Recuperar el equipamiento disponible para una institución educacional.",
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"equipment": openapi.Schema(
						type=openapi.TYPE_ARRAY,
						items=openapi.Schema(
							type=openapi.TYPE_OBJECT,
							properties={
								"id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del equipamiento"),
								"name": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre del equipamiento"),
								"quantity": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad disponible"),
							},
						),
						description="Lista de equipamiento disponible",
					)
				},
			)
		},
	)
	def get(self, request, institution_id, format=None):
		equipment_list = (
			EducationalInstitutionEquipment.objects.select_related("type")
			.filter(institution_id=institution_id)
			.order_by("type__type")
		)

		equipment = [
			{
				"id": item.type.id,
				"name": item.type.type,
				"quantity": item.quantity,
			}
			for item in equipment_list
		]

		return Response({"equipment": equipment}, status=status.HTTP_200_OK)


class FieldtripEquipmentOptionsAPIView(APIView):
	permission_classes = (IsAuthenticated, IsTeacher | IsAuxiliar | IsInventoryManager)

	@swagger_auto_schema(
		operation_description="Recuperar el equipamiento disponible para la institución de una salida a campo.",
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"equipment": openapi.Schema(
						type=openapi.TYPE_ARRAY,
						items=openapi.Schema(
							type=openapi.TYPE_OBJECT,
							properties={
								"id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del equipamiento"),
								"name": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre del equipamiento"),
								"quantity": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad disponible"),
							},
						),
						description="Lista de equipamiento disponible",
					)
				},
			)
		},
	)
	def get(self, request, id, format=None):
		fieldtrip = Fieldtrip.objects.select_related("course__institution").filter(id=id).first()
		if not fieldtrip or not fieldtrip.course or not fieldtrip.course.institution:
			return Response({"equipment": []}, status=status.HTTP_200_OK)

		equipment_list = (
			EducationalInstitutionEquipment.objects.select_related("type")
			.filter(institution=fieldtrip.course.institution)
			.order_by("type__type")
		)

		equipment = [
			{
				"id": item.type.id,
				"name": item.type.type,
				"quantity": item.quantity,
			}
			for item in equipment_list
		]

		return Response({"equipment": equipment}, status=status.HTTP_200_OK)


class FieldtripEquipmentRequestAPIView(APIView):
	permission_classes = (IsAuthenticated, IsInventoryManager | IsTeacher | IsAuxiliar)

	@swagger_auto_schema(
		operation_description="Recuperar las solicitudes pendientes de equipamiento para una salida a campo.",
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"requests": openapi.Schema(
						type=openapi.TYPE_ARRAY,
						items=openapi.Schema(
							type=openapi.TYPE_OBJECT,
							properties={
								"id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID de la solicitud"),
								"name": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre del equipamiento"),
								"quantity": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad solicitada"),
								"status": openapi.Schema(type=openapi.TYPE_STRING, description="Estado actual"),
							},
						),
						description="Lista de solicitudes de equipamiento",
					)
				},
			)
		}
	)
	def get(self, request, id, format=None):
		requests = (
			EquipmentRequest.objects.select_related("type")
			.filter(fieldtrip_id=id)
			.order_by("status", "type__type")
		)

		payload = [
			{
				"id": item.id,
				"type_id": item.type_id,
				"name": item.type.type,
				"quantity": item.quantity,
				"status": item.status,
			}
			for item in requests
		]

		return Response({"requests": payload}, status=status.HTTP_200_OK)

	@swagger_auto_schema(
		operation_description="Crear o actualizar solicitudes de equipamiento.",
		request_body=openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				"equipment": openapi.Schema(
					type=openapi.TYPE_ARRAY,
					items=openapi.Schema(
						type=openapi.TYPE_OBJECT,
						properties={
							"id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del equipamiento"),
							"quantity": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad solicitada"),
						},
					),
				),
			},
			required=["equipment"],
		),
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"updated": openapi.Schema(type=openapi.TYPE_INTEGER),
				},
			),
		},
	)
	def post(self, request, id, format=None):
		equipment = request.data.get("equipment", [])
		if not isinstance(equipment, list) or len(equipment) == 0:
			return Response(
				{"detail": "Debe proporcionar una lista de equipamiento."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		fieldtrip = Fieldtrip.objects.select_related("course__institution").filter(id=id).first()
		if not fieldtrip or not fieldtrip.course or not fieldtrip.course.institution:
			return Response(
				{"detail": "La salida no tiene una institución asociada."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		updated_count = 0
		with transaction.atomic():
			for item in equipment:
				item_id = item.get("id")
				quantity = int(item.get("quantity") or 0)
				if not item_id or quantity <= 0:
					continue

				stock_item = EducationalInstitutionEquipment.objects.filter(
					institution=fieldtrip.course.institution,
					type_id=item_id,
				).first()

				if not stock_item:
					return Response(
						{"detail": "No existe equipamiento registrado para esta institución."},
						status=status.HTTP_400_BAD_REQUEST,
					)

				if quantity > stock_item.quantity:
					return Response(
						{"detail": "No hay suficiente equipamiento."},
						status=status.HTTP_400_BAD_REQUEST,
					)

				equipment_request = EquipmentRequest.objects.filter(
					fieldtrip_id=id,
					type_id=item_id,
				).first()

				if equipment_request and equipment_request.status == "approved":
					return Response(
						{"detail": "El equipamiento ya fue aprobado."},
						status=status.HTTP_400_BAD_REQUEST,
					)

				if equipment_request:
					equipment_request.quantity = quantity
					equipment_request.status = "pending"
					equipment_request.save(update_fields=["quantity", "status"])
				else:
					EquipmentRequest.objects.create(
						fieldtrip_id=id,
						type_id=item_id,
						quantity=quantity,
						status="pending",
					)

				updated_count += 1

		return Response({"updated": updated_count}, status=status.HTTP_200_OK)

	@swagger_auto_schema(
		operation_description="Aprobar o rechazar una solicitud de equipamiento.",
		request_body=openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				"status": openapi.Schema(
					type=openapi.TYPE_STRING,
					description="Estado objetivo: approved o rejected",
				),
			},
			required=["status"],
		),
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"id": openapi.Schema(type=openapi.TYPE_INTEGER),
					"status": openapi.Schema(type=openapi.TYPE_STRING),
				},
			)
		}
	)
	def patch(self, request, id, request_id, format=None):
		status_value = request.data.get("status")
		if status_value not in {"approved", "rejected"}:
			return Response(
				{"detail": "El estado debe ser 'approved' o 'rejected'."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		equipment_request = EquipmentRequest.objects.filter(fieldtrip_id=id, id=request_id).first()
		if not equipment_request:
			return Response({"detail": "La solicitud no existe."}, status=status.HTTP_404_NOT_FOUND)

		if equipment_request.status != 'pending':
			return Response(
				{"detail": "La solicitud ya fue resuelta."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		with transaction.atomic():
			if status_value == "approved":
				fieldtrip = equipment_request.fieldtrip
				course = fieldtrip.course
				institution = course.institution if course else None

				if not institution:
					return Response(
						{"detail": "La salida no tiene una institución asociada."},
						status=status.HTTP_400_BAD_REQUEST,
					)

				stock_item = EducationalInstitutionEquipment.objects.filter(
					institution=institution,
					type=equipment_request.type,
				).first()

				if not stock_item:
					return Response(
						{"detail": "No existe equipamiento registrado para esta institución."},
						status=status.HTTP_400_BAD_REQUEST,
					)

				if equipment_request.quantity > stock_item.quantity:
					return Response(
						{"detail": "No hay suficiente equipamiento."},
						status=status.HTTP_400_BAD_REQUEST,
					)

			equipment_request.status = status_value
			equipment_request.save(update_fields=["status"])

		return Response(
			{"id": equipment_request.id, "status": equipment_request.status},
			status=status.HTTP_200_OK,
		)


class FieldtripUserEquipmentAPIView(APIView):
	permission_classes = (IsAuthenticated, IsTeacher | IsAuxiliar)

	@swagger_auto_schema(
		operation_description="Recuperar el equipamiento asignado a un usuario en una salida a campo.",
		manual_parameters=[
			openapi.Parameter(
				"user_id",
				openapi.IN_QUERY,
				description="ID del usuario",
				type=openapi.TYPE_INTEGER,
				required=True,
			),
		],
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"equipment": openapi.Schema(
						type=openapi.TYPE_ARRAY,
						items=openapi.Schema(
							type=openapi.TYPE_OBJECT,
							properties={
								"id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del equipamiento"),
								"name": openapi.Schema(type=openapi.TYPE_STRING, description="Nombre del equipamiento"),
								"quantity": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad"),
							},
						),
					),
				},
			),
		},
	)
	def get(self, request, id, format=None):
		user_id = request.query_params.get("user_id")
		if not user_id:
			return Response(
				{"detail": "Debe proporcionar un user_id."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		user_equipment = (
			UserEquipment.objects.select_related("type")
			.filter(fieldtrip_id=id, user_id=user_id)
			.order_by("type__type")
		)
		approved_requests = (
			EquipmentRequest.objects.filter(fieldtrip_id=id, status="approved")
			.select_related("type")
		)
		request_id_by_type = {item.type_id: item.id for item in approved_requests}

		payload = [
			{
				"id": request_id_by_type.get(item.type_id),
				"name": item.type.type,
				"quantity": item.quantity,
			}
			for item in user_equipment
			if request_id_by_type.get(item.type_id)
		]

		return Response({"equipment": payload}, status=status.HTTP_200_OK)

	@swagger_auto_schema(
		operation_description="Asignar equipamiento de la salida a campo a un líder de grupo.",
		request_body=openapi.Schema(
			type=openapi.TYPE_OBJECT,
			properties={
				"user_id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del usuario"),
				"equipment": openapi.Schema(
					type=openapi.TYPE_ARRAY,
					items=openapi.Schema(
						type=openapi.TYPE_OBJECT,
						properties={
							"id": openapi.Schema(type=openapi.TYPE_INTEGER, description="ID del equipamiento"),
							"quantity": openapi.Schema(type=openapi.TYPE_INTEGER, description="Cantidad"),
						},
					),
				),
			},
			required=["user_id", "equipment"],
		),
		responses={
			200: openapi.Schema(
				type=openapi.TYPE_OBJECT,
				properties={
					"assigned": openapi.Schema(
						type=openapi.TYPE_INTEGER,
						description="Cantidad de registros asignados",
					),
				},
			)
		},
	)
	def post(self, request, id, format=None):
		user_id = request.data.get("user_id")
		equipment = request.data.get("equipment", [])

		if not user_id:
			return Response(
				{"detail": "Debe proporcionar un user_id."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		if not isinstance(equipment, list) or len(equipment) == 0:
			return Response(
				{"detail": "Debe proporcionar una lista de equipamiento."},
				status=status.HTTP_400_BAD_REQUEST,
			)

		assigned_count = 0
		with transaction.atomic():
			for item in equipment:
				item_id = item.get("id")
				quantity = int(item.get("quantity") or 0)
				if not item_id or quantity <= 0:
					continue
				equipment_request = (
					EquipmentRequest.objects.filter(
						id=item_id,
						fieldtrip_id=id,
						status="approved",
					)
					.select_related("type")
					.first()
				)
				if not equipment_request:
					return Response(
						{"detail": "El equipamiento no pertenece a esta salida a campo."},
						status=status.HTTP_400_BAD_REQUEST,
					)

				equipment_type = equipment_request.type

				assigned_other = (
					UserEquipment.objects.filter(fieldtrip_id=id, type=equipment_type)
					.exclude(user_id=user_id)
					.aggregate(total=Sum("quantity"))
					.get("total")
					or 0
				)
				current_assigned = (
					UserEquipment.objects.filter(
						fieldtrip_id=id,
						type=equipment_type,
						user_id=user_id,
					)
					.aggregate(total=Sum("quantity"))
					.get("total")
					or 0
				)
				max_allowed = equipment_request.quantity - assigned_other + current_assigned
				if quantity > max_allowed:
					return Response(
						{"detail": "Cantidad solicitada excede el disponible."},
						status=status.HTTP_400_BAD_REQUEST,
					)

				UserEquipment.objects.update_or_create(
					user_id=user_id,
					fieldtrip_id=id,
					type=equipment_type,
					defaults={"quantity": quantity},
				)
				assigned_count += 1

		return Response({"assigned": assigned_count}, status=status.HTTP_200_OK)
