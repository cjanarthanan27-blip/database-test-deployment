from django.apps import AppConfig


class WaterTrackerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.water_tracker.backend'
    label = 'water_tracker'
