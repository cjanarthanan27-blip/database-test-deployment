import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'water_tracker_project.settings')
django.setup()

from core.models import MasterLocation, MasterSource

print("Checking Locations for Varahi:")
locs = MasterLocation.objects.filter(location_name__icontains='Varahi')
for l in locs:
    print(f"Location: {l.id}, {l.location_name}, {l.location_type}")

print("\nChecking Sources:")
srcs = MasterSource.objects.filter(source_name__icontains='Muthu')
for s in srcs:
    print(f"Source: {s.id}, {s.source_name}, {s.source_type}")
