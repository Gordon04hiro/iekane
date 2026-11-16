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
<div class="brand"><svg width="56" height="56" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#e8f2ee"/><path d="M12 46 C10 36 15 28 25 27 L37 26 C41 26 44 27 46 29 L47.4 30.2 Q48.9 27.7 50 25.2 Q50.9 28 51.3 30.9 L52.2 31.4 Q55.3 26.9 58 21.4 Q58.7 28.4 56.9 35.2 C57.6 37.4 57.6 40 56.6 41.5 C55.6 43 53.6 43 52 43 L50 43 C48 46 45 47 42 47 L16 47 C14 47 12.5 46.8 12 46 Z" fill="#16706a"/><path d="M42 27.5 C42 24 44 22.5 45.5 23 C46 25 45.5 27 44 28.5 Z" fill="#16706a"/><circle cx="47.5" cy="34.5" r="1.7" fill="#fff"/><rect x="16" y="44" width="6.5" height="9" rx="2.6" fill="#16706a"/><rect x="37" y="44" width="6.5" height="9" rx="2.6" fill="#16706a"/><path d="M12.5 37 C9.5 37 8 39 8.5 41" stroke="#16706a" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="24" y="25.3" width="9" height="2.2" rx="1.1" fill="#0f5953"/><circle cx="28.5" cy="15" r="7" fill="#e0873a"/><circle cx="28.5" cy="15" r="5.4" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1"/><text x="28.5" y="17.95" text-anchor="middle" font-size="8.75" font-weight="800" fill="#fff" font-family="Arial,Helvetica,sans-serif">¥</text></svg>サイかね <small>家とお金の相談室</small></div></div>
<div class="r" id="r"></div>
<script>const esc=${esc.toString()};${illustSrc};document.getElementById('r').innerHTML=illust(${JSON.stringify({title:a.title,cat:a.cat,il:a.il})});</script></body></html>`;
    fs.writeFileSync(tmp,html);
    await p.goto('file://'+tmp);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(150);
    await p.screenshot({path:path.join(outDir,a.slug+'.png')});
    console.log('✔',a.slug);
  }
  fs.unlinkSync(tmp);await b.close();
})();
