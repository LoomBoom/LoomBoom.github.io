/*
  LoomBoom – inloggning med Discord (direkt mot Discord, utan e-post)

  Vi ber Discord bara om "identify": namn, profilbild och Discord-id.
  Ingen e-post hämtas och inget sparas i någon databas när man loggar in.
  Inloggningen sparas bara i besökarens egen webbläsare och gäller i ungefär 7 dagar.

  DISCORD_CLIENT_ID hittar du i Discord Developer Portal → din app → OAuth2 → Client ID.
  Den är gjord för att synas och är säker att ha här. Lägg ALDRIG in Client Secret här.
*/
var DISCORD_CLIENT_ID = "1564819056635420734";
var INLOGG_ADRESS = "https://loomboom.se/";   // måste stå exakt så under OAuth2 → Redirects hos Discord
var FUNKTION_URL = "https://cipqlojdcdcqahyqqttj.supabase.co/functions/v1/topplista";  // håller koll på bubblorna

(function(){
  var NYCKEL = "loomboom-discord", TILLSTAND = "loomboom-discord-state";
  var CSS = '' +
  '.konto{position:relative;display:flex;align-items:center}' +
  '.konto-btn{display:inline-flex;align-items:center;gap:8px;border:3px solid #121826;border-radius:6px;padding:3px 12px 3px 8px;cursor:pointer;' +
    'font-family:"Pirata One","Fredoka",Georgia,serif;font-size:19px;line-height:1.2;color:#121826;box-shadow:2px 2px 0 #121826;' +
    'background:repeating-linear-gradient(181deg,rgba(91,58,28,.14) 0 1px,transparent 1px 6px),linear-gradient(#D39A5D,#C0834A)}' +
  '.konto-btn:hover{background:#FAE052}' +
  '.konto-btn:focus-visible{outline:3px dashed #FAE052;outline-offset:3px}' +
  '.konto-btn svg{width:22px;height:22px;fill:#5865F2;flex:none}' +
  '.konto-btn img{width:26px;height:26px;border-radius:50%;border:2px solid #121826;object-fit:cover;flex:none;background:#fff}' +
  '.konto-btn .namn{max-width:12ch;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.konto-meny{position:absolute;right:0;top:calc(100% + 8px);z-index:50;min-width:200px;border:3px solid #121826;border-radius:8px;box-shadow:4px 4px 0 #121826;padding:12px;' +
    'background:repeating-linear-gradient(181deg,rgba(91,58,28,.14) 0 1px,transparent 1px 6px),linear-gradient(#D39A5D,#C0834A);font-family:"Figtree",system-ui,sans-serif;color:#121826;text-align:left}' +
  '@media (max-width:600px){.konto-meny{position:fixed;left:12px;right:12px;width:auto!important;min-width:0!important;overflow:auto}}' +
  '.konto-meny{min-width:280px;width:300px}' +
  '.konto-meny .km-dc{display:flex;align-items:center;gap:8px;margin:0 0 8px;padding:7px 10px;border:2.5px solid #121826;border-radius:9px;background:linear-gradient(135deg,#5865F2,#3C45A5);color:#fff;font:700 13px "Figtree",system-ui,sans-serif;box-shadow:2px 2px 0 #121826}' +
  '.konto-meny .km-dc svg{width:20px;height:20px;fill:#fff;flex:none}' +
  '.konto-meny .km-namn{display:flex;align-items:center;gap:10px;margin:0 0 8px;padding:6px 10px;border:2.5px solid #121826;border-radius:9px;background:linear-gradient(135deg,#D4F0FF,#8FD0F2);box-shadow:2px 2px 0 #121826}' +
  '.konto-meny .km-namn img{width:34px;height:34px;border-radius:50%;border:2px solid #121826;background:#fff;object-fit:cover;flex:none}' +
  '.konto-meny .km-namn span{font:700 18px "Fredoka",system-ui,sans-serif;color:#0E2A4D;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.konto-meny .km-saldo{display:flex;align-items:center;gap:8px;margin:0 0 8px;padding:6px 12px;border:2.5px solid #121826;border-radius:10px;box-shadow:2px 2px 0 #121826;background:linear-gradient(135deg,#7FF0F2,#22C3E6 55%,#1E8FD8)}' +
  '.konto-meny .km-saldo img{width:34px;height:34px;object-fit:contain;flex:none}' +
  '.konto-meny .km-saldo b{font:400 30px/1 "Luckiest Guy","Fredoka",sans-serif;color:#FAE052;-webkit-text-stroke:1.5px #121826;paint-order:stroke fill;letter-spacing:.02em;padding-top:4px}' +
  '.konto-meny .km-saldo span{font:700 15px "Fredoka",system-ui,sans-serif;color:#0E2A4D}' +
  '.konto-meny .km-dagar{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin:0 0 8px;padding:7px 6px 5px;border:2.5px solid #121826;border-radius:10px;background:rgba(255,248,235,.85);box-shadow:2px 2px 0 #121826}' +
  '.konto-meny .km-dagar div{display:grid;justify-items:center;gap:2px;font:700 11px "Fredoka",system-ui,sans-serif;color:#4a2c12}' +
  '.konto-meny .km-dagar i{display:block;width:24px;height:24px;border-radius:50%;border:2.5px solid #121826;background:#E9E2D6}' +
  '.konto-meny .km-dagar i.ja{background:radial-gradient(circle at 35% 30%,#B8F5C4,#3FBF5F 60%,#2A9447)}' +
  '.konto-meny .km-dagar i.nej{background:radial-gradient(circle at 35% 30%,#FFC2B8,#E8553F 60%,#B53A28)}' +
  '.konto-meny .km-dagar i.idag{background:#fff;border-style:dashed;border-color:#121826}' +
  '.konto-meny .km-dagar div.idag{color:#121826}' +
  '.konto-meny .km-pris{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 8px}' +
  '.konto-meny .km-pris div{position:relative;display:grid;justify-items:center;gap:0;padding:4px 4px 5px;border:2.5px solid #121826;border-radius:10px;box-shadow:2px 2px 0 #121826}' +
  '.konto-meny .km-pris .d{background:linear-gradient(135deg,#FFF3A6,#FAE052 50%,#F5B83D)}' +
  '.konto-meny .km-pris .v{background:linear-gradient(135deg,#E6B8F0,#B57BC9 50%,#91569D)}' +
  '.konto-meny .km-pris small{font:700 12px "Fredoka",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.05em;color:#121826}' +
  '.konto-meny .km-pris .v small{color:#fff}' +
  '.konto-meny .km-pris strong{display:inline-flex;align-items:center;gap:4px;font:700 19px/1.2 "Fredoka",system-ui,sans-serif;color:#121826}' +
  '.konto-meny .km-pris .v strong{color:#fff;text-shadow:1px 1px 0 #121826}' +
  '.konto-meny .km-pris img{width:20px;height:20px;object-fit:contain}' +
  '.konto-meny .km-pris em{position:absolute;top:-8px;right:-6px;width:20px;height:20px;border-radius:50%;background:#3FBF5F;border:2px solid #121826;color:#fff;font:700 12px/16px "Fredoka",system-ui,sans-serif;font-style:normal;text-align:center}' +
  '.konto-meny .km-ut{display:block;width:100%;font:700 15px "Fredoka",system-ui,sans-serif;color:#fff;background:linear-gradient(135deg,#FF8A73,#E8553F);border:2.5px solid #121826;border-radius:999px;padding:5px 12px;cursor:pointer;box-shadow:2px 2px 0 #121826;text-shadow:1px 1px 0 rgba(18,24,38,.5)}' +
  '.konto-meny .km-ut:hover{background:linear-gradient(135deg,#FFA08C,#F06A55)}' +
  '.konto-meny .km-ut:focus-visible{outline:3px dashed #121826;outline-offset:2px}' +
  '.bub-n{display:inline-flex;align-items:center;gap:4px;margin-left:2px;padding:0 9px 0 3px;border:2px solid #121826;border-radius:999px;font:700 14px/1.5 "Fredoka",system-ui,sans-serif;font-variant-numeric:tabular-nums;color:#0E2A4D;background:linear-gradient(135deg,#9FF3F5,#22C3E6)}' +
  '.konto-btn .bub-n img{width:18px;height:18px;border:0;border-radius:0;background:none;object-fit:contain}' +
  '.konto-meny .km-lankar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:9px;font:600 13px "Figtree",system-ui,sans-serif}' +
  '.konto-meny .km-lankar a{display:inline;background:none;border:0;box-shadow:none;padding:0;border-radius:0;font:600 13px "Figtree",system-ui,sans-serif;color:#2a1a0a;text-decoration:underline}' +
  '.konto-meny .km-lankar a:hover{background:none;color:#121826}' +
  '.konto-meny .km-radera{background:none;border:0;padding:0;font:700 13px "Figtree",system-ui,sans-serif;color:#9B1C1C;text-decoration:underline;cursor:pointer}' +
  '.konto-meny .km-radera:hover{color:#121826}' +
  '.kr-bak{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:16px;background:rgba(18,24,38,.6)}' +
  '.kr-ruta{width:min(440px,100%);border:3px solid #121826;border-radius:14px;box-shadow:6px 6px 0 #121826;padding:22px 22px 20px;background:linear-gradient(160deg,#FFE3DE,#FFC2B8);font-family:"Figtree",system-ui,sans-serif;color:#121826}' +
  '.kr-ruta h2{margin:0 0 8px;font:400 30px/1.1 "Luckiest Guy","Fredoka",sans-serif;color:#E8553F;-webkit-text-stroke:1.5px #121826;paint-order:stroke fill;letter-spacing:.02em}' +
  '.kr-ruta p{margin:0 0 10px;font-weight:600;font-size:15px}' +
  '.kr-ruta ul{margin:0 0 12px;padding:10px 12px 10px 30px;background:#fff;border:2.5px solid #121826;border-radius:10px;font-weight:600;font-size:15px}' +
  '.kr-ruta li{margin:2px 0}' +
  '.kr-knappar{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}' +
  '.kr-knappar button{flex:1 1 150px;font:700 16px "Fredoka",system-ui,sans-serif;border:2.5px solid #121826;border-radius:999px;padding:7px 14px;cursor:pointer;box-shadow:3px 3px 0 #121826}' +
  '.kr-avbryt{background:#fff;color:#121826}.kr-avbryt:hover{background:#FAE052}' +
  '.kr-ja{background:linear-gradient(135deg,#FF6B55,#C7301E);color:#fff;text-shadow:1px 1px 0 rgba(18,24,38,.5)}.kr-ja:hover{background:linear-gradient(135deg,#FF836F,#D93C29)}' +
  '.kr-ja:disabled{opacity:.6;cursor:default}' +
  '.kr-fel{color:#9B1C1C;font-weight:700;min-height:1.2em;margin:8px 0 0!important}' +
  '.konto-fel{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:60;background:#fff;border:3px solid #121826;border-radius:10px;box-shadow:4px 4px 0 #121826;padding:8px 16px;font:600 14px "Figtree",system-ui,sans-serif;max-width:calc(100% - 32px)}';

  var DISCORD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1.1a15.6 15.6 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17 17 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3-1.7.8 1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7ZM8.7 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm6.6 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z"/></svg>';

  function esc(t){ return String(t == null ? "" : t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function toast(msg){
    var d = document.createElement("div"); d.className = "konto-fel"; d.setAttribute("role","status"); d.textContent = msg;
    document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 5000);
  }
  function las(k){ try{ return JSON.parse(localStorage.getItem(k) || "null"); }catch(e){ return null; } }
  function skriv(k, v){ try{ if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

  // Städa bort den gamla Supabase-inloggningen om den finns kvar
  try{ Object.keys(localStorage).forEach(function(k){ if (/^sb-.*-auth-token/.test(k)) localStorage.removeItem(k); }); }catch(e){}

  var lyssnare = [];
  function inloggning(){
    var s = las(NYCKEL);
    if (!s || !s.token || !s.user || Date.now() > s.utgar){ if (s) skriv(NYCKEL, null); return null; }
    return s;
  }
  function meddela(){
    var s = inloggning();
    lyssnare.forEach(function(f){ try{ f(s ? s.user : null); }catch(e){} });
    try{ window.dispatchEvent(new CustomEvent("loomboom-konto", { detail: s ? s.user : null })); }catch(e){}
  }
  function avatar(u){
    if (u.avatar) return "https://cdn.discordapp.com/avatars/" + u.id + "/" + u.avatar + ".png?size=64";
    var n = 0; try{ n = Number((BigInt(u.id) >> 22n) % 6n); }catch(e){}
    return "https://cdn.discordapp.com/embed/avatars/" + n + ".png";
  }

  function loggaIn(){
    if (!DISCORD_CLIENT_ID){ toast("Inloggningen är inte inställd än."); return; }
    var st = Math.random().toString(36).slice(2) + Date.now().toString(36);
    skriv(TILLSTAND, { state: st, tillbaka: location.href.split("#")[0] });
    location.href = "https://discord.com/oauth2/authorize?client_id=" + encodeURIComponent(DISCORD_CLIENT_ID) +
      "&response_type=token&scope=identify&prompt=none&redirect_uri=" + encodeURIComponent(INLOGG_ADRESS) + "&state=" + st;
  }
  function loggaUt(){ skriv(NYCKEL, null); skriv("loomboom-bubblor", null); bub = null; meddela(); }

  // Tillbaka från Discord: adressen slutar med #access_token=...
  function tillbakaFranDiscord(){
    var h = location.hash.replace(/^#/, ""), q = location.search.replace(/^\?/, "");
    var p = new URLSearchParams(h.indexOf("access_token=") >= 0 || h.indexOf("error=") >= 0 ? h : q);
    if (!p.get("access_token") && !p.get("error")) return Promise.resolve();
    var sparat = las(TILLSTAND); skriv(TILLSTAND, null);
    try{ history.replaceState(null, "", location.pathname); }catch(e){}
    if (p.get("error")){ toast("Inloggningen avbröts. Du kan försöka igen."); return Promise.resolve(); }
    if (!sparat || sparat.state !== p.get("state")){ toast("Inloggningen gick inte att verifiera. Försök igen."); return Promise.resolve(); }
    var token = p.get("access_token"), sek = parseInt(p.get("expires_in") || "604800", 10);
    return fetch("https://discord.com/api/v10/users/@me", { headers: { Authorization: "Bearer " + token } })
      .then(function(r){ if (!r.ok) throw new Error("discord " + r.status); return r.json(); })
      .then(function(u){
        skriv(NYCKEL, { token: token, utgar: Date.now() + (sek - 300) * 1000,
          user: { id: u.id, namn: u.global_name || u.username, avatar: avatar(u) } });
        var hit = location.href.split("#")[0];
        if (sparat.tillbaka && sparat.tillbaka !== hit && sparat.tillbaka.indexOf(location.origin) === 0){ location.replace(sparat.tillbaka); return; }
      })
      .catch(function(){ toast("Det gick inte att logga in just nu. Försök igen om en stund."); });
  }

  // ---------- Bubblor ----------
  var bub = null;
  function bubCache(id){ var c = las("loomboom-bubblor"); return c && c.id === id ? c : null; }
  function sattBubblor(d){
    var u = window.loomboomKonto.anvandare(); if (!u || !d || d.saldo == null) return;
    bub = { id: u.id, saldo: d.saldo, dagar: d.dagar || 0, vdagar: d.vdagar || [], idag: d.idag, veckobonus: !!d.veckobonus, logg: d.logg || (bub && bub.logg) || [] };
    skriv("loomboom-bubblor", bub); meddela();
  }
  function hamtaBubblor(){
    var t = window.loomboomKonto.token(); if (!t) return;
    fetch(FUNKTION_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify({ typ: "saldo" }) })
      .then(function(r){ if (r.status === 401){ loggaUt(); throw 0; } return r.json(); })
      .then(sattBubblor).catch(function(){});
  }

  // ---------- Radera kontot ----------
  function fragaRadera(){
    if (document.querySelector(".kr-bak")) return;
    var forra = document.activeElement;
    var bak = document.createElement("div"); bak.className = "kr-bak";
    bak.innerHTML = '<div class="kr-ruta" role="alertdialog" aria-modal="true" aria-labelledby="kr-t" aria-describedby="kr-d">' +
      '<h2 id="kr-t">Radera kontot?</h2>' +
      '<p id="kr-d">Vill du verkligen radera ditt konto? <b>All progress och data försvinner</b> för alltid:</p>' +
      '<ul><li>alla dina bubblor</li><li>dina placeringar på topplistorna</li><li>dina rekord och dagar du spelat</li></ul>' +
      '<p>Det går inte att ångra. Du kan logga in igen senare, men då börjar du om från noll.</p>' +
      '<div class="kr-knappar"><button type="button" class="kr-avbryt">Nej, avbryt</button><button type="button" class="kr-ja">Ja, radera allt</button></div>' +
      '<p class="kr-fel" role="status"></p></div>';
    document.body.appendChild(bak);
    var avbryt = bak.querySelector(".kr-avbryt"), ja = bak.querySelector(".kr-ja"), fel = bak.querySelector(".kr-fel");
    function stang(){ bak.remove(); document.removeEventListener("keydown", tangent, true); if (forra && forra.focus) try{ forra.focus(); }catch(e){} }
    function tangent(e){
      if (e.key === "Escape"){ e.stopPropagation(); stang(); }
      if (e.key === "Tab"){ var f = [avbryt, ja]; var i = f.indexOf(document.activeElement); e.preventDefault(); f[(i + (e.shiftKey ? 1 : 1)) % 2].focus(); }
    }
    document.addEventListener("keydown", tangent, true);
    bak.addEventListener("click", function(e){ if (e.target === bak) stang(); });
    avbryt.addEventListener("click", stang);
    ja.addEventListener("click", function(){
      var t = window.loomboomKonto.token();
      if (!t){ fel.textContent = "Du är inte inloggad längre. Logga in igen och försök på nytt."; return; }
      ja.disabled = true; ja.textContent = "Raderar…"; fel.textContent = "";
      fetch(FUNKTION_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify({ typ: "radera" }) })
        .then(function(r){ return r.json().then(function(d){ d._s = r.status; return d; }); })
        .then(function(d){
          if (d._s === 401){ throw new Error("401"); }
          if (!d.ok) throw new Error("fel");
          ["fisk-best", "loomboom-bubblor"].forEach(function(k){ try{ localStorage.removeItem(k); }catch(e){} });
          stang(); loggaUt();
          toast("Ditt konto och all din data är raderat.");
          setTimeout(function(){ location.reload(); }, 1600);
        })
        .catch(function(e){
          ja.disabled = false; ja.textContent = "Ja, radera allt";
          fel.textContent = e && e.message === "401" ? "Din inloggning har gått ut. Logga in igen och försök på nytt." : "Det gick inte att radera just nu. Försök igen om en stund.";
        });
    });
    avbryt.focus();
  }

  window.loomboomKonto = {
    anvandare: function(){ var s = inloggning(); return s ? s.user : null; },
    token: function(){ var s = inloggning(); return s ? s.token : null; },
    loggaIn: loggaIn,
    loggaUt: loggaUt,
    vidAndring: function(f){ lyssnare.push(f); },
    bubblor: function(){ return bub; },
    sattBubblor: sattBubblor,
    hamtaBubblor: hamtaBubblor
  };

  function start(){
    var plats = document.getElementById("konto-plats") || document.querySelector(".nav ul");
    if (!DISCORD_CLIENT_ID){ console.info("LoomBoom: fyll i DISCORD_CLIENT_ID i konto.js."); return; }
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var li = null;
    if (plats){ li = document.createElement(plats.tagName === "UL" ? "li" : "span"); li.className = "konto"; plats.appendChild(li); }

    function visaUt(){
      if (!li) return;
      li.innerHTML = '<button type="button" class="konto-btn" id="konto-in">' + DISCORD + 'Logga in</button>';
      li.querySelector("#konto-in").addEventListener("click", loggaIn);
    }
    function visaIn(u){
      if (!li) return;
      var b = bub && bub.id === u.id ? bub : bubCache(u.id), oppen = li.querySelector("#konto-meny") && !li.querySelector("#konto-meny").hidden;
      var saldo = b ? b.saldo : "…", BI = '<img src="bilder/bubbla.png" alt="">';
      var D = ["M","T","O","T","F","L","S"], DL = ["måndag","tisdag","onsdag","torsdag","fredag","lördag","söndag"];
      var vd = (b && b.vdagar) || [], idag = b && b.idag != null ? b.idag : (new Date().getDay() + 6) % 7;
      var dagar = D.map(function(d, i){
        var c = vd[i] ? "ja" : i < idag ? "nej" : i === idag ? "idag" : "";
        var t = DL[i] + (vd[i] ? ": spelade" : i < idag ? ": missade" : i === idag ? ": idag" : "");
        return '<div class="' + (i === idag ? "idag" : "") + '" title="' + t + '"><i class="' + c + '" aria-hidden="true"></i>' + d + '</div>';
      }).join("");
      var spelat = vd.filter(Boolean).length;
      var dagKlar = !!vd[idag], veckaKlar = !!(b && b.veckobonus);
      li.innerHTML = '<button type="button" class="konto-btn" id="konto-knapp" aria-expanded="' + (oppen ? 'true' : 'false') + '" aria-haspopup="true" aria-label="' + esc(u.namn) + ', ' + saldo + ' bubblor">' +
        '<img src="' + esc(u.avatar) + '" alt="" referrerpolicy="no-referrer"><span class="namn">' + esc(u.namn) + '</span><span class="bub-n">' + BI + saldo + '</span></button>' +
        '<div class="konto-meny" id="konto-meny"' + (oppen ? '' : ' hidden') + '>' +
        '<div class="km-dc">' + DISCORD + 'Inloggad med Discord som</div>' +
        '<div class="km-namn"><img src="' + esc(u.avatar) + '" alt="" referrerpolicy="no-referrer"><span>' + esc(u.namn) + '</span></div>' +
        '<div class="km-saldo">' + BI + '<b>' + saldo + '</b><span>bubblor</span></div>' +
        '<div class="km-dagar" role="img" aria-label="Spelat ' + spelat + ' av 7 dagar den här veckan">' + dagar + '</div>' +
        '<div class="km-pris">' +
          '<div class="d" title="Dagens första runda i Fiskeskytte">' + (dagKlar ? '<em aria-label="klar">✓</em>' : '') + '<small>Dag</small><strong>+5' + BI + '</strong></div>' +
          '<div class="v" title="Spela alla 7 dagar i veckan">' + (veckaKlar ? '<em aria-label="klar">✓</em>' : '') + '<small>Vecka</small><strong>+25' + BI + '</strong></div>' +
        '</div>' +
        '<button type="button" class="km-ut" id="konto-ut">Logga ut</button>' +
        '<div class="km-lankar"><a href="integritet.html">Integritet</a><button type="button" class="km-radera" id="konto-radera">Radera mitt konto</button></div></div>';
      var btn = li.querySelector("#konto-knapp"), menu = li.querySelector("#konto-meny");
      btn.addEventListener("click", function(e){
        e.stopPropagation(); var open = menu.hidden; menu.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false");
        // På mobil ligger menyn fast precis under knappen, över hela bredden
        if (open && window.innerWidth <= 600){
          var top = Math.max(8, btn.getBoundingClientRect().bottom + 8);
          menu.style.top = top + "px"; menu.style.maxHeight = (window.innerHeight - top - 12) + "px";
        } else { menu.style.top = ""; menu.style.maxHeight = ""; }
      });
      li.querySelector("#konto-ut").addEventListener("click", loggaUt);
      li.querySelector("#konto-radera").addEventListener("click", function(e){ e.stopPropagation(); stang(); fragaRadera(); });
    }
    function rita(u){ if (u) visaIn(u); else visaUt(); }
    lyssnare.push(rita);

    function stang(){ if (!li) return; var m = li.querySelector("#konto-meny"), b = li.querySelector("#konto-knapp"); if (m){ m.hidden = true; b.setAttribute("aria-expanded","false"); } }
    document.addEventListener("click", function(e){ if (li && !li.contains(e.target)) stang(); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") stang(); });

    var forst = window.loomboomKonto.anvandare();
    if (forst) bub = bubCache(forst.id);
    rita(forst);
    tillbakaFranDiscord().then(function(){ meddela(); hamtaBubblor(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
