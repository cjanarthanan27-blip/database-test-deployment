from rest_framework import serializers
from .models import (
    User, MasterLocation, MasterSource, MasterInternalVehicle, MasterVendorVehicle,
    RateHistoryInternalVehicle, RateHistoryVendor, RateHistoryPipeline, WaterEntry,
    YieldLocation, YieldEntry, ConsumptionLocation, ConsumptionEntry,
    ConsumptionCategory
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'is_active', 'last_login']

class MasterLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterLocation
        fields = '__all__'
        ordering = ['sort_order', 'location_name']

class MasterSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterSource
        fields = '__all__'

class MasterInternalVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterInternalVehicle
        fields = '__all__'

class MasterVendorVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = MasterVendorVehicle
        fields = '__all__'

class RateHistoryInternalVehicleSerializer(serializers.ModelSerializer):
    loading_location_name = serializers.CharField(source='loading_location.location_name', read_only=True)
    
    class Meta:
        model = RateHistoryInternalVehicle
        fields = '__all__'

class RateHistoryVendorSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source.source_name', read_only=True)
    
    class Meta:
        model = RateHistoryVendor
        fields = '__all__'

class RateHistoryPipelineSerializer(serializers.ModelSerializer):
    class Meta:
        model = RateHistoryPipeline
        fields = '__all__'

class WaterEntrySerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source='source.source_name', read_only=True, allow_null=True)
    loading_location_name = serializers.CharField(source='loading_location.location_name', read_only=True, allow_null=True)
    unloading_location_name = serializers.CharField(source='unloading_location.location_name', read_only=True, allow_null=True)
    vehicle_name = serializers.CharField(source='vehicle.vehicle_name', read_only=True, allow_null=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)

    class Meta:
        model = WaterEntry
        fields = '__all__'


class YieldLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = YieldLocation
        fields = '__all__'
        ordering = ['sort_order', 'location_name']


class YieldEntrySerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.location_name', read_only=True)
    yield_type = serializers.CharField(source='location.yield_type', read_only=True)
    is_manual_yield = serializers.BooleanField(source='location.is_manual_yield', read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)


    class Meta:
        model = YieldEntry
        fields = '__all__'


class ConsumptionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsumptionCategory
        fields = "__all__"


class ConsumptionLocationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = ConsumptionLocation
        fields = "__all__"
        ordering = ['sort_order', 'location_name']


class ConsumptionEntrySerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(
        source="location.location_name", read_only=True
    )
    consumption_type = serializers.CharField(
        source="location.consumption_type", read_only=True
    )
    category_name = serializers.CharField(
        source="location.category.name", read_only=True, allow_null=True
    )
    created_by_username = serializers.CharField(
        source="created_by.username", read_only=True, allow_null=True
    )

    class Meta:
        model = ConsumptionEntry
        fields = "__all__"
