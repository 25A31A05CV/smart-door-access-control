import React, { useState } from 'react';
import {
  Cpu,
  Terminal,
  Activity,
  Code2,
  Send,
  CheckCircle2,
  Radio,
  Zap,
  Server,
  Database,
  Lock,
  Unlock,
  Copy,
  Check,
} from 'lucide-react';
import { LocationId, LOCATIONS } from '../types';
import { playRelayClickSound, playAccessGrantedSound } from '../utils/audio';

interface JavaHardwareBridgeViewProps {
  onManualTriggerRelay: (locId: LocationId) => void;
  doorRelays: Record<LocationId, { isUnlocked: boolean; lastTriggered: string | null }>;
}

export const JavaHardwareBridgeView: React.FC<JavaHardwareBridgeViewProps> = ({
  onManualTriggerRelay,
  doorRelays,
}) => {
  const [selectedSnippet, setSelectedSnippet] = useState<'socket' | 'relay' | 'dao'>('socket');
  const [copied, setCopied] = useState(false);
  const [commandInput, setCommandInput] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[JVM_BOOT] OpenJDK 64-Bit Server VM (build 21.0.2+13) initialized.',
    '[JAVA_NET] ServerSocket bound to 0.0.0.0:8081 (Campus Relay Controller Master).',
    '[COMM_SERIAL] Connected to /dev/ttyUSB0 @ 115200 baud, 8N1 parity.',
    '[HARDWARE] Solenoid relays CH1..CH4 initialized in normally-closed (NC) fail-secure state.',
    '[SECURITY] Biometric Face recognition & RFID verification engine ready.',
    '[LISTENER] Polling for RC522 RFID Card UID & Face Descriptor packets...',
  ]);

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput.trim();
    setConsoleLogs((prev) => [
      ...prev,
      `[CLIENT_CLI] > ${cmd}`,
      `[JVM_DISPATCH] Executing Java Reflection Method: dispatchCommand("${cmd}")`,
      `[STATUS_ACK] 200 OK - Relay telemetry synchronized.`,
    ]);
    setCommandInput('');
  };

  const javaCodeSnippets = {
    socket: `/**
 * Java Socket Server for Smart Door Access & Attendance
 * College Project Implementation: St. Augustine Institute
 */
package edu.college.access.controller;

import java.io.*;
import java.net.*;
import java.sql.Timestamp;

public class DoorAccessServer {
    private static final int PORT = 8081;
    private final RelayController relayController;
    private final AttendanceDatabaseDao attendanceDao;

    public DoorAccessServer() {
        this.relayController = new RelayController();
        this.attendanceDao = new AttendanceDatabaseDao();
    }

    public void startServer() throws IOException {
        try (ServerSocket serverSocket = new ServerSocket(PORT)) {
            System.out.println("[JAVA_SERVER] Running on port " + PORT + "...");
            while (true) {
                Socket clientSocket = serverSocket.accept();
                new Thread(new ClientHandler(clientSocket)).start();
            }
        }
    }

    private class ClientHandler implements Runnable {
        private final Socket socket;
        ClientHandler(Socket s) { this.socket = s; }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                 PrintWriter out = new PrintWriter(socket.getOutputStream(), true)) {
                
                String rfidUid = in.readLine();
                String locationCode = in.readLine();
                System.out.println("[JAVA_EVENT] Scanned RFID: " + rfidUid + " at Door: " + locationCode);

                boolean authorized = attendanceDao.verifyPermission(rfidUid, locationCode);
                if (authorized) {
                    relayController.pulseRelay(locationCode, 3500); // 3.5 sec unlock
                    attendanceDao.recordAttendance(rfidUid, locationCode, "ENTRY", "PRESENT");
                    out.println("STATUS=GRANTED;RELAY=ACTIVE;TIMESTAMP=" + new Timestamp(System.currentTimeMillis()));
                } else {
                    attendanceDao.recordAttendance(rfidUid, locationCode, "ENTRY", "DENIED");
                    out.println("STATUS=DENIED;RELAY=LOCKED;REASON=RESTRICTED_ZONE");
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}`,
    relay: `/**
 * Java Physical Solenoid Relay Driver (Serial / GPIO via Pi4J)
 */
package edu.college.access.controller;

public class RelayController {
    // GPIO / RS485 Relay Mapping
    private static final int PIN_MAIN_GATE = 17;
    private static final int PIN_COMP_LAB = 27;
    private static final int PIN_LIBRARY = 22;
    private static final int PIN_HOSTEL = 23;

    public synchronized void pulseRelay(String doorCode, int durationMs) {
        int pin = resolvePin(doorCode);
        System.out.println("[JAVA_IO] Triggering GPIO Pin " + pin + " (HIGH - Unlocked) for " + durationMs + "ms");
        
        // Trigger hardware relay solenoid
        try {
            // Simulated native relay pulse
            Thread.sleep(durationMs);
        } catch (InterruptedException ignored) {}

        System.out.println("[JAVA_IO] Reverting GPIO Pin " + pin + " (LOW - Locked)");
    }

    private int resolvePin(String code) {
        switch (code.toUpperCase()) {
            case "GATE-01": return PIN_MAIN_GATE;
            case "LAB-302": return PIN_COMP_LAB;
            case "LIB-CENTRAL": return PIN_LIBRARY;
            case "HOSTEL-NORTH": return PIN_HOSTEL;
            default: return PIN_MAIN_GATE;
        }
    }
}`,
    dao: `/**
 * Java JDBC DAO for Attendance Persistence & Role Permissions
 */
package edu.college.access.controller;

import java.sql.*;

public class AttendanceDatabaseDao {
    private static final String DB_URL = "jdbc:sqlite:college_access.db";

    public boolean verifyPermission(String rfidUid, String locationCode) throws SQLException {
        String sql = "SELECT p.granted FROM user_permissions p " +
                     "JOIN students s ON s.id = p.student_id " +
                     "WHERE s.rfid_card_id = ? AND p.location_code = ? AND s.status = 'ACTIVE'";
        
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, rfidUid);
            stmt.setString(2, locationCode);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getBoolean("granted");
            }
        }
    }
}`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(javaCodeSnippets[selectedSnippet]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerTestPulse = (locId: LocationId) => {
    playRelayClickSound();
    playAccessGrantedSound();
    onManualTriggerRelay(locId);
    setConsoleLogs((prev) => [
      ...prev,
      `[MANUAL_OVERRIDE] Java Relay Controller PULSE triggered for ${LOCATIONS[locId].name} (${LOCATIONS[locId].doorRelayChannel})`,
      `[GPIO_IO] Solenoid relay opened. Auto-relock scheduled in 3500ms.`,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8E2D5] text-[#58111A] text-xs font-bold mb-2">
            <Cpu className="w-3.5 h-3.5 text-[#722F37]" />
            <span>Java IoT & Hardware Controller Bridge</span>
          </div>
          <h1 className="text-xl font-bold text-[#2D2A26]">
            Java Academic Project Integration Terminal
          </h1>
          <p className="text-xs text-[#6B655D] mt-1">
            Simulates the backend Java Socket server, RS485 serial communication, and solenoid relay GPIO pulse control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>JVM 21 Socket :8081 [CONNECTED]</span>
          </span>
        </div>
      </div>

      {/* HARDWARE RELAYS TEST TRIGGER MATRIX */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E2DACB]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#2D2A26] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#722F37]" />
              <span>Manual Solenoid Relay Diagnostic Triggers</span>
            </h2>
            <p className="text-xs text-[#6B655D]">Send raw pulse commands to verify door lock hardware actuators</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(LOCATIONS) as LocationId[]).map((locId) => {
            const loc = LOCATIONS[locId];
            const isUnlocked = doorRelays[locId]?.isUnlocked;

            return (
              <div
                key={locId}
                className={`p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-emerald-50 border-emerald-300'
                    : 'bg-[#FAF8F5] border-[#E8E2D5]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#722F37]">{loc.code}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isUnlocked ? 'bg-emerald-200 text-emerald-900 animate-pulse' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isUnlocked ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-[#2D2A26]">{loc.name}</h3>
                <p className="text-[10px] text-[#7A7368] font-mono mt-1">{loc.doorRelayChannel}</p>

                <button
                  type="button"
                  onClick={() => triggerTestPulse(locId)}
                  disabled={isUnlocked}
                  className="mt-3 w-full py-2 rounded-lg bg-[#722F37] hover:bg-[#58111A] disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isUnlocked ? <Unlock className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                  <span>{isUnlocked ? 'Pulse Active...' : 'Send Pulse Test'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONSOLE PACKET STREAM & JAVA CODE VIEWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Cols: Live JVM Console Packet Stream */}
        <div className="lg:col-span-6 bg-[#2D2A26] rounded-2xl p-5 shadow-lg border border-[#443F3A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#443F3A] mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-[#F5F2EB]">
                  Java Socket Daemon Console (Standard Output)
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#A89F91]">Port: 8081 TCP</span>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-[#E8E2D5] max-h-80 overflow-y-auto p-2 bg-[#1F1D1B] rounded-xl border border-[#3D3833]">
              {consoleLogs.map((log, index) => (
                <div
                  key={index}
                  className={`${
                    log.includes('GRANTED') || log.includes('HIGH') || log.includes('OK')
                      ? 'text-emerald-400'
                      : log.includes('DENIED')
                      ? 'text-rose-400'
                      : log.includes('CLIENT')
                      ? 'text-amber-300'
                      : 'text-[#C7BEB0]'
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendCommand} className="mt-4 pt-3 border-t border-[#443F3A] flex gap-2">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="e.g. GET_RELAY_STATUS --door=GATE-01"
              className="flex-1 px-3 py-1.5 rounded-lg bg-[#1F1D1B] border border-[#443F3A] text-xs font-mono text-white placeholder-[#7A7368] focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>

        {/* Right 6 Cols: Java Source Code Snippets for College Evaluation */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 shadow-sm border border-[#E2DACB] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-[#722F37]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#2D2A26]">
                  Java Project Source Code Reference
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#58111A] hover:text-[#722F37] cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Java Code'}</span>
              </button>
            </div>

            {/* Code Selector Tabs */}
            <div className="flex gap-2 mb-3">
              {[
                { id: 'socket' as const, label: 'DoorAccessServer.java' },
                { id: 'relay' as const, label: 'RelayController.java' },
                { id: 'dao' as const, label: 'AttendanceDatabaseDao.java' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSnippet(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    selectedSnippet === tab.id
                      ? 'bg-[#722F37] text-white shadow-xs'
                      : 'bg-[#FAF8F5] text-[#58111A] border border-[#DDD5C7] hover:bg-[#E8E2D5]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#DDD5C7] max-h-72 overflow-y-auto font-mono text-[11px] text-[#2D2A26] leading-relaxed whitespace-pre">
              {javaCodeSnippets[selectedSnippet]}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#7A7368]">
            <span>Target Architecture: Spring Boot / Java SE + Raspberry Pi GPIO + Solenoid</span>
            <span className="font-semibold text-[#58111A]">St. Augustine College Project</span>
          </div>
        </div>
      </div>
    </div>
  );
};
