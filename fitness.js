const fitnessMeals = [
  {id:101,name:'鸡胸西兰花能量碗',emoji:'🥗',bg:'#e4edd9',mins:25,cat:'健身餐',needs:[['鸡胸肉',200,'g'],['西兰花',200,'g'],['米饭',150,'g']],protein:54,carbs:53,fat:10,meatless:false,steps:['鸡胸肉冷藏解冻后切块，西兰花洗净。','用少量油将鸡肉煎至完全熟透，西兰花煮熟。','搭配充分加热的米饭装碗。']},
  {id:102,name:'番茄豆腐鸡蛋饭',emoji:'🍲',bg:'#f2e7d5',mins:20,cat:'健身餐',needs:[['豆腐',200,'g'],['鸡蛋',2,'个'],['番茄',150,'g'],['米饭',150,'g']],protein:30,carbs:56,fat:20,meatless:true,steps:['番茄和豆腐切块，鸡蛋打散。','用少量油炒熟鸡蛋，加入番茄和豆腐煮至全熟。','搭配充分加热的米饭。含蛋和大豆，请按个人忌口选择。']},
  {id:103,name:'三文鱼双蔬米饭碗',emoji:'🍱',bg:'#ede4d9',mins:30,cat:'健身餐',needs:[['三文鱼',150,'g'],['西兰花',150,'g'],['胡萝卜',100,'g'],['米饭',200,'g']],protein:37,carbs:66,fat:25,meatless:false,steps:['三文鱼冷藏解冻，蔬菜洗净切块。','少量油煎鱼至完全熟透，蔬菜煮熟。','搭配充分加热的米饭，按口味适量调味。']}
];
const fitnessGoals = {
  balanced:{name:'日常均衡',icon:'🌿',title:'认真训练，也好好吃饭。',tip:'让主食、蛋白质食材与蔬菜一起出现在餐盘里，轮换不同食材。',reason:'优先用现有食材，兼顾主食、蔬菜与蛋白质搭配。'},
  muscle:{name:'增肌搭配',icon:'💪',title:'给训练，配一顿扎实的饭。',tip:'规律吃饭，在各餐中安排蛋白质食材，同时保留主食，为训练提供能量。',reason:'在本次示例中优先展示蛋白质估算较高的餐食。'},
  lean:{name:'减脂搭配',icon:'🥬',title:'吃得有计划，也吃得满足。',tip:'保留主食与蛋白质，增加蔬菜搭配，留意烹调油和份量；不以跳餐替代合理饮食。',reason:'在本次示例中优先展示能量估算较低的完整餐食。'}
};
function fitnessPrefs(){
  const p=state.fitness||{};
  return {goal:Object.hasOwn(fitnessGoals,p.goal)?p.goal:'balanced',day:p.day==='rest'?'rest':'training',preference:p.preference==='meatless'?'meatless':'all',time:[20,30].includes(p.time)?p.time:0};
}
function fitnessEnergy(r){return r.protein*4+r.carbs*4+r.fat*9}
function fitnessRecommendations(){
  const p=fitnessPrefs();
  return fitnessMeals.filter(r=>(p.preference!=='meatless'||r.meatless)&&(!p.time||r.mins<=p.time)).sort((a,b)=>{
    const goal=p.goal==='muscle'?b.protein-a.protein:p.goal==='lean'?fitnessEnergy(a)-fitnessEnergy(b):0;
    return goal||matching(b)/b.needs.length-matching(a)/a.needs.length||a.mins-b.mins;
  });
}
function fitness(){
  const p=fitnessPrefs(),goal=fitnessGoals[p.goal],list=fitnessRecommendations();
  return heading('健身饮食，让每一餐支持你的节奏。','按目标选搭配，结合冰箱库存，把计划落到餐桌上。','MOVE WELL / EAT WELL')+`
  <section class="panel fitness-settings"><div class="fitness-goals">${Object.entries(fitnessGoals).map(([key,g])=>`<button data-fit-goal="${key}" aria-pressed="${key===p.goal}" class="${key===p.goal?'active':''}"><span>${g.icon}</span><strong>${g.name}</strong></button>`).join('')}</div>
  <div class="fitness-filters"><label>今天的节奏<select id="fit-day"><option value="training" ${p.day==='training'?'selected':''}>训练日</option><option value="rest" ${p.day==='rest'?'selected':''}>休息日</option></select></label><label>饮食偏好<select id="fit-preference"><option value="all">不限荤素</option><option value="meatless" ${p.preference==='meatless'?'selected':''}>不吃肉和鱼（可含蛋）</option></select></label><label>烹饪时间<select id="fit-time"><option value="0">不限</option><option value="20" ${p.time===20?'selected':''}>20 分钟以内</option><option value="30" ${p.time===30?'selected':''}>30 分钟以内</option></select></label></div></section>
  <section class="fitness-guidance"><div><span class="tag">${goal.icon} ${goal.name} · ${p.day==='training'?'训练日':'休息日'}</span><h2>${goal.title}</h2><p>${goal.tip}</p><p class="subnote">${p.day==='training'?'今天有训练：根据训练安排正常进餐，留意补水；训练前后选择自己消化适应的食物。':'今天休息：继续规律进餐、保证食材多样性，不必因为休息而跳餐。'}</p></div><span class="fitness-art" aria-hidden="true">${goal.icon}</span></section>
  <div class="section-head"><div><h2>你的健身餐灵感</h2><p>${goal.reason}</p></div><span class="subnote">${list.length} 道搭配</span></div>
  <div class="recipes fitness-recipes">${list.map(r=>`<button class="recipe" data-recipe="${r.id}"><div class="food-art" style="--food-bg:${r.bg}"><span class="tag">${matching(r)===r.needs.length?'现有食材就能做':'还缺 '+(r.needs.length-matching(r))+' 种食材'}</span><span class="dish">${r.emoji}</span></div><div class="recipe-info"><h3>${r.name}</h3><p>${r.needs.map(n=>n[0]).join(' · ')}</p><div class="fitness-macros"><span><b>${fitnessEnergy(r)}</b><small>千卡 ≈</small></span><span><b>${r.protein}g</b><small>蛋白质 ≈</small></span><span><b>${r.carbs}g</b><small>碳水 ≈</small></span><span><b>${r.fat}g</b><small>脂肪 ≈</small></span></div><div class="recipe-meta"><span>◷ ${r.mins} 分钟 · 1 人份</span><span>查看做法 / 加入计划 ↗</span></div></div></button>`).join('')||'<div class="empty">暂无符合偏好的健身餐，试试放宽烹饪时间。</div>'}</div>
  <section class="panel" style="margin-top:24px"><h2>先选搭配，再安排这一餐</h2><p class="subnote">点开食谱可查看用量、做法和库存缺口，加入饮食计划后自动汇总采购需求；做好后可记录餐食并扣减库存。</p><div class="modal-actions"><button class="secondary" data-go="diet">查看饮食计划 →</button><button class="secondary" data-go="shopping">补齐所需食材 →</button></div><p class="subnote">营养数值为每份示例估算，含少量烹调油；米饭按熟重、肉和蔬菜按烹调前重量。品牌、可食部分和做法会改变结果，不能作为个人全天能量处方或效果保证。当前偏好筛选不等于过敏原筛查。</p><p class="subnote">搭配原则参考 <a href="https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eating-a-balanced-diet/" target="_blank" rel="noopener noreferrer">NHS 均衡饮食指南 ↗</a>；食谱数值为 Demo 示例，并非该指南提供的营养数据。</p></section>`;
}
function mountFitness(){
  if(page==='diet'){
    document.querySelector('#main .intro')?.insertAdjacentHTML('afterend','<button class="fitness-entry" data-go="fitness"><span>💪</span><div><strong>健身饮食推荐</strong><small>增肌 · 减脂 · 均衡，找到今天的餐食搭配</small></div><b>→</b></button>');
    document.querySelector('.fitness-entry').onclick=()=>go('fitness');
  }
  if(page!=='fitness')return;
  document.querySelectorAll('[data-fit-goal]').forEach(b=>b.onclick=()=>{state.fitness={...fitnessPrefs(),goal:b.dataset.fitGoal};save();render()});
  for(const [id,key] of [['fit-day','day'],['fit-preference','preference'],['fit-time','time']])document.querySelector('#'+id).onchange=e=>{state.fitness={...fitnessPrefs(),[key]:key==='time'?Number(e.target.value):e.target.value};save();render()};
}
function fitnessDetailNote(id){
  const r=fitnessMeals.find(r=>r.id===id);
  return r?`<div class="storage-tip">每份示例估算：${fitnessEnergy(r)} 千卡 · 蛋白质 ${r.protein}g · 碳水 ${r.carbs}g · 脂肪 ${r.fat}g<br>米饭为熟重；含少量烹调油，实际营养随原料和做法变化。</div>`:'';
}
