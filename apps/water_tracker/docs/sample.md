# Water Purchase Tracker - Web Interface Sample

This document outlines the proposed web interface for entering water purchase data. The goal is to have a simple, intuitive form that adapts based on the type of water source selected.

## UI Mockup

Below is a visual representation of how the entry form might look.

![Water Purchase Entry Form](/water_purchase_entry_form.png)

## Input Form Structure

The application will likely use a tabbed interface or a dynamic form that changes fields based on the selected **Source Type**.

### 1. Water Purchase Entry (Consolidated)

This screen handles entries for **Internal Sources**, **Standard Vendors**, and **variable-capacity Vendors** (e.g., Sun Waters).

*   **Date**: Date Picker (Default: Today)
*   **Water Type**: Dropdown (Normal, Drinking (RO)).
*   **Source Type**: Toggle/Radio (Own Vehicle vs. Vendor).

#### Entry Fields Logic:
1.  **If Own Vehicle (Source Type = Own):**
    *   **Vehicle**: Dropdown (e.g., Eicher, Tractor).
    *   **Source (Loading Place)**: Dropdown (e.g., Arts Bore, Divas Well).
    *   **Capacity Mode**: Fixed (Start with Load Count).
    *   **Load Count**: Number Input (Default: 1).

2.  **If Vendor (Source Type = Vendor):**
    *   **Vendor Name**: Dropdown (e.g., Varahi, Bannari, Sun Waters).
    *   **Capacity Mode**: Toggle (Per Load / Manual Liters).
        *   *Default*: 'Per Load' if vendor has a vehicle rate.
        *   *Manual Liters*: For variable entries (e.g., Sun Waters: 13500, 25200).
    *   **Input**:
        *   If *Per Load*: **Vehicle** (Dropdown) + **Load Count** (Number).
        *   If *Manual Liters*: **Total Capacity (Liters)** (Number Input).

*   **Unloading Place**: Dropdown (e.g., Chillies, Admin Pool).
*   **Shift**: Dropdown (Morning, Evening).

**Calculated Preview (Real-Time)**:
*   *Based on the Effective Date logic from Price Management:*
    *   **Price per Liter**: `0.0333` INR (Example)
    *   **Price per KL**: `33.33` INR (Example)
    *   **Total Capacity**: 
        *   *Load Mode*: `Load Count * Vehicle Capacity`
        *   *Manual Mode*: `Entered Liters`
    *   **Total Amount**: `Calculated Cost based on Rate Type`
    *   *(Note: These values are stored in the database upon saving)*

### 2. KPM TWD Supply (Pipeline)

*   **Date**: Date Picker
*   **Source**: Fixed as 'KPM TWD' (or selected from dropdown)
*   **Current Meter Reading**: Number Input
*   **Previous Reading (Read-Only)**: Displayed from last entry for reference.
*   **Calculated Info**:
    *   *Consumption*: `Current - Previous`
    *   *Total Liters*: `Consumption * 1000`
    *   *Est. Cost*: `Total Liters * Cost Per Liter`


## Price Management Screen (New)

A separate admin screen to manage and update water rates.

1.  **Select Source/Vehicle**: Dropdown (e.g., Eicher, Varahi).
2.  **Current Rate**: Displayed for reference (e.g., ₹400/Load).
3.  **New Price Entry**:
    *   *Price per Load*: Number Input (e.g., 450).
    *   *Effective Date*: Date Picker (Date from when this applies).
4.  **Auto-Calculated Preview**:
    *   *Cost per Liter*: `450 / 12000 = 0.0375`
    *   *Cost per KL*: `37.50`
5.  **Action**: 'Update Rate' button.

## Key Features

*   **Dynamic Validations**: Ensure meter readings are higher than previous.
*   **Real-time Cost Estimation**: Show the user the estimated cost *before* they submit.
*   **Mobile Friendly**: The form should be responsive for use on tablets/phones by field staff.
