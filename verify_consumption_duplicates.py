import os
import django
import sys

# Setup Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rathinamHR.settings')
django.setup()

from apps.water_tracker.backend.models import ConsumptionLocation, ConsumptionCategory

def test_shared_names():
    print("Starting verification of shared location names...")
    
    # Create or get a category
    cat, _ = ConsumptionCategory.objects.get_or_create(name="Test Category")
    
    location_name = "Duplicate Location Test"
    
    # Clean up any existing test data
    ConsumptionLocation.objects.filter(location_name=location_name).delete()
    
    try:
        # 1. Create Normal Consumption Location
        loc1 = ConsumptionLocation.objects.create(
            location_name=location_name,
            consumption_type="Normal",
            category=cat
        )
        print(f"Successfully created: {loc1}")
        
        # 2. Create Drinking Consumption Location with SAME name
        loc2 = ConsumptionLocation.objects.create(
            location_name=location_name,
            consumption_type="Drinking",
            category=cat
        )
        print(f"Successfully created: {loc2}")
        
        print("\nSUCCESS: Both locations with the same name were created successfully across different types.")
        
        # 3. Verify that creating same name in same type still fails
        try:
            ConsumptionLocation.objects.create(
                location_name=location_name,
                consumption_type="Normal",
                category=cat
            )
            print("FAILURE: System allowed creating duplicate name in the SAME type.")
        except Exception as e:
            print(f"\nExpected failure occurred for same-type duplicate: {e}")
            
    except Exception as e:
        print(f"FAILURE: An unexpected error occurred: {e}")
    finally:
        # Clean up
        ConsumptionLocation.objects.filter(location_name=location_name).delete()
        print("\nCleanup completed.")

if __name__ == "__main__":
    test_shared_names()
