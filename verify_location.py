import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rathinamHR.settings')
django.setup()

from apps.water_tracker.backend.models import MasterLocation

def verify_location():
    loc = MasterLocation.objects.filter(location_name__icontains="Muthu Nagar").first()
    if loc:
        print(f"Found Location: ID={loc.id}, Name='{loc.location_name}', Type={loc.location_type}")
    else:
        print("Location 'Muthu Nagar' not found in MasterLocation.")

if __name__ == "__main__":
    verify_location()
