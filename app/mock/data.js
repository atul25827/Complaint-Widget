/**
 * mock/data.js
 * ─────────────────────────────────────────────
 * Mock data mirroring the CRM schema.
 *
 * Data relationships:
 *   Product  ──1:N──  Complaint Category   (via Product Master lookup)
 *   Complaint Category  ──1:N──  Solution   (via Complaint Name lookup)
 *
 * When real CRM APIs are integrated, this file is simply no longer imported.
 */

// ── Mock context passed from CRM record page ────────────────────────
export const MOCK_RECORD_CONTEXT = Object.freeze({
  recordId:    'REC001',
  productId:   'PROD001',
  productName: 'Samsung AC',
});

// ── Product → Complaint Category mapping ────────────────────────────
export const COMPLAINT_CATEGORIES = Object.freeze({
  PROD001: [
    { id: 'CMP001', name: 'Cooling Issue' },
    { id: 'CMP002', name: 'Water Leakage' },
    { id: 'CMP003', name: 'Power Issue' },
    { id: 'CMP004', name: 'Noise Problem' },
    { id: 'CMP005', name: 'Remote Control Malfunction' },
    { id: 'CMP006', name: 'Installation Defect' },
  ],
  PROD002: [
    { id: 'CMP010', name: 'Heating Failure' },
    { id: 'CMP011', name: 'Thermostat Error' },
  ],
});

// ── Complaint → Solution mapping ────────────────────────────────────
export const COMPLAINT_SOLUTIONS = Object.freeze({
  CMP001: [
    { id: 'SOL001', name: 'Compressor Reset' },
    { id: 'SOL002', name: 'Gas Refill' },
    { id: 'SOL003', name: 'Cooling Calibration' },
  ],
  CMP002: [
    { id: 'SOL004', name: 'Drain Pipe Cleaning' },
    { id: 'SOL005', name: 'Seal Replacement' },
    { id: 'SOL006', name: 'Tray Realignment' },
  ],
  CMP003: [
    { id: 'SOL007', name: 'PCB Replacement' },
    { id: 'SOL008', name: 'Wiring Fix' },
    { id: 'SOL009', name: 'Voltage Stabilizer Install' },
  ],
  CMP004: [
    { id: 'SOL010', name: 'Fan Motor Lubrication' },
    { id: 'SOL011', name: 'Blade Replacement' },
  ],
  CMP005: [
    { id: 'SOL012', name: 'IR Sensor Repair' },
    { id: 'SOL013', name: 'Battery Replacement' },
    { id: 'SOL014', name: 'Remote Re-pairing' },
  ],
  CMP006: [
    { id: 'SOL015', name: 'Bracket Reinstallation' },
    { id: 'SOL016', name: 'Piping Correction' },
  ],
  CMP010: [
    { id: 'SOL017', name: 'Heating Element Swap' },
  ],
  CMP011: [
    { id: 'SOL018', name: 'Thermostat Recalibration' },
    { id: 'SOL019', name: 'Sensor Replacement' },
  ],
});
