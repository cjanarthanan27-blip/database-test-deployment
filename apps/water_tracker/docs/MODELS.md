# Database Models Documentation

Complete database schema for the Water Purchase Tracker application.

## Entity Relationship Overview

```
User (1) ─────> (N) WaterEntry
                      │
                      ├── (N) ──> (1) MasterLocation (loading)
                      ├── (N) ──> (1) MasterLocation (unloading)
                      ├── (N) ──> (1) MasterSource
                      └── (N) ──> (1) MasterInternalVehicle

MasterInternalVehicle (1) ─────> (N) RateHistoryInternalVehicle
MasterSource (1) ─────> (N) RateHistoryVendor
MasterSource (1) ─────> (N) RateHistoryPipeline
MasterSource (1) ─────> (N) MasterVendorVehicle
```

---

## User Model

**Table**: `users`

Custom user model extending Django's `AbstractUser`.

### Fields

| Field        | Type        | Constraints      | Description             |
| ------------ | ----------- | ---------------- | ----------------------- |
| id           | Integer     | PK, Auto         | Primary key             |
| username     | String(150) | Unique, Not Null | Login username          |
| password     | String(128) | Not Null         | Hashed password         |
| email        | String(254) | Optional         | Email address           |
| first_name   | String(150) | Optional         | First name              |
| last_name    | String(150) | Optional         | Last name               |
| role         | String(20)  | Choices          | Admin/Data_Entry/Viewer |
| is_active    | Boolean     | Default True     | Account status          |
| is_staff     | Boolean     | Default False    | Django admin access     |
| is_superuser | Boolean     | Default False    | Superuser status        |
| last_login   | DateTime    | Optional         | Last login timestamp    |
| date_joined  | DateTime    | Auto Now Add     | Registration date       |

### Role Choices
- `Admin` - Full access to all features
- `Data_Entry` - Can create/edit entries
- `Viewer` - Read-only access

---

## MasterLocation

**Table**: `master_locations`

Physical locations (loading/unloading sites).

### Fields

| Field         | Type        | Constraints  | Description            |
| ------------- | ----------- | ------------ | ---------------------- |
| id            | Integer     | PK, Auto     | Primary key            |
| location_name | String(100) | Not Null     | Location name          |
| location_type | String(50)  | Optional     | Loading/Unloading/Both |
| address       | Text        | Optional     | Physical address       |
| is_active     | Boolean     | Default True | Active status          |
| created_at    | DateTime    | Auto Now Add | Creation timestamp     |

**Indexes**: `location_name`

---

## MasterSource

**Table**: `master_sources`

Water sources (vendors, pipelines).

### Fields

| Field          | Type        | Constraints  | Description        |
| -------------- | ----------- | ------------ | ------------------ |
| id             | Integer     | PK, Auto     | Primary key        |
| source_name    | String(100) | Not Null     | Source name        |
| source_type    | String(50)  | Choices      | Vendor/Pipeline    |
| contact_person | String(100) | Optional     | Contact name       |
| contact_phone  | String(20)  | Optional     | Phone number       |
| is_active      | Boolean     | Default True | Active status      |
| created_at     | DateTime    | Auto Now Add | Creation timestamp |

### Source Type Choices
- `Vendor` - External vendor supply
- `Pipeline` - Municipal/company pipeline

**Indexes**: `source_name`, `source_type`

---

## MasterInternalVehicle

**Table**: `master_internal_vehicles`

Company-owned water tanker vehicles.

### Fields

| Field           | Type        | Constraints  | Description         |
| --------------- | ----------- | ------------ | ------------------- |
| id              | Integer     | PK, Auto     | Primary key         |
| vehicle_name    | String(100) | Not Null     | Vehicle identifier  |
| vehicle_number  | String(50)  | Optional     | Registration number |
| capacity_liters | Integer     | Optional     | Tank capacity       |
| created_at      | DateTime    | Auto Now Add | Creation timestamp  |

**Indexes**: `vehicle_name`

---

## MasterVendorVehicle

**Table**: `master_vendor_vehicles`

Vendor-owned water tanker vehicles.

### Fields

| Field           | Type       | Constraints        | Description         |
| --------------- | ---------- | ------------------ | ------------------- |
| id              | Integer    | PK, Auto           | Primary key         |
| source          | Integer    | FK to MasterSource | Vendor reference    |
| vehicle_number  | String(50) | Not Null           | Registration number |
| capacity_liters | Integer    | Optional           | Tank capacity       |
| created_at      | DateTime   | Auto Now Add       | Creation timestamp  |

**Foreign Keys**:
- `source` → `MasterSource.id` (CASCADE)

---

## RateHistoryInternalVehicle

**Table**: `rate_history_internal_vehicles`

Historical rate tracking for company vehicles.

### Fields

| Field          | Type          | Constraints                 | Description         |
| -------------- | ------------- | --------------------------- | ------------------- |
| id             | Integer       | PK, Auto                    | Primary key         |
| vehicle        | Integer       | FK to MasterInternalVehicle | Vehicle reference   |
| effective_date | Date          | Not Null                    | Rate start date     |
| cost_per_load  | Decimal(10,2) | Optional                    | Fixed cost per load |
| notes          | Text          | Optional                    | Additional notes    |
| created_at     | DateTime      | Auto Now Add                | Creation timestamp  |

**Foreign Keys**:
- `vehicle` → `MasterInternalVehicle.id` (CASCADE)

**Indexes**: `effective_date` (DESC)

---

## RateHistoryVendor

**Table**: `rate_history_vendors`

Historical rate tracking for vendors.

### Fields

