import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'water_tracker_project.settings')
django.setup()

from core.models import WaterEntry, MasterLocation, MasterInternalVehicle

try:
    bannari_loc = MasterLocation.objects.get(location_name__icontains='Bannari', location_type='Loading')
    # Use any unloading location
    unloading_loc = MasterLocation.objects.filter(location_type='Unloading').first()
    # Use any vehicle
    vehicle = MasterInternalVehicle.objects.first()

    entry = WaterEntry.objects.create(
        entry_date=date.today(),
        water_type='Normal Water (Salt)',
        loading_location=bannari_loc,
        unloading_location=unloading_loc,
        vehicle=vehicle,
        total_quantity_liters=12000,
        load_count=1,
        total_cost=500
    )
    print(f"Created test entry: ID {entry.id}")

except Exception as e:
    print(f"Error: {e}")
