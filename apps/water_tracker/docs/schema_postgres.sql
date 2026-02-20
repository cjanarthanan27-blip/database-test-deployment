-- Water Purchase Tracker Schema (PostgreSQL)
-- 1. Users Table (Authentication & Authorization)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Data_Entry', 'Viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. Master Tables (Reference Data)
-- Unloading Locations
CREATE TABLE IF NOT EXISTS master_locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Water Sources (Bores, Wells, Vendors, Pipelines)
CREATE TABLE IF NOT EXISTS master_sources (
    id SERIAL PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL UNIQUE,
    source_type VARCHAR(50) NOT NULL CHECK (
        source_type IN (
            'Internal_Bore',
            'Internal_Well',
            'Pipeline',
            'Vendor'
        )
    ),
    is_active BOOLEAN DEFAULT TRUE
);

-- Internal Vehicles (Own Transport)
CREATE TABLE IF NOT EXISTS master_internal_vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_name VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'Eicher', 'Tractor'
    capacity_liters INTEGER NOT NULL
);

-- 3. Rate History Tables (Cost Management)
-- Rates for Internal Vehicles (Per Load)
CREATE TABLE IF NOT EXISTS rate_history_internal_vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL,
    cost_per_load DECIMAL(10, 2) NOT NULL,
    effective_date DATE NOT NULL,
    calculated_cost_per_liter DECIMAL(10, 4), -- Cached for easier querying
    calculated_cost_per_kl DECIMAL(10, 2), -- Cached for easier querying
    FOREIGN KEY (vehicle_id) REFERENCES master_internal_vehicles (id)
);

-- Rates for Vendors (Per Load or Per Liter)
CREATE TABLE IF NOT EXISTS rate_history_vendors (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL,
    water_type VARCHAR(50) NOT NULL CHECK (water_type IN ('Normal', 'Drinking (RO)')),
    cost_type VARCHAR(20) NOT NULL CHECK (cost_type IN ('Per_Load', 'Per_Liter')),
    rate_value DECIMAL(10, 2) NOT NULL, -- The cost (e.g., 1300 per load OR 0.25 per liter)
    vehicle_capacity INTEGER, -- Required if cost_type is 'Per_Load'
    effective_date DATE NOT NULL,
    calculated_cost_per_liter DECIMAL(10, 4),
    calculated_cost_per_kl DECIMAL(10, 2),
    FOREIGN KEY (source_id) REFERENCES master_sources (id)
);

-- Rates for Pipelines (Per Liter/Meter)
CREATE TABLE IF NOT EXISTS rate_history_pipeline (
    id SERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL,
    cost_per_liter DECIMAL(10, 4) NOT NULL,
    effective_date DATE NOT NULL,
    FOREIGN KEY (source_id) REFERENCES master_sources (id)
);

-- 4. Transaction Table (Daily Entries)
CREATE TABLE IF NOT EXISTS water_entries (
    id SERIAL PRIMARY KEY,
    entry_date DATE NOT NULL,
    source_id INTEGER NOT NULL,
    unloading_location_id INTEGER,
    shift VARCHAR(20) CHECK (shift IN ('Morning', 'Evening')),
    water_type VARCHAR(50) CHECK (water_type IN ('Normal', 'Drinking (RO)')),
    -- Specific Fields based on Source Type
    vehicle_id INTEGER, -- For Internal/Vendor Loads
    load_count INTEGER, -- For Internal/Vendor Loads
    meter_reading_current INTEGER, -- For Pipeline
    meter_reading_previous INTEGER, -- For Pipeline
    manual_capacity_liters INTEGER, -- For variable vendor loads (e.g., Sun Waters)
    -- Financial Snapshots (Stored at time of entry)
    total_quantity_liters DECIMAL(12, 2) NOT NULL,
    total_cost DECIMAL(12, 2) NOT NULL,
    -- Unit Cost Snapshots for Reporting
    snapshot_cost_per_liter DECIMAL(10, 4),
    snapshot_cost_per_kl DECIMAL(10, 2),
    snapshot_paise_per_liter DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_id) REFERENCES master_sources (id),
    FOREIGN KEY (unloading_location_id) REFERENCES master_locations (id),
    FOREIGN KEY (vehicle_id) REFERENCES master_internal_vehicles (id)
);