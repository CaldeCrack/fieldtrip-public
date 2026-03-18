# Fieldtrip

## Descripción

Aplicación para organizar las salidas a terreno para el departamento de Geología de la FCFM (posiblemente extendiendo la aplicación a otras facultades/universidades).

## Instalación

### Frontend

- Moverse a la carpeta `/frontend/fieldtrip` y ejecutar `npm i`.
- Con los paquetes instalados ejecutar `npm run deploy:web`, esto compilará el frontend y lo pondrá automáticamente en una carpeta en el backend.

### Backend

- En el backend crear un ambiente virtual e instalar los paquetes listados en el archivo `requirements.txt`.
- Ejecutar los siguientes comandos (con el ambiente virtual activado):

  ```sh
  python manage.py makemigrations
  python manage.py migrate
  python manage.py collecstatic --noinput # toma el frontend compilado para usarlo en el despliegue
  gunicorn fieldtrip.wsgi --bind 0.0.0.0:8000 & # desplegar aplicación
  ```
