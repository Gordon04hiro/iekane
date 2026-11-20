/* ---------- 住宅ローン控除の目安／法定相続分の計算 ---------- */

/* 年収（額面）から、課税所得と所得税（復興税を除く）のざっくりした目安 */
/* 所得税の基礎控除（合計所得金額で変わる） */
const basicDed=S=>(CFG.salary.basic.find(x=>S<=x[0])||[0,0])[1];
function salaryTax(gross){
  const C=CFG.salary,g=Math.max(0,n(gross)),r=C.ded.find(x=>g<=x[0])||C.ded[C.ded.length-1];
  const ded=Math.max(C.min,g*r[1]/100+r[2]),taxable=Math.max(0,Math.floor(g-ded-g*C.social/100-basicDed(g-ded)));
  const b=CFG.retire.brackets.find(x=>taxable<=x[0])||CFG.retire.brackets[CFG.retire.brackets.length-1];
  return{taxable,itax:Math.max(0,Math.round((taxable*b[1]/100-b[2])*10)/10)};
}
/* 住宅ローン控除の目安（数値は content/rules.yml の koujo） */
const KJ=CFG.koujo;
const KOUJODEF={id:'koujo',title:'住宅ローン控除の目安',example:`新築ZEH水準・借入3,500万円・金利${CFG.loanRates.hendo}%・35年・年収600万円`,
  lead:'借入額と家の種類から、住宅ローン控除で毎年いくら戻りそうかの目安を出します。所得税と住民税の額で戻る金額に上限があるので、その分も考えます。2026〜2030年に入居する場合の制度で計算します。',
  base:()=>({type:'new_zeh',kids:'no',year:2026,loan:3500,rate:CFG.loanRates.hendo,term:35,how:'gross',gross:600,itax:15,taxable:350}),
  fix:V=>{if(!V.how){V.how='manual';V.gross=600}},
  groups:[
   {g:'家とローン',f:[
    {id:'type',l:'家の種類',type:'sel',o:Object.entries(KJ.types).map(([k,v])=>[k,v.name]),h:'省エネ性能は、住宅会社や不動産会社にある証明書で確認できます'},
    {id:'kids',l:'子育て世帯・若者夫婦世帯',type:'sel',o:[['no','あてはまらない'],['yes','あてはまる']],h:'19歳未満の子がいる、または夫婦のどちらかが40歳未満'},
    {id:'year',l:'住み始める年',u:'年'},
    {id:'loan',l:'借入額',u:'万円'},{id:'rate',l:'借入金利',u:'%',st:.01},{id:'term',l:'返済期間',u:'年'}]},
   {g:'税金の額',s:'控除で戻るのは、払った税金の範囲までです',f:[
    {id:'how',l:'税金の額の入れ方',type:'sel',o:[['gross','年収から目安で計算する'],['manual','源泉徴収票の数字を入れる']],h:'会社員の方向け。自営業の方は確定申告書の数字を「源泉徴収票の数字」で入れてください'},
    {id:'gross',l:'年収（額面）',u:'万円',h:'源泉徴収票の「支払金額」。ボーナス込み。借入する人の分だけ（夫婦の合計ではありません）',show:V=>V.how==='gross'},
    {id:'itax',show:V=>V.how!=='gross',l:'所得税の額（年）',u:'万円',st:.1,h:'源泉徴収票の「源泉徴収税額」。年収500万円で10万円前後、600万円で15万円前後が目安'},
    {id:'taxable',show:V=>V.how!=='gross',l:'課税される所得の金額',u:'万円',h:'源泉徴収票の「給与所得控除後の金額」から「所得控除の額の合計額」を引いた額。わからなければ0（住民税の上限9.75万円で計算）'}]}
  ],
  calc(V){
    let est=null;if(V.how==='gross'){est=salaryTax(V.gross);V={...V,itax:est.itax,taxable:est.taxable}}
    const T=KJ.types[V.type]||KJ.types.new_zeh, kid=V.kids==='yes'?1:0, yr=Math.round(n(V.year));
    const out=T.until&&yr>T.until;
    const limit=out?0:n(T.limit[kid]), years=T.years;
    const P=Math.max(0,n(V.loan)), j=n(V.rate)/100/12, N=Math.max(1,n(V.term)*12);
    const M=j>0?P*j/(1-Math.pow(1+j,-N)):P/N;
    const balAt=k=>{const m=Math.min(N,k*12);return j>0?P*Math.pow(1+j,m)-M*(Math.pow(1+j,m)-1)/j:P-M*m}; // k年目の年末残高（入居年の年末を1年目とする）
    const resCap=n(V.taxable)>0?Math.min(KJ.residentCap,n(V.taxable)*KJ.residentRate/100):KJ.residentCap;
    const rows=[];let tot=0,totMax=0;
    for(let k=1;k<=years;k++){
      const bal=Math.max(0,balAt(k)), base=Math.min(bal,limit)*KJ.rate/100, cap=n(V.itax)+resCap, got=Math.min(base,cap);
      rows.push({y:yr+k-1,k,bal,base,got,short:base-got});tot+=got;totMax+=base;
    }
    return{T,limit,years,rows,tot,totMax,resCap,out,M,est};
  },
  result(V,R){
    const first=R.rows[0]||{base:0,got:0};
    return `<h2>計算結果</h2><p class="unit">入力するたびに自動で更新されます（単位：万円）。</p>
    <div class="panels"><section class="panel"><div class="ph"><span class="nm">住宅ローン控除で戻る額の目安</span></div>
     <div class="kv">${kvRow(R.years+'年間の合計',man(R.tot))}${kvRow('1年目',man1(first.got)+'<small>万円</small>')}${kvRow('控除の対象になる借入の上限',man(R.limit))}${kvRow('毎月の返済',man1(R.M)+'<small>万円</small>')}</div></section></div>
    <section class="advice"><h3>入力した条件で計算すると</h3><ul>
     ${R.out?`<li><b>この種類の新築住宅は、${R.T.until}年までに住み始める場合が対象です。</b>${Math.round(n(V.year))}年の入居では、原則として控除を受けられない計算です（建築確認の時期による例外があります）。</li>`:''}
     <li>年末のローン残高（上限${fmt(R.limit)}万円）の${KJ.rate}%が、${R.years}年間、所得税から差し引かれる計算です。</li>
     ${R.totMax-R.tot>0.5?`<li>所得税と住民税の額が少ないため、約${fmt(R.totMax-R.tot)}万円は控除しきれない計算です。控除で戻るのは、払った税金の範囲までです。</li>`:'<li>入力した税金の額なら、控除の上限まで使い切れる計算です。</li>'}
     ${R.est?`<li>年収${fmt(n(V.gross))}万円から、所得税は年約${(R.est.itax).toLocaleString('ja-JP')}万円（課税所得 約${fmt(R.est.taxable)}万円）として計算しています。配偶者や子どもを扶養している場合などは税額が少なくなり、戻る額も少なくなることがあります。源泉徴収票があれば「源泉徴収票の数字を入れる」がより正確です。</li>`:''}
     <li>住民税からは、年${(Math.round(R.resCap*100)/100).toLocaleString('ja-JP')}万円まで差し引ける前提で計算しています。</li>
     <li>1年目は確定申告が必要です。2年目からは、会社員なら年末調整で受けられます。</li></ul></section>${ctaHTML()}
    <div class="cfhead"><h3>年ごとの目安</h3></div>
    <div class="cfwrap"><table class="cf"><tbody><tr class="hd"><th>年</th><td>年末の残高</td><td>控除の上限</td><td>戻る額の目安</td></tr>
     ${R.rows.map(r=>`<tr><th>${r.y}年</th><td>${fmt(r.bal)}</td><td>${man1(r.base)}</td><td${r.short>0.05?' class="neg"':''}>${man1(r.got)}</td></tr>`).join('')}
     <tr class="tot"><th>合計</th><td></td><td>${fmt(R.totMax)}</td><td>${fmt(R.tot)}</td></tr></tbody></table></div>
    <div class="taxnote">一般的な計算式による<b>計算例</b>です。所得税の額は毎年同じ、元利均等返済・ボーナス返済なし、繰上げ返済なしの前提です。実際に控除が受けられるか、控除額がいくらになるかは、税務署または税理士にご確認ください。</div>`;
  },
  dock:(V,R)=>[R.years+'年間で戻る額',fmt(R.tot)+' 万円'],
  related:['loan','prepay','lifeplan']
};

