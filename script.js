console.log("VERSION 7");
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwMNzHmrjzNlJH5xWB_jnvkF-m1fhUIdTg_6aYSF6HeI4KlCsXR2SVae8yopsa81Xi29Q/exec";

let currentTab = "ATM";
let ATM = [];
let CRU = [];
let history = [];
let currentSerial = null;

/* Auto-majuscule pour le champ newSerial */
document.addEventListener("DOMContentLoaded", () => {
  const ns = document.getElementById("newSerial");
  if (ns) {
    ns.addEventListener("input", function () {
      this.value = this.value.toUpperCase();
    });
  }
});

/* ------------------------------
   PICKER + SEARCH
------------------------------ */
function refreshPicker() {
  const picker = document.getElementById("serialPicker");
  const search = document.getElementById("searchInput").value.toUpperCase();
  let list = currentTab === "ATM" ? ATM : CRU;

  picker.innerHTML = list
    .filter(s => s.includes(search))
    .map(s => `<option>${s}</option>`)
    .join("");
}

document.getElementById("searchInput").addEventListener("input", () => {
  refreshPicker();

  const value = document.getElementById("searchInput").value.toUpperCase();
  const exists = ATM.includes(value) || CRU.includes(value);

  document.getElementById("searchInterventionBtn").style.display = exists ? "block" : "none";
});

/* ------------------------------
   CHANGEMENT D’ONGLET
------------------------------ */
function changeTab(tab) {
  currentTab = tab;
  document.getElementById("tabATM").classList.toggle("active", tab === "ATM");
  document.getElementById("tabCRU").classList.toggle("active", tab === "CRU");
  refreshPicker();
}

/* ------------------------------
   CHARGEMENT DES DONNÉES
------------------------------ */
async function loadSheet(sheetName) {
  const res = await fetch(`${SCRIPT_URL}?sheet=${sheetName}`);
  const data = await res.json();
  return data.slice(1).map(r => r[0]).filter(x => x);
}

async function loadHistory() {
  const res = await fetch(`${SCRIPT_URL}?sheet=HISTORY`);
  const data = await res.json();
  return data.slice(1);
}

async function loadAll() {
  ATM = await loadSheet("ATM");
  CRU = await loadSheet("CRU");
  history = await loadHistory();
  refreshPicker();
}

loadAll();

/* ------------------------------
   AJOUT D’UN NUMÉRO DE SÉRIE
------------------------------ */
async function addSerial() {
  const serial = document.getElementById("newSerial").value.toUpperCase();
  if (!serial || serial.length !== 8) {
    alert("Le numéro doit contenir 8 caractères.");
    return;
  }

  const row = [serial, new Date().toISOString(), "Ben"];

  await fetch(`${SCRIPT_URL}?sheet=${currentTab}`, {
    method: "POST",
    body: JSON.stringify(row),
    headers: { "Content-Type": "application/json" }
  });

  document.getElementById("newSerial").value = "";
  await loadAll();
}

/* ------------------------------
   OUVERTURE DU MODAL
------------------------------ */
function openAddModal() {
  document.getElementById("addModal").style.display = "block";
}

function closeAddModal() {
  document.getElementById("addModal").style.display = "none";
}
/* ------------------------------
   MODAL AJOUT DE SÉRIE
------------------------------ */
function openModal() {
  document.getElementById("modalBg").style.display = "flex";
}

function closeModal() {
  document.getElementById("modalBg").style.display = "none";
  document.getElementById("newSerial").value = "";
  document.getElementById("addedBy").value = "";
  document.getElementById("errorMsg").textContent = "";
}

async function saveSerial() {
  const serial = document.getElementById("newSerial").value.toUpperCase();
  const addedBy = document.getElementById("addedBy").value || "Unknown";

  if (serial.length !== 8) {
    document.getElementById("errorMsg").textContent = "Serial must be 8 characters.";
    return;
  }

  const row = [serial, new Date().toISOString(), addedBy];

  await fetch(`${SCRIPT_URL}?sheet=${currentTab}`, {
    method: "POST",
    body: JSON.stringify(row),
    headers: { "Content-Type": "application/json" }
  });

  closeModal();
  await loadAll();
}

