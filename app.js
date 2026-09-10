(function () {
  "use strict";

  // ---------------------------------------------------------------
  // Traducciones (idénticas a las que usa la app original, es.js)
  // ---------------------------------------------------------------
  const ES = {
    ePromise: "PROMISE-PSMA",
    buttons: {
      close: "Cerrar", installApp: "Instalar como app!", nextSubject: "Siguiente Sujeto",
      export: "Exportar tabla", exportJson: "Exportar JSON", importJson: "Importar JSON",
      reset: "Restablecer", resetAll: "Restablecer todo"
    },
    header: {
      inputs: {
        subject: "ID del sujeto", peDate: "Fecha del PET",
        stageBeforePet: {
          label: "Estadio previo al PET",
          options: { initial: "Estadificación inicial", bcr: "BCR (recurrencia bioquímica)", nmcrpc: "nmCRPC (no metastásico convencional)", mhspc: "mHSPC (metastásico convencional)", mcrpc: "mCRPC (metastásico convencional)" }
        }
      }
    },
    shared: { option: { na: "n/a" } },
    section1: {
      title: "Tumor local",
      svg: {
        bladder: "vejiga urinaria", LSVTitle: "vesícula seminal izquierda", RSVTitle: "vesícula seminal derecha",
        prostateOutside: "Próstata fuera", prostatePathTitle: "Próstata", prostateBorderTitle: "extensión extracapsular",
        bladderTitleRemoved: "próstata removida"
      },
      inputs: {
        prostateRemoved: { label: "La próstata fue removida" },
        score: { label: "Score PRIMARY", options: { ftz: "3 - Zona de transición focal", fpz: "4 - Zona periférica focal", vhi: "5 - Intensidad muy alta" } }
      }
    },
    section2: {
      title: "Metástasis en ganglios linfáticos",
      svg: {
        EIRTitle: "ilíaco externo derecho", EILTitle: "ilíaco externo izquierdo", IILTitle: "ilíaco interno izquierdo", IIRTitle: "ilíaco interno derecho",
        CILTitle: "ilíaco común izquierdo", CIRTitle: "ilíaco común derecho", RPTitle: "ganglio linfático retroperitoneal",
        OBRTitle: "obturador derecho", OBLTitle: "obturador izquierdo", OPTitle: "otros ganglios linfáticos pélvicos", PSTitle: "presacro"
      }
    },
    section3: {
      title: "Score de expresión PSMA",
      inputs: {
        scoreMin: { label: "Expresión baja", options: { zero: "0", blood: "1 Sangre", liverSpleen: "2 Hígado / Bazo", parotid: "3 Parótida" } },
        scoreMax: { label: "Expresión alta", options: { zero: "0", blood: "1 Sangre", liverSpleen: "2 Hígado / Bazo", parotid: "3 Parótida" } }
      },
      note: "sólo para lesiones de ≥1 cm de diámetro"
    },
    section4: { title: "Metástasis óseas", svg: { eskeletonTitle: "esqueleto" }, inputs: { diffuse: { label: "Compromiso difuso de médula ósea" } } },
    section5: {
      title: "Metástasis a distancia",
      svg: { hepTitle: "hígado", adrTitle: "glándula suprarrenal", brainTitle: "cerebro", supradiaTitle: "ganglio linfático supradiafragmático", lungLeftTitle: "pulmón", lungRightTitle: "pulmón", OETitle: "ganglio linfático inguinal u otro extrapelviano" },
      inputs: { otherOrgansInvolved: { label: "Otros órganos involucrados" } }
    },
    footer: { codeLabel: "Código: " },
    toasts: { codeCopied: "Código copiado correctamente", exportSuccessfully: "La exportación fue exitosa", reseted: "Datos restablecidos correctamente", allReseted: "Todos los datos restablecidos correctamente" },
    advanced: { import: { modal: { title: "Importar json", content: "Seleccione un archivo JSON para importar datos", loadData: "Cargar datos", selectJson: "Por favor seleccione un archivo JSON", noJson: "El archivo debe ser un JSON válido.", invalidJson: "El archivo no contiene JSON válido.", fileUploaded: "Archivo cargado exitosamente", uploadJsonLabel: "Archivo JSON", chooseFile: "Elegir archivo", noFileSelected: "Ningún archivo seleccionado" } } }
  };

  function resolveKey(key) {
    return key.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), ES);
  }

  function applyI18n(root) {
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const val = resolveKey(el.getAttribute("data-i18n"));
      if (val !== undefined) el.textContent = val;
    });
  }

  // ---------------------------------------------------------------
  // Reflow responsivo (igual al de la app original)
  // ---------------------------------------------------------------
  function wireResponsiveReflow() {
    const peDate = document.getElementById("pet-date");
    const stageBpet = document.getElementById("stage-bpet");
    const mainSection = document.getElementById("main-section");
    const headerSection = document.getElementById("header-section");
    if (!peDate || !stageBpet || !mainSection || !headerSection) return;
    function moveElements() {
      if (window.innerWidth < 1024) {
        if (!mainSection.contains(peDate)) mainSection.appendChild(peDate);
        if (!mainSection.contains(stageBpet)) mainSection.appendChild(stageBpet);
      } else {
        if (!headerSection.contains(peDate)) headerSection.appendChild(peDate);
        if (!headerSection.contains(stageBpet)) headerSection.appendChild(stageBpet);
      }
    }
    moveElements();
    window.addEventListener("resize", moveElements);
  }

  // ---------------------------------------------------------------
  // Estado de las regiones clicables de los diagramas (data-region)
  // ---------------------------------------------------------------
  const selectedElements = new Set(); // element ids
  let boneState = 0; // 0 none, 1 uni, 2 oligo, 3 diss
  const BONE_LABELS_ES = ["Sin compromiso óseo", "Lesión ósea única", "Oligometastásica (n≤3)", "Diseminada (n>3)"];
  const BONE_OPACITY = [0, 0.55, 0.8, 1];

  function refreshRegionVisual(el) {
    const active = selectedElements.has(el.id);
    el.setAttribute("opacity", active ? "1" : "0");
  }

  function wireClickableRegions() {
    document.querySelectorAll(".clickable[data-region]").forEach((el) => {
      if (el.getAttribute("data-region") === "skeleton") return; // manejado aparte (ciclo de estados)
      el.style.cursor = "pointer";
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (selectedElements.has(el.id)) selectedElements.delete(el.id);
        else selectedElements.add(el.id);
        refreshRegionVisual(el);
        update();
      });
    });

    const skeletonEl = document.querySelector('.clickable[data-region="skeleton"]');
    if (skeletonEl) {
      skeletonEl.style.cursor = "pointer";
      const badge = document.createElement("p");
      badge.id = "bone-state-badge";
      badge.style.cssText = "font-size:.75rem;color:#555;text-align:center;margin:2px 0;";
      badge.textContent = BONE_LABELS_ES[0];
      skeletonEl.closest("section").appendChild(badge);
      skeletonEl.addEventListener("click", (ev) => {
        ev.stopPropagation();
        boneState = (boneState + 1) % 4;
        skeletonEl.setAttribute("opacity", String(BONE_OPACITY[boneState]));
        badge.textContent = BONE_LABELS_ES[boneState];
        update();
      });
    }
  }

  // ---------------------------------------------------------------
  // Notas manuales sobre los diagramas (clic fuera de una región)
  // ---------------------------------------------------------------
  const SVG_NS = "http://www.w3.org/2000/svg";
  const DIAGRAM_IDS = ["prostate-svg-image", "prostate-removed-svg-image", "pelvic-svg-image", "bone-svg-image", "svg1"];

  function addPin(svg, x, y, text) {
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "user-pin");
    g.style.cursor = "pointer";
    const vb = svg.viewBox.baseVal;
    const r = vb && vb.width ? vb.width * 0.012 : 6;
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", r);
    c.setAttribute("fill", "#0891b2"); c.setAttribute("stroke", "#164e63"); c.setAttribute("stroke-width", String(r * 0.2));
    const t = document.createElementNS(SVG_NS, "title");
    t.textContent = text;
    g.appendChild(c); g.appendChild(t);
    g.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (confirm(`¿Eliminar la nota "${text}"?`)) g.remove();
    });
    svg.appendChild(g);
  }

  function wireDiagramAnnotations() {
    DIAGRAM_IDS.forEach((id) => {
      const svg = document.getElementById(id);
      if (!svg) return;
      svg.addEventListener("click", (ev) => {
        if (ev.target.closest(".clickable[data-region]") || ev.target.closest(".user-pin")) return;
        const pt = svg.createSVGPoint();
        pt.x = ev.clientX; pt.y = ev.clientY;
        const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
        const text = prompt("Nota para este punto del esquema:");
        if (text) addPin(svg, loc.x, loc.y, text);
      });
    });
  }

  function clearAnnotations() {
    document.querySelectorAll(".user-pin").forEach((el) => el.remove());
  }

  // ---------------------------------------------------------------
  // Sección 1: próstata removida / score PRIMARY
  // ---------------------------------------------------------------
  function wireProstateRemoved() {
    const chk = document.getElementById("prostate-removed");
    const normalSvg = document.getElementById("prostate-svg-image");
    const removedSvg = document.getElementById("prostate-removed-svg-image");
    const scoreSelect = document.getElementById("score");
    if (!chk) return;
    function refresh() {
      const removed = chk.checked;
      if (normalSvg) normalSvg.style.display = removed ? "none" : "";
      if (removedSvg) removedSvg.style.display = removed ? "" : "none";
      if (scoreSelect) scoreSelect.disabled = removed;
      update();
    }
    chk.addEventListener("change", refresh);
    refresh();
  }

  // ---------------------------------------------------------------
  // Sección 3: slider PSMA (doble rango) + selects para mobile
  // ---------------------------------------------------------------
  function wirePsmaSlider() {
    const minRange = document.getElementById("min-range");
    const maxRange = document.getElementById("max-range");
    const minDD = document.getElementById("min-range-dd");
    const maxDD = document.getElementById("max-range-dd");
    const minValue = document.getElementById("min-value");
    const maxValue = document.getElementById("max-value");
    if (!minRange || !maxRange) return;

    const LABELS = { "-1": "n/a", "0": "0", "1": "1", "2": "2", "3": "3", "4": "n/a" };

    function refresh() {
      let min = parseInt(minRange.value, 10);
      let max = parseInt(maxRange.value, 10);
      if (min > max) { max = min; maxRange.value = String(max); }
      if (minValue) minValue.textContent = LABELS[minRange.value];
      if (maxValue) maxValue.textContent = LABELS[maxRange.value];
      if (minDD) minDD.value = minRange.value;
      if (maxDD) maxDD.value = maxRange.value;
      update();
    }
    minRange.addEventListener("input", refresh);
    maxRange.addEventListener("input", refresh);
    if (minDD) minDD.addEventListener("change", () => { minRange.value = minDD.value; refresh(); });
    if (maxDD) maxDD.addEventListener("change", () => { maxRange.value = maxDD.value; refresh(); });
    refresh();
  }

  // ---------------------------------------------------------------
  // Código PROMISE (formato "mi T.. N.. M..", igual al de la app real)
  // ---------------------------------------------------------------
  const T_ORDER = ["bladder", "LSV", "RSV", "prostateborderpath", "prostateborderpath0", "prostateoutside"];

  function activeRegionsBySection() {
    const groups = { tumor: new Set(), nodes: new Set(), metastases1a: new Set(), metastases1c: new Set() };
    document.querySelectorAll(".clickable[data-region]").forEach((el) => {
      if (!selectedElements.has(el.id)) return;
      const section = el.getAttribute("data-section");
      const region = el.getAttribute("data-region");
      if (groups[section]) groups[section].add(region);
    });
    return groups;
  }

  function buildTCode(tumor) {
    const prostateRemoved = document.getElementById("prostate-removed").checked;
    if (prostateRemoved) return "T0";
    if (tumor.has("bladder")) return "T4";
    if (tumor.has("LSV") || tumor.has("RSV")) return "T3b";
    if (tumor.has("prostateborderpath")) return "T3a";
    const foci = ["prostateborderpath0", "prostateoutside"].filter((k) => tumor.has(k)).length;
    if (foci >= 2) return "T2m";
    if (foci === 1) return "T2u";
    return "T0";
  }

  function buildPromiseCode() {
    const groups = activeRegionsBySection();
    const t = buildTCode(groups.tumor);
    let code = "mi " + t;

    const scoreSelect = document.getElementById("score");
    if (!scoreSelect.disabled && scoreSelect.value && scoreSelect.value !== "-1") {
      code += " PRIMARY" + scoreSelect.value;
    }

    code += groups.nodes.size ? ` N1(${groups.nodes.size}/${[...groups.nodes].join(",")})` : " N0";

    const mParts = [];
    if (groups.metastases1a.size) mParts.push(`M1a(${[...groups.metastases1a].join(",")})`);

    const diffuse = document.getElementById("bone-removed") && document.getElementById("bone-removed").checked;
    if (boneState > 0 || diffuse) {
      const bits = [];
      if (boneState > 0) bits.push(["única", "oligometastásica", "diseminada"][boneState - 1]);
      if (diffuse) bits.push("médula ósea difusa");
      mParts.push(`M1b(${bits.join("+")})`);
    }

    const otherOrgans = document.getElementById("organs") && document.getElementById("organs").checked;
    if (groups.metastases1c.size || otherOrgans) {
      const bits = [...groups.metastases1c];
      if (otherOrgans) bits.push("otros");
      mParts.push(`M1c(${bits.join(",")})`);
    }

    code += mParts.length ? " " + mParts.join(" ") : " M0";

    const minRange = document.getElementById("min-range");
    const maxRange = document.getElementById("max-range");
    if (minRange && maxRange) {
      const min = minRange.value, max = maxRange.value;
      if (min !== "-1" || max !== "4") code += ` PSMA-expr(min${min},max${max})`;
    }
    return code;
  }

  function update() {
    const codeEl = document.getElementById("code");
    const textToCopy = document.getElementById("textToCopy");
    const code = buildPromiseCode();
    if (codeEl) codeEl.textContent = " " + code;
    if (textToCopy) textToCopy.value = code;
  }

  // ---------------------------------------------------------------
  // Botones de pie / menú (copiar código, exportar, restablecer)
  // ---------------------------------------------------------------
  function wireFooterAndMenu() {
    const copyBtn = document.getElementById("btnCopyToClipboard");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const code = document.getElementById("code").textContent.trim();
        navigator.clipboard.writeText(code).then(() => flashToast(ES.toasts.codeCopied));
      });
    }

    document.querySelectorAll(".resetPatient, .resetAll, .new-patient, .btn-export-as-csv, .btn-export-as-json, .btn-import-json").forEach((el) => {
      el.addEventListener("click", (ev) => {
        if (el.tagName === "A") ev.preventDefault();
      });
    });

    document.querySelectorAll(".resetPatient, .new-patient").forEach((el) => el.addEventListener("click", () => resetForm(false)));
    document.querySelectorAll(".resetAll").forEach((el) => el.addEventListener("click", () => resetForm(true)));
    document.querySelectorAll(".btn-export-as-json").forEach((el) => el.addEventListener("click", exportJson));
    document.querySelectorAll(".btn-export-as-csv").forEach((el) => el.addEventListener("click", exportCsv));
    document.querySelectorAll(".btn-import-json").forEach((el) => el.addEventListener("click", openImportModal));

    const modalClose = document.getElementById("modalClose");
    if (modalClose) modalClose.addEventListener("click", closeModal);
    const overlay = document.getElementById("overlay-modal");
    if (overlay) overlay.addEventListener("click", closeModal);

    const jsonFileInput = document.getElementById("jsonFileInput");
    const fileName = document.getElementById("fileName");
    if (jsonFileInput) {
      jsonFileInput.addEventListener("change", () => {
        if (jsonFileInput.files[0] && fileName) fileName.textContent = jsonFileInput.files[0].name;
      });
    }
    const loadJsonBtn = document.getElementById("loadJsonBtn");
    if (loadJsonBtn) loadJsonBtn.addEventListener("click", importJsonFromInput);
  }

  function openImportModal() {
    document.getElementById("modalTitle").textContent = ES.advanced.import.modal.title;
    document.getElementById("modalContent").textContent = ES.advanced.import.modal.content;
    document.getElementById("import-section").style.display = "";
    document.getElementById("modal").classList.add("active");
    document.getElementById("overlay-modal").classList.remove("overlay-hidden");
    document.getElementById("overlay-modal").classList.add("overlay-visible");
  }
  function closeModal() {
    document.getElementById("modal").classList.remove("active");
    document.getElementById("overlay-modal").classList.remove("overlay-visible");
    document.getElementById("overlay-modal").classList.add("overlay-hidden");
    document.getElementById("import-section").style.display = "none";
  }

  function flashToast(msg) {
    let toast = document.getElementById("app-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "app-toast";
      toast.style.cssText = "position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:#18B268;color:#fff;padding:8px 16px;border-radius:8px;font-size:.85rem;z-index:60;box-shadow:0 2px 8px rgba(0,0,0,.2);";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = "block";
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (toast.style.display = "none"), 2000);
  }

  // ---------------------------------------------------------------
  // Serialización del estado (para exportar/importar/restablecer)
  // ---------------------------------------------------------------
  function currentState() {
    return {
      subjectId: val("identifier"), peDate: val("PDEDate"), stageBeforePet: val("StageBPET"),
      prostateRemoved: checked("prostate-removed"), primaryScore: val("score"),
      selectedRegions: [...selectedElements],
      boneState: boneState, diffuseMarrow: checked("bone-removed"), otherOrgansInvolved: checked("organs"),
      scoreMin: val("min-range"), scoreMax: val("max-range"),
      code: document.getElementById("code") ? document.getElementById("code").textContent.trim() : ""
    };
  }
  function val(id) { const el = document.getElementById(id); return el ? el.value : ""; }
  function checked(id) { const el = document.getElementById(id); return el ? el.checked : false; }

  function applyState(state) {
    if (!state) return;
    setVal("identifier", state.subjectId); setVal("PDEDate", state.peDate); setVal("StageBPET", state.stageBeforePet);
    setChecked("prostate-removed", state.prostateRemoved);
    document.getElementById("prostate-removed").dispatchEvent(new Event("change"));
    setVal("score", state.primaryScore);
    selectedElements.clear();
    (state.selectedRegions || []).forEach((id) => selectedElements.add(id));
    document.querySelectorAll(".clickable[data-region]").forEach(refreshRegionVisual);
    boneState = state.boneState || 0;
    const skeletonEl = document.querySelector('.clickable[data-region="skeleton"]');
    if (skeletonEl) skeletonEl.setAttribute("opacity", String(BONE_OPACITY[boneState]));
    const badge = document.getElementById("bone-state-badge");
    if (badge) badge.textContent = BONE_LABELS_ES[boneState];
    setChecked("bone-removed", state.diffuseMarrow);
    setChecked("organs", state.otherOrgansInvolved);
    setVal("min-range", state.scoreMin || "-1"); setVal("max-range", state.scoreMax || "4");
    document.getElementById("min-range").dispatchEvent(new Event("input"));
    update();
  }
  function setVal(id, v) { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; }
  function setChecked(id, v) { const el = document.getElementById(id); if (el) el.checked = !!v; }

  function resetForm(all) {
    selectedElements.clear();
    document.querySelectorAll(".clickable[data-region]").forEach(refreshRegionVisual);
    boneState = 0;
    const skeletonEl = document.querySelector('.clickable[data-region="skeleton"]');
    if (skeletonEl) skeletonEl.setAttribute("opacity", "0");
    const badge = document.getElementById("bone-state-badge");
    if (badge) badge.textContent = BONE_LABELS_ES[0];
    setVal("identifier", ""); setVal("PDEDate", ""); setVal("StageBPET", "-1");
    setChecked("prostate-removed", false);
    document.getElementById("prostate-removed").dispatchEvent(new Event("change"));
    setVal("score", "-1");
    setChecked("bone-removed", false); setChecked("organs", false);
    setVal("min-range", "-1"); setVal("max-range", "4");
    document.getElementById("min-range").dispatchEvent(new Event("input"));
    clearAnnotations();
    if (all) { try { localStorage.removeItem("promisePsmaPatients"); } catch (e) {} }
    update();
    flashToast(all ? ES.toasts.allReseted : ES.toasts.reseted);
  }

  function exportJson() {
    const state = currentState();
    const subject = state.subjectId ? state.subjectId.replace(/[^a-z0-9_-]+/gi, "_") : "paciente";
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    triggerDownload(URL.createObjectURL(blob), `promise_psma_${subject}.json`, true);
    flashToast(ES.toasts.exportSuccessfully);
  }

  function exportCsv() {
    const state = currentState();
    const headers = ["Fecha", "Identificador del paciente", "Estadio previo al PET", "Código PROMISE"];
    const row = [state.peDate, state.subjectId, state.stageBeforePet, state.code];
    const csv = headers.join(";") + "\n" + row.map((v) => `"${(v || "").toString().replace(/"/g, '""')}"`).join(";");
    const subject = state.subjectId ? state.subjectId.replace(/[^a-z0-9_-]+/gi, "_") : "paciente";
    const blob = new Blob(["﻿" + csv], { type: "text/csv" });
    triggerDownload(URL.createObjectURL(blob), `promise_psma_${subject}.csv`, true);
    flashToast(ES.toasts.exportSuccessfully);
  }

  function importJsonFromInput() {
    const input = document.getElementById("jsonFileInput");
    const file = input.files[0];
    if (!file) { alert(ES.advanced.import.modal.selectJson); return; }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        applyState(data);
        closeModal();
        flashToast(ES.advanced.import.modal.fileUploaded);
      } catch (e) {
        alert(ES.advanced.import.modal.invalidJson);
      }
    };
    reader.readAsText(file);
  }

  function triggerDownload(url, filename, revoke) {
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    if (revoke) setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  // ---------------------------------------------------------------
  // Exportar el esquema PROMISE combinado como JPG
  // ---------------------------------------------------------------
  function svgToCanvas(svg, targetW, targetH) {
    return new Promise((resolve) => {
      const clone = svg.cloneNode(true);
      clone.setAttribute("xmlns", SVG_NS);
      clone.style.display = "";
      const svgData = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
      const canvas = document.createElement("canvas");
      canvas.width = targetW; canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, targetW, targetH); resolve(canvas); };
      img.onerror = () => resolve(canvas);
      img.src = svgData;
    });
  }

  async function exportScheme() {
    const removed = document.getElementById("prostate-removed").checked;
    const tumorSvg = document.getElementById(removed ? "prostate-removed-svg-image" : "prostate-svg-image");
    const targets = [
      { svg: tumorSvg, label: "Tumor local" },
      { svg: document.getElementById("pelvic-svg-image"), label: "Ganglios linfáticos" },
      { svg: document.getElementById("bone-svg-image"), label: "Metástasis óseas" },
      { svg: document.getElementById("svg1"), label: "Metástasis a distancia" }
    ].filter((t) => t.svg);

    const cellW = 520, cellH = 520, cols = 2;
    const rows = Math.ceil(targets.length / cols);
    const canvas = document.createElement("canvas");
    canvas.width = cellW * cols; canvas.height = cellH * rows + 40;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#222222"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Esquema PROMISE — " + (val("identifier") || "paciente"), canvas.width / 2, 28);

    for (let i = 0; i < targets.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const sub = await svgToCanvas(targets[i].svg, cellW - 20, cellH - 40);
      ctx.drawImage(sub, col * cellW + 10, row * cellH + 40 + 10);
      ctx.fillStyle = "#444444"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(targets[i].label, col * cellW + cellW / 2, row * cellH + 40 + cellH - 12);
    }

    canvas.toBlob((blob) => {
      const subject = val("identifier") ? val("identifier").replace(/[^a-z0-9_-]+/gi, "_") : "paciente";
      triggerDownload(URL.createObjectURL(blob), `esquema_PROMISE_${subject}.jpg`, true);
    }, "image/jpeg", 0.95);
  }

  function wireSchemeToolbar() {
    const btnClear = document.getElementById("btnClearAnnotations");
    if (btnClear) btnClear.addEventListener("click", clearAnnotations);
    const btnExport = document.getElementById("btnExportScheme");
    if (btnExport) btnExport.addEventListener("click", exportScheme);
  }

  // ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    applyI18n(document);
    wireResponsiveReflow();
    wireClickableRegions();
    wireDiagramAnnotations();
    wireProstateRemoved();
    wirePsmaSlider();
    wireFooterAndMenu();
    wireSchemeToolbar();
    document.getElementById("identifier").addEventListener("input", update);
    document.getElementById("PDEDate").addEventListener("input", update);
    document.getElementById("StageBPET").addEventListener("change", update);
    document.getElementById("bone-removed").addEventListener("change", update);
    document.getElementById("organs").addEventListener("change", update);
    update();
  });
})();
