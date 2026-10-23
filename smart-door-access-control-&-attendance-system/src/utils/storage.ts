import { CollegeUser, AccessLog, AdminCredential, JavaBridgePacket, LocationId } from '../types';
import { INITIAL_ADMINS, INITIAL_USERS, generateInitialLogs } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'college_access_users_v2',
  LOGS: 'college_access_logs_v2',
  ADMINS: 'college_access_admins_v2',
  CURRENT_ADMIN: 'college_access_current_admin_v2',
};

export function getStoredAdmins(): AdminCredential[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMINS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
      return INITIAL_ADMINS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading admins from localStorage', e);
    return INITIAL_ADMINS;
  }
}

export function saveStoredAdmins(admins: AdminCredential[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
  } catch (e) {
    console.error('Failed saving admins to localStorage', e);
  }
}

export function getCurrentAdmin(): AdminCredential | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_ADMIN);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentAdmin(admin: AdminCredential | null): void {
  try {
    if (admin) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ADMIN, JSON.stringify(admin));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_ADMIN);
    }
  } catch (e) {
    console.error('Failed saving session admin', e);
  }
}

export function getStoredUsers(): CollegeUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading users from localStorage', e);
    return INITIAL_USERS;
  }
}

export function saveStoredUsers(users: CollegeUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Failed saving users to localStorage', e);
  }
}

export function getStoredLogs(): AccessLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) {
      const initialUsers = getStoredUsers();
      const logs = generateInitialLogs(initialUsers);
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
      return logs;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading logs from localStorage', e);
    return [];
  }
}

export function saveStoredLogs(logs: AccessLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed saving logs to localStorage', e);
  }
}

export function resetToDefaults(): { users: CollegeUser[]; logs: AccessLog[]; admins: AdminCredential[] } {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
  const logs = generateInitialLogs(INITIAL_USERS);
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(INITIAL_ADMINS));
  return { users: INITIAL_USERS, logs, admins: INITIAL_ADMINS };
}

// Generate realistic simulated Java Hardware Bridge socket packet for relays
export function createJavaTelemetryPacket(
  location: LocationId,
  status: 'OPEN' | 'CLOSED' | 'LOCK_ERROR',
  cardHex: string
): JavaBridgePacket {
  const ports: Record<LocationId, number> = {
    gate: 8081,
    lab: 8082,
    library: 8083,
    hostel: 8084,
  };

  return {
    timestamp: new Date().toISOString(),
    socketPort: ports[location],
    protocol: 'TCP/IP Socket',
    deviceAddress: `192.168.10.${ports[location] - 8000}`,
    relayStatus: status,
    pulseDurationMs: status === 'OPEN' ? 3500 : 0,
    cardUidHex: cardHex || 'E2:80:68:1B',
    baudRate: 115200,
    rawPayload: `[JAVA_IO_SERVER] ACK RELAY_PIN_TRIG=${location.toUpperCase()} STATUS=${status} CRC32=0x9A4F`,
  };
}
