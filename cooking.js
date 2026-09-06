// Demonstration transport only. No network request or heating command is sent.
const kitchenDevices = [
  {id:'pan',name:'厨房 · 智能炒菜机',icon:'🍳',status:'online',recipes:[1,2,4,101,102]},
  {id:'oven',name:'厨房 · 蒸烤箱',icon:'♨',status:'online',recipes:[2,3,101,103]},
  {id:'rice',name:'厨房 · 智能电饭煲',icon:'🍚',status:'online',recipes:[1,3,101,102,103]}
];
let cookingDraft=null,cookingInput='',cookingMessage='',cookingSelected=1,cookingPending=null;
function kitchenStatus(id){return state.kitchenStatus?.[id]||kitchenDevices.find(d=>d.id===id)?.status}
function cookingRecipeOptions(){return recipes.map(r=>`<option value="${r.id}" ${r.id===cookingSelected?'selected':''}>${r.name}</option>`).join('')}
function cookingTasks(recipeId){
  const r=recipes.find(x=>x.id===recipeId);if(!r)return [];
  const oven=[3,103].includes(r.id);
  const main={device:oven?'oven':'pan',mode:oven?'示例蒸烤程序':'示例炒菜程序',temperature:oven?180:120,minutes:oven?18:12,portion:'1 人份',steps:oven?['准备并放入鱼和蔬菜。','设备执行示例蒸烤程序。','取出后检查熟度，人工装盘。']:['按菜谱完成洗切、解冻和备料。','按设备提示分步投料，执行示例炒菜程序。','检查熟度后盛出。']};
  const tasks=[main];
  if(r.needs.some(n=>n[0]==='米饭'))tasks.push({device:'rice',mode:'示例熟米饭复热',temperature:100,minutes:8,portion:'1 人份',steps:['将菜谱所需熟米饭放入适用容器。','按具体机型要求准备复热。','执行示例复热程序，确认充分加热后装盘。']});
  return tasks;
}
function buildCookingDraft(id){
  const r=recipes.find(x=>x.id===id);if(!r)return null;
  return {id:'draft-'+Date.now()+'-'+Math.random().toString(36).slice(2),recipe:r.id,name:r.name,tasks:cookingTasks(r.id),created:Date.now(),status:'draft'};
}
function validateCooking(draft){
  if(!draft||draft.status!=='draft')return '请重新生成待确认菜谱。';
  if(Date.now()-draft.created>5*60*1000)return '方案已超过 5 分钟，请重新生成并确认。';
  const r=recipes.find(x=>x.id===draft.recipe);if(!r)return '菜谱不存在，请重新选择。';
  for(const task of draft.tasks){
    const device=kitchenDevices.find(d=>d.id===task.device);
    if(!device||!device.recipes.includes(r.id))return '设备不支持这道菜谱，请重新选择设备。';
    if(kitchenStatus(device.id)!=='online')return device.name+' 当前离线，请恢复在线后重新确认。';
  }
  return '';
}
function parseCookingSentence(text){
  text=text.trim();if(!text)return {error:'请说说你想做什么，或从下方选择菜谱。'};
  const serving=text.match(/(\d+|[一二两三四五六七八九十])\s*(?:人份|人|份)/);
  if(serving&&!['1','一'].includes(serving[1]))return {error:'设备示例程序仅支持 1 人份，请调整为一份后重新生成。'};
  if(/空气炸锅|微波炉|电磁炉/.test(text))return {error:'当前未接入这类设备，可使用下方示例炒菜机、蒸烤箱或电饭煲。'};
  let matches=recipes.filter(r=>text.includes(r.name));
  if(matches.length===0)matches=recipes.filter(r=>r.needs.some(n=>text.includes(n[0])));
  if(matches.length!==1)return {error:matches.length?'匹配到多道菜，请在下方选择准确菜谱后生成方案。':'暂未匹配到菜谱，请从下方选择支持的示例菜谱。'};
  const id=matches[0].id,tasks=cookingTasks(id);
  for(const [word,device]of [['蒸烤箱','oven'],['炒菜机','pan'],['电饭煲','rice']])if(text.includes(word)&&!tasks.some(t=>t.device===device))return {error:'当前菜谱未提供指定设备的程序，请选择其他菜谱或去掉设备要求。'};
  return {id};
}
function cookingTaskCards(draft){return draft.tasks.map(t=>{const d=kitchenDevices.find(x=>x.id===t.device);return `<article class="cook-task"><div class="section-head" style="margin:0"><h3>${d.icon} ${d.name}</h3><span class="badge ${kitchenStatus(d.id)==='online'?'good':'bad'}">模拟${kitchenStatus(d.id)==='online'?'在线':'离线'}</span></div><p>${t.mode} · ${t.portion}</p><div class="cook-parameters"><span><b>${t.temperature}°C</b><small>示例设定温度</small></span><span><b>${t.minutes} 分钟</b><small>示例程序时长</small></span></div><ol class="steps">${t.steps.map(s=>`<li>${s}</li>`).join('')}</ol></article>`}).join('')}
function cooking(){
  const r=cookingDraft&&recipes.find(r=>r.id===cookingDraft.recipe),error=cookingDraft?validateCooking(cookingDraft):'';
  const records=state.cookingRecords||[];
  return heading('一句话，让厨房准备好。','匹配菜谱 → 确认设备与程序 → 模拟下发 → 到设备端准备并启动。','ONE SENTENCE / CONNECTED KITCHEN')+`
  <section class="panel"><span class="tag">设备联动演示 · 未连接真实家庭设备</span><h2 style="margin-top:18px">今天想做什么？</h2><form id="cooking-form" class="toolbar"><input id="cooking-request" aria-label="一句话烹饪" maxlength="150" value="${esc(cookingInput)}" placeholder="例如：帮我做一份番茄滑蛋饭"><button class="primary">生成下发方案</button></form><div class="suggestions">${['帮我做一份番茄滑蛋饭','用蒸烤箱做三文鱼蔬菜饭','做一份鸡胸西兰花能量碗'].map(s=>`<button class="secondary" data-cook-example="${s}">${s}</button>`).join('')}</div><p class="subnote" id="cooking-message" role="status">${esc(cookingMessage||'输入文字或点选示例；此步骤只生成方案，不会下发菜谱。')}</p><div class="cook-select"><label>或直接选择菜谱<select id="cooking-recipe">${cookingRecipeOptions()}</select></label><button class="secondary" id="cooking-build">生成所选菜谱方案</button></div></section>
  <section class="panel" style="margin-top:20px"><h2>我的烹饪设备 <span class="subnote">/ 示例家庭</span></h2><div class="cook-devices">${kitchenDevices.map(d=>`<div><span class="emoji">${d.icon}</span><strong>${d.name}</strong><label>模拟连接状态<select data-device-status="${d.id}"><option value="online" ${kitchenStatus(d.id)==='online'?'selected':''}>在线</option><option value="offline" ${kitchenStatus(d.id)==='offline'?'selected':''}>离线</option></select></label></div>`).join('')}</div></section>
  ${cookingDraft?`<section class="panel" style="margin-top:20px"><div class="section-head" style="margin-top:0"><div><h2>${esc(r.name)} · 1 人份</h2><p>待用户确认 · ${cookingDraft.tasks.length} 台示例设备</p></div><span class="badge">尚未下发</span></div><p class="subnote">${r.needs.map(([n,q,u])=>`${n} ${q}${u}`).join(' · ')}<br>${matching(r)===r.needs.length?'库存食材齐全，备料后再在设备端启动。':'存在库存缺口，可先补齐食材；下发菜谱不会扣减库存。'}</p><div class="cook-tasks">${cookingTaskCards(cookingDraft)}</div><p class="subnote">参数仅用于交互演示，未适配任何真实型号。下发只保存菜谱，不会启动加热；请在真实设备上按厂商菜谱确认装料、程序和熟度。</p>${error?`<p class="cook-error" role="status">${esc(error)}</p>`:''}<div class="modal-actions"><button class="primary" id="cooking-review" ${error?'disabled':''}>查看并确认下发</button><button class="secondary" id="cooking-discard">取消本次方案</button><button class="text-btn" data-go="shopping">查看采购清单 →</button></div></section>`:''}
  <section class="panel" style="margin-top:20px"><h2>菜谱下发记录</h2>${records.length?records.slice().reverse().slice(0,10).map(x=>`<div class="notice"><span class="emoji">✓</span><div class="notice-text"><strong>${esc(x.name)}</strong><small>${esc(x.time)} · ${x.tasks.length} 台示例设备</small><small>${x.tasks.map(t=>esc(kitchenDevices.find(d=>d.id===t.device)?.name||t.device)).join('、')}</small></div><span class="badge good">模拟已接收 · 未启动</span></div>`).join(''):'<p class="subnote">还没有下发记录。只有确认下发后才会出现在这里。</p>'}</section>`;
}
function generateCooking(id){cookingPending=null;cookingSelected=id;cookingDraft=buildCookingDraft(id);cookingMessage='已生成方案，请核对菜谱和设备。尚未下发。';render()}
function reviewCooking(){
  const error=validateCooking(cookingDraft);if(error)return toast(error);
  const snapshot=JSON.parse(JSON.stringify(cookingDraft));
  cookingPending=snapshot;
  modal('下发前，请确认',`<span class="tag">仅模拟菜谱下发 · 不启动设备</span><h3>${esc(snapshot.name)} · 1 人份</h3><div class="cook-tasks">${cookingTaskCards(snapshot)}</div><p class="subnote">以上程序将发送至列出的示例设备。未接入真实家庭；下发后仍需在设备端确认启动。</p><label class="cook-consent"><input type="checkbox" id="cooking-consent"> 我已核对菜谱、目标设备及示例参数，同意本次模拟下发</label><p id="cooking-confirm-status" role="status" class="subnote"></p><div class="modal-actions"><button class="secondary" id="cooking-cancel">暂不下发</button><button class="primary" id="cooking-send" disabled>确认并模拟下发</button></div>`);
  document.querySelector('#cooking-consent').onchange=e=>document.querySelector('#cooking-send').disabled=!e.target.checked;
  document.querySelector('#cooking-cancel').onclick=()=>{cookingPending=null;document.querySelector('#modal').close()};
  document.querySelector('#cooking-send').onclick=()=>{
    if(!document.querySelector('#cooking-consent').checked)return;
    const error=dispatchCooking(snapshot,true);
    if(error){document.querySelector('#cooking-confirm-status').textContent=error;document.querySelector('#cooking-send').disabled=true;return}
    document.querySelector('#modal').close();render();toast('示例设备已模拟接收菜谱，未启动加热');
  };
}
function dispatchCooking(snapshot,confirmed=false){
  if(!confirmed)return '请先确认本次下发。';
  if(!cookingPending||!cookingDraft||snapshot.id!==cookingPending.id||JSON.stringify(snapshot)!==JSON.stringify(cookingDraft))return '方案已变化，请重新生成并确认。';
  const error=validateCooking(snapshot);if(error)return error;
  state.cookingRecords??=[];
  if(state.cookingRecords.some(r=>r.id===snapshot.id))return '该方案已下发，请勿重复提交。';
  state.cookingRecords.push({id:snapshot.id,name:snapshot.name,recipe:snapshot.recipe,tasks:snapshot.tasks,time:new Date().toLocaleString('zh-CN'),status:'simulated_received',started:false});
  state.cookingRecords=state.cookingRecords.slice(-30);
  cookingPending=null;cookingDraft=null;cookingMessage='最近一次菜谱已模拟接收，设备尚未启动。';save();return '';
}
function mountCooking(){
  if(page!=='cooking')return;
  const request=text=>{cookingInput=text;cookingPending=null;cookingDraft=null;const result=parseCookingSentence(text);if(result.error){cookingMessage=result.error;render()}else generateCooking(result.id)};
  document.querySelector('#cooking-form').onsubmit=e=>{e.preventDefault();request(document.querySelector('#cooking-request').value)};
  document.querySelectorAll('[data-cook-example]').forEach(b=>b.onclick=()=>request(b.dataset.cookExample));
  document.querySelector('#cooking-recipe').onchange=e=>{cookingSelected=Number(e.target.value);cookingDraft=null;cookingPending=null;cookingMessage='菜谱已更改，请重新生成方案。';render()};
  document.querySelector('#cooking-build').onclick=()=>generateCooking(cookingSelected);
  document.querySelectorAll('[data-device-status]').forEach(s=>s.onchange=()=>{state.kitchenStatus??={};state.kitchenStatus[s.dataset.deviceStatus]=s.value;cookingPending=null;save();render()});
  if(cookingDraft){document.querySelector('#cooking-review').onclick=reviewCooking;document.querySelector('#cooking-discard').onclick=()=>{cookingDraft=null;cookingPending=null;cookingMessage='方案已取消，没有下发菜谱。';render()}}
}

document.addEventListener("click",event=>{const b=event.target.closest("[data-cook-recipe]");if(!b)return;document.querySelector("#modal").close();go("cooking");generateCooking(Number(b.dataset.cookRecipe))});
document.addEventListener("DOMContentLoaded",()=>document.querySelector("#modal").addEventListener("close",()=>{cookingPending=null}));
