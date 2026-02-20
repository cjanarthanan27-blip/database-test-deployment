from django.db import models
from django.contrib.auth.models import AbstractUser


# 1. Users Model (Authentication & Authorization)
class User(AbstractUser):
    ROLE_CHOICES = (
        ("Admin", "Admin"),
        ("Data_Entry", "Data Entry"),
        ("Viewer", "Viewer"),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="Viewer")

    class Meta:
        db_table = "users"


# 2. Master Models (Reference Data)
class MasterLocation(models.Model):
    location_name = models.CharField(max_length=100, unique=True)
    location_type = models.CharField(max_length=50, default="Unloading")
    address = models.TextField(blank=True, null=True)  # Added based on frontend usage
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "master_locations"

    def __str__(self):
        return self.location_name


class MasterSource(models.Model):
    SOURCE_TYPE_CHOICES = (
        ("Internal_Bore", "Internal Bore"),
        ("Internal_Well", "Internal Well"),
        ("Pipeline", "Pipeline"),
        ("Vendor", "Vendor"),
    )
    source_name = models.CharField(max_length=100, unique=True)
    source_type = models.CharField(max_length=50, choices=SOURCE_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "master_sources"

    def __str__(self):
        return self.source_name


class MasterInternalVehicle(models.Model):
    vehicle_name = models.CharField(max_length=50, unique=True)
    capacity_liters = models.IntegerField()

    class Meta:
        db_table = "master_internal_vehicles"

    def __str__(self):
        return self.vehicle_name


# Note: MasterVendorVehicle was in original models.py but seemingly unused in main logic?
# It was defined but RateHistoryVendor used vehicle_capacity directly.
# I will include it for completeness as it was in the models file.
class MasterVendorVehicle(models.Model):
    vendor = models.ForeignKey(
        MasterSource, on_delete=models.CASCADE, related_name="vehicles"
    )
    vehicle_name = models.CharField(max_length=100)
    capacity_liters = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "master_vendor_vehicles"


# 3. Rate History Models (Cost Management)
class RateHistoryInternalVehicle(models.Model):
    vehicle = models.ForeignKey(
        MasterInternalVehicle, on_delete=models.CASCADE, null=True, blank=True
    )
    loading_location = models.ForeignKey(
        MasterLocation,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="internal_vehicle_rates",
    )
    vehicle_name = models.CharField(
        max_length=100, blank=True, null=True
    )  # Snapshot/Backup
    capacity_liters = models.IntegerField(blank=True, null=True)
    cost_per_load = models.DecimalField(max_digits=10, decimal_places=2)
    effective_date = models.DateField()
    calculated_cost_per_liter = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True
    )
    calculated_cost_per_kl = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True
    )

    class Meta:
        db_table = "rate_history_internal_vehicles"


class RateHistoryVendor(models.Model):
    WATER_TYPE_CHOICES = (
        ("Drinking Water", "Drinking Water"),
        ("Normal Water (Salt)", "Normal Water (Salt)"),
    )
    COST_TYPE_CHOICES = (
        ("Per_Load", "Per Load"),
        ("Per_Liter", "Per Liter"),
    )
    source = models.ForeignKey(MasterSource, on_delete=models.CASCADE)
    water_type = models.CharField(max_length=50, choices=WATER_TYPE_CHOICES)
    cost_type = models.CharField(max_length=20, choices=COST_TYPE_CHOICES)
    rate_value = models.DecimalField(max_digits=10, decimal_places=2)
    vehicle_capacity = models.IntegerField(null=True, blank=True)
    effective_date = models.DateField()
    calculated_cost_per_liter = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True
    )
    calculated_cost_per_kl = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True
    )

    class Meta:
        db_table = "rate_history_vendors"


class RateHistoryPipeline(models.Model):
    source = models.ForeignKey(MasterSource, on_delete=models.CASCADE)
    cost_per_liter = models.DecimalField(max_digits=10, decimal_places=4)
    effective_date = models.DateField()

    class Meta:
        db_table = "rate_history_pipeline"


