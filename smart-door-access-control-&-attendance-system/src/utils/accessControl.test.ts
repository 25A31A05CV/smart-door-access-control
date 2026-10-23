import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAccess, calculateAttendanceStats, filterUsers } from './accessControl';
import { CollegeUser, AccessLog } from '../types';

const mockStudent: CollegeUser = {
  id: 'usr-1',
  name: 'Aarav Sharma',
  rollNumber: '2024CS101',
  role: 'Student',
  department: 'Computer Science',
  yearOrDesignation: '3rd Year',
  email: 'aarav.sharma@college.edu',
  phone: '+91 98765 43210',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
  rfidCardId: 'RFID-CS-8891',
  barcode: '8901234567891',
  permissions: {
    gate: true,
    lab: true,
    library: true,
    hostel: false, // No hostel permission
  },
  status: 'ACTIVE',
  isInsideCampus: false,
  currentLocation: null,
  registeredAt: '2024-08-15T09:00:00Z',
};

const mockSuspendedStudent: CollegeUser = {
  ...mockStudent,
  id: 'usr-2',
  rollNumber: '2024CS102',
  status: 'SUSPENDED',
};

test('validateAccess allows active user with valid permission', () => {
  const result = validateAccess(mockStudent, 'lab', 'ENTRY');
  assert.equal(result.allowed, true);
  assert.match(result.reason, /Authorized/);
});

test('validateAccess blocks user without permission for specific location', () => {
  const result = validateAccess(mockStudent, 'hostel', 'ENTRY');
  assert.equal(result.allowed, false);
  assert.match(result.reason, /Restricted Area/);
});

test('validateAccess blocks suspended user even if permission is enabled', () => {
  const result = validateAccess(mockSuspendedStudent, 'gate', 'ENTRY');
  assert.equal(result.allowed, false);
  assert.match(result.reason, /Access Revoked/);
});

test('validateAccess handles null or unregistered user', () => {
  const result = validateAccess(null, 'gate', 'ENTRY');
  assert.equal(result.allowed, false);
  assert.match(result.reason, /Unregistered/);
});

test('calculateAttendanceStats aggregates live entries and counters correctly', () => {
  const users: CollegeUser[] = [
    { ...mockStudent, id: '1', role: 'Student', isInsideCampus: true },
    { ...mockStudent, id: '2', role: 'Student', isInsideCampus: false },
    { ...mockStudent, id: '3', role: 'Faculty', isInsideCampus: true },
  ];

  const todayIso = new Date().toISOString().slice(0, 10);
  const logs: AccessLog[] = [
    {
      id: 'log-1',
      userId: '1',
      userName: 'User 1',
      rollNumber: 'R1',
      role: 'Student',
      department: 'CS',
      photoUrl: '',
      location: 'gate',
      locationName: 'Main Gate',
      direction: 'ENTRY',
      status: 'GRANTED',
      reason: 'OK',
      timestamp: `${todayIso}T08:30:00Z`,
      verificationMethod: 'RFID_CARD',
      doorRelayTriggered: true,
    },
    {
      id: 'log-2',
      userId: '1',
      userName: 'User 1',
      rollNumber: 'R1',
      role: 'Student',
      department: 'CS',
      photoUrl: '',
      location: 'lab',
      locationName: 'Lab',
      direction: 'ENTRY',
      status: 'GRANTED',
      reason: 'OK',
      timestamp: `${todayIso}T09:15:00Z`,
      verificationMethod: 'FACE_RECOGNITION',
      doorRelayTriggered: true,
    },
    {
      id: 'log-3',
      userId: '3',
      userName: 'Faculty 1',
      rollNumber: 'FAC-01',
      role: 'Faculty',
      department: 'CS',
      photoUrl: '',
      location: 'gate',
      locationName: 'Main Gate',
      direction: 'ENTRY',
      status: 'GRANTED',
      reason: 'OK',
      timestamp: `${todayIso}T08:00:00Z`,
      verificationMethod: 'RFID_CARD',
      doorRelayTriggered: true,
    },
    {
      id: 'log-4',
      userId: '2',
      userName: 'User 2',
      rollNumber: 'R2',
      role: 'Student',
      department: 'CS',
      photoUrl: '',
      location: 'hostel',
      locationName: 'Hostel',
      direction: 'EXIT',
      status: 'GRANTED',
      reason: 'OK',
      timestamp: `${todayIso}T07:45:00Z`,
      verificationMethod: 'RFID_CARD',
      doorRelayTriggered: true,
    },
  ];

  const stats = calculateAttendanceStats(users, logs, todayIso);
  assert.equal(stats.totalEnrolledStudents, 2);
  assert.equal(stats.totalFacultyAndStaff, 1);
  assert.equal(stats.currentInsideCount, 2);
  assert.equal(stats.currentExitCount, 1);
  assert.equal(stats.totalPresentToday, 2); // User 1 and User 3
  assert.equal(stats.labEntriesToday, 1);
  assert.equal(stats.gateEntriesToday, 2);
});

test('filterUsers matches queries by roll number, department, and role', () => {
  const users: CollegeUser[] = [
    { ...mockStudent, id: '1', name: 'Rohan Gupta', rollNumber: '2024CS101', department: 'Computer Science', role: 'Student' },
    { ...mockStudent, id: '2', name: 'Dr. Neha Verma', rollNumber: 'FAC-ECE-01', department: 'Electronics', role: 'Faculty' },
  ];

  const csMatch = filterUsers(users, '2024CS', 'ALL', 'ALL');
  assert.equal(csMatch.length, 1);
  assert.equal(csMatch[0].name, 'Rohan Gupta');

  const facMatch = filterUsers(users, '', 'Electronics', 'Faculty');
  assert.equal(facMatch.length, 1);
  assert.equal(facMatch[0].rollNumber, 'FAC-ECE-01');
});
