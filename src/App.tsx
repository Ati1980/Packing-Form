/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Boxes, ClipboardEdit, Clock, TrendingUp,
  UserCheck, Factory, ShieldCheck, Gauge,
  ListCheck, RotateCcw, Save, RotateCw, FileSpreadsheet,
  CalendarDays, CheckCircle2, Box, Check,
  ChevronDown, ChevronUp, Thermometer, Sparkles, GaugeCircle,
  Cpu, Layers, Zap, Activity, Wrench, Shield, CheckSquare,
  ClipboardList, ShieldAlert, Award, Camera, ImagePlus,
  SlidersHorizontal, Minus, Plus, CalendarClock, Flame,
  History, Inbox, AlertTriangle, MessageSquare
} from 'lucide-react';
import Chart from 'chart.js/auto';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Machine, InspectionRecord } from './types';
import { DatabaseService } from './services/database';

const MACHINES: (Machine & { icon: any; badgeColor: string })[] = [
  { id: 1, name: 'เครื่องบรรจุ 1Kg No.1', color: '#ef4444', icon: Cpu, badgeColor: 'bg-red-50 text-red-600 border-red-200' },
  { id: 2, name: 'เครื่องบรรจุ 1Kg No.2', color: '#f59e0b', icon: Layers, badgeColor: 'bg-amber-50 text-amber-600 border-amber-200' },
  { id: 3, name: 'เครื่องบรรจุ 1Kg No.3', color: '#eab308', icon: Zap, badgeColor: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  { id: 4, name: 'เครื่องบรรจุ 1Kg No.4', color: '#10b981', icon: Activity, badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { id: 5, name: 'เครื่องบรรจุ 1Kg No.5', color: '#3b82f6', icon: GaugeCircle, badgeColor: 'bg-blue-50 text-blue-600 border-blue-200' },
  { id: 6, name: 'เครื่องบรรจุ 1Kg No.6', color: '#8b5cf6', icon: Box, badgeColor: 'bg-purple-50 text-purple-600 border-purple-200' },
  { id: 7, name: 'เครื่องบรรจุ 1Kg No.7', color: '#ec4899', icon: Sparkles, badgeColor: 'bg-pink-50 text-pink-600 border-pink-200' }
];

const MACHINE_DEFAULTS: Record<number, any> = {
  1: {
    group1: { tempFront: [175, 210], tempBack: [175, 210], tempMid: [175, 210], timeFrontBack: null, timeMid: null },
    group2: { tempFront: [170, 190], tempBack: [170, 190], tempMid: [170, 185], timeFrontBack: null, timeMid: null }
  },
  2: { tempFront: [175, 210], tempBack: [175, 210], tempMid: [175, 210], timeFrontBack: null, timeMid: null },
  3: { tempFront: [175, 190], tempBack: [175, 190], tempMid: [165, 185], timeFrontBack: [80, 350], timeMid: [120, 320] },
  4: { tempFront: [170, 185], tempBack: [170, 185], tempMid: [170, 185], timeFrontBack: [150, 1300], timeMid: [150, 900] },
  5: { tempFront: [160, 180], tempBack: [160, 180], tempMid: [165, 175], timeFrontBack: [150, 1300], timeMid: [150, 900] },
  6: { tempFront: [160, 180], tempBack: [160, 180], tempMid: [165, 175], timeFrontBack: [110, 350], timeMid: [120, 320] },
  7: { tempFront: [145, 170], tempBack: [145, 170], tempMid: [150, 175], timeFrontBack: [110, 350], timeMid: [120, 320] }
};

const MACHINE_SPEED_SPECS: Record<number, { std: number; set: number }> = {
  1: { std: 50.00, set: 50.00 },
  2: { std: 50.00, set: 50.00 },
  3: { std: 30.00, set: 25.00 },
  4: { std: 30.00, set: 25.00 },
  5: { std: 30.00, set: 25.00 },
  6: { std: 30.00, set: 25.00 },
  7: { std: 30.00, set: 25.00 }
};

const INSPECTORS = [
  { name: "นายอนิวัฒน์ ทองลาด", emoji: "👨‍💻", color: "#ef4444", badge: "bg-red-50 text-red-700 border-red-200" },
  { name: "นายประจักร์ น้อยมูล", emoji: "🦸‍♂️", color: "#f59e0b", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "นายภานุพงค์ นามวิเศษ", emoji: "🧙‍♂️", color: "#10b981", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { name: "นายวัชรากร ขวัญเฉลิม", emoji: "🥷", color: "#8b5cf6", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  { name: "นายกิตติภัส สีสังชุม", emoji: "🤖", color: "#3b82f6", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  { name: "นายมงคล ติวสร้อย", emoji: "🐯", color: "#ec4899", badge: "bg-pink-50 text-pink-700 border-pink-200" },
  { name: "นายอำนาจ ทิพย์โพธิ์ศรี", emoji: "🦊", color: "#f97316", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { name: "นายอดิศักดิ์ มณีจันทร์", emoji: "🦁", color: "#eab308", badge: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  { name: "นายปริวัฒน์ ทองมูล", emoji: "🚀", color: "#6366f1", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" }
];

const pad = (n: number) => String(n).padStart(2, '0');
const stripCommas = (val: string) => val.replace(/,/g, '');
const parseFormattedNumber = (val: string): number => {
  const clean = stripCommas(val).trim();
  if (!clean) return NaN;
  return parseFloat(clean);
};
const formatNumberInput = (raw: string): string => {
  const clean = stripCommas(raw).replace(/[^\d.]/g, '');
  if (!clean) return '';
  const dotIdx = clean.indexOf('.');
  let intPart = dotIdx >= 0 ? clean.slice(0, dotIdx) : clean;
  const decPart = dotIdx >= 0 ? '.' + clean.slice(dotIdx + 1).replace(/\./g, '') : '';
  if (intPart.length > 1) {
    intPart = intPart.replace(/^0+/, '') || '0';
  }
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formattedInt}${decPart}`;
};
const formatNumValue = (num: number, maxDecimals = 2): string => {
  if (!isFinite(num)) return '';
  const factor = Math.pow(10, maxDecimals);
  const rounded = Math.round(num * factor) / factor;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: maxDecimals });
};
const getDefaultShiftTypeByDate = (date?: Date | string): '8h' | '12h' => {
  let d: Date;
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, dayNum] = date.split('-').map(Number);
    d = new Date(y, m - 1, dayNum);
  } else if (date instanceof Date) {
    d = date;
  } else {
    d = new Date();
  }
  const day = isNaN(d.getTime()) ? new Date().getDay() : d.getDay();
  // Monday (1) - Thursday (4) => '8h' (ปุ่มที่ 1), Friday (5) - Sunday (0, 6) => '12h' (ปุ่มที่ 2)
  return day >= 1 && day <= 4 ? '8h' : '12h';
};
const isToday = (dt?: string) => {
  if (!dt) return false;
  const d = new Date(dt);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};

const matchesDateFilter = (recDateStr: string, filterDateStr: string) => {
  if (!filterDateStr) return true;
  if (!recDateStr) return false;
  const [fY, fM, fD] = filterDateStr.split('-');
  const cleanRec = recDateStr.replace(/\//g, '-');
  if (cleanRec.includes(filterDateStr)) return true;
  if (fY && fM && fD) {
    if (cleanRec.includes(`${fD}-${fM}-${fY}`) || cleanRec.includes(`${parseInt(fD)}/${parseInt(fM)}/${fY}`)) return true;
  }
  return false;
};

const formatDDMMYYYY = (dtStr?: string) => {
  if (!dtStr) return '-';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const SpeedometerGauge = ({ value, label, color, subLabel, cardBg }: { value: number; label: string; color: string; subLabel: string; cardBg: string }) => {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg flex flex-col items-center justify-between ${cardBg}`}>
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-xs font-black text-slate-900 font-display flex items-center gap-1.5"><Award className="w-4 h-4 text-blue-600" /> {label}</span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${value >= 80 ? 'bg-emerald-500/20 text-emerald-800' : value >= 60 ? 'bg-amber-500/20 text-amber-800' : 'bg-rose-500/20 text-rose-800'}`}>
          {value >= 80 ? 'Optimal' : value >= 60 ? 'Warning' : 'Critical'}
        </span>
      </div>
      <div className="relative w-32 h-32 flex items-center justify-center my-1">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="14"
            className="stroke-slate-200 fill-none"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            strokeWidth="14"
            stroke={color}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            className="fill-none"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            key={value}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-black font-mono tracking-tighter text-slate-900"
          >
            {value}%
          </motion.span>
          <span className="text-[10px] font-bold text-slate-500">{subLabel}</span>
        </div>
      </div>
      <div className="w-full text-center text-[11px] font-semibold text-slate-500 mt-1">
        Target: ≥ 85%
      </div>
    </div>
  );
};

const recordOk = (r: InspectionRecord) => {
  return r.tfStatus !== 'fail' && r.tbStatus !== 'fail' && r.tmStatus !== 'fail' &&
         r.timeFbStatus !== 'fail' && r.timeMStatus !== 'fail' &&
         (r.lot === 'pass' || r.lot === 'ผ่าน') &&
         r.teflon === 'pass' && r.packSealTop === 'pass' && r.packSealMid === 'pass' &&
         r.packSealBot === 'pass' && r.hole === 'pass';
};

const getMaintenanceInsights = (machineName: string, recs: InspectionRecord[]) => {
  const mRecs = recs.filter(r => r.machine === machineName);
  if (mRecs.length === 0) {
    return {
      level: 'optimal',
      title: 'สถานะเครื่องจักร: ปกติ (ยังไม่มีข้อมูลประวัติเพียงพอ)',
      advice: 'เริ่มบันทึกข้อมูลการตรวจสอบสม่ำเสมอเพื่อเปิดใช้งานระบบวิเคราะห์แนวโน้มอัจฉริยะ'
    };
  }

  const recent = mRecs.slice(0, 5);
  const failCount = recent.filter(r => !recordOk(r)).length;

  if (failCount >= 2) {
    return {
      level: 'critical',
      title: '🚨 คำเตือนด่วน: ตรวจพบความผิดพลาดบ่อยครั้งในรอบล่าสุด',
      advice: 'แนะนำให้หยุดเครื่องชั่วคราวเพื่อตรวจสอบชุดซีลความร้อน (Thermal Seal) และฮีตเตอร์ทันที'
    };
  } else if (failCount === 1) {
    return {
      level: 'warning',
      title: '⚠️ เฝ้าระวัง: พบค่าหลุดสเปค 1 รายการในรอบล่าสุด',
      advice: 'ควรตรวจสอบอุณหภูมิฮีตเตอร์และสภาพเทปล่อนกันติดบริเวณก้านซีล'
    };
  } else {
    return {
      level: 'optimal',
      title: '✨ สภาพเครื่องจักรยอดเยี่ยม (Optimal Condition)',
      advice: 'ค่าอุณหภูมิและความเร็วอยู่ในเกณฑ์มาตรฐานสเปคต่อเนื่อง ไม่มีแนวโน้มความผิดปกติ'
    };
  }
};

const getMachineSpec = (mName: string) => {
  const found = MACHINES.find(m => m.name === mName);
  const id = found ? found.id : 1;
  return MACHINE_SPEED_SPECS[id] || { std: 34.67, set: 45.00 };
};

const computeOperatorData = (opName: string, records: InspectionRecord[], dashFilterMachine: string, dashFilterDate: string, dashFilterShift: string, dashFilterOperator: string) => {
  const insRecs = records.filter(r => {
    if (r.operator !== opName) return false;
    if (dashFilterDate) {
      const matchDatetime = r.datetime && r.datetime.startsWith(dashFilterDate);
      const matchReportDate = r.reportDate && r.reportDate === dashFilterDate;
      if (!matchDatetime && !matchReportDate) return false;
    }
    if (dashFilterShift !== 'all' && r.shift !== dashFilterShift) return false;
    if (dashFilterMachine !== 'all' && r.machine !== dashFilterMachine) return false;
    return true;
  });

  const fallbackRecs = records.filter(r => r.operator === opName);
  const activeRecs = insRecs.length > 0 ? insRecs : fallbackRecs;

  let machineNames = Array.from(new Set(activeRecs.map(r => r.machine || 'เครื่องบรรจุ 1Kg No.1')));
  if (dashFilterMachine !== 'all') {
    machineNames = machineNames.filter(mName => mName === dashFilterMachine);
  }

  const machineRows = machineNames.map(mName => {
    const subRecs = activeRecs.filter(r => r.machine === mName);
    const subCount = subRecs.length || 1;
    const subPlan = subRecs.reduce((acc, r) => acc + (r.shiftType === '12h' ? 720 : 480), 0) || (subCount * 480);
    const subBd = subRecs.reduce((acc, r) => acc + (r.breakdownMin ?? 0), 0);
    const subRun = Math.max(0, subPlan - subBd);
    const spec = getMachineSpec(mName);
    const subSpeedStd = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (Number(r.speedStd) || spec.std), 0) / subRecs.length : spec.std;
    const subSpeedSet = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (Number(r.speedSet) || spec.set), 0) / subRecs.length : spec.set;
    const subSpeedAct = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (r.speed || subSpeedSet), 0) / subRecs.length : subSpeedSet;
    const subGood = subRecs.reduce((acc, r) => acc + (r.goodKg ?? 0), 0) || (subCount * 1100);
    const subReject = subRecs.reduce((acc, r) => acc + (r.rejectKg ?? 0), 0) || Math.round(subGood * 0.002);
    const subAction = subRecs.reduce((acc, r) => acc + (r.actualKg ?? (r.goodKg || 0) + (r.rejectKg || 0)), 0) || (subGood + subReject);
    const subTarget = subRecs.reduce((acc, r) => acc + (r.targetKg ?? 4000), 0) || (subSpeedStd * subRun);
    const subMe = subPlan > 0 ? (subRun / subPlan) * 100 : 100;
    const subPerf = subSpeedSet > 0 ? (subSpeedAct / subSpeedSet) * 100 : 100;
    const subQual = subAction > 0 ? (subGood / subAction) * 100 : 100;
    const subOee = (subMe * subPerf * subQual) / 10000;

    return {
      name: mName,
      planTime: subPlan,
      bd: subBd,
      runTime: subRun,
      speedStd: subSpeedStd,
      speedSet: subSpeedSet,
      speedAct: subSpeedAct,
      target: subTarget,
      actual: subAction,
      good: subGood,
      reject: subReject,
      me: subMe,
      perf: subPerf,
      quality: subQual,
      oee: subOee
    };
  });

  const planTime = machineRows.reduce((acc, m) => acc + m.planTime, 0);
  const bd = machineRows.reduce((acc, m) => acc + m.bd, 0);
  const runTime = machineRows.reduce((acc, m) => acc + m.runTime, 0);
  const target = machineRows.reduce((acc, m) => acc + m.target, 0);
  const actual = machineRows.reduce((acc, m) => acc + m.actual, 0);
  const good = machineRows.reduce((acc, m) => acc + m.good, 0);
  const reject = machineRows.reduce((acc, m) => acc + m.reject, 0);

  const speedStd = machineRows.length > 0 ? machineRows.reduce((acc, m) => acc + m.speedStd, 0) / machineRows.length : 34.67;
  const speedSet = machineRows.length > 0 ? machineRows.reduce((acc, m) => acc + m.speedSet, 0) / machineRows.length : 45.00;
  const speedAct = machineRows.length > 0 ? machineRows.reduce((acc, m) => acc + m.speedAct, 0) / machineRows.length : 45.00;

  const me = planTime > 0 ? (runTime / planTime) * 100 : 100;
  const perf = speedSet > 0 ? (speedAct / speedSet) * 100 : 100;
  const quality = actual > 0 ? (good / actual) * 100 : 100;
  const oee = (me * perf * quality) / 10000;

  return {
    operatorName: opName,
    planTime,
    bd,
    runTime,
    target,
    actual,
    good,
    reject,
    speedStd,
    speedSet,
    speedAct,
    me,
    perf,
    quality,
    oee,
    machineRows
  };
};

const getMachineOnlyList = (records: InspectionRecord[], dashFilterDate: string, dashFilterShift: string, dashFilterOperator: string, dashFilterMachine: string) => {
  const filtered = records.filter(r => {
    if (dashFilterDate) {
      const matchDatetime = r.datetime && r.datetime.startsWith(dashFilterDate);
      const matchReportDate = r.reportDate && r.reportDate === dashFilterDate;
      if (!matchDatetime && !matchReportDate) return false;
    }
    if (dashFilterShift !== 'all' && r.shift !== dashFilterShift) return false;
    if (dashFilterOperator !== 'all' && r.operator !== dashFilterOperator) return false;
    if (dashFilterMachine !== 'all' && r.machine !== dashFilterMachine) return false;
    return true;
  });

  let machineNames = MACHINES.map(m => m.name);
  if (dashFilterMachine !== 'all') {
    machineNames = [dashFilterMachine];
  }

  return machineNames.map(mName => {
    const subRecs = filtered.filter(r => r.machine === mName);
    const subCount = subRecs.length || 1;
    const subPlan = subRecs.reduce((acc, r) => acc + (r.shiftType === '12h' ? 720 : 480), 0);
    const subBd = subRecs.reduce((acc, r) => acc + (r.breakdownMin ?? 0), 0);
    const subRun = Math.max(0, subPlan - subBd);
    const spec = getMachineSpec(mName);
    const subSpeedStd = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (Number(r.speedStd) || spec.std), 0) / subRecs.length : spec.std;
    const subSpeedSet = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (Number(r.speedSet) || spec.set), 0) / subRecs.length : spec.set;
    const subSpeedAct = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (r.speed || subSpeedSet), 0) / subRecs.length : spec.set;
    const subGood = subRecs.reduce((acc, r) => acc + (r.goodKg ?? 0), 0);
    const subReject = subRecs.reduce((acc, r) => acc + (r.rejectKg ?? 0), 0);
    const subAction = subRecs.reduce((acc, r) => acc + (r.actualKg ?? (r.goodKg || 0) + (r.rejectKg || 0)), 0);
    const subTarget = subRecs.reduce((acc, r) => acc + (r.targetKg ?? (subSpeedStd * subRun)), 0) || (subSpeedStd * subRun);
    const subMe = subPlan > 0 ? (subRun / subPlan) * 100 : 100;
    const subPerf = subSpeedSet > 0 ? (subSpeedAct / subSpeedSet) * 100 : 100;
    const subQual = subAction > 0 ? (subGood / subAction) * 100 : 100;
    const subOee = (subMe * subPerf * subQual) / 10000;

    return {
      name: mName,
      planTime: subPlan,
      bd: subBd,
      runTime: subRun,
      speedStd: subSpeedStd,
      speedSet: subSpeedSet,
      speedAct: subSpeedAct,
      target: subTarget,
      actual: subAction,
      good: subGood,
      reject: subReject,
      me: subMe,
      perf: subPerf,
      quality: subQual,
      oee: subOee,
      hasRecords: subRecs.length > 0
    };
  }).filter(m => dashFilterMachine !== 'all' || m.hasRecords || m.planTime > 0);
};

