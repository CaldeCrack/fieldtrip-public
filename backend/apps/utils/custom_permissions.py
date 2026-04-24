from rest_framework import permissions
from apps.main.models import FieldtripAttendee


class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'teacher'

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role == 'teacher'


class IsStudent(permissions.BasePermission):
    def has_object_permission(self, request):
        return request.user.is_authenticated and request.user.role == 'student'


class IsAuxiliar(permissions.BasePermission):
    """
    Allows access to teachers and to students that are auxiliar
    for the fieldtrip identified by 'pk' or 'id' in the URL kwargs.
    """
    def has_object_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        fieldtrip_id = view.kwargs.get('pk') or view.kwargs.get('id')
        if not fieldtrip_id:
            return False
        return FieldtripAttendee.objects.filter(
            user=request.user,
            fieldtrip_id=fieldtrip_id,
            is_auxiliar=True,
        ).exists()


class IsInventoryManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'inventory_manager'

    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.role == 'inventory_manager'
