import requests
import json

BASE_URL = "http://localhost:8000/api/reports/"

def test_report(endpoint, params=None):
    print(f"\nTesting {endpoint}...")
    try:
        response = requests.get(BASE_URL + endpoint, params=params)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Summary keys:", list(data.get('summary', {}).keys()))
            print("Breakdown keys:", list(data.get('summary', {}).get('breakdown', {}).keys()))
            if 'breakdown' in data.get('summary', {}):
                print("Breakdown data sample:", data['summary']['breakdown'].get('Corporation Water'))
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_report("yearly-trend", {"year": 2024})
    test_report("vendor-usage", {"start_date": "2024-01-01", "end_date": "2024-12-31"})
