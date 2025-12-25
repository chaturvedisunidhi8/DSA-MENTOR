# Role-Based Access Control (RBAC) Implementation

## Overview

This document describes the complete Role-Based Access Control (RBAC) system implemented in the DSA-MENTOR application. Users can now access only the features their assigned roles permit, providing granular security and flexible access management.

## Features Implemented

### 1. **Database-Backed Role System**
- Roles are now stored in MongoDB instead of in-memory
- Persistent across server restarts
- Support for custom role creation beyond superadmin/client

### 2. **Granular Permission System**
- 12 predefined permissions covering all system features
- Permission-based route protection on backend
- Permission-based UI rendering on frontend

### 3. **Backend Permission Middleware**
- `checkPermission()` middleware for API route protection
- Automatic 'all' permission expansion for superadmins
- Fallback support for legacy role-based users

### 4. **Frontend Permission Guards**
- `PermissionGuard` component for conditional rendering
- `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()` utilities
- Navigation items dynamically shown/hidden based on permissions

### 5. **Audit Logging**
- Track all permission checks and access attempts
- Log user actions (create, update, delete operations)
- Searchable audit trail for security compliance

## Available Permissions

| Permission ID | Description | Category |
|--------------|-------------|----------|
| `all` | Full system access (superadmin) | System |
| `read:problems` | View problem listings and details | Problems |
| `create:problems` | Create new problems | Problems |
| `update:problems` | Edit existing problems | Problems |
| `delete:problems` | Delete problems | Problems |
| `submit:solutions` | Submit code solutions | Solutions |
| `view:analytics` | View analytics dashboards | Analytics |
| `view:reports` | View system reports | Reports |
| `manage:users` | Create, edit, delete users | Users |
| `manage:roles` | Create, edit, delete roles | Roles |
| `access:mentor` | Access AI Mentor feature | Features |
| `manage:settings` | Manage system settings | System |

## Default Roles

### 1. **superadmin** (System Role)
- **Permissions:** `['all']`
- **Description:** Full system access with all administrative privileges
- **Cannot be deleted:** Yes
- **User Count:** Varies

### 2. **client** (System Role)
- **Permissions:** `['read:problems', 'submit:solutions', 'view:analytics', 'access:mentor']`
- **Description:** Standard user with problem-solving access
- **Cannot be deleted:** Yes
- **User Count:** Varies

### 3. **moderator** (Custom Role)
- **Permissions:** `['read:problems', 'create:problems', 'update:problems', 'view:reports', 'view:analytics']`
- **Description:** Can manage problems and view reports
- **Cannot be deleted:** No
- **Use Case:** Content moderators who need to manage problems but not users

### 4. **content-creator** (Custom Role)
- **Permissions:** `['read:problems', 'create:problems', 'update:problems']`
- **Description:** Can create and edit problems only
- **Cannot be deleted:** No
- **Use Case:** Subject matter experts who create problems

## File Structure

### Backend
```
backend/
├── models/
│   ├── Role.js                    # Role database model
│   ├── User.js                    # Updated with roleId and permissions
│   └── AuditLog.js                # Audit log model
├── middleware/
│   └── auth.js                    # checkPermission middleware + getUserPermissions
├── utils/
│   └── auditLogger.js             # Audit logging utilities
├── scripts/
│   └── seedRoles.js               # Role seeding and migration script
├── routes/
│   ├── problems.js                # Updated with permission checks
│   ├── roles.js                   # Updated to use database roles
│   ├── reports.js                 # Updated with permission checks
│   ├── analytics.js               # Updated with permission checks
│   ├── adminSettings.js           # Updated with permission checks
│   └── auth.js                    # Updated with permission checks
└── controllers/
    └── authController.js          # Updated to populate roleId and return permissions
```

### Frontend
```
frontend/src/
├── components/
│   ├── PermissionGuard.jsx        # Permission-based conditional rendering
│   ├── SuperAdminDashboard.jsx    # Navigation with permission guards
│   └── ClientDashboard.jsx        # Navigation with permission guards
├── context/
│   └── AuthContext.jsx            # hasPermission utilities
└── pages/admin/
    ├── ProblemsPage.jsx           # Action buttons with permission guards
    ├── UsersPage.jsx              # Action buttons with permission guards
    └── RolesPermissionsPage.jsx   # Action buttons with permission guards
```

## Usage Examples

### Backend: Protecting Routes

```javascript
const { authenticate, checkPermission } = require('../middleware/auth');

// Single permission
router.post('/problems', 
  authenticate, 
  checkPermission('create:problems'), 
  createProblem
);

// Multiple permissions (OR logic - user needs ANY of these)
router.get('/admin/dashboard', 
  authenticate, 
  checkPermission('view:analytics', 'view:reports'), 
  getAdminDashboard
);
```

### Frontend: Conditional Rendering

```jsx
import PermissionGuard from '../components/PermissionGuard';

// Single permission
<PermissionGuard permission="create:problems">
  <button>Create Problem</button>
</PermissionGuard>

// Multiple permissions (OR logic - show if user has ANY)
<PermissionGuard permissions={["update:problems", "delete:problems"]}>
  <button>Manage Problem</button>
</PermissionGuard>

// Multiple permissions (AND logic - show if user has ALL)
<PermissionGuard 
  permissions={["update:problems", "delete:problems"]} 
  requireAll={true}
>
  <button>Full Problem Access</button>
</PermissionGuard>

// With fallback
<PermissionGuard 
  permission="view:reports" 
  fallback={<p>You don't have access to reports.</p>}
>
  <ReportsComponent />
</PermissionGuard>
```

