// イエカネ サイトを作る（npm run build）
// content/ と src/ から dist/ に公開用ファイルを書き出します。
const fs=require('fs'),path=require('path');
const yaml=require('js-yaml');
const {marked}=require('marked');
const {JSDOM}=require('jsdom');
const R=p=>path.join(__dirname,'..',p);
const read=p=>fs.readFileSync(R(p),'utf8');
// YAMLの日付は文字列にそろえる
const norm=o=>{if(o instanceof Date)return o.toISOString().slice(0,10);if(Array.isArray(o))return o.map(norm);if(o&&typeof o==='object'){const r={};for(const k in o)r[k]=norm(o[k]);return r}return o};
const Y=p=>norm(yaml.load(read(p)));
const fail=m=>{console.error('\n✖ '+m+'\n');process.exit(1)};

// ---- 設定とデータ
const SITE=Y('content/site.yml');
const RULES=Y('content/rules.yml');
const SOURCES=Y('content/sources.yml');
const NEWS=Y('content/news.yml');
const PAGES=Y('content/pages.yml');
const AFF=fs.existsSync(R('content/affiliates.yml'))?(Y('content/affiliates.yml')||{}):{};
const SITE_URL=String(SITE.url||'').replace(/\/+$/,'');
if(!/^https?:\/\//.test(SITE_URL)) fail('site.yml の url が正しくありません');
const jd=d=>{const [y,m,dd]=String(d).split('-').map(Number);return `${y}年${m}月${dd}日`};
// 印紙税の上限 null は「上限なし」
RULES.stamp=(RULES.stamp||[]).map(([a,b])=>[a==null?'Infinity':a,b]);
for(const k of ['checked','next','stampUntil','kaikaeUntil','akiyaUntil','toukiTransition']) if(!/^\d{4}-\d\d-\d\d$/.test(RULES[k]||'')) fail(`rules.yml の ${k} の日付が正しくありません（例：2027-03-31）`);

// ---- 記事（content/articles/*.md）
const TOOLMAP={rent2buy:'#rent2buy',prepay:'#prepay',souzokuzei:'#souzokuzei',lifeplan:'#lifeplan',sell:'#sell',loan:'#loan',souzoku:'#souzoku',souzoku2:'#souzoku2',akiya:'#akiya',vs:'#vs'};
const ARTS=fs.readdirSync(R('content/articles')).filter(f=>f.endsWith('.md')&&!f.startsWith('_')).map(f=>{
  const src=read('content/articles/'+f);const m=src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if(!m) fail(`記事 ${f} の先頭の「---」で囲んだ部分が見つかりません`);
  const fm=norm(yaml.load(m[1]));const slug=f.replace(/\.md$/,'');
  if(!/^[a-z0-9-]+$/.test(slug)) fail(`記事のファイル名 ${f} は半角の英小文字・数字・ハイフンだけにしてください`);
  for(const k of ['タイトル','カテゴリ','公開日','リード']) if(!fm[k]) fail(`記事 ${f} に「${k}」がありません`);
  let body=m[2].replace(/\{\{期限:(\w+)\}\}/g,(_,k)=>{if(!RULES[k])fail(`記事 ${f} の {{期限:${k}}} が rules.yml にありません`);return jd(RULES[k])});
  let pr=false;
  body=body.replace(/\{\{広告:([^}]+)\}\}/g,(_,k)=>{k=k.trim();const ad=AFF[k];if(!ad)fail(`記事 ${f} の {{広告:${k}}} が affiliates.yml にありません`);
    const code=String(ad['コード']||'').trim();if(!code)return '';pr=true;
    return `\n\n<aside class="pr-box"><span class="pr-label">PR</span><b>${ad['見出し']||''}</b>${ad['説明']?`<p>${ad['説明']}</p>`:''}<div class="pr-code">${code}</div></aside>\n\n`});
  // 囲み（:::ポイント 〜 :::）と数字のカード（:::数字）
  const BOX={'ポイント':'point','注意':'warn','まとめ':'sum','例':'ex','数字':'num'};
  body=body.replace(/^:::(\S+)[ \t]*(.*)\n([\s\S]*?)\n:::[ \t]*$/gm,(_,t,ttl,inner)=>{
    const c=BOX[t];if(!c)fail(`記事 ${f} の「:::${t}」は使えません（使えるのは ${Object.keys(BOX).join('・')}）`);
    let html;
    if(c==='num') html=`<div class="numcards">${inner.split('\n').filter(l=>l.trim()).map(l=>{const [v,d]=l.replace(/^[-*]\s*/,'').split('|');return `<div class="numcard"><b>${marked.parseInline((v||'').trim())}</b><span>${marked.parseInline((d||'').trim())}</span></div>`}).join('')}</div>`;
    else html=`<div class="box box-${c}"><p class="box-t">${ttl.trim()||({point:'この記事のポイント',warn:'気をつけたいこと',sum:'まとめ',ex:'計算例'})[c]}</p>${marked.parse(inner)}</div>`;
    return '\n\n'+html.replace(/\n+/g,' ')+'\n\n'});
  const tool=fm['関連ツール']?TOOLMAP[fm['関連ツール']]:'';
  if(fm['関連ツール']&&!tool) fail(`記事 ${f} の関連ツール「${fm['関連ツール']}」が見つかりません`);
  return {slug,title:fm['タイトル'],cat:fm['カテゴリ'],date:fm['公開日'],updated:fm['更新日']||fm['公開日'],draft:fm['下書き']!==false,pr,tool,lead:fm['リード'],il:fm['イラスト']||'',...(()=>{let k=0;const toc=[];const html=marked.parse(body).replace(/<h2>([\s\S]*?)<\/h2>/g,(_,t)=>{k++;toc.push(t.replace(/<[^>]+>/g,''));return `<h2 id="s${k}"><span class="hn">${k}</span><span>${t}</span></h2>`});return {body:html,toc,mins:Math.max(1,Math.round(body.replace(/<[^>]+>|[\s#*>|:-]/g,'').length/500))}})()};
}).sort((a,b)=>b.date.localeCompare(a.date));

// ---- ブラウザで動くプログラムをまとめる
const content=`/* このファイルは自動で作られます。直接書き換えないでください */
const SITE_CFG=${JSON.stringify({contactForm:SITE.contactForm||'',adsense:SITE.adsense||'',adslots:SITE.adslots||{}})};
const AFF_ADS=${JSON.stringify(Object.fromEntries(Object.entries(AFF).filter(([k,v])=>String((v||{})['コード']||'').trim()).map(([k,v])=>[k,{h:v['見出し']||'',d:v['説明']||'',code:String(v['コード']).trim()}])))};
const CFG=${JSON.stringify(RULES).replace(/"Infinity"/g,'Infinity')};
const DATA_ITEMS=${JSON.stringify(SOURCES.map(x=>({cat:x['カテゴリ'],name:x['項目'],val:x['値'],src:x['出典'],url:x['リンク']||'',until:x['期限']||'',tool:x['使うツール']||''})))};
const NEWS=${JSON.stringify(NEWS.map(x=>({d:x['日付'],t:x['内容']})))};
const ARTICLES=${JSON.stringify(ARTS)};
`;
const files=fs.readdirSync(R('src/js')).filter(f=>f.endsWith('.js')).sort();
const pre=files.filter(f=>f<'10'), main=files.filter(f=>f>='10');
const bundle=content+pre.map(f=>`/* ---- ${f} ---- */\n`+read('src/js/'+f)).join('\n')+'\n(function(){\n'+main.map(f=>`/* ---- ${f} ---- */\n`+read('src/js/'+f)).join('\n')+'\n})();\n';
try{new Function(bundle)}catch(e){fail('プログラムに書き間違いがあります：'+e.message)}

// ---- 書き出し
const out=R('dist');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'assets'),{recursive:true});fs.mkdirSync(path.join(out,'articles'),{recursive:true});
fs.writeFileSync(path.join(out,'assets','app.js'),bundle);
fs.writeFileSync(path.join(out,'assets','site.css'),read('src/css/site.css'));
for(const f of fs.readdirSync(R('static'))) fs.copyFileSync(R('static/'+f),path.join(out,'assets',f));
const shell=read('src/shell.html'), headLinks=read('src/head-links.html');
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const canon=f=>SITE_URL+'/'+f.replace(/index\.html$/,'');
const list=[...Object.entries(PAGES).map(([p,v])=>({p,f:v.file,t:v.title,d:v.description})),...ARTS.map(a=>({p:'article',slug:a.slug,f:'articles/'+a.slug+'.html',t:a.title+'｜イエカネ',d:a.lead,art:a}))];
const ga=SITE.analytics?`<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(SITE.analytics)}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(SITE.analytics)}');</script>`:'';
const ads=SITE.adsense?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${esc(SITE.adsense)}" crossorigin="anonymous"></script>`:'';
async function prerender(pg,base){
  const boot=`<script>window.PAGE=${JSON.stringify(pg.p)};window.BASE=${JSON.stringify(base)};${pg.slug?'window.SLUG='+JSON.stringify(pg.slug)+';':''}</script>`;
  const errs=[];
  const vc=new (require('jsdom').VirtualConsole)();vc.on('jsdomError',e=>errs.push(e.message));
  const dom=new JSDOM(`<!doctype html><html lang="ja"><head></head><body>${shell}${boot}<script>${bundle}</script></body></html>`,{runScripts:'dangerously',url:SITE_URL+'/'+pg.f,pretendToBeVisual:true,virtualConsole:vc,
    beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder}});
  await new Promise(r=>setTimeout(r,250));
  if(errs.length) fail(`${pg.f} の表示中にエラー：${errs[0]}`);
  const d=dom.window.document;d.querySelectorAll('script').forEach(s=>s.remove());
  d.querySelectorAll('[data-pushed]').forEach(x=>x.removeAttribute('data-pushed'));
  const body=d.body.innerHTML;dom.window.close();return {body,boot};
}
(async()=>{
  const urls=[];
  for(const pg of list){
    const depth=pg.f.split('/').length-1, base=depth?'../'.repeat(depth):'';
    const {body,boot}=await prerender(pg,base);
    const ld=pg.art?{'@context':'https://schema.org','@type':'Article',headline:pg.art.title,description:pg.art.lead,datePublished:pg.art.date,dateModified:pg.art.updated,image:SITE_URL+'/assets/ogp.png',publisher:{'@type':'Organization',name:'イエカネ'}}
      :pg.p==='home'?{'@context':'https://schema.org','@type':'WebSite',name:SITE.name,url:SITE_URL+'/'}:null;
    const html=`<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(pg.t)}</title>
<meta name="description" content="${esc(pg.d)}">
<link rel="canonical" href="${canon(pg.f)}">${pg.art&&pg.art.draft?'\n<meta name="robots" content="noindex">':''}
<meta property="og:type" content="${pg.art?'article':'website'}">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(pg.t)}">
<meta property="og:description" content="${esc(pg.d)}">
<meta property="og:url" content="${canon(pg.f)}">
<meta property="og:image" content="${SITE_URL}/assets/ogp.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${base}assets/icon.svg" type="image/svg+xml">
${headLinks}<link rel="stylesheet" href="${base}assets/site.css">
${ld?`<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`:''}${ga}${ads}
</head>
<body>
${body}
${boot}
<script src="${base}assets/app.js"></script>
</body>
</html>
`;
    fs.writeFileSync(path.join(out,pg.f),html);
    if(!(pg.art&&pg.art.draft)) urls.push({loc:canon(pg.f),lastmod:pg.art?pg.art.updated:RULES.checked});
  }
  fs.writeFileSync(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  fs.writeFileSync(path.join(out,'CNAME'),SITE_URL.replace(/^https?:\/\//,'')+'\n');
  fs.writeFileSync(path.join(out,'.nojekyll'),'');
  console.log(`✔ ${list.length}ページを作りました（記事 ${ARTS.length}本、うち下書き ${ARTS.filter(a=>a.draft).length}本）`);
})();