/* ------------------------------
   NAVIGATION
------------------------------ */
function goHome() {
  document.getElementById("mainPage").style.display = "block";
  document.getElementById("interventionPage").style.display = "none";
  document.getElementById("historyPage").style.display = "none";
}

function openIntervention() {
  const picker = document.getElementById("serialPicker");
  currentSerial = picker.value;

  if (!currentSerial) {
    alert("Select a serial number first.");
    return;
  }

  document.getElementById("mainPage").style.display = "none";
  document.getElementById("interventionPage").style.display = "block";

  document.getElementById("firmwareWarning").style.display =
    currentTab === "CRU" ? "block" : "none";

  document.getElementById("interventionDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("technicianName").value = "";
  document.getElementById("interventionDesc").value = "";
  document.getElementById("interventionParts").value = "";
}

function openInterventionFromSearch() {
  const value = document.getElementById("searchInput").value.toUpperCase();
  if (!value) return;

  currentSerial = value;

  document.getElementById("mainPage").style.display = "none";
  document.getElementById("interventionPage").style.display = "block";

  document.getElementById("firmwareWarning").style.display =
    CRU.includes(value) ? "block" : "none";

  document.getElementById("interventionDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("technicianName").value = "";
  document.getElementById("interventionDesc").value = "";
  document.getElementById("interventionParts").value = "";
}

/* ------------------------------
   ABOUT PAGE
------------------------------ */
function openAbout() {
  document.getElementById("aboutPage").style.display = "flex";
}

function closeAbout() {
  document.getElementById("aboutPage").style.display = "none";
}

/* ------------------------------
   SAUVEGARDE INTERVENTION
------------------------------ */
async function saveIntervention() {
  const date = document.getElementById("interventionDate").value;
  const tech = document.getElementById("technicianName").value;
  const desc = document.getElementById("interventionDesc").value;
  const parts = document.getElementById("interventionParts").value;

  if (!currentSerial) {
    alert("No serial selected.");
    return;
  }

  const row = [currentSerial, date, tech, desc, parts];

  await fetch(`${SCRIPT_URL}?sheet=HISTORY`, {
    method: "POST",
    body: JSON.stringify(row),
    headers: { "Content-Type": "application/json" }
  });

  goHome();
  await loadAll();
}

/* ------------------------------
   HISTORIQUE + PDF
------------------------------ */
document.getElementById("historySearch").addEventListener("input", () => {
  const value = document.getElementById("historySearch").value.toUpperCase();
  const results = history.filter(r => r[0] === value);

  const container = document.getElementById("historyResults");
  container.innerHTML = results
    .map(r => `
      <div class="history-item">
        <strong>${r[0]}</strong><br>
        Date: ${r[1]}<br>
        Tech: ${r[2]}<br>
        Desc: ${r[3]}<br>
        Parts: ${r[4]}
      </div>
    `)
    .join("");

  document.getElementById("exportPDFBtn").style.display =
    results.length > 0 ? "block" : "none";
});

function exportHistoryPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const value = document.getElementById("historySearch").value.toUpperCase();
  const results = history.filter(r => r[0] === value);

  let y = 10;
  results.forEach(r => {
    doc.text(`Serial: ${r[0]}`, 10, y);
    doc.text(`Date: ${r[1]}`, 10, y + 10);
    doc.text(`Tech: ${r[2]}`, 10, y + 20);
    doc.text(`Desc: ${r[3]}`, 10, y + 30);
    doc.text(`Parts: ${r[4]}`, 10, y + 40);
    y += 60;
  });

  doc.save(`History_${value}.pdf`);
}
/* ------------------------------
   TABS (ATM / CRU / HISTORY)
------------------------------ */
document.getElementById("tabATM").addEventListener("click", () => {
  changeTab("ATM");
  goHome();
});

document.getElementById("tabCRU").addEventListener("click", () => {
  changeTab("CRU");
  goHome();
});

document.getElementById("tabHistory").addEventListener("click", () => {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("interventionPage").style.display = "none";
  document.getElementById("historyPage").style.display = "block";
});
