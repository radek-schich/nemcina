/* Němčina – zkoušení sloves
 * Bez závislostí. Pokrok i vlastní seznam se ukládají do localStorage.
 */
(() => {
  "use strict";

  const MASTERY = 3;                    // kolikrát za sebou správně = naučeno
  const LS_VERBS = "nemcina.verbs.v1";
  const LS_PROGRESS = "nemcina.progress.v1";

  // ---------- Stav ----------
  let verbs = loadVerbs();
  let progress = loadProgress();        // { [key]: streak }
  let current = null;
  let answered = false;                 // true = otázka už zkontrolovaná

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const els = {
    tabs: document.querySelectorAll(".tab"),
    viewQuiz: $("#view-quiz"),
    viewManage: $("#view-manage"),

    progressFill: $("#progressFill"),
    progressText: $("#progressText"),
    quizCard: $("#quizCard"),
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

  // sjednocení pro porovnání: malá písmena, přehlásky → ae/oe/ue, ß → ss
  function norm(s) {
    return String(s)
      .toLowerCase()
      .trim()
      .replace(/ß/g, "ss")
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/\s+/g, " ");
  }

  // přijatelné varianty v jednom poli oddělené "/"
  function matches(answer, expected) {
    const a = norm(answer);
    if (a === "") return false;
    return String(expected)
      .split("/")
      .map(norm)
      .some((v) => v !== "" && v === a);
  }

  function streakOf(v) { return progress[verbKey(v)] || 0; }
  function isMastered(v) { return streakOf(v) >= MASTERY; }
  function remaining() { return verbs.filter((v) => !isMastered(v)); }

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
  function saveVerbs() {
    try { localStorage.setItem(LS_VERBS, JSON.stringify(verbs)); } catch (_) {}
  }
  function clearStoredVerbs() {
    try { localStorage.removeItem(LS_VERBS); } catch (_) {}
  }
  function loadProgress() {
    try {
      const raw = localStorage.getItem(LS_PROGRESS);
      if (raw) return JSON.parse(raw) || {};
    } catch (_) {}
    return {};
  }
  function saveProgress() {
    try { localStorage.setItem(LS_PROGRESS, JSON.stringify(progress)); } catch (_) {}
  }

  // ---------- Zkoušení ----------
  function pickNext() {
    const pool = remaining();
    if (!pool.length) return null;
    // preferuj slovesa s nižším streakem; nevybírej hned to samé
    let candidates = pool;
    if (pool.length > 1 && current) {
      const others = pool.filter((v) => verbKey(v) !== verbKey(current));
      if (others.length) candidates = others;
    }
    const weighted = [];
    for (const v of candidates) {
      const w = (MASTERY - streakOf(v)) + 1; // méně umím → větší šance
      for (let i = 0; i < w; i++) weighted.push(v);
    }
    return weighted[Math.floor(Math.random() * weighted.length)];
  }

  function renderProgress() {
    const total = verbs.length;
    const mastered = verbs.filter(isMastered).length;
    const pct = total ? Math.round((mastered / total) * 100) : 0;
    els.progressFill.style.width = pct + "%";
    els.progressText.textContent = total
      ? `Naučeno ${mastered} / ${total} · zbývá ${total - mastered}`
      : "Žádná slovesa – přidejte je v záložce „Spravovat slovesa“.";
  }

  function resetFieldStyles() {
    fields.forEach((f) => {
      f.input.parentElement.classList.remove("correct", "wrong");
      const status = els.form.querySelector(`.field-status[data-for="${f.key}"]`);
      if (status) status.textContent = "";
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
      els.doneText.textContent = verbs.length
        ? `Všech ${verbs.length} sloves máte naučených (${MASTERY}× správně za sebou).`
        : "Nemáte žádná slovesa. Přidejte si je v záložce „Spravovat slovesa“.";
      renderProgress();
      return;
    }

    els.quizCard.hidden = false;
    els.doneCard.hidden = true;
    els.prompt.textContent = current.cz;

    fields.forEach((f) => {
      f.input.value = "";
      f.input.disabled = false;
    });
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
      const status = els.form.querySelector(`.field-status[data-for="${f.key}"]`);
      if (status) status.textContent = ok ? "✓ správně" : `✗ správně: ${current[f.key]}`;
    });

    const key = verbKey(current);
    if (allCorrect) {
      progress[key] = streakOf(current) + 1;
      const s = progress[key];
      els.feedback.className = "feedback ok";
      els.feedback.innerHTML = isMastered(current)
        ? `Výborně – sloveso je naučené! ✅`
        : `Správně! Série ${s}/${MASTERY} (ještě ${MASTERY - s} pro naučení).`;
    } else {
      progress[key] = 0;
      els.feedback.className = "feedback bad";
      els.feedback.innerHTML =
        `Není to úplně ono. Správně je:` +
        `<span class="sol"><b>${current.inf}</b> – <b>${current.pret}</b> – <b>${current.part}</b></span>`;
    }
    els.feedback.hidden = false;
    saveProgress();

    answered = true;
    els.checkBtn.hidden = true;
    els.nextBtn.hidden = false;
    els.skipBtn.hidden = true;
    els.nextBtn.focus();
    renderProgress();
  }

  // ---------- Správa sloves ----------
  function detectDelimiter(line) {
    if (line.includes("\t")) return "\t";
    if (line.includes(";")) return ";";
    if (line.includes(",")) return ",";
    return "\t";
  }

  function parseImport(text) {
    const out = [];
    const errors = [];
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const delim = detectDelimiter(trimmed);
      const parts = trimmed.split(delim);
      // přeskoč hlavičku
      if (idx === 0 && ["infinitiv", "inf"].includes(norm(parts[0]))) return;
      if (parts.length < 4) {
        errors.push(`řádek ${idx + 1}: očekávám 4 sloupce (infinitiv, préteritum, příčestí, překlad)`);
        return;
      }
      const inf = parts[0].trim();
      const pret = parts[1].trim();
      const part = parts[2].trim();
      const cz = parts.slice(3).join(delim).trim(); // zbytek = překlad (může obsahovat oddělovač)
      if (!inf || !pret || !part || !cz) {
        errors.push(`řádek ${idx + 1}: některý sloupec je prázdný`);
        return;
      }
      out.push({ inf, pret, part, cz });
    });
    return { verbs: out, errors };
  }

  function importVerbs(replace) {
    const { verbs: parsed, errors } = parseImport(els.importBox.value);
    if (!parsed.length) {
      setImportMsg(errors.length ? errors.join(" · ") : "Nic k načtení – vložte prosím slovesa.", false);
      return;
    }
    if (replace) {
      verbs = parsed;
      progress = {};            // nový seznam → čistý pokrok
    } else {
      const seen = new Set(verbs.map(verbKey));
      let added = 0;
      for (const v of parsed) {
        if (!seen.has(verbKey(v))) { verbs.push(v); seen.add(verbKey(v)); added++; }
      }
      if (!added) { setImportMsg("Všechna vložená slovesa už v seznamu byla.", false); renderManage(); return; }
    }
    saveVerbs();
    saveProgress();
    const note = errors.length ? ` (${errors.length} řádků přeskočeno)` : "";
    setImportMsg(`Hotovo – v seznamu je ${verbs.length} sloves.${note}`, true);
    els.importBox.value = "";
    current = null;
    renderManage();
    renderProgress();
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
      const left = document.createElement("div");
      left.innerHTML =
        `<span class="forms">${esc(v.inf)} <span class="sep">–</span> ${esc(v.pret)} ` +
        `<span class="sep">–</span> ${esc(v.part)}</span><br>` +
        `<span class="cz">${esc(v.cz)}</span>`;
      const badge = document.createElement("span");
      badge.className = "badge" + (done ? " done" : "");
      badge.textContent = done ? "naučeno" : `${streakOf(v)}/${MASTERY}`;
      li.appendChild(left);
      li.appendChild(badge);
      els.verbList.appendChild(li);
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function exportToFile() {
    const lines = verbs.map((v) =>
      `  { inf: ${JSON.stringify(v.inf)}, pret: ${JSON.stringify(v.pret)}, ` +
      `part: ${JSON.stringify(v.part)}, cz: ${JSON.stringify(v.cz)} }`);
    const content =
      "window.NEMCINA_VERBS = [\n" + lines.join(",\n") + "\n];\n";
    els.exportOut.textContent = content;
    els.exportOut.hidden = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(content)
        .then(() => setImportMsg("Obsah pro data/verbs.js zkopírován do schránky.", true))
        .catch(() => {});
    }
  }

  function loadCurrentIntoBox() {
    els.importBox.value = verbs
      .map((v) => [v.inf, v.pret, v.part, v.cz].join("\t"))
      .join("\n");
    setImportMsg("Aktuální seznam vložen do pole (oddělovač tabulátor).", true);
  }

  function resetData() {
    if (!confirm("Obnovit výchozí seznam sloves z data/verbs.js a smazat vlastní úpravy?")) return;
    clearStoredVerbs();
    verbs = (window.NEMCINA_VERBS || []).slice();
    progress = {};
    saveProgress();
    current = null;
    renderManage();
    renderProgress();
    setImportMsg("Obnoveno na výchozí seznam.", true);
  }

  function resetProgress() {
    if (!confirm("Vynulovat pokrok u všech sloves?")) return;
    progress = {};
    saveProgress();
    current = null;
    renderManage();
    renderProgress();
    setImportMsg("Pokrok vynulován.", true);
  }

  // ---------- Záložky ----------
  function switchView(view) {
    els.tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.view === view));
    els.viewQuiz.hidden = view !== "quiz";
    els.viewManage.hidden = view !== "manage";
    if (view === "quiz") {
      if (!current || isMastered(current)) showQuestion();
    } else {
      renderManage();
    }
  }

  // ---------- Události ----------
  els.tabs.forEach((t) => t.addEventListener("click", () => switchView(t.dataset.view)));

  els.form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (answered) showQuestion();
    else checkAnswer();
  });
  els.nextBtn.addEventListener("click", showQuestion);
  els.skipBtn.addEventListener("click", showQuestion);
  els.restartBtn.addEventListener("click", () => {
    progress = {};
    saveProgress();
    current = null;
    showQuestion();
  });

  els.importReplaceBtn.addEventListener("click", () => importVerbs(true));
  els.importAddBtn.addEventListener("click", () => importVerbs(false));
  els.loadCurrentBtn.addEventListener("click", loadCurrentIntoBox);
  els.exportBtn.addEventListener("click", exportToFile);
  els.resetDataBtn.addEventListener("click", resetData);
  els.resetProgressBtn.addEventListener("click", resetProgress);

  // ---------- Start ----------
  showQuestion();
  renderProgress();
})();