### Frontend: Using Permission Hooks

```jsx
import useAuth from '../hooks/useAuth';

function MyComponent() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();
  
  // Check single permission
  if (hasPermission('create:problems')) {
    // Show create button
  }
  
  // Check if user has any of multiple permissions
  if (hasAnyPermission('update:problems', 'delete:problems')) {
    // Show manage buttons
  }
  
  // Check if user has all permissions
  if (hasAllPermissions('read:problems', 'create:problems', 'update:problems')) {
    // Show full problem management
  }
}
```

## Setup & Deployment

### 1. Run Role Seeding Script

```bash
cd backend
node scripts/seedRoles.js
```

This will:
- Create default roles in the database
- Migrate existing users to the new role system
- Display a summary of created roles

### 2. Verify Database

Check MongoDB to ensure roles are created:

```javascript
db.roles.find()
```

Expected output:
- 4 roles: superadmin, client, moderator, content-creator
- Each with appropriate permissions

### 3. Test Permissions

1. **Login as superadmin:**
   - Should see all navigation items
   - Should have all action buttons visible
   - Can create, edit, delete everything

2. **Login as client:**
   - Should see limited navigation (Home, Practice, Mentor, Interview, Analytics, Achievements)
   - Cannot see admin features

3. **Create a custom role (as superadmin):**
   - Go to Roles & Permissions page
   - Create role with specific permissions
   - Assign to a user
   - Test that user can only access permitted features

## Migration Guide

### For Existing Users

All existing users have been automatically migrated:
- Users with `role: 'superadmin'` → assigned to superadmin Role document
- Users with `role: 'client'` → assigned to client Role document
- Old `role` string field maintained for backward compatibility
- New `roleId` field populated with Role document reference

### Backward Compatibility

The system maintains backward compatibility:
- If `roleId` exists, permissions are loaded from Role document
- If `roleId` is null, fallback to old role string
- Permissions are computed in this order:
  1. Role permissions (from roleId)
  2. User-specific permission overrides
  3. Fallback to default role permissions

## Security Considerations

### 1. **System Roles Protected**
- superadmin and client roles cannot be deleted
- superadmin role cannot have permissions modified
- Prevents accidental lockout

### 2. **Permission Validation**
- All API routes validate permissions server-side
- Frontend guards are for UX only, not security
- Never trust client-side permission checks

### 3. **Audit Trail**
- All permission checks are logged
- Track who accessed what and when
- Useful for security investigations

### 4. **Role Assignment**
- Only users with `manage:users` permission can assign roles
- Users cannot change their own role
- Role changes are audited

## API Endpoints

### Role Management

```
GET    /api/roles              # Get all roles (requires manage:roles)
POST   /api/roles              # Create role (requires manage:roles)
PUT    /api/roles/:id          # Update role (requires manage:roles)
DELETE /api/roles/:id          # Delete role (requires manage:roles)
GET    /api/roles/permissions  # Get available permissions (requires manage:roles)
```

### User Management

```
PUT    /api/auth/users/:id     # Update user (requires manage:users)
DELETE /api/auth/users/:id     # Delete user (requires manage:users)
```

## Troubleshooting

### Problem: User shows no permissions

**Solution:**
1. Check if user has `roleId` populated: `db.users.findOne({email: "user@email.com"})`
2. If `roleId` is null, run migration: `node scripts/seedRoles.js`
3. Verify role has permissions: `db.roles.findOne({_id: roleId})`

### Problem: Permission denied errors

**Solution:**
1. Check user's permissions in response: Login API returns `permissions` array
2. Verify required permission matches exactly (case-sensitive)
3. Check if route requires multiple permissions (all vs any)

### Problem: Navigation items not showing

**Solution:**
1. Check browser console for errors
2. Verify `PermissionGuard` is imported correctly
3. Ensure user object has `permissions` array populated
4. Clear localStorage and re-login to refresh user data

## Future Enhancements

1. **Permission Groups:** Bundle related permissions for easier role creation
2. **Time-Based Permissions:** Grant temporary access that expires
3. **Resource-Specific Permissions:** e.g., "edit own problems only"
4. **Permission Inheritance:** Parent-child role relationships
5. **Advanced Audit Dashboard:** UI for viewing audit logs with filters
6. **Role Templates:** Pre-configured role templates for common use cases

## Testing Checklist

- [ ] Superadmin can see all features
- [ ] Client can only see allowed features  
- [ ] Custom role works with assigned permissions
- [ ] Creating problem requires `create:problems`
- [ ] Editing problem requires `update:problems`
- [ ] Deleting problem requires `delete:problems`
- [ ] User management requires `manage:users`
- [ ] Role management requires `manage:roles`
- [ ] Unauthorized access returns 403
- [ ] Navigation items hidden without permission
- [ ] Action buttons hidden without permission
- [ ] Audit logs are created for actions
- [ ] Migration script runs successfully
- [ ] System roles cannot be deleted

## Support

For issues or questions:
1. Check error logs in terminal/browser console
2. Verify database state
3. Review audit logs for permission denials
4. Ensure roles are seeded properly
