from datetime import datetime
import locale

try:
    locale.setlocale(locale.LC_TIME, "es_CL.UTF-8")
except locale.Error:
    try:
        locale.setlocale(locale.LC_TIME, "es_ES.UTF-8")
    except locale.Error:
        try:
            locale.setlocale(locale.LC_TIME, "es")
        except locale.Error:
            locale.setlocale(locale.LC_TIME, '')


def remove_id_keys(dict):
    return {key: value for key, value in dict.items() if not key.endswith("_id")}


def format_date(date):
    formatted_date = date.strftime("%d-%m-%Y")
    return formatted_date.capitalize()