| Field                  | Type          | Constraints        | Description              |
| ---------------------- | ------------- | ------------------ | ------------------------ |
| id                     | Integer       | PK, Auto           | Primary key              |
| source                 | Integer       | FK to MasterSource | Vendor reference         |
| effective_date         | Date          | Not Null           | Rate start date          |
| cost_type              | String(50)    | Choices            | Per_Liter/Per_Load       |
| rate_value             | Decimal(10,2) | Not Null           | Rate amount              |
| vehicle_capacity       | Integer       | Optional           | Default vehicle capacity |
| calculated_cost_per_kl | Decimal(10,2) | Optional           | Calculated KL rate       |
| notes                  | Text          | Optional           | Additional notes         |
| created_at             | DateTime      | Auto Now Add       | Creation timestamp       |

### Cost Type Choices
- `Per_Liter` - Rate per liter
- `Per_Load` - Fixed rate per load

**Foreign Keys**:
- `source` → `MasterSource.id` (CASCADE)

**Indexes**: `effective_date` (DESC)

---

## RateHistoryPipeline

**Table**: `rate_history_pipelines`

Historical rate tracking for pipeline sources.

### Fields

| Field          | Type          | Constraints        | Description        |
| -------------- | ------------- | ------------------ | ------------------ |
| id             | Integer       | PK, Auto           | Primary key        |
| source         | Integer       | FK to MasterSource | Pipeline reference |
| effective_date | Date          | Not Null           | Rate start date    |
| cost_per_liter | Decimal(10,4) | Not Null           | Rate per liter     |
| notes          | Text          | Optional           | Additional notes   |
| created_at     | DateTime      | Auto Now Add       | Creation timestamp |

**Foreign Keys**:
- `source` → `MasterSource.id` (CASCADE)

**Indexes**: `effective_date` (DESC)

---

## WaterEntry

**Table**: `water_entries`

Main transaction table for water purchases.

### Fields

| Field                    | Type          | Constraints                       | Description              |
| ------------------------ | ------------- | --------------------------------- | ------------------------ |
| id                       | Integer       | PK, Auto                          | Primary key              |
| entry_date               | Date          | Not Null                          | Transaction date         |
| source                   | Integer       | FK to MasterSource, Null          | Water source             |
| loading_location         | Integer       | FK to MasterLocation, Null        | Loading site             |
| unloading_location       | Integer       | FK to MasterLocation, Null        | Unloading site           |
| shift                    | String(20)    | Optional                          | Work shift               |
| water_type               | String(50)    | Optional                          | Potable/Industrial       |
| vehicle                  | Integer       | FK to MasterInternalVehicle, Null | Vehicle used             |
| load_count               | Integer       | Optional                          | Number of loads          |
| meter_reading_current    | Integer       | Optional                          | Current meter reading    |
| meter_reading_previous   | Integer       | Optional                          | Previous meter reading   |
| manual_capacity_liters   | Integer       | Optional                          | Manual capacity override |
| total_quantity_liters    | Decimal(12,2) | Not Null                          | Total water quantity     |
| total_cost               | Decimal(12,2) | Not Null                          | Total transaction cost   |
| snapshot_cost_per_liter  | Decimal(10,4) | Optional                          | Rate snapshot            |
| snapshot_cost_per_kl     | Decimal(10,2) | Optional                          | KL rate snapshot         |
| snapshot_paise_per_liter | Decimal(10,2) | Optional                          | Paise rate snapshot      |
| created_by               | Integer       | FK to User, Null                  | User who created entry   |
| created_at               | DateTime      | Auto Now Add                      | Creation timestamp       |

**Foreign Keys**:
- `source` → `MasterSource.id` (SET_NULL)
- `loading_location` → `MasterLocation.id` (SET_NULL)
- `unloading_location` → `MasterLocation.id` (SET_NULL)
- `vehicle` → `MasterInternalVehicle.id` (SET_NULL)
- `created_by` → `User.id` (SET_NULL)

**Indexes**: `entry_date` (DESC), `created_at` (DESC)

---

## Business Logic

### Rate Calculation

Rates are determined by looking up the most recent rate history record with `effective_date <= entry_date`:

**Internal Vehicles**:
```python
rate = RateHistoryInternalVehicle.objects.filter(
    vehicle_id=vehicle_id,
    effective_date__lte=entry_date
).order_by('-effective_date').first()

total_cost = rate.cost_per_load
```

**Vendors**:
```python
rate = RateHistoryVendor.objects.filter(
    source_id=source_id,
    effective_date__lte=entry_date
).order_by('-effective_date').first()

if rate.cost_type == 'Per_Liter':
    total_cost = quantity_liters * rate.rate_value
elif rate.cost_type == 'Per_Load':
    total_cost = (rate.rate_value / rate.vehicle_capacity) * quantity_liters
```

**Pipelines**:
```python
rate = RateHistoryPipeline.objects.filter(
    source_id=source_id,
    effective_date__lte=entry_date
).order_by('-effective_date').first()

total_cost = quantity_liters * rate.cost_per_liter
```

### Data Integrity

1. **Historical Rates**: Never delete rate history records
2. **Date Validation**: `effective_date` must be <= `entry_date`
3. **Soft Deletes**: Use `is_active=False` for master data
4. **Foreign Key Protection**: SET_NULL on deletion to preserve history

### Common Queries

**Monthly Total Cost**:
```python
from django.db.models import Sum
WaterEntry.objects.filter(
    entry_date__gte=start_of_month
).aggregate(Sum('total_cost'))
```

**Active Vendors**:
```python
MasterSource.objects.filter(
    is_active=True,
    source_type='Vendor'
)
```

**Vehicle Utilization**:
```python
WaterEntry.objects.filter(
    vehicle_id=vehicle_id,
    entry_date__range=[start_date, end_date]
).count()
```
