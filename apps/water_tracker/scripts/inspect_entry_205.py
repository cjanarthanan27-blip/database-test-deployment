import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'water_tracker_project.settings')
django.setup()

from core.models import WaterEntry

try:
    e = WaterEntry.objects.get(id=205)
    print(f"ID: {e.id}")
    print(f"Date: {e.entry_date}")
    print(f"Water Type: '{e.water_type}'")
    print(f"Loading Location: '{e.loading_location.location_name}' (ID: {e.loading_location.id})")
    if e.unloading_location:
         print(f"Unloading Location: '{e.unloading_location.location_name}' (ID: {e.unloading_location.id})")
    else:
         print("Unloading Location: None")
    
    if e.source:
        print(f"Source: '{e.source.source_name}' Type: '{e.source.source_type}'")
    else:
        print("Source: None")

    print(f"Quantity: {e.total_quantity_liters}")
    print(f"Cost: {e.total_cost}")

    # Check filter logic manually
    from datetime import date
    today = date.today()
    start_of_month = today.replace(day=1)

    matches_date = e.entry_date >= start_of_month
    matches_type = e.water_type == 'Normal Water (Salt)'
    matches_loc = 'Varahi' in e.loading_location.location_name
    
    if e.source:
        not_pipeline = e.source.source_type != 'Pipeline'
    else:
        not_pipeline = True # If source is None, exclude(source__source_type='Pipeline') keeps it? 
        # Wait, exclude(source__source_type='Pipeline') excludes rows where source_type IS 'Pipeline'. If source is NULL, it should keep it.
    
    print(f"Matches Date: {matches_date}")
    print(f"Matches Type: {matches_type}")
    print(f"Matches Location: {matches_loc}")
    print(f"Not Pipeline: {not_pipeline}")

except Exception as ex:
    print(f"Error: {ex}")
