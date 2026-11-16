/* ---------- info ---------- */
function contactBtn(){return SITE.contactUrl?`<a class="btn primary" href="${esc(SITE.contactUrl)}" target="_blank" rel="noopener">お問い合わせフォーム</a>`:`<span class="chip soon">お問い合わせフォーム 準備中</span>`}
function profileHTML(){
  const P=SITE_CFG.prof||{};const Q=[].concat(P['資格']||[]).filter(Boolean);const yrs=String(P['実務年数']||'').trim(),cy=String(P['会社の年数']||'').trim();
  const items=[Q.length&&`<li><b>資格</b>${Q.map(esc).join('、')}</li>`,`<li><b>仕事</b>${cy?`業歴${esc(cy)}の不動産会社で、`:''}不動産の売買の仲介・管理${yrs?`（実務${esc(yrs)}）`:''}</li>`,P['相続の相談']?'<li><b>相談</b>住まいの売買に加えて、相続した家や手続きの相談にも対応</li>':'',P['地域']&&`<li><b>地域</b>${esc(P['地域'])}</li>`].filter(Boolean).join('');
  return `<div class="prof"><div class="prof-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><circle cx="12" cy="15" r="2.5"/></svg></div><div><p class="prof-n">${esc(P['名前']||'サイかね運営者')}</p><ul>${items}</ul>
   <p>不動産の売買や相続の相談を日々受けている立場から、現場でよく聞かれる疑問や、決める前に知っておきたい数字をまとめています。記事とツールは、公的な統計や制度の資料を確認したうえで作成し、出典は「<a href="#data">使っているデータ</a>」で公開しています。</p></div></div>`;
}
function bylineHTML(){const P=SITE_CFG.prof||{};return `<p class="byline">執筆・監修：<a href="#about">${esc(P['名前']||'サイかね運営者')}</a>${[].concat(P['資格']||[])[0]?'（'+esc([].concat(P['資格'])[0])+'）':''}</p>`}
function vAbout(v){
  v.innerHTML=`<div class="wrap doc"><div class="crumb"><a href="#home">サイかね</a> › サイトについて</div><h1>サイトについて</h1>
  <p>サイかねは、家を買う・売る・相続するといった住まいの決断を、お金の面から落ち着いて考えるための無料ツールと記事のサイトです。</p>
  <h2 id="profile">運営者について</h2>${profileHTML()}
  <h2>ツールの計算について</h2><p>計算はすべてお使いの端末（ブラウザ）の中で行い、入力内容はどこにも送信されません。結果は入力された条件にもとづく目安で、将来の結果を保証するものではありません。税金に関する表示は、一般的な計算方法による計算例です。特例が使えるかどうかの判断や実際の税額は、税理士または税務署にご確認ください。</p>
  <h2>広告について</h2><p>サイトの運営費は、広告（Google アドセンス）とアフィリエイトでまかなっています。広告であることが分かるように表示します。</p>
  <h2 id="contact">お問い合わせ</h2><p>ご意見・不具合のご連絡は、お問い合わせフォームからお願いします。個別の税務相談・法律相談・不動産の価格査定にはお答えしていません。税金は税理士・税務署、登記は司法書士、法律問題は弁護士などの専門家にご相談ください。</p>${contactBtn()}</div>`;
}
function vPrivacy(v){
  v.innerHTML=`<div class="wrap doc"><div class="crumb"><a href="#home">サイかね</a> › プライバシーポリシー</div><h1>プライバシーポリシー</h1>
  <h2>ツールに入力された情報について</h2><p>当サイトのツールに入力された内容は、お使いの端末（ブラウザ）の中だけで計算・保存され、当サイト運営者のサーバーやその他の第三者に送信されることはありません。</p>
  <h2>広告の配信について</h2><p>当サイトは、第三者配信の広告サービス「Google アドセンス」を利用しています。広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie を使用することがあります。Cookie を無効にする方法や Google アドセンスに関する詳細は、Google の「広告に関するポリシー」をご確認ください。</p>
  <h2>アフィリエイトについて</h2><p>当サイトは、アフィリエイトプログラムを利用して商品・サービスを紹介することがあります。紹介先での購入・申込みにより、当サイト運営者が報酬を受け取る場合があります。</p>
  <h2>アクセス解析ツールについて</h2><p>当サイトは、アクセス状況を把握するために Google アナリティクスを利用することがあります。Google アナリティクスは Cookie を使用してデータを収集します。データは匿名で収集されており、個人を特定するものではありません。ツールに入力した金額や、共有リンクに含まれる計算の条件は、Google アナリティクスに送られないようにしています。</p>
  <h2>外部への情報の送信について</h2><p>当サイトでは、次のサービスにより、閲覧したページのアドレス、閲覧日時、ブラウザの種類、Cookieの識別子などの情報が、各社に送信されることがあります。</p><ul><li><b>Google アナリティクス（Google LLC）</b>：アクセス状況の把握のため。<a href="https://policies.google.com/technologies/partner-sites?hl=ja" target="_blank" rel="noopener">Googleのポリシー</a></li><li><b>Google アドセンス（Google LLC）</b>：広告の配信のため（利用を始めた場合）</li><li><b>アフィリエイト（各ASP・広告主）</b>：広告の成果を確認するため（広告を掲載したページのみ）</li></ul><p>Cookieは、ブラウザの設定で無効にできます。Google アナリティクスによる収集は、<a href="https://tools.google.com/dlpage/gaoptout?hl=ja" target="_blank" rel="noopener">オプトアウト アドオン</a>で止めることもできます。</p>
  <h2>免責事項</h2><p>当サイトのツールは一般的な計算方法による目安を示すもので、個別の税務相談・法律相談に応じるものではありません。当サイトの情報やツールの計算結果は、正確性に努めていますが、その内容を保証するものではありません。当サイトの利用により生じた損害について、当サイト運営者は責任を負いかねます。</p>
  <h2>このポリシーの変更</h2><p>当サイトは、法令の改正やサービス内容の変更に合わせて、このポリシーを見直すことがあります。変更後の内容は、このページに掲載した時点から効力を持ちます。</p>
  <h2>お問い合わせ</h2><p>お問い合わせフォームからご連絡ください。</p>${contactBtn()}
  <p class="unit" style="margin-top:18px">制定日：2026年11月16日</p></div>`;
}

