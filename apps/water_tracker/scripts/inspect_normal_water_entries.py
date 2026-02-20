import os
import django
from django.conf import settings
from django.db.models import Count, Sum

# Setup Django environment
import sys
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'water_tracker_project.settings')
django.setup()

from core.models import WaterEntry

def inspect_data():
    with open('inspection_result.txt', 'w', encoding='utf-8') as f:
        f.write("Inspecting Normal Water (Salt) Entries...\n")
        
        # Filter for Normal Water
        entries = WaterEntry.objects.filter(water_type='Normal Water (Salt)')
        
        f.write(f"Total Normal Water entries: {entries.count()}\n")
        
        if entries.count() == 0:
            f.write("No Normal Water entries found.\n")
            return

        # Check distribution of total_quantity_liters and load_count
        distribution = entries.values('total_quantity_liters', 'load_count').annotate(
            count=Count('id'),
            total_cost=Sum('total_cost')
        ).order_by('-count')
        
        f.write("\nQuantity Distribution:\n")
        f.write(f"{'Quantity (L)':<15} | {'Load Count':<10} | {'Entries':<10} | {'Total Cost':<15}\n")
        f.write("-" * 60 + "\n")
        for item in distribution:
            f.write(f"{item['total_quantity_liters']:<15} | {item['load_count']:<10} | {item['count']:<10} | {item['total_cost']:<15}\n")

        # Inspect a few sample entries to see vehicle and location info
        f.write("\nSample Entries:\n")
        for entry in entries[:5]:
            f.write(f"ID: {entry.id}, Date: {entry.entry_date}, "
                  f"Loc: {entry.unloading_location}, "
                  f"Qty: {entry.total_quantity_liters}, Cost: {entry.total_cost}, "
                  f"Vehicle: {entry.vehicle}\n")

if __name__ == '__main__':
    inspect_data()
