const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry
 * @param {Object} logData - The audit log data
 * @param {String} logData.userId - User ID
 * @param {String} logData.username - Username
 * @param {String} logData.action - Action performed
 * @param {String} logData.resourceType - Type of resource
 * @param {String} logData.resourceId - Resource ID (optional)
 * @param {Object} logData.details - Additional details (optional)
 * @param {String} logData.status - Status (success/failure/denied)
 * @param {String} logData.ipAddress - IP address (optional)
 * @param {String} logData.userAgent - User agent (optional)
 */
const createAuditLog = async (logData) => {
  try {
    await AuditLog.create({
      userId: logData.userId,
      username: logData.username,
      action: logData.action,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId || null,
      details: logData.details || {},
      status: logData.status,
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to prevent breaking the main flow
  }
};

/**
 * Middleware to log permission checks
 */
const logPermissionCheck = (action, resourceType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log after response is sent
      if (req.user) {
        const status = res.statusCode === 200 ? 'success' : 
                      res.statusCode === 403 ? 'denied' : 'failure';
        
        createAuditLog({
          userId: req.user._id,
          username: req.user.username,
          action: action,
          resourceType: resourceType,
          resourceId: req.params.id || null,
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode
          },
          status: status,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Get audit logs with filtering
 * @param {Object} filters - Filter options
 * @param {Number} limit - Number of logs to return
 * @param {Number} skip - Number of logs to skip
 */
const getAuditLogs = async (filters = {}, limit = 50, skip = 0) => {
  try {
    const query = {};
    
    if (filters.userId) query.userId = filters.userId;
    if (filters.action) query.action = filters.action;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.status) query.status = filters.status;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('userId', 'username email role')
      .lean();
    
    const total = await AuditLog.countDocuments(query);
    
    return {
      logs,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
};

module.exports = {
  createAuditLog,
  logPermissionCheck,
  getAuditLogs
};
