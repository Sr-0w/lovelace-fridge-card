/* Fridge Card v0.3.0-dev — thermostat-style modes; MIT */
(function FridgeCardV2(){
  const TYPE="fridge-card";
  if(customElements.get(TYPE))return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const styles=`
    :host{display:block;--fc-green:#51d99a;--fc-blue:#6abdf0;--fc-amber:#f5b14e;--fc-red:#fb7379}
    *{box-sizing:border-box}
    ha-card{display:block;border:1px solid var(--divider-color,#353535);background:var(--ha-card-background,var(--card-background-color,#1b1b1b));border-radius:16px;overflow:hidden;color:var(--primary-text-color,#fafafa);box-shadow:none}
    .head{display:flex;align-items:center;gap:11px;padding:11px 14px;border-bottom:1px solid var(--divider-color,#353535)}
    .head-icon{height:34px;width:34px;background:color-mix(in srgb,var(--fc-green) 12%,transparent);color:var(--fc-green);border-radius:10px;display:grid;place-items:center}
    .title{font-weight:650;font-size:15px}.status{font-size:11px;color:var(--secondary-text-color,#aaa);margin-top:2px;display:flex;align-items:center;gap:5px}
    .status-dot{height:6px;width:6px;background:var(--status);border-radius:50%}
    .details{margin-left:auto;color:var(--secondary-text-color,#aaa);background:none;border:0;padding:8px;cursor:pointer}
    .hero{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:12px}
    .tempblock{min-width:0;background:var(--secondary-background-color,#252525);border:1px solid var(--divider-color,#393939);border-radius:12px;padding:11px 10px;display:flex;flex-direction:column;gap:7px}
    .temp-head{color:var(--secondary-text-color,#aaa);font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap}
    .tempval{font-size:30px;font-weight:600;line-height:1.18;letter-spacing:-.04em;font-variant-numeric:tabular-nums;white-space:nowrap}
    .tempval span{font-size:13px;color:var(--secondary-text-color,#aaa);letter-spacing:0;margin-left:2px}.tempval.fr{color:var(--fc-blue)}.tempval.frz{color:#addce5}
    .set-label{font-size:10px;color:var(--secondary-text-color,#aaa)}.setpoint{display:flex;align-items:center;justify-content:space-between;gap:3px}
    .setpoint-value{font-size:12px;font-weight:650;white-space:nowrap;font-variant-numeric:tabular-nums}
    .step{height:30px;min-width:30px;border:1px solid var(--divider-color,#454545);border-radius:9px;display:grid;place-items:center;background:var(--card-background-color,#222);color:var(--primary-text-color,#eee);font-size:20px;cursor:pointer;touch-action:manipulation}
    .step:disabled{opacity:.26;cursor:not-allowed}.step:not(:disabled):active{transform:scale(.94);background:color-mix(in srgb,var(--fc-blue) 12%,var(--card-background-color,#222))}
    .metrics{display:flex;justify-content:space-between;gap:7px;padding:0 13px 12px;color:var(--secondary-text-color,#aaa);font-size:11px}
    .metric{display:flex;align-items:center;gap:5px;min-width:0;white-space:nowrap}.metric strong{color:var(--primary-text-color,#eee);font-weight:650}.metric.alert strong{color:var(--fc-red)}

    .actions{margin:1px 12px 12px;padding:4px;background:var(--secondary-background-color,#292929);border:1px solid var(--divider-color,#3b3b3b);border-radius:13px;display:flex;gap:3px;overflow:hidden}
    .action{height:57px;flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color,#c0c0c0);font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;transition:background-color .15s,color .15s,transform .12s}
    .action ha-icon{--mdc-icon-size:23px!important}
    .action.active{color:#fff;background:var(--fc-active-color,#ff6a00);box-shadow:0 2px 7px rgba(0,0,0,.14)}
    .action:disabled{opacity:.35;cursor:not-allowed}
    .action:focus-visible{outline:2px solid var(--primary-color,#ff6a00);outline-offset:-2px}
    .action:active{transform:scale(.98)}
    @media(max-width:355px){.hero{gap:6px;padding:9px}.tempblock{padding:8px 6px}.tempval{font-size:25px}.step{height:26px;min-width:25px}.setpoint-value{font-size:11px}.action{font-size:10px;gap:2px}.metrics{font-size:10px}}
  `;
  class FridgeCard extends HTMLElement{
    constructor(){super();this.attachShadow({mode:"open"});this.shadowRoot.addEventListener("click",e=>this._click(e));}
    setConfig(config){if(!config?.entities||(!config.entities.fridge_temperature&&!config.entities.freezer_temperature))throw Error("Fridge Card: fridge_temperature or freezer_temperature is required");this._config=config;this._signature="";this._render();}
    set hass(hass){this._hass=hass;const ids=Object.values(this._config?.entities??{}).filter(x=>typeof x==="string");const signature=ids.map(id=>{const st=hass.states[id];return id+":"+(st?.state??"unknown")+":"+((id.startsWith("number."))?JSON.stringify({min:st?.attributes?.min,max:st?.attributes?.max,step:st?.attributes?.step}):"");}).join("|");if(signature!==this._signature){this._signature=signature;this._render();}}
    getCardSize(){return 5;}
    getGridOptions(){return {columns:12,rows:5,min_rows:4};}
    static getStubConfig(){return {name:"Refrigerator",entities:{fridge_temperature:"sensor.fridge_temperature",freezer_temperature:"sensor.freezer_temperature"}};}
    _state(key){const id=this._config?.entities?.[key];return id?this._hass?.states?.[id]??null:null;}
    _number(key,dec=0){const st=this._state(key),val=Number(st?.state);return st&&Number.isFinite(val)?val.toLocaleString(this._hass?.locale?.language??"en",{minimumFractionDigits:dec,maximumFractionDigits:dec}):"—";}
    _on(key){return this._state(key)?.state==="on";}
    _moreInfo(id){if(id)this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:id},bubbles:true,composed:true}));}
    _click(e){
      const button=e.target.closest("[data-action]");if(!button)return;
      const action=button.dataset.action;
      if(action==="details"){if(this._config.detail_path){history.pushState(null,"",this._config.detail_path);window.dispatchEvent(new Event("location-changed"));}else this._moreInfo(this._config.entities.fridge_temperature??this._config.entities.freezer_temperature);return;}
      if(action==="step"){
        const key=button.dataset.key,id=this._config.entities[key],st=this._state(key);
        if(!id?.startsWith("number.")||!st||!Number.isFinite(Number(st.state)))return;
        const a=st.attributes??{},current=Number(st.state),min=Number.isFinite(Number(a.min))?Number(a.min):-Infinity,max=Number.isFinite(Number(a.max))?Number(a.max):Infinity,step=Number(a.step)>0?Number(a.step):1,delta=Number(button.dataset.delta);
        if(delta!==1&&delta!==-1)return;
        const value=Number(Math.min(max,Math.max(min,current+step*delta)).toFixed(4));
        if(value===current)return;
        button.disabled=true;
        Promise.resolve(this._hass.callService("number","set_value",{entity_id:id,value})).catch(err=>console.error("Fridge Card: setpoint failed",err)).finally(()=>{if(button.isConnected)button.disabled=false;});
        return;
      }
      if(action==="toggle"){const id=this._config.entities[button.dataset.key];if(id?.startsWith("switch.")&&this._hass.states[id])Promise.resolve(this._hass.callService("switch","toggle",{entity_id:id})).catch(err=>console.error("Fridge Card: switch failed",err));}
    }
    _render(){
      if(!this._config||!this._hass)return;
      const c=this._config,door=this._on("fridge_door")||this._on("freezer_door"),fr=Number(this._state("fridge_temperature")?.state),fz=Number(this._state("freezer_temperature")?.state);
      const unknown=["fridge_temperature","freezer_temperature"].every(k=>!this._state(k)||["unknown","unavailable"].includes(this._state(k)?.state));
      const unsafe=door||(!unknown&&Number.isFinite(fr)&&fr>(c.fridge_warn??7))||(!unknown&&Number.isFinite(fz)&&fz>(c.freezer_warn??-15));
      const status=unknown?"unavailable":unsafe?"alert":(Number.isFinite(fr)&&fr>(c.fridge_caution??5))?"caution":"normal";
      const labels={normal:"Normal",alert:"Alert",caution:"Caution",unavailable:"Unavailable",door_open:"Door open",doors_closed:"Doors closed",refrigerator:"Refrigerator",freezer:"Freezer",setpoint:"Setpoint",quick_cool:"Power cool",quick_freeze:"Power freeze",ice:"Ice",...(c.labels??{})};
      const accent=status==="alert"?"var(--fc-red)":status==="caution"?"var(--fc-amber)":status==="unavailable"?"var(--secondary-text-color,#888)":"var(--fc-green)";
      const temperature=(sensorKey,setpointKey,label,css)=>{
        const st=this._state(setpointKey),id=c.entities[setpointKey],valid=!!st&&id?.startsWith("number.")&&Number.isFinite(Number(st.state));
        const a=st?.attributes??{},current=valid?Number(st.state):NaN,min=Number.isFinite(Number(a.min))?Number(a.min):-Infinity,max=Number.isFinite(Number(a.max))?Number(a.max):Infinity,step=Number(a.step)>0?Number(a.step):1;
        const control=valid?`<div class="set-label">${esc(labels.setpoint)}</div><div class="setpoint"><button class="step" data-action="step" data-key="${setpointKey}" data-delta="-1" aria-label="${esc(label)} −" ${current-step<min?"disabled":""}>−</button><span class="setpoint-value">${this._number(setpointKey)} °C</span><button class="step" data-action="step" data-key="${setpointKey}" data-delta="1" aria-label="${esc(label)} +" ${current+step>max?"disabled":""}>+</button></div>`:"";
        return `<div class="tempblock"><div class="temp-head">${esc(label)}</div><div class="tempval ${css}">${this._number(sensorKey,css==="fr"?1:0)}<span>°C</span></div>${control}</div>`;
      };
      const filterState=this._state("filter_usage"),filter=Number(filterState?.state),filterText=filterState&&Number.isFinite(filter)?` · ${Math.round(filter)}% filter`:"";
      const actions=[["quick_cool","mdi:snowflake-thermometer"],["quick_freeze","mdi:snowflake-alert"],["ice","mdi:cube-outline"]].filter(([key])=>c.entities[key]);
      this.shadowRoot.innerHTML=`<style>${styles}</style><ha-card style="--status:${accent}"><div class="head"><div class="head-icon"><ha-icon icon="mdi:fridge-outline"></ha-icon></div><div><div class="title">${esc(c.name??"Refrigerator")}</div><div class="status"><i class="status-dot"></i>${esc(labels[status])}</div></div><button class="details" data-action="details" aria-label="Details"><ha-icon icon="mdi:chevron-right"></ha-icon></button></div><div class="hero">${temperature("fridge_temperature","fridge_setpoint",labels.refrigerator,"fr")}${temperature("freezer_temperature","freezer_setpoint",labels.freezer,"frz")}</div><div class="metrics"><span class="metric ${door?"alert":""}"><ha-icon icon="${door?"mdi:door-open":"mdi:door-closed"}" style="--mdc-icon-size:15px"></ha-icon><strong>${esc(door?labels.door_open:labels.doors_closed)}</strong></span><span class="metric"><ha-icon icon="mdi:flash-outline" style="--mdc-icon-size:15px"></ha-icon><strong>${this._number("power")} W</strong>${esc(filterText)}</span></div>${actions.length?`<div class="actions">${actions.map(([key,icon])=>`<button class="action ${this._on(key)?"active":""}" data-action="toggle" data-key="${key}" aria-pressed="${this._on(key)}"><ha-icon icon="${icon}" style="--mdc-icon-size:16px"></ha-icon>${esc(labels[key])}</button>`).join("")}</div>`:""}</ha-card>`;
    }
  }
  customElements.define(TYPE,FridgeCard);
  window.customCards=window.customCards||[];
  window.customCards.push({type:TYPE,name:"Fridge Card",description:"Compact vendor-neutral fridge/freezer card with configurable temperature setpoint buttons",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-fridge-card"});
})();
