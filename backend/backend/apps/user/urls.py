from django.urls import path
# from rest_framework_simplejwt.views import TokenRefreshView

from .views import *

app_name = "users"

urlpatterns = [
    path("signup/", UserRegistrationAPIView.as_view(), name="create-user"),
    path("login/", UserLoginAPIView.as_view(), name="login-user"),
    path("reset-password/", UserResetPasswordAPIView.as_view(), name="reset-password"),
    path(
        "change_password/<int:pk>/",
        ChangePasswordView.as_view(),
        name="change_password",
    ),
    # path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", UserLogoutAPIView.as_view(), name="logout-user"),
]