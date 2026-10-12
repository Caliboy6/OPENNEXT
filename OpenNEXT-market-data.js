(() => {
  const catalog = [
    ['H100 SXM',80,2.30,2.99,'NVIDIA_H100','NVLink · 400 Gb/s IB',112],
    ['H100 PCIe',80,1.94,2.62,null,'PCIe Gen 5 · 100 Gb/s',72],
    ['H200',141,3.45,4.69,null,'NVLink · 400 Gb/s IB',96],
    ['B200',180,3.20,8.50,'NVIDIA_B200','NVLink 5 · 800 Gb/s IB',64],
    ['B300',288,5.76,9.40,null,'NVLink 5 · 800 Gb/s IB',40],
    ['GB200 NVL72',186,4.95,8.85,null,'NVL72 rack · liquid cooled',144],
    ['GB300 NVL72',279,7.35,11.80,null,'NVL72 rack · liquid cooled',72],
    ['A100 80GB',80,1.49,2.80,'NVIDIA_A100_SXM','NVLink · 200 Gb/s IB',160],
    ['A100 PCIe',80,2.39725,2.39725,'NVIDIA_A100','PCIe · 100 Gb/s',56],
    ['L40S',48,1.49,1.671,'NVIDIA_L40S','PCIe Gen 4 · 100 Gb/s',128],
    ['RTX PRO 6000 Blackwell',96,1.18,1.76,null,'PCIe Gen 5 · 100 Gb/s',64],
    ['RTX 5090',32,.62,.89,null,'PCIe Gen 5 · 25 Gb/s',80],
    ['RTX 4090',24,.32,.48,null,'PCIe Gen 4 · 10 Gb/s',192],
    ['AMD MI300X',192,1.85,3.99,'AMD_MI300X','Infinity Fabric · 400 Gb/s',64],
    ['AMD MI325X',256,2,4.615,'AMD_MI325X','Infinity Fabric · 400 Gb/s',32],
    ['AMD MI355X',288,2.59,2.59,'AMD_MI355X','Infinity Fabric · 800 Gb/s',32],
    ['NVIDIA GH200',96,1.99,1.99,'NVIDIA_GH200','Grace Hopper · 200 Gb/s',48]
  ].map((a,i)=>({name:a[0],memory:a[1],spot:a[2],onDemand:a[3],vultrType:a[4],network:a[5],capacity:a[6],seed:i+1}));
  const regions=[{name:'US East',code:'us-east-1',city:'N. Virginia',factor:1},{name:'US West',code:'us-west-2',city:'Oregon',factor:.98},{name:'Singapore',code:'ap-southeast-1',city:'Singapore',factor:1.12},{name:'Frankfurt',code:'eu-central-1',city:'Frankfurt',factor:1.08},{name:'Tokyo',code:'ap-northeast-1',city:'Tokyo',factor:1.19},{name:'Mumbai',code:'ap-south-1',city:'Mumbai',factor:.96},{name:'Seoul',code:'ap-northeast-2',city:'Seoul',factor:1.15},{name:'Dubai',code:'me-central-1',city:'Dubai',factor:1.17}];
  const suppliers=['Northstar Compute','Atlas Grid','Meridian Cloud','Pacific Compute','Helix Infrastructure','Vertex Capacity','Nimbus Systems','Orion GPU','Cedar Data','Cloud Harbor','Summit Compute','Stratus AI','Aperture Cloud','Kite Infrastructure','Nova Compute','Birch Systems','Aster Capacity','Bluefield AI','Mosaic Compute','Frontier Grid','Harbor Labs','Evergreen GPU','Arbor Cloud','Radiant Systems'];
  const news=[
    {source:'AMD',date:'12 Oct 2026',title:'Introducing AMD Helion, Agentic AI Compute at Rack Scale',url:'https://ir.amd.com/news-events/press-releases/detail/1301/introducing-amd-helion-agentic-ai-compute-at-rack-scale'},
    {source:'NVIDIA',date:'8 Oct 2026',title:'NVIDIA commits $1 billion to advance US science over the next five years',url:'https://nvidianews.nvidia.com/news/nvidia-commits-1-billion-to-advance-us-science-over-the-next-five-years'},
    {source:'NVIDIA',date:'1 Oct 2026',title:'How NVIDIA AI factories maximize return on investment',url:'https://blogs.nvidia.com/blog/productive-durable-fungible-ai-factories/'},
    {source:'AMD',date:'31 Aug 2026',title:'AMD, Cisco and HUMAIN expand Saudi Arabia’s AI infrastructure',url:'https://ir.amd.com/news-events/press-releases/detail/1298/amd-cisco-and-humain-expand-saudi-arabias-ai-infrastructure-as-amd-instinct-systems-go-live'}
  ];
  let livePlans=[],fetchedAt=null,feedStatus='cached';
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  function base(model,term){return term==='On-demand'?model.onDemand:term==='AMM'?model.spot*1.055:model.spot;}
  function offers(filters){const m=catalog.find(x=>x.name===filters.model)||catalog[0],r=regions.filter(x=>filters.region==='All regions'||x.name===filters.region),count=Number(filters.count)||8;return Array.from({length:24},(_,i)=>{
    const region=r[i%r.length]||regions[0],discount=count>=32?.935:count>=8?.975:1.025,rate=base(m,filters.term)*region.factor*discount*(.965+(i%6)*.032+Math.floor(i/6)*.007+(m.seed%4)*.008),available=Math.max(count,Math.floor((m.capacity+(i%5)*16)/count)*count);
    return {id:`${m.seed}-${region.code}-${i}-${filters.term}`,model:m.name,provider:suppliers[(i+m.seed)%suppliers.length],region:region.name,regionCode:region.code,city:region.city,term:filters.term,count,price:+rate.toFixed(2),available,delivery:5+(i*7+m.seed*3)%58,rating:+(4.67+((i*3+m.seed)%27)/100).toFixed(2),response:4+(i*3+m.seed)%22,uptime:+(99.90+((i+m.seed)%9)/100).toFixed(2),memory:m.memory,network:m.network,fit:98-(i%8)*3,reviews:19+i*11+m.seed*3,validUntil:new Date(Date.now()+6*3600000).toISOString()};
  }).sort((a,b)=>a.price-b.price);}
  function history(offer,period='1M'){
    const length=36,seed=catalog.find(x=>x.name===offer.model)?.seed||1,providerSeed=String(offer.provider||offer.region||'').split('').reduce((n,c)=>n+c.charCodeAt(0),0)%19,range={'1D':24,'1W':168,'1M':720,'3M':2160,'1Y':8760}[period]||720;
    return Array.from({length},(_,i)=>{const x=i/(length-1),trend=(x-1)*(.035+(seed%5)*.015+(providerSeed%4)*.004),wave=Math.sin(x*Math.PI*(2+seed%3)+seed*.6)*.022+Math.sin(x*Math.PI*6+providerSeed*.25)*.006;return {time:Date.now()-(1-x)*range*3600000,value:+(offer.price*(1+trend+wave)).toFixed(4)};});
  }
  function reference(m){const plan=livePlans.find(p=>p.gpu_type===m.vultrType);return {source:m.vultrType?'Vultr public bare-metal plans':'OpenNEXT indicative reference',url:m.vultrType?'https://www.vultr.com/pricing/#cloud-gpu':'https://packet.ai/demand',updated:fetchedAt||'2026-10-12T00:00:00Z',status:feedStatus,locations:plan?.locations||[],nodeGPUs:plan?.gpu_count||null,publicPrice:m.vultrType?m.onDemand:null};}
  async function refresh(){try{const res=await fetch('/api/market',{signal:AbortSignal.timeout(8000)});if(!res.ok)return;const data=await res.json();livePlans=data.plans||[];feedStatus=data.status||'cached';fetchedAt=data.fetchedAt;for(const m of catalog){const p=livePlans.find(x=>x.gpu_type===m.vultrType);if(p&&p.gpu_count>0){if(Number(p.hourly_cost)>0)m.onDemand=Number(p.hourly_cost)/p.gpu_count;if(Number(p.hourly_cost_preemptible)>0)m.spot=Number(p.hourly_cost_preemptible)/p.gpu_count;}}return data;}catch{return null;}}
  window.ONMarket={catalog,regions,news,money,offers,history,reference,refresh,base};
})();
