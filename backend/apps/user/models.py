from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

from .managers import UserManager


DIET_CHOICES = [
    (1, 'Lacto-vegetariana'),
    (2, 'Ovo-vegetariana'),
    (3, 'Lacto-ovo-vegetariana'),
    (4, 'Pescetariana'),
    (5, 'Vegana'),
    (6, 'Omnívora'),
    (7, 'Vegetariana parcial (detallar en el siguiente campo)'),
    (8, 'Otra (detallar en el siguiente campo)')
]


class Diet(models.Model):
    type = models.CharField(max_length=100, verbose_name='Tipo')

    def __str__(self):
        return self.type

    class Meta:
        verbose_name_plural = 'Dietas'
        verbose_name = 'dieta'


class Allergy(models.Model):
    ALLERGY_CATEGORIES = [(1, "Sustancias"), (2, "Medicamentos")]

    type = models.CharField(
        max_length=30, unique=True, verbose_name="Tipo"
    )
    category = models.IntegerField(
        choices=ALLERGY_CATEGORIES,
        verbose_name="Categoría",
    )

    def __str__(self):
        return f"Tipo: {self.type}, Categoría: {dict(self.ALLERGY_CATEGORIES)[self.category]}"

    class Meta:
        verbose_name_plural = "Alergias"
        verbose_name = "alergia"


class MedicalInstitution(models.Model):
    name = models.CharField(
        max_length=100, verbose_name='Nombre de la institución médica')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Instituciones Médicas'
        verbose_name = 'institución médica'


class User(AbstractUser):
    BLOOD_TYPES = [
        (1, "A"),
        (2, "B"),
        (3, "AB"),
        (4, "O"),
    ]
    ROLE_CHOICES = [
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('admin', 'Admin'),
    ]
    def validate_emergency_number(value):
        if len(str(value)) != 9:
            raise ValidationError("El número debe tener exactamente 9 dígitos.")

    username = None
    first_name = None
    last_name = None
    email = models.EmailField(_('email address'), unique=True)
    names = models.CharField(max_length=30, verbose_name='Nombres')
    surnames = models.CharField(max_length=30, verbose_name='Apellidos')
    registration_number = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Número de matrícula"
    )
    RUT = models.CharField(
        max_length=12,
        help_text='Ingrese su RUT en el siguiente formato: 12.345.678-9',
        validators=[
            RegexValidator(
                regex=r'^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$',
                message='El RUT debe tener el formato 12.345.678-9.'
            )
        ],
        verbose_name='RUT'
    )
    emergency_contact = models.CharField(
        null=True, max_length=30, verbose_name='Contacto de emergencia')
    emergency_number = models.IntegerField(
        null=True, validators=[validate_emergency_number],
        verbose_name='Número de emergencia'
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, verbose_name="Role")
    has_previous_experience = models.BooleanField(
        verbose_name='¿Tiene experiencia previa en salidas a campo?',
        default=True)
    diet_type = models.ForeignKey(
        Diet,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name='Tipo de alimentación'
    )
    diet_info = models.CharField(
        max_length=100,
        default='',
        blank=True,
        verbose_name='Información extra de alimentación',
        help_text='Ejemplo: "No como azúcar"'
    )
    blood_type = models.IntegerField(
        choices=BLOOD_TYPES,
        null=True,
        verbose_name="Tipo sanguíneo",
    )
    allergies = models.ManyToManyField(
        Allergy, related_name="users", blank=True)
    preferred_medical_institution = models.ForeignKey(
        MedicalInstitution,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        verbose_name='Institución médica preferida'
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["names", "surnames", "RUT"]

    objects = UserManager()

    def __str__(self):
        return self.email

    def clean(self):
        # Validar que se proporcione información adicional si la dieta es "Otra"
        if self.diet_type and self.diet_type.type == 'Otra (detallar en el siguiente campo)' and not self.diet_info.strip():
            raise ValidationError(
                {'diet_info': _('Debe completar este campo si selecciona "Otra".')})

        super(User, self).clean()

    class Meta:
        verbose_name_plural = 'Usuarios'
        verbose_name = 'usuario'
