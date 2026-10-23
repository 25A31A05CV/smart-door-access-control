import { AccessLog, CollegeUser, LocationId, LOCATIONS, AttendanceSummaryStats, UserRole } from '../types';

export interface AccessValidationResult {
  allowed: boolean;
  reason: string;
}

/**
 * Validates whether a user can pass through a specific college door.
 */
export function validateAccess(
  user: CollegeUser | null | undefined,
  locationId: LocationId,
  direction: 'ENTRY' | 'EXIT' = 'ENTRY'
): AccessValidationResult {
  if (!user) {
    return {
      allowed: false,
      reason: 'Unregistered ID Card or Unrecognized Face Scan',
    };
  }

  if (user.status === 'SUSPENDED') {
    return {
      allowed: false,
      reason: `Access Revoked: ID [${user.rollNumber}] is currently suspended by administration`,
    };
  }

  // Location-specific permission check
  const hasLocationPermission = Boolean(user.permissions && user.permissions[locationId]);

  if (direction === 'ENTRY') {
    if (!hasLocationPermission) {
      const locationName = LOCATIONS[locationId]?.name || locationId;
      return {
        allowed: false,
        reason: `Restricted Area: Missing access permission for ${locationName}`,
      };
    }

    return {
      allowed: true,
      reason: `Authorized: Access Granted for ${user.name} (${user.rollNumber})`,
    };
  }

  // EXIT direction
  return {
    allowed: true,
    reason: `Exit Clearance Confirmed: ${user.name} checked out`,
  };
}

/**
 * Calculates real-time dashboard attendance counters and analytics.
 */
export function calculateAttendanceStats(
  users: CollegeUser[],
  logs: AccessLog[],
  dateFilterIsoPrefix?: string
): AttendanceSummaryStats {
  const targetDatePrefix = dateFilterIsoPrefix || new Date().toISOString().slice(0, 10);

  const students = users.filter((u) => u.role === 'Student');
  const facultyAndStaff = users.filter((u) => u.role !== 'Student');

  // Logs for today
  const todayLogs = logs.filter((log) => log.timestamp.startsWith(targetDatePrefix));

  // Users currently inside campus (can be determined from user status or latest gate entry without exit)
  const currentInsideCount = users.filter((u) => u.isInsideCampus).length;
  
  // Exits today
  const currentExitCount = todayLogs.filter((l) => l.direction === 'EXIT' && l.status === 'GRANTED').length;

  // Set of user IDs who have logged at least one GRANTED entry today
  const presentUserIds = new Set<string>();
  todayLogs.forEach((log) => {
    if (log.status === 'GRANTED' && log.direction === 'ENTRY') {
      presentUserIds.add(log.userId);
    }
  });

  const totalPresentToday = presentUserIds.size;
  const totalEnrolledStudents = students.length;
  const totalAbsentToday = Math.max(0, totalEnrolledStudents - Array.from(presentUserIds).filter((id) => {
    const u = users.find((usr) => usr.id === id);
    return u?.role === 'Student';
  }).length);

  const gateEntriesToday = todayLogs.filter((l) => l.location === 'gate' && l.status === 'GRANTED').length;
  const labEntriesToday = todayLogs.filter((l) => l.location === 'lab' && l.status === 'GRANTED').length;
  const libraryEntriesToday = todayLogs.filter((l) => l.location === 'library' && l.status === 'GRANTED').length;
  const hostelEntriesToday = todayLogs.filter((l) => l.location === 'hostel' && l.status === 'GRANTED').length;

  const attendanceRate = totalEnrolledStudents > 0 
    ? Math.min(100, Math.round((totalPresentToday / (totalEnrolledStudents + facultyAndStaff.length)) * 100))
    : 0;

  return {
    totalEnrolledStudents,
    totalFacultyAndStaff: facultyAndStaff.length,
    currentInsideCount,
    currentExitCount,
    totalPresentToday,
    totalAbsentToday,
    todayLogsCount: todayLogs.length,
    gateEntriesToday,
    labEntriesToday,
    libraryEntriesToday,
    hostelEntriesToday,
    attendanceRate,
  };
}

/**
 * Filter users based on query (rollNumber, name, department, role)
 */
export function filterUsers(
  users: CollegeUser[],
  searchQuery: string,
  departmentFilter: string = 'ALL',
  roleFilter: string = 'ALL'
): CollegeUser[] {
  const query = searchQuery.trim().toLowerCase();

  return users.filter((user) => {
    const matchesSearch =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.rollNumber.toLowerCase().includes(query) ||
      user.rfidCardId.toLowerCase().includes(query) ||
      user.department.toLowerCase().includes(query);

    const matchesDept = departmentFilter === 'ALL' || user.department === departmentFilter;
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;

    return matchesSearch && matchesDept && matchesRole;
  });
}
