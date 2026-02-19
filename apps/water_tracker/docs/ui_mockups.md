# Water Purchase Tracker - UI Mockups

This document describes the look and feel of the application for the Login screen and the Admin Dashboard.

## 1. Login Screen (Public)

The entry point for all users.

**Visual Layout:**
*   **Background**: A clean, possibly water-themed gradient (Blue/White) or a simple professional background.
*   **Central Card**: A centered white box containing the login form.
*   **Logo**: Project Logo/Title "Water Purchase Tracker" at the top of the card.
*   **Fields**:
    *   **Username**: Text Input (Placeholder: "Enter Username")
    *   **Password**: Password Input (Placeholder: "Enter Password") containing a "Show/Hide" eye icon.
*   **Button**: Primary Blue Button "Login".
*   **Footer**: "Forgot Password? Contact Admin."

**ASCII Mockup:**
```text
+-------------------------------------------------------+
|                                                       |
|                  WATER PURCHASE TRACKER               |
|                                                       |
|       +---------------------------------------+       |
|       |               LOGIN                   |       |
|       |                                       |       |
|       |  Username: [_______________________]  |       |
|       |                                       |       |
|       |  Password: [***********] (o)          |       |
|       |                                       |       |
|       |          [   LOGIN   ]                |       |
|       |                                       |       |
|       |      Forgot Password? Contact Admin   |       |
|       +---------------------------------------+       |
|                                                       |
+-------------------------------------------------------+
```

---

## 2. Admin Dashboard (Logged In)

After logging in as an **Admin**, the user sees a dashboard with quick stats and navigation.

**Layout Structure:**
*   **Sidebar (Left)**: Navigation Menu (Collapsible).
*   **Top Bar (Header)**: Breadcrumbs, User Profile (Admin Name), Logout Button.
*   **Main Content Area**: The central workspace.

**Sidebar Menu Items:**
1.  **Dashboard** (Active)
2.  **Water Entries** (Transaction List)
3.  **Price Management** (Manage Rates)
4.  **Locations** (Manage Sources/Destinations)
5.  **Reports** (Cost Analysis)
6.  **User Management** (Create/Edit Users)
7.  **Settings** (Backup/Restore/Reset)

**Dashboard Widgets (Main Area):**
*   **Top Cards (Summary Metrics)**:
    *   *Total Cost (This Month)*: ₹45,000
    *   *Total Volume (This Month)*: 1,200 KL
    *   *Recent Entries*: 5
*   **Quick Actions**: Buttons for "New Purchase Entry", "Update Price".
*   **Recent Activity Table**: A small table showing the last 5 transactions.

**ASCII Mockup:**
```text
+------------------+---------------------------------------------------+
|  WATER TRACKER   |  Dashboard > Home                  Admin User (v) |
+------------------+---------------------------------------------------+
|                  |                                                   |
|  [ Dashboard   ] |  +-------------+  +-------------+  +------------+ |
|  [ Entries     ] |  | Cost (Month)|  | Vol (Month) |  | Avg Rate   | |
|  [ Price Mgmt  ] |  |   ₹45,000   |  |   1,200 KL  |  | ₹37.5/KL   | |
|  [ Locations   ] |  +-------------+  +-------------+  +------------+ |
|  [ Reports     ] |                                                   |
|  [ Users       ] |  [ + New Entry ]   [ $ Update Price ]             |
|  [ Settings    ] |                                                   |
|                  |  Recent Activity:                                 |
|                  |  +---------------------------------------------+  |
|                  |  | Date       | Source      | Vehicle | Cost   |  |
|                  |  +---------------------------------------------+  |
|                  |  | 2023-10-25 | Arts Bore   | Eicher  | ₹400   |  |
|                  |  | 2023-10-24 | Varahi      | Tractor | ₹250   |  |
|                  |  +---------------------------------------------+  |
|                  |                                                   |
+------------------+---------------------------------------------------+
```

---

## 3. Locations Management (CRUD)

Manage where water comes from (Loading) and where it goes (Unloading).

