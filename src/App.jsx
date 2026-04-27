import { useState, useEffect } from "react";

// ─── THEME ────────────────────────────────────────────────────────────────────
const th = {
  bg: "#F8F5F2", surface: "#FFFFFF", surfaceAlt: "#FDF9F6",
  primary: "#A8C5BC", primaryDark: "#7BA99E", primaryLight: "#D4E8E3",
  accent: "#E8C5B0", accentDark: "#D4A882", accentLight: "#F5E6DC",
  lavender: "#C9C0D3", lavenderLight: "#EDE8F5",
  rose: "#E8B4B8",
  text: "#3D3530", textMid: "#6B5E58", textLight: "#9A8E8A",
  border: "#EDE8E4",
  success: "#8BBB9F", warning: "#E8C87A",
  danger: "#D4807A", dangerLight: "#FAE8E8",
};
const R  = { sm: "8px", md: "14px", lg: "20px", xl: "28px" };
const SH = {
  sm: "0 2px 8px rgba(61,53,48,0.06)",
  md: "0 4px 20px rgba(61,53,48,0.08)",
  lg: "0 8px 40px rgba(61,53,48,0.12)",
};
const STATUS_COLORS = {
  "Ativo":           { bg: th.primaryLight,  color: th.primaryDark },
  "Em Pausa":        { bg: "#FFF3DC",        color: "#B8862A" },
  "Alta":            { bg: th.lavenderLight, color: "#6B5A9E" },
  "Lista de Espera": { bg: th.accentLight,   color: th.accentDark },
};
const ALL_TAGS = ["ansiedade","luto","depressão","autoestima","relacionamento","toc","conflitofamiliar","trauma","fobia","burnout","autoconhecimento"];
const WEEKDAYS_LABEL = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const WEEKDAYS_FULL  = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
const MONTHS_FULL    = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

// ─── SCHEDULE HELPERS ─────────────────────────────────────────────────────────
// Returns today's recurrent appointments sorted by time
function getTodayAppointments(patients) {
  const todayDow = new Date().getDay(); // 0=sun … 6=sat
  const result = [];
  patients.forEach(p => {
    if (p.status !== "Ativo") return;
    (p.schedule || []).forEach(slot => {
      if (Number(slot.dow) === todayDow) {
        result.push({ patientId: p.id, patientName: p.name, time: slot.time, duration: slot.duration || 50 });
      }
    });
  });
  return result.sort((a, b) => a.time.localeCompare(b.time));
}

// Returns appointments for a given weekday index
function getAppointmentsForDow(patients, dow) {
  const result = [];
  patients.forEach(p => {
    if (p.status !== "Ativo") return;
    (p.schedule || []).forEach(slot => {
      if (Number(slot.dow) === dow) {
        result.push({ patientId: p.id, patientName: p.name, time: slot.time, duration: slot.duration || 50, color: p.calColor || th.primaryLight });
      }
    });
  });
  return result.sort((a, b) => a.time.localeCompare(b.time));
}

// Get the Monday of the week containing `date`
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=sun
  const diff = day === 0 ? -6 : 1 - day; // Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0,0,0,0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtShortDate(date) {
  return `${date.getDate()}/${date.getMonth()+1}`;
}

// ─── PERSISTENCE ─────────────────────────────────────────────────────────────
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── HOOKS ───────────────────────────────────────────────────────────────────
function useGreeting() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const h = now.getHours();
  const greeting = h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  const emoji    = h < 12 ? "🌤" : h < 18 ? "☀️" : "🌙";
  const dateStr  = `${WEEKDAYS_FULL[now.getDay()]}, ${now.getDate()} de ${MONTHS_FULL[now.getMonth()]} de ${now.getFullYear()}`;
  return { greeting, emoji, dateStr };
}

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

// Patient palette colors for calendar
const PAT_COLORS = [
  { bg: "#D4E8E3", border: "#7BA99E", text: "#3D6B63" },
  { bg: "#F5E6DC", border: "#D4A882", text: "#7A5035" },
  { bg: "#EDE8F5", border: "#9B8EC0", text: "#4A3878" },
  { bg: "#FAE8EA", border: "#D4807A", text: "#7A2828" },
  { bg: "#FFF3DC", border: "#C89A30", text: "#6B4E10" },
  { bg: "#E8F5E9", border: "#66BB6A", text: "#2E6B30" },
  { bg: "#E3F2FD", border: "#64B5F6", text: "#1A5276" },
  { bg: "#FCE4EC", border: "#F48FB1", text: "#7B1C3C" },
];

// ─── PRIMITIVE COMPONENTS ────────────────────────────────────────────────────
function Badge({ label, color, bg, small }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding: small?"2px 8px":"4px 12px", borderRadius:"20px", fontSize: small?"11px":"12px", fontWeight:600, background: bg||th.primaryLight, color: color||th.primaryDark }}>{label}</span>
  );
}

function Card({ children, style, onClick, hover }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:th.surface, borderRadius:R.lg, padding:"20px", boxShadow: hov&&hover?SH.md:SH.sm, border:`1px solid ${th.border}`, transition:"all 0.2s ease", transform: hov&&hover?"translateY(-2px)":"none", cursor: onClick?"pointer":"default", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, variant="primary", small, onClick, style, disabled }) {
  const [hov, setHov] = useState(false);
  const V = {
    primary:   { bg:th.primary,      hbg:th.primaryDark,  color:"#fff",         border:"none" },
    secondary: { bg:"transparent",   hbg:th.bg,           color:th.textMid,     border:`1.5px solid ${th.border}` },
    ghost:     { bg:"transparent",   hbg:th.primaryLight, color:th.primaryDark, border:"none" },
    danger:    { bg:th.dangerLight,  hbg:"#F5D5D3",       color:th.danger,      border:"none" },
  }[variant]||{};
  return (
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:hov?V.hbg:V.bg, color:V.color, border:V.border||"none", borderRadius:R.sm, padding:small?"6px 14px":"10px 20px", fontSize:small?"12px":"14px", fontWeight:600, cursor:disabled?"not-allowed":"pointer", transition:"all 0.18s", fontFamily:"inherit", opacity:disabled?0.5:1, ...style }}>
      {children}
    </button>
  );
}

function Inp({ label, value, onChange, type="text", placeholder, style }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"5px", ...style }}>
      {label && <label style={{ fontSize:"11px", fontWeight:700, color:th.textLight, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{ border:`1.5px solid ${th.border}`, borderRadius:R.sm, padding:"10px 13px", fontSize:"14px", color:th.text, background:th.surfaceAlt, fontFamily:"inherit", outline:"none" }}
        onFocus={e=>(e.target.style.borderColor=th.primary)} onBlur={e=>(e.target.style.borderColor=th.border)} />
    </div>
  );
}

function Txta({ label, value, onChange, placeholder, rows=4 }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
      {label && <label style={{ fontSize:"11px", fontWeight:700, color:th.textLight, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</label>}
      <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ border:`1.5px solid ${th.border}`, borderRadius:R.sm, padding:"11px 13px", fontSize:"14px", color:th.text, background:th.surfaceAlt, fontFamily:"inherit", outline:"none", resize:"vertical", lineHeight:1.6 }}
        onFocus={e=>(e.target.style.borderColor=th.primary)} onBlur={e=>(e.target.style.borderColor=th.border)} />
    </div>
  );
}

