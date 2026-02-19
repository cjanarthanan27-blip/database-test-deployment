from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.water_tracker.backend.urls')),
    re_path(r'^(?!admin|api|static).*$', TemplateView.as_view(template_name='index.html')),
]
