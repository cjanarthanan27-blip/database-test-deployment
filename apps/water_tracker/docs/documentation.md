# Water Purchase Tracker Documentation

## Project Overview
This project is a Water Purchase Tracker application designed to manage and log water purchase transactions. Key features include tracking:
- Date of purchase
- Loading vehicle details (Own vs. Vendor)
- Loading and Unloading locations
- Quantity purchased
- Shift information

### Internal Vehicles & Capacities
The organization uses its own vehicles for transporting water from internal sources. "1 Load" refers to the full capacity of the specific vehicle used.

| Vehicle Type | Capacity (Liters) | Cost per Load (INR) | Description                  |
| :----------- | :---------------- | :------------------ | :--------------------------- |
| **Eicher**   | 12,000            | 400                 | Standard heavy load vehicle. |
| **Tractor**  | 6,000             | 200                 | Smaller capacity vehicle.    |

**Rate History Requirement (Internal Vehicles):** The cost per load (e.g., 400, 200) serves as the base rate. This rate is subject to change. The database MUST utilize an `Effective Date` validation. When calculating costs, the system must query using the Entry Date to apply the specific rate active during that period (i.e., `Entry Date >= Effective Date` of the price record).

## Database Schema

### Table: `water_purchases`
This table stores the core transaction details for each water purchase.

| Column Name          | Data Type        | Description                                                                |
| :------------------- | :--------------- | :------------------------------------------------------------------------- |
| `id`                 | `INTEGER`        | Primary Key, Auto-incrementing unique identifier for each record.          |
| `purchase_date`      | `DATE`           | The date when the water purchase was made.                                 |
| `vehicle_source`     | `VARCHAR(50)`    | Specifies the source of the vehicle (e.g., 'Own Vehicle', 'Vendor').       |
| `loading_location`   | `VARCHAR(255)`   | The location where the water was loaded.                                   |
| `unloading_location` | `VARCHAR(255)`   | The location where the water was unloaded.                                 |
| `quantity`           | `DECIMAL(10, 2)` | The amount of water purchased (e.g., in liters or gallons).                |
| `shift`              | `VARCHAR(50)`    | The shift during which the purchase occurred (e.g., 'Morning', 'Evening'). |

### Purchase Entry Workflows

#### 1. Normal Water (Salt Water) - Purchase Entry
For standard water purchases (from Wells or Vendors), the following details are recorded:
- **Date**: Date of purchase.
- **Loading Location (Source)**: Specific Bore/Well or Vendor.
- **Vehicle Used**: Type of vehicle (e.g., Eicher, Tractor).
- **Load Count**: Number of loads purchased.
- **Shift**: The shift during which the purchase occurred.

> **Calculation Logic:**
> `Total Quantity = Load Count * Vehicle Capacity`
> `Total Cost = Load Count * Cost Per Load (based on Vehicle/Source)`

#### 2. KPM TWD Supply (Government Pipeline) - Purchase Entry
For the government pipeline, the entry is based on daily meter readings.
- **Date**: Date of reading.
- **Current Meter Reading**: The cumulative reading from the meter.

> **Calculation Logic:**
> `Daily Consumption = Current Reading - Previous Day's Reading`
> `Total Quantity (Liters) = Daily Consumption * 1000`
> `Total Cost = Total Quantity * Cost Per Liter (based on Effective Date)`

#### 3. Sun Waters (External Vendor) - Purchase Entry
For direct drinking water delivery from Sun Waters.
- **Date**: Date of purchase.
- **Unloading Location**: Specific location where water was delivered.
- **Capacity**: Measured in Liters (entered directly).

> **Calculation Logic:**
> `Total Quantity = Capacity (Entered Value)`
> `Total Cost = Total Quantity * Cost Per Liter (0.25p - based on Effective Date) + Loading/Vehicle Cost (if applicable)`

### Valid Data

#### Loading Locations (Sources)
**Internal Sources (Own Bore & Well)**
These are internal resources utilizing own vehicles, resulting in lower costs compared to vendor purchases.
*   **Bore Wells:**
    - Arts Bore
    - Admin Bore
    - Divas Bore
    - Kings Bore
    - AIC Bore
    - WEH Bore
*   **Open Wells:**
    - 11s Ground Well
    - RTC 'c' block Well
    - Divas Well
    - Deepam Well
    - Muthu nagar Well

**Vendor Sources**
- External vendors (List customizable)

**Government Pipeline Sources**
*   **KPM TWD Drinking Water Supply:**
    - Type: Government allocated pipeline.
    - **Calculation Method:** Meter Reading Difference.
        - Entry: `Date`, `Current Reading`
        - Logic: `(Current Reading - Previous Reading) * 1000 = Total Liters`
        - Example: `4271 (Current) - 4253 (Previous) = 18`. `18 * 1000 = 18,000 Liters`.
    - **Cost:** 0.15 Paise per Liter (Initial Rate).
    - **Rate History Requirement:** The system must handle rate changes over time. When a rate is updated, it must be associated with an `Effective Date`. Calculations for a specific period must use the rate valid for that date.

**External Drinking Water Vendors**
*   **Sun Waters:**
    - Type: Private Vendor (Direct Delivery).
    - **Entry Details:**
        - Date
        - Unloading Location (Delivered directly to specific location)
        - Capacity (Varies per load)
    - **Common Capacities:** 12000, 12200, 13000, 13500, 24400, 25200 (in Liters).
    - **Note:** Capacity is entered directly, not calculated.
    - **Cost per Liter (Pipeline Equivalent/Direct):** 0.25 Paise per Liter (subject to change; needs to be updatable).
    - **Vehicle Cost (12000L):** 1440 INR.

*   **Other Vendors (Varahi & Bannari):**
    - **Capacity:** Typically 12,000 Liters (1 Load).
    - **Cost (12000L):** 1300 INR.

*   **Guru Enterprises:**
    - **Vehicle Capacity:** 4,000 Liters.
    - **Cost (Normal Water):** 980 INR per load.
    - **Cost (Drinking Water):** 1450 INR per load.

*   **Adhi Vinayaka:**
    - **Vehicle Capacity:** 8,000 Liters.
    - **Cost (Normal Water):** 900 INR per load.
    - **Cost (Drinking RO Water):** 2800 INR per load.

#### Unloading Locations
The following are the standard locations for unloading water:
- Chillies
- Arts
- Admin pool
- Divas
- Sez
- Labour Shed
- Kings
- WEH/AIC
- Grand hall
- Farms

### Price Management Workflow (Rate Updates)
To ensure accurate cost tracking, a dedicated "Price Management" entry is used to update rates.

**Input Fields:**
- **Source/Vehicle:** Select the specific source or vehicle (e.g., Eicher, Sun Waters).
- **New Price per Load:** The new cost for a full load (e.g., 450 INR).
- **Effective From Date:** The date this new price becomes active.

**System Calculations (Stored in Rate History):**
Upon saving, the system automatically calculates and stores:
- **Cost per Liter:** `Price per Load / Vehicle Capacity` (e.g., 450 / 12000 = 0.0375)
- **Cost per KL:** `Cost per Liter * 1000` (e.g., 37.50)

**Usage:**
Purchase entries will look up these specific calculated rates based on the transaction date.

## Usage
Add usage instructions here as the project develops.

## Dependencies
List dependencies here or refer to `requirements.txt`.
