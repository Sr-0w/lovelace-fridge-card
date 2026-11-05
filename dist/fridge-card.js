/* Fridge Card v0.6.2-dev — native thermostat-style twin controls, MIT */
(function FridgeCardNativeTwin(){
 const TYPE="fridge-card";
 if(customElements.get(TYPE))return;
 const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const styles=`
  :host{display:block;--fridge-action:var(--primary-color,#ff6a00)}
  *{box-sizing:border-box}
  ha-card{display:flex;flex-direction:column;align-items:stretch;width:100%;border:1px solid var(--divider-color,#414141);border-radius:var(--ha-card-border-radius,16px);background:var(--ha-card-background,var(--card-background-color,#1b1b1b));color:var(--primary-text-color,#fff);overflow:hidden;box-shadow:none}
  .header{position:relative;display:flex;align-items:center;justify-content:center;min-height:48px;padding:8px 44px;font-size:var(--ha-font-size-l,16px);font-weight:var(--ha-font-weight-normal,400);line-height:var(--ha-line-height-expanded,1.5)}
  .menu{position:absolute;right:4px;top:4px;border:0;background:transparent;color:var(--secondary-text-color,#aaa);height:40px;width:40px;cursor:pointer;border-radius:50%;display:grid;place-items:center}
  .menu ha-icon{--mdc-icon-size:22px}
  .twin{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:0;padding:3px 10px 4px}
  .temperature{display:flex;min-width:0;flex-direction:column;align-items:center;gap:2px}
  .name{max-width:100%;font-size:var(--ha-font-size-s,12px);font-weight:var(--ha-font-weight-medium,500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;color:var(--secondary-text-color,#aaa);margin:0 0 2px}
  .container{position:relative;width:100%;aspect-ratio:1;container-type:inline-size;container-name:container;--state-color:var(--fridge-action)}
  ha-control-circular-slider{display:block;width:100%;height:100%;--control-circular-slider-color:var(--state-color,var(--disabled-color));--control-circular-slider-background:var(--disabled-color,#444);--control-circular-slider-background-opacity:.3}
  ha-control-circular-slider::after{display:block;content:"";position:absolute;inset:-10%;background:radial-gradient(50% 50% at 50% 50%,var(--action-color,transparent) 0%,transparent 100%);opacity:.15;pointer-events:none}
  ha-control-circular-slider:not(:defined){display:none}
  .fallback{display:none;position:absolute;inset:12%;border:7px solid var(--disabled-color,#444);border-bottom-color:transparent;border-radius:50%}
  ha-control-circular-slider:not(:defined)+.fallback{display:block}
  .info{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;gap:2px;line-height:var(--ha-line-height-normal,1.4)}
  .info>*{margin:0}
  .target-number{font-size:clamp(26px,7.4cqw,39px);letter-spacing:0;max-width:92%;white-space:nowrap}
  .target-fallback{font-size:31px;line-height:1.1;font-weight:400}
  .target-fallback{font-size:26px;line-height:1.2;color:var(--secondary-text-color,#aaa)}
  .current{display:flex;align-items:center;gap:3px;color:var(--secondary-text-color,#aaa);font-size:11px;white-space:nowrap}
  .current ha-icon{--mdc-icon-size:14px}
  .buttons{position:absolute;left:0;right:0;bottom:-1px;display:flex;justify-content:center;gap:12px;align-items:center;pointer-events:none}
  .buttons ha-outlined-icon-button{--ha-icon-button-size:32px;--ha-outlined-icon-button-outline-color:var(--secondary-text-color,#888);pointer-events:auto;cursor:pointer}
  .buttons ha-outlined-icon-button ha-icon{--mdc-icon-size:19px}
  .buttons ha-outlined-icon-button[disabled]{opacity:.26;pointer-events:none}
  .metadata{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:3px 14px 12px;color:var(--secondary-text-color,#aaa);font-size:var(--ha-font-size-xs,11px)}
  .metadata span{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;min-width:0}
  .metadata ha-icon{--mdc-icon-size:15px}
  .metadata strong{font-weight:var(--ha-font-weight-medium,500);color:var(--primary-text-color,#eee)}
  .metadata .alert{color:var(--error-color,#f66)}
  .modes{display:flex;gap:3px;padding:4px;margin:0 12px 12px;background:var(--secondary-background-color,#292929);border:1px solid var(--divider-color,#444);border-radius:var(--ha-border-radius-xl,13px)}
  .mode{flex:1;min-width:0;height:57px;border:0;border-radius:var(--ha-border-radius-lg,10px);background:transparent;color:var(--secondary-text-color,#aaa);font:var(--ha-font-weight-medium,500) var(--ha-font-size-xs,11px) var(--paper-font-body1_-_font-family,inherit);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
  .mode ha-icon{--mdc-icon-size:22px}
  .mode.active{background:var(--fridge-action);color:var(--text-primary-color,#fff)}
  .mode:focus-visible,.menu:focus-visible{outline:2px solid var(--primary-color,#ff6a00);outline-offset:1px}
  @container container (max-width:180px){.target-number{font-size:32px}.buttons{gap:9px}.buttons ha-outlined-icon-button{--ha-icon-button-size:30px}}
  @media(max-width:360px){.twin{padding:3px 5px 3px}.buttons{gap:8px}.buttons ha-outlined-icon-button{--ha-icon-button-size:28px}.name{font-size:11px}.metadata{font-size:10px;padding:4px 10px 11px}.mode{height:53px;font-size:10px}}
 `;
 class FridgeCard extends HTMLElement{
  constructor(){super();this.attachShadow({mode:"open"});this.shadowRoot.addEventListener("click",e=>this._click(e));this._dragging=new Set();this._pending=new Set();}
  setConfig(config){if(!config?.entities||(!config.entities.fridge_temperature&&!config.entities.freezer_temperature))throw Error("Fridge Card: temperature sensor required");this._config=config;this._signature="";this._render();}
  set hass(hass){this._hass=hass;const ent=this._config?.entities??{};const sig=Object.values(ent).filter(id=>typeof id==="string").map(id=>{const s=hass.states[id];return id+":"+(s?.state??"unknown")+":"+(id.startsWith("number.")?JSON.stringify({min:s?.attributes?.min,max:s?.attributes?.max,step:s?.attributes?.step}):"")}).join("|");if(sig!==this._signature){this._signature=sig;if(this._dragging.size===0)this._render();}}
  getCardSize(){return 7;}
  getGridOptions(){return {columns:12,rows:"auto"};}
  static getStubConfig(){return {name:"Refrigerator",entities:{fridge_temperature:"sensor.fridge_temperature",freezer_temperature:"sensor.freezer_temperature"}};}
  _state(key){const id=this._config?.entities?.[key];return id?this._hass?.states?.[id]??null:null;}
  _valid(s){return !!s&&!["unknown","unavailable"].includes(s.state)&&Number.isFinite(Number(s.state));}
  _num(key,precision=0){const s=this._state(key);return this._valid(s)?Number(s.state).toLocaleString(this._hass?.locale?.language??"en",{minimumFractionDigits:precision,maximumFractionDigits:precision}):"—";}
  _on(key){return this._state(key)?.state==="on";}
  _bounds(st){const a=st?.attributes??{};return {min:Number.isFinite(Number(a.min))?Number(a.min):0,max:Number.isFinite(Number(a.max))?Number(a.max):100,step:Number(a.step)>0?Number(a.step):1};}
  _details(){if(this._config.detail_path){history.pushState(null,"",this._config.detail_path);window.dispatchEvent(new Event("location-changed"));}else{const id=this._config.entities.fridge_temperature??this._config.entities.freezer_temperature;this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:id},bubbles:true,composed:true}));}}
  _setValue(key,raw){
   const entity_id=this._config?.entities?.[key],s=this._state(key),input=Number(raw);
   if(!entity_id?.startsWith("number.")||!this._valid(s)||!Number.isFinite(input))return;
   const {min,max,step}=this._bounds(s);
   const value=Number(Math.min(max,Math.max(min,min+Math.round((input-min)/step)*step)).toFixed(4));
   if(value===Number(s.state)||this._pending.has(key))return;
   this._pending.add(key);
   Promise.resolve(this._hass.callService("number","set_value",{entity_id,value})).catch(e=>console.error("Fridge Card: set temperature",e)).finally(()=>this._pending.delete(key));
  }
  _click(e){
   const item=e.target.closest("[data-action]");if(!item||item.disabled)return;
   if(item.dataset.action==="details"){this._details();return;}
   if(item.dataset.action==="step"){const key=item.dataset.key,s=this._state(key);if(this._valid(s))this._setValue(key,Number(s.state)+Number(item.dataset.delta)*this._bounds(s).step);return;}
   if(item.dataset.action==="toggle"){const id=this._config.entities[item.dataset.key];if(id?.startsWith("switch.")&&this._hass.states[id])Promise.resolve(this._hass.callService("switch","toggle",{entity_id:id})).catch(err=>console.error("Fridge Card: toggle",err));}
  }
  _render(){
   if(!this._hass||!this._config)return;
   const c=this._config,labels={refrigerator:"Refrigerator",freezer:"Freezer",quick_cool:"Power cool",quick_freeze:"Power freeze",ice:"Ice",doors_closed:"Doors closed",door_open:"Door open",filter:"Filter",...(c.labels??{})};
   const dial=(which)=>{
    const name=labels[which==="fridge"?"refrigerator":"freezer"],key=which+"_setpoint",measuredKey=which+"_temperature",st=this._state(key),valid=this._valid(st)&&c.entities[key]?.startsWith("number."),bounds=this._bounds(st);
    const value=valid?Number(st.state):null;
    return `<div class="temperature"><p class="name">${esc(name)}</p><div class="container" style="--state-color:var(--fridge-action);--action-color:var(--fridge-action)">${valid?`<ha-control-circular-slider data-key="${key}" min="${bounds.min}" max="${bounds.max}" step="${bounds.step}" value="${value}" prevent-interaction-on-scroll></ha-control-circular-slider><div class="fallback"></div>`:`<div class="fallback" style="display:block"></div>`}<div class="info">${valid?`<ha-big-number class="target-number" data-key="${key}" value="${value}" unit="°C"></ha-big-number>`:`<span class="target-fallback">— °C</span>`}<p class="current"><ha-icon icon="mdi:thermometer"></ha-icon>${esc(this._num(measuredKey,1))} °C</p></div>${valid?`<div class="buttons"><ha-outlined-icon-button data-action="step" data-key="${key}" data-delta="-1" label="${esc(name)} −" aria-label="${esc(name)} −" ${value<=bounds.min?"disabled":""}><ha-icon icon="mdi:minus"></ha-icon></ha-outlined-icon-button><ha-outlined-icon-button data-action="step" data-key="${key}" data-delta="1" label="${esc(name)} +" aria-label="${esc(name)} +" ${value>=bounds.max?"disabled":""}><ha-icon icon="mdi:plus"></ha-icon></ha-outlined-icon-button></div>`:""}</div></div>`;
   };
   const door=this._on("fridge_door")||this._on("freezer_door"),f=this._state("filter_usage"),filter=this._valid(f)?` · ${esc(labels.filter)} ${Math.round(Number(f.state))} %`:"";
   const modes=[["quick_cool","mdi:snowflake-thermometer"],["quick_freeze","mdi:snowflake-alert"],["ice","mdi:cube-outline"]].filter(([k])=>c.entities[k]);
   this.shadowRoot.innerHTML=`<style>${styles}</style><ha-card><div class="header">${esc(c.name??"Refrigerator")}<button class="menu" data-action="details" aria-label="Options et détails" title="Options et détails"><ha-icon icon="mdi:dots-vertical"></ha-icon></button></div><div class="twin">${dial("fridge")}${dial("freezer")}</div><div class="metadata"><span class="${door?"alert":""}"><ha-icon icon="${door?"mdi:door-open":"mdi:door-closed"}"></ha-icon><strong>${esc(door?labels.door_open:labels.doors_closed)}</strong></span><span><ha-icon icon="mdi:flash-outline"></ha-icon><strong>${esc(this._num("power"))} W</strong>${filter}</span></div>${modes.length?`<div class="modes">${modes.map(([key,icon])=>`<button class="mode ${this._on(key)?"active":""}" data-action="toggle" data-key="${key}" aria-pressed="${this._on(key)}"><ha-icon icon="${icon}"></ha-icon>${esc(labels[key])}</button>`).join("")}</div>`:""}</ha-card>`;
   for(const slider of this.shadowRoot.querySelectorAll("ha-control-circular-slider")){
    const key=slider.dataset.key,st=this._state(key);
    if(!this._valid(st))continue;
    const bounds=this._bounds(st),num=Number(st.state),measured=this._state(key==="fridge_setpoint"?"fridge_temperature":"freezer_temperature");
    slider.value=num;slider.min=bounds.min;slider.max=bounds.max;slider.step=bounds.step;slider.current=this._valid(measured)?Number(measured.state):undefined;
    slider.inactive=false;slider.preventInteractionOnScroll=true;
    slider.label=key;slider.formatValue=value=>`${value} °C`;
    slider.addEventListener("value-changing",ev=>{
      const value=ev.detail?.value;if(typeof value!=="number")return;
      this._dragging.add(key);
      const target=this.shadowRoot.querySelector(`ha-big-number[data-key="${key}"]`);if(target)target.value=value;
    });
    slider.addEventListener("value-changed",ev=>{this._dragging.delete(key);this._setValue(key,ev.detail?.value);});
   }
   for(const number of this.shadowRoot.querySelectorAll("ha-big-number")){
    const key=number.dataset.key,st=this._state(key);
    if(this._valid(st)){number.value=Number(st.state);number.unit="°C";number.formatOptions={maximumFractionDigits:0,minimumFractionDigits:0};}
   }
  }
 }
 customElements.define(TYPE,FridgeCard);
 window.customCards=window.customCards||[];
 window.customCards.push({type:TYPE,name:"Fridge Card",description:"Dual Home Assistant native circular thermostat controls for fridge and freezer",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-fridge-card"});
})();
