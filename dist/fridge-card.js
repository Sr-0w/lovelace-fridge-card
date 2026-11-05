/* Fridge Card v0.5.0-dev — one native circular slider with compartment tabs; MIT */
(function FridgeCardNativeSingleDial(){
  const TYPE="fridge-card";
  if(customElements.get(TYPE))return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
  const css=`
    :host{display:block;--fc-accent:var(--primary-color,#ff6a00)}
    *{box-sizing:border-box}
    ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#1c1c1c));color:var(--primary-text-color,#fff);border-radius:var(--ha-card-border-radius,16px);border:1px solid var(--divider-color,#444);overflow:hidden;box-shadow:none}
    .head{position:relative;text-align:center;padding:13px 44px 6px;font-size:16px;font-weight:500;min-height:44px}
    .menu{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--secondary-text-color,#999);cursor:pointer;width:38px;height:38px}
    .compartments{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:3px;margin:6px 14px 0;padding:3px;border-radius:var(--ha-border-radius-lg,12px);background:var(--secondary-background-color,#292929)}
    .compartment{min-width:0;border:0;border-radius:9px;background:transparent;color:var(--secondary-text-color,#aaa);font-family:inherit;font-weight:500;font-size:12px;height:38px;cursor:pointer}
    .compartment.selected{background:var(--ha-card-background,var(--card-background-color,#202020));color:var(--primary-text-color,#eee);box-shadow:0 1px 5px #0003}
    .thermostat{position:relative;width:min(calc(100% - 58px),266px);aspect-ratio:1/1;margin:8px auto 0;--state-color:var(--fc-accent)}
    ha-control-circular-slider{display:block;width:100%;height:100%;--control-circular-slider-color:var(--state-color);--control-circular-slider-background:var(--disabled-color,#3b3b3b);--control-circular-slider-background-opacity:.42;--control-circular-slider-interaction-margin:12px}
    .info{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;pointer-events:none}
    .target{font-size:49px;line-height:1.12;letter-spacing:-.04em;font-weight:450;font-variant-numeric:tabular-nums}
    .unit{font-size:17px;vertical-align:top;margin-left:4px;letter-spacing:0}
    .actual{font-size:12px;color:var(--secondary-text-color,#aaa);display:flex;align-items:center;gap:4px}
    .actual ha-icon{--mdc-icon-size:15px}
    .buttons{position:absolute;bottom:5%;left:0;right:0;display:flex;justify-content:center;gap:25px;pointer-events:none}
    .buttons button{pointer-events:auto;display:flex;align-items:center;justify-content:center;height:45px;width:45px;border-radius:50%;background:var(--ha-card-background,var(--card-background-color,#212121));border:1px solid var(--divider-color,#666);color:var(--primary-text-color,#fff);cursor:pointer;font-family:inherit;font-size:24px;font-weight:300}
    .buttons button:disabled{opacity:.25;cursor:not-allowed}
    .buttons button:active:not(:disabled){transform:scale(.95)}
    .fallback{display:none;position:absolute;inset:0;border:8px solid var(--disabled-color,#444);border-bottom-color:transparent;border-radius:50%;pointer-events:none}
    ha-control-circular-slider:not(:defined){display:none}
    ha-control-circular-slider:not(:defined)+.fallback{display:block}
    .metrics{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 14px 12px;color:var(--secondary-text-color,#aaa);font-size:11px}
    .metric{display:flex;align-items:center;gap:4px;white-space:nowrap}.metric ha-icon{--mdc-icon-size:15px}.metric strong{color:var(--primary-text-color,#eee);font-weight:500}.metric.alert{color:var(--error-color,#f66)}
    .modes{display:flex;gap:3px;margin:0 12px 12px;padding:4px;border:1px solid var(--divider-color,#414141);border-radius:var(--ha-border-radius-xl,13px);background:var(--secondary-background-color,#292929)}
    .mode{flex:1;min-width:0;height:57px;border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color,#aaa);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font:500 11px var(--paper-font-body1_-_font-family,inherit)}
    .mode ha-icon{--mdc-icon-size:22px}
    .mode.active{color:#fff;background:var(--fc-accent)}
    .menu:focus-visible,.compartment:focus-visible,.mode:focus-visible,.buttons button:focus-visible{outline:2px solid var(--primary-color,#ff6a00);outline-offset:2px}
    @media(max-width:360px){.thermostat{width:min(calc(100% - 40px),230px)}.buttons{gap:18px}.target{font-size:43px}.metrics{font-size:10px}.modes{margin-left:8px;margin-right:8px}}
  `;
  class FridgeCard extends HTMLElement{
    constructor(){super();this._selected="fridge";this._dragging=false;this.attachShadow({mode:"open"});this.shadowRoot.addEventListener("click",e=>this._click(e));}
    setConfig(config){if(!config?.entities||(!config.entities.fridge_temperature&&!config.entities.freezer_temperature))throw Error("Fridge Card requires fridge_temperature or freezer_temperature");this._config=config;this._signature="";this._render();}
    set hass(hass){this._hass=hass;const signature=Object.values(this._config?.entities??{}).filter(x=>typeof x==="string").map(id=>{const st=hass.states[id];return id+":"+(st?.state??"unknown")+":"+(id.startsWith("number.")?JSON.stringify({min:st?.attributes?.min,max:st?.attributes?.max,step:st?.attributes?.step}):"")}).join("|");if(signature!==this._signature){this._signature=signature;if(!this._dragging)this._render();}}
    getCardSize(){return 7;}
    getGridOptions(){return {columns:12,rows:"auto"};}
    static getStubConfig(){return {name:"Refrigerator",entities:{fridge_temperature:"sensor.fridge_temp",freezer_temperature:"sensor.freezer_temp"}};}
    _state(key){const id=this._config?.entities?.[key];return id?this._hass?.states?.[id]??null:null;}
    _number(key,precision=0){const s=this._state(key),n=Number(s?.state);return s&&!["unknown","unavailable"].includes(s.state)&&Number.isFinite(n)?n.toLocaleString(this._hass?.locale?.language??"en",{maximumFractionDigits:precision,minimumFractionDigits:precision}):"—";}
    _on(key){return this._state(key)?.state==="on";}
    _bounds(st){const a=st?.attributes??{};return {min:Number.isFinite(Number(a.min))?Number(a.min):0,max:Number.isFinite(Number(a.max))?Number(a.max):100,step:Number(a.step)>0?Number(a.step):1};}
    _moreInfo(id){if(id)this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:id},bubbles:true,composed:true}));}
    _details(){if(this._config.detail_path){history.pushState(null,"",this._config.detail_path);window.dispatchEvent(new Event("location-changed"));}else this._moreInfo(this._config.entities.fridge_temperature??this._config.entities.freezer_temperature);}
    _setTemperature(key,value){
      const entity_id=this._config.entities[key],st=this._state(key);
      if(!entity_id?.startsWith("number.")||!st||["unknown","unavailable"].includes(st.state))return;
      const n=Number(value),b=this._bounds(st);
      if(!Number.isFinite(n))return;
      const rounded=Number(Math.min(b.max,Math.max(b.min,b.min+Math.round((n-b.min)/b.step)*b.step)).toFixed(4));
      if(rounded===Number(st.state))return;
      Promise.resolve(this._hass.callService("number","set_value",{entity_id,value:rounded})).catch(e=>console.error("Fridge Card:",e));
    }
    _click(e){
      const el=e.target.closest("[data-action]");if(!el||el.disabled)return;
      const action=el.dataset.action;
      if(action==="details"){this._details();return;}
      if(action==="compartment"){this._selected=el.dataset.which==="freezer"?"freezer":"fridge";this._dragging=false;this._render();return;}
      if(action==="step"){const key=el.dataset.key,st=this._state(key);if(!st)return;this._setTemperature(key,Number(st.state)+this._bounds(st).step*Number(el.dataset.delta));return;}
      if(action==="toggle"){const id=this._config.entities[el.dataset.key];if(id?.startsWith("switch.")&&this._hass.states[id])Promise.resolve(this._hass.callService("switch","toggle",{entity_id:id})).catch(e=>console.error("Fridge Card:",e));}
    }
    _render(){
      if(!this._hass||!this._config)return;
      const c=this._config,labels={refrigerator:"Refrigerator",freezer:"Freezer",quick_cool:"Power cool",quick_freeze:"Power freeze",ice:"Ice",doors_closed:"Doors closed",door_open:"Door open",filter:"filter",...(c.labels??{})};
      const selected=this._selected==="freezer"?"freezer":"fridge",setpointKey=selected+"_setpoint",tempKey=selected+"_temperature",st=this._state(setpointKey),temp=this._state(tempKey);
      const available=!!st&&!["unknown","unavailable"].includes(st.state)&&c.entities[setpointKey]?.startsWith("number.")&&Number.isFinite(Number(st.state));
      const b=this._bounds(st),value=available?Number(st.state):null;
      const door=this._on("fridge_door")||this._on("freezer_door");
      const filter=Number(this._state("filter_usage")?.state),filterText=this._state("filter_usage")&&Number.isFinite(filter)?` · ${esc(labels.filter)} ${Math.round(filter)} %`:"";
      const modes=[["quick_cool","mdi:snowflake-thermometer"],["quick_freeze","mdi:snowflake-alert"],["ice","mdi:cube-outline"]].filter(([key])=>c.entities[key]);
      const slider=available?`<ha-control-circular-slider class="native-slider" mode="start" data-key="${setpointKey}" value="${value}" min="${b.min}" max="${b.max}" step="${b.step}" prevent-interaction-on-scroll></ha-control-circular-slider><div class="fallback"></div>`:"<div class='fallback' style='display:block'></div>";
      this.shadowRoot.innerHTML=`<style>${css}</style><ha-card><div class="head">${esc(c.name??"Refrigerator")}<button class="menu" data-action="details" title="Options et détails" aria-label="Options et détails"><ha-icon icon="mdi:dots-vertical"></ha-icon></button></div><div class="compartments"><button data-action="compartment" data-which="fridge" class="compartment ${selected==="fridge"?"selected":""}" aria-pressed="${selected==="fridge"}">${esc(labels.refrigerator)}</button><button data-action="compartment" data-which="freezer" class="compartment ${selected==="freezer"?"selected":""}" aria-pressed="${selected==="freezer"}">${esc(labels.freezer)}</button></div><div class="thermostat">${slider}<div class="info"><div class="target setpoint-number">${available?esc(this._number(setpointKey)):"—"}<span class="unit">°C</span></div><div class="actual"><ha-icon icon="mdi:thermometer"></ha-icon>${esc(this._number(tempKey,1))} °C</div></div>${available?`<div class="buttons"><button data-action="step" data-key="${setpointKey}" data-delta="-1" aria-label="${esc(labels[selected==="fridge"?"refrigerator":"freezer"])} −" ${value<=b.min?"disabled":""}>−</button><button data-action="step" data-key="${setpointKey}" data-delta="1" aria-label="${esc(labels[selected==="fridge"?"refrigerator":"freezer"])} +" ${value>=b.max?"disabled":""}>+</button></div>`:""}</div><div class="metrics"><span class="metric ${door?"alert":""}"><ha-icon icon="${door?"mdi:door-open":"mdi:door-closed"}"></ha-icon><strong>${esc(door?labels.door_open:labels.doors_closed)}</strong></span><span class="metric"><ha-icon icon="mdi:flash-outline"></ha-icon><strong>${this._number("power")} W</strong>${filterText}</span></div>${modes.length?`<div class="modes">${modes.map(([key,icon])=>`<button class="mode ${this._on(key)?"active":""}" data-action="toggle" data-key="${key}" aria-pressed="${this._on(key)}"><ha-icon icon="${icon}"></ha-icon>${esc(labels[key])}</button>`).join("")}</div>`:""}</ha-card>`;
      const sliderEl=this.shadowRoot.querySelector(".native-slider");
      if(sliderEl&&available){
        sliderEl.value=value;sliderEl.min=b.min;sliderEl.max=b.max;sliderEl.step=b.step;sliderEl.current=Number(temp?.state)||undefined;sliderEl.mode="start";sliderEl.label=labels[selected==="fridge"?"refrigerator":"freezer"];
        sliderEl.addEventListener("value-changing",ev=>{const n=ev.detail?.value;this._dragging=typeof n==="number";const el=this.shadowRoot.querySelector(".setpoint-number");if(el&&typeof n==="number")el.innerHTML=`${esc(n.toLocaleString(this._hass?.locale?.language??"en"))}<span class="unit">°C</span>`;});
        sliderEl.addEventListener("value-changed",ev=>{this._dragging=false;this._setTemperature(setpointKey,ev.detail?.value);});
      }
    }
  }
  customElements.define(TYPE,FridgeCard);
  window.customCards=window.customCards||[];
  window.customCards.push({type:TYPE,name:"Fridge Card",description:"Native thermostat-inspired single circular slider for fridge and freezer",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-fridge-card"});
})();
