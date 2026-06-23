/* Němčina – zkoušení sloves
 * Bez závislostí. Pokrok, vlastní seznam i výběr úrovní se ukládají do localStorage.
 */
(() => {
  "use strict";

  const MASTERY = 3;                    // kolikrát za sebou správně = naučeno
  const LS_VERBS = "nemcina.verbs.v1";
  const LS_PROGRESS = "nemcina.progress.v1";
  const LS_LEVELS = "nemcina.levels.v1";

  const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const OTHER = "Ostatní";

  // ---------- Stav ----------
  let verbs = loadVerbs();
  let progress = loadProgress();        // { [key]: streak }
  let selectedLevels = loadLevels();    // Set úrovní
  let current = null;
  let answered = false;

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const els = {
    tabs: document.querySelectorAll(".tab"),
    viewQuiz: $("#view-quiz"),
    viewManage: $("#view-manage"),

    levelChips: $("#levelChips"),
    levelsAll: $("#levelsAll"),
    levelsNone: $("#levelsNone"),

    progressFill: $("#progressFill"),
    progressText: $("#progressText"),
    quizCard: $("#quizCard"),
    promptLevel: $("#promptLevel"),
    doneCard: $("#doneCard"),
    doneText: $("#doneText"),
    restartBtn: $("#restartBtn"),

    prompt: $("#prompt"),
    form: $("#answerForm"),
    inInf: $("#inInf"),
    inPret: $("#inPret"),
    inPart: $("#inPart"),
    checkBtn: $("#checkBtn"),
    nextBtn: $("#nextBtn"),
    skipBtn: $("#skipBtn"),
    feedback: $("#feedback"),

    importBox: $("#importBox"),
    importReplaceBtn: $("#importReplaceBtn"),
    importAddBtn: $("#importAddBtn"),
    loadCurrentBtn: $("#loadCurrentBtn"),
    importMsg: $("#importMsg"),
    listCount: $("#listCount"),
    exportBtn: $("#exportBtn"),
    exportOut: $("#exportOut"),
    resetDataBtn: $("#resetDataBtn"),
    resetProgressBtn: $("#resetProgressBtn"),
    verbList: $("#verbList"),
  };

  const fields = [
    { key: "inf",  input: els.inInf },
    { key: "pret", input: els.inPret },
    { key: "part", input: els.inPart },
  ];

  // ---------- Pomocné ----------
  function verbKey(v) { return [v.inf, v.pret, v.part].join("|"); }
  function levelOf(v) { return (v.level && String(v.level).trim()) || OTHER; }

  function norm(s) {
    return String(s)
      .toLowerCase().trim()
      .replace(/ß/g, "ss")
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .replace(/\s+/g, " ");
  }
  function matches(answer, expected) {
    const a = norm(answer);
    if (a === "") return false;
    return String(expected).split("/").map(norm).some((v) => v !== "" && v === a);
  }

  function streakOf(v) { return progress[verbKey(v)] || 0; }
  function isMastered(v) { return streakOf(v) >= MASTERY; }

  // distinct úrovně v datasetu, seřazené (A1..C2, pak ostatní)
  function allLevels() {
    const present = new Set(verbs.map(levelOf));
    const ordered = LEVEL_ORDER.filter((l) => present.has(l));
    const extra = [...present].filter((l) => !LEVEL_ORDER.includes(l)).sort();
    return [...ordered, ...extra];
  }
  function levelVerbs(lv) { return verbs.filter((v) => levelOf(v) === lv); }
  function activeVerbs() { return verbs.filter((v) => selectedLevels.has(levelOf(v))); }
  function remaining() { return activeVerbs().filter((v) => !isMastered(v)); }

  // ---------- Ukládání ----------
  function loadVerbs() {
    try {
      const raw = localStorage.getItem(LS_VERBS);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (_) {}
    return (window.NEMCINA_VERBS || []).slice();
  }
  function saveVerbs() { try { localStorage.setItem(LS_VERBS, JSON.stringify(verbs)); } catch (_) {} }
  function clearStoredVerbs() { try { localStorage.removeItem(LS_VERBS); } catch (_) {} }
  function loadProgress() {
    try { const raw = localStorage.getItem(LS_PROGRESS); if (raw) return JSON.parse(raw) || {}; } catch (_) {}
    return {};
  }
  function saveProgress() { try { localStorage.setItem(LS_PROGRESS, JSON.stringify(progress)); } catch (_) {} }
  function loadLevels() {
    try {
      const raw = localStorage.getItem(LS_LEVELS);
      if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr)) return new Set(arr); }
    } catch (_) {}
    return null; // null = výchozí (všechny) – dořeší se po načtení dat
  }
  function saveLevels() {
    try { localStorage.setItem(LS_LEVELS, JSON.stringify([...selectedLevels])); } catch (_) {}
  }
  function ensureLevelsInit() {
    const present = new Set(allLevels());
    if (!selectedLevels) { selectedLevels = present; return; }
    // ponech jen úrovně, které v datasetu existují
    selectedLevels = new Set([...selectedLevels].filter((l) => present.has(l)));
    if (!selectedLevels.size) selectedLevels = present;
  }

  // ---------- Výběr úrovní ----------
  function renderLevelChips() {
    els.levelChips.innerHTML = "";
    for (const lv of allLevels()) {
      const vs = levelVerbs(lv);
      const mastered = vs.filter(isMastered).length;
      const label = document.createElement("label");
      label.className = "level-chip";
      label.dataset.level = lv;
      const checked = selectedLevels.has(lv);
      if (checked) label.classList.add("on");
      label.innerHTML =
        `<input type="checkbox" ${checked ? "checked" : ""} value="${lv}" />` +
        `<span class="lc-dot"></span>` +
        `<span class="lc-code">${lv}</span>` +
        `<span class="lc-count">${mastered}/${vs.length}</span>`;
      els.levelChips.appendChild(label);
    }
  }

  function onLevelToggle(e) {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    if (cb.checked) selectedLevels.add(cb.value);
    else selectedLevels.delete(cb.value);
    saveLevels();
    current = null;
    renderLevelChips();
    showQuestion();
  }
  function setAllLevels(on) {
    selectedLevels = on ? new Set(allLevels()) : new Set();
    saveLevels();
    current = null;
    renderLevelChips();
    showQuestion();
  }

  // ---------- Zkoušení ----------
  function pickNext() {
    const pool = remaining();
    if (!pool.length) return null;
    let candidates = pool;
    if (pool.length > 1 && current) {
      const others = pool.filter((v) => verbKey(v) !== verbKey(current));
      if (others.length) candidates = others;
    }
    const weighted = [];
    for (const v of candidates) {
      const w = (MASTERY - streakOf(v)) + 1;
      for (let i = 0; i < w; i++) weighted.push(v);
    }
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  function renderProgress() {
    const pool = activeVerbs();
    const total = pool.length;
    const mastered = pool.filter(isMastered).length;
    const pct = total ? Math.round((mastered / total) * 100) : 0;
    els.progressFill.style.width = pct + "%";
    if (!selectedLevels.size)
      els.progressText.textContent = "Vyberte aspoň jednu úroveň výše.";
    else if (!total)
      els.progressText.textContent = "Žádná slovesa pro vybrané úrovně.";
    else
      els.progressText.textContent = `Naučeno ${mastered} / ${total} · zbývá ${total - mastered}`;
  }

  function resetFieldStyles() {
    fields.forEach((f) => {
      f.input.parentElement.classList.remove("correct", "wrong");
      const s = els.form.querySelector(`.field-status[data-for="${f.key}"]`);
      if (s) s.textContent = "";
    });
  }

  function showQuestion() {
    answered = false;
    resetFieldStyles();
    els.feedback.hidden = true;
    els.feedback.className = "feedback";
    els.nextBtn.hidden = true;
    els.checkBtn.hidden = false;
    els.skipBtn.hidden = false;

    current = pickNext();

    if (!current) {
      els.quizCard.hidden = true;
      els.doneCard.hidden = false;
      if (!selectedLevels.size) {
        els.doneCard.classList.add("muted-done");
        els.doneText.textContent = "Není vybraná žádná úroveň. Zaškrtněte výše, co chcete procvičovat.";
      } else if (!activeVerbs().length) {
        els.doneCard.classList.add("muted-done");
        els.doneText.textContent = "Pro vybrané úrovně nejsou žádná slovesa.";
      } else {
        els.doneCard.classList.remove("muted-done");
        const n = activeVerbs().length;
        els.doneText.textContent = `Všech ${n} sloves z vybraných úrovní máte naučených (${MASTERY}× správně za sebou).`;
      }
      renderProgress();
      return;
    }

    els.quizCard.hidden = false;
    els.doneCard.hidden = true;

    const lv = levelOf(current);
    els.promptLevel.textContent = lv;
    els.promptLevel.dataset.level = lv;
    els.promptLevel.hidden = false;
    els.quizCard.dataset.level = lv;

    els.prompt.textContent = current.cz;
    fields.forEach((f) => { f.input.value = ""; f.input.disabled = false; });
    renderProgress();
    els.inInf.focus();
  }

  function checkAnswer() {
    if (!current) return;
    let allCorrect = true;
    fields.forEach((f) => {
      const ok = matches(f.input.value, current[f.key]);
      if (!ok) allCorrect = false;
      f.input.disabled = true;
      f.input.parentElement.classList.add(ok ? "correct" : "wrong");
      const s = els.form.querySelector(`.field-status[data-for="${f.key}"]`);
      if (s) s.textContent = ok ? "✓ správně" : `✗ správně: ${current[f.key]}`;
    });

    const key = verbKey(current);
    if (allCorrect) {
      progress[key] = streakOf(current) + 1;
      const s = progress[key];
      els.feedback.className = "feedback ok";
      els.feedback.innerHTML = isMastered(current)
        ? `Výborně – sloveso je naučené! ✅`
        : `Správně! Série ${s}/${MASTERY} (ještě ${MASTERY - s} pro naučení).`;
      els.feedback.hidden = false;
    } else {
      progress[key] = 0;
      els.feedback.hidden = true;
    }
    saveProgress();

    answered = true;
    els.checkBtn.hidden = true;
    els.nextBtn.hidden = false;
    els.skipBtn.hidden = true;
    els.nextBtn.focus();
    renderProgress();
    renderLevelChips();
  }

  // ---------- Správa sloves ----------
  function detectDelimiter(line) {
    if (line.includes("\t")) return "\t";
    if (line.includes(";")) return ";";
    if (line.includes(",")) return ",";
    return "\t";
  }
  function parseImport(text) {
    const out = []; const errors = [];
    text.split(/\r?\n/).forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const delim = detectDelimiter(trimmed);
      const parts = trimmed.split(delim);
      if (idx === 0 && ["infinitiv", "inf"].includes(norm(parts[0]))) return;
      if (parts.length < 4) {
        errors.push(`řádek ${idx + 1}: očekávám aspoň 4 sloupce (infinitiv, préteritum, příčestí, překlad)`);
        return;
      }
      const inf = parts[0].trim(), pret = parts[1].trim(), part = parts[2].trim();
      // 5. sloupec (volitelný) = úroveň; překlad je vše mezi nimi
      let level = "", cz;
      const last = parts[parts.length - 1].trim();
      const isLevel = parts.length >= 5 && /^[A-Za-z]\d$/.test(last);
      if (isLevel) { level = last.toUpperCase(); cz = parts.slice(3, parts.length - 1).join(delim).trim(); }
      else { cz = parts.slice(3).join(delim).trim(); }
      if (!inf || !pret || !part || !cz) { errors.push(`řádek ${idx + 1}: některý sloupec je prázdný`); return; }
      out.push(level ? { inf, pret, part, cz, level } : { inf, pret, part, cz });
    });
    return { verbs: out, errors };
  }

  function importVerbs(replace) {
    const { verbs: parsed, errors } = parseImport(els.importBox.value);
    if (!parsed.length) {
      setImportMsg(errors.length ? errors.join(" · ") : "Nic k načtení – vložte prosím slovesa.", false);
      return;
    }
    if (replace) { verbs = parsed; progress = {}; }
    else {
      const seen = new Set(verbs.map(verbKey)); let added = 0;
      for (const v of parsed) if (!seen.has(verbKey(v))) { verbs.push(v); seen.add(verbKey(v)); added++; }
      if (!added) { setImportMsg("Všechna vložená slovesa už v seznamu byla.", false); renderManage(); return; }
    }
    saveVerbs(); saveProgress();
    selectedLevels = new Set(allLevels()); saveLevels();
    const note = errors.length ? ` (${errors.length} řádků přeskočeno)` : "";
    setImportMsg(`Hotovo – v seznamu je ${verbs.length} sloves.${note}`, true);
    els.importBox.value = ""; current = null;
    renderLevelChips(); renderManage(); renderProgress();
  }
  function setImportMsg(msg, ok) {
    els.importMsg.textContent = msg;
    els.importMsg.className = "import-msg " + (ok ? "ok" : "bad");
  }

  function renderManage() {
    els.listCount.textContent = `(${verbs.length})`;
    els.verbList.innerHTML = "";
    verbs.forEach((v) => {
      const li = document.createElement("li");
      const done = isMastered(v);
      const lv = levelOf(v);
      li.dataset.level = lv;
      const left = document.createElement("div");
      left.innerHTML =
        `<span class="forms">${esc(v.inf)} <span class="sep">–</span> ${esc(v.pret)} ` +
        `<span class="sep">–</span> ${esc(v.part)}</span><br>` +
        `<span class="cz">${esc(v.cz)}</span>`;
      const right = document.createElement("div");
      right.className = "verb-meta";
      right.innerHTML =
        `<span class="level-badge" data-level="${esc(lv)}">${esc(lv)}</span>` +
        `<span class="badge${done ? " done" : ""}">${done ? "naučeno" : streakOf(v) + "/" + MASTERY}</span>`;
      li.appendChild(left); li.appendChild(right);
      els.verbList.appendChild(li);
    });
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function exportToFile() {
    const lines = verbs.map((v) => {
      let s = `  { inf: ${JSON.stringify(v.inf)}, pret: ${JSON.stringify(v.pret)}, ` +
              `part: ${JSON.stringify(v.part)}, cz: ${JSON.stringify(v.cz)}`;
      if (v.level) s += `, level: ${JSON.stringify(v.level)}`;
      return s + " }";
    });
    const content = "window.NEMCINA_VERBS = [\n" + lines.join(",\n") + "\n];\n";
    els.exportOut.textContent = content;
    els.exportOut.hidden = false;
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(content)
        .then(() => setImportMsg("Obsah pro data/verbs.js zkopírován do schránky.", true))
        .catch(() => {});
  }
  function loadCurrentIntoBox() {
    els.importBox.value = verbs
      .map((v) => [v.inf, v.pret, v.part, v.cz].concat(v.level ? [v.level] : []).join("\t"))
      .join("\n");
    setImportMsg("Aktuální seznam vložen do pole (oddělovač tabulátor).", true);
  }
  function resetData() {
    if (!confirm("Obnovit výchozí seznam sloves z data/verbs.js a smazat vlastní úpravy?")) return;
    clearStoredVerbs();
    verbs = (window.NEMCINA_VERBS || []).slice();
    progress = {}; saveProgress();
    selectedLevels = new Set(allLevels()); saveLevels();
    current = null;
    renderLevelChips(); renderManage(); renderProgress();
    setImportMsg("Obnoveno na výchozí seznam.", true);
  }
  function resetProgress() {
    if (!confirm("Vynulovat pokrok u všech sloves?")) return;
    progress = {}; saveProgress(); current = null;
    renderLevelChips(); renderManage(); renderProgress();
    setImportMsg("Pokrok vynulován.", true);
  }

  // ---------- Záložky ----------
  function switchView(view) {
    els.tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.view === view));
    els.viewQuiz.hidden = view !== "quiz";
    els.viewManage.hidden = view !== "manage";
    if (view === "quiz") { if (!current || isMastered(current) || !selectedLevels.has(levelOf(current))) showQuestion(); }
    else renderManage();
  }

  // ---------- Události ----------
  els.tabs.forEach((t) => t.addEventListener("click", () => switchView(t.dataset.view)));
  els.levelChips.addEventListener("change", onLevelToggle);
  els.levelsAll.addEventListener("click", () => setAllLevels(true));
  els.levelsNone.addEventListener("click", () => setAllLevels(false));

  els.form.addEventListener("submit", (e) => { e.preventDefault(); if (answered) showQuestion(); else checkAnswer(); });
  els.nextBtn.addEventListener("click", showQuestion);
  els.skipBtn.addEventListener("click", showQuestion);
  els.restartBtn.addEventListener("click", () => {
    // vynuluj pokrok jen u aktivních úrovní
    for (const v of activeVerbs()) delete progress[verbKey(v)];
    saveProgress(); current = null;
    renderLevelChips(); showQuestion();
  });

  els.importReplaceBtn.addEventListener("click", () => importVerbs(true));
  els.importAddBtn.addEventListener("click", () => importVerbs(false));
  els.loadCurrentBtn.addEventListener("click", loadCurrentIntoBox);
  els.exportBtn.addEventListener("click", exportToFile);
  els.resetDataBtn.addEventListener("click", resetData);
  els.resetProgressBtn.addEventListener("click", resetProgress);

  // ---------- Start ----------
  ensureLevelsInit();
  renderLevelChips();
  showQuestion();
  renderProgress();
})();
