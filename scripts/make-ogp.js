// 記事ごとの「共有したときの画像」（OGP画像 1200×630）を作るスクリプト
// ふだんは使いません。記事を増やしたときに、Claude（またはパソコン）で次のように実行して、
// できた static/ogp/〇〇.png を一緒に保存します。画像がない記事は、サイト共通の画像が使われます。
//
//   node scripts/make-ogp.js [Playwrightの場所] [フォントのCSSの場所]
//
// 例）node scripts/make-ogp.js /usr/lib/node_modules/playwright ./node_modules/@fontsource/m-plus-rounded-1c/800.css
const fs=require('fs'),path=require('path'),yaml=require('js-yaml');
const R=p=>path.join(__dirname,'..',p);
const {chromium}=require(process.argv[2]||'playwright');
const fontCss=process.argv[3]?path.resolve(process.argv[3]):'';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const illustSrc=fs.readFileSync(R('src/js/12-illust.js'),'utf8');
const only=process.env.ONLY?process.env.ONLY.split(','):null;
(async()=>{
  const outDir=R('static/ogp');fs.mkdirSync(outDir,{recursive:true});
  const arts=fs.readdirSync(R('content/articles')).filter(f=>f.endsWith('.md')&&!f.startsWith('_')).map(f=>{
    const m=fs.readFileSync(R('content/articles/'+f),'utf8').match(/^---\n([\s\S]*?)\n---/);const fm=yaml.load(m[1]);
    return{slug:f.replace(/\.md$/,''),title:fm['タイトル'],cat:fm['カテゴリ'],il:fm['イラスト']||''}}).filter(a=>!only||only.includes(a.slug));
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:630}});
  const tmp=path.join(outDir,'_tmp.html');
  for(const a of arts){
    const [main,sub]=String(a.title).split(/[　？?]\s*/).length>1?[a.title.replace(/[　].*$/,''),a.title.includes('　')?a.title.replace(/^[^　]*　/,''):'']:[a.title,''];
    const html=`<!doctype html><html><head><meta charset="utf-8">${fontCss?`<link rel="stylesheet" href="file://${fontCss}">`:''}
<style>body{margin:0;width:1200px;height:630px;background:#f7f5f0;font-family:"M PLUS Rounded 1c","Noto Sans CJK JP",sans-serif;color:#24302e;display:grid;grid-template-columns:600px 1fr;overflow:hidden}
.l{padding:60px 20px 50px 64px;display:flex;flex-direction:column;gap:22px}
.cat{align-self:flex-start;background:#16706a;color:#fff;font-size:24px;font-weight:800;border-radius:999px;padding:6px 22px}
h1{margin:0;font-size:${main.length>18?46:54}px;line-height:1.35;font-weight:800}
.sub{font-size:28px;line-height:1.5;color:#5f6b68;font-weight:800}
.brand{margin-top:auto;display:flex;align-items:center;gap:14px;font-size:30px;font-weight:800}
.brand small{font-size:20px;color:#5f6b68}
.r{display:flex;align-items:center;padding-right:40px}.r svg{width:100%;height:auto;border-radius:28px}</style></head>
<body><div class="l"><span class="cat">${esc(a.cat)}</span><h1>${esc(main)}</h1>${sub?`<div class="sub">${esc(sub)}</div>`:''}
<div class="brand"><svg width="48" height="48" viewBox="0 0 34 34"><rect width="34" height="34" rx="8" fill="#fff"/><path d="M4 16L17 5l13 11" fill="none" stroke="#16706a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 14v14h18V14" fill="none" stroke="#16706a" stroke-width="3" stroke-linejoin="round"/><circle cx="17" cy="21" r="5.2" fill="#e0873a"/></svg>イエカネ <small>家とお金の相談室</small></div></div>
<div class="r" id="r"></div>
<script>const esc=${esc.toString()};${illustSrc};document.getElementById('r').innerHTML=illust(${JSON.stringify({title:a.title,cat:a.cat,il:a.il})});</script></body></html>`;
    fs.writeFileSync(tmp,html);
    await p.goto('file://'+tmp);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);
    await p.screenshot({path:path.join(outDir,a.slug+'.png')});
    console.log('✔',a.slug);
  }
  fs.unlinkSync(tmp);await b.close();
})();
