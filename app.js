(function () {
  "use strict";

  const STORAGE_KEY = "promisePsmaPatients";
  const SVG_NS = "http://www.w3.org/2000/svg";

  // ---------- Anatomical marker layout (hotspots on the diagram) ----------
  // group colors: t=local tumor, n=pelvic node, m1a=extrapelvic node, m1b=bone, m1c=organ
  const MARKERS = [
    { id: "T", group: "t", cx: 300, cy: 470, r: 14, label: "Próstata (T)" },

    { id: "node_RP", group: "m1a", cx: 300, cy: 300, r: 8, label: "Retroperitoneal" },
    { id: "node_CIL", group: "m1a", cx: 265, cy: 335, r: 8, label: "Ilíaco común izq." },
    { id: "node_CIR", group: "m1a", cx: 335, cy: 335, r: 8, label: "Ilíaco común der." },

    { id: "node_EIL", group: "n", cx: 250, cy: 380, r: 8, label: "Ilíaco externo izq." },
    { id: "node_EIR", group: "n", cx: 350, cy: 380, r: 8, label: "Ilíaco externo der." },
    { id: "node_IIL", group: "n", cx: 268, cy: 400, r: 8, label: "Ilíaco interno izq." },
    { id: "node_IIR", group: "n", cx: 332, cy: 400, r: 8, label: "Ilíaco interno der." },
    { id: "node_OBL", group: "n", cx: 280, cy: 425, r: 8, label: "Obturador izq." },
    { id: "node_OBR", group: "n", cx: 320, cy: 425, r: 8, label: "Obturador der." },
    { id: "node_PS", group: "n", cx: 300, cy: 415, r: 8, label: "Presacro" },
    { id: "node_OP", group: "n", cx: 300, cy: 440, r: 8, label: "Otros pélvicos" },

    { id: "organ_brain", group: "m1c", cx: 300, cy: 55, r: 12, label: "Cerebro" },
    { id: "organ_lungLeft", group: "m1c", cx: 260, cy: 160, r: 11, label: "Pulmón izq." },
    { id: "organ_lungRight", group: "m1c", cx: 340, cy: 160, r: 11, label: "Pulmón der." },
    { id: "organ_hep", group: "m1c", cx: 335, cy: 225, r: 11, label: "Hígado" },
    { id: "organ_adr", group: "m1c", cx: 300, cy: 215, r: 8, label: "Suprarrenal" },
    { id: "organ_supradia", group: "m1a", cx: 300, cy: 120, r: 8, label: "Supradiafragmático" },
    { id: "organ_OE", group: "m1a", cx: 300, cy: 500, r: 8, label: "Inguinal / otro extrapelviano" }
  ];

  const BONE_SITES = [
    { id: "bone_skull", cx: 300, cy: 55 },
    { id: "bone_spineC", cx: 300, cy: 100 },
    { id: "bone_ribsL", cx: 265, cy: 175 },
    { id: "bone_ribsR", cx: 335, cy: 175 },
    { id: "bone_spineT", cx: 300, cy: 200 },
    { id: "bone_spineL", cx: 300, cy: 280 },
    { id: "bone_pelvis", cx: 300, cy: 350 },
    { id: "bone_femurL", cx: 270, cy: 540 },
    { id: "bone_femurR", cx: 330, cy: 540 }
  ];

  const BONE_COUNT = { none: 0, uni: 1, oligo: 3, diss: 9 };

  const GROUP_COLOR = {
    t: "#e11d48",
    n: "#d97706",
    m1a: "#b45309",
    m1b: "#b91c1c",
    m1c: "#7c3aed"
  };
  const INACTIVE_COLOR = "#cbd5e1";

  // ---------------------------- State ----------------------------
  function emptyState() {
    return {
      subjectId: "",
      peDate: "",
      stageBeforePet: "",
      prostateRemoved: false,
      localT: "",
      primaryScore: "",
      nodes: { EIL: false, EIR: false, IIL: false, IIR: false, OBL: false, OBR: false, PS: false, OP: false, RP: false, CIL: false, CIR: false },
      scoreMin: "",
      scoreMax: "",
      bone: "none",
      diffuseMarrow: false,
      organs: { hep: false, adr: false, brain: false, lungLeft: false, lungRight: false, supradia: false, OE: false },
      otherOrgansInvolved: false,
      manualPins: [] // {x, y, text}
    };
  }

  let state = emptyState();

  // ---------------------------- DOM helpers ----------------------------
  const $ = (id) => document.getElementById(id);

  function bindCheckbox(id, getter, setter) {
    const el = $(id);
    el.checked = getter();
    el.addEventListener("change", () => {
      setter(el.checked);
      update();
    });
  }

  function bindSelect(id, getter, setter) {
    const el = $(id);
    el.value = getter();
    el.addEventListener("change", () => {
      setter(el.value);
      update();
    });
  }

  function bindRadioGroup(name, getter, setter) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach((r) => {
      r.checked = r.value === getter();
      r.addEventListener("change", () => {
        if (r.checked) {
          setter(r.value);
          update();
        }
      });
    });
  }

  function bindText(id, getter, setter) {
    const el = $(id);
    el.value = getter();
    el.addEventListener("input", () => {
      setter(el.value);
      update();
    });
  }

  function wireForm() {
    bindText("subjectId", () => state.subjectId, (v) => (state.subjectId = v));
    bindText("peDate", () => state.peDate, (v) => (state.peDate = v));
    bindSelect("stageBeforePet", () => state.stageBeforePet, (v) => (state.stageBeforePet = v));

    bindCheckbox("prostateRemoved", () => state.prostateRemoved, (v) => (state.prostateRemoved = v));
    bindRadioGroup("localT", () => state.localT, (v) => (state.localT = v));
    bindSelect("primaryScore", () => state.primaryScore, (v) => (state.primaryScore = v));

    ["EIL", "EIR", "IIL", "IIR", "OBL", "OBR", "PS", "OP", "RP", "CIL", "CIR"].forEach((k) => {
      bindCheckbox(`node_${k}`, () => state.nodes[k], (v) => (state.nodes[k] = v));
    });

    bindSelect("scoreMin", () => state.scoreMin, (v) => (state.scoreMin = v));
    bindSelect("scoreMax", () => state.scoreMax, (v) => (state.scoreMax = v));

    bindRadioGroup("bone", () => state.bone, (v) => (state.bone = v));
    bindCheckbox("diffuseMarrow", () => state.diffuseMarrow, (v) => (state.diffuseMarrow = v));

    ["hep", "adr", "brain", "lungLeft", "lungRight", "supradia", "OE"].forEach((k) => {
      bindCheckbox(`organ_${k}`, () => state.organs[k], (v) => (state.organs[k] = v));
    });
    bindCheckbox("otherOrgansInvolved", () => state.otherOrgansInvolved, (v) => (state.otherOrgansInvolved = v));
  }

  function refreshFormFromState() {
    $("subjectId").value = state.subjectId;
    $("peDate").value = state.peDate;
    $("stageBeforePet").value = state.stageBeforePet;
    $("prostateRemoved").checked = state.prostateRemoved;
    document.querySelectorAll('input[name="localT"]').forEach((r) => (r.checked = r.value === state.localT));
    $("primaryScore").value = state.primaryScore;
    ["EIL", "EIR", "IIL", "IIR", "OBL", "OBR", "PS", "OP", "RP", "CIL", "CIR"].forEach((k) => {
      $(`node_${k}`).checked = state.nodes[k];
    });
    $("scoreMin").value = state.scoreMin;
    $("scoreMax").value = state.scoreMax;
    document.querySelectorAll('input[name="bone"]').forEach((r) => (r.checked = r.value === state.bone));
    $("diffuseMarrow").checked = state.diffuseMarrow;
    ["hep", "adr", "brain", "lungLeft", "lungRight", "supradia", "OE"].forEach((k) => {
      $(`organ_${k}`).checked = state.organs[k];
    });
    $("otherOrgansInvolved").checked = state.otherOrgansInvolved;
  }

  // ---------------------------- PROMISE code ----------------------------
  const T_LABELS = { t0: "T0", T2u: "T2u", T2m: "T2m", T3a: "T3a", T3b: "T3b", T4: "T4" };
  const PRIMARY_SCORE = { ftz: 3, fpz: 4, vhi: 5 };
  const NODE_LABELS = { EIL: "EIL", EIR: "EIR", IIL: "IIL", IIR: "IIR", OBL: "OBL", OBR: "OBR", PS: "PS", OP: "OP" };
  const M1A_NODE_LABELS = { RP: "RP", CIL: "CIL", CIR: "CIR" };
  const ORGAN_LABELS = { hep: "hígado", adr: "suprarrenal", brain: "cerebro", lungLeft: "pulmón izq.", lungRight: "pulmón der." };
  const BONE_LABELS = { uni: "única", oligo: "oligometastásica", diss: "diseminada" };

  function buildPromiseCode() {
    const parts = [];

    // --- T ---
    if (state.prostateRemoved) {
      parts.push(state.localT === "Tr" ? "miT_r+" : "miT0");
    } else if (state.localT) {
      let t = "mi" + (T_LABELS[state.localT] || state.localT);
      if (state.primaryScore) t += ` PRIMARY${PRIMARY_SCORE[state.primaryScore]}`;
      parts.push(t);
    } else {
      parts.push("miTx");
    }

    // --- N (pelvic) ---
    const nStations = Object.keys(NODE_LABELS).filter((k) => state.nodes[k]);
    parts.push(nStations.length ? `miN1(${nStations.length}/${nStations.join(",")})` : "miN0");

    // --- M ---
    const mParts = [];
    const m1aStations = [
      ...Object.keys(M1A_NODE_LABELS).filter((k) => state.nodes[k]),
      ...(state.organs.supradia ? ["SD"] : []),
      ...(state.organs.OE ? ["OE"] : [])
    ];
    if (m1aStations.length) mParts.push(`miM1a(${m1aStations.join(",")})`);

    if (state.bone !== "none" || state.diffuseMarrow) {
      const bits = [];
      if (state.bone !== "none") bits.push(BONE_LABELS[state.bone]);
      if (state.diffuseMarrow) bits.push("médula ósea difusa");
      mParts.push(`miM1b(${bits.join(" + ")})`);
    }

    const m1cOrgans = Object.keys(ORGAN_LABELS).filter((k) => state.organs[k]);
    if (m1cOrgans.length || state.otherOrgansInvolved) {
      const bits = m1cOrgans.map((k) => ORGAN_LABELS[k]);
      if (state.otherOrgansInvolved) bits.push("otros órganos");
      mParts.push(`miM1c(${bits.join(",")})`);
    }

    if (!mParts.length) mParts.push("miM0");
    parts.push(...mParts);

    // --- PSMA expression ---
    if (state.scoreMin !== "" || state.scoreMax !== "") {
      const min = state.scoreMin !== "" ? state.scoreMin : "?";
      const max = state.scoreMax !== "" ? state.scoreMax : "?";
      parts.push(`PSMA-expr(min${min},max${max})`);
    }

    return parts.join("  ");
  }

  // ---------------------------- Diagram ----------------------------
  function buildBodySilhouette() {
    const stroke = "#94a3b8";
    const fill = "#f8fafc";
    return `
      <ellipse cx="300" cy="52" rx="30" ry="34" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="286" y="82" width="28" height="22" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M222,106 L378,106 L358,272 L242,272 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M222,106 L188,106 L168,330 L200,330 L222,150 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M378,106 L412,106 L432,330 L400,330 L378,150 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <path d="M242,272 L358,272 L370,352 L230,352 Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="248" y="352" width="44" height="248" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <rect x="308" y="352" width="44" height="248" rx="16" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    `;
  }

  function activeColorFor(marker) {
    const isActive = isMarkerActive(marker);
    return isActive ? GROUP_COLOR[marker.group] : INACTIVE_COLOR;
  }

  function isMarkerActive(marker) {
    if (marker.id === "T") return !state.prostateRemoved && !!state.localT && state.localT !== "t0";
    if (marker.id.startsWith("node_")) return !!state.nodes[marker.id.replace("node_", "")];
    if (marker.id === "organ_supradia") return !!state.organs.supradia;
    if (marker.id === "organ_OE") return !!state.organs.OE;
    if (marker.id.startsWith("organ_")) return !!state.organs[marker.id.replace("organ_", "")];
    return false;
  }

  function activeBoneSiteIds() {
    const n = BONE_COUNT[state.bone] || 0;
    return BONE_SITES.slice(0, n).map((s) => s.id);
  }

  function renderDiagram() {
    const svg = $("promiseDiagram");
    svg.innerHTML = "";

    const silhouetteWrap = document.createElementNS(SVG_NS, "g");
    silhouetteWrap.innerHTML = buildBodySilhouette();
    svg.appendChild(silhouetteWrap);

    // bone overlay
    const activeBones = new Set(activeBoneSiteIds());
    const boneGroup = document.createElementNS(SVG_NS, "g");
    BONE_SITES.forEach((site) => {
      const active = activeBones.has(site.id);
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", site.cx);
      c.setAttribute("cy", site.cy);
      c.setAttribute("r", active ? 7 : 3);
      c.setAttribute("fill", active ? GROUP_COLOR.m1b : "#e2e8f0");
      c.setAttribute("stroke", active ? "#7f1d1d" : "none");
      c.setAttribute("stroke-width", "1.5");
      boneGroup.appendChild(c);
    });
    if (state.diffuseMarrow) {
      const overlay = document.createElementNS(SVG_NS, "g");
      overlay.innerHTML = buildBodySilhouette();
      overlay.setAttribute("opacity", "0.25");
      overlay.querySelectorAll("path, rect, ellipse").forEach((p) => p.setAttribute("fill", GROUP_COLOR.m1b));
      svg.appendChild(overlay);
    }
    svg.appendChild(boneGroup);

    // structured markers
    MARKERS.forEach((m) => {
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", m.cx);
      c.setAttribute("cy", m.cy);
      c.setAttribute("r", m.r);
      c.setAttribute("fill", activeColorFor(m));
      c.setAttribute("stroke", "#334155");
      c.setAttribute("stroke-width", "1");
      c.setAttribute("opacity", isMarkerActive(m) ? "0.95" : "0.5");
      const title = document.createElementNS(SVG_NS, "title");
      title.textContent = m.label;
      c.appendChild(title);
      svg.appendChild(c);
    });

    // manual pins
    state.manualPins.forEach((pin, idx) => {
      const g = document.createElementNS(SVG_NS, "g");
      g.style.cursor = "pointer";
      const c = document.createElementNS(SVG_NS, "circle");
      c.setAttribute("cx", pin.x);
      c.setAttribute("cy", pin.y);
      c.setAttribute("r", 9);
      c.setAttribute("fill", "#0891b2");
      c.setAttribute("stroke", "#164e63");
      c.setAttribute("stroke-width", "1.5");
      const t = document.createElementNS(SVG_NS, "title");
      t.textContent = pin.text;
      g.appendChild(c);
      g.appendChild(t);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", pin.x + 12);
      label.setAttribute("y", pin.y + 4);
      label.setAttribute("font-size", "11");
      label.setAttribute("fill", "#0e7490");
      label.textContent = pin.text;
      g.appendChild(label);

      g.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (confirm(`¿Eliminar la marca "${pin.text}"?`)) {
          state.manualPins.splice(idx, 1);
          renderDiagram();
        }
      });
      svg.appendChild(g);
    });
  }

  function wireDiagramClicks() {
    const svg = $("promiseDiagram");
    svg.addEventListener("click", (ev) => {
      if (ev.target.closest && ev.target.tagName === "text") return;
      const pt = svg.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      const text = prompt("Descripción del hallazgo:");
      if (text) {
        state.manualPins.push({ x: loc.x, y: loc.y, text });
        renderDiagram();
      }
    });

    $("btnClearPins").addEventListener("click", () => {
      if (state.manualPins.length && confirm("¿Borrar todas las marcas manuales?")) {
        state.manualPins = [];
        renderDiagram();
      }
    });

    $("btnAddPinHint").addEventListener("click", () => {
      alert("Hacé clic directamente sobre el esquema para agregar una marca en ese punto.");
    });
  }

  function exportDiagramAsJpg() {
    const svg = $("promiseDiagram");
    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", SVG_NS);
    const svgString = new XMLSerializer().serializeToString(clone);
    const svgData = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

    const scale = 2;
    const vb = svg.viewBox.baseVal;
    const canvas = document.createElement("canvas");
    canvas.width = vb.width * scale;
    canvas.height = vb.height * scale;
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.onload = function () {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
      const a = document.createElement("a");
      const subject = state.subjectId ? state.subjectId.replace(/[^a-z0-9_-]+/gi, "_") : "paciente";
      a.href = jpgUrl;
      a.download = `esquema_PROMISE_${subject}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    };
    img.onerror = function () {
      alert("No se pudo generar la imagen. Probá nuevamente.");
    };
    img.src = svgData;
  }

  // ---------------------------- Persistence ----------------------------
  function loadPatients() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function savePatients(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function wirePersistence() {
    $("btnGuardar").addEventListener("click", () => {
      if (!state.subjectId) {
        alert("Ingresá un ID de sujeto antes de guardar.");
        return;
      }
      const list = loadPatients();
      const idx = list.findIndex((p) => p.subjectId === state.subjectId && p.peDate === state.peDate);
      const record = JSON.parse(JSON.stringify(state));
      if (idx >= 0) list[idx] = record;
      else list.push(record);
      savePatients(list);
      alert("Paciente guardado.");
    });

    $("btnCargar").addEventListener("click", () => {
      const list = loadPatients();
      if (!list.length) {
        alert("No hay pacientes guardados.");
        return;
      }
      const options = list.map((p, i) => `${i + 1}. ${p.subjectId || "(sin ID)"} — ${p.peDate || "(sin fecha)"}`).join("\n");
      const choice = prompt(`Elegí un paciente por número:\n${options}`);
      const i = parseInt(choice, 10) - 1;
      if (i >= 0 && i < list.length) {
        state = Object.assign(emptyState(), list[i]);
        refreshFormFromState();
        update();
      }
    });

    $("btnExportJson").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const subject = state.subjectId ? state.subjectId.replace(/[^a-z0-9_-]+/gi, "_") : "paciente";
      a.href = url;
      a.download = `promise_psma_${subject}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    $("btnImportJson").addEventListener("click", () => $("jsonFileInput").click());
    $("jsonFileInput").addEventListener("change", (ev) => {
      const file = ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          state = Object.assign(emptyState(), data);
          refreshFormFromState();
          update();
        } catch (e) {
          alert("El archivo no contiene JSON válido.");
        }
      };
      reader.readAsText(file);
      ev.target.value = "";
    });

    $("btnReset").addEventListener("click", () => {
      if (confirm("¿Restablecer el formulario actual?")) {
        state = emptyState();
        refreshFormFromState();
        update();
      }
    });

    $("btnCopyCode").addEventListener("click", () => {
      const code = $("promiseCode").textContent;
      navigator.clipboard.writeText(code).then(() => {
        const btn = $("btnCopyCode");
        const original = btn.textContent;
        btn.textContent = "Copiado!";
        setTimeout(() => (btn.textContent = original), 1200);
      });
    });

    $("btnExportJpg").addEventListener("click", exportDiagramAsJpg);
  }

  // ---------------------------- Update loop ----------------------------
  function update() {
    $("promiseCode").textContent = buildPromiseCode();
    renderDiagram();
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireForm();
    wireDiagramClicks();
    wirePersistence();
    update();
  });
})();
