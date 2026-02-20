import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rathinamHR.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
try:
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
        print("Superuser 'admin' created successfully.")
    else:
        u = User.objects.get(username='admin')
        u.set_password('admin123')
        u.is_superuser = True
        u.is_staff = True
        u.save()
        print("Superuser 'admin' updated successfully.")
except Exception as e:
    print(f"Error creating/updating superuser: {e}")