**Layout:**
*   **Tabs**: "Loading Locations (Sources)" | "Unloading Locations"
*   **Action Bar**: "Add New Location" Button.
*   **Table**: Lists existing locations with Edit/Delete options.

**ASCII Mockup:**
```text
+------------------+---------------------------------------------------+
|  WATER TRACKER   |  Dashboard > Locations             Admin User (v) |
+------------------+---------------------------------------------------+
|                  |                                                   |
|  [ Dashboard   ] |  [ Loading Sources ]  [ Unloading Locations ]     |
|  [ Entries     ] |  (Active Tab)                                     |
|  [ Price Mgmt  ] |                                                   |
|  [ Locations   ] |  +---------------------------------------------+  |
|  [ Reports     ] |  | Location Name      | Type      | Actions    |  |
|  [ Users       ] |  +---------------------------------------------+  |
|  [ Settings    ] |  | Arts Bore          | Bore Well | [Edit][X]  |  |
|                  |  | Varahi             | Vendor    | [Edit][X]  |  |
|                  |  | Sun Waters         | Vendor    | [Edit][X]  |  |
|                  |  | KPM Pipeline       | Pipeline  | [Edit][X]  |  |
|                  |  +---------------------------------------------+  |
|                  |                                                   |
|                  |  [ + Add New Source ]                             |
|                  |                                                   |
+------------------+---------------------------------------------------+
```

**Add/Edit Modal:**
```text
+---------------------------------------+
|  Add New Source                       |
+---------------------------------------+
|  Name: [_______________________]      |
|                                       |
|  Type: (o) Bore Well  ( ) Open Well   |
|        ( ) Vendor     ( ) Pipeline    |
|                                       |
|  [ Cancel ]              [  Save  ]   |
+---------------------------------------+
```

---

## 4. Price Management (Rate Control)

Manage the cost of water per Load or per Liter. Updates here create a new history record with an effective date.

**Layout:**
*   **Selector**: Dropdown to filter by "Internal Vehicles" or "Vendors".
*   **Rate Table**: Shows *Current Active Rate* for each source/vehicle.
*   **Update Form**: A side panel or modal to enter new rates.

**ASCII Mockup:**
```text
+------------------+---------------------------------------------------+
|  WATER TRACKER   |  Dashboard > Price Management      Admin User (v) |
+------------------+---------------------------------------------------+
|                  |                                                   |
|  [ Dashboard   ] |  Filter: [ All Sources (v) ]                      |
|  [ Entries     ] |                                                   |
|  [ Price Mgmt  ] |  +---------------------------------------------+  |
|  [ Locations   ] |  | Source / Vehicle   | Current Rate | Unit Cost |  |
|  [ Reports     ] |  +---------------------------------------------+  |
|  [ Users       ] |  | Eicher (Internal)  | ₹400 / Load  | ₹33.3/KL  |  |
|  [ Settings    ] |  | Tractor (Internal) | ₹200 / Load  | ₹33.3/KL  |  |
|                  |  | Varahi (Vendor)    | ₹1300 / Load | ₹108/KL   |  |
|                  |  | Sun Waters         | ₹1.2 / Liter | ₹1200/KL  |  |
|                  |  +---------------------------------------------+  |
|                  |                                                   |
|                  |  [ $ Update Rate ] (Select a row to update)       |
|                  |                                                   |
+------------------+---------------------------------------------------+
```

**Update Rate Modal:**
```text
+---------------------------------------+
|  Update Rate: Eicher (Internal)       |
+---------------------------------------+
|  Current Rate: ₹400.00 / Load         |
|  Capacity: 12000 Liters               |
|                                       |
|  New Price per Load: [ 450      ]     |
|                                       |
|  Effective From: [ 2023-11-01 (v) ]   |
|                                       |
|  -- Preview --                        |
|  Cost/Liter: ₹0.0375                  |
|  Cost/KL:    ₹37.50                   |
|                                       |
|  [ Cancel ]              [  Save  ]   |
+---------------------------------------+
```
