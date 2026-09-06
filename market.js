// Official landing pages only; no undocumented app schemes or order APIs.
const marketPlatforms = [
  { id: 'xiaoxiang', name: '小象超市', subtitle: '美团旗下 · 原美团买菜', mark: '象', color: '#ffe16b', url: 'https://mall.meituan.com/', hint: '打开官方入口，按页面指引进入小象超市 App，搜索清单中的食材。' },
  { id: 'jd', name: '京东', subtitle: '京东 App · 生鲜与超市', mark: '京', color: '#ffe3dd', url: 'https://app.jd.com/', hint: '打开京东官方 App 页面，进入京东后搜索食材，选择合适的商品规格。' }
];

function marketSelection() {
  const missing = shoppingData().filter(x => x.buy > 0);
  const selected = missing.filter(x => state.checked.includes(x.key));
  return { items: selected.length ? selected : missing, selected: selected.length > 0 };
}

function marketSection() {
  const selection = marketSelection();
  return `<section class="panel market-panel" aria-label="超市购物">
    <div class="market-heading"><div><div class="eyebrow">FROM YOUR LIST TO YOUR DOOR</div><h2>缺的食材，去超市补齐。</h2><p class="subnote">带上采购清单，到熟悉的平台选购。</p></div><span class="market-bag" aria-hidden="true">🛍️</span></div>
    <div class="market-platforms">${marketPlatforms.map(p => `<article class="market-card"><span class="market-mark" style="background:${p.color}">${p.mark}</span><div><h3>${p.name}</h3><p class="subnote">${p.subtitle}</p></div><button class="secondary" data-market="${p.id}">去选购 ↗</button></article>`).join('')}</div>
    <div class="market-foot"><span>${selection.items.length ? `${selection.selected ? '已选' : '全部待购'} ${selection.items.length} 种食材 · 可复制清单后前往` : '暂无采购缺口，也可以直接逛超市'}</span><span>官方入口跳转</span></div>
    <p class="subnote">商品、价格和配送范围以平台为准。清单需手动选购，订单暂不同步；收到后再确认入库。</p>
  </section>`;
}

function mountMarket() {
  if (page !== 'shopping' || document.querySelector('.market-panel')) return;
  const main = document.querySelector('#main');
  const panel = main.querySelector('section.panel');
  if (!panel) return;
  panel.insertAdjacentHTML('beforebegin', marketSection());
  const note = panel.querySelector('p.subnote');
  if (note) note.textContent = '勾选要购买的食材，可带着已选清单去超市；收到商品后再入库。未勾选时，去选购会使用全部待购项。';
  const purchase = document.querySelector('#purchase');
  if (purchase) purchase.textContent = '已收到，将勾选食材入库';
}

async function copyMarketText(text, status) {
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = '已复制。前往平台后，粘贴或逐项搜索食材。';
    return true;
  } catch {
    status.textContent = '未能自动复制，请选中下方清单手动复制。';
    const fallback = document.querySelector('#market-copy-fallback');
    if (fallback) {
      fallback.hidden = false;
      fallback.value = text;
      fallback.focus();
      fallback.select();
    }
    return false;
  }
}

function openMarket(id) {
  const platform = marketPlatforms.find(p => p.id === id);
  if (!platform) return;
  const selection = marketSelection();
  const list = selection.items;
  const text = list.map(x => `${x.name} ${x.buy} ${x.unit}`).join('\n');
  modal(`去${platform.name}选购`, `<div class="market-guide"><span class="market-mark" style="background:${platform.color}">${platform.mark}</span><div><strong>${platform.name}</strong><p class="subnote">${platform.hint}</p></div></div>
    ${list.length ? `<h3>${selection.selected ? '已选购物清单' : '待购清单'} · ${list.length} 种</h3><p class="subnote">以下是食材所需用量，请在平台按实际包装规格选购。</p><div class="market-list">${list.map((x,i) => `<div class="market-line"><span><strong>${esc(x.name)}</strong><small>${x.buy} ${esc(x.unit)}</small></span><button class="text-btn" data-market-copy-item="${i}" aria-label="复制${esc(x.name)}搜索词">复制搜索词</button></div>`).join('')}</div>` : '<p class="subnote">当前库存已满足计划，无需携带采购清单，可以直接浏览平台。</p>'}
    <p class="subnote market-status" id="market-status" role="status">${list.length ? '① 复制清单或搜索词　② 前往平台选购　③ 收到后返回入库' : '打开平台不会改变冰箱库存。'}</p>
    <textarea id="market-copy-fallback" class="market-copy-fallback" aria-label="手动复制购物清单" rows="5" readonly hidden></textarea>
    <div class="modal-actions">${list.length ? '<button class="secondary" id="market-copy-all">复制整份清单</button>' : ''}<a class="primary market-link" href="${platform.url}" target="_blank" rel="noopener noreferrer" id="market-open">打开${platform.name}官方入口 ↗</a></div>
    <p class="subnote">如果没有自动进入 App，请按官方页面指引操作，或自行打开对应 App。跳转不会自动加购、下单或标记已购买。</p>
    <button class="text-btn" id="market-back">返回采购清单</button>`);
  const status = document.querySelector('#market-status');
  if (list.length) document.querySelector('#market-copy-all').onclick = () => copyMarketText(text, status);
  document.querySelectorAll('[data-market-copy-item]').forEach(button => {
    button.onclick = () => copyMarketText(list[Number(button.dataset.marketCopyItem)].name, status);
  });
  document.querySelector('#market-open').onclick = () => {
    status.textContent = '请在平台完成选购。收到商品后，返回采购清单勾选实际收到的食材并入库。若新页面未打开，可在浏览器中打开链接。';
  };
  document.querySelector('#market-back').onclick = () => document.querySelector('#modal').close();
}

document.addEventListener('click', event => {
  const button = event.target.closest('[data-market]');
  if (button) openMarket(button.dataset.market);
});
