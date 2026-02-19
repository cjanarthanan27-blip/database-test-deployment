# Admin Features Documentation

This document outlines the administrative capabilities of the system, including managing users and maintaining the database.

## 1. User Management

The system supports role-based access control to ensure data security.

### Roles
*   **Admin**: Full access to all features, including Price Management and User Management.
*   **Data Entry**: Restricted access to enter purchases and view basic reports. Can *not* change rates or manage users.
*   **Viewer**: Read-only access to reports and dashboards.

### Features
*   **Add User**: Admin creates new accounts with a Username, Initial Password, and Role.
*   **Change Password (User)**: Users can change their own password after logging in (e.g., from a Profile or Settings page).
*   **Reset Password (Admin)**: 
    *   If a user forgets their password, the Admin can reset it.
    *   Admin sets a new temporary password and communicates it to the user.
*   **Deactivate User**: Disable access without deleting historical data logs associated with the user.

---

## 2. Database Maintenance

Tools to ensure data integrity and safety.

### Backup
*   **Manual Backup**: A 'Download Backup' button in the admin panel to export the entire database as a SQL dump or structured JSON/CSV file.
*   **Auto-Backup (Optional)**: Scheduled daily backups saved to a local folder or cloud storage.

### Restore
*   **Import Data**: Ability to upload a previously created backup file to restore the system to that state.
*   **Validation**: The system will check the file format and version before restoring to prevent corruption.
*   **Warning**: Restoring overwrites current data. A confirmation prompt ("Are you sure?") is mandatory.

### Reset (Data Purge)
*   **Factory Reset**: Clears all *transactional* data (Water Entries, Rate History) but keeps *Master Data* (Locations, Vehicles, Sources) and *Users* intact.
*   **Full Reset**: Wipes EVERYTHING, returning the system to a fresh install state.
*   **Safety Mechanism**: Requires Admin password confirmation to execute.
