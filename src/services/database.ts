import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { InspectionRecord } from '../types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const GAS_API_URL = "https://script.google.com/macros/s/AKfycbxhbORz5XB6pjqDaQWLt0cV7kuxC_YArKfh5a5veeRdXWSCvBRbhknlJkuY6LNiqUcO-w/exec";
const SHEET_ID = "1iSGxeBQx-LB0tNycfWo_xBQ6JLk_Dp8AGif0HkiPXBI";
const SHEET_NAME = "OEE_logs";
const CACHE_KEY = "am_records";
const CACHE_TIME_KEY = "am_records_last_sync";
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

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

  async fetchRecords(forceRefresh = false): Promise<{ data: InspectionRecord[]; synced: boolean }> {
    const localData = this.getLocalRecords();

    try {
      // Try fetching from Firestore first (Primary Cloud Database)
      const q = query(collection(db, "oee_records"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreRecords: InspectionRecord[] = snapshot.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: d.id || doc.id,
            recordType: 'oee' as const,
            machine: d.machine || 'เครื่องบรรจุ 1Kg No.1',
            datetime: d.datetime || new Date().toISOString(),
            reportDate: d.reportDate || new Date().toISOString().slice(0, 10),
            shift: d.shift || 'A',
            shiftType: d.shiftType || '8h',
            operator: d.operator || '-',
            speed: Number(d.speed || 0),
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
        }).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        this.setLocalRecords(firestoreRecords);
        return { data: firestoreRecords, synced: true };
      }
    } catch (fsErr) {
      console.warn("Firestore fetch error, falling back to Google Sheets / Local:", fsErr);
    }

    // Fallback to Google Sheet fetch
    try {
      const requestUrl = `${GAS_API_URL}?action=getAllRecords&sheetId=${encodeURIComponent(SHEET_ID)}&sheetName=${encodeURIComponent(SHEET_NAME)}&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const parsed = await res.json();

      if (Array.isArray(parsed)) {
        const cleaned: InspectionRecord[] = parsed
          .filter((r: any) => r && (r.datetime || r['ข้อมูลวันที่']))
          .map((r: any) => ({
            id: r.id || (Math.random().toString(36).slice(2, 9)),
            recordType: 'oee' as const,
            machine: r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1',
            datetime: r.datetime ?? r['ข้อมูลวันที่'] ?? new Date().toISOString(),
            reportDate: r.reportDate ?? r['ข้อมูลวันที่'] ?? new Date().toISOString().slice(0, 10),
            shift: r.shift ?? r['shift'] ?? 'A',
            shiftType: r.shiftType ?? r['shift duration type'] ?? '8h',
            operator: r.operator ?? r['ชื่อผู้บันทึก'] ?? '-',
            speed: Number(r.speed ?? r['Speed Actual'] ?? 0),
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
            targetKg: Number(r.targetKg ?? r['Target'] ?? 15000),
            actualKg: Number(r.actualKg ?? r['Actual'] ?? 12500),
            goodKg: Number(r.goodKg ?? r['Good'] ?? 12500),
            rejectKg: Number(r.rejectKg ?? r['Reject'] ?? 0),
            breakdownMin: Number(r.breakdownMin ?? r['BD'] ?? 0),
            notes: r.notes ?? ''
          }))
          .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

        this.setLocalRecords(cleaned);
        return { data: cleaned, synced: true };
      }
      return { data: localData, synced: false };
    } catch (err) {
      console.warn("Network fetch failed, fallback to local storage:", err);
      return { data: localData, synced: false };
    }
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

    // Sync to Google Sheet as well
    const planTimeVal = record.shiftType === '12h' ? 720 : 480;
    const bdVal = record.breakdownMin || 0;
    const runTimeVal = Math.max(0, planTimeVal - bdVal);
    const speedStdVal = 34.67;
    const speedSetVal = 45.00;
    const speedActVal = record.speed || 38.5;
    const targetVal = record.targetKg || (speedStdVal * runTimeVal);
    const goodVal = record.goodKg || 12500;
    const rejectVal = record.rejectKg || 0;
    const actualVal = record.actualKg || (goodVal + rejectVal);

    const params = new URLSearchParams({
      action: "saveRecord",
      sheetId: SHEET_ID,
      sheetName: sheetName,
      datetime: record.datetime || new Date().toISOString(),
      reportDate: record.reportDate || new Date().toISOString().slice(0, 10),
      machine: record.machine || "",
      shift: record.shift || "A",
      shiftType: record.shiftType || "8h",
      operator: record.operator || "",
      planTime: String(planTimeVal),
      runTime: String(runTimeVal),
      bd: String(bdVal),
      speedStd: String(speedStdVal),
      speedSet: String(speedSetVal),
      speedActual: String(speedActVal),
      target: String(targetVal),
      actual: String(actualVal),
      good: String(goodVal),
      reject: String(rejectVal)
    });

    const targetUrl = `${GAS_API_URL}?${params.toString()}`;
    try {
      await fetch(targetUrl, { method: "GET", mode: "no-cors" });
    } catch (err) {
      console.warn("Google Sheet sync warning:", err);
    }

    return { success: true };
  },

  async fetchSealTempRecords(): Promise<InspectionRecord[]> {
    const sealSheetId = "1tZ1hkPBVpSQ_ffab0j940IU20GUAj5zIv--eREu5V9Y";
    const sealSheetName = "TPM_Logs";
    const sealGasUrl = "https://script.google.com/macros/s/AKfycby0tMGCk5-0gXw1hwmnAwYN_FDLjSDsU5bd3s2kXtboL7jIak0HGgTPF6uZOg6yC5D2wA/exec";

    try {
      const q = query(collection(db, "seal_temp_records"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: d.id || doc.id,
            recordType: 'sealTemp' as const,
            machine: d.machine || 'เครื่องบรรจุ 1Kg No.1',
            datetime: d.datetime || new Date().toISOString(),
            reportDate: d.reportDate || new Date().toISOString().slice(0, 10),
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
        }).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      }
    } catch (fsErr) {
      console.warn("Firestore fetch seal temp error:", fsErr);
    }

    try {
      const requestUrl = `${sealGasUrl}?action=getAllRecords&sheetId=${encodeURIComponent(sealSheetId)}&sheetName=${encodeURIComponent(sealSheetName)}&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const parsed = await res.json();

      if (Array.isArray(parsed)) {
        return parsed
          .filter((r: any) => r && (r.datetime || r['ข้อมูลวันที่']))
          .map((r: any) => ({
            id: r.id || (Math.random().toString(36).slice(2, 9)),
            recordType: 'sealTemp' as const,
            machine: r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1',
            datetime: r.datetime ?? r['ข้อมูลวันที่'] ?? new Date().toISOString(),
            reportDate: r.reportDate ?? r['ข้อมูลวันที่'] ?? new Date().toISOString().slice(0, 10),
            shift: r.shift ?? 'A',
            shiftType: r.shiftType ?? r['shift duration type'] ?? '8h',
            operator: r.operator ?? r['ชื่อผู้บันทึก'] ?? '-',
            speed: Number(r.speed ?? 0),
            tempFront: Number(r.tempFront ?? r['อุณหภูมิหน้า'] ?? 0),
            tempFrontMin: 175,
            tempFrontMax: 210,
            tfStatus: 'pass',
            tempBack: Number(r.tempBack ?? r['อุณหภูมิหลัง'] ?? 0),
            tempBackMin: 175,
            tempBackMax: 210,
            tbStatus: 'pass',
            tempMid: Number(r.tempMid ?? r['อุณหภูมิกลาง'] ?? 0),
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
            lot: r.lot ?? 'pass',
            teflon: r.teflon ?? 'pass',
            packSealTop: r.packSealTop ?? 'pass',
            packSealMid: r.packSealMid ?? 'pass',
            packSealBot: r.packSealBot ?? 'pass',
            hole: r.hole ?? 'pass',
            targetKg: null,
            actualKg: null,
            goodKg: null,
            rejectKg: null,
            breakdownMin: 0,
            notes: r.notes ?? ''
          }))
          .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      }
      return [];
    } catch (err) {
      console.warn("Failed to fetch Seal Temp records:", err);
      return [];
    }
  },

  async submitSealTempRecord(record: InspectionRecord): Promise<any> {
    try {
      await addDoc(collection(db, "seal_temp_records"), {
        id: record.id,
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

    const params = new URLSearchParams({
      action: "saveRecord",
      sheetId: sealSheetId,
      sheetName: sealSheetName,
      datetime: record.datetime || new Date().toISOString(),
      reportDate: record.reportDate || new Date().toISOString().slice(0, 10),
      machine: record.machine || "",
      shift: record.shift || "A",
      shiftType: record.shiftType || "8h",
      operator: record.operator || "",
      tempFront: String(record.tempFront ?? ''),
      tempBack: String(record.tempBack ?? ''),
      tempMid: String(record.tempMid ?? ''),
      lot: record.lot || 'pass',
      teflon: record.teflon || 'pass',
      packSealTop: record.packSealTop || 'pass',
      packSealMid: record.packSealMid || 'pass',
      packSealBot: record.packSealBot || 'pass',
      hole: record.hole || 'pass',
      notes: record.notes || ''
    });

    const targetUrl = `${sealGasUrl}?${params.toString()}`;
    try {
      await fetch(targetUrl, { method: "GET", mode: "no-cors" });
    } catch (err) {
      console.warn("Seal Temp Sheet sync warning:", err);
    }

    return { success: true };
  },

  async fetchFilmRollRecords(): Promise<any[]> {
    const filmSheetId = "1RZKQqR3hGMA4aRnUrCTrXDkRDo0tOqutdEo1PKnYm-0";
    const filmSheetName = "FilmRoll_logs";
    const gasUrl = "https://script.google.com/macros/s/AKfycbxhbORz5XB6pjqDaQWLt0cV7kuxC_YArKfh5a5veeRdXWSCvBRbhknlJkuY6LNiqUcO-w/exec";

    try {
      const q = query(collection(db, "film_roll_records"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return snapshot.docs.map(doc => {
          const d = doc.data() as any;
          return {
            id: d.id || doc.id,
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
        }).sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      }
    } catch (fsErr) {
      console.warn("Firestore fetch film roll error:", fsErr);
    }

    try {
      const requestUrl = `${gasUrl}?action=getAllRecords&sheetId=${encodeURIComponent(filmSheetId)}&sheetName=${encodeURIComponent(filmSheetName)}&_t=${Date.now()}`;
      const res = await fetch(requestUrl, {
        method: "GET",
        mode: "cors",
        redirect: "follow",
        headers: { "Accept": "application/json" }
      });

      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const parsed = await res.json();

      if (Array.isArray(parsed)) {
        return parsed
          .filter((r: any) => r && (r.datetime || r['date'] || r['ข้อมูลวันที่']))
          .map((r: any) => ({
            id: r.id || (Math.random().toString(36).slice(2, 9)),
            machine: r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1',
            operator: r.operator ?? r['Operator'] ?? '-',
            shift: r.shift ?? r['กะ'] ?? 'A',
            shiftType: r.shiftType ?? r['Duration shift'] ?? '8h',
            supplier: r.supplier ?? r['Supplier'] ?? 'TG',
            filmDate: r.filmDate ?? r['date'] ?? new Date().toLocaleDateString(),
            changeTime: r.changeTime ?? r['เวลาเปลี่ยนม้วนฟิล์ม'] ?? '00:00',
            tagPhoto: r.tagPhoto ?? r['รูปป้าย Tag'] ?? null,
            datetime: r.datetime ?? new Date().toISOString()
          }))
          .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
      }
      return [];
    } catch (err) {
      console.warn("Failed to fetch Film Roll records:", err);
      return [];
    }
  },

  async submitFilmRollRecord(record: any): Promise<any> {
    try {
      await addDoc(collection(db, "film_roll_records"), {
        id: record.id,
        machine: record.machine,
        operator: record.operator,
        shift: record.shift,
        shiftType: record.shiftType,
        supplier: record.supplier,
        filmDate: record.filmDate,
        changeTime: record.changeTime,
        tagPhoto: record.tagPhoto || "",
        datetime: record.datetime,
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
      datetime: record.datetime || new Date().toISOString(),
      filmDate: record.filmDate || new Date().toLocaleDateString(),
      machine: record.machine || "",
      operator: record.operator || "",
      shift: record.shift || "A",
      shiftType: record.shiftType || "8h",
      supplier: record.supplier || "TG",
      changeTime: record.changeTime || "",
      tagPhoto: record.tagPhoto || ""
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
  }
};
