/* Fridge Card — MIT, 2026. Experimental version; validate on a real Home Assistant instance before releasing. */
(function FridgeCardModule() {
  const TYPE = "fridge-card";
  if (customElements.get(TYPE)) return;
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const svg = (body, size=20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  const icons = {
    fridge: '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 11h14M8 6.5v2.5M8 14v2.5"/>',
    snow: '<path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1M9 5l3-3 3 3M9 19l3 3 3-3"/>',
    cube: '<path d="m12 2 9 5v10l-9 5-9-5V7l9-5ZM3 7l9 5 9-5M12 12v10"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7V2"/>',
    door: '<rect x="5" y="2" width="14" height="20" rx="1"/><path d="M15.5 12h.01"/>',
    alert: '<path d="M12 3 2.5 20h19L12 3ZM12 9v5M12 17h.01"/>'
  };
  const style = `
    :host{display:block;--fc-green:#51d99a;--fc-blue:#6abdf0;--fc-amber:#f5b14e;--fc-red:#fb7379}
    *{box-sizing:border-box}
    ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#1b1b1b));border:1px solid var(--divider-color,#393939);border-radius:17px;overflow:hidden;color:var(--primary-text-color,#fafafa);box-shadow:none}
    .head{height:53px;display:flex;align-items:center;gap:12px;padding:10px 15px 9px;border-bottom:1px solid var(--divider-color,#343434)}
    .title-ico{width:33px;height:33px;display:grid;place-items:center;border-radius:10px;background:color-mix(in srgb,var(--fc-green) 12%,transparent);color:var(--fc-green)}
    .title{font-size:15px;font-weight:650;letter-spacing:.01em}
    .status{color:var(--secondary-text-color,#aaa);font-size:11px;font-weight:550;display:flex;align-items:center;gap:5px;margin-top:2px}
    .dot{height:6px;width:6px;border-radius:50%;background:var(--status);box-shadow:0 0 7px color-mix(in srgb,var(--status) 55%,transparent)}
    .details{margin-left:auto;border:0;background:transparent;color:var(--secondary-text-color,#aaa);padding:8px;cursor:pointer;border-radius:8px;display:grid;place-items:center}
    .details:hover,.action:hover{filter:brightness(1.15)}
    .hero{display:grid;grid-template-columns:116px 1fr;align-items:center;gap:14px;padding:17px 18px 15px;min-height:150px}
    .appliance{height:134px;width:108px;margin:auto;position:relative;border:2px solid #666;border-radius:14px;background:linear-gradient(110deg,#31343a,#1e232a 64%,#282e35);box-shadow:inset 3px 1px 14px #0006,4px 8px 15px #0003;overflow:hidden}
    .appliance:after{content:"";position:absolute;top:51%;width:100%;height:2px;background:#555}
    .handle1,.handle2{position:absolute;right:9px;width:3px;height:23px;background:#777;border-radius:3px}
    .handle1{top:15px}.handle2{top:78px}
    .glow1,.glow2{position:absolute;inset:8px 9px auto;height:54px;border-radius:7px;background:linear-gradient(140deg,rgba(89,195,242,.12),transparent);border-left:2px solid rgba(106,189,240,.4)}
    .glow2{top:75px;height:47px;background:linear-gradient(140deg,rgba(109,220,213,.13),transparent);border-left-color:rgba(109,220,213,.4)}
    .temperatures{display:flex;flex-direction:column;gap:10px;min-width:0}.tempblock{display:flex;flex-direction:column}
    .temp-head{color:var(--secondary-text-color,#aaa);text-transform:uppercase;letter-spacing:.1em;font-size:10px;font-weight:700}
    .tempval{font-size:clamp(24px,5vw,34px);font-weight:550;letter-spacing:-.035em;line-height:1.22;white-space:nowrap;font-variant-numeric:tabular-nums}
    .tempval span{font-size:13px;color:var(--secondary-text-color,#aaa);margin-left:3px}
    .tempval.fr{color:var(--fc-blue)}.tempval.frz{color:#a4d9e5}
    .separator{width:100%;height:1px;background:var(--divider-color,#383838)}
    .metrics{display:flex;gap:6px;padding:0 14px 12px;align-items:center;justify-content:space-between;color:var(--secondary-text-color,#aaa);font-size:11px}
    .metric{display:flex;align-items:center;gap:5px;white-space:nowrap}.metric strong{color:var(--primary-text-color,#eee);font-weight:650}
    .metric.alert{color:var(--fc-red)}
    .actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;border-top:1px solid var(--divider-color,#363636);padding:10px 12px 12px}
    .action{background:var(--secondary-background-color,#2b2b2b);color:var(--secondary-text-color,#b8b8b8);height:45px;border:1px solid var(--divider-color,#383838);border-radius:11px;display:flex;gap:5px;justify-content:center;align-items:center;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;transition:background .15s,transform .15s}
    .action:active{transform:scale(.97)}.action.active{color:var(--fc-green);background:color-mix(in srgb,var(--fc-green) 10%,var(--secondary-background-color,#272727));border-color:color-mix(in srgb,var(--fc-green) 35%,transparent)}
    .action:disabled{opacity:.3;cursor:default}
    @media(max-width:355px){.hero{grid-template-columns:85px 1fr;gap:9px}.appliance{width:77px;height:119px}.actions{padding-left:8px;padding-right:8px}.action{font-size:10px}.metric{font-size:10px}}
  `;
  class FridgeCard extends HTMLElement {
    constructor(){super();this.attachShadow({mode:"open"});this.shadowRoot.addEventListener("click",e=>this._click(e));}
    setConfig(config){if(!config?.entities||(!config.entities.fridge_temperature&&!config.entities.freezer_temperature))throw Error("Fridge Card: a temperature sensor is required");this._config=config;this._signature="";this._render();}
    set hass(hass){this._hass=hass;const keys=Object.values(this._config?.entities??{}).filter(v=>typeof v==="string");const sig=keys.map(id=>`${id}:${hass.states[id]?.state??""}`).join("|");if(sig!==this._signature){this._signature=sig;this._render();}}
    getCardSize(){return 5;}
    getGridOptions(){return {columns:12,rows:5,min_rows:4};}
    static getStubConfig(){return {name:"Refrigerator",entities:{fridge_temperature:"sensor.fridge_temperature",freezer_temperature:"sensor.freezer_temperature"}};}
    _state(key){const id=this._config?.entities?.[key];return id?this._hass?.states?.[id]??null:null;}
    _num(key,dec=0){const state=this._state(key);const value=Number(state?.state);return state&&Number.isFinite(value)?value.toLocaleString(this._hass?.locale?.language??"en",{minimumFractionDigits:dec,maximumFractionDigits:dec}):"—";}
    _on(key){return this._state(key)?.state==="on";}
    _moreInfo(id){if(id)this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:id},bubbles:true,composed:true}));}
    _click(event){const target=event.target.closest("[data-action]");if(!target)return;const action=target.dataset.action;if(action==="details"){if(this._config?.detail_path){history.pushState(null,"",this._config.detail_path);window.dispatchEvent(new Event("location-changed"));}else this._moreInfo(this._config?.entities?.fridge_temperature??this._config?.entities?.freezer_temperature);return;}if(action==="toggle"){const id=this._config?.entities?.[target.dataset.key];if(!id||!this._hass?.states?.[id])return;this._hass.callService("switch","toggle",{entity_id:id}).catch(e=>console.error("Fridge Card:",e));}}
    _render(){
      if(!this._hass||!this._config)return;
      const c=this._config;
      const door=this._on("fridge_door")||this._on("freezer_door");
      const fr=Number(this._state("fridge_temperature")?.state),fz=Number(this._state("freezer_temperature")?.state);
      const unsafe=door||(Number.isFinite(fr)&&fr>(c.fridge_warn??7))||(Number.isFinite(fz)&&fz>(c.freezer_warn??-15));
      const status=unsafe?"Alert":Number.isFinite(fr)&&fr>(c.fridge_caution??5)?"Caution":"Normal";
      const color=unsafe?"var(--fc-red)":status==="Normal"?"var(--fc-green)":"var(--fc-amber)";
      const actions=[["quick_cool","Power cool",icons.snow],["quick_freeze","Power freeze",icons.snow],["ice","Ice",icons.cube]].filter(([key])=>!!c.entities[key]);
      const filter=Number(this._state("filter_usage")?.state);
      const filterText=this._state("filter_usage")&&Number.isFinite(filter)?` · Filter ${Math.round(filter)}%`:"";
      const labels={normal:c.labels?.normal??"Normal",alert:c.labels?.alert??"Alert",caution:c.labels?.caution??"Caution",doors_closed:c.labels?.doors_closed??"Doors closed",door_open:c.labels?.door_open??"Door open",power_cool:c.labels?.power_cool??"Power cool",power_freeze:c.labels?.power_freeze??"Power freeze",ice:c.labels?.ice??"Ice",refrigerator:c.labels?.refrigerator??"Refrigerator",freezer:c.labels?.freezer??"Freezer"};
      this.shadowRoot.innerHTML=`<style>${style}</style><ha-card style="--status:${color}"><div class="head"><div class="title-ico">${svg(icons.fridge)}</div><div><div class="title">${esc(c.name||"Refrigerator")}</div><div class="status"><i class="dot"></i>${esc(labels[status.toLowerCase()])}</div></div><button class="details" data-action="details" aria-label="Details">${svg(icons.chevron,19)}</button></div><div class="hero"><div class="appliance" aria-hidden="true"><div class="glow1"></div><div class="glow2"></div><div class="handle1"></div><div class="handle2"></div></div><div class="temperatures"><div class="tempblock"><div class="temp-head">${esc(labels.refrigerator)}</div><div class="tempval fr">${this._num("fridge_temperature",1)}<span>°C</span></div></div><div class="separator"></div><div class="tempblock"><div class="temp-head">${esc(labels.freezer)}</div><div class="tempval frz">${this._num("freezer_temperature")}<span>°C</span></div></div></div></div><div class="metrics"><span class="metric ${door?"alert":""}">${svg(door?icons.alert:icons.door,14)}<strong>${esc(door?labels.door_open:labels.doors_closed)}</strong></span><span class="metric">${svg(icons.bolt,14)}<strong>${this._num("power")} W</strong>${esc(filterText)}</span></div>${actions.length?`<div class="actions">${actions.map(([key,defaultName,path])=>`<button class="action ${this._on(key)?"active":""}" data-action="toggle" data-key="${key}" aria-pressed="${this._on(key)}">${svg(path,16)}${esc(labels[key]??defaultName)}</button>`).join("")}</div>`:""}</ha-card>`;
    }
  }
  customElements.define(TYPE,FridgeCard);
  window.customCards=window.customCards||[];
  window.customCards.push({type:TYPE,name:"Fridge Card",description:"Compact device-agnostic refrigerator card with configurable Home Assistant entities",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-fridge-card"});
})();
