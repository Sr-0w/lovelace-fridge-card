/* Fridge Card v0.8.0-dev — native cooling arc direction (mode=end), MIT */
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
  .twin{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:var(--fridge-dial-gap,0px);padding:3px 10px 4px}
  .temperature{display:flex;min-width:0;flex-direction:column;align-items:center;gap:2px}
  .name{max-width:100%;font-size:var(--ha-font-size-s,12px);font-weight:var(--ha-font-weight-medium,500);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;color:var(--secondary-text-color,#aaa);margin:0 0 2px}
  .container{position:relative;width:min(100%,var(--fridge-dial-size,300px));margin-inline:auto;aspect-ratio:1;container-type:inline-size;container-name:container;--state-color:var(--fridge-action)}
  ha-control-circular-slider{display:block;width:100%;height:100%;--control-circular-slider-color:var(--state-color,var(--disabled-color));--control-circular-slider-background:var(--fridge-track,var(--disabled-color,#444));--control-circular-slider-background-opacity:.3}
  ha-control-circular-slider::after{display:block;content:"";position:absolute;inset:-10%;background:radial-gradient(50% 50% at 50% 50%,var(--action-color,transparent) 0%,transparent 100%);opacity:.15;pointer-events:none}
  ha-control-circular-slider:not(:defined){display:none}
  .fallback{display:none;position:absolute;inset:12%;border:7px solid var(--disabled-color,#444);border-bottom-color:transparent;border-radius:50%}
  ha-control-circular-slider:not(:defined)+.fallback{display:block}
  .info{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;gap:2px;line-height:var(--ha-line-height-normal,1.4)}
  .info>*{margin:0}
  .target-number{font-size:clamp(26px,7.4cqw,39px);letter-spacing:0;max-width:92%;white-space:nowrap;color:var(--fridge-text,var(--primary-text-color,#fff))}
  .target-fallback{font-size:31px;line-height:1.1;font-weight:400}
  .target-fallback{font-size:26px;line-height:1.2;color:var(--secondary-text-color,#aaa)}
  .current{display:flex;align-items:center;gap:3px;color:var(--secondary-text-color,#aaa);font-size:11px;white-space:nowrap}
  .current ha-icon{--mdc-icon-size:14px}
  .buttons{position:absolute;left:50%;bottom:-1px;transform:translateX(-50%);width:max-content;display:grid;grid-template-columns:repeat(2,var(--fridge-button-size,32px));gap:12px;place-items:center;pointer-events:none}
  .buttons ha-outlined-icon-button{--ha-icon-button-size:var(--fridge-button-size,32px);--ha-outlined-icon-button-outline-color:var(--secondary-text-color,#888);display:block;width:var(--fridge-button-size,32px);height:var(--fridge-button-size,32px);margin:0;padding:0;pointer-events:auto;cursor:pointer}
  .buttons ha-svg-icon{--mdc-icon-size:20px}
  .buttons ha-outlined-icon-button[disabled]{opacity:.26;pointer-events:none}
  .metadata{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:3px 14px 12px;color:var(--secondary-text-color,#aaa);font-size:var(--ha-font-size-xs,11px)}
  .metadata span{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;min-width:0}
  .metadata ha-icon{--mdc-icon-size:15px}
  .metadata strong{font-weight:var(--ha-font-weight-medium,500);color:var(--primary-text-color,#eee)}
  .metadata .alert{color:var(--fridge-warning,var(--error-color,#f66))}.metadata .caution{color:var(--fridge-caution,#ffb34e)}
  .modes{display:flex;gap:3px;padding:4px;margin:0 12px 12px;background:var(--secondary-background-color,#292929);border:1px solid var(--divider-color,#444);border-radius:var(--ha-border-radius-xl,13px)}
  .mode{flex:1;min-width:0;height:var(--fridge-mode-height,57px);border:0;border-radius:var(--ha-border-radius-lg,10px);background:transparent;color:var(--secondary-text-color,#aaa);font:var(--ha-font-weight-medium,500) var(--ha-font-size-xs,11px) var(--paper-font-body1_-_font-family,inherit);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
  .mode ha-icon{--mdc-icon-size:var(--fridge-mode-icon-size,22px)}
  .mode.active{background:var(--fridge-action);color:var(--text-primary-color,#fff)}
  .mode:focus-visible,.menu:focus-visible{outline:2px solid var(--primary-color,#ff6a00);outline-offset:1px}
  @container container (max-width:180px){.target-number{font-size:32px}.buttons{gap:9px}.buttons ha-outlined-icon-button{--ha-icon-button-size:30px}}
  @media(max-width:360px){.twin{padding:3px 5px 3px}.buttons{gap:8px;grid-template-columns:repeat(2,var(--fridge-button-size,28px))}.buttons ha-outlined-icon-button{--ha-icon-button-size:var(--fridge-button-size,28px);width:var(--fridge-button-size,28px);height:var(--fridge-button-size,28px)}.name{font-size:11px}.metadata{font-size:10px;padding:4px 10px 11px}.mode{height:var(--fridge-mode-height,53px);font-size:10px}}
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
  _css(value,fallback){return typeof value==='string'&&(/^#[a-f0-9]{3,8}$/i.test(value)||/^var\(--[a-z\d-]+(?:,\s*#[a-f\d]{3,8})?\)$/i.test(value))?value:fallback;}
  _px(v,fallback,min,max){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;}
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
   if(item.dataset.action==="toggle"){const id=item.dataset.entity||this._config.entities[item.dataset.key];const domain=id?.split(".")[0];if(["switch","input_boolean"].includes(domain)&&this._hass.states[id])Promise.resolve(this._hass.callService(domain,"toggle",{entity_id:id})).catch(err=>console.error("Fridge Card: toggle",err));}
  }
  _render(){
   if(!this._hass||!this._config)return;
   const c=this._config,labels={refrigerator:"Refrigerator",freezer:"Freezer",quick_cool:"Power cool",quick_freeze:"Power freeze",ice:"Ice",doors_closed:"Doors closed",door_open:"Door open",filter:"Filter",...(c.labels??{})};
   const dial=(which)=>{
    const name=labels[which==="fridge"?"refrigerator":"freezer"],key=which+"_setpoint",measuredKey=which+"_temperature",st=this._state(key),valid=this._valid(st)&&c.entities[key]?.startsWith("number."),bounds=this._bounds(st);
    const value=valid?Number(st.state):null,unit=st?.attributes?.unit_of_measurement??c.temperature_unit??"°C",measuredUnit=this._state(measuredKey)?.attributes?.unit_of_measurement??c.temperature_unit??"°C";
    return `<div class="temperature"><p class="name">${esc(name)}</p><div class="container" style="--state-color:${esc(this._css(c.colors?.[which],"var(--fridge-action)"))};--action-color:${esc(this._css(c.colors?.[which],"var(--fridge-action)"))}">${valid?`<ha-control-circular-slider data-key="${key}" min="${bounds.min}" max="${bounds.max}" step="${bounds.step}" value="${value}" mode="${c.appearance?.cooling_arc===false?"start":"end"}" prevent-interaction-on-scroll></ha-control-circular-slider><div class="fallback"></div>`:`<div class="fallback" style="display:block"></div>`}<div class="info">${valid?`<ha-big-number class="target-number" data-key="${key}" value="${value}" unit="${esc(unit)}"></ha-big-number>`:`<span class="target-fallback">— ${esc(unit)}</span>`}${c.show_measured!==false?`<p class="current"><ha-icon icon="mdi:thermometer"></ha-icon>${esc(this._num(measuredKey,1))} ${esc(measuredUnit)}</p>`:""}</div>${valid?`<div class="buttons"><ha-outlined-icon-button data-action="step" data-key="${key}" data-delta="-1" label="${esc(name)} −" aria-label="${esc(name)} −" ${value<=bounds.min?"disabled":""}><ha-svg-icon data-icon="minus"></ha-svg-icon></ha-outlined-icon-button><ha-outlined-icon-button data-action="step" data-key="${key}" data-delta="1" label="${esc(name)} +" aria-label="${esc(name)} +" ${value>=bounds.max?"disabled":""}><ha-svg-icon data-icon="plus"></ha-svg-icon></ha-outlined-icon-button></div>`:""}</div></div>`;
   };
   const door=this._on("fridge_door")||this._on("freezer_door"),f=this._state("filter_usage"),filter=this._valid(f)?` · ${esc(labels.filter)} ${Math.round(Number(f.state))} %`:"";
   const order=String(c.mode_order??"quick_cool,quick_freeze,ice").split(",").map(x=>x.trim());
   const defaults=[["quick_cool","mdi:snowflake-thermometer"],["quick_freeze","mdi:snowflake-alert"],["ice","mdi:cube-outline"]].filter(([k])=>c.entities[k]).map(([k,icon])=>({key:k,entity:c.entities[k],label:labels[k],icon:c.mode_icons?.[k]??icon}));
   const more=(Array.isArray(c.extra_modes)?c.extra_modes:[]).filter(m=>/^(switch|input_boolean)\.[a-z0-9_]+$/.test(m.entity??"")).map(m=>({key:"",entity:m.entity,label:m.label??m.entity,icon:m.icon??"mdi:power"}));
   const modes=[...defaults,...more].sort((a,b)=>{const x=order.indexOf(a.key),y=order.indexOf(b.key);return (x<0?999:x)-(y<0?999:y);});
   const doorWarning=door||(this._valid(this._state("fridge_temperature"))&&Number(this._state("fridge_temperature").state)>Number(c.fridge_warn??7))||(this._valid(this._state("freezer_temperature"))&&Number(this._state("freezer_temperature").state)>Number(c.freezer_warn??-15));
   const caution=!doorWarning&&(this._valid(this._state("fridge_temperature"))&&Number(this._state("fridge_temperature").state)>Number(c.fridge_caution??5));
   const accent=this._css(c.colors?.accent,"var(--primary-color,#ff6a00)");
   const cardStyle="--fridge-action:"+accent+";--fridge-warning:"+this._css(c.colors?.warning,"var(--error-color,#f66)")+";--fridge-caution:"+this._css(c.colors?.caution,"#ffb34e")+";--fridge-track:"+this._css(c.colors?.track,"var(--disabled-color,#444)")+";--fridge-text:"+this._css(c.colors?.text,"var(--primary-text-color,#fff)")+";--fridge-dial-size:"+this._px(c.appearance?.dial_size,300,120,500)+"px;--fridge-dial-gap:"+this._px(c.appearance?.dial_gap,0,0,40)+"px;--fridge-button-size:"+this._px(c.appearance?.button_size,32,24,60)+"px;--fridge-mode-height:"+this._px(c.appearance?.mode_height,57,30,110)+"px;--fridge-mode-icon-size:"+this._px(c.appearance?.mode_icon_size,22,12,44)+"px;";
   this.shadowRoot.innerHTML=`<style>${styles}</style><ha-card style="${esc(cardStyle)}">${c.show_header!==false?`<div class="header">${esc(c.name??"Refrigerator")}<button class="menu" data-action="details" aria-label="Options et détails" title="Options et détails"><ha-icon icon="mdi:dots-vertical"></ha-icon></button></div>`:""}<div class="twin">${dial("fridge")}${dial("freezer")}</div>${(c.show_doors!==false||c.show_power!==false||c.show_filter!==false)?`<div class="metadata">${c.show_doors!==false?`<span class="${doorWarning?"alert":caution?"caution":""}"><ha-icon icon="${door?"mdi:door-open":doorWarning?"mdi:alert-outline":"mdi:door-closed"}"></ha-icon><strong>${esc(door?labels.door_open:doorWarning?"Attention":caution?"À surveiller":labels.doors_closed)}</strong></span>`:""}${c.show_power!==false||c.show_filter!==false?`<span>${c.show_power!==false?`<ha-icon icon="mdi:flash-outline"></ha-icon><strong>${esc(this._num("power"))} W</strong>`:""}${c.show_filter!==false?filter:""}</span>`:""}</div>`:""}${c.show_modes!==false&&modes.length?`<div class="modes">${modes.map(m=>{const active=this._hass.states[m.entity]?.state==="on";const icon=/^mdi:[a-z0-9-]+$/.test(m.icon)?m.icon:"mdi:power";return `<button class="mode ${active?"active":""}" data-action="toggle" data-entity="${esc(m.entity)}" aria-pressed="${active}"><ha-icon icon="${esc(icon)}"></ha-icon>${esc(m.label)}</button>`;}).join("")}</div>`:""}</ha-card>`;
   for(const slider of this.shadowRoot.querySelectorAll("ha-control-circular-slider")){
    const key=slider.dataset.key,st=this._state(key);
    if(!this._valid(st))continue;
    const bounds=this._bounds(st),num=Number(st.state),measured=this._state(key==="fridge_setpoint"?"fridge_temperature":"freezer_temperature");
    slider.value=num;slider.min=bounds.min;slider.max=bounds.max;slider.step=bounds.step;slider.current=this._valid(measured)?Number(measured.state):undefined;
    slider.mode=c.appearance?.cooling_arc===false?"start":"end";slider.inactive=false;slider.preventInteractionOnScroll=true;
    slider.label=key;slider.formatValue=value=>`${value} ${st?.attributes?.unit_of_measurement??c.temperature_unit??"°C"}`;
    slider.addEventListener("value-changing",ev=>{
      const value=ev.detail?.value;if(typeof value!=="number")return;
      this._dragging.add(key);
      const target=this.shadowRoot.querySelector(`ha-big-number[data-key="${key}"]`);if(target)target.value=value;
    });
    slider.addEventListener("value-changed",ev=>{this._dragging.delete(key);this._setValue(key,ev.detail?.value);});
   }
   // Use the native ha-icon-button path property, as HA thermostats do.
   const iconPaths={minus:"M19,13H5V11H19V13Z",plus:"M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"};
   for(const icon of this.shadowRoot.querySelectorAll("ha-svg-icon[data-icon]")){icon.path=iconPaths[icon.dataset.icon];}
   for(const number of this.shadowRoot.querySelectorAll("ha-big-number")){
    const key=number.dataset.key,st=this._state(key);
    if(this._valid(st)){number.value=Number(st.state);number.unit=st.attributes?.unit_of_measurement??c.temperature_unit??"°C";number.formatOptions={maximumFractionDigits:0,minimumFractionDigits:0};}
   }
  }
 }
 customElements.define(TYPE,FridgeCard);
 window.customCards=window.customCards||[];
 window.customCards.push({type:TYPE,name:"Fridge Card",description:"Dual Home Assistant native circular thermostat controls for fridge and freezer",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-fridge-card"});
})();


/* Visual editor: uses Home Assistant's ha-form and entity/select selectors. */
(function registerVisualEditor(){
  const TYPE="fridge-card",EDITOR=TYPE+"-editor";
  const Card=customElements.get(TYPE);
  if(!Card||customElements.get(EDITOR))return;
  const SPEC=[{"title":"Général","fields":[{"path":"name","label":"Nom de l’appareil","kind":"text"},{"path":"detail_path","label":"Navigation vers la vue détaillée","kind":"text"},{"path":"temperature_unit","label":"Unité par défaut (°C, °F, etc.)","kind":"text"},{"path":"show_header","label":"Afficher le titre","kind":"bool","default":true},{"path":"show_measured","label":"Température mesurée","kind":"bool","default":true},{"path":"show_doors","label":"État des portes","kind":"bool","default":true},{"path":"show_power","label":"Puissance instantanée","kind":"bool","default":true},{"path":"show_filter","label":"Indicateur du filtre","kind":"bool","default":true},{"path":"show_modes","label":"Afficher les modes","kind":"bool","default":true}]},{"title":"Entités — réfrigérateur et congélateur","fields":[{"path":"entities.fridge_temperature","label":"Température mesurée du réfrigérateur","kind":"entity","domain":"sensor"},{"path":"entities.fridge_setpoint","label":"Consigne du réfrigérateur","kind":"entity","domain":"number"},{"path":"entities.freezer_temperature","label":"Température mesurée du congélateur","kind":"entity","domain":"sensor"},{"path":"entities.freezer_setpoint","label":"Consigne du congélateur","kind":"entity","domain":"number"},{"path":"entities.fridge_door","label":"Contact de porte du réfrigérateur","kind":"entity","domain":"binary_sensor"},{"path":"entities.freezer_door","label":"Contact de porte du congélateur","kind":"entity","domain":"binary_sensor"},{"path":"entities.power","label":"Puissance de l’appareil","kind":"entity","domain":"sensor"},{"path":"entities.filter_usage","label":"Usure du filtre (%)","kind":"entity","domain":"sensor"},{"path":"entities.quick_cool","label":"Mode Froid+","kind":"entity","domain":"switch"},{"path":"entities.quick_freeze","label":"Mode Congélation rapide","kind":"entity","domain":"switch"},{"path":"entities.ice","label":"Production de glaçons","kind":"entity","domain":"switch"}]},{"title":"Couleurs et apparence","fields":[{"path":"colors.accent","label":"Couleur de l’arc et du mode actif","kind":"color","default":"#009FCA"},{"path":"colors.fridge","label":"Couleur cadran frigo (optionnel)","kind":"color"},{"path":"colors.freezer","label":"Couleur cadran congélateur (optionnel)","kind":"color"},{"path":"colors.track","label":"Couleur de piste du cadran","kind":"color"},{"path":"colors.text","label":"Couleur des chiffres (optionnel)","kind":"color"},{"path":"colors.warning","label":"Couleur d’alerte","kind":"color","default":"#EF5350"},{"path":"colors.caution","label":"Couleur de vigilance","kind":"color","default":"#FFB34E"},{"path":"appearance.dial_size","label":"Taille maximale des cadrans (px)","kind":"number","default":300,"min":120,"max":500},{"path":"appearance.dial_gap","label":"Espacement entre cadrans (px)","kind":"number","default":0,"min":0,"max":40},{"path":"appearance.cooling_arc","label":"Arc de refroidissement (cible → températures plus chaudes)","kind":"bool","default":true},{"path":"appearance.button_size","label":"Taille des boutons ± (px)","kind":"number","default":32,"min":24,"max":60},{"path":"appearance.mode_height","label":"Hauteur des boutons de modes (px)","kind":"number","default":57,"min":30,"max":110},{"path":"appearance.mode_icon_size","label":"Taille des icônes de modes (px)","kind":"number","default":22,"min":12,"max":44}]},{"title":"Modes — icônes et boutons","fields":[{"path":"mode_icons.quick_cool","label":"Icône Froid+ (mdi:...)","kind":"text"},{"path":"mode_icons.quick_freeze","label":"Icône Congél+ (mdi:...)","kind":"text"},{"path":"mode_icons.ice","label":"Icône Glaçons (mdi:...)","kind":"text"},{"path":"mode_order","label":"Ordre des modes (séparés par des virgules)","kind":"text"},{"path":"extra_modes","label":"Modes additionnels (entité | libellé | mdi:icône)","kind":"modes"}]},{"title":"Libellés et seuils","fields":[{"path":"labels.refrigerator","label":"Libellé frigo","kind":"text"},{"path":"labels.freezer","label":"Libellé congélateur","kind":"text"},{"path":"labels.quick_cool","label":"Libellé Froid+","kind":"text"},{"path":"labels.quick_freeze","label":"Libellé Congél+","kind":"text"},{"path":"labels.ice","label":"Libellé Glaçons","kind":"text"},{"path":"labels.doors_closed","label":"Libellé portes fermées","kind":"text"},{"path":"labels.door_open","label":"Libellé porte ouverte","kind":"text"},{"path":"labels.filter","label":"Libellé du filtre","kind":"text"},{"path":"fridge_warn","label":"Seuil d’alerte frigo","kind":"number","default":7,"min":-5,"max":30},{"path":"fridge_caution","label":"Seuil de vigilance frigo","kind":"number","default":5,"min":-5,"max":30},{"path":"freezer_warn","label":"Seuil d’alerte congélateur (°C)","kind":"number","default":-15,"min":-50,"max":0}]}];
  const toKey=path=>path.replaceAll(".","__");
  const get=(obj,path)=>path.split(".").reduce((a,k)=>a?.[k],obj);
  const put=(obj,path,value)=>{
    const keys=path.split("."),stack=[obj];let at=obj;
    for(const k of keys.slice(0,-1)){if(!at[k]||typeof at[k]!=="object"||Array.isArray(at[k]))at[k]={};at=at[k];stack.push(at);}
    const key=keys.at(-1);
    if(value===undefined||value===null||value==="")delete at[key];else at[key]=value;
    for(let i=keys.length-2;i>=0;i--){if(Object.keys(stack[i+1]).length===0)delete stack[i][keys[i]];}
  };
  const mapAsText=v=>Object.entries(v&&typeof v==="object"&&!Array.isArray(v)?v:{}).map(([k,x])=>k+": "+String(x)).join("\n");
  const parseMap=s=>{const out={};for(const line of String(s??"").split(/\r?\n/)){const i=line.indexOf(":");if(i<1)continue;const key=line.slice(0,i).trim(),v=line.slice(i+1).trim();if(/^[\w.-]+$/.test(key)&&v)out[key]=v;}return out};
  const modesAsText=v=>(Array.isArray(v)?v:[]).map(m=>[m.entity??"",m.label??"",m.icon??"mdi:power"].join(" | ")).join("\n");
  const parseModes=s=>String(s??"").split(/\r?\n/).map(l=>l.split("|").map(x=>x.trim())).filter(v=>/^(switch|input_boolean)\.[\w]+$/.test(v[0]??"")).map(([entity,label,icon])=>({entity,label:label||entity.split(".").at(-1),icon:icon||"mdi:power"}));
  const safeColor=s=>typeof s==="string"&&/^#[\da-f]{3,8}$/i.test(s)?s:"#ff6a00";
  class CardVisualEditor extends HTMLElement {
    constructor(){super();this.attachShadow({mode:"open"});this._config={type:"custom:"+TYPE};this._hass=undefined;this._rendered=false;}
    setConfig(config){this._config=JSON.parse(JSON.stringify(config??{type:"custom:"+TYPE}));this._render();}
    set hass(hass){this._hass=hass;if(!this._rendered)this._render();else{for(const form of this.shadowRoot.querySelectorAll("ha-form"))form.hass=hass;this._refreshProgramOptions();}}
    _refreshProgramOptions(){if(TYPE!=="dishwasher-card")return;const idx=SPEC.findIndex(g=>g.fields.some(f=>f.kind==="multi"));if(idx<0)return;const form=this.shadowRoot.querySelector('ha-form[data-group="'+idx+'"]');if(form)form.schema=SPEC[idx].fields.map(f=>this._fieldSchema(f));}
    _options(){
      if(TYPE!=="dishwasher-card")return [];
      const id=this._config.entities?.program;
      const options=this._hass?.states?.[id]?.attributes?.options;
      const list=[...(Array.isArray(options)?options:[]),...(this._config.program_presets??[])];
      return [...new Set(list.filter(x=>typeof x==="string"&&x.trim()))].map(code=>({value:code,label:this._config.program_labels?.[code]??code.replaceAll("_"," ")}));
    }
    _fieldSchema(field){
      const schema={name:toKey(field.path)};
      if(field.kind==="entity")schema.selector={entity:field.domain?{filter:{domain:field.domain}}:{}};
      else if(field.kind==="bool")schema.selector={boolean:{}};
      else if(field.kind==="number")schema.selector={number:{min:field.min??0,max:field.max??500,step:field.step??1,mode:"box"}};
      else if(field.kind==="multi"){const opts=this._options();schema.selector={select:{options:opts.length?opts:[{value:"eco",label:"eco"}],multiple:true,reorder:true,mode:"dropdown"}};}
      else schema.selector={text:field.kind==="map"||field.kind==="modes"?{multiline:true}:{}};
      return schema;
    }
    _fieldValue(f){
      const v=get(this._config,f.path);
      return f.kind==="map"?mapAsText(v):f.kind==="modes"?modesAsText(v):f.kind==="multi"?(Array.isArray(v)?v:[]):v??f.default;
    }
    _onForm(group,values){
      const next=JSON.parse(JSON.stringify(this._config));
      for(const f of group.fields){
        const key=toKey(f.path);if(!Object.prototype.hasOwnProperty.call(values,key))continue;
        let value=values[key];
        if(f.kind==="map")value=parseMap(value);
        if(f.kind==="modes")value=parseModes(value);
        if(f.kind==="multi")value=Array.isArray(value)?value:[];
        if(f.kind==="number"&&value!=="")value=Number(value);
        put(next,f.path,value);
      }
      const oldProgram=this._config.entities?.program;
      this._config=next;
      if(next.entities?.program!==oldProgram)this._refreshProgramOptions();
      this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:next},bubbles:true,composed:true}));
    }
    _render(){
      if(!this.isConnected&&!this._hass)return;
      const html=SPEC.map((group,i)=>{const colors=group.fields.filter(f=>f.kind==="color").map(f=>'<label class="palette"><span>'+f.label+'</span><input type="color" data-color="'+f.path+'" value="'+safeColor(get(this._config,f.path)??f.default)+'" aria-label="'+f.label+'"></label>').join("");return '<details '+(i===0||i===1?"open":"")+'><summary>'+group.title+'</summary><div class="content"><ha-form data-group="'+i+'"></ha-form>'+(colors?'<div class="colors"><strong>Palette — sélectionner une couleur</strong><div class="color-grid">'+colors+'</div><small>Les champs texte au-dessus acceptent aussi les variables CSS du thème.</small></div>':"")+'</div></details>';}).join("");
      this.shadowRoot.innerHTML='<style>:host{display:block;color:var(--primary-text-color)}details{border:1px solid var(--divider-color);border-radius:var(--ha-border-radius-md,10px);margin:8px 0;overflow:hidden}summary{padding:14px;font-size:14px;font-weight:600;cursor:pointer;background:var(--secondary-background-color)}.content{padding:14px}ha-form{display:block}ha-form::part(root){display:block}.colors{padding-top:15px;margin-top:10px;border-top:1px solid var(--divider-color)}.colors>strong{font-size:12px}.colors small{display:block;color:var(--secondary-text-color);font-size:11px;margin-top:10px}.color-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.palette{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}.palette input{width:40px;height:32px;padding:0;border:0;cursor:pointer;background:transparent}summary:focus-visible{outline:2px solid var(--primary-color)}</style>'+html;
      this._rendered=true;
      SPEC.forEach((group,i)=>{
        const form=this.shadowRoot.querySelector('ha-form[data-group="'+i+'"]');
        if(!form)return;
        form.hass=this._hass;
        form.schema=group.fields.map(f=>this._fieldSchema(f));
        form.data=Object.fromEntries(group.fields.map(f=>[toKey(f.path),this._fieldValue(f)]).filter(([,v])=>v!==undefined));
        form.computeLabel=schema=>group.fields.find(f=>toKey(f.path)===schema.name)?.label??schema.name;
        form.computeHelper=schema=>group.fields.find(f=>toKey(f.path)===schema.name)?.help;
        form.addEventListener("value-changed",ev=>{ev.stopPropagation();if(ev.detail?.value&&typeof ev.detail.value==="object")this._onForm(group,ev.detail.value);});
        for(const input of this.shadowRoot.querySelectorAll("input[data-color]")){if(!group.fields.some(f=>f.path===input.dataset.color))continue;input.addEventListener("input",()=>{const field=group.fields.find(f=>f.path===input.dataset.color),value=input.value;form.data={...(form.data??{}),[toKey(field.path)]:value};this._onForm({fields:[field]},{[toKey(field.path)]:value});});}
      });
    }
    connectedCallback(){if(!this._rendered)this._render();}
  }
  customElements.define(EDITOR,CardVisualEditor);
  Card.getConfigElement=()=>document.createElement(EDITOR);
})();
