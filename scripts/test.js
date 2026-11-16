// イエカネ 自動チェック（npm test）
// 公開前に、計算・表示・リンク・共有が壊れていないかを確かめます。1つでも失敗したら公開しません。
const fs=require('fs'),path=require('path');
const {JSDOM,VirtualConsole}=require('jsdom');
const DIST=path.join(__dirname,'..','dist');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let ok=0,ng=0;
const check=(name,cond,info='')=>{if(cond){ok++;console.log('  ✔ '+name)}else{ng++;console.log('  ✖ '+name+(info?'（'+info+'）':''))}};
async function open(file,hash=''){
  const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/fonts\.googleapis|googletagmanager|googlesyndication/.test(e.message))errs.push(e.message)});
  const dom=await JSDOM.fromFile(path.join(DIST,file),{runScripts:'dangerously',resources:'usable',url:'file://'+path.join(DIST,file)+hash,pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;w.print=()=>{w.__printed=true}}});
  await wait(600);const w=dom.window;w.__errs=errs;return w;
}
const T=(d,s)=>[...d.querySelectorAll(s)].map(x=>x.textContent.replace(/\s+/g,' ').trim());
const set=(w,id,v)=>{const i=w.document.getElementById(id);i.value=v;i.dispatchEvent(new w.Event('input',{bubbles:true}));i.dispatchEvent(new w.Event('change',{bubbles:true}))};
const click=(w,s)=>w.document.querySelector(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true}));

