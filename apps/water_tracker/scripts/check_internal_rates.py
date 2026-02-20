import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'water_tracker_project.settings')
django.setup()

from core.models import RateHistoryInternalVehicle, MasterInternalVehicle, MasterSource

def check_internal_data():
    print("--- Internal Vehicles ---")
    vehicles = MasterInternalVehicle.objects.all()
    for v in vehicles:
        print(f"ID: {v.id}, Name: {v.vehicle_name}, Capacity: {v.capacity_liters}")

    print("\n--- Internal Sources ---")
    sources = MasterSource.objects.filter(source_type__in=['Internal_Bore', 'Internal_Well'])
    for s in sources:
        print(f"ID: {s.id}, Name: {s.source_name}, Type: {s.source_type}")

    print("\n--- Internal Rates ---")
    rates = RateHistoryInternalVehicle.objects.all()
    if not rates.exists():
        print("NO INTERNAL RATES FOUND!")
    for r in rates:
        print(f"Vehicle: {r.vehicle.vehicle_name if r.vehicle else 'None'}, Cost Per Load: {r.cost_per_load}, Effective: {r.effective_date}")

if __name__ == "__main__":
    check_internal_data()