/* 法定相続分の計算 */
const gcd=(a,b)=>b?gcd(b,a%b):a;
const frac=(a,b)=>{const g=gcd(a,b);return[a/g,b/g]};
const ftxt=f=>f[0]===f[1]?'すべて':f[0]+'/'+f[1];
const BUNDEF={id:'souzokubun',title:'法定相続分の計算',example:'配偶者と子ども2人・財産5,000万円',
  lead:'家族構成を入れると、民法で決められた相続の割合（法定相続分）と、財産の合計に当てはめた金額の目安がわかります。遺言がない場合の話し合い（遺産分割）の目安になります。',
  base:()=>({sp:'yes',kids:2,parents:0,sibs:0,total:5000}),
  groups:[
   {g:'家族',s:'亡くなった方（被相続人）から見た家族',f:[
    {id:'sp',l:'配偶者',type:'sel',o:[['yes','いる'],['no','いない']]},
    {id:'kids',l:'子どもの人数',u:'人',h:'養子も含みます。亡くなった子に子（孫）がいる場合は、その孫が代わりに相続します（このツールでは子の人数に含めて計算）'},
    {id:'parents',l:'健在の親の人数',u:'人',h:'子どもがいない場合に相続人になります',show:V=>!(n(V.kids)>0)},
    {id:'sibs',l:'兄弟姉妹の人数',u:'人',h:'子どもも親もいない場合に相続人になります',show:V=>!(n(V.kids)>0)&&!(n(V.parents)>0)}]},
   {g:'財産',f:[{id:'total',l:'財産の合計（目安）',u:'万円',h:'預貯金・不動産・株など。借入があれば差し引いた額。わからなければ0'}]}
  ],
  calc(V){
    const sp=V.sp==='yes', k=Math.max(0,Math.round(n(V.kids))), p=Math.max(0,Math.min(2,Math.round(n(V.parents)))), s=Math.max(0,Math.round(n(V.sibs)));
    const heirs=[];let rank='',spF=null,otherF=null,other=0,ol='';
    if(k>0){rank='子';other=k;ol='子ども';spF=sp?[1,2]:null;otherF=sp?[1,2]:[1,1]}
    else if(p>0){rank='親';other=p;ol='親';spF=sp?[2,3]:null;otherF=sp?[1,3]:[1,1]}
    else if(s>0){rank='兄弟姉妹';other=s;ol='兄弟姉妹';spF=sp?[3,4]:null;otherF=sp?[1,4]:[1,1]}
    else if(sp){spF=[1,1]}
    if(spF) heirs.push({l:'配偶者',f:frac(spF[0],spF[1]),n:1});
    if(otherF&&other) heirs.push({l:ol,f:frac(otherF[0],otherF[1]*other),n:other});
    // 遺留分：全体で1/2（親だけが相続人のときは1/3）。兄弟姉妹にはない
    const rTot=(!sp&&rank==='親')?[1,3]:[1,2];
    // 兄弟姉妹には遺留分がないため、配偶者と兄弟姉妹のときは配偶者が1/2
    const iryu=heirs.filter(h=>!/兄弟姉妹/.test(h.l)).map(h=>({l:h.l,f:rank==='兄弟姉妹'?[1,2]:frac(h.f[0]*rTot[0],h.f[1]*rTot[1])}));
    return{heirs,iryu,rank,none:!heirs.length,total:Math.max(0,n(V.total))};
  },
  result(V,R){
    if(R.none) return `<h2>計算結果</h2><section class="advice"><ul><li>配偶者・子ども・親・兄弟姉妹のいずれもいない場合は、法定相続人がいない計算です。遺言がなければ、家庭裁判所の手続きを経て、特別縁故者への分与や国庫への帰属となることがあります。早めに専門家にご相談ください。</li></ul></section>`;
    const amt=f=>R.total>0?man(R.total*f[0]/f[1]):'–';
    return `<h2>計算結果</h2><p class="unit">入力するたびに自動で更新されます。</p>
    <div class="cfwrap"><table class="cf fit"><tbody><tr class="hd"><th>相続人</th><td>相続分</td><td>金額</td><td>遺留分</td></tr>
     ${R.heirs.map(h=>{const ir=R.iryu.find(x=>x.l===h.l);return `<tr><th>${esc(h.l)}${h.n>1?`<span class="unit"><br>${h.n}人・1人あたり</span>`:''}</th><td>${ftxt(h.f)}</td><td>${amt(h.f)}</td><td>${ir?ftxt(ir.f):'なし'}</td></tr>`}).join('')}</tbody></table></div>
    <section class="advice"><h3>入力した家族構成では</h3><ul>
     <li>相続人は${R.heirs.map(h=>h.l+(h.n>1?h.n+'人':'')).join('と')}です。${R.rank&&R.rank!=='子'?`子どもがいないため、${R.rank}が相続人になります。`:''}</li>
     <li>法定相続分は、遺言がなく、話し合いで分け方が決まらないときの目安です。相続人全員が合意すれば、これと違う分け方もできます。</li>
     <li>遺留分は、遺言で取り分が少なくされても、最低限受け取れる割合です。${R.rank==='兄弟姉妹'?'兄弟姉妹には遺留分がありません。':''}</li></ul></section>${ctaHTML()}
    <div class="taxnote">民法の基本的な割合による一般的な計算です。代襲相続、半血の兄弟姉妹、相続放棄、養子の扱いなどで割合が変わる場合があります。実際の分け方や遺言の内容については、弁護士・司法書士などの専門家にご相談ください。</div>`;
  },
  dock:(V,R)=>['相続人',R.none?'なし':R.heirs.reduce((s,h)=>s+h.n,0)+' 人'],
  related:['souzoku','souzokuzei','souzoku2']
};