(async()=>{
  const pages=[];(function walk(d,p=''){for(const f of fs.readdirSync(d)){const q=path.join(d,f);if(fs.statSync(q).isDirectory())walk(q,p+f+'/');else if(f.endsWith('.html'))pages.push(p+f)}})(DIST);

  console.log('\n■ すべてのページが表示できる');
  for(const f of pages){
    if(f==='404.html'){const h=fs.readFileSync(path.join(DIST,f),'utf8');check(f+'（見つからないページ）',/ページが見つかりません/.test(h)&&/noindex/.test(h)&&/href="\/guide\//.test(h));continue}
    const w=await open(f);const d=w.document;
    check(f,!w.__errs.length&&d.querySelector('#view h1, #view .hero h1'),w.__errs[0]||'見出しがありません');
    const html=fs.readFileSync(path.join(DIST,f),'utf8');
    const bad=(html.match(/href="#(?!tools|contact)[a-z]/g)||[]);
    if(bad.length) check(f+' のリンク',false,'「#」のままのリンク：'+bad[0]);
    const links=[...html.matchAll(/href="([^"#:]+\.html)(#[^"]*)?"/g)].map(m=>m[1]);
    const missing=links.filter(l=>!fs.existsSync(path.join(DIST,path.dirname(f),l)));
    if(missing.length) check(f+' のリンク先',false,'見つからないページ：'+missing[0]);
    w.close();
  }

  console.log('\n■ 売却・住み替えの計算');
  {const w=await open('sell.html');const d=w.document;
   check('入力例の手取りが1,235万円',T(d,'.panel .kv b')[0].startsWith('1,235'),T(d,'.panel .kv b')[0]);
   set(w,'s_buyPrice','2000');set(w,'s_bldPrice','1000');set(w,'s_price','6000');set(w,'s_buyYear',String(new Date().getFullYear()-26));set(w,'s_newPrice','5000');await wait(400);
   const tbl=T(d,'.cfwrap')[1]||'';
   check('3,000万円控除の税金が211万円',/軽減税率）211/.test(tbl),tbl.slice(0,80));
   check('買い替え特例の税金152万円・繰り延べ3,740万円',/特例1523,740/.test(tbl),tbl.slice(0,120));
   set(w,'s_price','700');set(w,'s_feeMode','low');await wait(400);
   check('800万円以下の特例で仲介手数料33万円',T(d,'table.cf tr').some(x=>/^仲介手数料.*▲33$/.test(x)));
   w.close();}

  console.log('\n■ ライフプランの計算');
  {const w=await open('lifeplan.html');const d=w.document;
   check('入力例が「不足なし」',T(d,'.panel .chip')[0]==='不足なし',T(d,'.panel .chip')[0]);
   const r=w.eval('(()=>{const S=basePlan();S.house="own";S.hval=2800;S.loanPay=8;S.loanEnd=65;S.assets.tax={bal:500,basis:300,rate:3};S.props=[{name:"A",val:1500,vdep:-1,rent:7,vac:10,cost:15,loan:4,loanEnd:60,rate:2,sell:70,price:1200}];return sim(S)})()');
   const mx=Math.max(...r.map(x=>Math.abs(x.pl.chk)));
   check('PLの収支＝純資産の増減（誤差0）',mx<0.001,'最大の誤差 '+mx);
   click(w,'[data-t="goal"]');set(w,'g_target','9000');await wait(700);
   check('目標から逆算が計算できる',/万円\/月/.test(T(d,'.lever')[0]||''),T(d,'.lever')[0]);
   click(w,'[data-t="scen"]');await wait(100);
   check('シナリオと確率が出る',/%/.test(T(d,'.kpi')[0]||''));
   click(w,'[data-act="pdf"]');check('PDF用のレポートが作られる',w.__printed&&d.querySelectorAll('#printArea table').length>3);
   check('入力例では「すべて入力済み」',/すべて入力済み/.test(T(d,'#prog')[0]||''),T(d,'#prog')[0]);
   set(w,'f_live','');await wait(400);
   check('空欄にすると「あと1項目」と出る',/あと1項目/.test(T(d,'#prog')[0]||'')&&/生活費/.test(T(d,'#prog')[0]||''),T(d,'#prog')[0]);
   click(w,'[data-act="nextempty"]');check('「次の未入力へ」で空欄に移動',d.activeElement&&d.activeElement.id==='f_live');
   set(w,'f_live','20');await wait(400);
   check('かんたん入力の資産は「預貯金・投資・毎月の積立」の3項目',!!d.getElementById('ez_inv')&&!!d.getElementById('ez_mon'));
   {const b0=T(d,'.panel .kv b')[0];set(w,'ez_inv','400');await wait(400);
    check('投資の残高を変えると結果が変わる',T(d,'.panel .kv b')[0]!==b0);
    set(w,'ez_inv','200');await wait(400);}
   const before=T(d,'.panel .kv b')[0];
   click(w,'[data-act="pre"][data-for="f_infl"][data-v="3"]');await wait(500);
   check('言葉のボタンで物価上昇率が3%になる',d.getElementById('f_infl').value==='3'&&d.querySelector('[data-act="pre"][data-for="f_infl"][data-v="3"]').getAttribute('aria-pressed')==='true');
   check('ボタンを押すと結果が計算し直される',T(d,'.panel .kv b')[0]!==before,before);
   const o=w.eval(`(()=>{const S=basePlan();S.assets.others=[{type:'crypto',name:'BTC',bal:300,basis:100,mon:1,until:50,rate:0,vol:60,tax:30},{type:'gold',bal:200,basis:'',mon:0,until:60,rate:2,vol:15,tax:20}];
     S.live=40;const r=sim(clone(S));const z=r.map((_,i)=>i%2?-1.5:1.2);const m=sim(clone(S),{z});
     return{chk:Math.max(...r.map(x=>Math.abs(x.pl.chk))),mchk:Math.max(...m.map(x=>Math.abs(x.pl.chk))),oth0:r[0].oth,used:r.some(x=>x.wd>0&&x.oth<r[0].oth),nisaAfter:r.findIndex(x=>x.oth<0.5)<=r.findIndex(x=>x.nisa<0.5)||r.every(x=>x.nisa<0.5),fin:r[0].bs.fin>=r[0].oth}})()`);
   check('その他の資産（暗号資産・金）もPLの収支＝純資産の増減',o.chk<0.001&&o.mchk<0.001,o.chk+' / '+o.mchk);
   check('その他の資産が足りない年に取り崩される（NISAより先）',o.used&&o.nisaAfter);
   check('その他の資産が金融資産に入る',o.oth0>500&&o.fin);
   click(w,'[data-act="mode2"][data-m="detail"]');await wait(300);
   click(w,'[data-act="addoth"]');await wait(300);
   const ty=d.getElementById('o0_type');check('「その他の資産」を追加できる',!!ty);
   if(ty){ty.value='crypto';ty.dispatchEvent(new w.Event('input',{bubbles:true}));await wait(300);
     check('暗号資産を選ぶと利回り0%・値動き60%になる',d.getElementById('o0_rate').value==='0'&&d.getElementById('o0_vol').value==='60')}
   check('ねんきん定期便の見方が出る',/50歳未満/.test(d.querySelector('.teiki')?.textContent||''));
   click(w,'[data-act="pcfill"][data-w="self"]');await wait(200);
   check('年収から年金の目安を出せる',+d.getElementById('pc_inc').value>0&&/約\d/.test(T(d,'#pcout b')[0]||''),d.getElementById('pc_inc')?.value);
   set(w,'pc_work','emp');set(w,'pc_nen','40');set(w,'pc_yrs','40');set(w,'pc_inc','600');await wait(100);
   const pc=T(d,'#pcout b')[0]||'';
   check('年金の目安（会社員40年・年収600万円）が月約16.2万円',/約16\.2/.test(pc),pc);
   click(w,'[data-act="pcset"]');await wait(300);
   check('年金の目安を入力欄に入れられる',d.getElementById('f_pen').value==='16.2',d.getElementById('f_pen').value);
   w.close();}

  console.log('\n■ 入口ツールの計算');
  {const w=await open('rent2buy.html');check('家賃9万円で買える家が2,637万円',(T(w.document,'.panel .kv b')[0]||'').startsWith('2,637'),T(w.document,'.panel .kv b')[0]);w.close();}
  {const w=await open('prepay.html');const b=T(w.document,'.panel .kv b');const s=parseFloat(b[0].replace(/,/g,'')),l=parseFloat(b[3].replace(/,/g,''));
   check('繰上げ返済：期間短縮のほうが利息が多く減る',s>l&&l>0,b.join(' / '));w.close();}
  {const w=await open('souzokuzei.html');const d=w.document;check('相続税チェック：入力例は基礎控除の範囲内',T(d,'.panel .chip')[0]==='基礎控除の範囲内の見込み');
   set(w,'g_souzokuzei_cash','4000');await wait(400);check('預貯金を増やすと「超える可能性」になる',T(d,'.panel .chip')[0]==='基礎控除を超える可能性');w.close();}

  console.log('\n■ 結果の共有');
  for(const f of ['lifeplan.html','sell.html','loan.html','rent2buy.html','prepay.html','souzokuzei.html']){
    const w=await open(f);click(w,'[data-act="share"]');await wait(200);
    const u=w.document.getElementById('shareurl');
    if(!u){check(f+' の共有リンク',false,'リンクが作られません');continue}
    const w2=await open(f,u.value.slice(u.value.indexOf('#')));await wait(200);
    check(f+' の共有リンクを開ける',!!w2.document.querySelector('.shared')&&!w2.__errs.length,w2.__errs[0]);
    w.close();w2.close();
  }

  console.log('\n■ 相続の期限');
  {const w=await open('souzoku2.html');const d=w.document;const i=d.getElementById('c2_date');i.value='2026-10-01';i.dispatchEvent(new w.Event('change',{bubbles:true}));
   const tl=T(d,'#c2tl .citem');
   check('相続放棄は3か月後',tl.some(x=>x.startsWith('相続するか')&&x.includes('2027年1月1日まで')));
   check('相続税の申告は10か月後',tl.some(x=>x.startsWith('相続税の申告')&&x.includes('2027年8月1日まで')));
   w.close();}

  console.log('\n■ ツールの説明');
  for(const f of ['lifeplan','sell','loan','vs','akiya','souzoku','souzoku2','rent2buy','prepay','souzokuzei']){
    const h=fs.readFileSync(path.join(DIST,f+'.html'),'utf8');
    check(f+'.html に計算の考え方とよくある質問',/計算の考え方/.test(h)&&/よくある質問/.test(h));
  }
  {const h=fs.readFileSync(path.join(DIST,'sell.html'),'utf8');check('広告コードが空のあいだは、結果の下の案内も出ない',!/cta-aff/.test(h));}

  console.log('\n■ 共有したときの画像');
  {const bad=pages.map(f=>{const m=fs.readFileSync(path.join(DIST,f),'utf8').match(/og:image" content="https?:\/\/[^/]+\/([^"]+)"/);return m&&!fs.existsSync(path.join(DIST,m[1]))?f:null}).filter(Boolean);
   check('共有画像のファイルがすべてある',!bad.length,bad[0]);}

  console.log('\n■ 検索対策');
  {const sm=fs.readFileSync(path.join(DIST,'sitemap.xml'),'utf8');
   check('ガイド4ページがサイトマップにある',(sm.match(/\/guide\//g)||[]).length===4);
   check('404ページはサイトマップに載らない',!/404/.test(sm));
   const h=fs.readFileSync(path.join(DIST,'articles/sell-cost.html'),'utf8');
   check('記事の途中にツールへの案内がある',/class="toolcta"/.test(h));
   check('記事からテーマのまとめへのリンクがある',/class="hublink"/.test(h));}

  console.log('\n■ 広告');
  {const bad=pages.filter(f=>/広告枠（/.test(fs.readFileSync(path.join(DIST,f),'utf8')));
   check('「広告枠」の目印が残っていない',!bad.length,bad[0]);
   const w=await open('loan.html');check('広告コードが空のあいだは、ツールの下に何も出ない',w.document.getElementById('adtail').hidden);w.close();}

  console.log('\n■ サイトマップ');
  {const sm=fs.readFileSync(path.join(DIST,'sitemap.xml'),'utf8');
   const drafts=pages.filter(f=>f.startsWith('articles/')&&f!=='articles/index.html'&&/noindex/.test(fs.readFileSync(path.join(DIST,f),'utf8')));
   check('下書きの記事はサイトマップに載らない',drafts.every(f=>!sm.includes(f)));
   check('トップがサイトマップにある',/<loc>https?:\/\/[^<]+\/<\/loc>/.test(sm));}

  console.log(`\n結果：${ok}件OK、${ng}件NG`);
  process.exit(ng?1:0);
})();
