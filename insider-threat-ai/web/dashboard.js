// Global Chart references
let timelineChart = null;
let deptChart = null;
let baselineChart = null;

// Initialize Dashboard on Load
document.addEventListener("DOMContentLoaded", () => {
  loadOverview();
  loadThreats();
  updateSim();
});

// Tab Switching
function switchTab(tab) {
  const viewOverview = document.getElementById("view-overview");
  const viewSim = document.getElementById("view-simulator");
  const btnOverview = document.getElementById("tab-overview-btn");
  const btnSim = document.getElementById("tab-simulator-btn");

  if (tab === "overview") {
    viewOverview.classList.remove("hidden");
    viewSim.classList.add("hidden");
    btnOverview.classList.add("active");
    btnSim.classList.remove("active");
  } else {
    viewOverview.classList.add("hidden");
    viewSim.classList.remove("hidden");
    btnSim.classList.add("active");
    btnOverview.classList.remove("active");
  }
}

// 1. Fetch Overview & Draw Fleet Charts
async function loadOverview() {
  try {
    const res = await fetch("/api/overview");
    const data = await res.json();

    document.getElementById("stat-monitored-users").innerText = data.monitored_users;
    document.getElementById("stat-total-sessions").innerText = Number(data.total_sessions_analyzed).toLocaleString();
    document.getElementById("stat-critical-threats").innerText = data.critical_threats;
    document.getElementById("stat-anomaly-rate").innerText = `${data.fleet_anomaly_rate}%`;

    // Render Timeline Chart
    const ctxTimeline = document.getElementById("timelineChart").getContext("2d");
    if (timelineChart) timelineChart.destroy();

    const dates = data.daily_incident_trend.map(d => d.date.slice(5)); // MM-DD
    const incidents = data.daily_incident_trend.map(d => d.incidents);

    timelineChart = new Chart(ctxTimeline, {
      type: "line",
      data: {
        labels: dates,
        datasets: [{
          label: "Critical / High Threat Alerts",
          data: incidents,
          borderColor: "#EF4444",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#EF4444",
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { color: "#1F2937" }, ticks: { color: "#9CA3AF", font: { family: "monospace" } } },
          y: { grid: { color: "#1F2937" }, ticks: { color: "#9CA3AF", font: { family: "monospace" }, stepSize: 1 }, min: 0 }
        }
      }
    });

    // Render Department Distribution Chart
    const ctxDept = document.getElementById("deptChart").getContext("2d");
    if (deptChart) deptChart.destroy();

    const depts = Object.keys(data.department_distribution);
    const deptVals = Object.values(data.department_distribution);

    deptChart = new Chart(ctxDept, {
      type: "doughnut",
      data: {
        labels: depts.length ? depts : ["None"],
        datasets: [{
          data: deptVals.length ? deptVals : [1],
          backgroundColor: ["#EF4444", "#F97316", "#8B5CF6", "#06B6D4", "#10B981"],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { color: "#9CA3AF", font: { family: "monospace", size: 10 } } }
        }
      }
    });

  } catch (err) {
    console.error("Error loading overview:", err);
  }
}

