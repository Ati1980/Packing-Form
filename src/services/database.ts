import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { InspectionRecord } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz0KDvCH2vcCtxvETw9XntJ4uFi1PyWOiaQAsSqA1iL3cpfuEuhgW8NyMO2Nbfbtsebog/exec";
const SHEET_ID = "1iSGxeBQx-LB0tNycfWo_xBQ6JLk_Dp8AGif0HkiPXBI";
const SHEET_NAME = "OEE_logs";
const CACHE_KEY = "am_records";
const CACHE_TIME_KEY = "am_records_last_sync";
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

const SEAL_CACHE_KEY = "am_seal_temp_records";
const FILM_CACHE_KEY = "am_film_roll_records";

const parseGvizDate = (val: any): string | null => {
  if (typeof val !== 'string') return null;
  const match = val.match(/^Date\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+),\s*(\d+)(?:,\s*(\d+))?)?\)$/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = match[4] ? parseInt(match[4], 10) : 0;
  const min = match[5] ? parseInt(match[5], 10) : 0;
  const sec = match[6] ? parseInt(match[6], 10) : 0;
  const d = new Date(year, month, day, hour, min, sec);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

const normalizeDateTime = (val: any): string => {
  if (!val) return new Date().toISOString();
  const gvizIso = parseGvizDate(val);
  if (gvizIso) return gvizIso;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
    if (ddmmyyyy) {
      let y = parseInt(ddmmyyyy[3], 10);
      if (y > 2400) y -= 543;
      const m = parseInt(ddmmyyyy[2], 10) - 1;
      const d = parseInt(ddmmyyyy[1], 10);
      const hh = ddmmyyyy[4] ? parseInt(ddmmyyyy[4], 10) : 0;
      const mm = ddmmyyyy[5] ? parseInt(ddmmyyyy[5], 10) : 0;
      const ss = ddmmyyyy[6] ? parseInt(ddmmyyyy[6], 10) : 0;
      const dt = new Date(y, m, d, hh, mm, ss);
      if (!isNaN(dt.getTime())) return dt.toISOString();
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date().toISOString();
};

const normalizeReportDate = (val: any, fallbackIso?: string): string => {
  const gvizIso = parseGvizDate(val);
  if (gvizIso) {
    const d = new Date(gvizIso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy) {
      let y = parseInt(ddmmyyyy[3], 10);
      if (y > 2400) y -= 543;
      return `${y}-${String(parseInt(ddmmyyyy[2], 10)).padStart(2, '0')}-${String(parseInt(ddmmyyyy[1], 10)).padStart(2, '0')}`;
    }
  }
  if (fallbackIso) {
    const d = new Date(fallbackIso);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
  }
  return new Date().toISOString().slice(0, 10);
};

const parseNumeric = (val: any, fallback: number): number => {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const cleaned = String(val).replace(/,/g, '').trim();
  if (!cleaned) return fallback;
  const n = Number(cleaned);
  return isNaN(n) ? fallback : n;
};

const pickField = (obj: any, keys: string[]): any => {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  const lowerMap = new Map<string, any>();
  Object.keys(obj).forEach(k => lowerMap.set(k.trim().toLowerCase(), obj[k]));
  for (const k of keys) {
    const v = lowerMap.get(k.trim().toLowerCase());
    if (v !== undefined && v !== null && v !== '') return v;
  }
  return undefined;
};

const makeDeterministicId = (prefix: string, idx: number, ...parts: any[]): string => {
  const raw = parts.map(p => String(p ?? '').trim()).join('|');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return `${prefix}_${idx}_${Math.abs(hash).toString(36)}`;
};

const isLegacyRandomSheetId = (id: string): boolean => /^[a-z0-9]{6,8}$/.test(id);

export const DatabaseService = {
  getLocalRecords(): InspectionRecord[] {
    try {
      const data = localStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error reading localStorage:", e);
      return [];
    }
  },

  setLocalRecords(records: InspectionRecord[]) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(records));
      localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
    } catch (e) {
      console.warn("Storage quota exceeded or disabled:", e);
    }
  },

  getLocalSealTempRecords(): InspectionRecord[] {
    try {
      const data = localStorage.getItem(SEAL_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setLocalSealTempRecords(records: InspectionRecord[]) {
    try {
      localStorage.setItem(SEAL_CACHE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn("Seal temp cache save error:", e);
    }
  },

  getLocalFilmRollRecords(): any[] {
    try {
      const data = localStorage.getItem(FILM_CACHE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setLocalFilmRollRecords(records: any[]) {
    try {
      localStorage.setItem(FILM_CACHE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn("Film roll cache save error:", e);
    }
  },

  async fetchGoogleSheetViaGViz(sheetId: string, sheetName?: string): Promise<any[]> {
    try {
      const sheetParam = sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : '';
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json${sheetParam}&_t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const text = await res.text();
      const match = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/s);
      if (match && match[1]) {
        const json = JSON.parse(match[1]);
        if (json.status === 'error') return [];
        const cols = (json.table?.cols || []).map((c: any) => c ? (c.label || c.id || '') : '');
        const rows = (json.table?.rows || []).map((row: any) => {
          const obj: any = {};
          if (row && row.c) {
            row.c.forEach((cell: any, i: number) => {
              const colName = cols[i] || `col_${i}`;
              if (!cell) {
                obj[colName] = null;
              } else {
                const rawVal = cell.v !== undefined && cell.v !== null ? cell.v : cell.f;
                const parsedDate = parseGvizDate(rawVal);
                obj[colName] = parsedDate || rawVal;
                if (cell.f && parsedDate) {
                  obj[`${colName}__formatted`] = cell.f;
                }
              }
            });
          }
          return obj;
        });
        return rows;
      }
    } catch (e) {
      console.warn("GViz fetch error:", e);
    }
    return [];
  },

  async fetchViaAppsScript(gasUrl: string, sheetId: string, sheetName: string): Promise<any[]> {
    try {
      const requestUrl = `${gasUrl}?action=getAllRecords&sheetId=${encodeURIComponent(sheetId)}&sheetName=${encodeURIComponent(sheetName)}&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });
      if (!res.ok) return [];
      const parsed = await res.json();
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.data)) return parsed.data;
      if (parsed && Array.isArray(parsed.records)) return parsed.records;
      if (parsed && Array.isArray(parsed.rows)) return parsed.rows;
    } catch (e) {
      console.warn(`Apps Script fetch error (${sheetName}):`, e);
    }
    return [];
  },

  async fetchRecords(forceRefresh = false): Promise<{ data: InspectionRecord[]; synced: boolean }> {
    const localData = this.getLocalRecords();
    let firestoreRecords: InspectionRecord[] = [];
    let sheetRecords: InspectionRecord[] = [];

    try {
      const q = query(collection(db, "oee_records"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        firestoreRecords = snapshot.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: String(d.id || doc.id),
            recordType: 'oee' as const,
            machine: d.machine || 'เครื่องบรรจุ 1Kg No.1',
            datetime: d.datetime || new Date().toISOString(),
            reportDate: d.reportDate || normalizeReportDate(d.datetime),
            shift: d.shift || 'A',
            shiftType: d.shiftType || '8h',
            operator: d.operator || '-',
            speed: Number(d.speed || 0),
            speedStd: Number(d.speedStd !== undefined && d.speedStd !== null ? d.speedStd : 34.67),
            speedSet: Number(d.speedSet !== undefined && d.speedSet !== null ? d.speedSet : 45.00),
            tempFront: null,
            tempFrontMin: null,
            tempFrontMax: null,
            tfStatus: 'pass',
            tempBack: null,
            tempBackMin: null,
            tempBackMax: null,
            tbStatus: 'pass',
            tempMid: null,
            tempMidMin: null,
            tempMidMax: null,
            tmStatus: 'pass',
            timeFrontBack: null,
            timeFrontBackMin: null,
            timeFrontBackMax: null,
            timeFbStatus: 'pass',
            timeMid: null,
            timeMidMin: null,
            timeMidMax: null,
            timeMStatus: 'pass',
            lot: 'pass',
            teflon: 'pass',
            packSealTop: 'pass',
            packSealMid: 'pass',
            packSealBot: 'pass',
            hole: 'pass',
            targetKg: Number(d.targetKg || 15000),
            actualKg: Number(d.actualKg || 12500),
            goodKg: Number(d.goodKg || 12500),
            rejectKg: Number(d.rejectKg || 0),
            breakdownMin: Number(d.breakdownMin || 0),
            notes: d.notes || ''
          };
        });
      }
    } catch (fsErr) {
      console.warn("Firestore fetch error:", fsErr);
    }

    try {
      let rawSheetRows = await this.fetchGoogleSheetViaGViz(SHEET_ID, SHEET_NAME);
      if (rawSheetRows.length === 0) {
        rawSheetRows = await this.fetchViaAppsScript(GAS_API_URL, SHEET_ID, SHEET_NAME);
      }

      if (Array.isArray(rawSheetRows) && rawSheetRows.length > 0) {
        sheetRecords = rawSheetRows
          .filter((r: any) => {
            if (!r) return false;
            return Boolean(
              pickField(r, ['datetime', 'Timestamp', 'ข้อมูลวันที่', 'รายงานวันที่', 'reportDate', 'วันที่', 'machine', 'เครื่องจักร'])
            );
          })
          .map((r: any, idx: number) => {
            const rawDt = pickField(r, ['datetime', 'Timestamp', 'วันที่บันทึก', 'ข้อมูลวันที่', 'รายงานวันที่', 'reportDate', 'วันที่']);
            const rawRepDate = pickField(r, ['reportDate', 'ข้อมูลวันที่', 'รายงานวันที่', 'วันที่', 'datetime', 'Timestamp']);
            const datetime = normalizeDateTime(rawDt);
            const reportDate = normalizeReportDate(rawRepDate, datetime);
            const machine = String(pickField(r, ['machine', 'เครื่องจักร', 'Machine']) ?? 'เครื่องบรรจุ 1Kg No.1');
            const shift = String(pickField(r, ['shift', 'กะ', 'Shift']) ?? 'A');
            const shiftTypeRaw = String(pickField(r, ['shiftType', 'shift duration type', 'Duration shift', 'ประเภทกะ']) ?? '8h');
            const shiftType: '8h' | '12h' = shiftTypeRaw.includes('12') ? '12h' : '8h';
            const operator = String(pickField(r, ['operator', 'ชื่อผู้บันทึก', 'Operator', 'ผู้บันทึก']) ?? '-');
            const targetKg = parseNumeric(pickField(r, ['targetKg', 'target', 'Target', 'เป้าหมาย']), 15000);
            const actualKg = parseNumeric(pickField(r, ['actualKg', 'actual', 'Actual', 'ผลผลิต']), 12500);
            const goodKg = parseNumeric(pickField(r, ['goodKg', 'good', 'Good', 'ของดี']), 12500);
            const rejectKg = parseNumeric(pickField(r, ['rejectKg', 'reject', 'Reject', 'ของเสีย']), 0);
            const breakdownMin = parseNumeric(pickField(r, ['breakdownMin', 'bd', 'BD', 'เวลาหยุดเครื่อง']), 0);
            const speed = parseNumeric(pickField(r, ['speedActual', 'speed', 'Speed Actual', 'Speed Act.']), 0);
            const speedStd = parseNumeric(pickField(r, ['speedStd', 'Speed Std', 'Speed Std.']), 34.67);
            const speedSet = parseNumeric(pickField(r, ['speedSet', 'Speed Set']), 45.00);
            const notes = String(pickField(r, ['notes', 'หมายเหตุ', 'Notes']) ?? '');

            const rowId = pickField(r, ['id', 'ID']) || makeDeterministicId('gs_oee', idx, reportDate, machine, shift, operator, actualKg, goodKg, targetKg);

            return {
              id: String(rowId),
              recordType: 'oee' as const,
              machine,
              datetime,
              reportDate,
              shift,
              shiftType,
              operator,
              speed,
              speedStd,
              speedSet,
              tempFront: null,
              tempFrontMin: null,
              tempFrontMax: null,
              tfStatus: 'pass' as const,
              tempBack: null,
              tempBackMin: null,
              tempBackMax: null,
              tbStatus: 'pass' as const,
              tempMid: null,
              tempMidMin: null,
              tempMidMax: null,
              tmStatus: 'pass' as const,
              timeFrontBack: null,
              timeFrontBackMin: null,
              timeFrontBackMax: null,
              timeFbStatus: 'pass' as const,
              timeMid: null,
              timeMidMin: null,
              timeMidMax: null,
              timeMStatus: 'pass' as const,
              lot: 'pass' as const,
              teflon: 'pass' as const,
              packSealTop: 'pass' as const,
              packSealMid: 'pass' as const,
              packSealBot: 'pass' as const,
              hole: 'pass' as const,
              targetKg,
              actualKg,
              goodKg,
              rejectKg,
              breakdownMin,
              notes
            };
          });
      }
    } catch (err) {
      console.warn("Google Sheet OEE fetch warning:", err);
    }

    const cleanedLocal = (forceRefresh || sheetRecords.length > 0 || firestoreRecords.length > 0)
      ? localData.filter(r => r && r.id && !isLegacyRandomSheetId(String(r.id)))
      : localData;

    const map = new Map<string, InspectionRecord>();
    const fsSignatures = new Set(
      firestoreRecords.map(r => `${r.reportDate}|${r.machine}|${r.shift}|${r.operator}|${r.actualKg}|${r.goodKg}`)
    );

    [...cleanedLocal, ...firestoreRecords].forEach(r => {
      if (r && r.id) map.set(String(r.id), r);
    });

    sheetRecords.forEach(r => {
      const sig = `${r.reportDate}|${r.machine}|${r.shift}|${r.operator}|${r.actualKg}|${r.goodKg}`;
      if (!map.has(r.id) && !fsSignatures.has(sig)) {
        map.set(r.id, r);
      }
    });

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );

    if (combined.length > 0) {
      this.setLocalRecords(combined);
      return { data: combined, synced: sheetRecords.length > 0 || firestoreRecords.length > 0 };
    }

    return { data: localData, synced: false };
  },

  async submitRecord(record: InspectionRecord, sheetName: string = "OEE_logs"): Promise<any> {
    const current = this.getLocalRecords();
    current.unshift(record);
    this.setLocalRecords(current);

    // Save to Firestore
    try {
      await addDoc(collection(db, "oee_records"), {
        id: record.id,
        machine: record.machine,
        datetime: record.datetime,
        reportDate: record.reportDate,
        shift: record.shift,
        shiftType: record.shiftType,
        operator: record.operator,
        speed: record.speed,
        speedStd: record.speedStd !== undefined && record.speedStd !== null ? Number(record.speedStd) : 0,
        speedSet: record.speedSet !== undefined && record.speedSet !== null ? Number(record.speedSet) : 0,
        targetKg: record.targetKg,
        actualKg: record.actualKg,
        goodKg: record.goodKg,
        rejectKg: record.rejectKg,
        breakdownMin: record.breakdownMin,
        notes: record.notes,
        createdAt: new Date().toISOString()
      });
      console.log("🔥 Saved OEE record to Firestore successfully");
    } catch (fsErr) {
      console.warn("Failed to save OEE record to Firestore:", fsErr);
    }

    // Sync to Google Sheet as well (POST request with JSON payload for doPost handler)
    const planTimeVal = record.shiftType === '12h' ? 720 : 480;
    const bdVal = record.breakdownMin || 0;
    const runTimeVal = Math.max(0, planTimeVal - bdVal);
    const speedStdVal = record.speedStd !== undefined && record.speedStd !== null ? Number(record.speedStd) : 34.67;
    const speedSetVal = record.speedSet !== undefined && record.speedSet !== null ? Number(record.speedSet) : 45.00;
    const speedActVal = record.speed || 38.5;
    const targetVal = record.targetKg || (speedStdVal * runTimeVal);
    const goodVal = record.goodKg || 12500;
    const rejectVal = record.rejectKg || 0;
    const actualVal = record.actualKg || (goodVal + rejectVal);

    const payload = {
      action: "saveRecord",
      sheetId: SHEET_ID,
      sheetName: sheetName,
      datetime: record.datetime || new Date().toISOString(),
      reportDate: record.reportDate || new Date().toISOString().slice(0, 10),
      machine: record.machine || "",
      shift: record.shift || "A",
      shiftType: record.shiftType || "8h",
      operator: record.operator || "",
      planTime: planTimeVal,
      runTime: runTimeVal,
      bd: bdVal,
      speedStd: speedStdVal,
      speedSet: speedSetVal,
      speedActual: speedActVal,
      target: targetVal,
      actual: actualVal,
      good: goodVal,
      reject: rejectVal
    };

    try {
      await fetch(GAS_API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Google Sheet sync warning:", err);
    }

    return { success: true };
  },

  async fetchSealTempRecords(): Promise<InspectionRecord[]> {
    const sealSheetId = "1tZ1hkPBVpSQ_ffab0j940IU20GUAj5zIv--eREu5V9Y";
    const sealSheetName = "TPM_Logs";
    const sealGasUrl = "https://script.google.com/macros/s/AKfycby0tMGCk5-0gXw1hwmnAwYN_FDLjSDsU5bd3s2kXtboL7jIak0HGgTPF6uZOg6yC5D2wA/exec";

    let firestoreRecords: InspectionRecord[] = [];
    let sheetRecords: InspectionRecord[] = [];

    try {
      const q = query(collection(db, "seal_temp_records"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        firestoreRecords = snapshot.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: String(d.id || doc.id),
            recordType: 'sealTemp' as const,
            machine: d.machine || 'เครื่องบรรจุ 1Kg No.1',
            datetime: d.datetime || new Date().toISOString(),
            reportDate: d.reportDate || normalizeReportDate(d.datetime),
            shift: d.shift || 'A',
            shiftType: d.shiftType || '8h',
            operator: d.operator || '-',
            speed: Number(d.speed || 0),
            tempFront: Number(d.tempFront || 0),
            tempFrontMin: 175,
            tempFrontMax: 210,
            tfStatus: 'pass',
            tempBack: Number(d.tempBack || 0),
            tempBackMin: 175,
            tempBackMax: 210,
            tbStatus: 'pass',
            tempMid: Number(d.tempMid || 0),
            tempMidMin: 175,
            tempMidMax: 210,
            tmStatus: 'pass',
            timeFrontBack: null,
            timeFrontBackMin: null,
            timeFrontBackMax: null,
            timeFbStatus: 'pass',
            timeMid: null,
            timeMidMin: null,
            timeMidMax: null,
            timeMStatus: 'pass',
            lot: d.lot || 'pass',
            teflon: d.teflon || 'pass',
            packSealTop: d.packSealTop || 'pass',
            packSealMid: d.packSealMid || 'pass',
            packSealBot: d.packSealBot || 'pass',
            hole: d.hole || 'pass',
            targetKg: null,
            actualKg: null,
            goodKg: null,
            rejectKg: null,
            breakdownMin: 0,
            notes: d.notes || ''
          };
        });
      }
    } catch (fsErr) {
      console.warn("Firestore fetch seal temp error:", fsErr);
    }

    try {
      let rawSheetRows = await this.fetchViaAppsScript(sealGasUrl, sealSheetId, sealSheetName);
      if (rawSheetRows.length === 0) {
        rawSheetRows = await this.fetchGoogleSheetViaGViz(sealSheetId, sealSheetName);
      }

      if (Array.isArray(rawSheetRows) && rawSheetRows.length > 0) {
        sheetRecords = rawSheetRows
          .filter((r: any) => {
            if (!r) return false;
            return Boolean(
              pickField(r, ['datetime', 'Timestamp', 'ข้อมูลวันที่', 'reportDate', 'วันที่', 'machine', 'เครื่องจักร'])
            );
          })
          .map((r: any, idx: number) => {
            const rawDt = pickField(r, ['datetime', 'Timestamp', 'วันที่บันทึก', 'ข้อมูลวันที่', 'reportDate', 'วันที่']);
            const rawRepDate = pickField(r, ['reportDate', 'ข้อมูลวันที่', 'วันที่', 'datetime', 'Timestamp']);
            const datetime = normalizeDateTime(rawDt);
            const reportDate = normalizeReportDate(rawRepDate, datetime);
            const machine = String(pickField(r, ['machine', 'เครื่องจักร', 'Machine']) ?? 'เครื่องบรรจุ 1Kg No.1');
            const shift = String(pickField(r, ['shift', 'กะ', 'Shift']) ?? 'A');
            const shiftTypeRaw = String(pickField(r, ['shiftType', 'shift duration type', 'Duration shift', 'ประเภทกะ']) ?? '8h');
            const shiftType: '8h' | '12h' = shiftTypeRaw.includes('12') ? '12h' : '8h';
            const operator = String(pickField(r, ['operator', 'ชื่อผู้บันทึก', 'Operator', 'ผู้บันทึก']) ?? '-');
            const tempFront = parseNumeric(pickField(r, ['tempFront', 'อุณหภูมิหน้า', 'Temp Front', 'ซีลหน้า']), 0);
            const tempBack = parseNumeric(pickField(r, ['tempBack', 'อุณหภูมิหลัง', 'Temp Back', 'ซีลหลัง']), 0);
            const tempMid = parseNumeric(pickField(r, ['tempMid', 'อุณหภูมิกลาง', 'Temp Mid', 'ซีลกลาง']), 0);
            const rowId = pickField(r, ['id', 'ID']) || makeDeterministicId('gs_seal', idx, reportDate, machine, shift, operator, tempFront, tempBack, tempMid);

            return {
              id: String(rowId),
              recordType: 'sealTemp' as const,
              machine,
              datetime,
              reportDate,
              shift,
              shiftType,
              operator,
              speed: parseNumeric(pickField(r, ['speed', 'Speed']), 0),
              tempFront,
              tempFrontMin: 175,
              tempFrontMax: 210,
              tfStatus: 'pass' as const,
              tempBack,
              tempBackMin: 175,
              tempBackMax: 210,
              tbStatus: 'pass' as const,
              tempMid,
              tempMidMin: 175,
              tempMidMax: 210,
              tmStatus: 'pass' as const,
              timeFrontBack: null,
              timeFrontBackMin: null,
              timeFrontBackMax: null,
              timeFbStatus: 'pass' as const,
              timeMid: null,
              timeMidMin: null,
              timeMidMax: null,
              timeMStatus: 'pass' as const,
              lot: pickField(r, ['lot', 'Lot']) ?? 'pass',
              teflon: pickField(r, ['teflon', 'Teflon']) ?? 'pass',
              packSealTop: pickField(r, ['packSealTop', 'Pack Seal Top']) ?? 'pass',
              packSealMid: pickField(r, ['packSealMid', 'Pack Seal Mid']) ?? 'pass',
              packSealBot: pickField(r, ['packSealBot', 'Pack Seal Bot']) ?? 'pass',
              hole: pickField(r, ['hole', 'Hole']) ?? 'pass',
              targetKg: null,
              actualKg: null,
              goodKg: null,
              rejectKg: null,
              breakdownMin: 0,
              notes: String(pickField(r, ['notes', 'หมายเหตุ', 'Notes']) ?? '')
            };
          });
      }
    } catch (err) {
      console.warn("Failed to fetch Seal Temp records from Sheet:", err);
    }

    const cached = this.getLocalSealTempRecords().filter(r => r && r.id && !isLegacyRandomSheetId(String(r.id)));
    const map = new Map<string, InspectionRecord>();
    const fsSignatures = new Set(
      firestoreRecords.map(r => `${r.reportDate}|${r.machine}|${r.shift}|${r.operator}|${r.tempFront}|${r.tempBack}|${r.tempMid}`)
    );

    [...cached, ...firestoreRecords].forEach(r => {
      if (r && r.id) map.set(String(r.id), r);
    });

    sheetRecords.forEach(r => {
      const sig = `${r.reportDate}|${r.machine}|${r.shift}|${r.operator}|${r.tempFront}|${r.tempBack}|${r.tempMid}`;
      if (!map.has(r.id) && !fsSignatures.has(sig)) {
        map.set(r.id, r);
      }
    });

    const combined = Array.from(map.values()).sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );
    if (combined.length > 0) {
      this.setLocalSealTempRecords(combined);
    }
    return combined;
  },

  async submitSealTempRecord(record: InspectionRecord): Promise<any> {
    const cached = this.getLocalSealTempRecords();
    cached.unshift(record);
    this.setLocalSealTempRecords(cached);

    try {
      await addDoc(collection(db, "seal_temp_records"), {
        id: String(record.id),
        machine: record.machine,
        datetime: record.datetime,
        reportDate: record.reportDate,
        shift: record.shift,
        shiftType: record.shiftType,
        operator: record.operator,
        tempFront: record.tempFront,
        tempBack: record.tempBack,
        tempMid: record.tempMid,
        lot: record.lot,
        teflon: record.teflon,
        packSealTop: record.packSealTop,
        packSealMid: record.packSealMid,
        packSealBot: record.packSealBot,
        hole: record.hole,
        notes: record.notes,
        createdAt: new Date().toISOString()
      });
      console.log("🔥 Saved Seal Temp record to Firestore successfully");
    } catch (fsErr) {
      console.warn("Failed to save Seal Temp record to Firestore:", fsErr);
    }

    const sealSheetId = "1tZ1hkPBVpSQ_ffab0j940IU20GUAj5zIv--eREu5V9Y";
    const sealSheetName = "TPM_Logs";
    const sealGasUrl = "https://script.google.com/macros/s/AKfycby0tMGCk5-0gXw1hwmnAwYN_FDLjSDsU5bd3s2kXtboL7jIak0HGgTPF6uZOg6yC5D2wA/exec";

    const payload = {
      action: "saveRecord",
      sheetId: sealSheetId,
      sheetName: sealSheetName,
      datetime: record.datetime || new Date().toISOString(),
      reportDate: record.reportDate || new Date().toISOString().slice(0, 10),
      machine: record.machine || "",
      shift: record.shift || "A",
      shiftType: record.shiftType || "8h",
      operator: record.operator || "",
      tempFront: record.tempFront ?? '',
      tempBack: record.tempBack ?? '',
      tempMid: record.tempMid ?? '',
      lot: record.lot || 'pass',
      teflon: record.teflon || 'pass',
      packSealTop: record.packSealTop || 'pass',
      packSealMid: record.packSealMid || 'pass',
      packSealBot: record.packSealBot || 'pass',
      hole: record.hole || 'pass',
      notes: record.notes || ''
    };

    try {
      await fetch(sealGasUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Seal Temp Sheet sync warning:", err);
    }

    return { success: true };
  },

  async fetchFilmRollRecords(): Promise<any[]> {
    const filmSheetId = "1RZKQqR3hGMA4aRnUrCTrXDkRDo0tOqutdEo1PKnYm-0";
    const filmSheetName = "FilmRoll_logs";
    const gasUrl = "https://script.google.com/macros/s/AKfycbxhbORz5XB6pjqDaQWLt0cV7kuxC_YArKfh5a5veeRdXWSCvBRbhknlJkuY6LNiqUcO-w/exec";

    let firestoreRecords: any[] = [];
    let sheetRecords: any[] = [];

    try {
      const q = query(collection(db, "film_roll_records"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        firestoreRecords = snapshot.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: String(d.id || doc.id),
            machine: d.machine || 'เครื่องบรรจุ 1Kg No.1',
            operator: d.operator || '-',
            shift: d.shift || 'A',
            shiftType: d.shiftType || '8h',
            supplier: d.supplier || 'TG',
            filmDate: d.filmDate || new Date().toLocaleDateString(),
            changeTime: d.changeTime || '00:00',
            tagPhoto: d.tagPhoto || null,
            datetime: d.datetime || new Date().toISOString()
          };
        });
      }
    } catch (fsErr) {
      console.warn("Firestore fetch film roll error:", fsErr);
    }

    try {
      let rawSheetRows = await this.fetchViaAppsScript(gasUrl, filmSheetId, filmSheetName);
      if (rawSheetRows.length === 0) {
        rawSheetRows = await this.fetchGoogleSheetViaGViz(filmSheetId, filmSheetName);
      }

      if (Array.isArray(rawSheetRows) && rawSheetRows.length > 0) {
        sheetRecords = rawSheetRows
          .filter((r: any) => {
            if (!r) return false;
            return Boolean(
              pickField(r, ['datetime', 'Timestamp', 'date', 'filmDate', 'ข้อมูลวันที่', 'วันที่', 'machine', 'เครื่องจักร'])
            );
          })
          .map((r: any, idx: number) => {
            const rawDt = pickField(r, ['datetime', 'Timestamp', 'date', 'filmDate', 'ข้อมูลวันที่', 'วันที่']);
            const datetime = normalizeDateTime(rawDt);
            const rawFilmDate = pickField(r, ['filmDate', 'date', 'ข้อมูลวันที่', 'วันที่']);
            const filmDate = rawFilmDate ? normalizeReportDate(rawFilmDate, datetime) : normalizeReportDate(datetime);
            const machine = String(pickField(r, ['machine', 'เครื่องจักร', 'Machine']) ?? 'เครื่องบรรจุ 1Kg No.1');
            const operator = String(pickField(r, ['operator', 'Operator', 'ชื่อผู้บันทึก', 'ผู้บันทึก']) ?? '-');
            const shift = String(pickField(r, ['shift', 'กะ', 'Shift']) ?? 'A');
            const shiftTypeRaw = String(pickField(r, ['shiftType', 'Duration shift', 'shift duration type', 'ประเภทกะ']) ?? '8h');
            const shiftType = shiftTypeRaw.includes('12') ? '12h' : '8h';
            const supplier = String(pickField(r, ['supplier', 'Supplier']) ?? 'TG');
            const changeTime = String(pickField(r, ['changeTime', 'เวลาเปลี่ยนม้วนฟิล์ม', 'Change Time']) ?? '00:00');
            const tagPhoto = pickField(r, ['tagPhoto', 'รูปป้าย Tag', 'Tag Photo']) ?? null;
            const rowId = pickField(r, ['id', 'ID']) || makeDeterministicId('gs_film', idx, filmDate, machine, shift, operator, supplier, changeTime);

            return {
              id: String(rowId),
              machine,
              operator,
              shift,
              shiftType,
              supplier,
              filmDate,
              changeTime,
              tagPhoto,
              datetime
            };
          });
      }
    } catch (err) {
      console.warn("Failed to fetch Film Roll records from Sheet:", err);
    }

    const cached = this.getLocalFilmRollRecords().filter(r => r && r.id && !isLegacyRandomSheetId(String(r.id)));
    const map = new Map<string, any>();
    const fsSignatures = new Set(
      firestoreRecords.map(r => `${normalizeReportDate(r.filmDate, r.datetime)}|${r.machine}|${r.shift}|${r.operator}|${r.supplier}|${r.changeTime}`)
    );

    [...cached, ...firestoreRecords].forEach(r => {
      if (r && r.id) map.set(String(r.id), r);
    });

    sheetRecords.forEach(r => {
      const sig = `${normalizeReportDate(r.filmDate, r.datetime)}|${r.machine}|${r.shift}|${r.operator}|${r.supplier}|${r.changeTime}`;
      if (!map.has(r.id) && !fsSignatures.has(sig)) {
        map.set(r.id, r);
      }
    });

    const combined = Array.from(map.values()).sort(
      (a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );
    if (combined.length > 0) {
      this.setLocalFilmRollRecords(combined);
    }
    return combined;
  },

  async submitFilmRollRecord(record: any): Promise<any> {
    const normalizedRecord = { ...record, id: String(record.id) };
    const cached = this.getLocalFilmRollRecords();
    cached.unshift(normalizedRecord);
    this.setLocalFilmRollRecords(cached);

    try {
      await addDoc(collection(db, "film_roll_records"), {
        id: String(normalizedRecord.id),
        machine: normalizedRecord.machine,
        operator: normalizedRecord.operator,
        shift: normalizedRecord.shift,
        shiftType: normalizedRecord.shiftType,
        supplier: normalizedRecord.supplier,
        filmDate: normalizedRecord.filmDate,
        changeTime: normalizedRecord.changeTime,
        tagPhoto: normalizedRecord.tagPhoto || "",
        datetime: normalizedRecord.datetime,
        createdAt: new Date().toISOString()
      });
      console.log("🔥 Saved Film Roll record to Firestore successfully");
    } catch (fsErr) {
      console.warn("Failed to save Film Roll record to Firestore:", fsErr);
    }

    const filmSheetId = "1RZKQqR3hGMA4aRnUrCTrXDkRDo0tOqutdEo1PKnYm-0";
    const filmSheetName = "FilmRoll_logs";
    const gasUrl = "https://script.google.com/macros/s/AKfycbxhbORz5XB6pjqDaQWLt0cV7kuxC_YArKfh5a5veeRdXWSCvBRbhknlJkuY6LNiqUcO-w/exec";

    const payload = {
      action: "saveRecord",
      sheetId: filmSheetId,
      sheetName: filmSheetName,
      datetime: normalizedRecord.datetime || new Date().toISOString(),
      filmDate: normalizedRecord.filmDate || new Date().toLocaleDateString(),
      machine: normalizedRecord.machine || "",
      operator: normalizedRecord.operator || "",
      shift: normalizedRecord.shift || "A",
      shiftType: normalizedRecord.shiftType || "8h",
      supplier: normalizedRecord.supplier || "TG",
      changeTime: normalizedRecord.changeTime || "",
      tagPhoto: normalizedRecord.tagPhoto || ""
    };

    try {
      await fetch(gasUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.warn("Film Roll Sheet sync warning:", err);
    }

    return { success: true };
  },

  async syncAllFromSheets(): Promise<{
    oee: InspectionRecord[];
    sealTemp: InspectionRecord[];
    filmRoll: any[];
    synced: boolean;
  }> {
    const [oeeRes, sealTemp, filmRoll] = await Promise.all([
      this.fetchRecords(true),
      this.fetchSealTempRecords(),
      this.fetchFilmRollRecords()
    ]);
    return {
      oee: oeeRes.data,
      sealTemp,
      filmRoll,
      synced: oeeRes.synced || sealTemp.length > 0 || filmRoll.length > 0
    };
  }
};
