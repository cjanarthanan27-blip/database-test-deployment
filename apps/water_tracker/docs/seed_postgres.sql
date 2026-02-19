-- Water Purchase Tracker - Seed Data (PostgreSQL)
BEGIN TRANSACTION;

-- 1. Create Default Admin User
-- Password 'admin123' (hashed using werkzeug/scrypt. This is a placeholder for development)
INSERT INTO
    users (username, password_hash, role)
VALUES
    (
        'admin',
        'scrypt:32768:8:1$Lg2B8t...placeholder_hash...',
        'Admin'
    );

-- 2. Master Unloading Locations
INSERT INTO
    master_locations (location_name)
VALUES
    ('Chillies'),
    ('Arts'),
    ('Admin pool'),
    ('Divas'),
    ('Sez'),
    ('Labour Shed'),
    ('Kings'),
    ('WEH/AIC'),
    ('Grand hall'),
    ('Farms');

-- 3. Master Sources (Internal)
INSERT INTO
    master_sources (source_name, source_type)
VALUES
    ('Arts Bore', 'Internal_Bore'),
    ('Admin Bore', 'Internal_Bore'),
    ('Divas Bore', 'Internal_Bore'),
    ('Kings Bore', 'Internal_Bore'),
    ('AIC Bore', 'Internal_Bore'),
    ('WEH Bore', 'Internal_Bore'),
    ('11s Ground Well', 'Internal_Well'),
    ('RTC ''c'' block Well', 'Internal_Well'),
    ('Divas Well', 'Internal_Well'),
    ('Deepam Well', 'Internal_Well');

-- 4. Master Sources (External)
INSERT INTO
    master_sources (source_name, source_type)
VALUES
    ('KPM TWD', 'Pipeline'),
    ('Varahi', 'Vendor'),
    ('Bannari', 'Vendor'),
    ('Sun Waters', 'Vendor');

-- 5. Internal Vehicles
INSERT INTO
    master_internal_vehicles (vehicle_name, capacity_liters)
VALUES
    ('Eicher', 12000),
    ('Tractor', 6000);

-- 6. Initial Rates (Examples for Development)
-- Internal Vehicles Rates (Effective from 2023-01-01)
INSERT INTO
    rate_history_internal_vehicles (
        vehicle_id,
        cost_per_load,
        effective_date,
        calculated_cost_per_liter,
        calculated_cost_per_kl
    )
VALUES
    (1, 400.00, '2023-01-01', 0.0333, 33.33), -- Eicher
    (2, 200.00, '2023-01-01', 0.0333, 33.33);

-- Tractor
-- Vendor Rates (Examples)
-- Varahi: 1300 per load (12000L)
INSERT INTO
    rate_history_vendors (
        source_id,
        water_type,
        cost_type,
        rate_value,
        vehicle_capacity,
        effective_date,
        calculated_cost_per_liter,
        calculated_cost_per_kl
    )
VALUES
    (
        (
            SELECT
                id
            FROM
                master_sources
            WHERE
                source_name = 'Varahi'
        ),
        'Normal',
        'Per_Load',
        1300.00,
        12000,
        '2023-01-01',
        0.1083,
        108.33
    );

-- Sun Waters: 1.2 per liter (Manual Capacity)
INSERT INTO
    rate_history_vendors (
        source_id,
        water_type,
        cost_type,
        rate_value,
        vehicle_capacity,
        effective_date,
        calculated_cost_per_liter,
        calculated_cost_per_kl
    )
VALUES
    (
        (
            SELECT
                id
            FROM
                master_sources
            WHERE
                source_name = 'Sun Waters'
        ),
        'Normal',
        'Per_Liter',
        1.20,
        NULL,
        '2023-01-01',
        1.2000,
        1200.00
    );

-- Pipeline Rates (KPM)
INSERT INTO
    rate_history_pipeline (source_id, cost_per_liter, effective_date)
VALUES
    (
        (
            SELECT
                id
            FROM
                master_sources
            WHERE
                source_name = 'KPM TWD'
        ),
        0.15,
        '2023-01-01'
    );

COMMIT;