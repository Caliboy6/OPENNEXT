/* Homepage market cards. Prices are dated observations, not firm OpenNEXT stock.
 * Source metadata is intentionally retained for maintenance, not rendered in UI.
 * Model: standard non-cached input/output. Rental: buyer targets, not seller asks.
 * Hardware: whole-card or whole-server prices; never divide servers into GPUs.
 */
(() => {
  'use strict';
  const observedAt = '2026-10-13';
  const models = [
    {id:'model-gpt-sol',name:'GPT-6.1 Sol',brand:'OpenAI',input:2,output:10,context:'272K price tier',note:'Standard tier · input up to 272K tokens.',sourceUrl:'https://developers.openai.com/api/docs/models/gpt-6.1-sol'},
    {id:'model-claude-sonnet',name:'Claude Sonnet 5.5',brand:'Anthropic',input:2,output:10,context:'1M context',note:'Standard global routing · tools billed separately.',sourceUrl:'https://platform.claude.com/docs/en/about-claude/pricing'},
    {id:'model-gemini-flash',name:'Gemini 3.8 Flash',brand:'Google',input:.75,output:3.75,context:'Paid standard',note:'Current rate through 31 Dec 2026 · thinking included.',sourceUrl:'https://ai.google.dev/gemini-api/docs/pricing#gemini-3.8-flash'},
    {id:'model-deepseek-flash',name:'DeepSeek V4.1 Flash',brand:'DeepSeek',input:.30,output:1.20,context:'1M context',note:'Peak-hour, non-cached rate · off-peak pricing varies.',sourceUrl:'https://api-docs.deepseek.com/quick_start/pricing/'},
    {id:'model-kimi',name:'Kimi K2.6',brand:'Kimi',input:.95,output:4,context:'256K context',note:'Non-cached input · taxes excluded.',sourceUrl:'https://platform.kimi.ai/docs/pricing/chat'},
    {id:'model-glm',name:'GLM-5.3',brand:'GLM',input:1.40,output:4.40,context:'1M context',note:'Standard USD API rate · reasoning enabled.',sourceUrl:'https://docs.z.ai/guides/overview/pricing'},
    {id:'model-gpt-luna',name:'GPT-6 Luna',brand:'OpenAI',input:.10,output:.50,context:'272K price tier',note:'Standard tier · input up to 272K tokens.',sourceUrl:'https://developers.openai.com/api/docs/models/gpt-6-luna'},
    {id:'model-claude-opus',name:'Claude Opus 5.5',brand:'Anthropic',input:4,output:20,context:'1M context',note:'Standard global routing · Fast mode not included.',sourceUrl:'https://platform.claude.com/docs/en/about-claude/pricing'},
    {id:'model-gemini-lite',name:'Gemini 3.5 Flash-Lite',brand:'Google',input:.30,output:2.50,context:'Text API',note:'Paid standard text · thinking included.',sourceUrl:'https://ai.google.dev/gemini-api/docs/pricing#gemini-3.5-flash-lite'},
    {id:'model-deepseek-pro',name:'DeepSeek V4 Pro',brand:'DeepSeek',input:1.32,output:3.96,context:'1M context',note:'V4-Pro-0813 · peak-hour, non-cached rate.',sourceUrl:'https://api-docs.deepseek.com/quick_start/pricing/'},
    {id:'model-gpt-astra',name:'GPT-6 Astra',brand:'OpenAI',input:10,output:50,context:'272K price tier',note:'Standard tier · input up to 272K tokens.',sourceUrl:'https://developers.openai.com/api/docs/models/gpt-6-astra'},
    {id:'model-claude-haiku',name:'Claude Haiku 5.5',brand:'Anthropic',input:.10,output:.50,context:'100K price tier',note:'Input up to 100K · longer requests use a higher tier.',sourceUrl:'https://platform.claude.com/docs/en/about-claude/pricing'},
  ].map(item => ({...item,kind:'model',priceKind:'public_api_reference',unit:'USD / 1M tokens',observedAt}));

  const rentals = [
    ['rental-h200-128','H200','128','1,024+','Worldwide',12,1.80,'Flexible specification · large-cluster requirement.'],
    ['rental-b200-128','B200','128','1,024+','Europe',12,2.30,'Frankfurt, Amsterdam or Paris · annual commitment.'],
    ['rental-h100-128','H100','128','1,024+','Worldwide',12,1.60,'HGX cluster · standard network and storage.'],
    ['rental-b200-100','B200','100','800+','Worldwide',12,3.00,'B200 / H200 alternatives · dedicated InfiniBand.'],
    ['rental-b200-64','B200','64','512+','California',12,2.80,'High-speed interconnect · dedicated bandwidth.'],
    ['rental-b200-64-128','B200','64–128','512+','US · UK',12,2.80,'400 Gb/s InfiniBand or RoCEv2 · 12–24 months.'],
    ['rental-h200-20','H200','20','160+','Flexible',12,1.40,'Annual commitment · flexible location.'],
    ['rental-b300-16','B300','16','128+','United States',12,4.40,'Texas preferred · high-bandwidth network and storage.'],
    ['rental-b200-16','B200','16','128+','United States',6,3.90,'Tier 3 data center · 6–12 month commitment.'],
    ['rental-h100-10','H100','10','80+','Flexible',12,1.25,'Annual cluster requirement · open location.'],
    ['rental-b200-4','B200','4','32+','Flexible',12,2.30,'Production inference and fine-tuning.'],
    ['rental-h200-4','H200','4','32+','European Union',6,1.85,'Six-month commitment · HGX networking.'],
    ['rental-h200-1','H200','1','8+','United States',12,2.00,'Confidential-compute requirements · dedicated IPv4.'],
    ['rental-b200-1-2','B200','1–2','8+','United States',6,3.00,'Inference workload · local NVMe and 2 TB+ RAM.'],
  ].map(([id,model,nodes,count,region,months,price,note]) => ({id,kind:'rental',model,name:`${nodes} ${model} ${nodes==='1'?'node':'nodes'}`,nodes,count,region,months,price,note,gpusPerNode:8,urgency:'Medium urgency',priceKind:'buyer_target',unit:'USD / GPU-hour',observedAt,sourceUrl:'https://packet.ai/demand'}));

  const hardware = [
    {id:'hardware-h100',name:'H100 PCIe',model:'H100',memory:'80 GB HBM3',form:'PCIe',price:39500,unit:'GPU',minimum:'1 GPU',note:'Datacenter accelerator · new card.',condition:'Brand new',sourceUrl:'https://www.serversupply.com/GPU/HBM2E/80GB/NVIDIA/900-21010-0300-030_399240.htm'},
    {id:'hardware-h200',name:'H200 NVL',model:'H200',memory:'141 GB HBM3e',form:'PCIe Gen 5',price:34500,unit:'GPU',minimum:'20 GPUs',note:'20–49 GPU price tier · condition to be confirmed.',sourceUrl:'https://gatewellusa.com/ai-compute/p/nvidia-h200-nvl'},
    {id:'hardware-a100',name:'A100 80 GB',model:'A100',memory:'80 GB ECC',form:'PCIe 4.0',price:19789,unit:'GPU',minimum:'1 GPU',note:'Datacenter accelerator · kit configuration.',sourceUrl:'https://www.newegg.com/p/N82E16814133879'},
    {id:'hardware-l40s',name:'L40S',model:'L40S',memory:'48 GB GDDR6',form:'PCIe 4.0',price:8595,unit:'GPU',minimum:'1 GPU',note:'Inference and graphics · limit 1 per customer.',sourceUrl:'https://www.newegg.com/p/N82E16888892001'},
    {id:'hardware-5090',name:'RTX 5090 TUF',model:'RTX 5090',memory:'32 GB GDDR7',form:'PCIe 5.0',price:4799.99,unit:'GPU',minimum:'1 GPU',note:'ASUS TUF Gaming · availability to be confirmed.',status:'Temporarily unavailable',sourceUrl:'https://www.bhphotovideo.com/c/product/1875530-REG/asus_tuf_rtx5090_32g_gaming_geforce_rtx_5090_tuf.html'},
    {id:'hardware-pro-maxq',name:'RTX PRO 6000 Max-Q',model:'RTX PRO 6000',memory:'96 GB GDDR7',form:'PCIe · 300 W',price:17499,unit:'GPU',minimum:'1 GPU',note:'Blackwell Max-Q · OEM configuration.',sourceUrl:'https://www.bhphotovideo.com/c/product/1895189-REG/nvidia_900_5g153_2200_000_rtx_pro_6000_blackwell.html'},
    {id:'hardware-pro-workstation',name:'RTX PRO 6000 Workstation',model:'RTX PRO 6000',memory:'96 GB GDDR7',form:'PCIe · 600 W',price:17999,unit:'GPU',minimum:'1 GPU',note:'Blackwell Workstation · OEM · limit 2 per customer.',sourceUrl:'https://www.newegg.com/p/N82E16888892012'},
    {id:'hardware-hgx-h100',name:'8× HGX H100 server',model:'H100',memory:'8 × 80 GB',form:'8U · SXM5',price:319924,unit:'server',minimum:'1 server',note:'Complete system · NVSwitch · dual EPYC.',sourceUrl:'https://configurator.exxactcorp.com/configure/TS4-193475697'},
    {id:'hardware-hgx-b200',name:'8× HGX B200 server',model:'B200',memory:'8 × 180 GB',form:'10U · SXM',price:402198.50,unit:'server',minimum:'1 server',note:'Complete system · NVSwitch · dual Xeon.',sourceUrl:'https://configurator.exxactcorp.com/configure/TS4-169219634'},
    {id:'hardware-hgx-b300',name:'8× HGX B300 server',model:'B300',memory:'8 × 288 GB',form:'8U · SXM',price:580199.40,unit:'server',minimum:'1 server',note:'Complete system · 3 TB DDR5 · NVSwitch.',sourceUrl:'https://configurator.exxactcorp.com/configure/TS4-104366747'},
  ].map(item => ({...item,kind:'hardware',priceKind:'reference_purchase',observedAt}));

  const groups = [models, rentals, hardware];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money = value => Number(value).toLocaleString('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2});
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({left:'<path d="m14 6-6 6 6 6"/>',right:'<path d="m10 6 6 6-6 6"/>',pause:'<path d="M9 6v12M15 6v12"/>',play:'<path d="m9 5 10 7-10 7V5Z"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>'})[name]}</svg>`;
  const metric = (label,value) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`;

  function card(item,index) {
    const isModel = item.kind==='model', isRental = item.kind==='rental';
    const tag = isModel?'API reference':isRental?'Buyer demand':item.unit==='server'?'Complete system':'Physical GPU';
    const place = isModel?item.brand:isRental?item.region:'NVIDIA';
    const specs = isModel?metric('Context / tier',item.context)+metric('Billing','Per 1M tokens'):isRental?metric('Total GPUs',item.count)+metric('GPUs / node',8)+metric('Nodes',item.nodes)+metric('Minimum term',item.months+' months'):metric('Memory',item.memory)+metric('Form factor',item.form)+metric('Price unit','Per '+item.unit)+metric('Min. order',item.minimum);
    const prices = isModel?`<div class="on-listing-token-prices"><div><span>Input / 1M tokens</span><strong>${money(item.input)}</strong></div><div><span>Output / 1M tokens</span><strong>${money(item.output)}</strong></div></div>`:`<div class="on-listing-single-price"><span>${isRental?'Buyer target price':'Reference purchase price'}</span><div><strong>${money(item.price)}</strong><small>${isRental?'/ GPU-hour':'/ '+item.unit}</small></div></div>`;
    const target = isModel?'models':isRental?'supply':'rfq';
    const marker=isRental?`<span class="on-listing-urgency">${escape(item.urgency)}</span>`:`<span class="on-listing-card-number">${String(index+1).padStart(2,'0')}</span>`;
    return `<article class="on-listing-card" data-listing-id="${item.id}" data-listing-index="${index}" role="group" aria-roledescription="slide" aria-label="${index+1} of ${groups[isModel?0:isRental?1:2].length}: ${escape(item.name)}"><div class="on-listing-card-top"><span class="on-listing-kind"><i></i>${tag}</span>${marker}</div><h3>${escape(item.name)}</h3><div class="on-listing-location">${icon('globe')}<span>${escape(place)}</span></div><p class="on-listing-description">${escape(item.note)}</p><dl class="on-listing-specs">${specs}</dl><div class="on-listing-pricing">${prices}<p>${isModel?'Standard, non-cached rate':isRental?'Dedicated cluster · '+item.months+'+ months':item.status||'Price and delivery subject to quote'}</p></div><button class="on-listing-cta" type="button" data-public-action="open-workspace" data-target="${target}" data-listing-selection="${item.id}"${isRental?' data-mode="rental"':item.kind==='hardware'?' data-mode="hardware"':''}><span>${isRental?'Offer capacity':'Request quote'}</span>${icon('right')}</button></article>`;
  }

  function render(copy) {
    const names = [copy.models,copy.rental,copy.physical];
    return `<div class="public-listing-preview on-listing-carousel" role="region" aria-roledescription="carousel" aria-label="Capacity market listings">${names.map((name,i)=>`<input class="public-listing-radio" type="radio" name="public-listings" id="public-listings-${i}"${i===0?' checked':''}><label class="public-listing-tab public-listing-tab-${i}" for="public-listings-${i}">${escape(name)}</label>`).join('')}<div class="on-listing-controls"><span class="on-listing-position" aria-hidden="true">01 — 05 / ${models.length}</span><button type="button" data-listing-move="-1" aria-label="Previous listing">${icon('left')}</button><button type="button" data-listing-toggle aria-label="Pause listing carousel" aria-pressed="false">${icon('pause')}</button><button type="button" data-listing-move="1" aria-label="Next listing">${icon('right')}</button></div><div class="public-listing-panels">${groups.map((items,i)=>`<div class="public-listing-panel public-listing-panel-${i}" role="region" aria-label="${escape(names[i])}" data-listing-panel="${i}"><div class="on-listing-viewport"><div class="on-listing-track">${items.map(card).join('')}</div></div></div>`).join('')}</div><div class="on-listing-under"><span>USD · Final availability, fees and delivery confirmed by quote.</span><span class="on-listing-motion-hint">Hover to pause</span></div><span class="on-listing-announcement" role="status" aria-live="polite"></span></div>`;
  }

  let component = null;
  let timer = null;
  let visibilityObserver = null;
  let resizeObserver = null;
  let states = [];
  let inView = false;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const active = () => states[Number(component?.querySelector('.public-listing-radio:checked')?.id.split('-').pop()||0)];

  function visibleCount() {
    return Math.max(1,Number(getComputedStyle(component).getPropertyValue('--on-visible-cards'))||5);
  }
  function update(manual=false) {
    if (!component) return;
    const state = active(), count = visibleCount();
    if (!state) return;
    const cards = [...state.track.children];
    cards.forEach((item,i)=>{item.inert=i>=count;item.setAttribute('aria-hidden',String(i>=count));});
    const start = Number(cards[0].dataset.listingIndex)+1;
    const end = (start+count-2)%cards.length+1;
    component.querySelector('.on-listing-position').textContent=`${String(start).padStart(2,'0')} — ${String(end).padStart(2,'0')} / ${cards.length}`;
    if (manual) component.querySelector('.on-listing-announcement').textContent=`Showing ${count} listings, starting with ${cards[0].querySelector('h3').textContent}.`;
    const toggle = component.querySelector('[data-listing-toggle]');
    toggle.setAttribute('aria-label',`${paused?'Play':'Pause'} listing carousel`);
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.innerHTML=icon(paused?'play':'pause');
    component.dataset.paused=String(paused);
  }

  function step(direction=1,manual=false) {
    const state=active();
    if (!state || state.busy || state.track.children.length<=visibleCount()) return;
    const track=state.track, first=track.firstElementChild;
    const distance=first.getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap||'0');
    if (!distance) return;
    state.busy=true;
    state.finish=() => {
      clearTimeout(state.fallback);
      track.removeEventListener('transitionend',ended);
      if (direction>0) track.append(track.firstElementChild);
      track.style.transition='none';
      track.style.transform='translate3d(0,0,0)';
      state.busy=false;
      state.finish=null;
      track.classList.remove('is-moving');
      update(manual);
    };
    const ended=event=>{if(event.target===track&&event.propertyName==='transform')state.finish?.();};
    track.addEventListener('transitionend',ended);
    track.classList.add('is-moving');
    if (direction<0) {
      track.prepend(track.lastElementChild);
      track.style.transition='none';
      track.style.transform=`translate3d(-${distance}px,0,0)`;
      void track.offsetWidth;
    }
    track.style.transition=reducedMotion.matches?'none':'transform 580ms cubic-bezier(.22,.68,.2,1)';
    track.style.transform=direction>0?`translate3d(-${distance}px,0,0)`:'translate3d(0,0,0)';
    state.fallback=setTimeout(()=>state.finish?.(),reducedMotion.matches?0:660);
  }

  function destroy() {
    clearInterval(timer);
    timer=null;
    visibilityObserver?.disconnect();
    resizeObserver?.disconnect();
    states.forEach(state=>{clearTimeout(state.fallback);});
    states=[];
    component=null;
    inView=false;
  }
  function mount() {
    const next=document.querySelector('.on-listing-carousel');
    if (next===component) return;
    destroy();
    if (!next) return;
    component=next;
    states=[...next.querySelectorAll('[data-listing-panel]')].map(panel=>({panel,track:panel.querySelector('.on-listing-track'),busy:false}));
    update();
    component.addEventListener('change',event=>{
      if(!event.target.matches('.public-listing-radio'))return;
      states.forEach(state=>state.finish?.());
      update(true);
    });
    component.addEventListener('click',event=>{
      const move=event.target.closest('[data-listing-move]'),toggle=event.target.closest('[data-listing-toggle]');
      if(move){event.preventDefault();step(Number(move.dataset.listingMove),true);}
      if(toggle){event.preventDefault();paused=!paused;update();}
    });
    component.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key)||event.target.matches('.public-listing-radio'))return;
      event.preventDefault();step(event.key==='ArrowLeft'?-1:1,true);
    });
    let startX=null,swipedUntil=0;
    const viewport=component.querySelector('.public-listing-panels');
    viewport.addEventListener('pointerdown',event=>{if(event.pointerType==='touch')startX=event.clientX;});
    viewport.addEventListener('pointerup',event=>{
      if(startX===null)return;
      const delta=event.clientX-startX;startX=null;
      if(Math.abs(delta)>45){swipedUntil=performance.now()+350;step(delta<0?1:-1,true);}
    });
    viewport.addEventListener('pointercancel',()=>{startX=null;});
    viewport.addEventListener('click',event=>{if(performance.now()<swipedUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    visibilityObserver=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;},{threshold:.15});
    visibilityObserver.observe(viewport);
    resizeObserver=new ResizeObserver(()=>{states.forEach(state=>state.finish?.());update();});
    resizeObserver.observe(viewport);
    timer=setInterval(()=>{
      if(!component?.isConnected){destroy();return;}
      if(paused||!inView||document.hidden||component.matches(':hover')||component.querySelector('.on-listing-card:focus-within'))return;
      step(1);
    },4600);
  }
  reducedMotion.addEventListener('change',event=>{if(event.matches){paused=true;update();}});
  new MutationObserver(mount).observe(document.getElementById('app'),{childList:true});
  window.OpenNEXTListings={render,get:id=>groups.flat().find(item=>item.id===id),mount,step,destroy,groups};
})();
