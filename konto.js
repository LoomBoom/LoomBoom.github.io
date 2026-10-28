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
  '@media (max-width:600px){.konto-meny{left:0;right:auto;max-width:calc(100vw - 32px)}}' +
  '.konto-meny p{margin:0 0 10px;font-weight:600;font-size:14px;color:#4a2c12}' +
  '.konto-meny b{display:block;font-size:16px;color:#121826}' +
  '.konto-meny button{width:100%;font:700 15px "Fredoka",system-ui,sans-serif;background:#fff;border:2.5px solid #121826;border-radius:999px;padding:4px 12px;cursor:pointer;box-shadow:2px 2px 0 #121826}' +
  '.konto-meny button:hover{background:#FAE052}' +
  '.bub-n{display:inline-flex;align-items:center;gap:4px;margin-left:2px;padding:0 8px 0 3px;background:#fff;border:2px solid #121826;border-radius:999px;font:700 14px/1.5 "Fredoka",system-ui,sans-serif;font-variant-numeric:tabular-nums}' +
  '.konto-btn .bub-n img,.bub-big img,.bub-info img{width:18px;height:18px;border:0;border-radius:0;background:none;object-fit:contain}' +
  '.konto-meny{min-width:270px}' +
  '.bub-big{display:flex;flex-wrap:wrap;align-items:center;gap:0 8px;background:#fff;border:2.5px solid #121826;border-radius:10px;padding:6px 10px;margin:0 0 8px;font:700 22px "Fredoka",system-ui,sans-serif;font-variant-numeric:tabular-nums}' +
  '.bub-big img{width:30px;height:30px}.konto-meny .bub-big small{display:block;flex-basis:100%;font:600 13px "Figtree",system-ui,sans-serif;color:#4a2c12;margin:-4px 0 0 38px;white-space:nowrap}' +
  '.konto-meny .bub-logg{display:block;width:100%;list-style:none;margin:0 0 8px;padding:0;font:600 13px "Figtree",system-ui,sans-serif}' +
  '.konto-meny .bub-logg li{display:flex;width:100%;justify-content:space-between;align-items:baseline;gap:10px;margin:0;padding:3px 0;border-top:1.5px dashed rgba(91,58,28,.55);background:none;border-radius:0;box-shadow:none}' +
  '.konto-meny .bub-logg li:first-child{border-top:0}.konto-meny .bub-logg b{display:inline;white-space:nowrap;font-size:14px}' +
  '.bub-info{margin:0 0 10px!important;font-size:12px!important;font-weight:600;line-height:1.45}' +
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
    bub = { id: u.id, saldo: d.saldo, dagar: d.dagar || 0, logg: d.logg || (bub && bub.logg) || [] };
    skriv("loomboom-bubblor", bub); meddela();
  }
  function hamtaBubblor(){
    var t = window.loomboomKonto.token(); if (!t) return;
    fetch(FUNKTION_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t }, body: JSON.stringify({ typ: "saldo" }) })
      .then(function(r){ if (r.status === 401){ loggaUt(); throw 0; } return r.json(); })
      .then(sattBubblor).catch(function(){});
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
      var logg = b && b.logg && b.logg.length ? '<ul class="bub-logg">' + b.logg.slice(0, 5).map(function(r){ return '<li><span>' + esc(r.text) + '</span><b>+' + r.antal + '</b></li>'; }).join("") + '</ul>' : '';
      li.innerHTML = '<button type="button" class="konto-btn" id="konto-knapp" aria-expanded="' + (oppen ? 'true' : 'false') + '" aria-haspopup="true" aria-label="' + esc(u.namn) + ', ' + saldo + ' bubblor">' +
        '<img src="' + esc(u.avatar) + '" alt="" referrerpolicy="no-referrer"><span class="namn">' + esc(u.namn) + '</span><span class="bub-n">' + BI + saldo + '</span></button>' +
        '<div class="konto-meny" id="konto-meny"' + (oppen ? '' : ' hidden') + '><p>Inloggad med Discord som<b>' + esc(u.namn) + '</b></p>' +
        '<div class="bub-big">' + BI + saldo + ' <span style="font-size:15px">bubblor</span><small>' + (b ? 'Spelat ' + (b.dagar || 0) + ' av 7 dagar den här veckan' : '') + '</small></div>' +
        logg +
        '<p class="bub-info">Så får du bubblor i Fiskeskytte:<br>+5 för dagens första runda<br>+25 om du spelar alla 7 dagar i en vecka (mån–sön)<br>Veckotopplistan: 1:a 100 · 2:a 50 · 3:a 25 · 4–10: 10</p>' +
        '<button type="button" id="konto-ut">Logga ut</button></div>';
      var btn = li.querySelector("#konto-knapp"), menu = li.querySelector("#konto-meny");
      btn.addEventListener("click", function(e){ e.stopPropagation(); var open = menu.hidden; menu.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); });
      li.querySelector("#konto-ut").addEventListener("click", loggaUt);
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