/* ふるさと納税の上限の目安（数値は content/rules.yml の furusato・salary） */
function furusatoCalc(V){
  const F=CFG.furusato,C=CFG.salary,g=Math.max(0,n(V.gross)),r=C.ded.find(x=>g<=x[0])||C.ded[C.ded.length-1];
  const kyuyo=Math.max(0,g-Math.max(C.min,g*r[1]/100+r[2]));
  const soc=V.socMode==='input'?Math.max(0,n(V.soc)):g*C.social/100, ideco=Math.max(0,n(V.ideco))*12;
  const sp=V.sp==='yes'?1:0, dep=Math.max(0,Math.round(n(V.dep))), tok=Math.max(0,Math.round(n(V.tok)));
  const itTaxable=Math.max(0,Math.floor(kyuyo-soc-ideco-basicDed(kyuyo)-sp*F.spouse[0]-dep*F.dep[0]-tok*F.tok[0]));
  const rsTaxable=Math.max(0,Math.floor(kyuyo-soc-ideco-F.resBasic-sp*F.spouse[1]-dep*F.dep[1]-tok*F.tok[1]));
  const b=CFG.retire.brackets.find(x=>itTaxable<=x[0])||CFG.retire.brackets[CFG.retire.brackets.length-1];
  const shotokuwari=Math.max(0,rsTaxable*F.resRate/100-F.adj);
  const limit=shotokuwari>0?shotokuwari*F.special/100/(0.9-b[1]/100*1.021)+0.2:0;
  return{kyuyo,soc,itTaxable,rsTaxable,rate:b[1],shotokuwari,limit:Math.max(0,Math.floor(limit*10)/10)};
}
const FURUDEF={id:'furusato',title:'ふるさと納税の上限の目安',example:'年収600万円・独身（扶養なし）',
  lead:'年収と家族構成から、ふるさと納税で自己負担2,000円で済む寄附額の上限の目安を出します。会社員（給与収入のみ）の方向けの、ざっくりした計算です。',
  base:()=>({gross:600,sp:'no',dep:0,tok:0,socMode:'auto',soc:90,ideco:0,loanKoujo:'no'}),
  groups:[
   {g:'収入',f:[
    {id:'gross',l:'年収（額面）',u:'万円',h:'源泉徴収票の「支払金額」。ボーナス込み。今年の見込みで'},
    {id:'socMode',l:'社会保険料',type:'sel',o:[['auto','年収の約15%で計算する'],['input','金額を入れる']],h:'源泉徴収票の「社会保険料等の金額」がわかれば、金額を入れるとより正確です'},
    {id:'soc',l:'社会保険料の金額（年）',u:'万円',show:V=>V.socMode==='input'},
    {id:'ideco',l:'iDeCoの掛金（月）',u:'万円',st:.1,h:'していなければ0'}]},
   {g:'家族',s:'あなたが扶養している家族',f:[
    {id:'sp',l:'配偶者控除・配偶者特別控除',type:'sel',o:[['no','受けていない（共働き・独身など）'],['yes','受けている（配偶者の年収が少ない）']],h:'配偶者の給与収入がおおむね123万円以下なら「受けている」が目安。配偶者特別控除の場合は、少し上限が下がることがあります'},
    {id:'dep',l:'扶養している16〜18歳・23歳以上の家族',u:'人',h:'高校生など。15歳以下の子どもは数えません'},
    {id:'tok',l:'扶養している19〜22歳の家族',u:'人',h:'大学生など（特定扶養親族）'}]},
   {g:'住宅ローン控除',f:[
    {id:'loanKoujo',l:'今年、住宅ローン控除を受けますか',type:'sel',o:[['no','受けない'],['first','受ける（1年目・確定申告）'],['yes','受ける（2年目以降・年末調整）']]}]}
  ],
  calc:V=>furusatoCalc(V),
  result(V,R){
    const yen=v=>Math.floor(v*10)*1000;
    return `<h2>計算結果</h2><p class="unit">入力するたびに自動で更新されます。</p>
    <div class="panels"><section class="panel"><div class="ph"><span class="nm">自己負担2,000円で済む寄附額の目安</span></div>
     <div class="kv">${kvRow('上限の目安','約'+yen(R.limit).toLocaleString('ja-JP')+'<small>円</small>')}${kvRow('住民税の所得割額（目安）','約'+(Math.round(R.shotokuwari*10)/10).toLocaleString('ja-JP')+'<small>万円</small>')}${kvRow('所得税の税率（目安）',R.rate+'<small>%</small>')}</div></section></div>
    <section class="advice"><h3>入力した条件で計算すると</h3><ul>
     <li>年間の寄附額が<b>約${yen(R.limit).toLocaleString('ja-JP')}円まで</b>なら、自己負担2,000円を除いた額が、所得税と住民税から差し引かれる計算です。</li>
     <li>上限ぎりぎりではなく、<b>1〜2割ほど少なめ</b>にしておくと安心です。年収や控除が見込みとずれると、上限も変わります。</li>
     ${V.loanKoujo==='first'?'<li><b>住宅ローン控除の1年目は確定申告が必要なので、ワンストップ特例は使えません。</b>ふるさと納税の寄附も、確定申告で一緒に申告します。</li>':''}
     ${V.loanKoujo!=='no'?'<li>住宅ローン控除で所得税が少なくなっている場合、確定申告でふるさと納税を申告すると、控除しきれない分が出て上限が下がることがあります。ワンストップ特例を使える年（2年目以降で、寄附先が5自治体以内など）は、影響が出にくくなります。</li>':''}
     <li>医療費控除や生命保険料控除、副業・年金などの収入があると、上限は変わります。このツールでは考えていません。</li></ul></section>${ctaHTML()}
    <div class="taxnote">総務省が示している計算方法にもとづく、一般的な<b>目安</b>です（給与収入のみ・社会保険料は入力または年収の約15%・調整控除はおおまかな額で計算）。実際の上限は、源泉徴収票や住民税の決定通知書の数字、各ふるさと納税サイトの詳しいシミュレーションでご確認ください。申告の方法や税額は、お住まいの市町村・税務署にご確認ください。</div>`;
  },
  dock:(V,R)=>['ふるさと納税の上限の目安','約'+(Math.floor(R.limit*10)*1000).toLocaleString('ja-JP')+' 円'],
  related:['koujo','lifeplan','loan']
};
Object.assign(GDEF,{koujo:KOUJODEF,souzokubun:BUNDEF,furusato:FURUDEF});
