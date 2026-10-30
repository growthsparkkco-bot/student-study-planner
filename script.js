const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "studyflow-planner-v1";
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const dateOffset = (n) => { const d = new Date(); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const defaultState = () => ({
  tasks: [
    {id:uid(),title:"Review yesterday's notes",subject:"Revision",priority:"Medium",date:todayISO(),duration:25,done:false},
    {id:uid(),title:"Practice 10 important questions",subject:"Core subject",priority:"High",date:todayISO(),duration:40,done:false},
    {id:uid(),title:"Quick recap before bed",subject:"Revision",priority:"Low",date:todayISO(),duration:15,done:true}
  ],
  exams: [],
  schedule: [
    {id:uid(),title:"Concept learning",subject:"Core subject",day:"Monday",time:"17:00"},
    {id:uid(),title:"Practice questions",subject:"Problem solving",day:"Wednesday",time:"18:00"},
    {id:uid(),title:"Weekly revision",subject:"Revision",day:"Saturday",time:"10:00"}
  ],
  focusMinutes:0, completedDates:[], activity:{}, theme:"light"
});
function loadState(){
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if(saved && Array.isArray(saved.tasks)) return {...defaultState(),...saved}; }
  catch(err){ console.warn("Could not read saved planner data.",err); }
  return defaultState();
}
let state = loadState();
let currentFilter = "all";
let selectedDay = new Date().toLocaleDateString("en-US",{weekday:"long"});
let timerTotal = 25*60, timerRemaining = timerTotal, timerInterval = null, timerRunning = false, timerStartedAt = null;
let toastTimeout;
function saveState(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function showToast(message){ const el=$("toast"); el.textContent=message; el.classList.add("show"); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>el.classList.remove("show"),2400); }
function formatDate(iso){ if(!iso)return ""; return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function renderTasks(){
  const list=$("taskList"); const tasks=state.tasks.filter(t=>t.date===todayISO());
  const visible=tasks.filter(t=>currentFilter==="all"||(currentFilter==="active"&&!t.done)||(currentFilter==="done"&&t.done));
  list.innerHTML=visible.map(t=>`<div class="task-item ${t.done?"done":""}">
    <button class="task-check" data-toggle-task="${t.id}" aria-label="${t.done?"Mark incomplete":"Mark complete"}">${t.done?"✓":""}</button>
    <div class="task-info"><strong>${escapeHTML(t.title)}</strong><div class="task-meta"><span class="subject-dot"></span>${escapeHTML(t.subject)} <span>·</span> ${t.duration} min</div></div>
    <span class="priority ${escapeHTML(t.priority)}">${escapeHTML(t.priority)}</span>
    <button class="task-delete" data-delete-task="${t.id}" aria-label="Delete ${escapeHTML(t.title)}">×</button>
  </div>`).join("");
  $("emptyTasks").classList.toggle("show",visible.length===0);
  $("emptyTasks").querySelector("strong").textContent=tasks.length?"No tasks in this filter":"Your plan starts here";
}
function renderExams(){
  const list=$("examList");
  const exams=state.exams.filter(e=>e.date>=todayISO()).sort((a,b)=>a.date.localeCompare(b.date));
  list.innerHTML=exams.map(e=>{
    const days=Math.round((new Date(`${e.date}T00:00:00`)-new Date(`${todayISO()}T00:00:00`))/86400000);
    const d=new Date(`${e.date}T12:00:00`);
    return `<div class="exam-card"><div class="exam-date-box"><b>${d.getDate()}</b><span>${d.toLocaleDateString("en-US",{month:"short"})}</span></div><div class="exam-info"><strong>${escapeHTML(e.title)}</strong><small>${escapeHTML(e.note||"Exam day")}${e.time?" · "+escapeHTML(e.time):""}</small></div><span class="exam-count">${days===0?"Today":days===1?"1 day":`${days} days`}</span><button class="exam-delete" data-delete-exam="${e.id}" aria-label="Delete exam">×</button></div>`;
  }).join("");
  $("emptyExams").classList.toggle("show",exams.length===0);
  $("examStat").innerHTML=`${exams.length} <small>exams</small>`;
}
const weekDays=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
function renderSchedule(){
  const now=new Date(); const mondayOffset=(now.getDay()+6)%7;
  $("scheduleDays").innerHTML=weekDays.map((day,i)=>{
    const d=new Date(now); d.setDate(now.getDate()-mondayOffset+i);
    return `<button class="day-btn ${selectedDay===day?"active":""}" data-select-day="${day}"><span>${day.slice(0,3)}</span><strong>${d.getDate()}</strong></button>`;
  }).join("");
  const sessions=state.schedule.filter(s=>s.day===selectedDay).sort((a,b)=>a.time.localeCompare(b.time));
  $("scheduleList").innerHTML=sessions.map(s=>`<div class="schedule-row"><span class="schedule-time">${escapeHTML(s.time)}</span><span class="schedule-color"></span><div class="schedule-details"><strong>${escapeHTML(s.title)}</strong><small>${escapeHTML(s.subject||"Study session")}</small></div><button class="schedule-delete" data-delete-schedule="${s.id}" aria-label="Delete session">×</button></div>`).join("");
  if(!sessions.length) $("scheduleList").innerHTML='<p class="muted">No sessions planned for this day. Add one to build your routine.</p>';
}
function renderStats(){
  const todayTasks=state.tasks.filter(t=>t.date===todayISO());
  const completed=todayTasks.filter(t=>t.done).length;
  $("completedStat").innerHTML=`${completed} <small>/ ${todayTasks.length}</small>`;
  $("taskProgressBar").style.width=`${todayTasks.length?completed/todayTasks.length*100:0}%`;
  $("taskProgressText").textContent=todayTasks.length?`${Math.round(completed/todayTasks.length*100)}% of today's tasks completed`:"Complete your first task today";
  $("focusStat").innerHTML=`${state.focusMinutes} <small>min</small>`;
  let streak=0; let cursor=new Date();
  while(true){const key=`${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,"0")}-${String(cursor.getDate()).padStart(2,"0")}`; if(state.completedDates.includes(key)){streak++;cursor.setDate(cursor.getDate()-1);}else break;}
  $("streakStat").innerHTML=`${streak} <small>days</small>`;
}
let activityChart;
function renderChart(){
  const labels=[],values=[];
  for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;labels.push(d.toLocaleDateString("en-US",{weekday:"short"}));values.push(state.activity[key]||0);}
  if(typeof Chart==="undefined") return;
  if(activityChart) activityChart.destroy();
  activityChart=new Chart($("activityChart"),{type:"bar",data:{labels,datasets:[{label:"Focus minutes",data:values,backgroundColor:"#8b7beb",hoverBackgroundColor:"#6755d8",borderRadius:7,maxBarThickness:32}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{displayColors:false,callbacks:{label:(ctx)=>`${ctx.raw} focus minutes`}}},scales:{x:{grid:{display:false},border:{display:false},ticks:{color:"#9997ad",font:{family:"DM Sans",size:10}}},y:{beginAtZero:true,grid:{color:"rgba(150,145,180,.12)"},border:{display:false},ticks:{color:"#9997ad",font:{family:"DM Sans",size:10},precision:0}}}}});
}
function renderAll(){renderTasks();renderExams();renderSchedule();renderStats();renderChart();saveState();}
function openDialog(id){$(id).showModal();}
function closeDialog(id){$(id).close();}
function resetFormDates(){$("taskDate").value=todayISO();$("examDate").value=dateOffset(7);}
$("todayLabel").textContent=new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"}).toUpperCase();
resetFormDates();
if(state.theme==="dark")document.body.classList.add("dark");
$("taskDialog").addEventListener("close",()=>{});
$("quickAddBtn").addEventListener("click",()=>openDialog("taskDialog"));
$("addTaskSmall").addEventListener("click",()=>openDialog("taskDialog"));
$("addExamBtn").addEventListener("click",()=>openDialog("examDialog"));
$("addScheduleBtn").addEventListener("click",()=>openDialog("scheduleDialog"));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeDialog(b.dataset.close)));
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{currentFilter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));renderTasks();}));
$("taskForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.tasks.unshift({id:uid(),title:$("taskTitle").value.trim(),subject:$("taskSubject").value.trim(),priority:$("taskPriority").value,date:$("taskDate").value,duration:Number($("taskDuration").value),done:false});
  renderAll();e.target.reset();resetFormDates();closeDialog("taskDialog");showToast("Study task added!");
});
$("examForm").addEventListener("submit",e=>{
  e.preventDefault();state.exams.push({id:uid(),title:$("examTitle").value.trim(),date:$("examDate").value,time:$("examTime").value,note:$("examNote").value.trim()});
  renderAll();e.target.reset();$("examDate").value=dateOffset(7);closeDialog("examDialog");showToast("Exam added to your countdown.");
});
$("scheduleForm").addEventListener("submit",e=>{
  e.preventDefault();state.schedule.push({id:uid(),title:$("scheduleTitle").value.trim(),day:$("scheduleDay").value,time:$("scheduleTime").value,subject:$("scheduleSubject").value.trim()});
  selectedDay=$("scheduleDay").value;renderAll();e.target.reset();$("scheduleTime").value="17:00";closeDialog("scheduleDialog");showToast("Study session added!");
});
document.addEventListener("click",e=>{
  const toggle=e.target.closest("[data-toggle-task]");
  if(toggle){const task=state.tasks.find(t=>t.id===toggle.dataset.toggleTask);if(task){task.done=!task.done;if(task.done){const key=todayISO();if(!state.completedDates.includes(key))state.completedDates.push(key);}renderAll();showToast(task.done?"Task completed. Keep going!":"Task marked as to do.");}}
  const delTask=e.target.closest("[data-delete-task]");if(delTask){state.tasks=state.tasks.filter(t=>t.id!==delTask.dataset.deleteTask);renderAll();showToast("Task deleted.");}
  const delExam=e.target.closest("[data-delete-exam]");if(delExam){state.exams=state.exams.filter(x=>x.id!==delExam.dataset.deleteExam);renderAll();showToast("Exam removed.");}
  const delSchedule=e.target.closest("[data-delete-schedule]");if(delSchedule){state.schedule=state.schedule.filter(x=>x.id!==delSchedule.dataset.deleteSchedule);renderAll();showToast("Study session removed.");}
  const day=e.target.closest("[data-select-day]");if(day){selectedDay=day.dataset.selectDay;renderSchedule();}
});
$("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");state.theme=document.body.classList.contains("dark")?"dark":"light";saveState();if(activityChart)renderChart();});
function updateTimerDisplay(){
  const m=Math.floor(timerRemaining/60),s=timerRemaining%60;
  $("timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  const progress=timerTotal?1-timerRemaining/timerTotal:0;
  $("timerRing").style.background=`conic-gradient(var(--purple) ${progress*360}deg,#eeecf8 ${progress*360}deg)`;
}
function stopTimer(){clearInterval(timerInterval);timerInterval=null;timerRunning=false;timerStartedAt=null;$("startTimer").textContent="▶ Start focus";}
function setTimer(minutes){stopTimer();timerTotal=minutes*60;timerRemaining=timerTotal;$("timerMode").textContent=minutes===5?"SHORT BREAK":"FOCUS SESSION";$("timerStatus").textContent="Ready when you are";document.querySelectorAll(".preset").forEach(b=>b.classList.toggle("active",Number(b.dataset.minutes)===minutes));updateTimerDisplay();}
document.querySelectorAll(".preset").forEach(b=>b.addEventListener("click",()=>setTimer(Number(b.dataset.minutes))));
$("startTimer").addEventListener("click",()=>{
  if(timerRunning){stopTimer();$("timerStatus").textContent="Paused — take a breath";return;}
  timerRunning=true;timerStartedAt=Date.now();$("startTimer").textContent="Ⅱ Pause";$("timerStatus").textContent="You're doing well";
  timerInterval=setInterval(()=>{
    timerRemaining=Math.max(0,timerTotal-Math.floor((Date.now()-timerStartedAt)/1000));updateTimerDisplay();
    if(timerRemaining<=0){
      stopTimer();$("timerStatus").textContent="Session complete!";$("timerMode").textContent="WELL DONE";
      const mins=Number(document.querySelector(".preset.active")?.dataset.minutes||25);
      if(mins!==5){state.focusMinutes+=mins;const key=todayISO();state.activity[key]=(state.activity[key]||0)+mins;renderAll();}
      showToast(mins===5?"Break finished. Ready to focus?":`Focus session complete: ${mins} minutes!`);$("startTimer").textContent="▶ Start again";
    }
  },250);
});
$("resetTimer").addEventListener("click",()=>{const mins=Number(document.querySelector(".preset.active")?.dataset.minutes||25);setTimer(mins);$("timerStatus").textContent="Timer reset";});
renderAll();
