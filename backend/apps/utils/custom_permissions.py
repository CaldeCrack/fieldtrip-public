from rest_framework import permissions


class IsTeacher(permissions.BasePermission):
    def has_object_permission(self, request):
        return request.user.is_authenticated and request.user.role == 'teacher'


class IsStudent(permissions.BasePermission):
    def has_object_permission(self, request):
        return request.user.is_authenticated and request.user.role == 'student'
