/*
 * Fridge Card for Home Assistant
 * https://github.com/Sr-0w/lovelace-fridge-card
 * MIT License
 */
(() => {
  const VERSION = "1.0.0";
  const TYPE = "fridge-card";
  const EDITOR = `${TYPE}-editor`;
  if (customElements.get(TYPE)) return;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const lang = (hass) => String(hass?.locale?.language ?? hass?.language ?? "en").toLowerCase().split(/[-_]/)[0];
  const clamp = (v, fallback, min, max) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const num = (v) => {
    const n = Number(v);
    return v !== null && v !== "" && Number.isFinite(n) ? n : null;
  };
  const THEME_COLORS = new Set([
    "primary", "accent", "red", "pink", "purple", "deep-purple", "indigo", "blue", "light-blue", "cyan", "teal",
    "green", "light-green", "lime", "yellow", "amber", "orange", "deep-orange", "brown", "light-grey", "grey",
    "dark-grey", "blue-grey", "black", "white", "disabled",
  ]);
  const cssColor = (value, fallback) => {
    if (Array.isArray(value) && value.length === 3 && value.every((n) => Number.isFinite(Number(n)))) {
      return `rgb(${value.map((n) => Math.max(0, Math.min(255, Math.round(Number(n))))).join(",")})`;
    }
    if (typeof value !== "string") return fallback;
    const v = value.trim();
    if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
    if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%/]+\)$/i.test(v)) return v;
    if (/^var\(--[a-z0-9-]+(\s*,\s*#[0-9a-f]{3,8})?\)$/i.test(v)) return v;
    if (THEME_COLORS.has(v)) return `var(--${v}-color)`;
    return fallback;
  };

  /* ------------------------------------------------------------------ */
  /* Translations                                                        */
  /* ------------------------------------------------------------------ */

  const STRINGS = {
    en: {
      refrigerator: "Refrigerator", freezer: "Freezer", quick_cool: "Power cool", quick_freeze: "Power freeze", ice: "Ice",
      doors_closed: "Doors closed", door_open: "Door open", filter: "Filter", filter_replace: "Replace filter",
      attention: "Too warm", caution: "Watch", details: "Details", measured: "Measured", unavailable: "Unavailable",
      setup: "Pick your refrigerator in the card editor.",
    },
    fr: {
      refrigerator: "Réfrigérateur", freezer: "Congélateur", quick_cool: "Froid+", quick_freeze: "Congél+", ice: "Glaçons",
      doors_closed: "Portes fermées", door_open: "Porte ouverte", filter: "Filtre", filter_replace: "Filtre à remplacer",
      attention: "Trop chaud", caution: "À surveiller", details: "Détails", measured: "Mesurée", unavailable: "Indisponible",
      setup: "Choisissez votre réfrigérateur dans l’éditeur de la carte.",
    },
    de: {
      refrigerator: "Kühlschrank", freezer: "Gefrierschrank", quick_cool: "Superkühlen", quick_freeze: "Supergefrieren", ice: "Eis",
      doors_closed: "Türen geschlossen", door_open: "Tür offen", filter: "Filter", filter_replace: "Filter wechseln",
      attention: "Zu warm", caution: "Beobachten", details: "Details", measured: "Gemessen", unavailable: "Nicht verfügbar",
      setup: "Wählen Sie Ihren Kühlschrank im Karteneditor.",
    },
    nl: {
      refrigerator: "Koelkast", freezer: "Vriezer", quick_cool: "Supercool", quick_freeze: "Supervries", ice: "IJs",
      doors_closed: "Deuren dicht", door_open: "Deur open", filter: "Filter", filter_replace: "Filter vervangen",
      attention: "Te warm", caution: "In de gaten houden", details: "Details", measured: "Gemeten", unavailable: "Niet beschikbaar",
      setup: "Kies je koelkast in de kaarteditor.",
    },
    es: {
      refrigerator: "Frigorífico", freezer: "Congelador", quick_cool: "Superfrío", quick_freeze: "Supercongelación", ice: "Hielo",
      doors_closed: "Puertas cerradas", door_open: "Puerta abierta", filter: "Filtro", filter_replace: "Cambiar filtro",
      attention: "Demasiado caliente", caution: "Vigilar", details: "Detalles", measured: "Medida", unavailable: "No disponible",
      setup: "Elige tu frigorífico en el editor de la tarjeta.",
    },
    it: {
      refrigerator: "Frigorifero", freezer: "Congelatore", quick_cool: "Super raffreddamento", quick_freeze: "Super congelamento",
      ice: "Ghiaccio", doors_closed: "Porte chiuse", door_open: "Porta aperta", filter: "Filtro", filter_replace: "Sostituire il filtro",
      attention: "Troppo caldo", caution: "Da controllare", details: "Dettagli", measured: "Misurata", unavailable: "Non disponibile",
      setup: "Scegli il frigorifero nell’editor della scheda.",
    },
  };
  const LABEL_KEYS = Object.keys(STRINGS.en).filter((k) => k !== "setup");

  /* ------------------------------------------------------------------ */
  /* Entity discovery                                                    */
  /* ------------------------------------------------------------------ */

  const FREEZER = /freez|congel|gefrier|vries|vriez|frost|ice_?box|deep_?freeze/;
  const FRIDGE = /fridge|refrig|r[eé]frig|cooler|(^|_)cool|frigo|kuhl|kühl|kuehl|koel|chill|fresh_?food/;
  const OTHER_ZONE = /ambient|outdoor|room|water|flex|convert|variable|wine|pantry|cvroom|zone|outside/;
  const TEMP_UNIT = /^°?[cfk]$|^°[cf]$/i;

  // Entity ids start with the device name; that prefix says nothing about the entity itself.
  const slug = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const devicePrefixes = (hass, deviceId) => {
    const d = hass?.devices?.[deviceId];
    return d ? [d.name_by_user, d.name].filter(Boolean).map(slug).filter(Boolean).sort((a, b) => b.length - a.length) : [];
  };
  const stripPrefix = (obj, prefixes) => {
    for (const p of prefixes) if (obj.startsWith(`${p}_`)) return obj.slice(p.length + 1);
    return obj;
  };
  const deviceEntities = (hass, deviceId) => {
    const out = [];
    const prefixes = devicePrefixes(hass, deviceId);
    if (!deviceId || !hass?.entities) return out;
    for (const e of Object.values(hass.entities)) {
      if (e.device_id !== deviceId || e.hidden) continue;
      const st = hass.states?.[e.entity_id];
      if (!st) continue;
      const [domain, object] = e.entity_id.split(".");
      out.push({ id: e.entity_id, domain, key: norm(e.translation_key), obj: stripPrefix(norm(object), prefixes),
        dc: st.attributes?.device_class, unit: String(st.attributes?.unit_of_measurement ?? ""), category: e.entity_category, st });
    }
    return out;
  };
  const deviceText = (hass, deviceId) => {
    const d = hass?.devices?.[deviceId];
    return d ? norm(`${d.name_by_user ?? ""} ${d.name ?? ""} ${d.model ?? ""}`) : "";
  };

  const detectEntities = (hass, deviceId) => {
    const list = deviceEntities(hass, deviceId), out = {}, used = new Set();
    const has = (e, re) => re.test(e.key) || re.test(e.obj);
    const freezerOnly = FREEZER.test(deviceText(hass, deviceId)) && !FRIDGE.test(deviceText(hass, deviceId));
    const zone = (e) => (has(e, FREEZER) ? "freezer" : has(e, FRIDGE) ? "fridge" : null);
    const zoneOr = (e) => zone(e) ?? (freezerOnly ? "freezer" : "fridge");
    const sorted = (arr) => arr.sort((a, b) => (a.category ? 1 : 0) - (b.category ? 1 : 0));
    const put = (key, e) => { if (e && !out[key] && !used.has(e.id)) { out[key] = e.id; used.add(e.id); } };
    const isTemp = (e) => e.dc === "temperature" || TEMP_UNIT.test(e.unit);

    // Measured temperatures
    for (const e of sorted(list.filter((x) => x.domain === "sensor" && isTemp(x) && !has(x, OTHER_ZONE)))) put(`${zoneOr(e)}_temperature`, e);
    // Setpoints: number, input_number or climate
    for (const e of sorted(list.filter((x) => ["number", "input_number"].includes(x.domain) && isTemp(x) && !has(x, OTHER_ZONE)))) put(`${zoneOr(e)}_setpoint`, e);
    for (const e of list.filter((x) => x.domain === "climate" && !has(x, OTHER_ZONE))) put(`${zoneOr(e)}_setpoint`, e);
    // Doors
    for (const e of list.filter((x) => x.domain === "binary_sensor" && (["door", "opening"].includes(x.dc) || has(x, /door/)))) {
      const z = zone(e);
      put(z ? `${z}_door` : "door", e);
    }
    put("power", list.find((e) => e.domain === "sensor" && e.dc === "power"));
    put("filter_life", list.find((e) => e.domain === "sensor" && has(e, /filter/) && has(e, /remain|life|left/) && e.unit === "%"));
    put("filter_usage", list.find((e) => e.domain === "sensor" && has(e, /filter/) && e.unit === "%"));
    put("filter_alert", list.find((e) => e.domain === "binary_sensor" && has(e, /filter/)));
    // Modes
    const switches = sorted(list.filter((e) => ["switch", "input_boolean"].includes(e.domain)));
    put("ice", switches.find((e) => has(e, /(^|_)ice($|_)|ice_?maker|icemaker|ice_cube|cubed_ice|eiswürfel|glacon/)));
    const boost = /power_cool|power_freeze|super|rapid|fast|quick|boost|turbo|express|intensive|power_mode/;
    for (const e of switches.filter((x) => has(x, boost)).sort((a, b) => (zone(a) ? 0 : 1) - (zone(b) ? 0 : 1))) put(zoneOr(e) === "freezer" ? "quick_freeze" : "quick_cool", e);
    return out;
  };

  const deviceName = (hass, deviceId) => {
    const d = hass?.devices?.[deviceId];
    return d ? d.name_by_user || d.name || "" : "";
  };
  const findDevice = (hass) => {
    let best = null;
    for (const d of Object.values(hass?.devices ?? {})) {
      const text = norm(`${d.name_by_user ?? ""} ${d.name ?? ""} ${d.model ?? ""}`);
      if (!/fridge|frigo|r[eé]frig|freez|congel|gefrier|kühl|kuhl|kuehl|koel|vries|vriez|nevera|frigor|(^|_)ref(_|$)|_ref_/.test(text)) continue;
      const found = detectEntities(hass, d.id);
      const score = ["fridge_temperature", "freezer_temperature", "fridge_setpoint", "freezer_setpoint"].filter((k) => found[k]).length;
      if (score && (!best || score > best.score)) best = { id: d.id, score, entities: found };
    }
    return best;
  };

  /* ------------------------------------------------------------------ */
  /* Styles                                                              */
  /* ------------------------------------------------------------------ */

  const STYLE = `
    :host{display:block}
    *{box-sizing:border-box}
    ha-card{display:flex;flex-direction:column;align-items:stretch;width:100%;overflow:hidden;color:var(--primary-text-color)}
    .header{position:relative;display:flex;align-items:center;justify-content:center;min-height:48px;padding:8px 44px;font-size:var(--ha-font-size-l,16px);font-weight:var(--ha-font-weight-normal,400);line-height:1.5}
    .header span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .menu{position:absolute;right:4px;top:4px;border:0;background:transparent;color:var(--secondary-text-color);height:40px;width:40px;cursor:pointer;border-radius:50%;display:grid;place-items:center}
    .menu:hover{background:color-mix(in srgb,var(--primary-text-color) 6%,transparent)}
    .menu ha-icon{--mdc-icon-size:22px}
    .twin{display:grid;grid-template-columns:repeat(var(--fridge-dials,2),minmax(0,1fr));align-items:start;gap:var(--fridge-dial-gap,0px);padding:3px 10px 4px}
    .temperature{display:flex;min-width:0;flex-direction:column;align-items:center;gap:2px}
    .name{max-width:100%;font-size:var(--ha-font-size-s,12px);font-weight:var(--ha-font-weight-medium,500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;color:var(--secondary-text-color);margin:0 0 2px}
    .container{position:relative;width:min(100%,var(--fridge-dial-size,300px));margin-inline:auto;aspect-ratio:1;container-type:inline-size;container-name:container}
    ha-control-circular-slider{display:block;width:100%;height:100%;--control-circular-slider-color:var(--state-color);--control-circular-slider-background:var(--fridge-track);--control-circular-slider-background-opacity:.3}
    ha-control-circular-slider::after{display:block;content:"";position:absolute;inset:-10%;background:radial-gradient(50% 50% at 50% 50%,var(--state-color) 0%,transparent 100%);opacity:.15;pointer-events:none}
    ha-control-circular-slider:not(:defined){display:none}
    .ring{display:none;position:absolute;inset:7%;border-radius:50%;border:calc(var(--fridge-ring,24px) * .5) solid color-mix(in srgb,var(--fridge-track) 30%,transparent);border-bottom-color:transparent;transform:rotate(0deg)}
    ha-control-circular-slider:not(:defined)+.ring,.ring.static{display:block}
    .ring.static{border-top-color:color-mix(in srgb,var(--state-color) 45%,transparent);border-left-color:color-mix(in srgb,var(--state-color) 45%,transparent);border-right-color:color-mix(in srgb,var(--state-color) 45%,transparent)}
    .info{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;gap:2px;line-height:1.4}
    .info>*{margin:0}
    .target-number{font-size:clamp(26px,7.4cqw,39px);letter-spacing:0;max-width:92%;white-space:nowrap;color:var(--fridge-text)}
    .target-fallback{font-size:26px;line-height:1.2;color:var(--secondary-text-color)}
    .current{display:flex;align-items:center;gap:3px;color:var(--secondary-text-color);font-size:11px;white-space:nowrap}
    .current ha-icon{--mdc-icon-size:14px}
    .buttons{position:absolute;left:50%;bottom:-1px;transform:translateX(-50%);width:max-content;display:grid;grid-template-columns:repeat(2,var(--fridge-button-size,32px));gap:12px;place-items:center;pointer-events:none}
    .buttons ha-outlined-icon-button{--ha-icon-button-size:var(--fridge-button-size,32px);--ha-outlined-icon-button-outline-color:var(--secondary-text-color);display:block;width:var(--fridge-button-size,32px);height:var(--fridge-button-size,32px);margin:0;padding:0;pointer-events:auto;cursor:pointer}
    .buttons ha-svg-icon{--mdc-icon-size:20px}
    .buttons ha-outlined-icon-button[disabled]{opacity:.26;pointer-events:none}
    .metadata{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:4px 10px;padding:3px 14px 12px;color:var(--secondary-text-color);font-size:var(--ha-font-size-xs,11px)}
    .metadata span{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;min-width:0}
    .metadata ha-icon{--mdc-icon-size:15px}
    .metadata strong{font-weight:var(--ha-font-weight-medium,500);color:var(--primary-text-color)}
    .metadata .alert,.metadata .alert strong{color:var(--fridge-warning)}
    .metadata .caution,.metadata .caution strong{color:var(--fridge-caution)}
    .modes{display:flex;gap:3px;padding:4px;margin:0 12px 12px;background:var(--secondary-background-color,#292929);border:1px solid var(--divider-color,#444);border-radius:var(--ha-border-radius-xl,13px)}
    .mode{flex:1;min-width:0;height:var(--fridge-mode-height,57px);border:0;border-radius:var(--ha-border-radius-lg,10px);background:transparent;color:var(--secondary-text-color);font:var(--ha-font-weight-medium,500) var(--ha-font-size-xs,11px) inherit;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:0 2px;transition:background-color .18s,color .18s}
    .mode span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .mode ha-icon{--mdc-icon-size:var(--fridge-mode-icon-size,22px)}
    .mode.active{background:var(--fridge-action);color:var(--text-primary-color,#fff)}
    .mode:disabled{opacity:.35;cursor:not-allowed}
    .mode:focus-visible,.menu:focus-visible{outline:2px solid var(--primary-color);outline-offset:1px}
    .setup{display:flex;align-items:center;gap:14px;padding:18px;color:var(--secondary-text-color)}
    .setup ha-icon{--mdc-icon-size:34px;color:var(--fridge-action)}
    @container container (max-width:180px){.target-number{font-size:32px}.buttons{gap:9px}.buttons ha-outlined-icon-button{--ha-icon-button-size:30px}}
    @media(max-width:360px){.twin{padding:3px 5px 3px}.buttons{gap:8px;grid-template-columns:repeat(2,var(--fridge-button-size,28px))}.buttons ha-outlined-icon-button{--ha-icon-button-size:var(--fridge-button-size,28px);width:var(--fridge-button-size,28px);height:var(--fridge-button-size,28px)}.name{font-size:11px}.metadata{font-size:10px;padding:4px 10px 11px}.mode{height:var(--fridge-mode-height,53px);font-size:10px}}
  `;
  const ICON_PATHS = { minus: "M19,13H5V11H19V13Z", plus: "M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" };
  const MODE_ICONS = { quick_cool: "mdi:snowflake-thermometer", quick_freeze: "mdi:snowflake-alert", ice: "mdi:cube-outline" };

  /* ------------------------------------------------------------------ */
  /* Card                                                                */
  /* ------------------------------------------------------------------ */

  class FridgeCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.addEventListener("click", (e) => this._click(e));
      this._dragging = new Set();
      this._pending = new Set();
    }

    static getConfigElement() { return document.createElement(EDITOR); }
    static getStubConfig(hass) {
      const found = findDevice(hass);
      return found ? { device: found.id, entities: found.entities } : { entities: {} };
    }

    setConfig(config) {
      if (!config || typeof config !== "object") throw new Error("Fridge Card: invalid configuration");
      this._config = { ...config, entities: { ...(config.entities ?? {}) } };
      this._detected = null;
      this._signature = "";
      this._render();
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (first || hass.entities !== this._entitiesRef) { this._detected = null; this._entitiesRef = hass.entities; }
      const ids = [...Object.values(this._ents()), ...(this._config?.extra_modes ?? []).map((m) => m?.entity)].filter((x) => typeof x === "string");
      const sig = lang(hass) + "|" + ids.map((id) => {
        const s = hass.states[id], a = s?.attributes ?? {};
        return `${id}:${s?.state}:${a.temperature ?? ""}:${a.current_temperature ?? ""}:${a.min ?? a.min_temp ?? ""}:${a.max ?? a.max_temp ?? ""}:${a.step ?? a.target_temp_step ?? ""}`;
      }).join("|");
      if (sig === this._signature) return;
      this._signature = sig;
      if (this._dragging.size === 0) this._render();
    }

    getCardSize() { return 7; }
    getGridOptions() { return { columns: 12, rows: "auto", min_columns: 6 }; }

    _ents() {
      const c = this._config ?? {};
      if (!c.device || !this._hass) return c.entities ?? {};
      if (!this._detected) this._detected = detectEntities(this._hass, c.device);
      return { ...this._detected, ...c.entities };
    }
    _st(key) { const id = this._ents()[key]; return id ? this._hass?.states?.[id] ?? null : null; }
    _t(key) { return this._config?.labels?.[key] ?? STRINGS[lang(this._hass)]?.[key] ?? STRINGS.en[key] ?? key; }
    _fmt(value, digits = 0) {
      return value == null ? "—" : value.toLocaleString(lang(this._hass), { minimumFractionDigits: digits, maximumFractionDigits: digits });
    }

    // Setpoint model shared by number, input_number and climate entities.
    _setpoint(which) {
      const id = this._ents()[`${which}_setpoint`], st = id ? this._hass.states[id] : null;
      if (!st || ["unknown", "unavailable"].includes(st.state)) return null;
      const domain = id.split(".")[0], a = st.attributes ?? {};
      if (domain === "climate") {
        const value = num(a.temperature);
        if (value == null) return null;
        return { id, domain, value, min: num(a.min_temp) ?? value - 10, max: num(a.max_temp) ?? value + 10,
          step: num(a.target_temp_step) ?? 1, unit: a.temperature_unit ?? this._hass.config?.unit_system?.temperature ?? "°C" };
      }
      const value = num(st.state);
      if (value == null) return null;
      return { id, domain, value, min: num(a.min) ?? 0, max: num(a.max) ?? 100, step: num(a.step) > 0 ? num(a.step) : 1,
        unit: a.unit_of_measurement ?? this._config.temperature_unit ?? "°C" };
    }
    _measured(which) {
      const st = this._st(`${which}_temperature`);
      if (st) {
        const v = num(st.state);
        return { value: v, unit: st.attributes?.unit_of_measurement ?? this._config.temperature_unit ?? "°C" };
      }
      const sp = this._st(`${which}_setpoint`);
      if (sp && sp.entity_id.startsWith("climate.")) {
        return { value: num(sp.attributes?.current_temperature), unit: sp.attributes?.temperature_unit ?? "°C" };
      }
      return null;
    }

    _setValue(which, raw) {
      const sp = this._setpoint(which), input = Number(raw);
      if (!sp || !Number.isFinite(input) || this._pending.has(which)) return;
      const value = Number(Math.min(sp.max, Math.max(sp.min, sp.min + Math.round((input - sp.min) / sp.step) * sp.step)).toFixed(4));
      if (value === sp.value) return;
      this._pending.add(which);
      const call = sp.domain === "climate"
        ? this._hass.callService("climate", "set_temperature", { entity_id: sp.id, temperature: value })
        : this._hass.callService(sp.domain, "set_value", { entity_id: sp.id, value });
      Promise.resolve(call).catch((e) => console.error("Fridge Card: set temperature", e)).finally(() => this._pending.delete(which));
    }

    _details() {
      const c = this._config, e = this._ents();
      if (c.detail_path) { history.pushState(null, "", c.detail_path); window.dispatchEvent(new Event("location-changed")); return; }
      const id = e.fridge_temperature ?? e.fridge_setpoint ?? e.freezer_temperature ?? e.freezer_setpoint;
      if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
    }

    _click(ev) {
      const item = ev.target.closest("[data-action]");
      if (!item || item.disabled) return;
      if (item.dataset.action === "details") { this._details(); return; }
      if (item.dataset.action === "step") {
        const sp = this._setpoint(item.dataset.which);
        if (sp) this._setValue(item.dataset.which, sp.value + Number(item.dataset.delta) * sp.step);
        return;
      }
      if (item.dataset.action === "toggle") {
        const id = item.dataset.entity, domain = id?.split(".")[0];
        if (["switch", "input_boolean"].includes(domain) && this._hass.states[id]) {
          Promise.resolve(this._hass.callService(domain, "toggle", { entity_id: id })).catch((err) => console.error("Fridge Card: toggle", err));
        }
      }
    }

    _dial(which) {
      const c = this._config, name = this._t(which === "fridge" ? "refrigerator" : "freezer");
      const sp = this._setpoint(which), measured = this._measured(which);
      const color = cssColor(c.colors?.[which], "var(--fridge-action)");
      const measuredLine = c.show_measured !== false && measured && sp
        ? `<p class="current"><ha-icon icon="mdi:thermometer"></ha-icon>${esc(this._fmt(measured.value, 1))} ${esc(measured.unit)}</p>` : "";
      let body;
      if (sp) {
        const mode = c.appearance?.cooling_arc === false ? "start" : "end";
        body = `<ha-control-circular-slider data-which="${which}" mode="${mode}" prevent-interaction-on-scroll></ha-control-circular-slider><div class="ring"></div>
          <div class="info"><ha-big-number class="target-number" data-which="${which}"></ha-big-number>${measuredLine}</div>
          <div class="buttons"><ha-outlined-icon-button data-action="step" data-which="${which}" data-delta="-1" aria-label="${esc(name)} −" ${sp.value <= sp.min ? "disabled" : ""}><ha-svg-icon data-icon="minus"></ha-svg-icon></ha-outlined-icon-button><ha-outlined-icon-button data-action="step" data-which="${which}" data-delta="1" aria-label="${esc(name)} +" ${sp.value >= sp.max ? "disabled" : ""}><ha-svg-icon data-icon="plus"></ha-svg-icon></ha-outlined-icon-button></div>`;
      } else if (measured?.value != null) {
        body = `<div class="ring static"></div><div class="info"><ha-big-number class="target-number" data-which="${which}" data-measured="1"></ha-big-number><p class="current"><ha-icon icon="mdi:thermometer"></ha-icon>${esc(this._t("measured"))}</p></div>`;
      } else {
        body = `<div class="ring static"></div><div class="info"><span class="target-fallback">${esc(this._t("unavailable"))}</span></div>`;
      }
      return `<div class="temperature"><p class="name">${esc(name)}</p><div class="container" style="--state-color:${esc(color)}">${body}</div></div>`;
    }

    _render() {
      if (!this._config || !this._hass) return;
      const c = this._config, e = this._ents(), hass = this._hass;
      const accent = cssColor(c.colors?.accent, "var(--primary-color,#03a9f4)");
      const cardStyle = [
        `--fridge-action:${accent}`,
        `--fridge-warning:${cssColor(c.colors?.warning, "var(--error-color,#db4437)")}`,
        `--fridge-caution:${cssColor(c.colors?.caution, "var(--warning-color,#ffa600)")}`,
        `--fridge-track:${cssColor(c.colors?.track, "var(--disabled-color,#bdbdbd)")}`,
        `--fridge-text:${cssColor(c.colors?.text, "var(--primary-text-color)")}`,
        `--fridge-dial-size:${clamp(c.appearance?.dial_size, 300, 120, 500)}px`,
        `--fridge-dial-gap:${clamp(c.appearance?.dial_gap, 0, 0, 40)}px`,
        `--fridge-button-size:${clamp(c.appearance?.button_size, 32, 24, 60)}px`,
        `--fridge-mode-height:${clamp(c.appearance?.mode_height, 57, 30, 110)}px`,
        `--fridge-mode-icon-size:${clamp(c.appearance?.mode_icon_size, 22, 12, 44)}px`,
      ];
      const zones = ["fridge", "freezer"].filter((w) => e[`${w}_setpoint`] || e[`${w}_temperature`]);
      if (!zones.length) {
        this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card style="${esc(cardStyle.join(";"))}"><div class="setup"><ha-icon icon="mdi:fridge-outline"></ha-icon><div>${esc(this._t("setup"))}</div></div></ha-card>`;
        return;
      }

      // Alerts: doors, then temperatures (thresholds follow the sensor's unit).
      const fahrenheit = (w) => /f/i.test(this._measured(w)?.unit ?? "");
      const doorOpen = ["fridge_door", "freezer_door", "door"].some((k) => this._st(k)?.state === "on");
      const temp = (w) => this._measured(w)?.value;
      const fw = num(c.fridge_warn) ?? (fahrenheit("fridge") ? 45 : 7);
      const fc = num(c.fridge_caution) ?? (fahrenheit("fridge") ? 41 : 5);
      const zw = num(c.freezer_warn) ?? (fahrenheit("freezer") ? 5 : -15);
      const tooWarm = (temp("fridge") != null && temp("fridge") > fw) || (temp("freezer") != null && temp("freezer") > zw);
      const caution = !tooWarm && temp("fridge") != null && temp("fridge") > fc;
      const statusCls = doorOpen || tooWarm ? "alert" : caution ? "caution" : "";
      const statusIcon = doorOpen ? "mdi:door-open" : tooWarm ? "mdi:thermometer-alert" : caution ? "mdi:alert-outline" : "mdi:door-closed";
      const statusText = doorOpen ? this._t("door_open") : tooWarm ? this._t("attention") : caution ? this._t("caution") : this._t("doors_closed");
      const showDoors = c.show_doors !== false && (e.fridge_door || e.freezer_door || e.door || tooWarm || caution);

      const right = [];
      const power = this._st("power");
      if (c.show_power !== false && power) right.push(`<ha-icon icon="mdi:flash-outline"></ha-icon><strong>${esc(this._fmt(num(power.state)))} ${esc(power.attributes?.unit_of_measurement ?? "W")}</strong>`);
      if (c.show_filter !== false) {
        const alertOn = this._st("filter_alert")?.state === "on";
        const life = num(this._st("filter_life")?.state), usage = num(this._st("filter_usage")?.state);
        const used = usage ?? (life != null ? 100 - life : null);
        if (alertOn) right.push(`<span class="alert"><ha-icon icon="mdi:air-filter"></ha-icon>${esc(this._t("filter_replace"))}</span>`);
        else if (used != null) right.push(`${right.length ? " · " : ""}${esc(this._t("filter"))} ${Math.round(used)} %`);
      }
      const metadata = showDoors || right.length
        ? `<div class="metadata">${showDoors ? `<span class="${statusCls}"><ha-icon icon="${statusIcon}"></ha-icon><strong>${esc(statusText)}</strong></span>` : "<span></span>"}${right.length ? `<span>${right.join("")}</span>` : ""}</div>` : "";

      // Modes
      const order = String(c.mode_order ?? "quick_cool,quick_freeze,ice").split(",").map((x) => x.trim());
      const builtIn = ["quick_cool", "quick_freeze", "ice"].filter((k) => e[k])
        .map((k) => ({ key: k, entity: e[k], label: this._t(k), icon: c.mode_icons?.[k] ?? MODE_ICONS[k] }));
      const extra = (Array.isArray(c.extra_modes) ? c.extra_modes : [])
        .filter((m) => /^(switch|input_boolean)\.[a-z0-9_]+$/.test(m?.entity ?? ""))
        .map((m) => ({ key: "", entity: m.entity, label: m.label ?? hass.states[m.entity]?.attributes?.friendly_name ?? m.entity, icon: m.icon ?? "mdi:power" }));
      const modes = [...builtIn, ...extra].sort((a, b) => {
        const x = order.indexOf(a.key), y = order.indexOf(b.key);
        return (x < 0 ? 999 : x) - (y < 0 ? 999 : y);
      });
      const modesHtml = c.show_modes !== false && modes.length
        ? `<div class="modes">${modes.map((m) => {
          const st = hass.states[m.entity], active = st?.state === "on", off = !st || st.state === "unavailable";
          const icon = /^[a-z]+:[a-z0-9-]+$/.test(m.icon) ? m.icon : "mdi:power";
          return `<button class="mode ${active ? "active" : ""}" data-action="toggle" data-entity="${esc(m.entity)}" aria-pressed="${active}" ${off ? "disabled" : ""}><ha-icon icon="${esc(icon)}"></ha-icon><span>${esc(m.label)}</span></button>`;
        }).join("")}</div>` : "";

      const name = c.name ?? (deviceName(hass, c.device) || this._t("refrigerator"));
      const header = c.show_header !== false
        ? `<div class="header"><span>${esc(name)}</span><button class="menu" data-action="details" aria-label="${esc(this._t("details"))}" title="${esc(this._t("details"))}"><ha-icon icon="mdi:dots-vertical"></ha-icon></button></div>` : "";
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card style="${esc(cardStyle.join(";"))}">${header}<div class="twin" style="--fridge-dials:${zones.length}">${zones.map((w) => this._dial(w)).join("")}</div>${metadata}${modesHtml}</ha-card>`;
      this._wire();
    }

    // Native elements get their values as properties, as Home Assistant's thermostat card does.
    _wire() {
      const c = this._config;
      for (const slider of this.shadowRoot.querySelectorAll("ha-control-circular-slider")) {
        const which = slider.dataset.which, sp = this._setpoint(which), m = this._measured(which);
        if (!sp) continue;
        Object.assign(slider, { value: sp.value, min: sp.min, max: sp.max, step: sp.step, current: m?.value ?? undefined,
          mode: c.appearance?.cooling_arc === false ? "start" : "end", inactive: false, preventInteractionOnScroll: true,
          label: this._t(which === "fridge" ? "refrigerator" : "freezer") });
        slider.formatValue = (v) => `${v} ${sp.unit}`;
        slider.addEventListener("value-changing", (ev) => {
          const v = ev.detail?.value;
          if (typeof v !== "number") return;
          this._dragging.add(which);
          const big = this.shadowRoot.querySelector(`ha-big-number[data-which="${which}"]`);
          if (big) big.value = v;
        });
        slider.addEventListener("value-changed", (ev) => { this._dragging.delete(which); this._setValue(which, ev.detail?.value); });
      }
      for (const icon of this.shadowRoot.querySelectorAll("ha-svg-icon[data-icon]")) icon.path = ICON_PATHS[icon.dataset.icon];
      for (const big of this.shadowRoot.querySelectorAll("ha-big-number")) {
        const which = big.dataset.which;
        if (big.dataset.measured) {
          const m = this._measured(which);
          Object.assign(big, { value: m?.value, unit: m?.unit, formatOptions: { maximumFractionDigits: 1, minimumFractionDigits: 0 } });
        } else {
          const sp = this._setpoint(which), decimals = sp && sp.step < 1 ? 1 : 0;
          if (sp) Object.assign(big, { value: sp.value, unit: sp.unit, formatOptions: { maximumFractionDigits: decimals, minimumFractionDigits: decimals } });
        }
      }
    }
  }
  customElements.define(TYPE, FridgeCard);

  /* ------------------------------------------------------------------ */
  /* Visual editor                                                       */
  /* ------------------------------------------------------------------ */

  const EDITOR_STRINGS = {
    en: {
      device: "Device", device_helper: "Entities are found automatically. You can adjust them below.",
      detected: "{count} entities found on this device.", missing: "No temperature found on this device. Pick the entities below.",
      name: "Name", detail_path: "Details link (view path, optional)",
      sec_display: "Display", sec_entities: "Entities", sec_modes: "Mode buttons", sec_colors: "Colors", sec_layout: "Layout",
      sec_thresholds: "Alerts", sec_labels: "Texts",
      show_header: "Title", show_measured: "Measured temperature", show_doors: "Doors and alerts", show_power: "Power",
      show_filter: "Filter", show_modes: "Mode buttons",
      e_fridge_temperature: "Refrigerator temperature", e_fridge_setpoint: "Refrigerator setpoint (number or climate)",
      e_freezer_temperature: "Freezer temperature", e_freezer_setpoint: "Freezer setpoint (number or climate)",
      e_fridge_door: "Refrigerator door", e_freezer_door: "Freezer door", e_door: "Door (single)", e_power: "Power",
      e_filter_usage: "Filter used (%)", e_filter_life: "Filter life left (%)", e_filter_alert: "Filter alert",
      e_quick_cool: "Power cool switch", e_quick_freeze: "Power freeze switch", e_ice: "Ice maker switch",
      mi_quick_cool: "Power cool icon", mi_quick_freeze: "Power freeze icon", mi_ice: "Ice icon",
      mode_order: "Order (comma separated: quick_cool, quick_freeze, ice)", xm_entity: "Extra mode {n}", xm_label: "Name", xm_icon: "Icon",
      c_accent: "Dials and active modes", c_fridge: "Refrigerator dial", c_freezer: "Freezer dial", c_track: "Dial track",
      c_text: "Numbers", c_warning: "Alert", c_caution: "Warning",
      a_dial_size: "Maximum dial size", a_dial_gap: "Space between dials", a_button_size: "± button size",
      a_mode_height: "Mode button height", a_mode_icon_size: "Mode icon size", a_cooling_arc: "Cooling arc (fills from the target towards warmer)",
      temperature_unit: "Unit when the entity has none", fridge_warn: "Refrigerator too warm above", fridge_caution: "Refrigerator to watch above",
      freezer_warn: "Freezer too warm above", thresholds_helper: "In the unit of your sensors. Empty: 7 / 5 / −15 °C (45 / 41 / 5 °F).",
    },
    fr: {
      device: "Appareil", device_helper: "Les entités sont trouvées automatiquement. Vous pouvez les ajuster plus bas.",
      detected: "{count} entités trouvées sur cet appareil.", missing: "Aucune température trouvée sur cet appareil. Choisissez les entités plus bas.",
      name: "Nom", detail_path: "Lien des détails (chemin d’une vue, facultatif)",
      sec_display: "Affichage", sec_entities: "Entités", sec_modes: "Boutons de modes", sec_colors: "Couleurs", sec_layout: "Disposition",
      sec_thresholds: "Alertes", sec_labels: "Textes",
      show_header: "Titre", show_measured: "Température mesurée", show_doors: "Portes et alertes", show_power: "Puissance",
      show_filter: "Filtre", show_modes: "Boutons de modes",
      e_fridge_temperature: "Température du réfrigérateur", e_fridge_setpoint: "Consigne du réfrigérateur (nombre ou climat)",
      e_freezer_temperature: "Température du congélateur", e_freezer_setpoint: "Consigne du congélateur (nombre ou climat)",
      e_fridge_door: "Porte du réfrigérateur", e_freezer_door: "Porte du congélateur", e_door: "Porte (unique)", e_power: "Puissance",
      e_filter_usage: "Usure du filtre (%)", e_filter_life: "Durée de vie restante du filtre (%)", e_filter_alert: "Alerte filtre",
      e_quick_cool: "Interrupteur Froid+", e_quick_freeze: "Interrupteur Congél+", e_ice: "Interrupteur glaçons",
      mi_quick_cool: "Icône Froid+", mi_quick_freeze: "Icône Congél+", mi_ice: "Icône glaçons",
      mode_order: "Ordre (séparé par des virgules : quick_cool, quick_freeze, ice)", xm_entity: "Mode supplémentaire {n}", xm_label: "Nom", xm_icon: "Icône",
      c_accent: "Cadrans et modes actifs", c_fridge: "Cadran du réfrigérateur", c_freezer: "Cadran du congélateur", c_track: "Piste des cadrans",
      c_text: "Chiffres", c_warning: "Alerte", c_caution: "Vigilance",
      a_dial_size: "Taille maximale des cadrans", a_dial_gap: "Espace entre les cadrans", a_button_size: "Taille des boutons ±",
      a_mode_height: "Hauteur des boutons de modes", a_mode_icon_size: "Taille des icônes de modes", a_cooling_arc: "Arc de refroidissement (se remplit de la consigne vers le plus chaud)",
      temperature_unit: "Unité si l’entité n’en a pas", fridge_warn: "Réfrigérateur trop chaud au-dessus de", fridge_caution: "Réfrigérateur à surveiller au-dessus de",
      freezer_warn: "Congélateur trop chaud au-dessus de", thresholds_helper: "Dans l’unité de vos capteurs. Vide : 7 / 5 / −15 °C (45 / 41 / 5 °F).",
    },
  };
  const ENTITY_FIELDS = [
    ["fridge_temperature", ["sensor"]], ["fridge_setpoint", ["number", "input_number", "climate"]],
    ["freezer_temperature", ["sensor"]], ["freezer_setpoint", ["number", "input_number", "climate"]],
    ["fridge_door", ["binary_sensor"]], ["freezer_door", ["binary_sensor"]], ["door", ["binary_sensor"]],
    ["power", ["sensor"]], ["filter_usage", ["sensor"]], ["filter_life", ["sensor"]], ["filter_alert", ["binary_sensor"]],
    ["quick_cool", ["switch", "input_boolean"]], ["quick_freeze", ["switch", "input_boolean"]], ["ice", ["switch", "input_boolean"]],
  ];
  const SHOW = ["show_header", "show_measured", "show_doors", "show_power", "show_filter", "show_modes"];
  const COLORS = [["accent", "primary"], ["fridge", ""], ["freezer", ""], ["track", ""], ["text", ""], ["warning", "red"], ["caution", "amber"]];
  const LAYOUT = [["dial_size", 120, 500, 10], ["dial_gap", 0, 40, 1], ["button_size", 24, 60, 1], ["mode_height", 30, 110, 1], ["mode_icon_size", 12, 44, 1]];
  const EXTRA_ROWS = 4;

  class FridgeCardEditor extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._config = {}; }
    setConfig(config) { this._config = JSON.parse(JSON.stringify(config ?? {})); this._update(); }
    set hass(hass) { const first = !this._hass; this._hass = hass; if (first) this._update(); else if (this._form) this._form.hass = hass; }
    _e(key, vars) {
      let s = EDITOR_STRINGS[lang(this._hass)]?.[key] ?? EDITOR_STRINGS.en[key] ?? key;
      for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, v);
      return s;
    }
    _schema() {
      const extras = Math.min(EXTRA_ROWS, (this._config.extra_modes?.length ?? 0) + 1);
      return [
        { name: "device", selector: { device: {} } },
        { type: "grid", name: "", schema: [{ name: "name", selector: { text: {} } }, { name: "detail_path", selector: { text: {} } }] },
        { type: "expandable", name: "", flatten: true, title: this._e("sec_display"), icon: "mdi:eye-outline",
          schema: [{ type: "grid", name: "", column_min_width: "200px", schema: SHOW.map((k) => ({ name: k, selector: { boolean: {} } })) }] },
        { type: "expandable", name: "entities", title: this._e("sec_entities"), icon: "mdi:format-list-bulleted-type",
          schema: ENTITY_FIELDS.map(([k, domains]) => ({ name: k, selector: { entity: { filter: { domain: domains } } } })) },
        { type: "expandable", name: "", flatten: true, title: this._e("sec_modes"), icon: "mdi:gesture-tap-button",
          schema: [
            { type: "grid", name: "", schema: ["quick_cool", "quick_freeze", "ice"].map((k) => ({ name: `mi__${k}`, selector: { icon: { placeholder: MODE_ICONS[k] } } })) },
            { name: "mode_order", selector: { text: {} } },
            ...Array.from({ length: extras }, (_, i) => ({ type: "grid", name: "", column_min_width: "120px", schema: [
              { name: `xm${i}__entity`, selector: { entity: { filter: { domain: ["switch", "input_boolean"] } } } },
              { name: `xm${i}__label`, selector: { text: {} } },
              { name: `xm${i}__icon`, selector: { icon: {} } },
            ] })),
          ] },
        { type: "expandable", name: "colors", title: this._e("sec_colors"), icon: "mdi:palette-outline",
          schema: [{ type: "grid", name: "", schema: COLORS.map(([k, def]) => ({ name: k, selector: { ui_color: def ? { default_color: def } : {} } })) }] },
        { type: "expandable", name: "", flatten: true, title: this._e("sec_layout"), icon: "mdi:page-layout-body",
          schema: [
            ...LAYOUT.map(([k, min, max, step]) => ({ name: `ap__${k}`, selector: { number: { min, max, step, mode: "slider", unit_of_measurement: "px" } } })),
            { name: "ap__cooling_arc", selector: { boolean: {} } },
            { name: "temperature_unit", selector: { select: { mode: "dropdown", options: ["°C", "°F"] } } },
          ] },
        { type: "expandable", name: "", flatten: true, title: this._e("sec_thresholds"), icon: "mdi:thermometer-alert",
          schema: [{ type: "grid", name: "", schema: ["fridge_warn", "fridge_caution", "freezer_warn"].map((k) => ({ name: k, selector: { number: { min: -50, max: 60, step: 0.5, mode: "box" } } })) }] },
        { type: "expandable", name: "labels", title: this._e("sec_labels"), icon: "mdi:translate",
          schema: [{ type: "grid", name: "", schema: LABEL_KEYS.map((k) => ({ name: k, selector: { text: {} } })) }] },
      ];
    }
    _data() {
      const c = this._config, data = { ...c };
      for (const k of SHOW) data[k] = c[k] ?? true;
      for (const k of ["quick_cool", "quick_freeze", "ice"]) data[`mi__${k}`] = c.mode_icons?.[k] ?? "";
      (c.extra_modes ?? []).forEach((m, i) => { data[`xm${i}__entity`] = m.entity; data[`xm${i}__label`] = m.label ?? ""; data[`xm${i}__icon`] = m.icon ?? ""; });
      for (const [k] of LAYOUT) data[`ap__${k}`] = c.appearance?.[k];
      data.ap__cooling_arc = c.appearance?.cooling_arc ?? true;
      return data;
    }
    _label(schema) {
      const n = schema.name;
      const xm = /^xm(\d)__(entity|label|icon)$/.exec(n);
      if (xm) return this._e(`xm_${xm[2]}`, { n: Number(xm[1]) + 1 });
      if (n.startsWith("mi__")) return this._e(`mi_${n.slice(4)}`);
      if (n.startsWith("ap__")) return this._e(`a_${n.slice(4)}`);
      if (schema.selector?.entity && ENTITY_FIELDS.some(([k]) => k === n)) return this._e(`e_${n}`);
      if (schema.selector?.ui_color) return this._e(`c_${n}`);
      if (LABEL_KEYS.includes(n) && schema.selector?.text && !["name"].includes(n)) return STRINGS[lang(this._hass)]?.[n] ?? STRINGS.en[n];
      return this._e(n);
    }
    _helper(schema) {
      if (schema.name === "device") return this._e("device_helper");
      if (schema.name === "freezer_warn") return this._e("thresholds_helper");
      return undefined;
    }
    _changed(ev) {
      ev.stopPropagation();
      const v = ev.detail.value, prev = this._config, next = {};
      for (const [k, val] of Object.entries(v)) if (!/^(mi|ap|xm\d)__/.test(k)) next[k] = val;
      for (const k of SHOW) if (next[k] === true) delete next[k];
      const icons = {};
      for (const k of ["quick_cool", "quick_freeze", "ice"]) if (v[`mi__${k}`]) icons[k] = v[`mi__${k}`];
      if (Object.keys(icons).length) next.mode_icons = icons; else delete next.mode_icons;
      const extra = [];
      for (let i = 0; i < EXTRA_ROWS; i++) {
        const entity = v[`xm${i}__entity`];
        if (!entity) continue;
        const m = { entity };
        if (v[`xm${i}__label`]) m.label = v[`xm${i}__label`];
        if (v[`xm${i}__icon`]) m.icon = v[`xm${i}__icon`];
        extra.push(m);
      }
      if (extra.length) next.extra_modes = extra; else delete next.extra_modes;
      const appearance = { ...(prev.appearance ?? {}) };
      for (const [k] of LAYOUT) { if (v[`ap__${k}`] == null || v[`ap__${k}`] === "") delete appearance[k]; else appearance[k] = v[`ap__${k}`]; }
      if (v.ap__cooling_arc === false) appearance.cooling_arc = false; else delete appearance.cooling_arc;
      if (Object.keys(appearance).length) next.appearance = appearance; else delete next.appearance;
      for (const k of ["entities", "colors", "labels"]) {
        if (next[k] && typeof next[k] === "object") {
          for (const [kk, vv] of Object.entries(next[k])) if (vv === "" || vv == null) delete next[k][kk];
          if (!Object.keys(next[k]).length && k !== "entities") delete next[k];
        }
      }
      for (const k of ["name", "detail_path", "device", "mode_order", "temperature_unit"]) if (!next[k]) delete next[k];
      for (const k of ["fridge_warn", "fridge_caution", "freezer_warn"]) if (next[k] == null || next[k] === "") delete next[k];
      if (next.device && next.device !== prev.device) {
        next.entities = detectEntities(this._hass, next.device);
        this._detectedCount = Object.keys(next.entities).length;
      }
      next.type = prev.type ?? `custom:${TYPE}`;
      this._config = next;
      this._update();
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
    }
    _update() {
      if (!this._hass) return;
      if (!this._form) {
        this.shadowRoot.innerHTML = `<style>:host{display:block}ha-alert{display:block;margin-bottom:12px}</style><div id="alert"></div><ha-form></ha-form>`;
        this._form = this.shadowRoot.querySelector("ha-form");
        this._form.computeLabel = (s) => this._label(s);
        this._form.computeHelper = (s) => this._helper(s);
        this._form.addEventListener("value-changed", (ev) => this._changed(ev));
      }
      this._form.hass = this._hass;
      this._form.schema = this._schema();
      this._form.data = this._data();
      const alert = this.shadowRoot.getElementById("alert"), e = this._config.entities ?? {};
      if (this._config.device) {
        const any = ["fridge_temperature", "freezer_temperature", "fridge_setpoint", "freezer_setpoint"].some((k) => e[k]);
        alert.innerHTML = !any ? `<ha-alert alert-type="warning">${esc(this._e("missing"))}</ha-alert>`
          : this._detectedCount ? `<ha-alert alert-type="success">${esc(this._e("detected", { count: this._detectedCount }))}</ha-alert>` : "";
      } else alert.innerHTML = "";
    }
  }
  customElements.define(EDITOR, FridgeCardEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: TYPE,
    name: "Fridge Card",
    description: "Refrigerator and freezer thermostats with doors, filter and quick modes.",
    preview: true,
    documentationURL: "https://github.com/Sr-0w/lovelace-fridge-card",
  });
  console.info(`%c FRIDGE-CARD %c ${VERSION} `, "color:#fff;background:#03a9f4;font-weight:700", "color:#03a9f4;background:#222");
})();
