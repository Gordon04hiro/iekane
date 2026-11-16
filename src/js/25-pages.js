/* ---------- 記事・お知らせ・データ ---------- */
const pubArticles=()=>ARTICLES.slice().sort((a,b)=>b.date.localeCompare(a.date));
const toolName=h=>{const t=TOOLS.find(x=>x.href===h);return t?t.t:''};
function artCard(a){return `<a class="tool art" href="#a-${a.slug}"><span class="chip muted" style="justify-self:start">${esc(a.cat)}</span><h3>${esc(a.title)}${a.draft?' <span class="chip warn">下書き</span>':''}</h3><p>${esc(a.lead)}</p><span class="unit">${jd(a.date)}</span></a>`}
function vArticles(v){
  const cats=[...new Set(ARTICLES.map(a=>a.cat))];const c=U.acat&&cats.includes(U.acat)?U.acat:'';
  const list=pubArticles().filter(a=>!c||a.cat===c);
  v.innerHTML=`<div class="wrap"><div class="crumb"><a href="#home">イエカネ</a> › 記事</div>
  <div class="thead"><h1>記事</h1><p>家を買う・売る・相続する前に知っておきたい、住まいとお金の基本をまとめています。</p></div>
  <div class="seg" style="margin-bottom:14px"><button data-act="acat" data-c="" aria-pressed="${!c}">すべて</button>${cats.map(x=>`<button data-act="acat" data-c="${esc(x)}" aria-pressed="${c===x}">${esc(x)}</button>`).join('')}</div>
  <div class="tools">${list.slice(0,6).map(artCard).join('')||'<p class="unit">まだ記事がありません。</p>'}</div>${list.length>6?adUnit('一覧の中')+`<div class="tools" style="margin-top:14px">${list.slice(6).map(artCard).join('')}</div>`:''}</div>`;
}
function vArticle(v,slug){
  const a=ARTICLES.find(x=>x.slug===slug);
  if(!a){v.innerHTML=`<div class="wrap doc"><h1>記事が見つかりません</h1><p><a href="#articles">記事の一覧へ</a></p></div>`;return}
  document.title=a.title+'｜イエカネ';
  const rel=pubArticles().filter(x=>x.slug!==a.slug).slice(0,3);
  v.innerHTML=`<div class="wrap doc art-doc"><div class="crumb"><a href="#home">イエカネ</a> › <a href="#articles">記事</a> › ${esc(a.cat)}</div>
  ${a.draft?'<div class="draft">下書きです。内容を確認してから公開してください（articles の draft を false にすると、この表示は消えます）。</div>':''}
  <span class="chip muted">${esc(a.cat)}</span><h1 style="margin-top:8px">${esc(a.title)}</h1>
  <p class="unit">公開 ${jd(a.date)}${a.updated&&a.updated!==a.date?'　更新 '+jd(a.updated):''}</p>
  ${a.pr?'<p class="pr-note">当サイトはアフィリエイト広告を利用しています。記事内の「PR」と表示したリンクから申し込みがあると、当サイトが報酬を受け取ることがあります。</p>':''}
  <p class="lead">${esc(a.lead)}</p>
  ${adUnit('記事の上')}
  <div class="art-body">${withMidAds(a.body)}</div>
  ${a.tool?`<div class="consult" style="margin-top:22px"><div><h2>数字で確かめてみる</h2><p>${esc(toolName(a.tool))}で、ご自分の場合を計算できます。登録不要・入力内容は送信されません。</p></div><div class="ways"><a class="btn primary" href="${a.tool}">${esc(toolName(a.tool))}を使う</a></div></div>`:''}
  ${adUnit('記事の下')}
  ${rel.length?`<h2>ほかの記事</h2><div class="tools">${rel.map(artCard).join('')}</div>`:''}</div>`;
}
function vNews(v){
  v.innerHTML=`<div class="wrap doc"><div class="crumb"><a href="#home">イエカネ</a> › お知らせ</div><h1>お知らせ</h1>
  <ul class="news">${NEWS.map(x=>`<li><span class="num">${x.d.replace(/-/g,'.')}</span><span>${esc(x.t)}</span></li>`).join('')}</ul></div>`;
}
function vData(v){
  const cats=[...new Set(DATA_ITEMS.map(x=>x.cat))];
  v.innerHTML=`<div class="wrap doc" style="max-width:900px"><div class="crumb"><a href="#home">イエカネ</a> › 使っているデータ</div><h1>使っているデータ</h1>
  <p>ツールの計算に使っている制度や数値と、その出典です。制度の改正や新しい調査結果に合わせて、年に1回以上見直しています。</p>
  <div class="kpis" style="margin:12px 0 16px"><div class="kpi"><span>最後に確認した日</span><b style="font-size:17px">${jd(CFG.checked)}</b></div><div class="kpi"><span>次の見直し予定</span><b style="font-size:17px">${jd(CFG.next)}</b></div></div>
  ${cats.map(c=>`<h2>${esc(c)}</h2><div class="cfwrap"><table class="cf dtab"><tbody><tr class="hd"><th>項目</th><td>使っている値</td><td>出典</td><td>期限</td></tr>
   ${DATA_ITEMS.filter(x=>x.cat===c).map(x=>{const u=x.until?CFG[x.until]:null;const st=u?(isPast(u)?'<span class="chip bad">期限切れ</span>':`<span class="chip muted">${jd(u)}まで</span>`):'—';
    return `<tr><th>${esc(x.name)}<br><span class="unit">${esc(x.tool)}</span></th><td>${esc(x.val)}</td><td>${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.src)}</a>`:esc(x.src)}</td><td>${st}</td></tr>`}).join('')}</tbody></table></div>`).join('')}
  <p class="unit" style="margin-top:14px">計算結果は、入力された条件と上の前提にもとづく目安です。税金の表示は一般的な計算方法による計算例で、個別の税務相談には応じていません。</p></div>`;
}

