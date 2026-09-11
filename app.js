(function () {
  "use strict";

  // ---------------------------------------------------------------
  // Traducciones (idénticas a las que usa la app original, es.js)
  // ---------------------------------------------------------------
  const ES = {
    ePromise: "PROMISE-PSMA",
    buttons: {
      close: "Cerrar", installApp: "Instalar como app!",
      reset: "Restablecer", resetAll: "Restablecer todo"
    },
    header: {
      inputs: {
        subject: "Paciente / ID", peDate: "Fecha del PET",
        stageBeforePet: {
          label: "Motivo del estudio",
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
        scoreMin: { label: "Expresión más baja" },
        scoreMax: { label: "Expresión más alta" }
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
    toasts: { codeCopied: "Código copiado correctamente", reseted: "Datos restablecidos correctamente", allReseted: "Todos los datos restablecidos correctamente" }
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
  const selectedElements = new Set(); // element ids (secciones 2 y 5: ganglios / metástasis a distancia)

  function refreshRegionVisual(el) {
    const active = selectedElements.has(el.id);
    el.setAttribute("opacity", active ? "1" : "0");
  }

  // Secciones 2 y 5: clic alterna la región completa (sin cambios).
  function wireClickableRegions() {
    document.querySelectorAll(".clickable[data-region]").forEach((el) => {
      const section = el.getAttribute("data-section");
      if (section === "tumor" || section === "metastases1b") return; // manejadas con marcas puntuales
      el.style.cursor = "pointer";
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (selectedElements.has(el.id)) selectedElements.delete(el.id);
        else selectedElements.add(el.id);
        refreshRegionVisual(el);
        update();
      });
    });
  }

  // Secciones 1 (tumor local) y 4 (metástasis óseas): clic puntual = un
  // círculo pequeño exactamente donde se hizo clic, no toda la región.
  function svgPointFromEvent(svg, ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function createLesionMarker(svg, region, section, x, y) {
    const vb = svg.viewBox.baseVal;
    const r = vb && vb.width ? vb.width * 0.035 : 4;
    const marker = document.createElementNS(SVG_NS, "circle");
    marker.setAttribute("class", "lesion-marker");
    marker.setAttribute("data-region", region);
    marker.setAttribute("data-section", section);
    marker.setAttribute("cx", x); marker.setAttribute("cy", y); marker.setAttribute("r", r);
    marker.setAttribute("fill", "#e11d1d");
    marker.setAttribute("stroke", "#7f1d1d");
    marker.setAttribute("stroke-width", String(Math.max(r * 0.22, 0.3)));
    marker.style.cursor = "pointer";
    marker.addEventListener("click", (ev) => {
      ev.stopPropagation();
      marker.remove();
      update();
    });
    svg.appendChild(marker);
    return marker;
  }

  function wirePointMarkerRegions() {
    document.querySelectorAll(".clickable[data-region]").forEach((el) => {
      const section = el.getAttribute("data-section");
      if (section !== "tumor" && section !== "metastases1b") return;
      el.style.cursor = "pointer";
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const svg = el.closest("svg");
        if (!svg) return;
        const loc = svgPointFromEvent(svg, ev);
        createLesionMarker(svg, el.getAttribute("data-region"), section, loc.x, loc.y);
        update();
      });
    });
  }

  function tumorMarkerRegions() {
    return [...document.querySelectorAll('.lesion-marker[data-section="tumor"]')].map((m) => m.getAttribute("data-region"));
  }
  function boneMarkerCount() {
    return document.querySelectorAll('.lesion-marker[data-section="metastases1b"]').length;
  }
  function clearLesionMarkers() {
    document.querySelectorAll(".lesion-marker").forEach((el) => el.remove());
  }
  function serializeLesionMarkers() {
    return [...document.querySelectorAll(".lesion-marker")].map((m) => ({
      svgId: m.closest("svg").id, region: m.getAttribute("data-region"), section: m.getAttribute("data-section"),
      x: parseFloat(m.getAttribute("cx")), y: parseFloat(m.getAttribute("cy"))
    }));
  }
  function restoreLesionMarkers(list) {
    clearLesionMarkers();
    (list || []).forEach((m) => {
      const svg = document.getElementById(m.svgId);
      if (svg) createLesionMarker(svg, m.region, m.section, m.x, m.y);
    });
  }

  const SVG_NS = "http://www.w3.org/2000/svg";

  // Grilla de 6 sectores (sextantes) sobre el dibujo de la próstata,
  // como en la figura de la publicación original de PROMISE. Es solo
  // una referencia visual: no cambia la lógica del código T (PROMISE
  // V2 dejó de reportar por sextante).
  function addProstateSextantGrid() {
    const svg = document.getElementById("prostate-svg-image");
    const gland = document.getElementById("prostate-fig");
    if (!svg || !gland) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    function toSvg(x, y) {
      const p = svg.createSVGPoint();
      p.x = x; p.y = y;
      return p.matrixTransform(inv);
    }
    const rect = gland.getBoundingClientRect();
    const tl = toSvg(rect.left, rect.top);
    const br = toSvg(rect.right, rect.bottom);
    // Margen de seguridad: el contorno es una silueta redondeada (casi en
    // punta en la base), no un rectángulo, así que si las líneas llegan
    // justo al borde calculado, mínimas diferencias de precisión al
    // recortar (clip-path) las dejan asomando por fuera del dibujo.
    const padX = (br.x - tl.x) * 0.04;
    const padY = (br.y - tl.y) * 0.04;
    const x0 = tl.x + padX, y0 = tl.y + padY, x1 = br.x - padX, y1 = br.y - padY;
    const midX = (x0 + x1) / 2;
    const yThird1 = y0 + (y1 - y0) / 3;
    const yThird2 = y0 + ((y1 - y0) * 2) / 3;

    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("class", "sextant-grid");
    g.style.pointerEvents = "none";

    function addLine(lx1, ly1, lx2, ly2) {
      const l = document.createElementNS(SVG_NS, "line");
      l.setAttribute("x1", lx1); l.setAttribute("y1", ly1);
      l.setAttribute("x2", lx2); l.setAttribute("y2", ly2);
      l.setAttribute("stroke", "#5a3a2e");
      l.setAttribute("stroke-width", "0.8");
      l.setAttribute("stroke-dasharray", "2,1.5");
      l.setAttribute("opacity", "0.75");
      g.appendChild(l);
    }
    addLine(midX, y0, midX, y1);
    addLine(x0, yThird1, x1, yThird1);
    addLine(x0, yThird2, x1, yThird2);

    // Recorta la grilla a la silueta real de la próstata (el contorno
    // no es un rectángulo, así que sin esto las líneas se salen del dibujo).
    // Se usa getScreenCTM() (no getCTM()) porque el SVG original tiene
    // capas anidadas que hacen que getCTM() no dé la matriz correcta.
    const glandScreenCtm = gland.getScreenCTM();
    const glandCtm = glandScreenCtm ? inv.multiply(glandScreenCtm) : null;
    if (glandCtm) {
      let defs = svg.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS(SVG_NS, "defs");
        svg.insertBefore(defs, svg.firstChild);
      }
      const clipId = "prostateSextantClip";
      const clipPath = document.createElementNS(SVG_NS, "clipPath");
      clipPath.id = clipId;
      const clipShape = gland.cloneNode(false);
      clipShape.removeAttribute("id");
      clipShape.removeAttribute("class");
      clipShape.setAttribute("transform", `matrix(${glandCtm.a},${glandCtm.b},${glandCtm.c},${glandCtm.d},${glandCtm.e},${glandCtm.f})`);
      clipPath.appendChild(clipShape);
      defs.appendChild(clipPath);
      g.setAttribute("clip-path", `url(#${clipId})`);
    }

    svg.appendChild(g);
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
  // Sección 3: listas de expresión PSMA (mínima / máxima)
  // ---------------------------------------------------------------
  function wirePsmaSlider() {
    const minDD = document.getElementById("min-range-dd");
    const maxDD = document.getElementById("max-range-dd");
    if (!minDD || !maxDD) return;

    function refresh() {
      const min = parseInt(minDD.value, 10);
      const max = parseInt(maxDD.value, 10);
      if (min >= 0 && max >= 0 && min > max) { maxDD.value = String(min); }
      update();
    }
    minDD.addEventListener("change", refresh);
    maxDD.addEventListener("change", refresh);
    refresh();
  }

  // ---------------------------------------------------------------
  // Código PROMISE (formato "mi T.. N.. M..", igual al de la app real)
  // ---------------------------------------------------------------
  function activeRegionsBySection() {
    const groups = { nodes: new Set(), metastases1a: new Set(), metastases1c: new Set() };
    document.querySelectorAll(".clickable[data-region]").forEach((el) => {
      if (!selectedElements.has(el.id)) return;
      const section = el.getAttribute("data-section");
      const region = el.getAttribute("data-region");
      if (groups[section]) groups[section].add(region);
    });
    return groups;
  }

  function buildTCode(tumorRegions) {
    const prostateRemoved = document.getElementById("prostate-removed").checked;
    if (prostateRemoved) return tumorRegions.length > 0 ? "Tr" : "T0";
    if (tumorRegions.includes("bladder")) return "T4";
    if (tumorRegions.includes("LSV") || tumorRegions.includes("RSV")) return "T3b";
    if (tumorRegions.includes("prostateborderpath")) return "T3a";
    const foci = tumorRegions.filter((r) => r === "prostateborderpath0" || r === "prostateoutside").length;
    if (foci >= 2) return "T2m";
    if (foci === 1) return "T2u";
    return "T0";
  }

  // Región base (sin lateralidad) usada por PROMISE V2 (Tabla 1) para
  // decidir miN1 (una región) vs miN2 (dos o más regiones distintas).
  const NODE_BASE_REGION = { EIL: "EI", EIR: "EI", IIL: "II", IIR: "II", OBL: "OB", OBR: "OB", PS: "PS", OP: "OP" };
  const M1C_OFFICIAL = { hep: "hep", pul: "pul", adr: "adrenal", brain: "brain" };

  function buildPromiseCode() {
    const groups = activeRegionsBySection();
    const t = buildTCode(tumorMarkerRegions());
    let code = "mi " + t;

    const scoreSelect = document.getElementById("score");
    if (!scoreSelect.disabled && scoreSelect.value && scoreSelect.value !== "-1") {
      code += ` (PRIMARY${scoreSelect.value})`;
    }

    if (groups.nodes.size) {
      const baseTypes = new Set([...groups.nodes].map((r) => NODE_BASE_REGION[r] || r));
      const nCategory = baseTypes.size >= 2 ? "N2" : "N1";
      code += ` ${nCategory} (${[...groups.nodes].join(",")})`;
    } else {
      code += " N0";
    }

    const mParts = [];
    if (groups.metastases1a.size) mParts.push(`M1a (${[...groups.metastases1a].join(",")})`);

    const diffuse = document.getElementById("bone-removed") && document.getElementById("bone-removed").checked;
    const boneCount = boneMarkerCount();
    if (boneCount > 0 || diffuse) {
      const bits = [];
      if (boneCount === 1) bits.push("uni");
      else if (boneCount >= 2 && boneCount <= 3) bits.push("oligo");
      else if (boneCount > 3) bits.push("diss");
      if (diffuse) bits.push("dmi");
      mParts.push(`M1b (${bits.join(",")})`);
    }

    const otherOrgans = document.getElementById("organs") && document.getElementById("organs").checked;
    if (groups.metastases1c.size || otherOrgans) {
      const bits = [...groups.metastases1c].map((r) => M1C_OFFICIAL[r] || r);
      if (otherOrgans) bits.push("other");
      mParts.push(`M1c (${bits.join(",")})`);
    }

    code += mParts.length ? " " + mParts.join(" ") : " M0";

    const minDD = document.getElementById("min-range-dd");
    const maxDD = document.getElementById("max-range-dd");
    if (minDD && maxDD) {
      const min = minDD.value, max = maxDD.value;
      if (min !== "-1" || max !== "-1") code += ` / PSMA expression score highest ${max} lowest ${min}`;
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

    document.querySelectorAll(".resetPatient, .resetAll").forEach((el) => {
      el.addEventListener("click", (ev) => {
        if (el.tagName === "A") ev.preventDefault();
      });
    });

    document.querySelectorAll(".resetPatient").forEach((el) => el.addEventListener("click", () => resetForm(false)));
    document.querySelectorAll(".resetAll").forEach((el) => el.addEventListener("click", () => resetForm(true)));

    const modalClose = document.getElementById("modalClose");
    if (modalClose) modalClose.addEventListener("click", closeModal);
    const overlay = document.getElementById("overlay-modal");
    if (overlay) overlay.addEventListener("click", closeModal);
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

  function val(id) { const el = document.getElementById(id); return el ? el.value : ""; }
  function setVal(id, v) { const el = document.getElementById(id); if (el && v !== undefined) el.value = v; }
  function setChecked(id, v) { const el = document.getElementById(id); if (el) el.checked = !!v; }

  function resetForm() {
    selectedElements.clear();
    document.querySelectorAll(".clickable[data-region]").forEach(refreshRegionVisual);
    clearLesionMarkers();
    setVal("identifier", ""); setVal("PDEDate", ""); setVal("StageBPET", "-1");
    setChecked("prostate-removed", false);
    document.getElementById("prostate-removed").dispatchEvent(new Event("change"));
    setVal("score", "-1");
    setChecked("bone-removed", false); setChecked("organs", false);
    setVal("min-range-dd", "-1"); setVal("max-range-dd", "-1");
    document.getElementById("min-range-dd").dispatchEvent(new Event("change"));
    update();
    flashToast(ES.toasts.reseted);
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
      // Algunos SVG originales traen width/height (px) que no coinciden con
      // su viewBox (artefacto de exportación); si se dejan, el navegador
      // rasteriza con esa proporción incorrecta y la imagen queda
      // deformada. Forzamos que el tamaño intrínseco sea el del viewBox.
      const vbForClone = svg.viewBox && svg.viewBox.baseVal;
      if (vbForClone && vbForClone.width && vbForClone.height) {
        clone.setAttribute("width", vbForClone.width);
        clone.setAttribute("height", vbForClone.height);
      }
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

  function formatDateEs(isoDate) {
    const parts = (isoDate || "").split("-");
    if (parts.length !== 3) return isoDate || "";
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function svgAspect(svg) {
    const vb = svg.viewBox && svg.viewBox.baseVal;
    if (vb && vb.width && vb.height) return vb.width / vb.height;
    return 1;
  }

  async function svgToCanvasNative(svg, maxDim) {
    const aspect = svgAspect(svg);
    const w = aspect >= 1 ? maxDim : Math.round(maxDim * aspect);
    const h = aspect >= 1 ? Math.round(maxDim / aspect) : maxDim;
    return svgToCanvas(svg, w, h);
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

    const cols = 2, gap = 14, cellW = 480, cellH = 460, labelH = 22;
    const headerH = 46, codeBarH = 64;
    const rows = Math.ceil(targets.length / cols);
    const canvas = document.createElement("canvas");
    canvas.width = cellW * cols;
    canvas.height = headerH + cellH * rows + codeBarH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#222222"; ctx.font = "bold 22px sans-serif"; ctx.textAlign = "center";
    const titleDate = val("PDEDate") ? " — " + formatDateEs(val("PDEDate")) : "";
    ctx.fillText("Esquema PROMISE — " + (val("identifier") || "paciente") + titleDate, canvas.width / 2, 30);

    for (let i = 0; i < targets.length; i++) {
      const col = i % cols, row = Math.floor(i / cols);
      const cellX = col * cellW, cellY = headerH + row * cellH;
      const boxW = cellW - gap * 2, boxH = cellH - gap * 2 - labelH;
      const sub = await svgToCanvasNative(targets[i].svg, 900);
      const scale = Math.min(boxW / sub.width, boxH / sub.height);
      const dw = sub.width * scale, dh = sub.height * scale;
      const dx = cellX + gap + (boxW - dw) / 2;
      const dy = cellY + gap + (boxH - dh) / 2;
      ctx.drawImage(sub, dx, dy, dw, dh);
      ctx.fillStyle = "#444444"; ctx.font = "14px sans-serif"; ctx.textAlign = "center";
      ctx.fillText(targets[i].label, cellX + cellW / 2, cellY + cellH - 6);
    }

    const codeBarY = headerH + cellH * rows;
    ctx.fillStyle = "#CFEAEE"; ctx.fillRect(0, codeBarY, canvas.width, codeBarH);
    ctx.fillStyle = "#222222"; ctx.textAlign = "center";
    ctx.font = "13px sans-serif";
    ctx.fillText("miTNM / código PROMISE", canvas.width / 2, codeBarY + 22);
    ctx.font = "bold 20px monospace";
    ctx.fillText(buildPromiseCode(), canvas.width / 2, codeBarY + 46);

    canvas.toBlob((blob) => {
      const subject = val("identifier") ? val("identifier").replace(/[^a-z0-9_-]+/gi, "_") : "paciente";
      triggerDownload(URL.createObjectURL(blob), `esquema_PROMISE_${subject}.jpg`, true);
    }, "image/jpeg", 0.95);
  }

  function wireSchemeToolbar() {
    const btnExport = document.getElementById("btnExportScheme");
    if (btnExport) btnExport.addEventListener("click", exportScheme);
  }

  // ---------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    applyI18n(document);
    wireResponsiveReflow();
    wireClickableRegions();
    wirePointMarkerRegions();
    wireProstateRemoved();
    addProstateSextantGrid();
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