const renderPctBadge = (pct: number) => {
  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let barColor = 'bg-emerald-500/25';
  if (pct < 60) {
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    barColor = 'bg-rose-500/25';
  } else if (pct < 85) {
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    barColor = 'bg-amber-500/25';
  }
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className={`relative overflow-hidden inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg border font-mono font-black text-xs shadow-2xs ${badgeStyle}`}>
      <div className={`absolute left-0 top-0 bottom-0 ${barColor} transition-all duration-500`} style={{ width: `${clamped}%`, zIndex: 0 }}></div>
      <span className="relative z-10">{pct.toFixed(2)}%</span>
    </div>
  );
};

export default function App() {
  const [currentView, setCurrentView] = useState<'form' | 'oee' | 'film' | 'dashboard'>('form');
  const [formSubTab, setFormSubTab] = useState<'form' | 'history'>('form');
  const [oeeSubTab, setOeeSubTab] = useState<'form' | 'history'>('form');
  const [filmSubTab, setFilmSubTab] = useState<'form' | 'history'>('form');
  const [dashSubTab, setDashSubTab] = useState<'machine' | 'overall'>('machine');
  const [selectedMachine, setSelectedMachine] = useState<number>(1);
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [sealTempRecords, setSealTempRecords] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    DatabaseService.fetchSealTempRecords().then(data => {
      if (data && data.length > 0) {
        setSealTempRecords(data);
      }
    });
    DatabaseService.fetchFilmRollRecords().then(data => {
      if (data && data.length > 0) {
        setFilmRecords(data);
      }
    });
  }, []);
  const [clockString, setClockString] = useState<string>('');
  const [currentISO, setCurrentISO] = useState<string>(new Date().toISOString());

  // Film Roll States
  const [filmMachine, setFilmMachine] = useState<number>(1);
  const [filmOperator, setFilmOperator] = useState<string>('');
  const [filmShift, setFilmShift] = useState<string>('A');
  const [filmShiftType, setFilmShiftType] = useState<'8h' | '12h'>(() => getDefaultShiftTypeByDate());
  const [filmSupplier, setFilmSupplier] = useState<string>('TG');
  const [filmDate, setFilmDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [filmChangeTime, setFilmChangeTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [filmTagPhoto, setFilmTagPhoto] = useState<string | null>(null);
  const [filmLot, setFilmLot] = useState<string>('');
  const [filmThickness, setFilmThickness] = useState<string>('');
  const [filmWidth, setFilmWidth] = useState<string>('');
  const [filmStatus, setFilmStatus] = useState<string>('pass');
  const [filmRecords, setFilmRecords] = useState<any[]>([]);
  const filmCameraInputRef = useRef<HTMLInputElement | null>(null);
  const filmGalleryInputRef = useRef<HTMLInputElement | null>(null);

  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      mediaStreamRef.current = stream;
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.warn("getUserMedia failed, falling back to file input capture:", err);
      setShowCameraModal(false);
      filmCameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCameraModal(false);
  };

  const captureSnapshot = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFilmTagPhoto(dataUrl);
        showToast('ถ่ายภาพป้าย Tag สำเร็จ ✔');
      }
    }
    stopCamera();
  };

  const handleFilmPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilmTagPhoto(reader.result as string);
        showToast('แนบรูปป้าย tag ม้วนฟิล์มเรียบร้อย ✔');
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Form State
  const [shift, setShift] = useState<string>('A');
  const [shiftType, setShiftType] = useState<'8h' | '12h'>(() => getDefaultShiftTypeByDate());
  const [operator, setOperator] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [speed, setSpeed] = useState<string>('');
  const [no1Group, setNo1Group] = useState<'group1' | 'group2'>('group1');

  const [tempFront, setTempFront] = useState<string>('');
  const [tempBack, setTempBack] = useState<string>('');
  const [tempMid, setTempMid] = useState<string>('');
  const [timeFrontBack, setTimeFrontBack] = useState<string>('');
  const [timeMid, setTimeMid] = useState<string>('');

  const [limits, setLimits] = useState({
    tempFront: [175, 210],
    tempBack: [175, 210],
    tempMid: [175, 210],
    timeFrontBack: null as number[] | null,
    timeMid: null as number[] | null
  });

  const [qc, setQc] = useState({
    lot: null as string | null,
    teflon: null as string | null,
    packSealTop: null as string | null,
    packSealMid: null as string | null,
    packSealBot: null as string | null,
    hole: null as string | null
  });

  const [notes, setNotes] = useState<string>('');
  const [targetKg, setTargetKg] = useState<string>('');
  const [actualKg, setActualKg] = useState<string>('');
  const [goodKg, setGoodKg] = useState<string>('');
  const [rejectKg, setRejectKg] = useState<string>('0');
  const outputAnchorRef = useRef<'actual' | 'good'>('actual');
  const [showSpecsModal, setShowSpecsModal] = useState<boolean>(false);
  const [customSpeedSpecs, setCustomSpeedSpecs] = useState<Record<number, { std: number; set: number }>>(MACHINE_SPEED_SPECS);
  const [showLimitEditor, setShowLimitEditor] = useState<boolean>(false);
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState<boolean>(false);

  const [breakdownMin, setBreakdownMin] = useState<string>('0');
  const [planTime, setPlanTime] = useState<string>(() => (getDefaultShiftTypeByDate() === '12h' ? '720' : '480'));
  const [runTime, setRunTime] = useState<string>(() => (getDefaultShiftTypeByDate() === '12h' ? '720' : '480'));
  const [speedStd, setSpeedStd] = useState<string>('34.67');
  const [speedSet, setSpeedSet] = useState<string>('45.00');
  const [userModifiedTarget, setUserModifiedTarget] = useState<boolean>(false);

  const handleActualKgChange = (raw: string) => {
    const formatted = formatNumberInput(raw);
    outputAnchorRef.current = 'actual';
    setActualKg(formatted);
    if (!formatted) {
      setGoodKg('');
      return;
    }
    const actVal = parseFormattedNumber(formatted) || 0;
    const rejVal = parseFormattedNumber(rejectKg);
    const safeRej = isNaN(rejVal) ? 0 : rejVal;
    if (rejectKg.trim() === '') setRejectKg('0');
    setGoodKg(formatNumValue(Math.max(0, actVal - safeRej), 2));
  };

  const handleGoodKgChange = (raw: string) => {
    const formatted = formatNumberInput(raw);
    setGoodKg(formatted);
    if (!formatted) {
      if (outputAnchorRef.current === 'good') {
        setActualKg('');
      } else {
        const actVal = parseFormattedNumber(actualKg);
        if (!isNaN(actVal)) {
          setRejectKg(formatNumValue(actVal, 2));
        }
      }
      return;
    }
    const gVal = parseFormattedNumber(formatted) || 0;
    const existingAct = parseFormattedNumber(actualKg);
    if (outputAnchorRef.current === 'actual' && actualKg.trim() !== '' && !isNaN(existingAct) && gVal <= existingAct) {
      setRejectKg(formatNumValue(Math.max(0, existingAct - gVal), 2));
    } else {
      outputAnchorRef.current = 'good';
      const rejVal = parseFormattedNumber(rejectKg);
      const safeRej = isNaN(rejVal) ? 0 : rejVal;
      if (rejectKg.trim() === '') setRejectKg('0');
      setActualKg(formatNumValue(gVal + safeRej, 2));
    }
  };

  const handleRejectKgChange = (raw: string) => {
    const formatted = formatNumberInput(raw);
    setRejectKg(formatted);
    const rejVal = parseFormattedNumber(formatted);
    const safeRej = isNaN(rejVal) ? 0 : rejVal;

    if (outputAnchorRef.current === 'actual' && actualKg.trim() !== '') {
      const actVal = parseFormattedNumber(actualKg) || 0;
      setGoodKg(formatNumValue(Math.max(0, actVal - safeRej), 2));
    } else if (goodKg.trim() !== '') {
      const gVal = parseFormattedNumber(goodKg) || 0;
      setActualKg(formatNumValue(gVal + safeRej, 2));
    }
  };

  useEffect(() => {
    if (!userModifiedTarget) {
      const rt = parseFormattedNumber(runTime) || 0;
      const ss = parseFormattedNumber(speedSet) || 0;
      setTargetKg(formatNumValue(Math.round(rt * ss), 2));
    }
  }, [runTime, speedSet, userModifiedTarget]);

  useEffect(() => {
    const pt = shiftType === '12h' ? '720' : '480';
    setPlanTime(pt);
  }, [shiftType]);

  useEffect(() => {
    const pt = parseFormattedNumber(planTime) || 0;
    const bd = parseFormattedNumber(breakdownMin) || 0;
    const rt = Math.max(0, pt - bd);
    setRunTime(formatNumValue(rt, 2));
  }, [planTime, breakdownMin]);

  useEffect(() => {
    const spec = customSpeedSpecs[selectedMachine] || { std: 34.67, set: 45.00 };
    setSpeedStd(String(spec.std));
    setSpeedSet(String(spec.set));
  }, [selectedMachine, customSpeedSpecs]);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalDesc, setModalDesc] = useState<string>('');

  // History filters
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');

  // Seal Temp History Filters
  const [sealFilterDate, setSealFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sealFilterMachine, setSealFilterMachine] = useState<string>('all');
  const [sealFilterShift, setSealFilterShift] = useState<string>('all');
  const [sealFilterOperator, setSealFilterOperator] = useState<string>('all');

  // OEE History Filters
  const [oeeFilterDate, setOeeFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [oeeFilterMachine, setOeeFilterMachine] = useState<string>('all');
  const [oeeFilterShift, setOeeFilterShift] = useState<string>('all');
  const [oeeFilterOperator, setOeeFilterOperator] = useState<string>('all');

  // Film Roll History Filters
  const [filmHistFilterDate, setFilmHistFilterDate] = useState<string>('');
  const [filmHistFilterMachine, setFilmHistFilterMachine] = useState<string>('all');
  const [filmHistFilterShift, setFilmHistFilterShift] = useState<string>('all');
  const [filmHistFilterOperator, setFilmHistFilterOperator] = useState<string>('all');
  const [filmHistFilterSupplier, setFilmHistFilterSupplier] = useState<string>('all');

  // Dashboard Table Filters
  const [dashFilterDate, setDashFilterDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dashFilterShift, setDashFilterShift] = useState<string>('all');
  const [dashFilterOperator, setDashFilterOperator] = useState<string>('all');
  const [dashFilterMachine, setDashFilterMachine] = useState<string>('all');
  const [dashViewMode, setDashViewMode] = useState<'operator' | 'machineOnly' | 'operatorOnly'>('operator');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const filteredDashRecords = records.filter(r => {
    if (dashFilterDate) {
      const matchDatetime = r.datetime && r.datetime.startsWith(dashFilterDate);
      const matchReportDate = r.reportDate && r.reportDate === dashFilterDate;
      if (!matchDatetime && !matchReportDate) return false;
    }
    if (dashFilterShift !== 'all' && r.shift !== dashFilterShift) return false;
    if (dashFilterOperator !== 'all' && r.operator !== dashFilterOperator) return false;
    if (dashFilterMachine !== 'all' && r.machine !== dashFilterMachine) return false;
    return true;
  });

  // Charts refs
  const speedChartRef = useRef<HTMLCanvasElement | null>(null);
  const tempChartRef = useRef<HTMLCanvasElement | null>(null);
  const speedChartInstance = useRef<Chart | null>(null);
  const tempChartInstance = useRef<Chart | null>(null);

  // Sliding Nav Indicator (Desktop & Mobile)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const navBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [navIndicatorStyle, setNavIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 4,
    width: 0,
    opacity: 0
  });

  const [mobileHoveredNav, setMobileHoveredNav] = useState<string | null>(null);
  const mobileNavBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [mobileNavIndicatorStyle, setMobileNavIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 8,
    width: 0,
    opacity: 0
  });

  const activeNavKey = currentView;
  const targetNavKey = hoveredNav || activeNavKey;
  const mobileTargetNavKey = mobileHoveredNav || activeNavKey;

  useEffect(() => {
    const updateIndicator = () => {
      const btn = navBtnRefs.current[targetNavKey];
      if (btn && btn.offsetWidth > 0) {
        setNavIndicatorStyle({
          left: btn.offsetLeft,
          width: btn.offsetWidth,
          opacity: 1
        });
      }
      const mBtn = mobileNavBtnRefs.current[mobileTargetNavKey];
      if (mBtn && mBtn.offsetWidth > 0) {
        setMobileNavIndicatorStyle({
          left: mBtn.offsetLeft,
          width: mBtn.offsetWidth,
          opacity: 1
        });
      }
    };
    updateIndicator();
    const raf = requestAnimationFrame(updateIndicator);
    window.addEventListener('resize', updateIndicator);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', updateIndicator);
    };
  }, [targetNavKey, mobileTargetNavKey]);

  // Clock effect
  useEffect(() => {
    const updateClock = () => {
      const d = new Date();
      setCurrentISO(d.toISOString());
      setClockString(`${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial records fetch
  useEffect(() => {
    setRecords(DatabaseService.getLocalRecords());
    DatabaseService.fetchRecords().then(res => {
      setRecords(res.data);
    });
  }, []);

  // Apply machine defaults when selectedMachine or no1Group changes
  useEffect(() => {
    const isNo12 = selectedMachine === 1 || selectedMachine === 2;
    let defs = selectedMachine === 1 ? MACHINE_DEFAULTS[1][no1Group] : MACHINE_DEFAULTS[selectedMachine];

    if (defs) {
      setLimits({
        tempFront: defs.tempFront || [0, 0],
        tempBack: defs.tempBack || [0, 0],
        tempMid: defs.tempMid || [0, 0],
        timeFrontBack: isNo12 ? null : defs.timeFrontBack,
        timeMid: isNo12 ? null : defs.timeMid
      });
    }
  }, [selectedMachine, no1Group]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const checkRange = (valStr: string, min: number, max: number) => {
    if (!valStr.trim()) return 'unknown';
    if (valStr.includes('-')) {
      const parts = valStr.split('-').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return (parts[0] >= min && parts[1] <= max) ? 'pass' : 'fail';
      }
    } else {
      const v = parseFloat(valStr);
      if (!isNaN(v)) {
        return (v >= min && v <= max) ? 'pass' : 'fail';
      }
    }
    return 'unknown';
  };

  const tfStatus = checkRange(tempFront, limits.tempFront[0], limits.tempFront[1]);
  const tbStatus = checkRange(tempBack, limits.tempBack[0], limits.tempBack[1]);
  const tmStatus = checkRange(tempMid, limits.tempMid[0], limits.tempMid[1]);
  const timeFbStatus = limits.timeFrontBack ? checkRange(timeFrontBack, limits.timeFrontBack[0], limits.timeFrontBack[1]) : 'pass';
  const timeMStatus = limits.timeMid ? checkRange(timeMid, limits.timeMid[0], limits.timeMid[1]) : 'pass';



  const handleOeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFormattedNumber(targetKg);
    const actualVal = parseFormattedNumber(actualKg);
    const goodVal = parseFormattedNumber(goodKg);
    const rejectVal = rejectKg.trim() === '' ? 0 : parseFormattedNumber(rejectKg);

    if (
      !operator.trim() ||
      !reportDate ||
      !planTime.trim() ||
      !runTime.trim() ||
      breakdownMin.trim() === '' ||
      !speedStd.trim() ||
      !speedSet.trim() ||
      !speed.trim() ||
      isNaN(targetVal) ||
      isNaN(actualVal) ||
      isNaN(goodVal) ||
      isNaN(rejectVal)
    ) {
      showToast('กรุณากรอกข้อมูล OEE ให้ครบทุกหัวข้อ (ยกเว้นหมายเหตุ)');
      return;
    }
    const m = MACHINES.find(item => item.id === selectedMachine)!;

    const newRec: InspectionRecord = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      recordType: 'oee',
      machine: m.name,
      datetime: currentISO,
      shift,
      shiftType,
      operator,
      reportDate,
      speed: parseFormattedNumber(speed) || 0,
      speedStd: !isNaN(parseFormattedNumber(speedStd)) ? parseFormattedNumber(speedStd) : 0,
      speedSet: !isNaN(parseFormattedNumber(speedSet)) ? parseFormattedNumber(speedSet) : 0,
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
      targetKg: !isNaN(targetVal) ? targetVal : null,
      actualKg: !isNaN(actualVal) ? actualVal : null,
      goodKg: !isNaN(goodVal) ? goodVal : null,
      rejectKg: !isNaN(rejectVal) ? rejectVal : 0,
      breakdownMin: parseFormattedNumber(breakdownMin) || 0,
      notes
    };

    const updated = [newRec, ...records];
    setRecords(updated);
    DatabaseService.setLocalRecords(updated);

    setModalDesc(`บันทึกข้อมูล OEE ของ ${m.name} ลง Sheet OEE_logs เรียบร้อยแล้ว`);
    setShowModal(true);

    setTargetKg('');
    setActualKg('');
    setGoodKg('');
    setRejectKg('0');
    outputAnchorRef.current = 'actual';
    setUserModifiedTarget(false);
    setBreakdownMin('0');
    setNotes('');

    try {
      await DatabaseService.submitRecord(newRec, "OEE_logs");
      showToast('ซิงค์ข้อมูล OEE ลง Google Sheet (OEE_logs) สำเร็จ ✔');
    } catch {
      showToast('บันทึกลงแคชในเครื่องแล้ว (รอซิงค์เมื่อออนไลน์)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator.trim() || !speed.trim() || !tempFront.trim() || !tempBack.trim() || !tempMid.trim()) {
      showToast('กรุณากรอกข้อมูลผู้ตรวจสอบ ความเร็ว และอุณหภูมิให้ครบทุกช่อง');
      return;
    }
    if (selectedMachine > 2 && (!timeFrontBack.trim() || !timeMid.trim())) {
      showToast('กรุณากรอกค่าแช่จอหน้า-หลัง และแช่จอกลาง (ms)');
      return;
    }
    if (!qc.lot || !qc.teflon || !qc.packSealTop || !qc.packSealMid || !qc.packSealBot || !qc.hole) {
      showToast('กรุณาเลือกผลการตรวจสอบ QC ให้ครบทุกหัวข้อ');
      return;
    }
    const m = MACHINES.find(item => item.id === selectedMachine)!;

    const newRec: InspectionRecord = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      recordType: 'sealTemp',
      machine: m.name,
      datetime: currentISO,
      shift,
      shiftType,
      operator,
      reportDate,
      speed: parseFloat(speed) || 0,
      tempFront: parseFloat(tempFront) || null,
      tempFrontMin: limits.tempFront[0],
      tempFrontMax: limits.tempFront[1],
      tfStatus,
      tempBack: parseFloat(tempBack) || null,
      tempBackMin: limits.tempBack[0],
      tempBackMax: limits.tempBack[1],
      tbStatus,
      tempMid: parseFloat(tempMid) || null,
      tempMidMin: limits.tempMid[0],
      tempMidMax: limits.tempMid[1],
      tmStatus,
      timeFrontBack: (selectedMachine === 1 || selectedMachine === 2) ? null : timeFrontBack.trim() || null,
      timeFrontBackMin: limits.timeFrontBack?.[0] || null,
      timeFrontBackMax: limits.timeFrontBack?.[1] || null,
      timeFbStatus,
      timeMid: (selectedMachine === 1 || selectedMachine === 2) ? null : timeMid.trim() || null,
      timeMidMin: limits.timeMid?.[0] || null,
      timeMidMax: limits.timeMid?.[1] || null,
      timeMStatus,
      lot: qc.lot,
      teflon: qc.teflon,
      packSealTop: qc.packSealTop,
      packSealMid: qc.packSealMid,
      packSealBot: qc.packSealBot,
      hole: qc.hole,
      targetKg: parseFormattedNumber(targetKg) || null,
      actualKg: parseFormattedNumber(actualKg) || null,
      goodKg: parseFormattedNumber(goodKg) || null,
      rejectKg: parseFormattedNumber(rejectKg) || null,
      breakdownMin: parseFormattedNumber(breakdownMin) || 0,
      notes
    };

    const updated = [newRec, ...records];
    setRecords(updated);
    DatabaseService.setLocalRecords(updated);

    setModalDesc(`บันทึกข้อมูล ${m.name} และซิงค์เรียบร้อยแล้ว`);
    setShowModal(true);

    // Reset inputs
    setSpeed('');
    setTempFront('');
    setTempBack('');
    setTempMid('');
    setTimeFrontBack('');
    setTimeMid('');
    setQc({ lot: null, teflon: null, packSealTop: null, packSealMid: null, packSealBot: null, hole: null });
    setTargetKg('');
    setActualKg('');
    setGoodKg('');
    setRejectKg('0');
    setBreakdownMin('0');
    setNotes('');

    const updatedSeal = [newRec, ...sealTempRecords];
    setSealTempRecords(updatedSeal);

    try {
      await DatabaseService.submitSealTempRecord(newRec);
      showToast('ซิงค์ข้อมูลลง Google Sheet (TPM_Logs) สำเร็จ ✔');
    } catch {
      showToast('บันทึกลงแคชในเครื่องแล้ว (รอซิงค์เมื่อออนไลน์)');
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(records.map(r => ({
      'Machine': r.machine,
      'Datetime': formatDDMMYYYY(r.datetime),
      'Shift': r.shift,
      'Inspector': r.operator,
      'Speed (bag/min)': r.speed,
      'Temp Front/Top': r.tempFront,
      'Temp Back/Bot': r.tempBack,
      'Temp Mid': r.tempMid,
      'Lot Check': r.lot,
      'Teflon Check': r.teflon,
      'PackSeal Top': r.packSealTop,
      'PackSeal Mid': r.packSealMid,
      'PackSeal Bot': r.packSealBot,
      'Hole Position': r.hole,
      'Breakdown (min)': r.breakdownMin ?? 0,
      'Notes': r.notes
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "InspectionRecords");
    XLSX.writeFile(wb, `SmartPackingPRO_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ส่งออกไฟล์ Excel สำเร็จ ✔');
  };

  const handleExportDashboardExcel = () => {
    const recordOperators = Array.from(new Set(filteredDashRecords.map(r => r.operator).filter(Boolean)));
    const activeOperators = recordOperators.length > 0 ? recordOperators : INSPECTORS.map(i => i.name);
    const displayOperators = activeOperators.filter(opName => {
      if (dashFilterOperator !== 'all' && opName !== dashFilterOperator) return false;
      return true;
    });

    const exportRows: any[] = [];
    let totalPlanTime = 0;
    let totalRunTime = 0;
    let totalBd = 0;
    let totalTarget = 0;
    let totalAction = 0;
    let totalGood = 0;
    let totalReject = 0;
    let sumOee = 0;
    let sumPerf = 0;
    let sumMe = 0;
    let sumQual = 0;
    let rowCount = 0;

    displayOperators.forEach(opName => {
      const insRecs = filteredDashRecords.filter(r => r.operator === opName);
      const fallbackRecs = records.filter(r => r.operator === opName);
      const activeRecs = insRecs.length > 0 ? insRecs : fallbackRecs;
      if (activeRecs.length === 0 && (dashFilterDate || dashFilterShift !== 'all' || dashFilterOperator !== 'all' || dashFilterMachine !== 'all')) return;

      let machineNames = Array.from(new Set(activeRecs.map(r => r.machine || 'เครื่องบรรจุ 1Kg No.1')));
      if (dashFilterMachine !== 'all') {
        machineNames = machineNames.filter(mName => mName === dashFilterMachine);
      }
      if (machineNames.length === 0 && activeRecs.length === 0) return;

      const recCount = activeRecs.length || 1;
      const planTimeVal = activeRecs.reduce((acc, r) => acc + (r.shiftType === '12h' ? 720 : 480), 0) || (recCount * 480);
      const bdVal = activeRecs.reduce((acc, r) => acc + (r.breakdownMin ?? 0), 0);
      const runTimeVal = Math.max(0, planTimeVal - bdVal);
      const mePct = planTimeVal > 0 ? (runTimeVal / planTimeVal) * 100 : 100;
      const speedStdVal = activeRecs.length > 0 ? activeRecs.reduce((acc, r) => acc + (Number(r.speedStd) || 34.67), 0) / activeRecs.length : 34.67;
      const speedSetVal = activeRecs.length > 0 ? activeRecs.reduce((acc, r) => acc + (Number(r.speedSet) || 45.00), 0) / activeRecs.length : 45.00;
      const goodVal = activeRecs.reduce((acc, r) => acc + (r.goodKg ?? 0), 0) || (recCount * 1250);
      const rejectVal = activeRecs.reduce((acc, r) => acc + (r.rejectKg ?? 0), 0) || Math.round(goodVal * 0.002);
      const actionVal = activeRecs.reduce((acc, r) => acc + (r.actualKg ?? (r.goodKg || 0) + (r.rejectKg || 0)), 0) || (goodVal + rejectVal);
      const targetVal = activeRecs.reduce((acc, r) => acc + (r.targetKg ?? 15000), 0) || (speedStdVal * runTimeVal);
      const qualPct = actionVal > 0 ? (goodVal / actionVal) * 100 : 100;
      const speedActVal = activeRecs.length > 0 ? activeRecs.reduce((acc, r) => acc + (r.speed || 38), 0) / activeRecs.length : 39.40;
      const perfPct = speedSetVal > 0 ? (speedActVal / speedSetVal) * 100 : 100;
      const oeePct = (mePct * perfPct * qualPct) / 10000;

      totalPlanTime += planTimeVal;
      totalRunTime += runTimeVal;
      totalBd += bdVal;
      totalTarget += targetVal;
      totalAction += actionVal;
      totalGood += goodVal;
      totalReject += rejectVal;
      sumOee += oeePct;
      sumPerf += perfPct;
      sumMe += mePct;
      sumQual += qualPct;
      rowCount += 1;

      // Operator summary row
      exportRows.push({
        'Operator / Machine': opName,
        'OEE %': `${oeePct.toFixed(2)}%`,
        'Perf %': `${perfPct.toFixed(2)}%`,
        'Speed Std.': speedStdVal.toFixed(2),
        'Speed Set': speedSetVal.toFixed(2),
        'Speed Act.': speedActVal.toFixed(2),
        'Target (kg)': Math.round(targetVal),
        'Actual (kg)': Math.round(actionVal),
        'Good (kg)': Math.round(goodVal),
        'Reject (kg)': Math.round(rejectVal),
        'ME %': `${mePct.toFixed(2)}%`,
        'Quality %': `${qualPct.toFixed(2)}%`,
        'Plan Time': planTimeVal,
        'Run Time': runTimeVal,
        'BD (Min)': bdVal
      });

      // Machine sub-rows
      machineNames.forEach(mName => {
        const subRecs = activeRecs.filter(r => r.machine === mName);
        const subCount = subRecs.length || 1;
        const subPlan = subRecs.reduce((acc, r) => acc + (r.shiftType === '12h' ? 720 : 480), 0) || (subCount * 409);
        const subBd = subRecs.reduce((acc, r) => acc + (r.breakdownMin ?? 0), 0);
        const subRun = Math.max(0, subPlan - subBd);
        const subMe = subPlan > 0 ? (subRun / subPlan) * 100 : 100;
        const subGood = subRecs.reduce((acc, r) => acc + (r.goodKg ?? 0), 0) || (subCount * 1100);
        const subReject = subRecs.reduce((acc, r) => acc + (r.rejectKg ?? 0), 0) || Math.round(subGood * 0.002);
        const subAction = subRecs.reduce((acc, r) => acc + (r.actualKg ?? (r.goodKg || 0) + (r.rejectKg || 0)), 0) || (subGood + subReject);
        const subTarget = subRecs.reduce((acc, r) => acc + (r.targetKg ?? 4000), 0) || (35.00 * subRun);
        const subQual = subAction > 0 ? (subGood / subAction) * 100 : 100;
        const subSpeedStd = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (Number(r.speedStd) || 35.00), 0) / subRecs.length : 35.00;
        const subSpeedSet = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (Number(r.speedSet) || 50.00), 0) / subRecs.length : 50.00;
        const subSpeedAct = subRecs.length > 0 ? subRecs.reduce((acc, r) => acc + (r.speed || 40), 0) / subRecs.length : 42.00;
        const subPerf = subSpeedSet > 0 ? (subSpeedAct / subSpeedSet) * 100 : 100;
        const subOee = (subMe * subPerf * subQual) / 10000;

        exportRows.push({
          'Operator / Machine': `  - ${mName}`,
          'OEE %': `${subOee.toFixed(2)}%`,
          'Perf %': `${subPerf.toFixed(2)}%`,
          'Speed Std.': subSpeedStd.toFixed(2),
          'Speed Set': subSpeedSet.toFixed(2),
          'Speed Act.': subSpeedAct.toFixed(2),
          'Target (kg)': Math.round(subTarget),
          'Actual (kg)': Math.round(subAction),
          'Good (kg)': Math.round(subGood),
          'Reject (kg)': Math.round(subReject),
          'ME %': `${subMe.toFixed(2)}%`,
          'Quality %': `${subQual.toFixed(2)}%`,
          'Plan Time': subPlan,
          'Run Time': subRun,
          'BD (Min)': subBd
        });
      });
    });

    const avgOee = rowCount > 0 ? sumOee / rowCount : 92.45;
    const avgPerf = rowCount > 0 ? sumPerf / rowCount : 93.80;
    const avgMe = rowCount > 0 ? sumMe / rowCount : 100.00;
    const avgQual = rowCount > 0 ? sumQual / rowCount : 99.05;

    // Total / Average row
    exportRows.push({
      'Operator / Machine': 'Total / Average',
      'OEE %': `${avgOee.toFixed(2)}%`,
      'Perf %': `${avgPerf.toFixed(2)}%`,
      'Speed Std.': '34.67',
      'Speed Set': '45.00',
      'Speed Act.': '39.40',
      'Target (kg)': Math.round(totalTarget),
      'Actual (kg)': Math.round(totalAction),
      'Good (kg)': Math.round(totalGood),
      'Reject (kg)': Math.round(totalReject),
      'ME %': `${avgMe.toFixed(2)}%`,
      'Quality %': `${avgQual.toFixed(2)}%`,
      'Plan Time': totalPlanTime,
      'Run Time': totalRunTime,
      'BD (Min)': totalBd
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DashboardPerformance");
    XLSX.writeFile(wb, `OEE_Dashboard_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('ส่งออก Excel แดชบอร์ดสำเร็จ ✔');
  };

  // Dashboard chart effect
  useEffect(() => {
    if (currentView !== 'dashboard' || dashSubTab !== 'machine') return;
    const m = MACHINES.find(item => item.id === selectedMachine);
    if (!m) return;

    const recs = records
      .filter(r => r.machine === m.name)
      .slice()
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      .slice(-30);

    if (recs.length === 0) return;

    const labels = recs.map(r => {
      const d = new Date(r.datetime);
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    });
    const speeds = recs.map(r => r.speed);
    const gridColor = '#e2e8f0';
    const textColor = '#334155';
    Chart.defaults.font.family = "'Roboto', 'Noto Sans Thai', 'IBM Plex Sans Thai', sans-serif";

    if (speedChartInstance.current) speedChartInstance.current.destroy();
    if (tempChartInstance.current) tempChartInstance.current.destroy();

    if (speedChartRef.current) {
      speedChartInstance.current = new Chart(speedChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Speed (bag/min)',
            data: speeds,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            tension: 0.35,
            fill: true,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { color: gridColor } }
          }
        }
      });
    }

    if (tempChartRef.current) {
      tempChartInstance.current = new Chart(tempChartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'ซีลหน้า/บน', data: recs.map(r => r.tempFront), borderColor: '#ef4444', tension: 0.25 },
            { label: 'ซีลหลัง/ล่าง', data: recs.map(r => r.tempBack), borderColor: '#3b82f6', tension: 0.25 },
            { label: 'ซีลกลาง', data: recs.map(r => r.tempMid), borderColor: '#10b981', tension: 0.25 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { display: false } },
            y: { ticks: { color: textColor, font: { weight: 'bold' } }, grid: { color: gridColor } }
          }
        }
      });
    }

    return () => {
      if (speedChartInstance.current) speedChartInstance.current.destroy();
      if (tempChartInstance.current) tempChartInstance.current.destroy();
    };
  }, [currentView, dashSubTab, selectedMachine, records]);

  const todayRecords = records.filter(r => isToday(r.datetime));
  const passToday = todayRecords.filter(recordOk).length;
  const failToday = todayRecords.length - passToday;
  const passRateToday = todayRecords.length ? Math.round((passToday / todayRecords.length) * 100) : 100;

  const filteredHistory = records.filter(r => {
    if (filterDate && (!r.datetime || !r.datetime.startsWith(filterDate))) return false;
    if (filterMachine !== 'all') {
      const m = MACHINES.find(item => item.id === Number(filterMachine));
      if (m && r.machine !== m.name) return false;
    }
    const ok = recordOk(r);
    if (filterResult === 'pass' && !ok) return false;
    if (filterResult === 'fail' && ok) return false;
    return true;
  });

  const activeMachineObj = MACHINES.find(m => m.id === selectedMachine) || MACHINES[0];
  const dashMachineRecords = records.filter(r => r.machine === activeMachineObj.name);
  const dashLatestRecord = dashMachineRecords.length > 0 ? dashMachineRecords[0] : null;
  const dashMachineHealth = !dashLatestRecord ? 'unknown' : recordOk(dashLatestRecord) ? 'good' : 'bad';
  const totalMachineRecs = dashMachineRecords.length;
  const passedMachineRecs = dashMachineRecords.filter(recordOk).length;
  const qualityRate = totalMachineRecs > 0 ? Math.round((passedMachineRecs / totalMachineRecs) * 100) : 95;
  const avgSpeed = totalMachineRecs > 0 ? Math.round(dashMachineRecords.reduce((acc, r) => acc + r.speed, 0) / totalMachineRecs) : 48;
  const performanceRate = Math.min(100, Math.round((avgSpeed / 50) * 100));
  const availabilityRate = 92;
  const oeeScore = Math.round((availabilityRate * performanceRate * qualityRate) / 10000);

  // Clean Glassmorphic Light Mode Palette
  const appBg = 'bg-sky-50 text-slate-800';
  const navbarBg = 'bg-white/75 border-white/70 shadow-sm';
  const cardBg = 'bg-white/82 border-white/80 shadow-glass';
  const subCardBg = 'bg-slate-50/90 border-slate-200/80 text-slate-900';
  const inputBg = 'bg-slate-50/90 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500';
  const textMuted = 'text-slate-500';
  const navDockBg = 'bg-slate-100/85 border-slate-200/90';

  return (
    <div className={`min-h-screen ${appBg} font-sans relative overflow-x-hidden transition-colors duration-300`}>
      {/* Background Image */}
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('./assets/aistudio/5153829_d0edf9c1.jpg')" }}
      />
      <div aria-hidden="true" className="fixed inset-0 z-0 pointer-events-none bg-white/10" />

      <div className="max-w-7xl mx-auto min-h-screen flex flex-col pb-24 md:pb-10 relative z-10">
        {/* Main Header Navbar - Adjusted Font */}
        <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${navbarBg}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5 flex items-center justify-between gap-4">
            {/* Redesigned Brand Identity */}
            <div
              onClick={() => setCurrentView('form')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div
                className="relative w-11 h-11 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25 ring-2 ring-white/80 transition-transform duration-300 group-hover:scale-105 shrink-0"
                style={{ background: 'linear-gradient(135deg, #3498db 0%, #6366f1 55%, #8e44ad 100%)' }}
              >
                <Factory className="w-6 h-6 text-white drop-shadow-sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <motion.h1
                    initial={{ opacity: 0, y: -8, letterSpacing: '0.08em' }}
                    animate={{ opacity: 1, y: 0, letterSpacing: '-0.02em' }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="text-base md:text-lg font-extrabold font-display leading-tight truncate flex items-center gap-1.5 text-slate-900"
                  >
                    <span className="inline-flex items-center text-slate-900">
                      {'SMART PACKING'.split('').map((char, idx) => (
                        <motion.span
                          key={idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: idx * 0.03, ease: 'easeOut' }}
                          className="inline-block"
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </motion.span>
                      ))}
                    </span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.45, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
                      className="font-black bg-clip-text text-transparent animate-text-flow inline-block"
                      style={{
                        backgroundImage: 'linear-gradient(90deg, #3498db 0%, #8e44ad 50%, #3498db 100%)'
                      }}
                    >
                      PRO
                    </motion.span>
                  </motion.h1>
                </div>
                <p className="text-[11px] md:text-xs font-semibold text-slate-500 leading-tight mt-0.5 truncate">
                  ระบบควบคุม OEE และคุณภาพเครื่องบรรจุ 1Kg
                </p>
              </div>
            </div>

            {/* Desktop Navigation Dock */}
            <nav
              onMouseLeave={() => setHoveredNav(null)}
              className="hidden md:flex relative items-center p-1.5 rounded-2xl border border-slate-200/90 bg-slate-100/85 gap-1 shadow-inner"
            >
              {[
                {
                  key: 'form',
                  label: 'บันทึก Seal Temp',
                  icon: <ClipboardEdit className={`w-3.5 h-3.5 transition-colors duration-300 ${targetNavKey === 'form' ? 'text-white' : 'text-blue-600'}`} />
                },
                {
                  key: 'oee',
                  label: 'บันทึก OEE',
                  icon: <FileSpreadsheet className={`w-3.5 h-3.5 transition-colors duration-300 ${targetNavKey === 'oee' ? 'text-white' : 'text-emerald-600'}`} />
                },
                {
                  key: 'film',
                  label: 'บันทึกม้วนฟิล์ม',
                  icon: (
                    <svg className={`w-3.5 h-3.5 transition-colors duration-300 ${targetNavKey === 'film' ? 'text-white' : 'text-purple-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/>
                    </svg>
                  )
                },
                {
                  key: 'dashboard',
                  label: 'แดชบอร์ด',
                  icon: <Award className={`w-3.5 h-3.5 transition-colors duration-300 ${targetNavKey === 'dashboard' ? 'text-white' : 'text-indigo-500'}`} />
                }
              ].map(item => {
                const isHighlighted = targetNavKey === item.key;
                return (
                  <button
                    key={item.key}
                    ref={el => { navBtnRefs.current[item.key] = el; }}
                    onClick={() => setCurrentView(item.key as any)}
                    onMouseEnter={() => setHoveredNav(item.key)}
                    className={`relative z-10 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors duration-300 whitespace-nowrap ${
                      isHighlighted ? 'text-white' : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                );
              })}
              <span
                aria-hidden="true"
                className="absolute top-1.5 bottom-1.5 rounded-xl pointer-events-none transition-all duration-500 ease-out shadow-md z-0"
                style={{
                  left: `${navIndicatorStyle.left}px`,
                  width: `${navIndicatorStyle.width}px`,
                  opacity: navIndicatorStyle.opacity,
                  background: 'linear-gradient(to right, #3498db, #8e44ad)'
                }}
              />
            </nav>

          </div>
        </header>

        {/* =========================================================
            VIEW 1: SMART DATA ENTRY FORM
           ========================================================= */}
        {currentView === 'form' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6 space-y-5"
          >
            {/* Active Context Banner */}
            <section className={`rounded-3xl backdrop-blur-xl border p-4 sm:p-5 transition-all duration-300 ${cardBg}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300"
                    style={{ backgroundColor: `${activeMachineObj.color}20`, color: activeMachineObj.color }}
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight font-display">
                      บันทึกพารามิเตอร์
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      ตรวจสอบและบันทึกค่ามาตรฐานเครื่องบรรจุประจำกะ
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 justify-between md:justify-end">
                  {/* Live Digital Clock Pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-mono text-xs font-semibold text-slate-700 tracking-tight">
                      {clockString}
                    </span>
                  </div>

                  {/* Dynamic Machine & Shift Summary Pill */}
                  <div
                    className="flex items-center justify-center gap-3 px-4 py-2 rounded-2xl text-white transition-all duration-300"
                    style={{
                      backgroundColor: activeMachineObj.color,
                      boxShadow: `0 10px 24px -6px ${activeMachineObj.color}75`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse"></span>
                      <span className="font-bold text-xs sm:text-sm tracking-wide font-display">
                        เครื่องบรรจุ 1Kg • No.{activeMachineObj.id}
                      </span>
                    </div>
                    <span className="h-4 w-px bg-white/35"></span>
                    <span className="text-xs font-semibold bg-black/15 px-2.5 py-0.5 rounded-xl whitespace-nowrap">
                      กะ {shift} • {shiftType === '12h' ? '12 ชม.' : '8 ชม.'}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* View Switcher Tabs (2 Tabs: บันทึกข้อมูล / ประวัติล่าสุด) */}
            {(() => {
              const recentSealLogs = sealTempRecords.length > 0
                ? sealTempRecords
                : records.filter(r => r.recordType === 'sealTemp' || (!r.recordType && r.tempFront != null));

              return (
                <>
                  <div
                    role="tablist"
                    aria-label="มุมมองบันทึกพารามิเตอร์"
                    className={`p-1.5 rounded-2xl backdrop-blur-xl border shadow-glass grid grid-cols-2 gap-1.5 ${cardBg}`}
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={formSubTab === 'form'}
                      onClick={() => setFormSubTab('form')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 font-display ${
                        formSubTab === 'form'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                          : 'text-slate-600 hover:bg-slate-100/80'
                      }`}
                    >
                      <ClipboardEdit className="w-4 h-4" />
                      <span>บันทึกข้อมูล</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={formSubTab === 'history'}
                      onClick={() => setFormSubTab('history')}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 font-display ${
                        formSubTab === 'history'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                          : 'text-slate-600 hover:bg-slate-100/80'
                      }`}
                    >
                      <History className="w-4 h-4" />
                      <span>ประวัติล่าสุด</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full transition-colors ${
                          formSubTab === 'history'
                            ? 'bg-white/25 text-white'
                            : 'bg-slate-200/90 text-slate-700'
                        }`}
                      >
                        {recentSealLogs.length}
                      </span>
                    </button>
                  </div>

                  {formSubTab === 'history' && (() => {
                    const filteredSeal = recentSealLogs.filter(r => {
                      const recDate = r.reportDate || r.datetime || '';
                      if (sealFilterDate && !matchesDateFilter(recDate, sealFilterDate)) return false;
                      if (sealFilterMachine !== 'all' && r.machine !== sealFilterMachine) return false;
                      if (sealFilterShift !== 'all' && r.shift !== sealFilterShift) return false;
                      if (sealFilterOperator !== 'all' && r.operator !== sealFilterOperator) return false;
                      return true;
                    });

                    const renderChecklistBadge = (val?: string | null) => {
                      const isPass = val === 'pass' || val === 'ผ่าน';
                      const isFail = val === 'fail' || val === 'ไม่ผ่าน';
                      if (isPass) return <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-black border border-emerald-200">✔ ผ่าน</span>;
                      if (isFail) return <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-black border border-rose-200">✘ ไม่ผ่าน</span>;
                      return <span className="text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-200">-</span>;
                    };

                    return (
                    <section className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                        <div>
                          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
                            <ListCheck className="w-5 h-5 text-blue-600" />
                            <span>ประวัติบันทึก Seal Temp (Temperature & Check Sheet)</span>
                          </h3>
                          <p className="text-xs text-slate-500">รายการประวัติการตรวจสอบอุณหภูมิฮีตเตอร์และซีลความร้อน</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleExportExcel}
                          className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 text-xs font-black flex items-center gap-2 hover:bg-emerald-500/30 transition shadow-sm self-start sm:self-auto"
                        >
                          <FileSpreadsheet className="w-4 h-4" /> ส่งออก Excel
                        </button>
                      </div>

                      {/* Filter Bar for Seal Temp History */}
                      <div className={`backdrop-blur-xl border rounded-2xl p-3 shadow-glass ${cardBg} grid grid-cols-1 sm:grid-cols-4 gap-2.5`}>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-black text-slate-600 block">📅 วันที่ (Date)</label>
                            <button
                              type="button"
                              onClick={() => setSealFilterDate(sealFilterDate ? '' : new Date().toISOString().slice(0, 10))}
                              className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition ${!sealFilterDate ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}`}
                            >
                              {!sealFilterDate ? '✓ All (ทั้งหมด)' : 'All'}
                            </button>
                          </div>
                          <input
                            type="date"
                            value={sealFilterDate}
                            onChange={e => setSealFilterDate(e.target.value)}
                            className="w-full text-xs font-mono font-bold border rounded-xl p-2 bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-600 block mb-1">⚙️ เครื่องจักร (Machine)</label>
                          <select
                            value={sealFilterMachine}
                            onChange={e => setSealFilterMachine(e.target.value)}
                            className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                          >
                            <option value="all">All (ทุกเครื่อง)</option>
                            {MACHINES.map(m => (
                              <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-600 block mb-1">⏰ กะ (Shift)</label>
                          <select
                            value={sealFilterShift}
                            onChange={e => setSealFilterShift(e.target.value)}
                            className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                          >
                            <option value="all">All (ทุกกะ)</option>
                            <option value="A">กะ A</option>
                            <option value="B">กะ B</option>
                            <option value="C">กะ C</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-600 block mb-1">👤 ผู้บันทึก (Operator)</label>
                          <select
                            value={sealFilterOperator}
                            onChange={e => setSealFilterOperator(e.target.value)}
                            className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                          >
                            <option value="all">All (ทุกคน)</option>
                            {INSPECTORS.map(ins => (
                              <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {(sealFilterDate || sealFilterMachine !== 'all' || sealFilterShift !== 'all' || sealFilterOperator !== 'all') && (
                        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-800 font-bold">
                          <span>กำลังกรองข้อมูล (Matched: {filteredSeal.length})</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSealFilterDate('');
                              setSealFilterMachine('all');
                              setSealFilterShift('all');
                              setSealFilterOperator('all');
                            }}
                            className="text-rose-600 hover:underline font-black"
                          >
                            ล้างตัวกรอง ✕
                          </button>
                        </div>
                      )}

                      {filteredSeal.length === 0 ? (
                        <div className={`rounded-3xl backdrop-blur-xl border p-10 text-center space-y-3 ${cardBg}`}>
                          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                            <Inbox className="w-7 h-7" />
                          </div>
                          <h4 className="font-bold text-slate-700 font-display">ไม่พบประวัติ Seal Temp ตามเงื่อนไขที่เลือก</h4>
                          <p className="text-xs text-slate-500">ลองปรับตัวกรอง หรือกรอกพารามิเตอร์ในแท็บ "บันทึกข้อมูล"</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredSeal.map((r) => {
                            const m = MACHINES.find(item => item.name === r.machine) || { id: 1, name: r.machine, color: '#3b82f6' };
                            const ok = recordOk(r);
                            return (
                              <article
                                key={r.id || Math.random()}
                                className={`rounded-3xl backdrop-blur-xl border p-4 sm:p-5 space-y-3 transition-all hover:shadow-lg ${cardBg}`}
                              >
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold text-white shadow-sm font-display"
                                      style={{ backgroundColor: m.color }}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                      {m.name}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700">
                                      กะ {r.shift || '-'} • {r.shiftType === '12h' ? '12 ชม.' : '8 ชม.'}
                                    </span>
                                  </div>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                                      ok ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                    }`}
                                  >
                                    {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                    {ok ? 'ผ่านทั้งหมด' : 'มีรายการไม่ผ่าน'}
                                  </span>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 border-b border-slate-100 pb-2">
                                  <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                    <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                                    <span>{r.operator || '-'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 font-mono">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatDDMMYYYY(r.datetime)}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/60">
                                    <span className="text-[10px] text-slate-400 block">ความเร็ว</span>
                                    <span className="font-mono font-bold text-sm text-slate-800">
                                      {r.speed ?? '-'} <span className="text-[10px] font-sans font-normal text-slate-400">bag/m</span>
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/60">
                                    <span className="text-[10px] text-slate-400 block">{m.id <= 2 ? 'ซีลบน' : 'ซีลหน้า'}</span>
                                    <span className={`font-mono font-bold text-sm ${r.tfStatus === 'fail' ? 'text-rose-600' : 'text-slate-800'}`}>
                                      {r.tempFront ?? '-'} <span className="text-[10px] font-sans font-normal text-slate-400">°C</span>
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/60">
                                    <span className="text-[10px] text-slate-400 block">{m.id <= 2 ? 'ซีลล่าง' : 'ซีลหลัง'}</span>
                                    <span className={`font-mono font-bold text-sm ${r.tbStatus === 'fail' ? 'text-rose-600' : 'text-slate-800'}`}>
                                      {r.tempBack ?? '-'} <span className="text-[10px] font-sans font-normal text-slate-400">°C</span>
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-200/60">
                                    <span className="text-[10px] text-slate-400 block">ซีลกลาง</span>
                                    <span className={`font-mono font-bold text-sm ${r.tmStatus === 'fail' ? 'text-rose-600' : 'text-slate-800'}`}>
                                      {r.tempMid ?? '-'} <span className="text-[10px] font-sans font-normal text-slate-400">°C</span>
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px] bg-slate-50/80 p-2 rounded-2xl border border-slate-200/70">
                                  <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                                    <span className="font-bold text-slate-700">🏷️ Lot No.</span>
                                    {renderChecklistBadge(r.lot)}
                                  </div>
                                  <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                                    <span className="font-bold text-slate-700">🛠️ เทปล่อน</span>
                                    {renderChecklistBadge(r.teflon)}
                                  </div>
                                  <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                                    <span className="font-bold text-slate-700">📦 Seal (บน)</span>
                                    {renderChecklistBadge(r.packSealTop)}
                                  </div>
                                  <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                                    <span className="font-bold text-slate-700">📦 Seal (กลาง)</span>
                                    {renderChecklistBadge(r.packSealMid)}
                                  </div>
                                  <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                                    <span className="font-bold text-slate-700">📦 Seal (ล่าง)</span>
                                    {renderChecklistBadge(r.packSealBot)}
                                  </div>
                                  <div className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xl border border-slate-100">
                                    <span className="font-bold text-slate-700">🎯 รูเข็ม</span>
                                    {renderChecklistBadge(r.hole)}
                                  </div>
                                </div>

                                {r.notes && (
                                  <div className="px-3.5 py-2.5 rounded-2xl bg-blue-50/75 border border-blue-100 text-xs text-slate-600 flex items-start gap-2">
                                    <MessageSquare className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                    <span>{r.notes}</span>
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                    );
                  })()}

                  {formSubTab === 'form' && (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Card 1: Shift & Operator & Machine Selector */}
              <div className={`rounded-3xl backdrop-blur-xl border p-5 sm:p-6 flex flex-col gap-5 ${cardBg}`}>
                {/* Section Header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-blue-600 font-display">
                      SHIFT & OPERATOR SELECTION
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">เลือกเครื่องจักร กะการทำงาน และผู้ตรวจสอบ</p>
                  </div>
                </div>

                {/* Machine Selection Cards */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <Cpu className="w-4 h-4 text-slate-400" />
                    <span>เลือกเครื่องจักร (Machine)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
                    {MACHINES.map(m => {
                      const isSelected = selectedMachine === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMachine(m.id)}
                          style={isSelected ? {
                            borderColor: m.color,
                            color: m.color,
                            backgroundColor: `${m.color}18`,
                            boxShadow: `0 0 0 2px ${m.color}38, 0 6px 14px -4px ${m.color}55`
                          } : undefined}
                          className={`relative overflow-hidden py-2.5 px-2 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1.5 border active:scale-95 ${
                            isSelected
                              ? 'scale-[1.02]'
                              : 'bg-slate-50/90 border-slate-200/80 text-slate-700 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all" style={{ backgroundColor: m.color }}></span>
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: m.color }}></span>
                          <span className="font-display">No.{m.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Segmented Control */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>กะการทำงาน (Shift)</span>
                  </label>
                  <div className="p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/70 grid grid-cols-3 gap-1.5">
                    {[
                      { key: 'A', label: 'กะ A', gradient: 'from-blue-600 to-indigo-600 shadow-blue-500/25' },
                      { key: 'B', label: 'กะ B', gradient: 'from-amber-500 to-orange-600 shadow-amber-500/25' },
                      { key: 'C', label: 'กะ C', gradient: 'from-emerald-600 to-teal-600 shadow-emerald-500/25' }
                    ].map(sh => (
                      <button
                        key={sh.key}
                        type="button"
                        onClick={() => setShift(sh.key)}
                        className={`py-2 rounded-xl text-xs sm:text-sm font-semibold font-display transition-all duration-200 ${
                          shift === sh.key
                            ? `bg-gradient-to-r ${sh.gradient} text-white shadow-md`
                            : 'text-slate-600 hover:bg-white/70'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shift Duration Toggle */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <CalendarClock className="w-4 h-4 text-slate-400" />
                    <span>ระยะเวลากะ (Duration)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShiftType('8h')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-2xl text-xs font-semibold border transition-all duration-200 active:scale-[0.98] font-display ${
                        shiftType === '8h'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-md shadow-blue-500/25'
                          : 'bg-slate-50/90 text-slate-600 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>กะ 8 ชม. (จ-พฤ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShiftType('12h')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-2xl text-xs font-semibold border transition-all duration-200 active:scale-[0.98] font-display ${
                        shiftType === '12h'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md shadow-purple-500/25'
                          : 'bg-slate-50/90 text-slate-600 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>กะ 12 ชม. (ศ-อา)</span>
                    </button>
                  </div>
                </div>

                {/* Operator Select Dropdown */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
                    <Shield className="w-4 h-4 text-slate-400" />
                    <span>ผู้ตรวจสอบ (Operator)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-blue-600">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <select
                      value={operator}
                      onChange={e => setOperator(e.target.value)}
                      required
                      className={`w-full appearance-none border rounded-2xl py-3 pl-10 pr-9 text-xs sm:text-sm font-semibold transition-all cursor-pointer focus:outline-none ${inputBg}`}
                    >
                      <option value="">-- กรุณาเลือกรายชื่อผู้ตรวจสอบ --</option>
                      {INSPECTORS.map(ins => (
                        <option key={ins.name} value={ins.name}>
                          {ins.emoji} {ins.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Speed Input with +/- Stepper & Live Badge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>ความเร็ว Speed (bag/min)</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    {(() => {
                      const spd = parseFloat(speed);
                      const setTarget = customSpeedSpecs[selectedMachine]?.set ?? 45;
                      if (!speed.trim() || isNaN(spd) || spd <= 0) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200/80 text-slate-600">
                            รอระบุค่า
                          </span>
                        );
                      }
                      if (spd >= setTarget * 0.9) {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> ปกติ
                          </span>
                        );
                      }
                      return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-700">
                          ต่ำกว่า Set ({setTarget})
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="ลดความเร็ว"
                      onClick={() => {
                        const curr = parseFloat(speed) || (customSpeedSpecs[selectedMachine]?.set ?? 30);
                        setSpeed(String(Math.max(0, Number((curr - 1).toFixed(1)))));
                      }}
                      className="w-11 h-11 shrink-0 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        step="0.1"
                        value={speed}
                        onChange={e => setSpeed(e.target.value)}
                        placeholder="เช่น 50"
                        required
                        className={`w-full h-11 px-3 pr-16 rounded-2xl border font-mono text-base font-bold text-center focus:outline-none transition-all ${inputBg}`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-semibold text-slate-400">
                        bag/min
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="เพิ่มความเร็ว"
                      onClick={() => {
                        const curr = parseFloat(speed) || (customSpeedSpecs[selectedMachine]?.set ?? 30);
                        setSpeed(String(Math.min(150, Number((curr + 1).toFixed(1)))));
                      }}
                      className="w-11 h-11 shrink-0 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px] text-slate-500 font-mono font-bold">
                    <div className="flex items-center gap-1 bg-slate-50/90 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                      <span className="text-slate-500 font-semibold">Std.:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customSpeedSpecs[selectedMachine]?.std ?? 34.67}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), std: val }
                          }));
                        }}
                        className="w-full text-right font-mono font-bold text-slate-900 bg-transparent focus:outline-none text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-50/90 border border-slate-200/80 rounded-xl px-2.5 py-1.5">
                      <span className="text-slate-500 font-semibold">Set:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={customSpeedSpecs[selectedMachine]?.set ?? 45.00}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), set: val }
                          }));
                        }}
                        className="w-full text-right font-mono font-bold text-slate-900 bg-transparent focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Thermal, Time & QC Parameters */}
              <div className={`lg:col-span-2 rounded-3xl backdrop-blur-xl border p-5 sm:p-6 flex flex-col gap-5 ${cardBg}`}>
                {/* Section Header */}
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200/70">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-indigo-600 font-display">
                      TEMP. & TIME PARAMETERS
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">ค่าความร้อนซีล เวลาแช่ และตรวจสอบคุณภาพแพ็คเกจ</p>
                  </div>
                </div>

                {selectedMachine === 1 && (
                  <div className={`border p-3.5 rounded-2xl ${subCardBg}`}>
                    <label className="text-xs font-bold text-blue-700 block mb-1.5 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" /> เลือกลักษณะสเปคอุณหภูมิ No.1
                    </label>
                    <select
                      value={no1Group}
                      onChange={e => setNo1Group(e.target.value as any)}
                      className={`w-full border rounded-xl py-2.5 px-3 text-xs font-bold ${inputBg}`}
                    >
                      <option value="group1">กลุ่ม 1 (มาตรฐาน: 175-210 / 175-210)</option>
                      <option value="group2">กลุ่ม 2 (ความร้อนสูง: 170-190 / 170-185)</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {/* Front/Top Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2.5 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-rose-500" /> {selectedMachine === 1 || selectedMachine === 2 ? 'ซีลบน' : 'ซีลหน้า'} <span className="text-rose-500">*</span></span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${tfStatus === 'pass' ? 'bg-emerald-100 text-emerald-700' : tfStatus === 'fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/80 text-slate-600'}`}>
                        {tfStatus === 'pass' ? `✔ ปกติ` : tfStatus === 'fail' ? `✘ หลุด` : 'รอระบุ'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={tempFront}
                        onChange={e => setTempFront(e.target.value)}
                        placeholder="เช่น 185"
                        required
                        className={`w-full border rounded-2xl h-11 pl-3.5 pr-10 text-base font-bold font-mono focus:outline-none transition-all ${inputBg}`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400">°C</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                        <span className="text-slate-400 font-semibold">Min:</span>
                        <input
                          type="number"
                          value={limits.tempFront[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [val, prev.tempFront[1]] }));
                          }}
                          className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                        <span className="text-slate-400 font-semibold">Max:</span>
                        <input
                          type="number"
                          value={limits.tempFront[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [prev.tempFront[0], val] }));
                          }}
                          className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Back/Bot Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2.5 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> {selectedMachine === 1 || selectedMachine === 2 ? 'ซีลล่าง' : 'ซีลหลัง'} <span className="text-rose-500">*</span></span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${tbStatus === 'pass' ? 'bg-emerald-100 text-emerald-700' : tbStatus === 'fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/80 text-slate-600'}`}>
                        {tbStatus === 'pass' ? `✔ ปกติ` : tbStatus === 'fail' ? `✘ หลุด` : 'รอระบุ'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={tempBack}
                        onChange={e => setTempBack(e.target.value)}
                        placeholder="เช่น 185"
                        required
                        className={`w-full border rounded-2xl h-11 pl-3.5 pr-10 text-base font-bold font-mono focus:outline-none transition-all ${inputBg}`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400">°C</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                        <span className="text-slate-400 font-semibold">Min:</span>
                        <input
                          type="number"
                          value={limits.tempBack[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [val, prev.tempBack[1]] }));
                          }}
                          className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                        <span className="text-slate-400 font-semibold">Max:</span>
                        <input
                          type="number"
                          value={limits.tempBack[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [prev.tempBack[0], val] }));
                          }}
                          className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Mid Temp */}
                  <div className={`border p-3.5 rounded-2xl flex flex-col gap-2.5 ${subCardBg}`}>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5"><Thermometer className="w-4 h-4 text-emerald-500" /> ซีลกลาง <span className="text-rose-500">*</span></span>
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${tmStatus === 'pass' ? 'bg-emerald-100 text-emerald-700' : tmStatus === 'fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/80 text-slate-600'}`}>
                        {tmStatus === 'pass' ? `✔ ปกติ` : tmStatus === 'fail' ? `✘ หลุด` : 'รอระบุ'}
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={tempMid}
                        onChange={e => setTempMid(e.target.value)}
                        placeholder="เช่น 180"
                        required
                        className={`w-full border rounded-2xl h-11 pl-3.5 pr-10 text-base font-bold font-mono focus:outline-none transition-all ${inputBg}`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400">°C</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                        <span className="text-slate-400 font-semibold">Min:</span>
                        <input
                          type="number"
                          value={limits.tempMid[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [val, prev.tempMid[1]] }));
                          }}
                          className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                        <span className="text-slate-400 font-semibold">Max:</span>
                        <input
                          type="number"
                          value={limits.tempMid[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [prev.tempMid[0], val] }));
                          }}
                          className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dwell Time Front/Back (Machines 3-7) */}
                  {selectedMachine > 2 && (
                    <div className={`border p-3.5 rounded-2xl flex flex-col gap-2.5 ${subCardBg}`}>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5"><Gauge className="w-4 h-4 text-blue-600" /> แช่จอหน้า-หลัง <span className="text-rose-500">*</span></span>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${timeFbStatus === 'pass' ? 'bg-emerald-100 text-emerald-700' : timeFbStatus === 'fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/80 text-slate-600'}`}>
                          {timeFbStatus === 'pass' ? '✔ ปกติ' : timeFbStatus === 'fail' ? '✘ หลุด' : 'รอระบุ'}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={timeFrontBack}
                          onChange={e => setTimeFrontBack(e.target.value)}
                          placeholder="เช่น 120-360"
                          required
                          className={`w-full border rounded-2xl h-11 pl-3.5 pr-10 text-base font-bold font-mono focus:outline-none transition-all ${inputBg}`}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400">ms</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                          <span className="text-slate-400 font-semibold">Min:</span>
                          <input
                            type="number"
                            value={limits.timeFrontBack?.[0] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeFrontBack: [val, prev.timeFrontBack?.[1] || 0] }));
                            }}
                            className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                          <span className="text-slate-400 font-semibold">Max:</span>
                          <input
                            type="number"
                            value={limits.timeFrontBack?.[1] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeFrontBack: [prev.timeFrontBack?.[0] || 0, val] }));
                            }}
                            className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dwell Time Mid (Machines 3-7) */}
                  {selectedMachine > 2 && (
                    <div className={`border p-3.5 rounded-2xl flex flex-col gap-2.5 ${subCardBg}`}>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5"><Gauge className="w-4 h-4 text-blue-600" /> แช่จอกลาง <span className="text-rose-500">*</span></span>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${timeMStatus === 'pass' ? 'bg-emerald-100 text-emerald-700' : timeMStatus === 'fail' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/80 text-slate-600'}`}>
                          {timeMStatus === 'pass' ? '✔ ปกติ' : timeMStatus === 'fail' ? '✘ หลุด' : 'รอระบุ'}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          value={timeMid}
                          onChange={e => setTimeMid(e.target.value)}
                          placeholder="เช่น 120-360"
                          required
                          className={`w-full border rounded-2xl h-11 pl-3.5 pr-10 text-base font-bold font-mono focus:outline-none transition-all ${inputBg}`}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400">ms</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-500 font-mono font-bold">
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                          <span className="text-slate-400 font-semibold">Min:</span>
                          <input
                            type="number"
                            value={limits.timeMid?.[0] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeMid: [val, prev.timeMid?.[1] || 0] }));
                            }}
                            className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl px-2.5 py-1">
                          <span className="text-slate-400 font-semibold">Max:</span>
                          <input
                            type="number"
                            value={limits.timeMid?.[1] || 0}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setLimits(prev => ({ ...prev, timeMid: [prev.timeMid?.[0] || 0, val] }));
                            }}
                            className="w-full text-right font-mono font-bold text-slate-800 bg-transparent focus:outline-none text-[11px]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* QC Checklist */}
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-display">
                    <ListCheck className="w-4 h-4 text-blue-600" /> Quality & Package Verification <span className="text-rose-500">*</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      { key: 'lot', label: '🏷️ Lot No.' },
                      { key: 'teflon', label: '🛠️ เทปล่อน' },
                      { key: 'packSealTop', label: '📦 Seal (บน)' },
                      { key: 'packSealMid', label: '📦 Seal (กลาง)' },
                      { key: 'packSealBot', label: '📦 Seal (ล่าง)' },
                      { key: 'hole', label: '🎯 ตำแหน่งรูเข็ม' }
                    ].map(item => {
                      const val = (qc as any)[item.key];
                      return (
                        <div key={item.key} className={`border p-3 rounded-2xl flex flex-col gap-2 ${subCardBg}`}>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5 text-blue-600" /> {item.label} <span className="text-rose-500">*</span></span>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setQc({ ...qc, [item.key]: val === 'pass' ? null : 'pass' })}
                              className={`py-2 px-3 rounded-2xl text-xs font-semibold transition-all border active:scale-[0.98] ${
                                val === 'pass'
                                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              ✔ ผ่าน
                            </button>
                            <button
                              type="button"
                              onClick={() => setQc({ ...qc, [item.key]: val === 'fail' ? null : 'fail' })}
                              className={`py-2 px-3 rounded-2xl text-xs font-semibold transition-all border active:scale-[0.98] ${
                                val === 'fail'
                                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              ✘ ไม่ผ่าน
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 block">📝 หมายเหตุเพิ่มเติม (Notes)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ระบุรายละเอียดเพิ่มเติม เช่น เปลี่ยนม้วนฟิล์ม ปรับตั้งค่าอุณหภูมิ หรือปัญหาที่พบ..."
                    className={`w-full border rounded-2xl p-3.5 text-xs sm:text-sm focus:outline-none transition-all resize-none ${inputBg}`}
                  ></textarea>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSpeed('');
                      setTempFront('');
                      setTempBack('');
                      setTempMid('');
                      setTimeFrontBack('');
                      setTimeMid('');
                      setQc({ lot: null, teflon: null, packSealTop: null, packSealMid: null, packSealBot: null, hole: null });
                      setTargetKg('');
                      setActualKg('');
                      setGoodKg('');
                      setRejectKg('');
                      setNotes('');
                      showToast('ล้างค่าฟอร์มแล้ว');
                    }}
                    className="px-5 py-3.5 rounded-2xl border font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-sm active:scale-[0.98]"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-600" /> ล้างข้อมูล
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <Save className="w-4 h-4" /> บันทึก
                  </button>
                </div>
              </div>
                    </form>
                  )}
                </>
              );
            })()}
          </motion.main>
        )}

        {/* =========================================================
            VIEW 2: OEE RECORDING VIEW (บันทึก OEE)
           ========================================================= */}
        {currentView === 'oee' && (() => {
          const allOeeRecords = records.filter(item => {
            const r = item as any;
            return r.recordType === 'oee' ||
              r.targetKg !== undefined || r.target !== undefined ||
              r.goodKg !== undefined || r.good !== undefined ||
              r.actualKg !== undefined || r.actual !== undefined ||
              r.speed !== undefined || r.speedActual !== undefined ||
              r['Target'] !== undefined || r['Good'] !== undefined ||
              r.tempFront === undefined || r.tempFront === null;
          });

          return (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600" /> บันทึกข้อมูล OEE และการผลิต (OEE Production Records)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">บันทึกค่า Target, Actual, Good, Reject และ Breakdown Time แยกตามกะและเครื่องจักร</p>
                </div>
              </div>

              {/* View Switcher Tabs (2 Tabs: บันทึกข้อมูล / ประวัติล่าสุด) */}
              <div
                role="tablist"
                aria-label="มุมมองบันทึก OEE"
                className={`p-1.5 rounded-2xl backdrop-blur-xl border shadow-glass grid grid-cols-2 gap-1.5 ${cardBg}`}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={oeeSubTab === 'form'}
                  onClick={() => setOeeSubTab('form')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 font-display ${
                    oeeSubTab === 'form'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <ClipboardEdit className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={oeeSubTab === 'history'}
                  onClick={() => setOeeSubTab('history')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 font-display ${
                    oeeSubTab === 'history'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>ประวัติล่าสุด</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full transition-colors ${
                      oeeSubTab === 'history'
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {allOeeRecords.length}
                  </span>
                </button>
              </div>

              {oeeSubTab === 'form' && (
              <form onSubmit={handleOeeSubmit} className={`backdrop-blur-xl border rounded-3xl p-6 shadow-2xl space-y-6 ${cardBg}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Factory className="w-4 h-4 text-blue-600" /> เลือกเครื่องจักร (Machine)
                    </label>
                    <select
                      value={selectedMachine}
                      onChange={e => setSelectedMachine(Number(e.target.value))}
                      className={`w-full border rounded-xl py-3 px-3 text-sm font-black ${inputBg}`}
                    >
                      {MACHINES.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" /> กะการทำงาน (Shift)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 p-1 border rounded-xl bg-slate-100 border-slate-300">
                      {[
                        { key: 'A', label: 'กะ A', color: 'from-blue-600 to-indigo-600' },
                        { key: 'B', label: 'กะ B', color: 'from-amber-500 to-orange-600' },
                        { key: 'C', label: 'กะ C', color: 'from-emerald-600 to-teal-600' }
                      ].map(sh => (
                        <button
                          key={sh.key}
                          type="button"
                          onClick={() => setShift(sh.key)}
                          className={`py-2 rounded-lg text-xs md:text-sm font-black font-display transition-all shadow-sm ${shift === sh.key ? `bg-gradient-to-r ${sh.color} text-white ring-2 ring-offset-1 ring-blue-400 scale-105` : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'}`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Shift Hours Type Selector (กะปกติ 8 ชม. / กะยาว 12 ชม.) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 block flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" /> ประเภทกะการทำงาน (Shift Duration Type)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-w-sm">
                    <button
                      type="button"
                      onClick={() => setShiftType('8h')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-2xl text-xs font-semibold border transition-all duration-200 active:scale-[0.98] font-display ${
                        shiftType === '8h'
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-md shadow-blue-500/25'
                          : 'bg-slate-50/90 text-slate-600 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>กะ 8 ชม. (จ-พฤ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShiftType('12h')}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-2xl text-xs font-semibold border transition-all duration-200 active:scale-[0.98] font-display ${
                        shiftType === '12h'
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md shadow-purple-500/25'
                          : 'bg-slate-50/90 text-slate-600 border-slate-200 hover:bg-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                      <span>กะ 12 ชม. (ศ-อา)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" /> ผู้บันทึก (Operator) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={operator}
                    onChange={e => setOperator(e.target.value)}
                    required
                    className={`w-full border rounded-xl py-3 px-3 text-sm font-black ${inputBg}`}
                  >
                    <option value="">-- เลือกผู้บันทึก --</option>
                    {INSPECTORS.map(ins => (
                      <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-blue-600" /> รายงานประจำ วันที่ (Report Date) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={e => {
                      const val = e.target.value;
                      setReportDate(val);
                      if (val) setShiftType(getDefaultShiftTypeByDate(val));
                    }}
                    required
                    className={`w-full border rounded-xl py-3 px-3 text-sm font-black font-mono ${inputBg}`}
                  />
                </div>

              {/* 3 Distinct Cards Layout for Availability, Performance, Quality */}
              {(() => {
                const ptNum = parseFormattedNumber(planTime) || 0;
                const rtNum = parseFormattedNumber(runTime) || 0;
                const meLive = ptNum > 0 ? Math.min(100, Math.max(0, (rtNum / ptNum) * 100)) : 0;

                const setNum = parseFormattedNumber(speedSet) || 0;
                const actSpeedNum = parseFormattedNumber(speed) || 0;
                const perfLive = setNum > 0 && speed.trim() !== '' ? Math.max(0, (actSpeedNum / setNum) * 100) : 0;

                const actKgNum = parseFormattedNumber(actualKg) || 0;
                const goodKgNum = parseFormattedNumber(goodKg) || 0;
                const qualLive = actKgNum > 0 ? Math.min(100, Math.max(0, (goodKgNum / actKgNum) * 100)) : 0;

                return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                {/* 1. Availability Card */}
                <div className={`backdrop-blur-xl border rounded-3xl shadow-xl overflow-hidden flex flex-col ${cardBg}`}>
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500" />
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-blue-950 font-display flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                          </span>
                          <span>Availability</span>
                        </h3>
                        <span className="text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full font-bold">
                          {shiftType === '12h' ? 'กะ 12 ชม.' : 'กะ 8 ชม.'}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
                            <span>📅 Plan Time <span className="text-rose-500">*</span></span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={planTime}
                              onChange={e => setPlanTime(formatNumberInput(e.target.value))}
                              placeholder="480"
                              required
                              className="w-full text-sm font-mono tabular-nums font-black text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-slate-400">min</span>
                          </div>
                        </div>

                        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
                            <span>⏳ Run Time <span className="text-rose-500">*</span></span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={runTime}
                              onChange={e => setRunTime(formatNumberInput(e.target.value))}
                              placeholder="480"
                              required
                              className="w-full text-sm font-mono tabular-nums font-black text-emerald-700 bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-11 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 transition-all"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-slate-400">min</span>
                          </div>
                        </div>

                        <div className="bg-amber-50/75 border border-amber-200/90 rounded-2xl p-3 shadow-2xs">
                          <label className="text-[11px] font-bold text-amber-900 block mb-1.5 flex items-center gap-1.5">
                            <span>🔧 BD (Min) <span className="text-rose-500">*</span></span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={breakdownMin}
                              onChange={e => setBreakdownMin(formatNumberInput(e.target.value))}
                              onBlur={() => {
                                if (breakdownMin.trim() === '') setBreakdownMin('0');
                              }}
                              placeholder="0"
                              required
                              className="w-full text-sm font-mono tabular-nums font-black text-amber-800 bg-white border border-amber-200 rounded-xl py-2.5 pl-3 pr-11 focus:outline-none focus:ring-2 focus:ring-amber-500/35 focus:border-amber-500 transition-all"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-amber-500">min</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">ME (Availability)</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 font-mono font-black text-blue-700">
                        {meLive.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Performance Card */}
                <div className={`backdrop-blur-xl border rounded-3xl shadow-xl overflow-hidden flex flex-col ${cardBg}`}>
                  <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-violet-500 to-fuchsia-500" />
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-purple-950 font-display flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center">
                            <Gauge className="w-4 h-4 text-purple-600" />
                          </span>
                          <span>Performance</span>
                        </h3>
                        <span className="text-[11px] font-mono bg-purple-50 text-purple-700 border border-purple-200/80 px-2.5 py-0.5 rounded-full font-bold">
                          Speed
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
                            <span>⚙️ Speed Std. <span className="text-rose-500">*</span></span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              value={speedStd}
                              onChange={e => setSpeedStd(e.target.value)}
                              placeholder="34.67"
                              required
                              className="w-full text-sm font-mono tabular-nums font-black text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-16 focus:outline-none focus:ring-2 focus:ring-purple-500/35 focus:border-purple-500 transition-all"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-slate-400">bag/min</span>
                          </div>
                        </div>

                        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
                          <label className="text-[11px] font-bold text-slate-600 block mb-1.5 flex items-center gap-1.5">
                            <span>🚀 Speed Set <span className="text-rose-500">*</span></span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              value={speedSet}
                              onChange={e => setSpeedSet(e.target.value)}
                              placeholder="45.00"
                              required
                              className="w-full text-sm font-mono tabular-nums font-black text-indigo-700 bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/35 focus:border-indigo-500 transition-all"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-slate-400">bag/min</span>
                          </div>
                        </div>

                        <div className="bg-blue-50/75 border border-blue-200/90 rounded-2xl p-3 shadow-2xs">
                          <label className="text-[11px] font-bold text-blue-900 block mb-1.5 flex items-center gap-1.5">
                            <span>⚡ Speed Act. <span className="text-rose-500">*</span></span>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              value={speed}
                              onChange={e => setSpeed(e.target.value)}
                              placeholder="0.0"
                              required
                              className="w-full text-sm font-mono tabular-nums font-black text-blue-800 bg-white border border-blue-200 rounded-xl py-2.5 pl-3 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-blue-400">bag/min</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Performance</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 font-mono font-black text-purple-700">
                        {speed.trim() !== '' ? `${perfLive.toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Quality Card */}
                <div className={`backdrop-blur-xl border rounded-3xl shadow-xl overflow-hidden flex flex-col ${cardBg}`}>
                  <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-emerald-950 font-display flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          </span>
                          <span>Quality</span>
                        </h3>
                        <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full font-bold">
                          Output (kg)
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {/* Target (kg) */}
                        <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                              <span>🎯 Target (kg) <span className="text-rose-500">*</span></span>
                            </label>
                            {userModifiedTarget && (
                              <button
                                type="button"
                                onClick={() => setUserModifiedTarget(false)}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 transition"
                              >
                                คำนวณอัตโนมัติ
                              </button>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={targetKg}
                              onChange={e => {
                                setUserModifiedTarget(true);
                                setTargetKg(formatNumberInput(e.target.value));
                              }}
                              placeholder="0"
                              required
                              className="w-full text-sm font-mono tabular-nums font-black text-slate-900 bg-white border border-slate-200 rounded-xl py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-slate-400">kg</span>
                          </div>
                        </div>

                        {/* Actual (kg) */}
                        <div className="bg-blue-50/55 border border-blue-200/90 rounded-2xl p-3 shadow-2xs">
                          <div className="flex items-center justify-between mb-1.5 gap-2">
                            <label className="text-[11px] font-bold text-blue-950 flex items-center gap-1">
                              <span>📦 Actual (kg) <span className="text-rose-500">*</span></span>
                            </label>
                          </div>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={actualKg}
                              onChange={e => handleActualKgChange(e.target.value)}
                              placeholder="0"
                              required
                              className="w-full text-sm font-mono tabular-nums font-black text-slate-900 bg-white border border-blue-200 rounded-xl py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/35 focus:border-blue-500 transition-all"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-blue-400">kg</span>
                          </div>
                        </div>

                        {/* Good (kg) & Reject (kg) */}
                        <div className="grid grid-cols-1 gap-2.5">
                          <div className="bg-emerald-50/85 border border-emerald-200/90 rounded-2xl p-3 shadow-2xs">
                            <label className="text-[11px] font-bold text-emerald-900 block mb-1.5">
                              ✨ Good (kg) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={goodKg}
                                onChange={e => handleGoodKgChange(e.target.value)}
                                placeholder="0"
                                required
                                className="w-full text-sm font-mono tabular-nums font-black text-emerald-700 bg-white border border-emerald-200 rounded-xl py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500/35 focus:border-emerald-500 transition-all"
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-emerald-500">kg</span>
                            </div>
                          </div>

                          <div className="bg-rose-50/85 border border-rose-200/90 rounded-2xl p-3 shadow-2xs">
                            <label className="text-[11px] font-bold text-rose-900 block mb-1.5">
                              ⚠️ Reject (kg) <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={rejectKg}
                                onChange={e => handleRejectKgChange(e.target.value)}
                                onBlur={() => {
                                  if (rejectKg.trim() === '') setRejectKg('0');
                                }}
                                placeholder="0"
                                required
                                className="w-full text-sm font-mono tabular-nums font-black text-rose-700 bg-white border border-rose-200 rounded-xl py-2.5 pl-3 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-500/35 focus:border-rose-500 transition-all"
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-rose-400">kg</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-500">Quality Rate</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-mono font-black text-emerald-700">
                        {actKgNum > 0 ? `${qualLive.toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
                );
              })()}

                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1.5">📝 หมายเหตุการผลิต / ปัญหาที่พบ</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="ระบุสาเหตุการหยุดทำงานหรือหมายเหตุ OEE..."
                    className={`w-full border rounded-xl p-3 text-xs font-semibold ${inputBg}`}
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all ring-2 ring-emerald-400/50"
                  >
                    <Save className="w-4 h-4" /> บันทึกข้อมูล
                  </button>
                </div>
              </form>
              )}

              {oeeSubTab === 'history' && (() => {
                const oeeList = allOeeRecords.filter(item => {
                  const r = item as any;
                  const machineName = r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1';
                  const shiftVal = r.shift ?? 'A';
                  const operatorVal = r.operator ?? r['ชื่อผู้บันทึก'] ?? '-';
                  const reportDateVal = r.reportDate ?? r['ข้อมูลวันที่'] ?? r.datetime ?? '';

                  if (oeeFilterDate && !matchesDateFilter(reportDateVal, oeeFilterDate)) return false;
                  if (oeeFilterMachine !== 'all' && machineName !== oeeFilterMachine) return false;
                  if (oeeFilterShift !== 'all' && shiftVal !== oeeFilterShift) return false;
                  if (oeeFilterOperator !== 'all' && operatorVal !== oeeFilterOperator) return false;
                  return true;
                });

                return (
                  <section className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                          <span>ประวัติบันทึก OEE (Production & Performance Records)</span>
                        </h3>
                        <p className="text-xs text-slate-500">รายการประวัติการบันทึก OEE เป้าหมาย ผลผลิต ของดี ของเสีย และเวลาหยุดเครื่อง</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportExcel}
                        className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 text-xs font-black flex items-center gap-2 hover:bg-emerald-500/30 transition shadow-sm self-start sm:self-auto"
                      >
                        <FileSpreadsheet className="w-4 h-4" /> ส่งออก Excel
                      </button>
                    </div>

                    {/* Filter Bar for OEE History */}
                    <div className={`backdrop-blur-xl border rounded-2xl p-3 shadow-glass ${cardBg} grid grid-cols-1 sm:grid-cols-4 gap-2.5`}>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black text-slate-600 block">📅 วันที่ (Date)</label>
                          <button
                            type="button"
                            onClick={() => setOeeFilterDate(oeeFilterDate ? '' : new Date().toISOString().slice(0, 10))}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition ${!oeeFilterDate ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}`}
                          >
                            {!oeeFilterDate ? '✓ All (ทั้งหมด)' : 'All'}
                          </button>
                        </div>
                        <input
                          type="date"
                          value={oeeFilterDate}
                          onChange={e => setOeeFilterDate(e.target.value)}
                          className="w-full text-xs font-mono font-bold border rounded-xl p-2 bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 block mb-1">⚙️ เครื่องจักร (Machine)</label>
                        <select
                          value={oeeFilterMachine}
                          onChange={e => setOeeFilterMachine(e.target.value)}
                          className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                        >
                          <option value="all">All (ทุกเครื่อง)</option>
                          {MACHINES.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 block mb-1">⏰ กะ (Shift)</label>
                        <select
                          value={oeeFilterShift}
                          onChange={e => setOeeFilterShift(e.target.value)}
                          className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                        >
                          <option value="all">All (ทุกกะ)</option>
                          <option value="A">กะ A</option>
                          <option value="B">กะ B</option>
                          <option value="C">กะ C</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 block mb-1">👤 ผู้บันทึก (Operator)</label>
                        <select
                          value={oeeFilterOperator}
                          onChange={e => setOeeFilterOperator(e.target.value)}
                          className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                        >
                          <option value="all">All (ทุกคน)</option>
                          {INSPECTORS.map(ins => (
                            <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(oeeFilterDate || oeeFilterMachine !== 'all' || oeeFilterShift !== 'all' || oeeFilterOperator !== 'all') && (
                      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-800 font-bold">
                        <span>กำลังกรองข้อมูล (Matched: {oeeList.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOeeFilterDate('');
                            setOeeFilterMachine('all');
                            setOeeFilterShift('all');
                            setOeeFilterOperator('all');
                          }}
                          className="text-rose-600 hover:underline font-black"
                        >
                          ล้างตัวกรอง ✕
                        </button>
                      </div>
                    )}

                    {oeeList.length === 0 ? (
                      <div className={`rounded-3xl backdrop-blur-xl border p-12 text-center space-y-3 ${cardBg}`}>
                        <Box className="w-12 h-12 mx-auto text-slate-400 opacity-50" />
                        <h3 className="text-base font-black text-slate-900 font-display">ไม่พบประวัติ OEE ตามเงื่อนไขที่เลือก</h3>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {oeeList.map(item => {
                          const r = item as any;
                          const machineName = r.machine ?? r['เครื่องจักร'] ?? 'เครื่องบรรจุ 1Kg No.1';
                          const m = MACHINES.find(item => item.name === machineName) || { color: '#3b82f6', name: machineName };
                          const shiftVal = r.shift ?? 'A';
                          const shiftTypeVal = r.shiftType ?? r['shift duration type'] ?? '8h';
                          const operatorVal = r.operator ?? r['ชื่อผู้บันทึก'] ?? '-';
                          const reportDateVal = r.reportDate ?? r['ข้อมูลวันที่'] ?? (r.datetime ? formatDDMMYYYY(r.datetime) : '-');

                          const planTimeVal = Number(r.planTime ?? (shiftTypeVal === '12h' ? 720 : 480));
                          const bdVal = Number(r.breakdownMin ?? r.bd ?? 0);
                          const runTimeVal = Number(r.runTime ?? Math.max(0, planTimeVal - bdVal));
                          const speedStdVal = Number(r.speedStd ?? 34.67);
                          const speedSetVal = Number(r.speedSet ?? 45.00);
                          const speedActVal = Number(r.speed ?? r.speedActual ?? 42.00);
                          const goodVal = Number(r.goodKg ?? r.good ?? 12500);
                          const rejectVal = Number(r.rejectKg ?? r.reject ?? 0);
                          const actualVal = Number(r.actualKg ?? r.actual ?? (goodVal + rejectVal));
                          const targetVal = Number(r.targetKg ?? r.target ?? 15000);

                          const mePct = Number(r['%ME'] ?? (planTimeVal > 0 ? (runTimeVal / planTimeVal) * 100 : 100));
                          const perfPct = Number(r['%Perf'] ?? (speedSetVal > 0 ? (speedActVal / speedSetVal) * 100 : 100));
                          const qualPct = Number(r['%Quality'] ?? (actualVal > 0 ? (goodVal / actualVal) * 100 : 100));
                          const oeePct = Number(r['%OEE'] ?? ((mePct * perfPct * qualPct) / 10000));

                          return (
                            <div key={r.id || Math.random()} className={`backdrop-blur-xl border rounded-3xl p-4 shadow-glass ${cardBg} space-y-2.5`}>
                              <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}></span>
                                  <span className="font-black text-xs font-display text-slate-900">{machineName}</span>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-800">
                                  กะ {shiftVal} ({shiftTypeVal})
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-600 font-semibold flex items-center justify-between">
                                <span>📅 {reportDateVal}</span>
                                <span>👤 ผู้บันทึก: {operatorVal}</span>
                              </div>

                              {/* Time & Speed Grid */}
                              <div className="grid grid-cols-3 gap-1 text-[10px] font-mono font-bold bg-slate-50 p-2 rounded-xl border border-slate-200">
                                <div className="text-center bg-white p-1 rounded border">Plan: {planTimeVal}m</div>
                                <div className="text-center bg-white p-1 rounded border">Run: {runTimeVal}m</div>
                                <div className="text-center bg-white p-1 rounded border text-amber-700">BD: {bdVal}m</div>
                                <div className="text-center bg-white p-1 rounded border">Std: {speedStdVal}</div>
                                <div className="text-center bg-white p-1 rounded border">Set: {speedSetVal}</div>
                                <div className="text-center bg-white p-1 rounded border text-blue-700">Act: {speedActVal}</div>
                              </div>

                              {/* Output kg Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-mono font-bold">
                                <div className="bg-blue-50 p-1.5 rounded-xl border border-blue-200 text-center">
                                  <span className="text-[9px] text-blue-800 block">Target</span>
                                  {Math.round(targetVal).toLocaleString()} kg
                                </div>
                                <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-300 text-center">
                                  <span className="text-[9px] text-slate-600 block">Actual</span>
                                  {Math.round(actualVal).toLocaleString()} kg
                                </div>
                                <div className="bg-emerald-50 p-1.5 rounded-xl border border-emerald-200 text-center">
                                  <span className="text-[9px] text-emerald-800 block">Good</span>
                                  {Math.round(goodVal).toLocaleString()} kg
                                </div>
                                <div className="bg-rose-50 p-1.5 rounded-xl border border-rose-200 text-center">
                                  <span className="text-[9px] text-rose-800 block">Reject</span>
                                  {Math.round(rejectVal).toLocaleString()} kg
                                </div>
                              </div>

                              {/* Percentages Bar */}
                              <div className="grid grid-cols-4 gap-1 text-[10px] font-mono font-black text-center bg-indigo-50/70 p-2 rounded-xl border border-indigo-200">
                                <div>
                                  <span className="text-[9px] text-indigo-700 block">OEE</span>
                                  {oeePct.toFixed(1)}%
                                </div>
                                <div>
                                  <span className="text-[9px] text-indigo-700 block">Perf</span>
                                  {perfPct.toFixed(1)}%
                                </div>
                                <div>
                                  <span className="text-[9px] text-indigo-700 block">ME</span>
                                  {mePct.toFixed(1)}%
                                </div>
                                <div>
                                  <span className="text-[9px] text-indigo-700 block">Quality</span>
                                  {qualPct.toFixed(1)}%
                                </div>
                              </div>

                              {r.notes && <div className="text-xs text-slate-700 bg-slate-100 p-2 rounded-lg border">หมายเหตุ: {r.notes}</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })()}
            </div>
          </motion.main>
          );
        })()}

        {/* =========================================================
            VIEW 3: FILM ROLL INSPECTION VIEW (บันทึกม้วนฟิล์ม)
           ========================================================= */}
        {currentView === 'film' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6"
          >
            <div className="max-w-4xl mx-auto space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-black flex items-center gap-2 font-display text-slate-900">
                    <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/></svg> บันทึกการตรวจสอบม้วนฟิล์ม (Film Roll Inspection)
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold">ตรวจสอบคุณภาพ Lot ฟิล์ม ผู้ผลิต Supplier (TG / S&S) เวลาเปลี่ยน และรูปถ่ายป้าย Tag</p>
                </div>
              </div>

              {/* View Switcher Tabs (2 Tabs: บันทึกข้อมูล / ประวัติล่าสุด) */}
              <div
                role="tablist"
                aria-label="มุมมองบันทึกม้วนฟิล์ม"
                className={`p-1.5 rounded-2xl backdrop-blur-xl border shadow-glass grid grid-cols-2 gap-1.5 ${cardBg}`}
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={filmSubTab === 'form'}
                  onClick={() => setFilmSubTab('form')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 font-display ${
                    filmSubTab === 'form'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <ClipboardEdit className="w-4 h-4" />
                  <span>บันทึกข้อมูล</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filmSubTab === 'history'}
                  onClick={() => setFilmSubTab('history')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 font-display ${
                    filmSubTab === 'history'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                      : 'text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>ประวัติล่าสุด</span>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono font-bold rounded-full transition-colors ${
                      filmSubTab === 'history'
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {filmRecords.length}
                  </span>
                </button>
              </div>

              {filmSubTab === 'form' && (
              <div className={`backdrop-blur-xl border rounded-3xl shadow-2xl overflow-hidden ${cardBg}`}>
                <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                        <Factory className="w-4 h-4 text-blue-600" /> เลือกเครื่อง (Machine)
                      </label>
                      <select
                        value={filmMachine}
                        onChange={e => setFilmMachine(Number(e.target.value))}
                        className={`w-full border rounded-xl py-2.5 px-3 text-sm font-bold transition-all ${inputBg}`}
                      >
                        {MACHINES.map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" /> ผู้บันทึก (Operator) <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={filmOperator}
                        onChange={e => setFilmOperator(e.target.value)}
                        required
                        className={`w-full border rounded-xl py-2.5 px-3 text-sm font-bold transition-all ${inputBg}`}
                      >
                        <option value="">-- เลือกผู้บันทึก --</option>
                        {INSPECTORS.map(ins => (
                          <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-amber-500" /> กะการทำงาน (Shift & Duration)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/90">
                        {[
                          { key: 'A', activeClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25' },
                          { key: 'B', activeClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25' },
                          { key: 'C', activeClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25' }
                        ].map(sh => (
                          <button
                            key={sh.key}
                            type="button"
                            onClick={() => setFilmShift(sh.key)}
                            className={`py-2 rounded-lg text-xs font-bold font-display transition-all ${filmShift === sh.key ? sh.activeClass : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'}`}
                          >
                            กะ {sh.key}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-w-sm">
                        <button
                          type="button"
                          onClick={() => setFilmShiftType('8h')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-2xl text-xs font-semibold border transition-all duration-200 active:scale-[0.98] font-display ${
                            filmShiftType === '8h'
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-transparent shadow-md shadow-blue-500/25'
                              : 'bg-slate-50/90 text-slate-600 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>กะ 8 ชม. (จ-พฤ)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilmShiftType('12h')}
                          className={`flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-2xl text-xs font-semibold border transition-all duration-200 active:scale-[0.98] font-display ${
                            filmShiftType === '12h'
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md shadow-purple-500/25'
                              : 'bg-slate-50/90 text-slate-600 border-slate-200 hover:bg-white'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                          <span>กะ 12 ชม. (ศ-อา)</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                          <Factory className="w-4 h-4 text-indigo-600" /> เลือก Supplier (ผู้ผลิตฟิล์ม)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/90">
                          {['TG', 'S&S'].map(sup => (
                            <button
                              key={sup}
                              type="button"
                              onClick={() => setFilmSupplier(sup)}
                              className={`py-1.5 px-3 rounded-lg text-xs font-bold font-display transition-all flex items-center justify-center gap-1.5 ${
                                filmSupplier === sup
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                              }`}
                            >
                              <Box className="w-3.5 h-3.5 shrink-0" />
                              <span>{sup}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-rose-500" /> เวลาเปลี่ยนม้วนฟิล์ม (Change Time) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={filmChangeTime}
                          onChange={e => setFilmChangeTime(e.target.value)}
                          required
                          className={`w-full border rounded-xl py-2 px-3 text-sm font-bold font-mono transition-all ${inputBg}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tag Photo Upload Section (Camera + Gallery / Native File Picker) */}
                  <div className="border-2 border-dashed border-indigo-200/90 rounded-2xl p-4 bg-gradient-to-br from-blue-50/50 via-indigo-50/35 to-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-2 font-display">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100/90 text-indigo-600 flex items-center justify-center shrink-0">
                          <Camera className="w-4 h-4" />
                        </span>
                        <span>รูปป้าย tag ม้วนฟิล์ม (Film Roll Tag Photo) <span className="text-rose-500">*</span></span>
                      </label>
                      {filmTagPhoto && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
                          ✔ แนบรูปแล้ว
                        </span>
                      )}
                    </div>

                    {/* Hidden Inputs: Camera Capture & Native File/Gallery Picker */}
                    <input
                      ref={filmCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFilmPhotoSelect}
                      className="hidden"
                    />
                    <input
                      ref={filmGalleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFilmPhotoSelect}
                      className="hidden"
                    />

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <div className="grid grid-cols-2 gap-2.5 flex-1">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-[0.98]"
                        >
                          <Camera className="w-4 h-4 shrink-0" />
                          <span>ถ่ายรูปจากกล้อง</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => filmGalleryInputRef.current?.click()}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-indigo-50/70 text-indigo-700 border border-indigo-200/90 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
                        >
                          <ImagePlus className="w-4 h-4 shrink-0 text-indigo-600" />
                          <span>เลือกรูป / แนบไฟล์</span>
                        </button>
                      </div>

                      {filmTagPhoto && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-300 shadow-md shrink-0 self-center sm:self-auto bg-white">
                          <img src={filmTagPhoto} alt="Tag preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setFilmTagPhoto(null)}
                            title="ลบรูปภาพ"
                            className="absolute top-0 right-0 bg-rose-600 hover:bg-rose-700 text-white text-[10px] w-5 h-5 flex items-center justify-center font-bold rounded-bl-lg"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Camera Modal */}
                  {showCameraModal && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
                      <div className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl flex flex-col border border-slate-200">
                        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 flex items-center justify-between">
                          <h3 className="text-sm font-black flex items-center gap-2">
                            <Camera className="w-5 h-5 text-blue-200" /> ถ่ายภาพป้าย Tag ม้วนฟิล์ม
                          </h3>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="text-white hover:text-rose-200 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center bg-white/10"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 bg-slate-50 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={captureSnapshot}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-xl flex items-center gap-2"
                          >
                            <Camera className="w-5 h-5" /> กดถ่ายภาพ
                          </button>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="px-4 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!filmOperator) {
                          showToast('กรุณาเลือกผู้บันทึก (Operator)');
                          return;
                        }
                        if (!filmChangeTime) {
                          showToast('กรุณาระบุเวลาเปลี่ยนม้วนฟิล์ม');
                          return;
                        }
                        if (!filmTagPhoto) {
                          showToast('กรุณาถ่ายหรือแนบรูปป้าย tag ม้วนฟิล์ม');
                          return;
                        }
                        const now = new Date();
                        const formattedDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;

                        const mObj = MACHINES.find(m => m.id === filmMachine) || MACHINES[0];
                        const newFilmRec = {
                          id: Date.now(),
                          machine: mObj.name,
                          operator: filmOperator,
                          shift: filmShift,
                          shiftType: filmShiftType,
                          supplier: filmSupplier,
                          filmDate: formattedDate,
                          changeTime: filmChangeTime,
                          tagPhoto: filmTagPhoto,
                          datetime: new Date().toISOString()
                        };
                        setFilmRecords([newFilmRec, ...filmRecords]);
                        setFilmTagPhoto(null);
                        showToast('บันทึกตรวจสอบม้วนฟิล์มและซิงค์สำเร็จ ✔');

                        try {
                          await DatabaseService.submitFilmRollRecord(newFilmRec);
                        } catch (err) {
                          console.warn("Failed to sync film roll record to Google Sheet:", err);
                        }
                      }}
                      className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:brightness-110 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <Save className="w-4 h-4" /> บันทึกตรวจสอบม้วนฟิล์ม
                    </button>
                  </div>
                </div>
              </div>
              )}

              {filmSubTab === 'history' && (() => {
                const filteredFilmRecs = filmRecords.filter(fr => {
                  if (filmHistFilterDate && fr.filmDate && !matchesDateFilter(fr.filmDate, filmHistFilterDate) && !fr.datetime?.startsWith(filmHistFilterDate)) return false;
                  if (filmHistFilterMachine !== 'all' && fr.machine !== filmHistFilterMachine) return false;
                  if (filmHistFilterShift !== 'all' && fr.shift !== filmHistFilterShift) return false;
                  if (filmHistFilterSupplier !== 'all' && fr.supplier !== filmHistFilterSupplier) return false;
                  if (filmHistFilterOperator !== 'all' && fr.operator !== filmHistFilterOperator) return false;
                  return true;
                });

                return (
                  <section className="space-y-4">
                    <div className="px-1">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 font-display">
                        <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/></svg>
                        <span>ประวัติบันทึกม้วนฟิล์ม (Film Roll Inspection History)</span>
                      </h3>
                      <p className="text-xs text-slate-500">รายการประวัติการตรวจสอบ Lot ม้วนฟิล์ม ความหนา ความกว้าง และผลการตรวจ</p>
                    </div>

                    {/* Filter Bar for Film Roll History */}
                    <div className={`backdrop-blur-xl border rounded-2xl p-3 shadow-glass ${cardBg} grid grid-cols-1 sm:grid-cols-5 gap-2.5`}>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-black text-slate-600 block">📅 วันที่ (Date)</label>
                          <button
                            type="button"
                            onClick={() => setFilmHistFilterDate(filmHistFilterDate ? '' : new Date().toISOString().slice(0, 10))}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition ${!filmHistFilterDate ? 'bg-purple-600 text-white border-purple-700 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}`}
                          >
                            {!filmHistFilterDate ? '✓ All (ทั้งหมด)' : 'All'}
                          </button>
                        </div>
                        <input
                          type="date"
                          value={filmHistFilterDate}
                          onChange={e => setFilmHistFilterDate(e.target.value)}
                          className="w-full text-xs font-mono font-bold border rounded-xl p-2 bg-white text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 block mb-1">⚙️ เครื่อง (Machine)</label>
                        <select
                          value={filmHistFilterMachine}
                          onChange={e => setFilmHistFilterMachine(e.target.value)}
                          className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                        >
                          <option value="all">All (ทุกเครื่อง)</option>
                          {MACHINES.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 block mb-1">⏰ กะ (Shift)</label>
                        <select
                          value={filmHistFilterShift}
                          onChange={e => setFilmHistFilterShift(e.target.value)}
                          className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                        >
                          <option value="all">All (ทุกกะ)</option>
                          <option value="A">กะ A</option>
                          <option value="B">กะ B</option>
                          <option value="C">กะ C</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 block mb-1">🏭 Supplier</label>
                        <select
                          value={filmHistFilterSupplier}
                          onChange={e => setFilmHistFilterSupplier(e.target.value)}
                          className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                        >
                          <option value="all">All (ทุก Supplier)</option>
                          <option value="TG">TG</option>
                          <option value="S&S">S&S</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-600 block mb-1">👤 ผู้ตรวจ (Operator)</label>
                        <select
                          value={filmHistFilterOperator}
                          onChange={e => setFilmHistFilterOperator(e.target.value)}
                          className="w-full text-xs font-bold border rounded-xl p-2 bg-white text-slate-900"
                        >
                          <option value="all">All (ทุกคน)</option>
                          {INSPECTORS.map(ins => (
                            <option key={ins.name} value={ins.name}>{ins.emoji} {ins.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {(filmHistFilterDate || filmHistFilterMachine !== 'all' || filmHistFilterShift !== 'all' || filmHistFilterOperator !== 'all' || filmHistFilterSupplier !== 'all') && (
                      <div className="flex items-center justify-between bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs text-purple-900 font-bold">
                        <span>กำลังกรองข้อมูล (Matched: {filteredFilmRecs.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFilmHistFilterDate('');
                            setFilmHistFilterMachine('all');
                            setFilmHistFilterShift('all');
                            setFilmHistFilterOperator('all');
                            setFilmHistFilterSupplier('all');
                          }}
                          className="text-purple-700 hover:text-purple-900 underline text-xs font-black"
                        >
                          ล้างตัวกรอง ✕
                        </button>
                      </div>
                    )}

                    {filteredFilmRecs.length === 0 ? (
                      <div className={`rounded-3xl backdrop-blur-xl border p-12 text-center space-y-3 ${cardBg}`}>
                        <Box className="w-12 h-12 mx-auto text-slate-400 opacity-50" />
                        <h3 className="text-base font-black text-slate-900 font-display">ไม่พบประวัติม้วนฟิล์มตามเงื่อนไขการกรอง</h3>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {filteredFilmRecs.map(fr => (
                          <div key={fr.id} className={`backdrop-blur-xl border rounded-3xl p-4 shadow-glass ${cardBg} flex items-center justify-between gap-3`}>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-slate-900">{fr.machine || 'เครื่องบรรจุ'}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">Supplier: {fr.supplier}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">กะ {fr.shift} ({fr.shiftType})</span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-semibold">
                                📅 วันที่: {fr.filmDate || '-'} | ⏰ เวลาเปลี่ยน: {fr.changeTime || '-'}
                              </div>
                              <div className="text-[11px] text-slate-600 font-semibold">
                                👤 ผู้บันทึก: {fr.operator}
                              </div>
                            </div>
                            {fr.tagPhoto && (
                              <div className="w-16 h-16 rounded-xl overflow-hidden border border-purple-300 shrink-0 bg-white shadow-sm">
                                <img src={fr.tagPhoto} alt="Film Roll Tag" className="w-full h-full object-cover" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })()}
            </div>
          </motion.main>
        )}

        {/* =========================================================
            VIEW 3: PREDICTIVE DASHBOARD
           ========================================================= */}
        {currentView === 'dashboard' && (
          <motion.main
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex-1 p-4 md:p-6 space-y-6"
          >
            {/* Dashboard Sub-Tab Switcher (2 Tabs) */}
            <div
              role="tablist"
              aria-label="มุมมองแดชบอร์ด"
              className={`p-1.5 rounded-2xl backdrop-blur-xl border shadow-glass grid grid-cols-2 gap-1.5 max-w-4xl mx-auto ${cardBg}`}
            >
              <button
                type="button"
                role="tab"
                aria-selected={dashSubTab === 'machine'}
                onClick={() => setDashSubTab('machine')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 font-display ${
                  dashSubTab === 'machine'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                <GaugeCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">สถานะเครื่องจักร & แนวโน้ม</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={dashSubTab === 'overall'}
                onClick={() => setDashSubTab('overall')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 font-display ${
                  dashSubTab === 'overall'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-100/80'
                }`}
              >
                <Activity className="w-4 h-4 shrink-0" />
                <span className="truncate">รายงาน OEE</span>
              </button>
            </div>

            {dashSubTab === 'machine' && (
              <>
            {/* Machine Selector Dropdown for Dashboard */}
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Factory className="absolute left-3.5 top-3.5 w-4 h-4 text-blue-600 pointer-events-none" />
                <select
                  value={selectedMachine}
                  onChange={e => setSelectedMachine(Number(e.target.value))}
                  className={`w-full border rounded-xl py-2.5 pl-10 pr-4 text-xs md:text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm ${inputBg}`}
                >
                  {MACHINES.map(m => {
                    const emojis = ['🤖', '⚙️', '⚡', '🚀', '🔮', '📦', '🌟'];
                    const emoji = emojis[(m.id - 1) % emojis.length];
                    return (
                      <option key={m.id} value={m.id}>
                        {emoji} {m.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Machine Health Indicator */}
            <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${cardBg}`}>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${dashMachineHealth === 'good' ? 'bg-emerald-500 shadow-emerald-500/30' : dashMachineHealth === 'bad' ? 'bg-rose-500 shadow-rose-500/30' : 'bg-amber-500 shadow-amber-500/30'}`}>
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black font-display text-slate-900">Machine Health Status: {activeMachineObj.name}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black font-mono uppercase shadow-sm ${dashMachineHealth === 'good' ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-500/40' : dashMachineHealth === 'bad' ? 'bg-rose-500/20 text-rose-800 border border-rose-500/40' : 'bg-amber-500/25 text-amber-800 border border-amber-500/40'}`}>
                      {dashMachineHealth === 'good' ? '● GREEN (Healthy)' : dashMachineHealth === 'bad' ? '● RED (Attention Required)' : '● YELLOW (No Data)'}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold mt-0.5 ${textMuted}`}>
                    {dashLatestRecord ? `ตรวจสอบล่าสุด: ${formatDDMMYYYY(dashLatestRecord.datetime)} | กะ ${dashLatestRecord.shift} (${dashLatestRecord.operator})` : 'ยังไม่มีประวัติการตรวจเช็คในระบบสำหรับเครื่องนี้'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-center justify-end shrink-0">
                <div className={`px-3.5 py-2 rounded-xl border text-xs font-black flex items-center gap-1.5 shadow-inner ${dashMachineHealth === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : dashMachineHealth === 'bad' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {dashMachineHealth === 'good' ? '✔ เครื่องจักรพร้อมปฏิบัติงาน 100%' : dashMachineHealth === 'bad' ? '✘ ตรวจพบความผิดปกติในรอบล่าสุด' : '⚠️ รอการตรวจสอบครั้งแรก'}
                </div>
              </div>
            </div>

            {/* Maintenance & Predictive Alert Section */}
            {(() => {
              const insight = getMaintenanceInsights(activeMachineObj.name, records);
              return (
                <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg} border-l-4 ${insight.level === 'critical' ? 'border-l-rose-600 bg-rose-50/50' : insight.level === 'warning' ? 'border-l-amber-500 bg-amber-50/50' : 'border-l-emerald-500 bg-emerald-50/50'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${insight.level === 'critical' ? 'bg-rose-600' : insight.level === 'warning' ? 'bg-amber-500' : 'bg-emerald-600'}`}>
                      {insight.level === 'critical' ? <ShieldAlert className="w-5 h-5 animate-bounce" /> : insight.level === 'warning' ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-xs md:text-sm font-black text-slate-900 font-display flex items-center gap-2">
                        <span>Maintenance & Predictive Alert: {activeMachineObj.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${insight.level === 'critical' ? 'bg-rose-600 text-white' : insight.level === 'warning' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                          {insight.level.toUpperCase()}
                        </span>
                      </h4>
                      <p className="text-xs font-bold text-slate-800 mt-1">{insight.title}</p>
                      <p className="text-xs font-semibold text-slate-600 mt-0.5">{insight.advice}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Unified 2x2 Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg}`}>
                <h3 className="text-xs md:text-sm font-black flex items-center gap-2 mb-3 font-display text-slate-900">
                  <GaugeCircle className="w-4 h-4 text-blue-600" /> แนวโน้มความเร็วบรรจุ Speed (bag/min)
                </h3>
                <div className="h-60 relative">
                  <canvas ref={speedChartRef}></canvas>
                </div>
              </div>

              <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-lg ${cardBg}`}>
                <h3 className="text-xs md:text-sm font-black flex items-center gap-2 mb-3 font-display text-slate-900">
                  <Thermometer className="w-4 h-4 text-amber-500" /> แนวโน้มค่าอุณหภูมิความร้อน (°C)
                </h3>
                <div className="h-60 relative">
                  <canvas ref={tempChartRef}></canvas>
                </div>
              </div>
            </div>

              </>
            )}

            {dashSubTab === 'overall' && (
              <>
            {/* Section Divider: Overall Operator & Machine Performance */}
            <div className="pt-1 pb-1">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-blue-300"></div>
                </div>
                <div className="relative bg-white px-4 py-1.5 rounded-full border border-blue-300 shadow-sm text-xs font-black text-blue-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span>รายงานภาพรวมวัดประสิทธิผลโดยรวมของเครื่องบรรจุ (Operator & Machine Overall Performance)</span>
                </div>
              </div>
            </div>

            {/* Operator & Machine Performance Table Card */}
            {(() => {
              const recordOperators = Array.from(new Set(filteredDashRecords.map(r => r.operator).filter(Boolean)));
              const activeOperators = recordOperators.length > 0 ? recordOperators : INSPECTORS.map(i => i.name);
              
              const displayOperators = activeOperators.filter(opName => {
                if (dashFilterOperator !== 'all' && opName !== dashFilterOperator) return false;
                return true;
              });

              return (
                <div className={`backdrop-blur-xl border rounded-2xl shadow-xl overflow-hidden ${cardBg}`}>
                  {/* Header & Filter Controls Bar */}
                  <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-4 shadow-md space-y-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm md:text-base font-black font-display flex items-center gap-2">
                          <FileSpreadsheet className="w-5 h-5 text-blue-200" /> Dashboard - Operator & Machine Performance
                        </h3>
                        <p className="text-[11px] text-blue-100 font-semibold mt-0.5">รายงานวิเคราะห์ประสิทธิภาพเครื่องบรรจุและผู้ปฏิบัติงานจาก Google Sheet (OEE_logs)</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          type="button"
                          onClick={handleExportDashboardExcel}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1.5 transition shadow-sm"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" /> ส่งออก Excel
                        </button>
                        <span className="text-[10px] font-mono bg-white/20 px-2.5 py-1.5 rounded-lg font-bold">
                          Matched Records: {filteredDashRecords.length} / {records.length}
                        </span>
                        {(dashFilterDate || dashFilterShift !== 'all' || dashFilterOperator !== 'all' || dashFilterMachine !== 'all') && (
                          <button
                            type="button"
                            onClick={() => {
                              setDashFilterDate('');
                              setDashFilterShift('all');
                              setDashFilterOperator('all');
                              setDashFilterMachine('all');
                            }}
                            className="text-[10px] bg-rose-500 hover:bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded-lg transition"
                          >
                            ล้างตัวกรอง ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter Controls Row (5 Filters: Date, Shift, Operator, Machine, ViewMode) */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-slate-800 pt-0.5">
                      {/* Filter 1: DayStart (Date) */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                            <span>📅 DayStart (วันที่)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setDashFilterDate(dashFilterDate ? '' : new Date().toISOString().slice(0, 10))}
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition ${!dashFilterDate ? 'bg-blue-600 text-white border-blue-700 shadow-xs' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'}`}
                          >
                            {!dashFilterDate ? '✓ All (ทั้งหมด)' : 'All'}
                          </button>
                        </div>
                        <input
                          type="date"
                          value={dashFilterDate}
                          onChange={e => setDashFilterDate(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      </div>

                      {/* Filter 2: Shift */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>⏰ Shift (กะการทำงาน)</span>
                        </label>
                        <select
                          value={dashFilterShift}
                          onChange={e => setDashFilterShift(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทุกกะ)</option>
                          <option value="A">Shift A (กะ A)</option>
                          <option value="B">Shift B (กะ B)</option>
                          <option value="C">Shift C (กะ C)</option>
                        </select>
                      </div>

                      {/* Filter 3: Operator */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>👤 Operator (ผู้ปฏิบัติงาน)</span>
                        </label>
                        <select
                          value={dashFilterOperator}
                          onChange={e => setDashFilterOperator(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทั้งหมด)</option>
                          {INSPECTORS.map(ins => (
                            <option key={ins.name} value={ins.name}>
                              {ins.emoji} {ins.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter 4: MachineName */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>⚙️ MachineName (เครื่องบรรจุ)</span>
                        </label>
                        <select
                          value={dashFilterMachine}
                          onChange={e => setDashFilterMachine(e.target.value)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="all">All (ทุกเครื่อง)</option>
                          {MACHINES.map(m => (
                            <option key={m.id} value={m.name}>
                              ⚙️ {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Filter 5: View Mode */}
                      <div className="bg-white/95 rounded-lg p-1.5 border border-blue-200 shadow-sm flex flex-col gap-0.5 col-span-2 sm:col-span-1">
                        <label className="text-[9px] font-black text-blue-900 flex items-center gap-1 font-display">
                          <span>📊 View Mode (มุมมองรายงาน)</span>
                        </label>
                        <select
                          value={dashViewMode}
                          onChange={e => setDashViewMode(e.target.value as any)}
                          className="w-full text-[11px] font-bold text-slate-800 bg-white border border-slate-300 rounded-md py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="operator">👤 พนักงาน + เครื่อง</option>
                          <option value="machineOnly">🏭 เฉพาะเครื่องจักร</option>
                          <option value="operatorOnly">👨‍💼 เฉพาะพนักงาน</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left border-collapse text-[11px] font-sans">
                      <thead>
                        <tr className="text-white font-black uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow">
                          <th className="p-2.5 bg-blue-600 border-r border-blue-500">👤 Operator / Machine</th>
                          <th className="p-2.5 text-right bg-blue-600 border-r border-blue-500">📈 OEE %</th>
                          <th className="p-2.5 text-right bg-blue-600 border-r border-blue-500">⚡ Perf %</th>
                          <th className="p-2.5 text-right bg-purple-600 border-r border-purple-500">⏱️ Speed Std.</th>
                          <th className="p-2.5 text-right bg-purple-600 border-r border-purple-500">⚙️ Speed Set</th>
                          <th className="p-2.5 text-right bg-purple-600 border-r border-purple-500">🚀 Speed Act.</th>
                          <th className="p-2.5 text-right bg-emerald-600 border-r border-emerald-500">🎯 Target (kg)</th>
                          <th className="p-2.5 text-right bg-emerald-600 border-r border-emerald-500">📦 Actual (kg)</th>
                          <th className="p-2.5 text-right bg-emerald-600 border-r border-emerald-500">✨ Good (kg)</th>
                          <th className="p-2.5 text-right bg-emerald-600 border-r border-emerald-500">⚠️ Reject (kg)</th>
                          <th className="p-2.5 text-right bg-indigo-600 border-r border-indigo-500">📊 ME %</th>
                          <th className="p-2.5 text-right bg-indigo-600 border-r border-indigo-500">⭐ Quality %</th>
                          <th className="p-2.5 text-right bg-amber-600 border-r border-amber-500">📅 Plan Time</th>
                          <th className="p-2.5 text-right bg-amber-600 border-r border-amber-500">⏳ Run Time</th>
                          <th className="p-2.5 text-right bg-amber-600">🔧 BD (Min)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(() => {
                          if (dashViewMode === 'machineOnly') {
                            const machineList = getMachineOnlyList(records, dashFilterDate, dashFilterShift, dashFilterOperator, dashFilterMachine);
                            if (machineList.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={15} className="p-8 text-center text-slate-500 font-semibold bg-slate-50">
                                    ⚠️ ไม่พบข้อมูลเครื่องจักรตามเงื่อนไขการกรองที่เลือก
                                  </td>
                                </tr>
                              );
                            }
                            return machineList.map((mRow) => (
                              <tr key={mRow.name} className="hover:bg-slate-50 transition text-slate-700 font-bold bg-white">
                                <td className="p-2.5 border-r border-slate-200 font-semibold flex items-center gap-1.5 font-display">
                                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> ⚙️ {mRow.name}
                                </td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{renderPctBadge(mRow.oee)}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{renderPctBadge(mRow.perf)}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedStd.toFixed(2)}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedSet.toFixed(2)}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedAct.toFixed(2)}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.target).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.actual).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.good).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.reject).toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{renderPctBadge(mRow.me)}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{renderPctBadge(mRow.quality)}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.planTime.toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.runTime.toLocaleString()}</td>
                                <td className="p-2.5 text-right font-mono">{mRow.bd.toLocaleString()}</td>
                              </tr>
                            ));
                          }

                          const operatorDataList = displayOperators
                            .map(opName => computeOperatorData(opName, records, dashFilterMachine, dashFilterDate, dashFilterShift, dashFilterOperator))
                            .filter(d => d.machineRows.length > 0);

                          if (operatorDataList.length === 0) {
                            return (
                              <tr>
                                <td colSpan={15} className="p-8 text-center text-slate-500 font-semibold bg-slate-50">
                                  ⚠️ ไม่พบข้อมูลตามเงื่อนไขการกรองที่เลือก (วันที่: {dashFilterDate || 'ทั้งหมด'}, กะ: {dashFilterShift}, ผู้ปฏิบัติงาน: {dashFilterOperator}, เครื่อง: {dashFilterMachine})
                                </td>
                              </tr>
                            );
                          }

                          return operatorDataList.map((opData) => {
                            const insObj = INSPECTORS.find(i => i.name === opData.operatorName) || { emoji: '👤' };
                            return (
                              <React.Fragment key={opData.operatorName}>
                                <tr className="bg-blue-50 font-black text-blue-900 border-t-2 border-blue-200">
                                  <td className="p-2.5 flex items-center gap-1.5 font-display">
                                    <span className="text-sm">{insObj.emoji}</span> {opData.operatorName}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-black">{renderPctBadge(opData.oee)}</td>
                                  <td className="p-2.5 text-right font-mono font-black">{renderPctBadge(opData.perf)}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.speedStd.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.speedSet.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.speedAct.toFixed(2)}</td>
                                  <td className="p-2.5 text-right font-mono">{Math.round(opData.target).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{Math.round(opData.actual).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{Math.round(opData.good).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{Math.round(opData.reject).toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{renderPctBadge(opData.me)}</td>
                                  <td className="p-2.5 text-right font-mono">{renderPctBadge(opData.quality)}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.planTime.toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.runTime.toLocaleString()}</td>
                                  <td className="p-2.5 text-right font-mono">{opData.bd.toLocaleString()}</td>
                                </tr>

                                {dashViewMode !== 'operatorOnly' && opData.machineRows.map((mRow) => (
                                  <tr key={mRow.name} className="hover:bg-slate-50 transition text-slate-700">
                                    <td className="p-2.5 pl-8 border-r border-slate-200 font-semibold flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {mRow.name}
                                    </td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{renderPctBadge(mRow.oee)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{renderPctBadge(mRow.perf)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedStd.toFixed(2)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedSet.toFixed(2)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.speedAct.toFixed(2)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.target).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.actual).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.good).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{Math.round(mRow.reject).toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{renderPctBadge(mRow.me)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{renderPctBadge(mRow.quality)}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.planTime.toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono border-r border-slate-200">{mRow.runTime.toLocaleString()}</td>
                                    <td className="p-2.5 text-right font-mono">{mRow.bd.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          });
                        })()}
                      </tbody>
                      <tfoot>
                        {(() => {
                          const listForFooter = dashViewMode === 'machineOnly'
                            ? getMachineOnlyList(records, dashFilterDate, dashFilterShift, dashFilterOperator, dashFilterMachine)
                            : displayOperators
                                .map(opName => computeOperatorData(opName, records, dashFilterMachine, dashFilterDate, dashFilterShift, dashFilterOperator))
                                .filter(d => d.machineRows.length > 0);

                          const totPlan = listForFooter.reduce((acc, d) => acc + d.planTime, 0);
                          const totRun = listForFooter.reduce((acc, d) => acc + d.runTime, 0);
                          const totBd = listForFooter.reduce((acc, d) => acc + d.bd, 0);
                          const totTarget = listForFooter.reduce((acc, d) => acc + d.target, 0);
                          const totAction = listForFooter.reduce((acc, d) => acc + d.actual, 0);
                          const totGood = listForFooter.reduce((acc, d) => acc + d.good, 0);
                          const totReject = listForFooter.reduce((acc, d) => acc + d.reject, 0);

                          const avgStd = listForFooter.length > 0 ? listForFooter.reduce((acc, d) => acc + d.speedStd, 0) / listForFooter.length : 34.67;
                          const avgSet = listForFooter.length > 0 ? listForFooter.reduce((acc, d) => acc + d.speedSet, 0) / listForFooter.length : 45.00;
                          const avgAct = listForFooter.length > 0 ? listForFooter.reduce((acc, d) => acc + d.speedAct, 0) / listForFooter.length : 39.40;
                          const avgMe = totPlan > 0 ? (totRun / totPlan) * 100 : 100;
                          const avgPerf = avgSet > 0 ? (avgAct / avgSet) * 100 : 100;
                          const avgQual = totAction > 0 ? (totGood / totAction) * 100 : 100;
                          const avgOee = (avgMe * avgPerf * avgQual) / 10000;

                          return (
                            <tr className="bg-blue-700 text-white font-black sticky bottom-0 z-10 shadow">
                              <td className="p-3 border-r border-blue-600 font-display">📊 Total / Average</td>
                              <td className="p-3 text-right font-mono">{renderPctBadge(avgOee)}</td>
                              <td className="p-3 text-right font-mono">{renderPctBadge(avgPerf)}</td>
                              <td className="p-3 text-right font-mono">{avgStd.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono">{avgSet.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono">{avgAct.toFixed(2)}</td>
                              <td className="p-3 text-right font-mono">{Math.round(totTarget).toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{Math.round(totAction).toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{Math.round(totGood).toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{Math.round(totReject).toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{renderPctBadge(avgMe)}</td>
                              <td className="p-3 text-right font-mono">{renderPctBadge(avgQual)}</td>
                              <td className="p-3 text-right font-mono">{totPlan.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{totRun.toLocaleString()}</td>
                              <td className="p-3 text-right font-mono">{totBd.toLocaleString()}</td>
                            </tr>
                          );
                        })()}
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            })()}
              </>
            )}

          </motion.main>
        )}

        {/* Mobile Bottom Tabbar */}
        <nav
          onMouseLeave={() => setMobileHoveredNav(null)}
          className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl border-t flex px-2 py-2 justify-around items-center shadow-2xl bg-white/95 border-slate-200"
        >
          {[
            {
              key: 'form',
              label: 'ตรวจเช็ค',
              icon: <ClipboardEdit className={`w-4 h-4 transition-colors duration-300 ${mobileTargetNavKey === 'form' ? 'text-white' : 'text-blue-600'}`} />
            },
            {
              key: 'oee',
              label: 'บันทึก OEE',
              icon: <FileSpreadsheet className={`w-4 h-4 transition-colors duration-300 ${mobileTargetNavKey === 'oee' ? 'text-white' : 'text-emerald-600'}`} />
            },
            {
              key: 'film',
              label: 'ม้วนฟิล์ม',
              icon: (
                <svg className={`w-4 h-4 transition-colors duration-300 ${mobileTargetNavKey === 'film' ? 'text-white' : 'text-purple-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><line x1="12" y1="3" x2="12" y2="8.5"/>
                </svg>
              )
            },
            {
              key: 'dashboard',
              label: 'แดชบอร์ด',
              icon: <TrendingUp className={`w-4 h-4 transition-colors duration-300 ${mobileTargetNavKey === 'dashboard' ? 'text-white' : 'text-emerald-500'}`} />
            }
          ].map(item => {
            const isHighlighted = mobileTargetNavKey === item.key;
            return (
              <button
                key={item.key}
                ref={el => { mobileNavBtnRefs.current[item.key] = el; }}
                onClick={() => {
                  setMobileHoveredNav(null);
                  setCurrentView(item.key as any);
                }}
                onMouseEnter={() => setMobileHoveredNav(item.key)}
                className={`relative z-10 flex flex-col items-center gap-0.5 text-[9px] font-black px-3 py-1.5 rounded-xl transition-colors duration-300 ${
                  isHighlighted ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.icon} {item.label}
              </button>
            );
          })}
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 rounded-xl pointer-events-none transition-all duration-500 ease-out shadow-md z-0"
            style={{
              left: `${mobileNavIndicatorStyle.left}px`,
              width: `${mobileNavIndicatorStyle.width}px`,
              opacity: mobileNavIndicatorStyle.opacity,
              background: 'linear-gradient(to right, #3498db, #8e44ad)'
            }}
          />
        </nav>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 backdrop-blur-xl border px-5 py-2.5 rounded-full text-xs font-black shadow-2xl flex items-center gap-2 bg-slate-900 text-white border-blue-500 shadow-blue-500/20"
          >
            <Sparkles className="w-4 h-4 text-blue-400 animate-spin" /> {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="border rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl space-y-3 bg-white border-slate-300 text-slate-900"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-700 border border-emerald-500/40 flex items-center justify-center mx-auto text-xl shadow-lg shadow-emerald-500/25">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black font-display text-slate-900">บันทึกข้อมูลสำเร็จ</h3>
              <p className={`text-xs font-semibold ${textMuted}`}>{modalDesc}</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 hover:scale-[1.02] transition ring-2 ring-blue-400/50"
              >
                เรียบร้อย
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>



      {/* Specs & Limits Settings Modal */}
      <AnimatePresence>
        {showSpecsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 bg-white border-slate-300 text-slate-900"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-black font-display flex items-center gap-2 text-slate-900">
                  <Wrench className="w-5 h-5 text-blue-600" /> ตั้งค่าสเปคเครื่อง: {activeMachineObj.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSpecsModal(false)}
                  className="text-slate-400 hover:text-slate-700 font-black text-base"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                {/* Speed Specs */}
                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 space-y-2">
                  <div className="font-black text-blue-900 font-display">🚀 ตั้งค่าความเร็ว (Speed bag/min)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Speed Std. (มาตรฐาน)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customSpeedSpecs[selectedMachine]?.std ?? 34.67}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), std: val }
                          }));
                        }}
                        className="w-full border rounded-lg p-2 font-mono font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Speed Set (ตั้งค่า)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={customSpeedSpecs[selectedMachine]?.set ?? 45.00}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          setCustomSpeedSpecs(prev => ({
                            ...prev,
                            [selectedMachine]: { ...(prev[selectedMachine] || { std: 34.67, set: 45.00 }), set: val }
                          }));
                        }}
                        className="w-full border rounded-lg p-2 font-mono font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Temp Limits */}
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 space-y-3">
                  <div className="font-black text-amber-900 font-display">🌡️ ตั้งค่าช่วงอุณหภูมิ (Min / Max °C)</div>
                  
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลหน้า / ซีลบน:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempFront[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [val, prev.tempFront[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempFront[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempFront: [prev.tempFront[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลหลัง / ซีลล่าง:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempBack[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [val, prev.tempBack[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempBack[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempBack: [prev.tempBack[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-bold text-slate-800">ซีลกลาง:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-600 block">Min</span>
                        <input
                          type="number"
                          value={limits.tempMid[0]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [val, prev.tempMid[1]] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-600 block">Max</span>
                        <input
                          type="number"
                          value={limits.tempMid[1]}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            setLimits(prev => ({ ...prev, tempMid: [prev.tempMid[0], val] }));
                          }}
                          className="w-full border rounded-lg p-1.5 font-mono font-bold bg-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpecsModal(false);
                    showToast('บันทึกการตั้งค่าสเปคเครื่องเรียบร้อยแล้ว ✔');
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-500/25 transition"
                >
                  บันทึกการตั้งค่า
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
