export type LocationId = 'gate' | 'lab' | 'library' | 'hostel';

export type UserRole = 'Student' | 'Faculty' | 'Staff';

export interface LocationInfo {
  id: LocationId;
  name: string;
  code: string;
  description: string;
  doorRelayChannel: string;
  building: string;
}

export const LOCATIONS: Record<LocationId, LocationInfo> = {
  gate: {
    id: 'gate',
    name: 'Main College Gate Entrance',
    code: 'GATE-01',
    description: 'Campus perimeter primary turnstile and vehicle boom barrier',
    doorRelayChannel: 'RELAY-CH1 [GPIO_17]',
    building: 'Campus Perimeter',
  },
  lab: {
    id: 'lab',
    name: 'Computer Lab Access',
    code: 'LAB-302',
    description: 'High-performance computing laboratory & server room',
    doorRelayChannel: 'RELAY-CH2 [GPIO_27]',
    building: 'CS Block, 3rd Floor',
  },
  library: {
    id: 'library',
    name: 'Central Library Access',
    code: 'LIB-CENTRAL',
    description: 'Main study halls, digital archive & reference section',
    doorRelayChannel: 'RELAY-CH3 [GPIO_22]',
    building: 'Knowledge Center',
  },
  hostel: {
    id: 'hostel',
    name: 'Hostel Entrance',
    code: 'HOSTEL-NORTH',
    description: 'Residential campus student dormitories & dining hall',
    doorRelayChannel: 'RELAY-CH4 [GPIO_23]',
    building: 'North Campus Residency',
  },
};

export interface UserPermissions {
  gate: boolean;
  lab: boolean;
  library: boolean;
  hostel: boolean;
}

export interface CollegeUser {
  id: string;
  name: string;
  rollNumber: string; // Roll number or Faculty ID
  role: UserRole;
  department: string;
  yearOrDesignation: string;
  email: string;
  phone: string;
  photoUrl: string;
  rfidCardId: string;
  barcode: string;
  permissions: UserPermissions;
  status: 'ACTIVE' | 'SUSPENDED';
  isInsideCampus: boolean;
  currentLocation: LocationId | null;
  registeredAt: string;
}

export interface AccessLog {
  id: string;
  userId: string;
  userName: string;
  rollNumber: string;
  role: UserRole;
  department: string;
  photoUrl: string;
  location: LocationId;
  locationName: string;
  direction: 'ENTRY' | 'EXIT';
  status: 'GRANTED' | 'DENIED';
  reason: string;
  timestamp: string; // ISO string
  verificationMethod: 'FACE_RECOGNITION' | 'RFID_CARD' | 'BARCODE' | 'MANUAL';
  doorRelayTriggered: boolean;
}

export interface AttendanceSummaryStats {
  totalEnrolledStudents: number;
  totalFacultyAndStaff: number;
  currentInsideCount: number;
  currentExitCount: number;
  totalPresentToday: number;
  totalAbsentToday: number;
  todayLogsCount: number;
  gateEntriesToday: number;
  labEntriesToday: number;
  libraryEntriesToday: number;
  hostelEntriesToday: number;
  attendanceRate: number; // percentage
}

export interface AdminCredential {
  username: string;
  passwordHash: string; // or plain text for stored demo admin
  fullName: string;
  designation: string;
  role: 'Super Administrator' | 'Chief Warden' | 'Security Officer';
  lastLogin: string;
}

export interface JavaBridgePacket {
  timestamp: string;
  socketPort: number;
  protocol: 'TCP/IP Socket' | 'MQTT' | 'RS485 Serial';
  deviceAddress: string;
  relayStatus: 'OPEN' | 'CLOSED' | 'LOCK_ERROR';
  pulseDurationMs: number;
  cardUidHex: string;
  baudRate: number;
  rawPayload: string;
}
