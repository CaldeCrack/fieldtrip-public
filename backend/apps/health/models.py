from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from apps.user.models import User
from apps.main.models import Fieldtrip, ChecklistStatus


class HealthDataLog(models.Model):
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Ficha médica del usuario',
        related_name='owner'
    )
    viewer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Usuario que revisó la ficha médica',
        related_name='viewer'
    )
    fieldtrip = models.ForeignKey(Fieldtrip, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Ficha médica de: {self.owner}, Vista por: {self.viewer}, Fieldtrip: {self.fieldtrip}, Timestamp: {self.timestamp}'

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'viewer', 'fieldtrip', 'timestamp'],
                name='unique_health_data_log'
            )
        ]
        verbose_name_plural = 'Log de la Información de Salud'
        verbose_name = 'log de la información de salud'


class HealthSpecific(models.Model):
    item = models.CharField(max_length=255, verbose_name='Ítem')

    def __str__(self):
        return self.item

    class Meta:
        verbose_name_plural = 'Ítems de Salud Específicos'
        verbose_name = 'ítem de salud específico'


class HealthSpecificValue(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Usuario')
    fieldtrip = models.ForeignKey(
        Fieldtrip,
        on_delete=models.CASCADE)
    item = models.ForeignKey(
        HealthSpecific,
        on_delete=models.CASCADE,
        verbose_name='Ítem')
    value = models.CharField(
        max_length=255,
        verbose_name='Ingrese su respuesta', )

    def __str__(self):
        return f'Usuario: {self.user}, Fieldtrip: {self.fieldtrip}, Ítem: {self.item}, Valor: {self.value}'

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'fieldtrip', 'item'], name='unique_health_specific_value')
        ]
        verbose_name_plural = 'Información de Ítems de Salud Específicos'
        verbose_name = 'información de ítem de salud específico'


SITUATION_CHOICES = [
    (1, 'Ha presentado'),
    (2, 'Presenta'),
]


class HealthGral(models.Model):
    situation = models.IntegerField(
        choices=SITUATION_CHOICES,
        verbose_name='Indique el tipo de ítem')
    item = models.CharField(max_length=255, verbose_name='Ítem')

    def __str__(self):
        return f'{self.get_situation_display()}: {self.item}'

    class Meta:
        verbose_name_plural = 'Ítems de Salud General'
        verbose_name = 'ítem de salud general'


class HealthGralStatus(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Usuario')
    fieldtrip = models.ForeignKey(Fieldtrip, on_delete=models.CASCADE)
    item = models.ForeignKey(
        HealthGral, on_delete=models.CASCADE, verbose_name='Ítem')
    status = models.BooleanField(
        verbose_name='¿Aplica esta condición para usted?')

    def __str__(self):
        return f'Usuario: {self.user}, Fieldtrip: {self.fieldtrip}, Ítem: {self.item}, Estado: {"Aplica" if self.status else "No aplica"}'

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'fieldtrip', 'item'], name='unique_health_gral_status')
        ]
        verbose_name_plural = 'Estatus de Ítems de Salud General'
        verbose_name = 'estatus de ítem de salud general'


class FieldtripSignup(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name="Usuario")
    fieldtrip = models.ForeignKey(
        Fieldtrip, on_delete=models.CASCADE, verbose_name="Salida a terreno")
    checklist_status = models.ManyToManyField(
        ChecklistStatus, related_name="fieldtrip_signups", blank=True, verbose_name="Estado del checklist")
    health_general = models.ManyToManyField(
        HealthGral, related_name="fieldtrip_signups_general", blank=True, verbose_name="Ítems generales de salud")
    health_specific = models.ManyToManyField(
        HealthSpecific, related_name="fieldtrip_signups_specific", blank=True, verbose_name="Ítems específicos de salud")

    def __str__(self):
        return f"Usuario: {self.user}, Fieldtrip: {self.fieldtrip}"

    def clean(self):
        # Validar que la salida no haya finalizado
        if self.fieldtrip.end_date and self.fieldtrip.end_date < timezone.now().date():
            raise ValidationError(
                {"fieldtrip": "No puedes registrarte en una salida que ya ha finalizado."})

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "fieldtrip"], name="unique_user_fieldtrip_signup"
            )
        ]
        verbose_name_plural = "Formularios de registro de usuarios en Fieldtrips"
        verbose_name = "formulario de registro de un usuario a un fieldtrip"