# 4. Transaction Model (Daily Entries)
class WaterEntry(models.Model):
    SHIFT_CHOICES = (
        ("Morning", "Morning"),
        ("Evening", "Evening"),
        ("Night", "Night"),
    )
    WATER_TYPE_CHOICES = (
        ("Drinking Water", "Drinking Water"),
        ("Normal Water (Salt)", "Normal Water (Salt)"),
    )

    entry_date = models.DateField()
    source = models.ForeignKey(
        MasterSource, on_delete=models.SET_NULL, null=True, blank=True
    )
    loading_location = models.ForeignKey(
        MasterLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="loaded_entries",
    )
    unloading_location = models.ForeignKey(
        MasterLocation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="unloaded_entries",
    )
    shift = models.CharField(
        max_length=20, choices=SHIFT_CHOICES, null=True, blank=True
    )
    water_type = models.CharField(max_length=50, null=True, blank=True)

    vehicle = models.ForeignKey(
        MasterInternalVehicle, on_delete=models.SET_NULL, null=True, blank=True
    )
    load_count = models.IntegerField(null=True, blank=True)
    meter_reading_current = models.IntegerField(null=True, blank=True)
    meter_reading_previous = models.IntegerField(null=True, blank=True)
    manual_capacity_liters = models.IntegerField(null=True, blank=True)

    total_quantity_liters = models.DecimalField(max_digits=12, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)

    snapshot_cost_per_liter = models.DecimalField(
        max_digits=10, decimal_places=4, null=True, blank=True
    )
    snapshot_cost_per_kl = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    snapshot_paise_per_liter = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    comments = models.CharField(max_length=300, blank=True, null=True)

    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "water_entries"


# 5. Yield Tracking Models
class YieldLocation(models.Model):
    YIELD_TYPE_CHOICES = (
        ("Borewell", "Borewell"),
        ("Well", "Well"),
    )
    location_name = models.CharField(max_length=100, unique=True)
    yield_type = models.CharField(max_length=20, choices=YIELD_TYPE_CHOICES)
    is_manual_yield = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "yield_locations"

    def __str__(self):
        return f"{self.location_name} ({self.yield_type})"


class YieldEntry(models.Model):
    date = models.DateField()
    location = models.ForeignKey(YieldLocation, on_delete=models.CASCADE, related_name="yield_entries")
    current_reading = models.IntegerField()
    previous_reading = models.IntegerField(null=True, blank=True)
    yield_liters = models.IntegerField(null=True, blank=True)
    comments = models.TextField(max_length=300, null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "yield_entries"
        ordering = ['-date', '-created_at']


# 6. Consumption Tracking Models
class ConsumptionCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    student_count = models.IntegerField(default=0, null=True, blank=True)
    is_excluded = models.BooleanField(default=False)
    exclude_value = models.IntegerField(default=0, null=True, blank=True)
    second_count = models.IntegerField(default=0, null=True, blank=True)
    has_student_count = models.BooleanField(default=True)

    class Meta:
        db_table = "consumption_categories"

    def __str__(self):
        return self.name


class ConsumptionLocation(models.Model):
    CONSUMPTION_TYPE_CHOICES = (
        ("Normal", "Normal Water Consumption"),
        ("Drinking", "Drinking Water Consumption"),
    )
    location_name = models.CharField(max_length=100)
    consumption_type = models.CharField(max_length=20, choices=CONSUMPTION_TYPE_CHOICES)
    category = models.ForeignKey(
        ConsumptionCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="locations",
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "consumption_locations"
        unique_together = ("location_name", "consumption_type")

    def __str__(self):
        return f"{self.location_name} ({self.consumption_type})"


class ConsumptionEntry(models.Model):
    date = models.DateField()
    location = models.ForeignKey(ConsumptionLocation, on_delete=models.CASCADE, related_name="consumption_entries")
    current_reading = models.IntegerField()
    previous_reading = models.IntegerField(null=True, blank=True)
    consumption_liters = models.IntegerField(null=True, blank=True)
    comments = models.TextField(max_length=300, null=True, blank=True)
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "consumption_entries"
        ordering = ['-date', '-created_at']


class GeneralWaterRate(models.Model):
    date = models.DateField()
    normal_water_rate = models.DecimalField(max_digits=10, decimal_places=4)
    drinking_water_rate = models.DecimalField(max_digits=10, decimal_places=4)
    effective_date = models.DateField()
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "general_water_rates"
        ordering = ['-effective_date', '-date']

    def __str__(self):
        return f"Rates from {self.effective_date} (Entered: {self.date})"
