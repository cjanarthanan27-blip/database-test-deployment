import requests
import json

try:
    response = requests.get('http://127.0.0.1:8000/api/dashboard-stats')
    if response.status_code == 200:
        data = response.json()
        print("Keys in response:", data.keys())
        if 'varahi_water_breakdown' in data:
            print("varahi_water_breakdown:", json.dumps(data['varahi_water_breakdown'], indent=2))
        else:
            print("varahi_water_breakdown NOT found in response")
    else:
        print(f"Failed: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
