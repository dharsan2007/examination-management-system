/* ============================================================
   PATCH — Replace the existing renderDoorNotices() function
   in static/script.js with this one.

   Also add _updateStaffStats() anywhere before renderStaffSeats()
   (it is called there but was never defined — live drag stats
   were silently broken).
   ============================================================ */


/* ── FIX 1: add this function near renderStaffSeats() ───────── */
function _updateStaffStats(hall) {
  const att = hall.attendance || {};
  const p  = Object.values(att).filter(v => v === 'p').length;
  const a  = Object.values(att).filter(v => v === 'a').length;
  const l  = Object.values(att).filter(v => v === 'l').length;
  const od = Object.values(att).filter(v => v === 'od').length;
  const el = document.getElementById('staffLiveStats');
  if (!el) return;
  el.innerHTML = `
    <span class="pill pill-p"><i class="fa-solid fa-check"></i> Present <b>${p}</b></span>
    <span class="pill pill-a"><i class="fa-solid fa-xmark"></i> Absent <b>${a}</b></span>
    <span class="pill pill-l"><i class="fa-solid fa-clock"></i> Late <b>${l}</b></span>
    <span class="pill pill-od"><i class="fa-solid fa-file-alt"></i> On Duty <b>${od}</b></span>
  `;
}


/* ── FIX 2: replace existing renderDoorNotices() ────────────── */
function renderDoorNotices() {
  const cfg   = appData.config || {};
  const halls = appData.halls  || [];

  const examTitle = cfg.title || 'Semester Examination';

  // Date formatted as DD.MM.YYYY (matches paper format in image)
  let dateStr = '';
  if (cfg.date) {
    const d = new Date(cfg.date);
    dateStr = [
      String(d.getDate()).padStart(2, '0'),
      String(d.getMonth() + 1).padStart(2, '0'),
      d.getFullYear()
    ].join('.');
  }
  const sessionStr = cfg.session || 'FN';

  let html = '';

  halls.forEach(hall => {
    const numRows = hall.rows || 6;
    const numCols = hall.cols || 5;
    const seated  = hall.seats || [];
    const groups  = getHallGroups(hall);
    const subject = getSubject(hall) || cfg.subject || '';

    // ── Build column header cells ────────────────────────────
    let colHeaders = '';
    for (let c = 1; c <= numCols; c++) {
      colHeaders += `<th class="dst-sno">S.No.</th><th class="dst-reg">Column ${c}</th>`;
    }

    // ── Build seat table rows ────────────────────────────────
    // Seats are stored row-major (CSS grid order):
    //   array index = r * numCols + c
    // Paper displays S.No. in column-major order:
    //   S.No = c * numRows + r + 1
    let tableRows = '';
    for (let r = 0; r < numRows; r++) {
      let cells = `<td class="dst-rowlabel">Row ${r + 1}</td>`;
      for (let c = 0; c < numCols; c++) {
        const arrayIdx = r * numCols + c;
        const sno      = c * numRows + r + 1;
        const seat     = seated[arrayIdx];
        const reg      = (seat && seat.reg) ? seat.reg : '';
        cells += `<td class="dst-sno">${reg ? sno : ''}</td>
                  <td class="dst-reg">${esc(reg)}</td>`;
      }
      tableRows += `<tr>${cells}</tr>`;
    }

    // ── Class / strength info ────────────────────────────────
    const classLabel    = groups.length > 0
      ? groups.map(g => g.className).join(' / ')
      : '—';
    const totalAllocated = seated.filter(s => s && s.reg).length;
    const vacant         = numRows * numCols - totalAllocated;
    const strengthStr    = `${totalAllocated}/${vacant}/0`;   // Present/Absent/OD placeholder

    // ── Staff list ───────────────────────────────────────────
    const staffList = (appData.staff || [])
      .filter(s => String(s.assignedHallId) === String(hall.id))
      .map(s => esc(s.user || s.name || ''))
      .filter(Boolean);

    html += `
      <div class="out-page door-sa-page">

        <!-- ── College Header ── -->
        <div class="door-sa-header">
          <div class="door-sa-logo">
            <img src="/static/vetias.jpeg" alt="VET IAS"
                 onerror="this.style.display='none'">
          </div>

          <div class="door-sa-title-block">
            <div class="door-sa-college">
              VET Institute of Arts and Science (Co-Education) College
            </div>
            <div class="door-sa-addr">Thindal, Erode &ndash; 638012</div>
            <div class="door-sa-allot">Seating Allotment</div>
            <div class="door-sa-exam">
              Bharathiar University ${esc(examTitle)}
            </div>
          </div>

          <div class="door-sa-hallno">
            Hall No.: <strong>${esc(hall.name)}</strong>
          </div>
        </div>

        <!-- ── Date & Session bar ── -->
        <div class="door-sa-datebar">
          <span>
            <strong>Date &amp; Session: ${esc(dateStr)} ${esc(sessionStr)}</strong>
          </span>
          ${staffList.length > 0
            ? `<span class="door-sa-staff-label">Invigilator: ${staffList.join(', ')}</span>`
            : ''}
        </div>

        <!-- ── Seating Table ── -->
        <div class="door-sa-tablewrap">
          <table class="door-sa-table">
            <thead>
              <tr>
                <th class="dst-rowhead"></th>
                ${colHeaders}
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>

        <!-- ── Class / Subject Info ── -->
        <div class="door-sa-infowrap">
          <table class="door-sa-infotable">
            <thead>
              <tr>
                <th>Class</th>
                <th>Strength</th>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>QP Code</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${esc(classLabel)}</td>
                <td>${strengthStr}</td>
                <td>${esc(subject) || '&mdash;'}</td>
                <td>&mdash;</td>
                <td>&mdash;</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ── Chief Superintendent Signature ── -->
        <div class="door-sa-footer">
          <div class="door-sa-sig">
            <div class="door-sa-sig-scrawl"></div>
            <div class="door-sa-sig-title">CHIEF SUPERINTENDENT</div>
            <div class="door-sa-sig-sub">VET Institute of Arts and Science</div>
            <div class="door-sa-sig-sub">(Co-education) College, Thindal, Erode &ndash; 638 012.</div>
          </div>
        </div>

      </div>`;
  });

  document.getElementById('content').innerHTML = html ||
    '<div class="empty-state"><i class="fa-solid fa-building"></i><h2>No Halls</h2></div>';
}
