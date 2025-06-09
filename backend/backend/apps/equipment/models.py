from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from apps.user.models import User
from apps.main.models import Fieldtrip, EducationalInstitution


class Equipment(models.Model):
    type = models.CharField(
        max_length=30,
        unique=True,
        verbose_name='Tipo'
    )

    def __str__(self):
        return self.type

    class Meta:
        verbose_name_plural = 'Equipamiento'
        verbose_name = 'equipamiento'

class UserEquipment(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name='Usuario'
    )
    fieldtrip = models.ForeignKey(
        Fieldtrip,
        on_delete=models.CASCADE
    )
    type = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        verbose_name='Tipo de equipamiento'
    )
    quantity = models.IntegerField(
        verbose_name='Cantidad'
    )

    def __str__(self):
        return f'Usuario: {self.user}, Fieldtrip: {self.fieldtrip}, Equipamiento: {self.type}'

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'fieldtrip', 'type'],
                name='unique_user_fieldtrip_equipment'
            )
        ]
        verbose_name_plural = 'Equipamiento de Usuarios'
        verbose_name = 'equipamiento de usuario'

class EducationalInstitutionEquipment(models.Model):
    institution = models.ForeignKey(
        EducationalInstitution,
        on_delete=models.CASCADE,
        verbose_name='Institución educacional'
    )
    type = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        verbose_name='Tipo de equipamiento'
    )
    quantity = models.IntegerField(
        verbose_name='Cantidad'
    )

    def __str__(self):
        return f'Institución: {self.institution}, Equipamiento: {self.type}, Cantidad: {self.quantity}'

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['institution', 'type'],
                name='unique_institution_equipment'
            )
        ]
        verbose_name_plural = 'Equipamiento de Instituciones Educacionales'
        verbose_name = 'equipamiento de institución educacional'

class EquipmentInUse(models.Model):
    fieldtrip = models.ForeignKey(
        Fieldtrip,
        on_delete=models.CASCADE
    )
    item_in_stock = models.ForeignKey(
        EducationalInstitutionEquipment,
        on_delete=models.CASCADE,
        verbose_name='Stock de equipamiento'
    )
    quantity = models.IntegerField(
        verbose_name='Cantidad'
    )

    def __str__(self):
        return f'Fieldtrip: {self.fieldtrip}, Equipamiento: {self.item_in_stock.type}, Cantidad: {self.quantity}'

    def clean(self):
        # Validar que la cantidad no exceda el stock disponible
        if self.quantity > self.item_in_stock.quantity:
            raise ValidationError({'quantity': _('No hay suficiente stock disponible.')})

    def save(self, *args, **kwargs):
        # Actualizar el stock al guardar
        self.clean()  # Asegurarse de que las validaciones se ejecuten
        self.item_in_stock.quantity -= self.quantity
        self.item_in_stock.save()
        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['fieldtrip', 'item_in_stock'],
                name='unique_fieldtrip_equipment_in_use'
            )
        ]
        verbose_name_plural = 'Equipamiento en Uso'
        verbose_name = 'equipamiento en uso'
