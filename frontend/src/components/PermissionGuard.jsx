import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * PermissionGuard - Component to conditionally render children based on user permissions
 * 
 * Usage:
 * <PermissionGuard permission="create:problems">
 *   <button>Create Problem</button>
 * </PermissionGuard>
 * 
 * <PermissionGuard permissions={["update:problems", "delete:problems"]} requireAll={false}>
 *   <button>Manage Problems</button>
 * </PermissionGuard>
 */

export const PermissionGuard = ({ 
  permission, 
  permissions, 
  requireAll = false, 
  fallback = null,
  children 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useContext(AuthContext);

  let hasAccess = false;

  // Single permission check
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Multiple permissions check
  else if (permissions && Array.isArray(permissions)) {
    if (requireAll) {
      // User must have ALL permissions
      hasAccess = hasAllPermissions(...permissions);
    } else {
      // User must have ANY of the permissions
      hasAccess = hasAnyPermission(...permissions);
    }
  }

  // Render children if user has access, otherwise render fallback
  return hasAccess ? children : fallback;
};

export default PermissionGuard;