// 2. Fetch Leaderboard
async function loadThreats() {
  try {
    const res = await fetch("/api/threats");
    const data = await res.json();
    const tbody = document.getElementById("threat-table-body");
    tbody.innerHTML = "";

    data.users.forEach(u => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-[#1E293B]/50 transition-colors";

      let badgeClass = "badge-low";
      if (u.severity === "CRITICAL") badgeClass = "badge-critical";
      else if (u.severity === "HIGH") badgeClass = "badge-high";
      else if (u.severity === "ELEVATED") badgeClass = "badge-elevated";

      tr.innerHTML = `
        <td class="py-3 px-6">
          <div class="font-bold text-white">${u.name}</div>
          <div class="text-[10px] text-gray-500">${u.user_id}</div>
        </td>
        <td class="py-3 px-6">
          <div class="text-gray-200">${u.department}</div>
          <div class="text-[10px] text-gray-500">${u.role}</div>
        </td>
        <td class="py-3 px-6 font-bold ${u.threat_score >= 80 ? 'text-red-400' : (u.threat_score >= 65 ? 'text-orange-400' : 'text-gray-300')}">
          ${u.threat_score}
        </td>
        <td class="py-3 px-6">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}">
            ${u.severity}
          </span>
        </td>
        <td class="py-3 px-6 text-gray-300">
          ${u.threat_vector}
        </td>
        <td class="py-3 px-6 text-gray-400">
          ${u.date}
        </td>
        <td class="py-3 px-6 text-right">
          <button onclick="investigateUser('${u.user_id}')" class="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded border border-red-500/40 text-xs font-mono transition-all">
            Investigate ➔
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Error loading threats:", err);
  }
}

// 3. Investigate User Deep Dive Modal
async function investigateUser(userId) {
  try {
    const res = await fetch(`/api/user/${userId}`);
    if (!res.ok) throw new Error("User details failed");
    const data = await res.json();

    document.getElementById("modal-user-title").innerText = `INVESTIGATION: ${data.user_id} (${data.name})`;
    document.getElementById("modal-user-sub").innerText = `${data.department} • ${data.role} • Incident Date: ${data.peak_incident_date}`;
    
    const risk = data.risk_assessment;
    const scoreEl = document.getElementById("modal-score");
    scoreEl.innerText = risk.threat_score;
    scoreEl.className = `text-3xl font-black font-mono ${risk.threat_score >= 80 ? 'text-red-400' : (risk.threat_score >= 65 ? 'text-orange-400' : 'text-emerald-400')}`;

    const badgeEl = document.getElementById("modal-badge");
    badgeEl.innerText = risk.severity;
    badgeEl.className = `px-2 py-0.5 rounded text-[10px] font-mono font-bold badge-${risk.severity.toLowerCase()}`;

    document.getElementById("modal-vector").innerText = risk.predicted_threat_type;
    document.getElementById("modal-confidence").innerText = `Model Confidence: ${risk.model_confidence}%`;
    document.getElementById("modal-date").innerText = data.peak_incident_date;

    // Render Explanations
    const expContainer = document.getElementById("modal-explanations");
    expContainer.innerHTML = "";
    risk.explainability_breakdown.forEach(exp => {
      const card = document.createElement("div");
      card.className = "p-3 rounded-lg bg-[#111827] border border-gray-800 text-xs font-mono";
      card.innerHTML = `
        <div class="flex justify-between items-center mb-1">
          <span class="font-bold text-red-400">${exp.factor}</span>
          <span class="px-1.5 py-0.2 rounded text-[10px] badge-${exp.severity.toLowerCase()}">+${exp.impact_pts} pts</span>
        </div>
        <p class="text-gray-400 text-[11px]">${exp.detail}</p>
      `;
      expContainer.appendChild(card);
    });

    // Render Timeline
    const tlContainer = document.getElementById("modal-timeline");
    tlContainer.innerHTML = "";
    if (data.activity_timeline.length === 0) {
      tlContainer.innerHTML = `<div class="text-xs text-gray-500 font-mono">No granular events logged for this date.</div>`;
    } else {
      data.activity_timeline.forEach(item => {
        const row = document.createElement("div");
        row.className = "flex items-start space-x-3 p-2 bg-[#111827] rounded border border-gray-800 font-mono text-xs";
        
        let typeColor = "text-cyan-400";
        if (item.type === "PERIPHERAL") typeColor = "text-amber-400";
        if (item.type === "FILESYSTEM" || item.type === "NETWORK") typeColor = "text-red-400";

        row.innerHTML = `
          <span class="text-gray-500 text-[10px]">${item.timestamp.slice(11)}</span>
          <span class="text-[10px] font-bold px-1.5 rounded bg-gray-800 ${typeColor}">${item.type}</span>
          <span class="text-gray-300 text-xs">${item.summary}</span>
        `;
        tlContainer.appendChild(row);
      });
    }

    // Render Baseline Comparison Chart
    const ctxBaseline = document.getElementById("baselineChart").getContext("2d");
    if (baselineChart) baselineChart.destroy();

    const compareMetrics = [
      { key: "after_hours_logons", label: "After-Hrs Logins" },
      { key: "usb_connections", label: "USB Mounts" },
      { key: "cloud_storage_uploads", label: "Cloud Uploads" },
      { key: "bytes_uploaded_mb", label: "Upload MB" },
      { key: "files_deleted", label: "Files Deleted" },
      { key: "sensitive_files_accessed", label: "Sensitive Files" },
    ];

    baselineChart = new Chart(ctxBaseline, {
      type: "bar",
      data: {
        labels: compareMetrics.map(m => m.label),
        datasets: [
          {
            label: "User Value",
            data: compareMetrics.map(m => data.user_metrics[m.key] || 0),
            backgroundColor: "#EF4444",
          },
          {
            label: `${data.department} Avg`,
            data: compareMetrics.map(m => data.department_baseline[m.key] || 0),
            backgroundColor: "#4B5563",
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#9CA3AF", font: { family: "monospace", size: 10 } } }
        },
        scales: {
          x: { grid: { color: "#1F2937" }, ticks: { color: "#9CA3AF", font: { family: "monospace", size: 9 } } },
          y: { grid: { color: "#1F2937" }, ticks: { color: "#9CA3AF", font: { family: "monospace" } } }
        }
      }
    });

    document.getElementById("investigate-modal").classList.remove("hidden");

  } catch (err) {
    console.error("Error inspecting user:", err);
  }
}

function closeModal() {
  document.getElementById("investigate-modal").classList.add("hidden");
}

// 4. Simulator Logic
async function updateSim() {
  const usb = parseFloat(document.getElementById("input-usb").value);
  const upload = parseFloat(document.getElementById("input-upload").value);
  const deleted = parseFloat(document.getElementById("input-deleted").value);
  const sens = parseFloat(document.getElementById("input-sens").value);
  const logon = parseFloat(document.getElementById("input-logon").value);
  const email = parseFloat(document.getElementById("input-email").value);

  document.getElementById("val-usb").innerText = usb;
  document.getElementById("val-upload").innerText = `${upload} MB`;
  document.getElementById("val-deleted").innerText = deleted;
  document.getElementById("val-sens").innerText = sens;
  document.getElementById("val-logon").innerText = logon;
  document.getElementById("val-email").innerText = email;

  const payload = {
    logon_count: logon > 0 ? logon : 1.0,
    after_hours_logons: logon,
    weekend_activity: 0.0,
    usb_connections: usb,
    after_hours_usb: usb,
    http_requests: 60.0 + (upload > 100 ? 50.0 : 0.0),
    cloud_storage_uploads: upload > 50 ? 4.0 : 0.0,
    bytes_uploaded_mb: upload,
    external_emails: email,
    email_attachment_mb: email * 4.0,
    files_read: 10.0,
    files_copied: usb > 0 ? 15.0 : 0.0,
    files_deleted: deleted,
    sensitive_files_accessed: sens,
    peer_deviation_score: (usb * 2) + (upload / 200) + (deleted / 5),
  };

  try {
    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const ass = data.assessment;

    document.getElementById("sim-score").innerText = ass.threat_score;
    document.getElementById("sim-score").className = `text-5xl font-black font-mono ${ass.threat_score >= 80 ? 'text-red-400' : (ass.threat_score >= 65 ? 'text-orange-400' : 'text-emerald-400')}`;

    const simBadge = document.getElementById("sim-badge");
    simBadge.innerText = ass.severity;
    simBadge.className = `px-3 py-1 rounded text-xs font-mono font-bold badge-${ass.severity.toLowerCase()}`;

    document.getElementById("sim-vector").innerText = ass.predicted_threat_type;
    document.getElementById("sim-conf").innerText = `${ass.model_confidence}%`;
    document.getElementById("sim-iso").innerText = ass.isolation_forest_risk;
    document.getElementById("sim-ae").innerText = ass.autoencoder_risk;

    const topExp = ass.explainability_breakdown[0];
    document.getElementById("sim-top-reason").innerText = `${topExp.factor}: ${topExp.detail} (+${topExp.impact_pts} pts)`;

  } catch (err) {
    console.error("Simulation error:", err);
  }
}

function setSimPreset(preset) {
  if (preset === "normal") {
    document.getElementById("input-usb").value = 0;
    document.getElementById("input-upload").value = 5;
    document.getElementById("input-deleted").value = 0;
    document.getElementById("input-sens").value = 1;
    document.getElementById("input-logon").value = 0;
    document.getElementById("input-email").value = 0;
  } else if (preset === "exfil") {
    document.getElementById("input-usb").value = 2;
    document.getElementById("input-upload").value = 850;
    document.getElementById("input-deleted").value = 0;
    document.getElementById("input-sens").value = 12;
    document.getElementById("input-logon").value = 1;
    document.getElementById("input-email").value = 1;
  } else if (preset === "sabotage") {
    document.getElementById("input-usb").value = 0;
    document.getElementById("input-upload").value = 10;
    document.getElementById("input-deleted").value = 45;
    document.getElementById("input-sens").value = 15;
    document.getElementById("input-logon").value = 2;
    document.getElementById("input-email").value = 0;
  } else if (preset === "account_takeover") {
    document.getElementById("input-usb").value = 0;
    document.getElementById("input-upload").value = 400;
    document.getElementById("input-deleted").value = 2;
    document.getElementById("input-sens").value = 9;
    document.getElementById("input-logon").value = 3;
    document.getElementById("input-email").value = 15;
  }
  updateSim();
}
