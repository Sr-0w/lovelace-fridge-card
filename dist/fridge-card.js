/* Fridge Card v0.4.0-dev — native thermostat control experiment, MIT */
(function FridgeCardNativeDial(){
 const TYPE="fridge-card";
 if(customElements.get(TYPE))return;
 const esc=v=>String(v??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
 const CSS=`
 :host{display:block;--fridge-accent:var(--primary-color,#ff6a00)}
 *{box-sizing:border-box}
 ha-card{display:block;border:1px solid var(--divider-color,#383838);border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color,#1b1b1b));color:var(--primary-text-color,#fafafa);overflow:hidden;box-shadow:none}
 .head{position:relative;display:flex;justify-content:center;align-items:center;min-height:47px;padding:11px 50px 5px}
 .title{font-size:16px;font-weight:500;line-height:1.4;text-align:center}
 .menu{position:absolute;right:10px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--secondary-text-color,#aaa);border-radius:50%;width:36px;height:36px;display:grid;place-items:center;cursor:pointer}
 .dials{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:3px 11px 8px}
 .temp{display:flex;align-items:center;flex-direction:column;min-width:0}
 .temp-name{font-size:12px;color:var(--secondary-text-color,#aaa);font-weight:500;padding:5px 0 0}
 .dial-frame{position:relative;width:100%;max-width:182px;aspect-ratio:1/1;min-width:0}
 ha-control-circular-slider{display:block;position:absolute;inset:0;width:100%;height:100%;--control-circular-slider-color:var(--fridge-accent);--control-circular-slider-background:var(--slider-track-color,#393939);--control-circular-slider-background-opacity:1}
 .dial-info{position:absolute;top:36%;left:0;right:0;text-align:center;pointer-events:none}
 .target{font-size:clamp(24px,6vw,36px);font-weight:500;letter-spacing:-.035em;line-height:1.1;font-variant-numeric:tabular-nums}
 .target .unit{font-size:14px;letter-spacing:0;vertical-align:top;margin-left:2px}
 .actual{font-size:10px;color:var(--secondary-text-color,#aaa);margin-top:5px;white-space:nowrap}
 .dial-buttons{position:absolute;bottom:0;left:13%;right:13%;display:flex;justify-content:space-between;align-items:center}
 .dial-buttons button{display:grid;place-items:center;width:35px;height:35px;border:1px solid var(--divider-color,#5d5d5d);background:var(--card-background-color,#252525);border-radius:50%;color:var(--primary-text-color,#eee);font-family:inherit;font-weight:300;font-size:24px;cursor:pointer;touch-action:manipulation;z-index:2}
 .dial-buttons button:disabled{opacity:.27;cursor:not-allowed}
 .dial-buttons button:active:not(:disabled){background:var(--secondary-background-color,#444);transform:scale(.96)}
 .fallback-track{display:none;position:absolute;inset:10px 10px 35px;border:7px solid var(--divider-color,#484848);border-bottom-color:transparent;border-radius:50%}
 ha-control-circular-slider:not(:defined){display:none}
 ha-control-circular-slider:not(:defined)+.fallback-track{display:block}
 .empty-setpoint{font-size:11px;color:var(--secondary-text-color,#aaa);text-align:center;margin-top:5px}
 .foot{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:7px 15px 12px;color:var(--secondary-text-color,#aaa);font-size:11px}
 .foot span{display:inline-flex;align-items:center;gap:5px;min-width:0;white-space:nowrap}
 .foot strong{color:var(--primary-text-color,#fff);font-weight:500}
 .foot .warning{color:var(--error-color,#f66)}
 .foot ha-icon{--mdc-icon-size:15px}
 .modes{display:flex;gap:3px;margin:0 12px 12px;padding:4px;border-radius:var(--ha-border-radius-xl,13px);background:var(--secondary-background-color,#292929);border:1px solid var(--divider-color,#404040)}
 .mode{flex:1;min-width:0;height:57px;display:flex;flex-direction:column;gap:4px;align-items:center;justify-content:center;font:500 11px inherit;font-family:inherit;font-size:11px;border:0;border-radius:10px;background:none;color:var(--secondary-text-color,#b7b7b7);cursor:pointer}
 .mode ha-icon{--mdc-icon-size:22px}
 .mode.active{color:#fff;background:var(--fridge-accent)}
 .mode:focus-visible,.menu:focus-visible,.dial-buttons button:focus-visible{outline:2px solid var(--primary-color,#ff6a00);outline-offset:1px}
 @media(max-width:390px){.dials{padding:3px 8px 8px;gap:1px}.dial-buttons button{width:31px;height:31px}.target{font-size:28px}.mode{font-size:10px}}
 `;
 class FridgeCard extends HTMLElement{
  constructor(){super();this.attachShadow({mode:"open"});this.shadowRoot.addEventListener("click",e=>this._click(e));this._dragging=false;}
  setConfig(config){if(!config?.entities||(!config.entities.fridge_temperature&&!config.entities.freezer_temperature))throw Error("Fridge Card requires a fridge or freezer temperature entity");this._config=config;this._sig="";this._render();}
  set hass(hass){this._hass=hass;const ent=this._config?.entities??{};const sig=Object.values(ent).filter(x=>typeof x==="string").map(id=>{const s=hass.states[id];return id+":"+(s?.state??"")+":"+(id.startsWith("number.")?JSON.stringify({min:s?.attributes?.min,max:s?.attributes?.max,step:s?.attributes?.step}):"")}).join("|");if(sig!==this._sig){this._sig=sig;if(!this._dragging)this._render();}}
  getCardSize(){return 7;}
  getGridOptions(){return {columns:12,rows:"auto"};}
  static getStubConfig(){return {name:"Refrigerator",entities:{fridge_temperature:"sensor.fridge_temperature",freezer_temperature:"sensor.freezer_temperature"}};}
  _state(key){const id=this._config?.entities?.[key];return id?this._hass?.states?.[id]??null:null;}
  _number(key,dec=0){const s=this._state(key),n=Number(s?.state);return s&&!["unknown","unavailable"].includes(s.state)&&Number.isFinite(n)?n.toLocaleString(this._hass?.locale?.language??"en",{minimumFractionDigits:dec,maximumFractionDigits:dec}):"—";}
  _on(key){return this._state(key)?.state==="on";}
  _moreInfo(id){if(id)this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:id},bubbles:true,composed:true}));}
  _navigate(){if(this._config.detail_path){history.pushState(null,"",this._config.detail_path);window.dispatchEvent(new Event("location-changed"));}else this._moreInfo(this._config.entities.fridge_temperature??this._config.entities.freezer_temperature);}
  _bounds(st){const a=st?.attributes??{};return {min:Number.isFinite(Number(a.min))?Number(a.min):0,max:Number.isFinite(Number(a.max))?Number(a.max):100,step:Number(a.step)>0?Number(a.step):1};}
  _setTemperature(key,value){
   const entity_id=this._config.entities[key],st=this._state(key);
   if(!entity_id?.startsWith("number.")||!st||["unavailable","unknown"].includes(st.state))return;
   const {min,max,step}=this._bounds(st),n=Number(value);
   if(!Number.isFinite(n))return;
   const rounded=Number(Math.min(max,Math.max(min,min+Math.round((n-min)/step)*step)).toFixed(4));
   if(rounded===Number(st.state))return;
   Promise.resolve(this._hass.callService("number","set_value",{entity_id,value:rounded})).catch(err=>console.error("Fridge Card: setpoint",err));
  }
  _click(e){
   const target=e.target.closest("[data-action]");if(!target||target.disabled)return;
   const action=target.dataset.action;
   if(action==="details"){this._navigate();return}
   if(action==="step"){const key=target.dataset.key,st=this._state(key);if(!st)return;const b=this._bounds(st),value=Number(st.state);if(Number.isFinite(value))this._setTemperature(key,value+Number(target.dataset.delta)*b.step);return}
   if(action==="toggle"){const id=this._config.entities[target.dataset.key];if(id?.startsWith("switch.")&&this._hass.states[id])Promise.resolve(this._hass.callService("switch","toggle",{entity_id:id})).catch(err=>console.error("Fridge Card: toggle",err));}
  }
  _render(){
   if(!this._config||!this._hass)return;
   const c=this._config;
   const labels={refrigerator:"Refrigerator",freezer:"Freezer",quick_cool:"Power cool",quick_freeze:"Power freeze",ice:"Ice",doors_closed:"Doors closed",door_open:"Door open",filter:"filter",...(c.labels??{})};
   const dial=(key,control,name)=>{
    const state=this._state(control),sensor=this._state(key),available=!!state&&!["unknown","unavailable"].includes(state.state)&&Number.isFinite(Number(state.state))&&c.entities[control]?.startsWith("number.");
    const b=this._bounds(state),value=available?Number(state.state):NaN,measurement=sensor&&!["unknown","unavailable"].includes(sensor.state)?this._number(key,1):"—";
    return `<div class="temp"><div class="temp-name">${esc(name)}</div><div class="dial-frame">${available?`<ha-control-circular-slider class="temp-slider" data-key="${control}" mode="start" label="${esc(name)}" value="${value}" current="${Number(sensor?.state)||0}" min="${b.min}" max="${b.max}" step="${b.step}" prevent-interaction-on-scroll></ha-control-circular-slider><div class="fallback-track"></div>`:""}<div class="dial-info"><div class="target setpoint-val" data-key="${control}">${available?esc(this._number(control)):"—"}<span class="unit">°C</span></div><div class="actual">${esc(name)} : ${measurement} °C</div></div>${available?`<div class="dial-buttons"><button data-action="step" data-key="${control}" data-delta="-1" aria-label="${esc(name)} −" ${value<=b.min?"disabled":""}>−</button><button data-action="step" data-key="${control}" data-delta="1" aria-label="${esc(name)} +" ${value>=b.max?"disabled":""}>+</button></div>`:"<div class='empty-setpoint'>No setpoint available</div>"}</div></div>`;
   };
   const door=this._on("fridge_door")||this._on("freezer_door");
   const filter=Number(this._state("filter_usage")?.state);
   const filterInfo=this._state("filter_usage")&&Number.isFinite(filter)?` · ${Math.round(filter)}% ${esc(labels.filter)}`:"";
   const modes=[["quick_cool","mdi:snowflake-thermometer"],["quick_freeze","mdi:snowflake-alert"],["ice","mdi:cube-outline"]].filter(([k])=>c.entities[k]);
   this.shadowRoot.innerHTML=`<style>${CSS}</style><ha-card><div class="head"><div class="title">${esc(c.name??"Refrigerator")}</div><button class="menu" data-action="details" aria-label="Options et détails" title="Options et détails"><ha-icon icon="mdi:dots-vertical"></ha-icon></button></div><div class="dials">${dial("fridge_temperature","fridge_setpoint",labels.refrigerator)}${dial("freezer_temperature","freezer_setpoint",labels.freezer)}</div><div class="foot"><span class="${door?"warning":""}"><ha-icon icon="${door?"mdi:door-open":"mdi:door-closed"}"></ha-icon><strong>${esc(door?labels.door_open:labels.doors_closed)}</strong></span><span><ha-icon icon="mdi:flash-outline"></ha-icon><strong>${this._number("power")} W</strong>${filterInfo}</span></div>${modes.length?`<div class="modes">${modes.map(([key,icon])=>`<button class="mode ${this._on(key)?"active":""}" data-action="toggle" data-key="${key}" aria-pressed="${this._on(key)}"><ha-icon icon="${icon}"></ha-icon>${esc(labels[key])}</button>`).join("")}</div>`:""}</ha-card>`;
   for(const slider of this.shadowRoot.querySelectorAll("ha-control-circular-slider")){
    const key=slider.dataset.key,st=this._state(key);
    if(!st)continue;
    const b=this._bounds(st),isValid=Number.isFinite(Number(st.state));
    if(isValid){slider.value=Number(st.state);slider.min=b.min;slider.max=b.max;slider.step=b.step;slider.mode="start";slider.current=Number(this._state(key==="fridge_setpoint"?"fridge_temperature":"freezer_temperature")?.state)||undefined;slider.label=key;}
    slider.addEventListener("value-changing",ev=>{const val=ev.detail?.value;this._dragging=typeof val==="number";const txt=this.shadowRoot.querySelector(`.setpoint-val[data-key="${key}"]`);if(txt&&typeof val==="number")txt.innerHTML=`${esc(Number(val).toLocaleString(this._hass?.locale?.language??"en"))}<span class="unit">°C</span>`;});
    slider.addEventListener("value-changed",ev=>{this._dragging=false;this._setTemperature(key,ev.detail?.value);});
   }
  }
 }
 customElements.define(TYPE,FridgeCard);
 window.customCards=window.customCards||[];
 window.customCards.push({type:TYPE,name:"Fridge Card",description:"Fridge & freezer card using native Home Assistant circular slider controls",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-fridge-card"});
})();
