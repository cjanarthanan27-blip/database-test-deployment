import os
import sys

# Setup Django environment BEFORE other imports
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'water_tracker_project.settings')

import django
django.setup()

import json
from datetime import date
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from core.views import dashboard_stats
from core.models import WaterEntry

def verify_dashboard_stats():
    print("Verifying Dashboard Stats for Normal Water Breakdown...")
    
    # Create a dummy request
    factory = APIRequestFactory()
    request = factory.get('/dashboard-stats')
    
    # Create/Get a user for authentication
    User = get_user_model()
    user, created = User.objects.get_or_create(username='test_admin', defaults={'email': 'test@example.com'})
    if created:
        user.set_password('testpass')
        user.save()
        
    force_authenticate(request, user=user)

    # Execute the view
    response = dashboard_stats(request)
    
    if response.status_code == 200:
        data = response.data
        print("\nAPI Response Status: 200 OK")
        
        if 'normal_water_breakdown' in data:
            print("\n'normal_water_breakdown' key found in response.")
            breakdown = data['normal_water_breakdown']
            
            print(f"\nBreakdown Data ({len(breakdown)} locations found):")
            print(f"{'Location':<20} | {'12KL':<5} | {'6KL':<5} | {'Total Liters':<15} | {'Total Amount':<15}")
            print("-" * 75)
            
            for item in breakdown:
                print(f"{item['location']:<20} | {item['count_12kl']:<5} | {item['count_6kl']:<5} | {item['total_liters']:<15} | {item['total_amount']:<15}")
                
            # Basic Validation
            if len(breakdown) > 0:
                print("\nVALIDATION SUCCESS: Data is being returned.")
            else:
                print("\nWARNING: No breakdown data returned (might be expected if no entries for this month).")
        else:
            print("\nERROR: 'normal_water_breakdown' key NOT found in response.")
    else:
        print(f"\nERROR: API call failed with status code {response.status_code}")
        print(response.data)

if __name__ == '__main__':
    verify_dashboard_stats()