function Sel({ label, value, onChange, options }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
      {label && <label style={{ fontSize:"11px", fontWeight:700, color:th.textLight, letterSpacing:"0.06em", textTransform:"uppercase" }}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{ border:`1.5px solid ${th.border}`, borderRadius:R.sm, padding:"10px 13px", fontSize:"14px", color:th.text, background:th.surfaceAlt, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(61,53,48,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, backdropFilter:"blur(4px)", padding:"16px" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:th.surface, borderRadius:R.xl, padding:"28px", width:wide?"min(760px,95vw)":"min(520px,95vw)", maxHeight:"92vh", overflowY:"auto", boxShadow:SH.lg }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
          <h2 style={{ margin:0, fontSize:"18px", fontWeight:800, color:th.text }}>{title}</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:th.textLight }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── SCHEDULE SLOT EDITOR ─────────────────────────────────────────────────────
// Used inside patient dossier to manage recurring weekly schedule
function ScheduleEditor({ schedule, onChange }) {
  const blank = { dow:"1", time:"08:00", duration:"50" };
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ ...blank });
  const f = v => setForm(prev=>({...prev,...v}));

  const add = () => {
    onChange([...(schedule||[]), { id:Date.now(), dow:form.dow, time:form.time, duration:form.duration }]);
    setForm({...blank}); setAdding(false);
  };
  const remove = id => onChange((schedule||[]).filter(s=>s.id!==id));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
        <label style={{ fontSize:"11px", fontWeight:700, color:th.textLight, letterSpacing:"0.06em", textTransform:"uppercase" }}>Horários de Atendimento</label>
        <Btn small variant="ghost" onClick={()=>setAdding(!adding)}>+ Adicionar horário</Btn>
      </div>

      {/* Existing slots */}
      <div style={{ display:"flex", flexDirection:"column", gap:"7px", marginBottom: adding?"12px":"0" }}>
        {!(schedule||[]).length && !adding && (
          <p style={{ fontSize:"13px", color:th.textLight, padding:"10px 0" }}>Nenhum horário cadastrado.</p>
        )}
        {(schedule||[]).map(s=>(
          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"9px 13px", borderRadius:R.sm, background:th.primaryLight, border:`1px solid ${th.primary}` }}>
            <span style={{ fontSize:"13px", fontWeight:700, color:th.primaryDark, minWidth:"100px" }}>{WEEKDAYS_FULL[Number(s.dow)]}</span>
            <span style={{ fontSize:"13px", fontWeight:600, color:th.text }}>{s.time}</span>
            <span style={{ fontSize:"12px", color:th.textLight, flex:1 }}>{s.duration} min</span>
            <button onClick={()=>remove(s.id)} style={{ background:"none", border:"none", cursor:"pointer", color:th.danger, fontSize:"14px", padding:"2px 6px" }}>✕</button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:"8px", alignItems:"end", padding:"14px", borderRadius:R.md, background:th.surfaceAlt, border:`1.5px solid ${th.border}` }}>
          <Sel label="Dia da semana" value={form.dow} onChange={v=>f({dow:v})}
            options={[1,2,3,4,5,6,0].map(d=>({ value:String(d), label:WEEKDAYS_FULL[d] }))} />
          <Inp label="Horário" value={form.time} onChange={v=>f({time:v})} type="time" />
          <Inp label="Duração (min)" value={form.duration} onChange={v=>f({duration:v})} type="number" placeholder="50" />
          <div style={{ display:"flex", gap:"6px" }}>
            <Btn small onClick={add}>OK</Btn>
            <Btn small variant="secondary" onClick={()=>setAdding(false)}>✕</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ sessions, patients, expenses, onNavigate, isMobile }) {
  const { greeting, emoji, dateStr } = useGreeting();

  // Dynamic: appointments pulled from patient schedules for TODAY
  const todayAppts = getTodayAppointments(patients);

  // Financial summaries
  const totalReceived = sessions.filter(s=>s.paid).reduce((a,s)=>a+s.value,0);
  const totalPending  = sessions.filter(s=>s.status==="realizada"&&!s.paid).reduce((a,s)=>a+s.value,0);
  const totalExpenses = expenses.reduce((a,e)=>a+e.value,0);
  const inadimplentes = sessions.filter(s=>s.status==="realizada"&&!s.paid);
  const fmt = v=>`R$ ${v.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

  const now = new Date();
  const nowStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  return (
    <div>
      <div style={{ marginBottom:"24px" }}>
        <h1 style={{ fontSize:isMobile?"22px":"27px", fontWeight:800, color:th.text, margin:0, letterSpacing:"-0.02em" }}>
          {greeting}! {emoji}
        </h1>
        <p style={{ color:th.textLight, marginTop:"4px", fontSize:"14px", textTransform:"capitalize" }}>{dateStr}</p>
      </div>

      {/* Summary cards */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:"12px", marginBottom:"20px" }}>
        {[
          { label:"Recebido",     value:fmt(totalReceived),                icon:"↑", color:th.success,    bg:"#EDF5F1" },
          { label:"A Receber",    value:fmt(totalPending),                 icon:"◎", color:th.warning,    bg:"#FFF8E8" },
          { label:"Lucro Real",   value:fmt(totalReceived-totalExpenses),  icon:"✦", color:th.primaryDark,bg:th.primaryLight },
          { label:"Sessões Hoje", value:String(todayAppts.length),         icon:"◻", color:th.lavender,   bg:th.lavenderLight },
        ].map((c,i)=>(
          <Card key={i}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ margin:"0 0 5px", fontSize:"10px", fontWeight:700, color:th.textLight, letterSpacing:"0.05em", textTransform:"uppercase" }}>{c.label}</p>
                <p style={{ margin:0, fontSize:isMobile?"16px":"20px", fontWeight:800, color:th.text }}>{c.value}</p>
              </div>
              <div style={{ width:"36px", height:"36px", borderRadius:R.sm, background:c.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", color:c.color }}>{c.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:"16px" }}>

        {/* TODAY'S AGENDA — dynamic from patient schedules */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <h3 style={{ margin:0, fontSize:"15px", fontWeight:700, color:th.text }}>Agenda de Hoje</h3>
            <Btn small variant="ghost" onClick={()=>onNavigate("agenda")}>Ver semana →</Btn>
          </div>

          {todayAppts.length === 0
            ? <div style={{ textAlign:"center", padding:"24px 0" }}>
                <p style={{ color:th.textLight, fontSize:"13px" }}>Nenhuma sessão para hoje.</p>
                <Btn small variant="secondary" style={{ marginTop:"10px" }} onClick={()=>onNavigate("patients")}>Configurar horários</Btn>
              </div>
            : todayAppts.map(appt=>{
                const isPast = appt.time < nowStr;
                const isNow  = appt.time <= nowStr && nowStr <= `${appt.time.slice(0,3)}${String(Number(appt.time.slice(3))+appt.duration).padStart(2,"0")}`;
                return (
                  <div key={`${appt.patientId}-${appt.time}`} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 13px", borderRadius:R.md, marginBottom:"8px",
                    background: isNow ? th.primaryLight : isPast ? th.surfaceAlt : th.accentLight,
                    border:`1.5px solid ${isNow ? th.primary : isPast ? th.border : th.accent}`,
                    opacity: isPast && !isNow ? 0.7 : 1 }}>
                    <div style={{ textAlign:"center", minWidth:"44px" }}>
                      <div style={{ fontSize:"13px", fontWeight:800, color:th.textMid }}>{appt.time}</div>
                      <div style={{ fontSize:"10px", color:th.textLight }}>{appt.duration}min</div>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ margin:0, fontWeight:700, fontSize:"13px", color:th.text }}>{appt.patientName}</p>
                      {isNow && <span style={{ fontSize:"10px", fontWeight:700, color:th.primaryDark, background:th.primaryLight, padding:"1px 6px", borderRadius:"8px" }}>● Em andamento</span>}
                    </div>
                    <Btn variant="ghost" small onClick={()=>onNavigate("prontuario")}>Anotar</Btn>
                  </div>
                );
              })
          }
        </Card>

        {/* PENDÊNCIAS */}
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
            <h3 style={{ margin:0, fontSize:"15px", fontWeight:700, color:th.text }}>Pendências Financeiras</h3>
            {inadimplentes.length>0 && <Badge label={String(inadimplentes.length)} bg={th.dangerLight} color={th.danger} small />}
          </div>
          {inadimplentes.length===0
            ? <div style={{ textAlign:"center", padding:"18px", color:th.success }}>
                <div style={{ fontSize:"26px", marginBottom:"4px" }}>✓</div>
                <p style={{ margin:0, fontSize:"13px", fontWeight:600 }}>Tudo em dia!</p>
              </div>
            : inadimplentes.map(s=>(
              <div key={s.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", borderRadius:R.sm, marginBottom:"7px", background:th.dangerLight, border:`1px solid ${th.rose}` }}>
                <div>
                  <p style={{ margin:0, fontWeight:600, fontSize:"13px", color:th.text }}>{s.patientName}</p>
                  <p style={{ margin:0, fontSize:"11px", color:th.textLight }}>{s.date}{s.time?` · ${s.time}`:""}</p>
                </div>
                <span style={{ fontWeight:800, fontSize:"13px", color:th.danger }}>R$ {s.value}</span>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
}

// ─── WEEKLY CALENDAR ─────────────────────────────────────────────────────────
const HOUR_START = 7;
const HOUR_END   = 21;
const HOURS      = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

function WeekCalendar({ patients, isMobile }) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const today = new Date(); today.setHours(0,0,0,0);

  const prevWeek = () => setWeekStart(d => addDays(d, -7));
  const nextWeek = () => setWeekStart(d => addDays(d, +7));
  const goToday  = () => setWeekStart(getWeekStart(new Date()));

  // Days to show: Mon–Sat (indices 1–6 from weekStart)
  // weekStart is always Monday
  const days = isMobile
    ? [0,1,2,3,4,5,6].map(i=>({ date:addDays(weekStart,i), dow:(weekStart.getDay()+i)%7 }))
    : [0,1,2,3,4,5].map(i=>({ date:addDays(weekStart,i), dow:(weekStart.getDay()+i)%7 }));

  // Build color map: patientId -> color index
  const colorMap = {};
  patients.forEach((p, i) => { colorMap[p.id] = PAT_COLORS[i % PAT_COLORS.length]; });

  // Convert time string "HH:MM" to minutes from HOUR_START
  const timeToOffset = t => {
    const [h,m] = t.split(":").map(Number);
    return (h - HOUR_START) * 60 + (m||0);
  };

  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const CELL_HEIGHT  = isMobile ? 400 : 640; // px for full day column

  const monthLabel = () => {
    const end = addDays(weekStart, 5);
    if (weekStart.getMonth() === end.getMonth()) {
      return `${MONTHS_FULL[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    }
    return `${MONTHS_FULL[weekStart.getMonth()]} – ${MONTHS_FULL[end.getMonth()]} ${end.getFullYear()}`;
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px", flexWrap:"wrap", gap:"10px" }}>
        <div>
          <h1 style={{ margin:0, fontSize:isMobile?"22px":"26px", fontWeight:800, color:th.text, letterSpacing:"-0.02em" }}>Agenda</h1>
          <p style={{ margin:"3px 0 0", fontSize:"13px", color:th.textLight, textTransform:"capitalize" }}>{monthLabel()}</p>
        </div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          <Btn small variant="secondary" onClick={prevWeek}>←</Btn>
          <Btn small variant="secondary" onClick={goToday}>Hoje</Btn>
          <Btn small variant="secondary" onClick={nextWeek}>→</Btn>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"16px" }}>
        {patients.filter(p=>p.status==="Ativo"&&(p.schedule||[]).length>0).map(p=>{
          const c = colorMap[p.id];
          return (
            <div key={p.id} style={{ display:"flex", alignItems:"center", gap:"5px", padding:"3px 10px", borderRadius:"20px", background:c.bg, border:`1.5px solid ${c.border}` }}>
              <span style={{ fontSize:"11px", fontWeight:700, color:c.text }}>{p.name.split(" ")[0]}</span>
            </div>
          );
        })}
        {patients.filter(p=>p.status==="Ativo"&&(p.schedule||[]).length>0).length===0 && (
          <p style={{ fontSize:"13px", color:th.textLight }}>Nenhum paciente ativo com horários configurados. Configure em Pacientes → ficha → horários.</p>
        )}
      </div>

      {/* Grid */}
      <Card style={{ padding:0, overflow:"hidden" }}>
        <div style={{ display:"flex", overflowX:"auto" }}>
          {/* Hour column */}
          <div style={{ width:"52px", flexShrink:0, borderRight:`1px solid ${th.border}` }}>
            <div style={{ height:"44px", borderBottom:`1px solid ${th.border}` }} />
            <div style={{ position:"relative", height:`${CELL_HEIGHT}px` }}>
              {HOURS.map(h=>(
                <div key={h} style={{ position:"absolute", top:`${((h-HOUR_START)/( HOUR_END-HOUR_START))*100}%`, width:"100%", paddingRight:"6px" }}>
                  <span style={{ fontSize:"10px", color:th.textLight, display:"block", textAlign:"right", marginTop:"-7px" }}>{h}:00</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {days.map(({ date, dow }, di)=>{
            const isToday = date.getTime()===today.getTime();
            const appts   = getAppointmentsForDow(patients, dow);

            return (
              <div key={di} style={{ flex:1, minWidth: isMobile?"80px":"120px", borderRight:`1px solid ${th.border}` }}>
                {/* Day header */}
                <div style={{ height:"44px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", borderBottom:`1px solid ${th.border}`, background: isToday ? th.primaryLight : "transparent" }}>
                  <span style={{ fontSize:"10px", fontWeight:600, color: isToday?th.primaryDark:th.textLight, textTransform:"uppercase", letterSpacing:"0.05em" }}>{WEEKDAYS_LABEL[dow]}</span>
                  <span style={{ fontSize:"14px", fontWeight: isToday?800:600, color: isToday?th.primaryDark:th.text }}>{fmtShortDate(date)}</span>
                </div>

                {/* Slots area */}
                <div style={{ position:"relative", height:`${CELL_HEIGHT}px`, background: isToday?"rgba(168,197,188,0.04)":"transparent" }}>
                  {/* Hour grid lines */}
                  {HOURS.map(h=>(
                    <div key={h} style={{ position:"absolute", top:`${((h-HOUR_START)/(HOUR_END-HOUR_START))*100}%`, left:0, right:0, borderTop:`1px solid ${th.border}`, opacity:0.5 }} />
                  ))}

                  {/* Half-hour dashed lines */}
                  {HOURS.map(h=>(
                    <div key={`h${h}`} style={{ position:"absolute", top:`${((h-HOUR_START+0.5)/(HOUR_END-HOUR_START))*100}%`, left:0, right:0, borderTop:`1px dashed ${th.border}`, opacity:0.3 }} />
                  ))}

                  {/* Current time line (today only) */}
                  {isToday && (()=>{
                    const now = new Date();
                    const mins = (now.getHours()-HOUR_START)*60+now.getMinutes();
                    if (mins<0||mins>totalMinutes) return null;
                    const pct = (mins/totalMinutes)*100;
                    return (
                      <div style={{ position:"absolute", top:`${pct}%`, left:0, right:0, zIndex:10 }}>
                        <div style={{ height:"2px", background:th.danger, position:"relative" }}>
                          <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:th.danger, position:"absolute", left:"-4px", top:"-3px" }} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Appointment blocks */}
                  {appts.map((appt, ai)=>{
                    const offset  = timeToOffset(appt.time);
                    const topPct  = (offset / totalMinutes) * 100;
                    const hPct    = ((Number(appt.duration)||50) / totalMinutes) * 100;
                    const c       = colorMap[appt.patientId] || PAT_COLORS[0];
                    return (
                      <div key={ai} style={{ position:"absolute", top:`${topPct}%`, left:"3px", right:"3px", height:`${hPct}%`, minHeight:"22px",
                        background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:"6px",
                        padding:"3px 5px", overflow:"hidden", cursor:"default", zIndex:5,
                        boxShadow:"0 1px 4px rgba(61,53,48,0.08)" }}>
                        <p style={{ margin:0, fontSize: isMobile?"9px":"11px", fontWeight:700, color:c.text, lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                          {appt.patientName.split(" ")[0]}
                        </p>
                        {!isMobile && <p style={{ margin:0, fontSize:"10px", color:c.text, opacity:0.8 }}>{appt.time} · {appt.duration}min</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <p style={{ marginTop:"12px", fontSize:"12px", color:th.textLight, textAlign:"center" }}>
        Os horários exibidos são recorrentes — cadastrados na ficha de cada paciente.
      </p>
    </div>
  );
}

// ─── PATIENT DOSSIER ─────────────────────────────────────────────────────────
function PatientDossier({ patient, onUpdate, onBack, isMobile }) {
  const [tab, setTab]               = useState("info");
  const [form, setForm]             = useState({ ...patient });
  const [noteText, setNoteText]     = useState("");
  const [noteTags, setNoteTags]     = useState([]);
  const [insightText, setInsightText] = useState(patient.insight||"");
  const [noteSearch, setNoteSearch] = useState("");
  const f = v => setForm(prev=>({...prev,...v}));

  const saveInfo = () => onUpdate({ ...form });

  const addNote = () => {
    if (!noteText.trim()) return;
    const note = { id:Date.now(), text:noteText, tags:[...noteTags],
      date:new Date().toLocaleDateString("pt-BR"),
      time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) };
    const updated = { ...patient, notes:[note,...(patient.notes||[])] };
    onUpdate(updated); setForm(updated);
    setNoteText(""); setNoteTags([]);
  };

  const deleteNote = id => {
    const updated = { ...patient, notes:(patient.notes||[]).filter(n=>n.id!==id) };
    onUpdate(updated); setForm(updated);
  };

  const saveInsight = () => {
    const updated = { ...patient, insight:insightText };
    onUpdate(updated); setForm(updated);
  };

  const toggleTag        = tag => setNoteTags(t=>t.includes(tag)?t.filter(x=>x!==tag):[...t,tag]);
  const togglePatientTag = tag => { const tags=form.tags||[]; f({tags:tags.includes(tag)?tags.filter(x=>x!==tag):[...tags,tag]}); };

  const filteredNotes = (patient.notes||[]).filter(n=>
    !noteSearch||n.text.toLowerCase().includes(noteSearch.toLowerCase())||n.tags.some(t=>t.includes(noteSearch.toLowerCase()))
  );

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"22px" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"20px", color:th.textMid, padding:"4px 8px", borderRadius:R.sm }}>←</button>
        <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:`linear-gradient(135deg,${th.primaryLight},${th.lavenderLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", fontWeight:800, color:th.primaryDark, flexShrink:0 }}>{patient.name.charAt(0)}</div>
        <div>
          <h1 style={{ margin:0, fontSize:isMobile?"17px":"21px", fontWeight:800, color:th.text }}>{patient.name}</h1>
          <div style={{ display:"flex", gap:"5px", marginTop:"3px" }}>
            <Badge label={patient.status} {...STATUS_COLORS[patient.status]} small />
            <Badge label={patient.type||"Particular"} bg={th.accentLight} color={th.accentDark} small />
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"18px", background:th.border, borderRadius:R.sm, padding:"4px", width:"fit-content", flexWrap:"wrap" }}>
        {[["info","Ficha"],["prontuario","Prontuário"],["insight","✦ Insight"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ padding:"7px 14px", borderRadius:"6px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:600,
              background:tab===id?th.surface:"transparent", color:tab===id?th.text:th.textLight,
              boxShadow:tab===id?SH.sm:"none", transition:"all 0.15s" }}>{lbl}</button>
        ))}
      </div>

      {/* TAB: FICHA */}
      {tab==="info" && (
        <Card>
          <h3 style={{ margin:"0 0 16px", fontSize:"15px", fontWeight:700, color:th.text }}>Ficha Cadastral</h3>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:"13px" }}>
            <Inp label="Nome completo" value={form.name} onChange={v=>f({name:v})} />
            <Inp label="Idade" value={String(form.age||"")} onChange={v=>f({age:v})} type="number" />
            <Inp label="Profissão" value={form.profession||""} onChange={v=>f({profession:v})} />
            <Inp label="Telefone" value={form.phone||""} onChange={v=>f({phone:v})} />
            <Inp label="Contato de emergência" value={form.emergency||""} onChange={v=>f({emergency:v})} style={{ gridColumn:isMobile?"1":"1 / -1" }} />
            <Sel label="Status" value={form.status} onChange={v=>f({status:v})} options={["Ativo","Em Pausa","Alta","Lista de Espera"].map(s=>({value:s,label:s}))} />
            <Sel label="Tipo" value={form.type||"Particular"} onChange={v=>f({type:v})} options={[{value:"Particular",label:"Particular"},{value:"Convênio",label:"Convênio"}]} />
            {form.type==="Convênio" && <>
              <Inp label="Convênio" value={form.convenio||""} onChange={v=>f({convenio:v})} />
              <Inp label="N° Carteirinha" value={form.carteirinha||""} onChange={v=>f({carteirinha:v})} />
              <Inp label="Sessões autorizadas" value={String(form.sessoesAutorizadas||"")} onChange={v=>f({sessoesAutorizadas:v})} type="number" />
            </>}
          </div>

          {/* Schedule editor */}
          <div style={{ marginTop:"20px", paddingTop:"18px", borderTop:`1px solid ${th.border}` }}>
            <ScheduleEditor schedule={form.schedule||[]} onChange={s=>f({schedule:s})} />
          </div>

          {/* Tags */}
          <div style={{ marginTop:"18px", paddingTop:"16px", borderTop:`1px solid ${th.border}` }}>
            <p style={{ margin:"0 0 8px", fontSize:"11px", fontWeight:700, color:th.textLight, textTransform:"uppercase", letterSpacing:"0.06em" }}>Tags Clínicas</p>
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
              {ALL_TAGS.map(tag=>(
                <span key={tag} onClick={()=>togglePatientTag(tag)}
                  style={{ padding:"4px 10px", borderRadius:"20px", fontSize:"12px", fontWeight:600, cursor:"pointer",
                    background:(form.tags||[]).includes(tag)?th.lavender:th.lavenderLight,
                    color:(form.tags||[]).includes(tag)?"#fff":"#6B5A9E", transition:"all 0.15s" }}>#{tag}</span>
              ))}
            </div>
          </div>

          <div style={{ marginTop:"16px" }}>
            <Txta label="Histórico Médico / Psiquiátrico" value={form.medHistory||""} onChange={v=>f({medHistory:v})} placeholder="Medicações, diagnósticos anteriores, histórico familiar relevante..." rows={3} />
          </div>
          <div style={{ marginTop:"13px" }}>
            <Txta label="Observações Gerais" value={form.observations||""} onChange={v=>f({observations:v})} placeholder="Anotações livres sobre o paciente..." rows={3} />
          </div>
          <div style={{ marginTop:"16px", display:"flex", justifyContent:"flex-end" }}>
            <Btn onClick={saveInfo}>Salvar Alterações</Btn>
          </div>
        </Card>
      )}

      {/* TAB: PRONTUÁRIO */}
      {tab==="prontuario" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          <Card>
            <h3 style={{ margin:"0 0 12px", fontSize:"15px", fontWeight:700, color:th.text }}>Nova Nota de Sessão</h3>
            <Txta value={noteText} onChange={setNoteText} placeholder="Registre o que foi discutido na sessão de hoje..." rows={4} />
            <div style={{ marginTop:"10px" }}>
              <p style={{ margin:"0 0 7px", fontSize:"11px", fontWeight:700, color:th.textLight, textTransform:"uppercase", letterSpacing:"0.05em" }}>Tags da sessão</p>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                {ALL_TAGS.map(tag=>(
                  <span key={tag} onClick={()=>toggleTag(tag)}
                    style={{ padding:"3px 9px", borderRadius:"20px", fontSize:"11px", fontWeight:600, cursor:"pointer",
                      background:noteTags.includes(tag)?th.lavender:th.lavenderLight,
                      color:noteTags.includes(tag)?"#fff":"#6B5A9E", transition:"all 0.15s" }}>#{tag}</span>
                ))}
              </div>
            </div>
            <div style={{ marginTop:"12px", display:"flex", justifyContent:"flex-end" }}>
              <Btn onClick={addNote} disabled={!noteText.trim()}>Salvar Nota</Btn>
            </div>
          </Card>

          <Card>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px" }}>
              <h3 style={{ margin:0, fontSize:"15px", fontWeight:700, color:th.text }}>Histórico ({(patient.notes||[]).length} notas)</h3>
              <input value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} placeholder="Buscar nas notas..."
                style={{ padding:"6px 10px", border:`1.5px solid ${th.border}`, borderRadius:R.sm, fontSize:"12px", fontFamily:"inherit", outline:"none", width:isMobile?"110px":"170px" }} />
            </div>
            {filteredNotes.length===0
              ? <p style={{ color:th.textLight, fontSize:"13px", textAlign:"center", padding:"16px 0" }}>{(patient.notes||[]).length===0?"Nenhuma nota registrada ainda.":"Nenhum resultado."}</p>
              : <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  {filteredNotes.map((note,i)=>(
                    <div key={note.id} style={{ display:"flex", gap:"12px" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                        <div style={{ width:"9px", height:"9px", borderRadius:"50%", background:th.primary, flexShrink:0, marginTop:"5px" }} />
                        {i<filteredNotes.length-1&&<div style={{ width:"1px", flex:1, background:th.border, margin:"4px 0" }} />}
                      </div>
                      <div style={{ flex:1, paddingBottom:"10px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"5px", flexWrap:"wrap", gap:"4px" }}>
                          <span style={{ fontSize:"11px", fontWeight:600, color:th.textLight }}>{note.date} às {note.time}</span>
                          <div style={{ display:"flex", gap:"3px", flexWrap:"wrap", alignItems:"center" }}>
                            {note.tags.map(tag=><span key={tag} style={{ fontSize:"10px", padding:"1px 6px", borderRadius:"10px", background:th.lavenderLight, color:"#6B5A9E", fontWeight:600 }}>#{tag}</span>)}
                            <button onClick={()=>deleteNote(note.id)} style={{ fontSize:"10px", color:th.danger, background:th.dangerLight, border:"none", borderRadius:"5px", cursor:"pointer", padding:"1px 6px", fontFamily:"inherit" }}>✕</button>
                          </div>
                        </div>
                        <p style={{ margin:0, fontSize:"14px", color:th.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{note.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </Card>
        </div>
      )}

      {/* TAB: INSIGHT */}
      {tab==="insight" && (
        <Card style={{ background:`linear-gradient(135deg,${th.accentLight},${th.lavenderLight})`, border:`1px solid ${th.accent}` }}>
          <p style={{ margin:"0 0 10px", fontSize:"11px", fontWeight:700, color:th.accentDark, textTransform:"uppercase", letterSpacing:"0.06em" }}>✦ Insight — Próxima Sessão</p>
          <p style={{ margin:"0 0 12px", fontSize:"13px", color:th.textMid, lineHeight:1.6 }}>
            Anote um lembrete para ler 5 minutos antes do próximo encontro com <strong>{patient.name.split(" ")[0]}</strong>.
          </p>
          <Txta value={insightText} onChange={setInsightText} placeholder="Ex: Retomar o tema da relação com a mãe. Perguntar sobre o diário..." rows={6} />
          <div style={{ marginTop:"12px", display:"flex", justifyContent:"flex-end" }}>
            <Btn onClick={saveInsight}>Salvar Insight</Btn>
          </div>
          {patient.insight && (
            <div style={{ marginTop:"18px", padding:"14px", borderRadius:R.md, background:"rgba(255,255,255,0.6)", border:`1px solid ${th.accent}` }}>
              <p style={{ margin:"0 0 6px", fontSize:"11px", fontWeight:700, color:th.accentDark, textTransform:"uppercase" }}>Último salvo</p>
              <p style={{ margin:0, fontSize:"14px", color:th.text, lineHeight:1.7 }}>{patient.insight}</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── PATIENTS LIST ────────────────────────────────────────────────────────────
function Patients({ patients, setPatients, isMobile }) {
  const [search, setSearch]   = useState("");
  const [filter, setFilter]   = useState("Todos");
  const [dossier, setDossier] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const blank = { name:"", age:"", profession:"", phone:"", emergency:"", status:"Ativo", type:"Particular", convenio:"", carteirinha:"", sessoesAutorizadas:"", tags:[], insight:"", notes:[], medHistory:"", observations:"", schedule:[] };
  const [form, setForm] = useState(blank);
  const f = v => setForm(prev=>({...prev,...v}));

  const filtered = patients.filter(p=>(filter==="Todos"||p.status===filter)&&p.name.toLowerCase().includes(search.toLowerCase()));

  const savePatient = () => {
    if (!form.name.trim()) return;
    setPatients([...patients, { ...form, id:Date.now(), age:Number(form.age)||0, sessionsTotal:0 }]);
    setForm(blank); setShowAdd(false);
  };

  const updatePatient = updated => {
    setPatients(patients.map(p=>p.id===updated.id?updated:p));
    setDossier(updated);
  };

  if (dossier) return <PatientDossier patient={dossier} onUpdate={updatePatient} onBack={()=>setDossier(null)} isMobile={isMobile} />;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <h1 style={{ margin:0, fontSize:isMobile?"22px":"26px", fontWeight:800, color:th.text, letterSpacing:"-0.02em" }}>Pacientes</h1>
        <Btn onClick={()=>setShowAdd(true)}>+ Novo</Btn>
      </div>

      <div style={{ marginBottom:"18px", display:"flex", flexDirection:"column", gap:"10px" }}>
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color:th.textLight }}>⌕</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente..."
            style={{ width:"100%", padding:"10px 13px 10px 34px", border:`1.5px solid ${th.border}`, borderRadius:R.sm, fontSize:"14px", fontFamily:"inherit", background:th.surface, color:th.text, outline:"none", boxSizing:"border-box" }} />
        </div>
        <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
          {["Todos","Ativo","Em Pausa","Alta","Lista de Espera"].map(s=>(
            <Btn key={s} variant={filter===s?"primary":"secondary"} small onClick={()=>setFilter(s)}>{s}</Btn>
          ))}
        </div>
      </div>

      {filtered.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:th.textLight }}>
          <div style={{ fontSize:"42px", marginBottom:"10px" }}>◉</div>
          <p style={{ margin:0, fontSize:"15px", fontWeight:600 }}>Nenhum paciente cadastrado.</p>
          <p style={{ margin:"5px 0 0", fontSize:"13px" }}>Clique em "+ Novo" para adicionar.</p>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(265px,1fr))", gap:"13px" }}>
        {filtered.map(p=>(
          <Card key={p.id} hover onClick={()=>setDossier(p)}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"10px" }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"50%", background:`linear-gradient(135deg,${th.primaryLight},${th.lavenderLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"15px", fontWeight:800, color:th.primaryDark }}>{p.name.charAt(0)}</div>
              <Badge label={p.status} {...STATUS_COLORS[p.status]} small />
            </div>
            <h3 style={{ margin:"0 0 3px", fontSize:"15px", fontWeight:700, color:th.text }}>{p.name}</h3>
            <p style={{ margin:"0 0 8px", fontSize:"12px", color:th.textLight }}>{p.age?`${p.age} anos · `:""}{p.profession||"—"}</p>

            {/* Schedule preview */}
            {(p.schedule||[]).length>0 && (
              <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginBottom:"8px" }}>
                {(p.schedule||[]).map(s=>(
                  <span key={s.id} style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"20px", background:th.primaryLight, color:th.primaryDark, fontWeight:600 }}>
                    {WEEKDAYS_LABEL[Number(s.dow)]} {s.time}
                  </span>
                ))}
              </div>
            )}

            <div style={{ display:"flex", gap:"4px", flexWrap:"wrap" }}>
              {(p.tags||[]).slice(0,3).map(tag=><span key={tag} style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"20px", background:th.lavenderLight, color:"#6B5A9E", fontWeight:600 }}>#{tag}</span>)}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:"10px", paddingTop:"10px", borderTop:`1px solid ${th.border}` }}>
              <span style={{ fontSize:"12px", color:th.textLight }}>{(p.notes||[]).length} notas</span>
              <Badge label={p.type||"Particular"} bg={p.type==="Convênio"?th.primaryLight:th.accentLight} color={p.type==="Convênio"?th.primaryDark:th.accentDark} small />
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Novo Paciente" wide>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:"13px" }}>
          <Inp label="Nome completo *" value={form.name} onChange={v=>f({name:v})} placeholder="Nome do paciente" style={{ gridColumn:isMobile?"1":"1 / -1" }} />
          <Inp label="Idade" value={form.age} onChange={v=>f({age:v})} type="number" />
          <Inp label="Profissão" value={form.profession} onChange={v=>f({profession:v})} />
          <Inp label="Telefone" value={form.phone} onChange={v=>f({phone:v})} style={{ gridColumn:isMobile?"1":"1 / -1" }} />
          <Inp label="Contato de emergência" value={form.emergency} onChange={v=>f({emergency:v})} style={{ gridColumn:isMobile?"1":"1 / -1" }} />
          <Sel label="Status" value={form.status} onChange={v=>f({status:v})} options={["Ativo","Em Pausa","Alta","Lista de Espera"].map(s=>({value:s,label:s}))} />
          <Sel label="Tipo" value={form.type} onChange={v=>f({type:v})} options={[{value:"Particular",label:"Particular"},{value:"Convênio",label:"Convênio"}]} />
          {form.type==="Convênio"&&<>
            <Inp label="Convênio" value={form.convenio} onChange={v=>f({convenio:v})} />
            <Inp label="N° Carteirinha" value={form.carteirinha} onChange={v=>f({carteirinha:v})} />
          </>}
          <div style={{ gridColumn:isMobile?"1":"1 / -1" }}>
            <ScheduleEditor schedule={form.schedule||[]} onChange={s=>f({schedule:s})} />
          </div>
          <div style={{ gridColumn:isMobile?"1":"1 / -1", display:"flex", justifyContent:"flex-end", gap:"10px" }}>
            <Btn variant="secondary" onClick={()=>setShowAdd(false)}>Cancelar</Btn>
            <Btn onClick={savePatient} disabled={!form.name.trim()}>Salvar</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── FINANCE ─────────────────────────────────────────────────────────────────
function Finance({ sessions, setSessions, expenses, setExpenses, patients, isMobile }) {
  const [tab, setTab]     = useState("sessions");
  const [showSess, setShowSess] = useState(false);
  const [showExp,  setShowExp]  = useState(false);
  const [showRec,  setShowRec]  = useState(null);
  const [rc, setRc] = useState({ title:"RECIBO DE CONSULTA PSICOLÓGICA", psicName:"Dra. [Nome]", crp:"CRP XX/XXXXX", address:"[Endereço]", sessionCount:"1", month:"", sessionDates:"", value:"", notes:"", patientName:"" });
  const [ns, setNs] = useState({ patientName:"", date:"", time:"", value:"", status:"realizada" });
  const [ne, setNe] = useState({ description:"", value:"", date:"", category:"Infraestrutura" });

  const fmt = v=>`R$ ${v.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
  const totalRec  = sessions.filter(s=>s.paid).reduce((a,s)=>a+s.value,0);
  const totalPend = sessions.filter(s=>s.status==="realizada"&&!s.paid).reduce((a,s)=>a+s.value,0);
  const totalExp  = expenses.reduce((a,e)=>a+e.value,0);

  const markPaid = (id,method) => setSessions(sessions.map(s=>s.id===id?{...s,paid:true,method}:s));

  const addSess = () => {
    if (!ns.patientName||!ns.date) return;
    setSessions([...sessions,{...ns,id:Date.now(),paid:false,method:null,value:Number(ns.value)||0}]);
    setNs({patientName:"",date:"",time:"",value:"",status:"realizada"}); setShowSess(false);
  };

  const addExp = () => {
    if (!ne.description||!ne.value) return;
    setExpenses([...expenses,{...ne,id:Date.now(),value:Number(ne.value)}]);
    setNe({description:"",value:"",date:"",category:"Infraestrutura"}); setShowExp(false);
  };

  const openReceipt = s => {
    setRc(r=>({...r,sessionDates:`${s.date}${s.time?" às "+s.time:""}`,value:String(s.value),patientName:s.patientName}));
    setShowRec(s);
  };

  const printReceipt = () => {
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Recibo</title>
    <style>body{font-family:Georgia,serif;max-width:600px;margin:40px auto;color:#2d2d2d;line-height:1.8}
    h1{font-size:17px;text-align:center}hr{border:none;border-top:1px solid #ccc;margin:20px 0}
    .val{font-size:24px;font-weight:bold;text-align:center;margin:20px 0}
    .sig{margin-top:60px;text-align:center;border-top:1px solid #555;width:280px;margin:60px auto 0;padding-top:10px;font-size:13px}
    </style></head><body>
    <h1>${rc.title}</h1><hr/>
    <p><strong>Paciente:</strong> ${rc.patientName}</p>
    <p><strong>Profissional:</strong> ${rc.psicName} — ${rc.crp}</p>
    <p><strong>Endereço:</strong> ${rc.address}</p><hr/>
    <p><strong>${rc.sessionCount} consulta(s)</strong> referente ao mês de <strong>${rc.month}</strong></p>
    <p><strong>Data(s):</strong> ${rc.sessionDates}</p>
    ${rc.notes?`<p><strong>Obs:</strong> ${rc.notes}</p>`:""}
    <div class="val">R$ ${Number(rc.value||0).toLocaleString("pt-BR",{minimumFractionDigits:2})}</div><hr/>
    <p style="font-size:12px;color:#888;text-align:center">Emitido em ${new Date().toLocaleDateString("pt-BR")}</p>
    <div class="sig">${rc.psicName}<br/>${rc.crp}</div>
    </body></html>`);
    w.document.close(); w.print();
  };

  const MI = { Pix:"◆", Dinheiro:"◈", Cartão:"▣", Transferência:"↔" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"20px" }}>
        <h1 style={{ margin:0, fontSize:isMobile?"22px":"26px", fontWeight:800, color:th.text, letterSpacing:"-0.02em" }}>Financeiro</h1>
        <Btn small onClick={()=>tab==="sessions"?setShowSess(true):setShowExp(true)}>+ Lançar</Btn>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:"12px", marginBottom:"18px" }}>
        {[
          { label:"Recebido",  value:fmt(totalRec),           color:th.success,    bg:"#EDF5F1" },
          { label:"A Receber", value:fmt(totalPend),          color:th.warning,    bg:"#FFF8E8" },
          { label:"Gastos",    value:fmt(totalExp),           color:th.danger,     bg:th.dangerLight },
          { label:"Lucro",     value:fmt(totalRec-totalExp),  color:th.primaryDark,bg:th.primaryLight },
        ].map((c,i)=>(
          <Card key={i}>
            <p style={{ margin:"0 0 4px", fontSize:"10px", fontWeight:700, color:th.textLight, textTransform:"uppercase", letterSpacing:"0.05em" }}>{c.label}</p>
            <p style={{ margin:0, fontSize:isMobile?"16px":"19px", fontWeight:800, color:th.text }}>{c.value}</p>
          </Card>
        ))}
      </div>

      <div style={{ display:"flex", gap:"4px", marginBottom:"16px", background:th.border, borderRadius:R.sm, padding:"4px", width:"fit-content" }}>
        {[["sessions","Sessões"],["expenses","Gastos"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{ padding:"7px 16px", borderRadius:"6px", border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:600,
              background:tab===id?th.surface:"transparent", color:tab===id?th.text:th.textLight,
              boxShadow:tab===id?SH.sm:"none", transition:"all 0.15s" }}>{lbl}</button>
        ))}
      </div>

      {tab==="sessions" && (
        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:"15px", fontWeight:700, color:th.text }}>Controle de Sessões</h3>
          {sessions.length===0&&<p style={{ color:th.textLight, textAlign:"center", padding:"20px", fontSize:"13px" }}>Nenhuma sessão registrada.</p>}
          <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
            {sessions.map(s=>(
              <div key={s.id} style={{ padding:"12px 13px", borderRadius:R.md,
                background:s.paid?"#F0FAF5":s.status==="realizada"?th.dangerLight:th.surfaceAlt,
                border:`1px solid ${s.paid?"#C5E5D5":s.status==="realizada"?th.rose:th.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"6px" }}>
                  <div>
                    <p style={{ margin:"0 0 2px", fontWeight:700, fontSize:"13px", color:th.text }}>{s.patientName}</p>
                    <p style={{ margin:0, fontSize:"12px", color:th.textLight }}>{s.date}{s.time?` · ${s.time}`:""}</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <p style={{ margin:"0 0 2px", fontWeight:800, fontSize:"14px", color:th.text }}>R$ {s.value}</p>
                    {s.paid&&<span style={{ fontSize:"11px", color:th.success, fontWeight:600 }}>{MI[s.method]} {s.method}</span>}
                  </div>
                </div>
                {!s.paid&&s.status==="realizada"&&(
                  <div style={{ display:"flex", gap:"5px", flexWrap:"wrap", marginTop:"9px" }}>
                    {["Pix","Dinheiro","Cartão","Transferência"].map(m=>(
                      <Btn key={m} small variant="secondary" onClick={()=>markPaid(s.id,m)} style={{ fontSize:"11px" }}>{MI[m]} {m}</Btn>
                    ))}
                  </div>
                )}
                {s.paid&&<div style={{ marginTop:"7px" }}><Btn small variant="ghost" onClick={()=>openReceipt(s)}>Gerar Recibo</Btn></div>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab==="expenses" && (
        <Card>
          <h3 style={{ margin:"0 0 14px", fontSize:"15px", fontWeight:700, color:th.text }}>Gastos do Consultório</h3>
          {expenses.length===0&&<p style={{ color:th.textLight, textAlign:"center", padding:"20px", fontSize:"13px" }}>Nenhum gasto registrado.</p>}
          <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
            {expenses.map(e=>(
              <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 13px", borderRadius:R.sm, background:th.surfaceAlt, border:`1px solid ${th.border}` }}>
                <div>
                  <p style={{ margin:"0 0 2px", fontWeight:600, fontSize:"13px", color:th.text }}>{e.description}</p>
                  <span style={{ fontSize:"10px", padding:"2px 7px", borderRadius:"10px", background:th.lavenderLight, color:"#6B5A9E", fontWeight:600 }}>{e.category}</span>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ margin:"0 0 2px", fontWeight:800, fontSize:"14px", color:th.danger }}>− R$ {e.value.toLocaleString("pt-BR",{minimumFractionDigits:2})}</p>
                  <p style={{ margin:0, fontSize:"11px", color:th.textLight }}>{e.date}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={showSess} onClose={()=>setShowSess(false)} title="Registrar Sessão">
        <div style={{ display:"flex", flexDirection:"column", gap:"13px" }}>
          <Sel label="Paciente" value={ns.patientName} onChange={v=>setNs({...ns,patientName:v})} options={[{value:"",label:"Selecionar..."},...patients.map(p=>({value:p.name,label:p.name}))]} />
          <Inp label="Data" value={ns.date} onChange={v=>setNs({...ns,date:v})} type="date" />
          <Inp label="Horário" value={ns.time} onChange={v=>setNs({...ns,time:v})} type="time" />
          <Inp label="Valor (R$)" value={ns.value} onChange={v=>setNs({...ns,value:v})} type="number" />
          <Sel label="Status" value={ns.status} onChange={v=>setNs({...ns,status:v})} options={[{value:"realizada",label:"Realizada"},{value:"agendada",label:"Agendada"},{value:"cancelada",label:"Cancelada"}]} />
          <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
            <Btn variant="secondary" onClick={()=>setShowSess(false)}>Cancelar</Btn>
            <Btn onClick={addSess}>Salvar</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={showExp} onClose={()=>setShowExp(false)} title="Novo Gasto">
        <div style={{ display:"flex", flexDirection:"column", gap:"13px" }}>
          <Inp label="Descrição" value={ne.description} onChange={v=>setNe({...ne,description:v})} placeholder="Ex: Aluguel consultório" />
          <Inp label="Valor (R$)" value={ne.value} onChange={v=>setNe({...ne,value:v})} type="number" />
          <Inp label="Data" value={ne.date} onChange={v=>setNe({...ne,date:v})} type="date" />
          <Sel label="Categoria" value={ne.category} onChange={v=>setNe({...ne,category:v})} options={["Infraestrutura","Desenvolvimento","Material","Outros"].map(c=>({value:c,label:c}))} />
          <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
            <Btn variant="secondary" onClick={()=>setShowExp(false)}>Cancelar</Btn>
            <Btn onClick={addExp}>Salvar</Btn>
          </div>
        </div>
      </Modal>

      <Modal open={!!showRec} onClose={()=>setShowRec(null)} title="Gerar Recibo" wide>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:"13px" }}>
          <Inp label="Título" value={rc.title} onChange={v=>setRc({...rc,title:v})} style={{ gridColumn:isMobile?"1":"1 / -1" }} />
          <Inp label="Nome da psicóloga" value={rc.psicName} onChange={v=>setRc({...rc,psicName:v})} />
          <Inp label="CRP" value={rc.crp} onChange={v=>setRc({...rc,crp:v})} />
          <Inp label="Endereço" value={rc.address} onChange={v=>setRc({...rc,address:v})} style={{ gridColumn:isMobile?"1":"1 / -1" }} />
          <Inp label="N° de sessões" value={rc.sessionCount} onChange={v=>setRc({...rc,sessionCount:v})} />
          <Inp label="Mês de referência" value={rc.month} onChange={v=>setRc({...rc,month:v})} placeholder="Ex: Julho/2025" />
          <Inp label="Data(s) das sessões" value={rc.sessionDates} onChange={v=>setRc({...rc,sessionDates:v})} style={{ gridColumn:isMobile?"1":"1 / -1" }} />
          <Inp label="Valor total (R$)" value={rc.value} onChange={v=>setRc({...rc,value:v})} type="number" />
          <Txta label="Observações (opcional)" value={rc.notes} onChange={v=>setRc({...rc,notes:v})} rows={2} />
          <div style={{ gridColumn:isMobile?"1":"1 / -1", display:"flex", justifyContent:"flex-end", gap:"10px" }}>
            <Btn variant="secondary" onClick={()=>setShowRec(null)}>Fechar</Btn>
            <Btn onClick={printReceipt}>Imprimir / PDF</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
const DOC_TEMPLATES = {
  atestado:  (p,d)=>`ATESTADO DE COMPARECIMENTO\n\nAtesto para os devidos fins que ${p||"[nome do paciente]"} compareceu a consulta psicológica no dia ${d||"[data]"}, no período de [hora início] às [hora término].\n\nO presente atestado é fornecido a pedido do(a) interessado(a).\n\n[Cidade], ${new Date().toLocaleDateString("pt-BR")}\n\n_______________________________\n[Nome da Psicóloga]\nCRP XX/XXXXX`,
  laudo:     (p)   =>`LAUDO PSICOLÓGICO\n\nPaciente: ${p||"[nome do paciente]"}\nData de nascimento: [data]\nPeríodo de avaliação: [período]\n\n1. MOTIVO DA AVALIAÇÃO\n[Descreva o motivo]\n\n2. PROCEDIMENTOS UTILIZADOS\n[Descreva os instrumentos e técnicas]\n\n3. ANÁLISE E RESULTADOS\n[Descreva os achados]\n\n4. CONCLUSÃO\n[Conclusão profissional]\n\n[Cidade], ${new Date().toLocaleDateString("pt-BR")}\n\n_______________________________\n[Nome da Psicóloga]\nCRP XX/XXXXX`,
  contrato:  (p)   =>`CONTRATO DE PRESTAÇÃO DE SERVIÇOS PSICOLÓGICOS\n\nContratante: ${p||"[nome do paciente]"}\nContratada: [Nome da Psicóloga], CRP XX/XXXXX\n\nCLÁUSULA 1 – DO OBJETO\nA Contratada prestará serviços de psicoterapia ao Contratante.\n\nCLÁUSULA 2 – DAS SESSÕES\nAs sessões terão duração de 50 minutos, realizadas com periodicidade [semanal/quinzenal].\n\nCLÁUSULA 3 – DOS HONORÁRIOS\nValor por sessão: R$ [valor]. Pagamento mediante [forma].\n\nCLÁUSULA 4 – DO SIGILO\nAs informações compartilhadas nas sessões são protegidas pelo sigilo profissional.\n\n[Cidade], ${new Date().toLocaleDateString("pt-BR")}\n\n___________________________     ___________________________\nContratante                                           Contratada`,
  declaracao:(p,d) =>`DECLARAÇÃO\n\nDeclaro que ${p||"[nome do paciente]"} está sob acompanhamento psicológico neste consultório${d?` desde ${d}`:""} .\n\nEsta declaração é fornecida para os fins que se fizerem necessários.\n\n[Cidade], ${new Date().toLocaleDateString("pt-BR")}\n\n_______________________________\n[Nome da Psicóloga]\nCRP XX/XXXXX`,
};

function Documents({ patients, isMobile }) {
  const [docType, setDocType] = useState("atestado");
  const [selPat, setSelPat]   = useState("");
  const [date, setDate]       = useState("");
  const [content, setContent] = useState(DOC_TEMPLATES.atestado("",""));
  const [saved, setSaved]     = useState(()=>load("psicogest_docs",[]));
  useEffect(()=>save("psicogest_docs",saved),[saved]);

  const generate = () => setContent(DOC_TEMPLATES[docType](selPat,date));
  const saveDoc  = () => setSaved([{ id:Date.now(), type:docType, patient:selPat, date:new Date().toLocaleDateString("pt-BR"), title:`${docType} — ${selPat||"Paciente"} — ${new Date().toLocaleDateString("pt-BR")}`, content },...saved]);
  const printDoc = () => {
    const w = window.open("","_blank");
    w.document.write(`<html><head><title>Documento</title><style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;white-space:pre-line;line-height:1.8;color:#2d2d2d;font-size:14px}</style></head><body>${content}</body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div>
      <h1 style={{ margin:"0 0 22px", fontSize:isMobile?"22px":"26px", fontWeight:800, color:th.text, letterSpacing:"-0.02em" }}>Documentos</h1>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1.6fr", gap:"18px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <Card>
            <h3 style={{ margin:"0 0 13px", fontSize:"15px", fontWeight:700, color:th.text }}>Gerador</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:"11px" }}>
              <Sel label="Tipo" value={docType} onChange={v=>{ setDocType(v); setContent(DOC_TEMPLATES[v](selPat,date)); }} options={[{value:"atestado",label:"Atestado"},{value:"laudo",label:"Laudo"},{value:"contrato",label:"Contrato"},{value:"declaracao",label:"Declaração"}]} />
              <Sel label="Paciente" value={selPat} onChange={v=>setSelPat(v)} options={[{value:"",label:"Selecionar..."},...patients.map(p=>({value:p.name,label:p.name}))]} />
              <Inp label="Data de referência" value={date} onChange={v=>setDate(v)} type="date" />
              <Btn onClick={generate}>Gerar Template</Btn>
            </div>
          </Card>
          <Card>
            <h3 style={{ margin:"0 0 13px", fontSize:"15px", fontWeight:700, color:th.text }}>Salvos</h3>
            {saved.length===0&&<p style={{ color:th.textLight, fontSize:"12px" }}>Nenhum documento salvo.</p>}
            <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
              {saved.map(d=>(
                <div key={d.id} onClick={()=>setContent(d.content||"")} style={{ padding:"9px 11px", borderRadius:R.sm, background:th.surfaceAlt, border:`1px solid ${th.border}`, cursor:"pointer" }}>
                  <p style={{ margin:"0 0 2px", fontWeight:600, fontSize:"12px", color:th.text }}>{d.title}</p>
                  <p style={{ margin:0, fontSize:"10px", color:th.textLight }}>{d.date} · {d.patient}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Card>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"13px", flexWrap:"wrap", gap:"8px" }}>
            <h3 style={{ margin:0, fontSize:"15px", fontWeight:700, color:th.text }}>Editor</h3>
            <div style={{ display:"flex", gap:"7px" }}>
              <Btn small variant="secondary" onClick={saveDoc}>Salvar</Btn>
              <Btn small onClick={printDoc}>Imprimir / PDF</Btn>
            </div>
          </div>
          <textarea value={content} onChange={e=>setContent(e.target.value)}
            style={{ width:"100%", minHeight:isMobile?"280px":"440px", border:`1.5px solid ${th.border}`, borderRadius:R.sm, padding:"13px", fontSize:"13px", fontFamily:"Georgia,serif", lineHeight:1.9, color:th.text, background:"#FDFCFB", resize:"vertical", outline:"none", boxSizing:"border-box" }}
            onFocus={e=>(e.target.style.borderColor=th.primary)} onBlur={e=>(e.target.style.borderColor=th.border)} />
        </Card>
      </div>
    </div>
  );
}

// ─── PRONTUÁRIO (quick panel) ─────────────────────────────────────────────────
function Prontuario({ patients, setPatients, isMobile }) {
  const [selId, setSelId]         = useState(null);
  const [noteText, setNoteText]   = useState("");
  const [noteTags, setNoteTags]   = useState([]);
  const [noteSearch, setNoteSearch] = useState("");
  const [insightText, setInsightText] = useState("");

  const patient = patients.find(p=>p.id===selId)||null;
  useEffect(()=>setInsightText(patient?.insight||""),[selId]);

  const addNote = () => {
    if (!noteText.trim()||!patient) return;
    const note = { id:Date.now(), text:noteText, tags:[...noteTags], date:new Date().toLocaleDateString("pt-BR"), time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"}) };
    const updated = { ...patient, notes:[note,...(patient.notes||[])] };
    setPatients(patients.map(p=>p.id===patient.id?updated:p));
    setNoteText(""); setNoteTags([]);
  };

  const saveInsight = () => patient&&setPatients(patients.map(p=>p.id===patient.id?{...p,insight:insightText}:p));
  const toggleTag   = tag => setNoteTags(t=>t.includes(tag)?t.filter(x=>x!==tag):[...t,tag]);
  const filteredNotes = (patient?.notes||[]).filter(n=>!noteSearch||n.text.toLowerCase().includes(noteSearch.toLowerCase())||n.tags.some(t=>t.includes(noteSearch.toLowerCase())));
  const activePatients = patients.filter(p=>p.status==="Ativo"||p.status==="Em Pausa");

  return (
    <div>
      <h1 style={{ margin:"0 0 20px", fontSize:isMobile?"22px":"26px", fontWeight:800, color:th.text, letterSpacing:"-0.02em" }}>Prontuários</h1>
      {isMobile&&selId&&<button onClick={()=>setSelId(null)} style={{ background:"none", border:"none", cursor:"pointer", color:th.textMid, fontSize:"14px", fontWeight:600, marginBottom:"14px", padding:0 }}>← Lista de pacientes</button>}

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"250px 1fr", gap:"16px" }}>
        {(!isMobile||!selId)&&(
          <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
            {activePatients.length===0&&<p style={{ color:th.textLight, fontSize:"13px" }}>Nenhum paciente ativo.</p>}
            {activePatients.map(p=>(
              <div key={p.id} onClick={()=>setSelId(p.id)}
                style={{ padding:"11px 13px", borderRadius:R.md, cursor:"pointer",
                  background:selId===p.id?`linear-gradient(135deg,${th.primaryLight},${th.lavenderLight})`:th.surface,
                  border:`1.5px solid ${selId===p.id?th.primary:th.border}`, transition:"all 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"9px" }}>
                  <div style={{ width:"33px", height:"33px", borderRadius:"50%", background:`linear-gradient(135deg,${th.primaryLight},${th.lavenderLight})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:800, color:th.primaryDark, flexShrink:0 }}>{p.name.charAt(0)}</div>
                  <div>
                    <p style={{ margin:0, fontWeight:600, fontSize:"13px", color:th.text }}>{p.name}</p>
                    <p style={{ margin:0, fontSize:"11px", color:th.textLight }}>{(p.notes||[]).length} nota(s)</p>
                  </div>
                </div>
                {p.insight&&<div style={{ marginTop:"6px", padding:"5px 8px", borderRadius:"6px", background:"rgba(232,197,176,0.3)", fontSize:"11px", color:th.accentDark, lineHeight:1.4 }}>✦ {p.insight.substring(0,55)}…</div>}
              </div>
            ))}
          </div>
        )}

        {(!isMobile||selId)&&(
          <div>
            {!patient
              ? <Card style={{ textAlign:"center", padding:"48px" }}><p style={{ color:th.textLight, fontSize:"13px" }}>← Selecione um paciente</p></Card>
              : <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <Card style={{ background:`linear-gradient(135deg,${th.accentLight},${th.lavenderLight})`, border:`1px solid ${th.accent}` }}>
                    <p style={{ margin:"0 0 7px", fontSize:"11px", fontWeight:700, color:th.accentDark, textTransform:"uppercase", letterSpacing:"0.06em" }}>✦ Insight — Próxima Sessão</p>
                    <textarea value={insightText} onChange={e=>setInsightText(e.target.value)} placeholder="Lembrete para antes do próximo encontro..." rows={2}
                      style={{ width:"100%", border:"none", background:"transparent", fontSize:"14px", fontFamily:"inherit", color:th.text, resize:"none", outline:"none", lineHeight:1.6, boxSizing:"border-box" }} />
                    <Btn small onClick={saveInsight} style={{ marginTop:"6px" }}>Salvar</Btn>
                  </Card>

                  <Card>
                    <h3 style={{ margin:"0 0 11px", fontSize:"14px", fontWeight:700, color:th.text }}>Nova Nota — {patient.name.split(" ")[0]}</h3>
                    <Txta value={noteText} onChange={setNoteText} placeholder="O que foi discutido na sessão de hoje..." rows={4} />
                    <div style={{ marginTop:"9px" }}>
                      <p style={{ margin:"0 0 6px", fontSize:"11px", fontWeight:700, color:th.textLight, textTransform:"uppercase", letterSpacing:"0.05em" }}>Tags</p>
                      <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                        {ALL_TAGS.map(tag=><span key={tag} onClick={()=>toggleTag(tag)} style={{ padding:"3px 8px", borderRadius:"20px", fontSize:"11px", fontWeight:600, cursor:"pointer", background:noteTags.includes(tag)?th.lavender:th.lavenderLight, color:noteTags.includes(tag)?"#fff":"#6B5A9E", transition:"all 0.15s" }}>#{tag}</span>)}
                      </div>
                    </div>
                    <div style={{ marginTop:"11px", display:"flex", justifyContent:"flex-end" }}>
                      <Btn onClick={addNote} disabled={!noteText.trim()}>Salvar Nota</Btn>
                    </div>
                  </Card>

                  <Card>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
                      <h3 style={{ margin:0, fontSize:"14px", fontWeight:700, color:th.text }}>Histórico ({(patient.notes||[]).length})</h3>
                      <input value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} placeholder="Buscar..."
                        style={{ padding:"5px 9px", border:`1.5px solid ${th.border}`, borderRadius:R.sm, fontSize:"12px", fontFamily:"inherit", outline:"none", width:"120px" }} />
                    </div>
                    {filteredNotes.length===0
                      ? <p style={{ color:th.textLight, fontSize:"13px", textAlign:"center", padding:"14px 0" }}>Nenhuma nota.</p>
                      : filteredNotes.map((note,i)=>(
                        <div key={note.id} style={{ display:"flex", gap:"11px", marginBottom:"10px" }}>
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                            <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:th.primary, flexShrink:0, marginTop:"5px" }} />
                            {i<filteredNotes.length-1&&<div style={{ width:"1px", flex:1, background:th.border, margin:"3px 0" }} />}
                          </div>
                          <div style={{ flex:1, paddingBottom:"8px" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px", flexWrap:"wrap", gap:"3px" }}>
                              <span style={{ fontSize:"11px", fontWeight:600, color:th.textLight }}>{note.date} · {note.time}</span>
                              <div style={{ display:"flex", gap:"3px", flexWrap:"wrap" }}>
                                {note.tags.map(tag=><span key={tag} style={{ fontSize:"10px", padding:"1px 5px", borderRadius:"9px", background:th.lavenderLight, color:"#6B5A9E", fontWeight:600 }}>#{tag}</span>)}
                              </div>
                            </div>
                            <p style={{ margin:0, fontSize:"14px", color:th.text, lineHeight:1.7, whiteSpace:"pre-wrap" }}>{note.text}</p>
                          </div>
                        </div>
                      ))
                    }
                  </Card>
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
const NAV = [
  { id:"dashboard",  label:"Dashboard",  icon:"◈" },
  { id:"agenda",     label:"Agenda",     icon:"▦" },
  { id:"patients",   label:"Pacientes",  icon:"◉" },
  { id:"finance",    label:"Financeiro", icon:"◎" },
  { id:"documents",  label:"Documentos", icon:"◫" },
  { id:"prontuario", label:"Prontuários",icon:"◧" },
];

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [page, setPage]         = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [patients, setPatients] = useState(()=>load("psicogest_patients",[]));
  const [sessions, setSessions] = useState(()=>load("psicogest_sessions",[]));
  const [expenses, setExpenses] = useState(()=>load("psicogest_expenses",[]));

  useEffect(()=>save("psicogest_patients",patients),[patients]);
  useEffect(()=>save("psicogest_sessions",sessions),[sessions]);
  useEffect(()=>save("psicogest_expenses",expenses),[expenses]);

  const navigate = p => { setPage(p); setMenuOpen(false); };

  const SidebarLinks = () => (
    <nav style={{ display:"flex", flexDirection:"column", gap:"3px", flex:1 }}>
      {NAV.map(item=>{
        const active = page===item.id;
        return (
          <button key={item.id} onClick={()=>navigate(item.id)}
            style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 13px", borderRadius:R.sm, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:"13px", fontWeight:active?700:500,
              background:active?`linear-gradient(135deg,${th.primaryLight},${th.lavenderLight})`:"transparent",
              color:active?th.primaryDark:th.textMid, transition:"all 0.15s", textAlign:"left" }}>
            <span style={{ fontSize:"15px" }}>{item.icon}</span>{item.label}
          </button>
        );
      })}
    </nav>
  );

  const SidebarFooter = () => (
    <div style={{ paddingTop:"14px", borderTop:`1px solid ${th.border}` }}>
      <div style={{ display:"flex", alignItems:"center", gap:"9px", padding:"8px 12px" }}>
        <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:`linear-gradient(135deg,${th.primary},${th.accent})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:800, color:"#fff", flexShrink:0 }}>P</div>
        <div>
          <p style={{ margin:0, fontSize:"12px", fontWeight:700, color:th.text }}>Psicóloga</p>
          <p style={{ margin:0, fontSize:"10px", color:th.textLight }}>CRP XX/XXXXX</p>
        </div>
      </div>
    </div>
  );

  // Mobile bottom nav shows only 5 items (most important)
  const mobileNav = [NAV[0], NAV[1], NAV[2], NAV[3], NAV[5]];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:th.bg, fontFamily:"'DM Sans','Nunito',system-ui,sans-serif" }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ width:"210px", background:th.surface, borderRight:`1px solid ${th.border}`, padding:"26px 14px", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:100 }}>
          <div style={{ marginBottom:"28px", paddingLeft:"6px" }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"9px", background:`linear-gradient(135deg,${th.primary},${th.lavender})`, marginBottom:"8px" }} />
            <h2 style={{ margin:0, fontSize:"14px", fontWeight:800, color:th.text, letterSpacing:"-0.02em" }}>PsicoGest</h2>
            <p style={{ margin:0, fontSize:"10px", color:th.textLight }}>Gestão de Consultório</p>
          </div>
          <SidebarLinks />
          <SidebarFooter />
        </aside>
      )}

      {/* Mobile drawer */}
      {isMobile&&menuOpen && (
        <div style={{ position:"fixed", inset:0, background:"rgba(61,53,48,0.4)", zIndex:200, backdropFilter:"blur(3px)" }} onClick={()=>setMenuOpen(false)}>
          <aside onClick={e=>e.stopPropagation()} style={{ width:"240px", height:"100%", background:th.surface, padding:"28px 14px", display:"flex", flexDirection:"column", boxShadow:SH.lg }}>
            <div style={{ marginBottom:"24px", paddingLeft:"6px" }}>
              <div style={{ width:"30px", height:"30px", borderRadius:"9px", background:`linear-gradient(135deg,${th.primary},${th.lavender})`, marginBottom:"8px" }} />
              <h2 style={{ margin:0, fontSize:"14px", fontWeight:800, color:th.text }}>PsicoGest</h2>
            </div>
            <SidebarLinks />
            <SidebarFooter />
          </aside>
        </div>
      )}

      {/* Mobile header */}
      {isMobile && (
        <header style={{ position:"fixed", top:0, left:0, right:0, height:"54px", background:th.surface, borderBottom:`1px solid ${th.border}`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 16px", zIndex:150, boxShadow:SH.sm }}>
          <button onClick={()=>setMenuOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"19px", color:th.text }}>☰</button>
          <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
            <div style={{ width:"24px", height:"24px", borderRadius:"7px", background:`linear-gradient(135deg,${th.primary},${th.lavender})` }} />
            <span style={{ fontSize:"14px", fontWeight:800, color:th.text }}>PsicoGest</span>
          </div>
          <div style={{ width:"24px" }} />
        </header>
      )}

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, height:"58px", background:th.surface, borderTop:`1px solid ${th.border}`, display:"flex", alignItems:"center", justifyContent:"space-around", zIndex:150, boxShadow:"0 -2px 10px rgba(61,53,48,0.05)" }}>
          {mobileNav.map(item=>{
            const active = page===item.id;
            return (
              <button key={item.id} onClick={()=>navigate(item.id)}
                style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"2px", background:"none", border:"none", cursor:"pointer", padding:"6px 10px", borderRadius:R.sm, fontFamily:"inherit" }}>
                <span style={{ fontSize:"17px", color:active?th.primaryDark:th.textLight }}>{item.icon}</span>
                <span style={{ fontSize:"9px", fontWeight:active?700:500, color:active?th.primaryDark:th.textLight }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Main */}
      <main style={{ marginLeft:isMobile?0:"210px", flex:1, padding:isMobile?"66px 15px 70px":"34px 40px", maxWidth:isMobile?"100vw":"calc(100vw - 210px)", boxSizing:"border-box" }}>
        {page==="dashboard"  && <Dashboard  sessions={sessions} patients={patients} expenses={expenses} onNavigate={navigate} isMobile={isMobile} />}
        {page==="agenda"     && <WeekCalendar patients={patients} isMobile={isMobile} />}
        {page==="patients"   && <Patients   patients={patients} setPatients={setPatients} isMobile={isMobile} />}
        {page==="finance"    && <Finance    sessions={sessions} setSessions={setSessions} expenses={expenses} setExpenses={setExpenses} patients={patients} isMobile={isMobile} />}
        {page==="documents"  && <Documents  patients={patients} isMobile={isMobile} />}
        {page==="prontuario" && <Prontuario patients={patients} setPatients={setPatients} isMobile={isMobile} />}
      </main>
    </div>
  );
}