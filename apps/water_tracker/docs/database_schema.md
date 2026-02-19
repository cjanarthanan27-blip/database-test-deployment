# Water Purchase Tracker - Database Schema

The database is designed to handle different types of water sources (Internal, Pipeline, Vendor), vehicle types, and crucially, variable costs over time using an `effective_date` strategy.

## 1. Master Tables (Reference Data)

### `master_locations`
Stores the valid unloading locations (e.g., Chillies, Arts, Farms, etc.).
- `id` (PK, INT, Auto-increment)
- `location_name` (VARCHAR, Unique)
- `description` (TEXT, Optional)

### `master_sources`
Stores all water sources: Bores, Wells, Pipelines, and Vendors.
- `id` (PK, INT, Auto-increment)
- `source_name` (VARCHAR) - e.g., 'Arts Bore', 'KPM TWD', 'Sun Waters'
- `source_type` (ENUM/VARCHAR) - 'Internal_Bore', 'Internal_Well', 'Pipeline', 'Vendor'
- `is_active` (BOOLEAN) - To soft delete sources.

### `master_internal_vehicles`
Stores the organization's own vehicles.
- `id` (PK, INT, Auto-increment)
- `vehicle_name` (VARCHAR) - 'Eicher', 'Tractor'
- `capacity_liters` (INT) - 12000, 6000

---

## 2. Rate & Cost Managment (Critical for History)

To handle price changes (e.g., 200 -> 250 in future), we use rate tables with an generic `effective_date`.

### `rate_history_internal_vehicles`
Tracks the cost per load for internal vehicles.
- `id` (PK, INT, Auto-increment)
- `vehicle_id` (FK -> `master_internal_vehicles.id`)
- `cost_per_load` (DECIMAL) - e.g., 400.00, 200.00
- `effective_date` (DATE) - The date from which this rate applies.
- `calculated_cost_per_liter` (DECIMAL, 10, 4) - Auto-calculated reference (Load / Capacity).
- `calculated_cost_per_kl` (DECIMAL, 10, 2) - Auto-calculated reference (Cost/Liter * 1000).

### `rate_history_vendors`
Tracks the cost for vendors (Per Load or Per Liter).
- `id` (PK, INT, Auto-increment)
- `source_id` (FK -> `master_sources.id`)
- `water_type` (VARCHAR) - 'Normal', 'Drinking (RO)'
- `cost_type` (ENUM/VARCHAR) - 'Per_Load', 'Per_Liter'
- `rate_value` (DECIMAL) - e.g., 1300.00 (Load), 0.25 (Liter)
- `vehicle_capacity` (INT, Nullable) - Required if `cost_type` is 'Per_Load' (e.g., 12000 for Varahi).
- `effective_date` (DATE) - The date from which this rate applies.
- `calculated_cost_per_liter` (DECIMAL, 10, 4) - Auto-calculated for Per_Load types.
- `calculated_cost_per_kl` (DECIMAL, 10, 2) - Auto-calculated.

### `rate_history_pipeline`
Tracks the cost per liter for pipelines (e.g., KPM).
- `id` (PK, INT, Auto-increment)
- `source_id` (FK -> `master_sources.id`)
- `cost_per_liter` (DECIMAL) - e.g., 0.15
- `effective_date` (DATE)

---

## 3. Transaction Tables (Daily Entries)

### `water_entries`
The main table for recording daily water purchases/extraction.
- `id` (PK, INT, Auto-increment)
- `entry_date` (DATE) - The date of the transaction.
- `source_id` (FK -> `master_sources.id`)
- `unloading_location_id` (FK -> `master_locations.id`) - Nullable if not applicable.
- `shift` (VARCHAR) - 'Morning', 'Evening' (ENUM or Master table could vary).
- `water_type` (VARCHAR) - 'Normal', 'Drinking (RO)' (Crucial for rate selection).

#### Water Quantity Fields (Polymorphic Logic based on Source Type)
- `vehicle_id` (FK -> `master_internal_vehicles.id`) - NULL if Vendor/Pipeline.
- `load_count` (INT) - Used for Internal/Vendor Loads.
- `meter_reading_current` (INT) - Used for Pipeline (KPM).
- `meter_reading_previous` (INT) - Used for Pipeline calculation.
- `manual_capacity_liters` (INT) - Used for variable vendor loads (e.g., Sun Waters entry of 13500).

#### Calculated Financials (Snapshot at Entry Time)
*These values are calculated and stored permanently when the entry is created to preserve history, even if rates change later.*

- `total_quantity_liters` (DECIMAL) - The final volume (Capacity * Loads OR Meter Diff * 1000).
- `total_cost` (DECIMAL) - The final cost in INR.

**Unit Cost Snapshots (For Reporting/Analysis):**
- `snapshot_cost_per_liter` (DECIMAL, 10, 4) - e.g., 0.0333
- `snapshot_cost_per_kl` (DECIMAL, 10, 2) - e.g., 33.33 (Cost per 1000 Liters)
- `snapshot_paise_per_liter` (DECIMAL, 10, 2) - e.g., 3.33 (Cost in Paise)

---

## 4. Query Logic for "Effective Date"

When inserting a new entry or calculating cost, valid rate is fetched using:

```sql
-- Example: Get valid rate for a specific date
SELECT cost_per_load
FROM rate_history_internal_vehicles
WHERE vehicle_id = ? 
  AND effective_date <= ? -- (The Entry Date)
ORDER BY effective_date DESC
LIMIT 1;
```

This logic ensures that if you enter data for a past date, the old rate is used. If you enter for today, the current rate is used.

---

## 5. User Management Schema (Security)

To support the Admin Features (Login, Role-Based Access, Password Reset), we need a dedicated `users` table.

### `users`
Stores user credentials and access levels.
- `id` (PK, INT, Auto-increment)
- `username` (VARCHAR, Unique) - The login ID (e.g., 'admin', 'supervisor').
- `password_hash` (VARCHAR) - **Security Critical**: Store the hashed password (e.g., PBKDF2 or Argon2), NEVER plain text.
- `role` (ENUM/VARCHAR) - 'Admin', 'Data_Entry', 'Viewer'.
- `is_active` (BOOLEAN) - Default `TRUE`. Set to `FALSE` to deactivate a user (preserving history).
- `created_at` (TIMESTAMP) - Default `CURRENT_TIMESTAMP`.
- `last_login` (TIMESTAMP, Nullable) - To track user activity.
