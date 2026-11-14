import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = "http://127.0.0.1:5000/api";
const statuses = ["All", "Open", "In Progress", "Resolved"];
const priorities = ["All priorities", "High", "Medium", "Low"];

function Icon({ name }) {
  const icons = { grid:"▦", inbox:"▤", plus:"＋", chart:"▥", search:"⌕", bell:"♧", settings:"⚙", clock:"◷", check:"✓", alert:"!", menu:"☰", arrow:"↗" };
  return <span className="icon" aria-hidden="true">{icons[name] || "•"}</span>;
}
function dateLabel(value) {
  if (!value) return "Just now";
  const d = new Date(value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z"));
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString([], { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" });
}
function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title:"", description:"", priority:"Medium" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All priorities");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await fetch(`${API}/requests`);
      if (!response.ok) throw new Error("Could not load requests. Check that the Flask backend is running.");
      setItems(await response.json());
      setError("");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const counts = useMemo(() => ({
    total: items.length,
    open: items.filter(x => x.status === "Open").length,
    pending: items.filter(x => x.status === "In Progress").length,
    resolved: items.filter(x => x.status === "Resolved").length
  }), [items]);

  const filtered = useMemo(() => items.filter(x => {
    const text = `${x.title} ${x.description}`.toLowerCase();
    return text.includes(query.toLowerCase()) &&
      (statusFilter === "All" || x.status === statusFilter) &&
      (priorityFilter === "All priorities" || x.priority === priorityFilter);
  }), [items, query, statusFilter, priorityFilter]);

  async function submit(e) {
    e.preventDefault(); setMessage(""); setError("");
    try {
      const response = await fetch(`${API}/requests`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create request.");
      setForm({ title:"", description:"", priority:"Medium" });
      setShowForm(false); setMessage("Your request was created successfully."); await load();
    } catch (e) { setError(e.message); }
  }
  async function update(id, status) {
    try {
      const response = await fetch(`${API}/requests/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({status}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update status.");
      setMessage(`Request #${id} updated to ${status}.`); await load();
    } catch (e) { setError(e.message); }
  }

  const highCount = items.filter(x => x.priority === "High").length;
  const mediumCount = items.filter(x => x.priority === "Medium").length;
  const lowCount = items.filter(x => x.priority === "Low").length;
  const maxPriority = Math.max(highCount, mediumCount, lowCount, 1);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><div><strong>ServiceDesk</strong><small>WORKSPACE</small></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        <a className="nav-link active" href="#overview"><Icon name="grid"/> Overview</a>
        <a className="nav-link" href="#requests"><Icon name="inbox"/> All requests <span className="nav-count">{items.length}</span></a>
        <a className="nav-link" href="#analytics"><Icon name="chart"/> Analytics</a>
      </nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon">?</div><strong>Need a hand?</strong><p>Keep your team's requests moving.</p></div><div className="profile"><div className="avatar">PT</div><div><strong>Service Admin</strong><small>Workspace member</small></div><span className="profile-dots">•••</span></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Overview</b></div><div className="top-actions"><span className="today-label">{new Date().toLocaleDateString([], {weekday:"short", month:"short", day:"numeric"})}</span><button className="icon-button" aria-label="Notifications"><Icon name="bell"/></button><div className="avatar small-avatar">PT</div></div></header>
      <div className="content">
        <section className="page-heading" id="overview"><div><div className="eyebrow">OPERATIONS / SERVICE DESK</div><h1>Good day, team <span>✦</span></h1><p>Here's what's happening with your service requests today.</p></div><button className="primary-button" onClick={() => {setShowForm(v=>!v);setMessage("");}}><Icon name="plus"/> New request</button></section>

        {error && <div className="alert error-alert" role="alert">{error}</div>}
        {message && <div className="alert success-alert" role="status">{message}</div>}

        <section className="stats-grid" aria-label="Request summary">
          <Stat title="Total requests" value={counts.total} note="All requests received" icon="inbox" tone="blue"/>
          <Stat title="Open requests" value={counts.open} note="Waiting to be assigned" icon="clock" tone="orange"/>
          <Stat title="Pending requests" value={counts.pending} note="Currently in progress" icon="chart" tone="purple"/>
          <Stat title="Resolved requests" value={counts.resolved} note="Successfully completed" icon="check" tone="green"/>
        </section>

        {showForm && <section className="form-panel">
          <div className="panel-heading"><div><div className="eyebrow">CREATE TICKET</div><h2>New service request</h2></div><button className="close-button" onClick={()=>setShowForm(false)} aria-label="Close form">×</button></div>
          <form onSubmit={submit} className="request-form">
            <label>Request title<input required minLength="3" maxLength="120" placeholder="e.g. Unable to access company email" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label>
            <label className="wide-field">Description<textarea required minLength="3" maxLength="1000" rows="3" placeholder="Describe the issue and any steps you've already tried..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
            <label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option></select></label>
            <div className="form-actions"><button className="primary-button" type="submit">Create request <span>→</span></button><button type="button" className="text-button" onClick={()=>setShowForm(false)}>Cancel</button></div>
          </form>
        </section>}

        <section className="analytics-grid" id="analytics">
          <div className="panel status-panel"><div className="panel-heading"><div><h2>Request status</h2><p>Current workload breakdown</p></div><span className="subtle-pill">Live summary</span></div>
            <div className="status-visual"><div className="donut" style={{"--open":`${counts.total ? counts.open/counts.total*100 : 0}%`,"--pending":`${counts.total ? counts.pending/counts.total*100 : 0}%`,"--resolved":`${counts.total ? counts.resolved/counts.total*100 : 0}%`}}><div><strong>{counts.total}</strong><span>Total</span></div></div>
              <div className="legend"><Legend color="blue" label="Open" value={counts.open}/><Legend color="purple" label="In progress" value={counts.pending}/><Legend color="green" label="Resolved" value={counts.resolved}/></div></div>
          </div>
          <div className="panel priority-panel"><div className="panel-heading"><div><h2>Requests by priority</h2><p>Understand what needs attention</p></div></div>
            <PriorityBar label="High" value={highCount} max={maxPriority} tone="red"/><PriorityBar label="Medium" value={mediumCount} max={maxPriority} tone="yellow"/><PriorityBar label="Low" value={lowCount} max={maxPriority} tone="green"/>
            <div className="priority-foot">Prioritise high-impact issues first.</div>
          </div>
        </section>

        <section className="panel requests-panel" id="requests">
          <div className="requests-heading"><div><h2>Service requests</h2><p>Review, search and manage incoming work.</p></div><button className="outline-button" onClick={load}>↻ Refresh</button></div>
          <div className="toolbar"><div className="search-box"><Icon name="search"/><input aria-label="Search requests" placeholder="Search by title or description..." value={query} onChange={e=>setQuery(e.target.value)}/></div><select aria-label="Filter by status" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s === "All" ? "All statuses" : s}</option>)}</select><select aria-label="Filter by priority" value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}>{priorities.map(p=><option key={p}>{p}</option>)}</select></div>
          <div className="table-wrap"><table><thead><tr><th>REQUEST</th><th>PRIORITY</th><th>STATUS</th><th>CREATED</th><th>UPDATE STATUS</th></tr></thead><tbody>
            {loading ? <tr><td colSpan="5" className="empty-state">Loading requests...</td></tr> : filtered.length === 0 ? <tr><td colSpan="5" className="empty-state"><div className="empty-icon">⌕</div><strong>No requests found</strong><span>Try changing your search or filters, or create a new request.</span></td></tr> : filtered.map(x=><tr key={x.id}><td><div className="request-title">#{x.id} · {x.title}</div><div className="request-description">{x.description}</div></td><td><PriorityBadge value={x.priority}/></td><td><StatusBadge value={x.status}/></td><td className="date-cell">{dateLabel(x.created_at)}</td><td><select className="status-select" aria-label={`Update status for ${x.title}`} value={x.status} onChange={e=>update(x.id,e.target.value)}><option>Open</option><option>In Progress</option><option>Resolved</option></select></td></tr>)}
          </tbody></table></div>
          <div className="table-footer"><span>Showing <b>{filtered.length}</b> of <b>{items.length}</b> requests</span><span>ServiceDesk · Internal workspace</span></div>
        </section>
        <footer>ServiceDesk <span>•</span> Internal service operations</footer>
      </div>
    </main>
  </div>;
}
function Stat({title,value,note,icon,tone}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon name={icon}/></div><div className="stat-title">{title}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></div>; }
function Legend({color,label,value}) { return <div className="legend-item"><span className={`legend-dot ${color}`}></span><span>{label}</span><b>{value}</b></div>; }
function PriorityBar({label,value,max,tone}) { return <div className="priority-row"><div className="priority-label"><span>{label}</span><b>{value}</b></div><div className="bar-track"><div className={`bar-fill ${tone}`} style={{width:`${value/max*100}%`}}/></div></div>; }
function PriorityBadge({value}) { return <span className={`badge priority-${value.toLowerCase()}`}><i/> {value}</span>; }
function StatusBadge({value}) { return <span className={`badge status-${value==="In Progress"?"progress":value.toLowerCase()}`}><i/> {value}</span>; }

createRoot(document.getElementById("root")).render(<App/>);
