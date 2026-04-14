from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema

from .models import EquipmentInUse
from apps.utils.custom_permissions import IsTeacher, IsAuxiliar


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
		equipment_in_use = (
			EquipmentInUse.objects.select_related("item_in_stock__type")
			.filter(fieldtrip_id=id, quantity__gt=0)
			.order_by("item_in_stock__type__type")
		)

		equipment = [
			{
				"id": item.id,
				"name": item.item_in_stock.type.type,
				"quantity": item.quantity,
			}
			for item in equipment_in_use
		]

		return Response({"equipment": equipment}, status=status.HTTP_200_OK)
