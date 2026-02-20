import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'water_tracker_project.settings')
django.setup()

from core.models import MasterLocation

locations = MasterLocation.objects.filter(location_name__icontains='Varahi')
print(f"Found {locations.count()} locations matching 'Varahi':")
for loc in locations:
    print(f"ID: {loc.id}, Name: {loc.location_name}, Type: {loc.location_type}, Active: {loc.is_active}")

all_locs = MasterLocation.objects.all().values('location_name', 'location_type')
print(f"\nTotal locations: {len(all_locs)}")
print("First 5 locations:")
for l in list(all_locs)[:5]:
    print(l)
