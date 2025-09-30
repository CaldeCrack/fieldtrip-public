from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.db.models import JSONField
from datetime import date
import shortuuid

from apps.user.models import User


class EducationalInstitution(models.Model):
    name = models.CharField(
        max_length=100, verbose_name='Nombre de la institución educacional')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Instituciones Educacionales'
        verbose_name = 'institución educacional'


class Course(models.Model):
    name = models.CharField(
        max_length=100, verbose_name='Nombre del curso')
    code = models.CharField(
        max_length=100, null=True,
        blank=True, verbose_name='Código del curso')
    institution = models.ForeignKey(
        EducationalInstitution,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name='Institución educacional'
    )

    def __str__(self):
        return f'{self.name} ({self.institution})'

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['name', 'institution'],
                name='unique_course_name_per_institution'
            )
        ]
        verbose_name_plural = 'Cursos'
        verbose_name = 'curso'


class Fieldtrip(models.Model):
    name = models.CharField(
        max_length=255, verbose_name='Nombre de la salida a campo')
    invitation_code = models.CharField(
        unique=True,
        max_length=22,
        verbose_name="Código de invitación a la salida a campo",
        default=shortuuid.uuid
    )
    start_date = models.DateField(verbose_name='Fecha de inicio')
    end_date = models.DateField(verbose_name='Fecha de término')
    teacher = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, verbose_name='Profesor a cargo')
    course = models.ForeignKey(
        Course, null=True, blank=True, on_delete=models.SET_NULL, verbose_name='Curso')
    sector = models.CharField(
        max_length=255, verbose_name='Sector al que se irá')
    cached_checklist = JSONField(
        default=list, blank=True, verbose_name="Checklist guardado al momento de la creación"
    )
    active = models.BooleanField(
        default=True
    )

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError({'end_date': _(
                'La fecha de término no puede ser anterior a la fecha de inicio.')})

    def save(self, *args, **kwargs):
        self.cached_checklist = list(Checklist.objects.values_list('item', flat=True))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name}, Fechas: {str(self.start_date)}/{str(self.end_date)}, Profesor a cargo: {str(self.teacher)}"

    class Meta:
        verbose_name_plural = 'Salidas a Campo'
        verbose_name = 'salida a campo'


class FieldtripAttendee(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name='Usuario')
    fieldtrip = models.ForeignKey(Fieldtrip, on_delete=models.CASCADE)
    signup_complete = models.BooleanField(
        blank=True,
        default=False,
        verbose_name="Status de registro en salida",
    )
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Usuario: {self.user}, Fieldtrip: {self.fieldtrip}'

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'fieldtrip'], name='unique_fieldtrip_attendee'
            )
        ]
        verbose_name_plural = 'Asistentes a Salida a Campo'
        verbose_name = 'asistente a salida'


CHECKLIST_CHOICES = [
    (1, 'Declaro conocer el Protocolo de Seguridad en Terreno.'),
    (2, 'Declaro conocer las bases del Seguro Escolar que me protege en caso de accidente.'),
    (3, 'Declaro querer usar el Seguro Escolar en caso de accidente durante la práctica de terreno.'),
    (4, 'Renuncio al Seguro Escolar, y solicito que me trasladen a la institución médica especificada anteriormente en caso de sufrir un accidente.'),
    (5, 'Declaro que estoy en condiciones de salud aptas para asistir a la salida de terreno.'),
    (6, 'Declaro que no padezco COVID-19.')
]


class Checklist(models.Model):
    item = models.CharField(max_length=200, unique=True, verbose_name='Ítem')

    def __str__(self):
        return self.item

    class Meta:
        verbose_name_plural = 'Checklist'
        verbose_name = 'ítem de checklist'


class ChecklistStatus(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, verbose_name='Usuario')
    fieldtrip = models.ForeignKey(Fieldtrip, on_delete=models.CASCADE)
    item = models.ForeignKey(
        Checklist, on_delete=models.SET_NULL, null=True, verbose_name='Ítem')
    cached_item = models.CharField(
        max_length=200, verbose_name='Valor original del ítem', blank=True)
    status = models.BooleanField(verbose_name='Estatus')

    def save(self, *args, **kwargs):
        if not self.cached_item and self.item:
            self.cached_item = self.item.item
        super().save(*args, **kwargs)

    def __str__(self):
        return f'Usuario: {self.user}, Fieldtrip: {self.fieldtrip}, Ítem: {self.item}'

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'fieldtrip', 'item'], name='unique_checklist_status')
        ]
        verbose_name_plural = 'Estatus de ítem en Checklist'
        verbose_name = 'estatus de ítem en checklist'
