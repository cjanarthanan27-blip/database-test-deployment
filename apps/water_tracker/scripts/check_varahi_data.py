import os
import django
from datetime import date
from django.db.models import Sum

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'water_tracker_project.settings')
django.setup()

from core.models import WaterEntry

today = date.today()
start_of_month = today.replace(day=1)
print(f"Checking entries from: {start_of_month}")

entries = WaterEntry.objects.filter(
    entry_date__gte=start_of_month,
    water_type='Normal Water (Salt)',
    loading_location__location_name__icontains='Varahi'
).exclude(source__source_type='Pipeline')

print(f"Count: {entries.count()}")

for e in entries:
    print(f"Date: {e.entry_date}, ID: {e.id}, Loc: {e.loading_location.location_name}, Qty: {e.total_quantity_liters}")
