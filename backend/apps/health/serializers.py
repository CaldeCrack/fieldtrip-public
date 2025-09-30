from rest_framework import serializers

from apps.user.serializers import *
from apps.main.serializers import *
from apps.utils.functions import *
from .models import *


class HealthDataLogSerializer(serializers.ModelSerializer):
    viewer_id = serializers.IntegerField()
    viewer = serializers.SerializerMethodField()
    fieldtrip_id = serializers.IntegerField()
    fieldtrip = serializers.SerializerMethodField()

    class Meta:
        model = HealthDataLog
        fields = ["id", "viewer_id", "viewer",
                  "fieldtrip_id", "fieldtrip", "timestamp"]

    def get_viewer(self, obj):
        try:
            instance = User.objects.get(pk=obj.viewer_id)
        except Exception:
            return None
        instance = UserSerializer(instance).data
        return instance["names"] + " " + instance["surnames"]

    def get_fieldtrip(self, obj):
        try:
            instance = Fieldtrip.objects.get(pk=obj.fieldtrip_id)
        except Exception:
            return None
        return FieldtripSerializer(instance).data["name"]

    def to_representation(self, instance):
        data = super(HealthDataLogSerializer, self).to_representation(instance)
        data["timestamp"] = data["timestamp"][:10]
        data["timestamp"] = data["timestamp"].replace("-", "/")
        return remove_id_keys(data)


class HealthSpecificSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthSpecific
        fields = ["id", "item"]


class HealthSpecificValueSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthSpecificValue
        fields = ("item", "value")


class HealthGralSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthGral
        fields = ["id", "item", "situation"]


class HealthGralStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthGralStatus
        fields = ("item", "status")


class UserAllergySerializer(serializers.ModelSerializer):
    allergies = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="is_allergic"
    )

    class Meta:
        model = User
        fields = ["email", "allergies"]


class FieldtripSignupSerializer(serializers.Serializer):
    user = serializers.IntegerField()
    fieldtrip = serializers.IntegerField()
    checklist_status = serializers.ListField(child=ChecklistStatusSerializer())
    health_general = serializers.ListField(child=HealthGralStatusSerializer())
    health_specific = serializers.ListField(
        child=HealthSpecificValueSerializer())


class FieldtripHealthChartSerializer(serializers.Serializer):
    user = serializers.IntegerField()
    fieldtrip = serializers.IntegerField()
