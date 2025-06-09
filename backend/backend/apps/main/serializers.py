from rest_framework import serializers

from .models import *
from apps.utils.functions import *
from apps.user.serializers import *


class FieldtripSerializer(serializers.ModelSerializer):
    teacher_id = serializers.IntegerField()
    teacher = serializers.SerializerMethodField()
    course_id = serializers.IntegerField()
    course = serializers.SerializerMethodField()

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
            "cached_checklist"
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
        fields = ["id", "fieldtrip", "user_id", "user", "signup_complete"]

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
        id = instance.fieldtrip.id
        fieldtrip = Fieldtrip.objects.get(pk=id)
        data = {
            "id": id,
            "title": fieldtrip.name,
            "proffesor": f"{fieldtrip.teacher.names} {fieldtrip.teacher.surnames}",
            "startDate": format_date(fieldtrip.start_date),
            "endDate": format_date(fieldtrip.end_date),
            "invitationCode": fieldtrip.invitation_code,
        }
        return data


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
