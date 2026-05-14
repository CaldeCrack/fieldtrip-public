from rest_framework import serializers
from collections import defaultdict


from .models import *
from apps.utils.functions import *
from apps.user.serializers import *
from apps.equipment.models import Equipment, EquipmentRequest, EducationalInstitutionEquipment


class FieldtripSerializer(serializers.ModelSerializer):
    teacher_id = serializers.IntegerField()
    teacher = serializers.SerializerMethodField()
    course_id = serializers.IntegerField()
    course = serializers.SerializerMethodField()
    equipment = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )

    def validate(self, attrs):
        attrs = super().validate(attrs)
        # Equipment is mandatory on creation, but not on update operations.
        if self.instance is None:
            equipment = attrs.get("equipment", [])
            if not equipment:
                raise serializers.ValidationError(
                    {"equipment": "Debe seleccionar al menos un equipamiento."}
                )

            course_id = attrs.get("course_id")
            if not course_id:
                raise serializers.ValidationError(
                    {"course_id": "Debe seleccionar un curso para validar el equipamiento."}
                )

            course = Course.objects.select_related("institution").filter(pk=course_id).first()
            institution = course.institution if course else None
            if not institution:
                raise serializers.ValidationError(
                    {
                        "equipment": (
                            "El curso seleccionado no tiene una institución asociada para validar "
                            "el equipamiento."
                        )
                    }
                )

            available_by_equipment_id = dict(
                EducationalInstitutionEquipment.objects.filter(institution=institution)
                .values_list("type_id", "quantity")
            )

            requested_quantities = defaultdict(int)
            for index, equipment_item in enumerate(equipment):
                equipment_id = equipment_item.get("id")
                quantity = equipment_item.get("quantity", 0)

                if not equipment_id:
                    raise serializers.ValidationError(
                        {"equipment": f"El equipamiento en la posición {index + 1} no es válido."}
                    )

                if quantity <= 0:
                    raise serializers.ValidationError(
                        {
                            "equipment": (
                                f"La cantidad solicitada para el equipamiento {equipment_id} "
                                "debe ser mayor a 0."
                            )
                        }
                    )

                requested_quantities[equipment_id] += quantity

            for equipment_id, requested_quantity in requested_quantities.items():
                available_quantity = available_by_equipment_id.get(equipment_id, 0)
                if requested_quantity > available_quantity:
                    equipment_name = (
                        Equipment.objects.filter(pk=equipment_id).values_list("type", flat=True).first()
                        or str(equipment_id)
                    )
                    raise serializers.ValidationError(
                        {
                            "equipment": (
                                f"La cantidad solicitada para '{equipment_name}' no puede superar "
                                f"la disponibilidad de {available_quantity}."
                            )
                        }
                    )
        return attrs

    def create(self, validated_data):
        equipment_data = validated_data.pop("equipment", [])
        fieldtrip = super().create(validated_data)

        if equipment_data:
            for equipment_item in equipment_data:
                equipment_id = equipment_item.get("id")
                quantity = equipment_item.get("quantity", 0)
                if equipment_id and quantity > 0:
                    EquipmentRequest.objects.create(
                        fieldtrip=fieldtrip,
                        type_id=equipment_id,
                        quantity=quantity,
                        status="pending",
                    )

        return fieldtrip

    class Meta:
        model = Fieldtrip
        fields = [
            "id",
            "name",
            "active",
            "invitation_code",
            "start_date",
            "end_date",
            "teacher_id",
            "teacher",
            "course_id",
            "course",
            "sector",
            "cached_checklist",
            "equipment"
        ]

    def get_teacher(self, obj):
        try:
            instance = User.objects.get(pk=obj.teacher_id)
        except Exception:
            return None
        instance = UserSerializer(instance).data
        return instance["names"] + " " + instance["surnames"]

    def get_course(self, obj):
        try:
            instance = Course.objects.get(pk=obj.course_id)
        except Exception:
            return None
        return CourseSerializer(instance).data["name"]

    def get_active(self, obj):
        today = date.today()
        return obj.start_date <= today <= obj.end_date

    def to_representation(self, instance):
        data = super(FieldtripSerializer, self).to_representation(instance)
        return remove_id_keys(data)


class FieldtripAttendeeListSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = FieldtripAttendee
        fields = [
            "id",
            "fieldtrip",
            "user_id",
            "user",
            "signup_complete",
            "is_auxiliar",
            "is_group_leader",
        ]

    def get_user(self, obj):
        try:
            instance = User.objects.get(pk=obj.user_id)
        except Exception:
            return None
        instance = UserSerializer(instance).data
        return instance["names"] + " " + instance["surnames"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data.pop("id")
        data["name"] = data.pop("user")
        data["id"] = data.pop("user_id")
        data["fieldtripID"] = data.pop("fieldtrip")
        data["signupComplete"] = data.pop("signup_complete")
        data["isAuxiliar"] = data.pop("is_auxiliar")
        data["isGroupLeader"] = data.pop("is_group_leader")
        return data


class FieldtripAttendeeSerializer(serializers.ModelSerializer):
    invitation_code = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = FieldtripAttendee
        fields = ["id", "user", "invitation_code"]

    def create(self, validated_data):
        invitation_code = validated_data.pop("invitation_code")
        fieldtrip = Fieldtrip.objects.get(invitation_code=invitation_code)
        validated_data["fieldtrip"] = fieldtrip
        instance = super().create(validated_data)
        return instance

    def to_representation(self, instance):
        fieldtrip = instance.fieldtrip
        professor = None
        if fieldtrip.teacher:
            professor = f"{fieldtrip.teacher.names} {fieldtrip.teacher.surnames}"

        data = {
            "id": fieldtrip.id,
            "title": fieldtrip.name,
            "professor": professor,
            "startDate": format_date(fieldtrip.start_date),
            "endDate": format_date(fieldtrip.end_date),
            "invitationCode": fieldtrip.invitation_code,
        }
        return data


class FieldtripInventorySerializer(serializers.ModelSerializer):
    professor = serializers.SerializerMethodField()

    class Meta:
        model = Fieldtrip
        fields = ["id", "name", "professor", "start_date", "end_date", "invitation_code"]

    def get_professor(self, obj):
        if not obj.teacher:
            return None
        return f"{obj.teacher.names} {obj.teacher.surnames}"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {
            "id": data["id"],
            "title": data["name"],
            "professor": data["professor"],
            "startDate": format_date(instance.start_date),
            "endDate": format_date(instance.end_date),
            "invitationCode": data["invitation_code"],
        }


class ChecklistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Checklist
        fields = ["id", "item"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["checked"] = False
        return data


class ChecklistStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChecklistStatus
        fields = ("item", "status")


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "name"]
