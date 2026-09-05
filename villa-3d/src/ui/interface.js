function button(label,attributes) {
  const element=document.createElement('button');
  element.type='button'; element.className='villa-control'; element.textContent=label;
  Object.entries(attributes).forEach(([key,value])=>element.dataset[key]=value);
  return element;
}

export function createInterface({onViewChange,onWeatherChange,onModeChange,initialWeather='sunny',initialMode='exterior'}) {
  const ui=document.createElement('div'); ui.className='villa-ui';
  const brand=document.createElement('h1'); brand.className='villa-brand'; brand.innerHTML='<strong>CHERRY CONSERVATORY</strong><span>French Garden Residence</span>';
  const controls=document.createElement('nav'); controls.className='villa-controls'; controls.setAttribute('aria-label','住宅展示控制');
  const weatherGroup=document.createElement('div'); weatherGroup.className='villa-controls-group';
  [['sunny','SUN'],['cloudy','CLOUD'],['rain','RAIN'],['snow','SNOW']].forEach(([weather,label])=>weatherGroup.append(button(label,{weather})));
  const modeGroup=document.createElement('div'); modeGroup.className='villa-controls-group villa-mode-controls';
  [['exterior','EXTERIOR'],['interior','INTERIOR']].forEach(([mode,label])=>modeGroup.append(button(label,{mode})));
  const viewGroup=document.createElement('div'); viewGroup.className='villa-controls-group';
  [['default','DEFAULT'],['front','FRONT'],['garden','GARDEN'],['top','TOP']].forEach(([view,label])=>viewGroup.append(button(label,{view})));
  controls.append(weatherGroup,modeGroup,viewGroup);
  const hint=document.createElement('p'); hint.className='villa-hint'; hint.textContent='DRAG TO ROTATE · SCROLL TO ZOOM';
  ui.append(brand,controls,hint); document.body.append(ui);

  const loading=document.createElement('div'); loading.className='villa-loading'; loading.innerHTML='<div class="villa-loading-inner"><strong>CHERRY CONSERVATORY</strong><span class="villa-loading-line"></span></div>'; document.body.append(loading);

  function activate(selector,value){ controls.querySelectorAll(`[data-${selector}]`).forEach(item=>item.classList.toggle('is-active',item.dataset[selector]===value)); }
  activate('view','default'); activate('weather',initialWeather); activate('mode',initialMode);
  controls.addEventListener('click',event=>{ const target=event.target.closest('.villa-control'); if(!target)return; if(target.dataset.view){activate('view',target.dataset.view); onViewChange?.(target.dataset.view);} if(target.dataset.weather){activate('weather',target.dataset.weather); onWeatherChange?.(target.dataset.weather);} if(target.dataset.mode){activate('mode',target.dataset.mode); onModeChange?.(target.dataset.mode);} });

  return {
    hideLoading(){ loading.classList.add('is-hidden'); setTimeout(()=>loading.remove(),800); },
    setView(view){ activate('view',view); },
    setWeather(weather){ activate('weather',weather); },
    setMode(mode){ activate('mode',mode); }
  };
}
