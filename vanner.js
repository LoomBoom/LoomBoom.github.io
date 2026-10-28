/*
  LoomBoom – vänner (utan chatt)
  Laddas automatiskt av konto.js. Använder samma inloggning och samma Supabase-funktion.
  - Vänpanel: vänkod, lägg till, förfrågningar, vänlista med bubblor, ta bort, blockera
  - Klicka på en spelare i en topplista för att lägga till som vän
  - window.loomboomVanner.lista() ger vännerna till "Vänner"-fliken i topplistorna
*/
(function(){
  var K = window.loomboomKonto;
  if (!K || !K.api) return;
  var esc = K.esc, BI = '<img src="bilder/bubbla.png" alt="bubblor">';
  var data = null, lyssnare = [], laddar = null;

  var CSS = '' +
  '.vp-bak{position:fixed;inset:0;z-index:90;display:grid;place-items:center;padding:16px;background:rgba(18,24,38,.6);overflow:auto}' +
  '.vp{position:relative;width:min(500px,100%);max-height:calc(100vh - 32px);overflow:auto;border:3px solid #121826;border-radius:14px;box-shadow:6px 6px 0 #121826;padding:20px 20px 18px;color:#121826;font-family:"Figtree",system-ui,sans-serif;' +
    'background:repeating-linear-gradient(181deg,rgba(91,58,28,.14) 0 1px,transparent 1px 6px),linear-gradient(#D39A5D,#C0834A)}' +
  '.vp h2{margin:0 0 12px;font:400 34px/1 "Luckiest Guy","Fredoka",sans-serif;color:#73BB89;-webkit-text-stroke:1.5px #121826;paint-order:stroke fill;text-shadow:2px 2px 0 #121826;letter-spacing:.02em}' +
  '.vp h3{margin:14px 0 6px;font:700 13px "Fredoka",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#2a1a0a}' +
  '.vp-stang{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;border:2.5px solid #121826;background:#fff;font:700 20px/1 "Fredoka",system-ui,sans-serif;cursor:pointer;box-shadow:2px 2px 0 #121826}' +
  '.vp-stang:hover{background:#FAE052}' +
  '.vp-kod{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 12px;border:2.5px solid #121826;border-radius:10px;box-shadow:2px 2px 0 #121826;background:linear-gradient(135deg,#5865F2,#3C45A5);color:#fff;font-weight:700;font-size:14px}' +
  '.vp-kod b{font:400 26px/1 "Luckiest Guy","Fredoka",sans-serif;letter-spacing:.12em;color:#FAE052;-webkit-text-stroke:1px #121826;paint-order:stroke fill;padding-top:3px}' +
  '.vp-kod button{margin-left:auto}' +
  '.vp-ny{display:flex;gap:8px;margin-top:8px}' +
  '.vp-ny input{flex:1;min-width:0;font:700 18px "Fredoka",system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;border:2.5px solid #121826;border-radius:10px;padding:5px 10px;background:#fff;color:#121826}' +
  '.vp-ny input::placeholder{letter-spacing:0;text-transform:none;font-weight:600;font-size:15px;color:#7a6a5a}' +
  '.vp button.k{font:700 14px "Fredoka",system-ui,sans-serif;border:2.5px solid #121826;border-radius:999px;padding:4px 12px;cursor:pointer;box-shadow:2px 2px 0 #121826;background:#fff;color:#121826;white-space:nowrap}' +
  '.vp button.k:hover{background:#FAE052}' +
  '.vp button.k.gron{background:linear-gradient(135deg,#86CC9B,#2F9E5B);color:#fff;text-shadow:1px 1px 0 rgba(18,24,38,.4)}' +
  '.vp button.k.rod{background:linear-gradient(135deg,#FF8A73,#E8553F);color:#fff;text-shadow:1px 1px 0 rgba(18,24,38,.4)}' +
  '.vp button.k:disabled{opacity:.55;cursor:default}' +
  '.vp-msg{min-height:1.3em;margin:6px 0 0;font-weight:700;font-size:14px}' +
  '.vp-msg.fel{color:#9B1C1C}' +
  '.vp ul{list-style:none;margin:0;padding:0;display:grid;gap:6px}' +
  '.vp li{display:flex;align-items:center;gap:10px;padding:5px 8px;border:2.5px solid #121826;border-radius:10px;background:rgba(255,248,235,.92);box-shadow:2px 2px 0 #121826}' +
  '.vp li.in{background:linear-gradient(135deg,#FFF3A6,#FAE052)}' +
  '.vp li img.av{width:34px;height:34px;border-radius:50%;border:2px solid #121826;background:#fff;object-fit:cover;flex:none}' +
  '.vp li .n{flex:1;min-width:0;font:700 15px "Fredoka",system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
  '.vp li .n small{display:block;font:600 12px "Figtree",system-ui,sans-serif;color:#4a2c12}' +
  '.vp li .bub{display:inline-flex;align-items:center;gap:3px;padding:0 8px 0 3px;border:2px solid #121826;border-radius:999px;background:linear-gradient(135deg,#9FF3F5,#22C3E6);font:700 13px/1.6 "Fredoka",system-ui,sans-serif;color:#0E2A4D;flex:none}' +
  '.vp li .bub img{width:16px;height:16px}' +
  '.vp li .mer{position:relative;flex:none}' +
  '.vp li .mer > button{width:32px;height:32px;padding:0;border-radius:50%;font-size:18px;line-height:1}' +
  '.vp-val{position:absolute;right:0;top:calc(100% + 6px);z-index:3;display:grid;gap:6px;min-width:150px;padding:8px;border:2.5px solid #121826;border-radius:10px;background:#fff;box-shadow:3px 3px 0 #121826}' +
  '.vp-tom{padding:10px 12px;border:2.5px dashed rgba(18,24,38,.5);border-radius:10px;font-weight:600;font-size:14px;color:#2a1a0a;background:rgba(255,248,235,.5)}' +
  '.vp details summary{cursor:pointer;font:700 13px "Fredoka",system-ui,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:#2a1a0a;margin:14px 0 6px}' +
  '.vp-fot{margin:14px 0 0;font-size:12px;font-weight:600;color:#3a2410}' +
  '.vp-fot a{color:inherit}' +
  /* liten ruta när man klickar på en spelare i topplistan */
  '.vs{position:fixed;z-index:95;width:240px;padding:12px;border:3px solid #121826;border-radius:12px;box-shadow:4px 4px 0 #121826;background:#fff;font-family:"Figtree",system-ui,sans-serif;color:#121826;text-align:center}' +
  '.vs img{width:56px;height:56px;border-radius:50%;border:2.5px solid #121826;background:#fff;object-fit:cover}' +
  '.vs b{display:block;margin:4px 0 8px;font:700 17px "Fredoka",system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
  '.vs button{display:block;width:100%;margin-top:6px;font:700 14px "Fredoka",system-ui,sans-serif;border:2.5px solid #121826;border-radius:999px;padding:5px 12px;cursor:pointer;box-shadow:2px 2px 0 #121826;background:#fff;color:#121826}' +
  '.vs button.gron{background:linear-gradient(135deg,#86CC9B,#2F9E5B);color:#fff}' +
  '.vs button.bla{background:linear-gradient(135deg,#5865F2,#3C45A5);color:#fff}' +
  '.vs button:disabled{opacity:.6;cursor:default}' +
  '.vs p{margin:4px 0 0;font-weight:700;font-size:13px}' +
  '.vs .ok{display:inline-block;padding:3px 12px;border:2px solid #121826;border-radius:999px;background:linear-gradient(135deg,#86CC9B,#2F9E5B);color:#fff;font:700 14px "Fredoka",system-ui,sans-serif}' +
  '.klick{cursor:pointer}.klick:hover{filter:brightness(1.06)}.klick:focus-visible{outline:3px dashed #121826;outline-offset:2px}';
  var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);

  // ---------- Data ----------
  function satt(d){
    if (!d || !d.vanner) return;
    data = d;
    K.sattVanInfo({ inkommande: (d.inkommande || []).length });
    lyssnare.forEach(function(f){ try{ f(data); }catch(e){} });
    if (panel) ritaPanel();
  }
  function hamta(){
    if (!K.token()) { data = null; return Promise.resolve(null); }
    if (laddar) return laddar;
    laddar = K.api({ typ: "vanner" }).then(function(d){ laddar = null; satt(d); return data; }, function(){ laddar = null; return null; });
    return laddar;
  }
  function gor(typ, extra){
    var b = { typ: typ }; for (var k in extra) b[k] = extra[k];
    return K.api(b).then(function(d){
      if (d.vanner) satt(d);
      if (d.fel) throw new Error(d.fel);
      return d;
    });
  }
  function status(id){
    var u = K.anvandare(); if (!u) return "utloggad";
    if (id === u.id) return "jag";
    if (!data) return "okand";
    if (data.vanner.some(function(v){ return v.id === id && !v.jag; })) return "van";
    if (data.inkommande.some(function(v){ return v.id === id; })) return "inkommande";
    if (data.utgaende.some(function(v){ return v.id === id; })) return "skickad";
    if (data.blockerade.some(function(v){ return v.id === id; })) return "blockerad";
    return "ingen";
  }

  // ---------- Vänpanelen ----------
  var panel = null, forra = null, msg = { t: "", fel: false };
  function oppna(){
    if (!K.token()){ K.loggaIn(); return; }
    if (panel) return;
    forra = document.activeElement;
    panel = document.createElement("div"); panel.className = "vp-bak";
    panel.addEventListener("click", function(e){ if (e.target === panel) stang(); });
    document.body.appendChild(panel);
    document.addEventListener("keydown", tangent, true);
    msg = { t: "", fel: false };
    ritaPanel();
    hamta();
  }
  function stang(){
    if (!panel) return;
    panel.remove(); panel = null;
    document.removeEventListener("keydown", tangent, true);
    if (forra && forra.focus) try{ forra.focus(); }catch(e){}
  }
  function tangent(e){
    if (e.key === "Escape"){
      var oppetVal = panel && panel.querySelector(".vp-val");
      e.stopPropagation(); e.preventDefault();
      if (oppetVal) oppetVal.remove(); else stang();
    }
  }
  function rad(v, knappar, klass){
    var sub = v.basta != null ? 'Bästa: ' + v.basta + ' p' + (v.vbasta != null ? ' · Veckan: ' + v.vbasta : '') : (klass === "in" ? "Vill bli din vän" : "");
    return '<li class="' + (klass || "") + '"><img class="av" src="' + esc(v.avatar) + '" alt="" referrerpolicy="no-referrer" loading="lazy">' +
      '<span class="n">' + esc(v.namn) + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
      (v.saldo != null ? '<span class="bub" title="Bubblor">' + BI + v.saldo + '</span>' : '') + knappar + '</li>';
  }
  function ritaPanel(){
    if (!panel) return;
    var fokus = document.activeElement && document.activeElement.id, inp = panel.querySelector("#vp-kod-in"), varde = inp ? inp.value : "";
    var d = data;
    var h = '<div class="vp" role="dialog" aria-modal="true" aria-labelledby="vp-t">' +
      '<button type="button" class="vp-stang" id="vp-stang" aria-label="Stäng">×</button>' +
      '<h2 id="vp-t">Vänner</h2>';
    if (!d){
      h += '<p class="vp-tom">Laddar…</p></div>';
      panel.innerHTML = h; panel.querySelector("#vp-stang").addEventListener("click", stang); return;
    }
    var vanner = d.vanner.filter(function(v){ return !v.jag; }).sort(function(a, b){ return a.namn.localeCompare(b.namn, "sv"); });
    h += '<div class="vp-kod">Din vänkod: <b>' + esc(d.vankod) + '</b><button type="button" class="k" id="vp-kopiera">Kopiera</button></div>' +
      '<form class="vp-ny" id="vp-form" autocomplete="off"><label for="vp-kod-in" class="sr" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Vänkod</label>' +
      '<input id="vp-kod-in" maxlength="8" placeholder="Skriv en väns kod" value="' + esc(varde) + '"><button type="submit" class="k gron">Lägg till</button></form>' +
      '<p class="vp-msg' + (msg.fel ? ' fel' : '') + '" role="status">' + esc(msg.t) + '</p>';
    if (d.inkommande.length){
      h += '<h3>Vill bli din vän (' + d.inkommande.length + ')</h3><ul>' + d.inkommande.map(function(v){
        return rad(v, '<button type="button" class="k gron" data-g="van_svara" data-ja="1" data-id="' + esc(v.id) + '">Godkänn</button>' +
          '<span class="mer"><button type="button" class="k" data-meny="in" data-id="' + esc(v.id) + '" aria-label="Fler val för ' + esc(v.namn) + '">⋯</button></span>', "in");
      }).join("") + '</ul>';
    }
    h += '<h3>Mina vänner (' + vanner.length + ')</h3>';
    h += vanner.length ? '<ul>' + vanner.map(function(v){
      return rad(v, '<span class="mer"><button type="button" class="k" data-meny="van" data-id="' + esc(v.id) + '" aria-label="Fler val för ' + esc(v.namn) + '">⋯</button></span>');
    }).join("") + '</ul>' : '<p class="vp-tom">Inga vänner än. Dela din vänkod, eller klicka på någon i topplistan för att lägga till dem.</p>';
    if (d.utgaende.length){
      h += '<h3>Väntar på svar (' + d.utgaende.length + ')</h3><ul>' + d.utgaende.map(function(v){
        return rad(v, '<button type="button" class="k" data-g="van_avbryt" data-id="' + esc(v.id) + '">Ta tillbaka</button>');
      }).join("") + '</ul>';
    }
    if (d.blockerade.length){
      h += '<details><summary>Blockerade (' + d.blockerade.length + ')</summary><ul>' + d.blockerade.map(function(v){
        return rad(v, '<button type="button" class="k" data-g="van_avblockera" data-id="' + esc(v.id) + '">Avblockera</button>');
      }).join("") + '</ul></details>';
    }
    h += '<p class="vp-fot">Vänner ser varandras namn, bild, bubblor och bästa poäng. Det finns ingen chatt. <a href="integritet.html">Integritet</a></p></div>';
    panel.innerHTML = h;
    var p = panel;
    p.querySelector("#vp-stang").addEventListener("click", stang);
    p.querySelector("#vp-kopiera").addEventListener("click", function(){
      var kod = d.vankod;
      (navigator.clipboard ? navigator.clipboard.writeText(kod) : Promise.reject()).then(function(){ visaMsg("Vänkoden är kopierad!"); }, function(){ visaMsg("Din vänkod är " + kod); });
    });
    p.querySelector("#vp-form").addEventListener("submit", function(e){
      e.preventDefault();
      var kod = p.querySelector("#vp-kod-in").value.trim();
      if (!kod){ visaMsg("Skriv en vänkod först.", true); return; }
      kor(e.submitter || p.querySelector("#vp-form button"), "van_lagg_till", { kod: kod }, function(){ var i = panel && panel.querySelector("#vp-kod-in"); if (i) i.value = ""; });
    });
    p.querySelectorAll("[data-g]").forEach(function(b){
      b.addEventListener("click", function(){ kor(b, b.getAttribute("data-g"), { id: b.getAttribute("data-id"), ja: b.getAttribute("data-ja") === "1" }); });
    });
    p.querySelectorAll("[data-meny]").forEach(function(b){
      b.addEventListener("click", function(e){ e.stopPropagation(); visaVal(b); });
    });
    p.querySelector(".vp").addEventListener("click", function(e){ if (!e.target.closest(".vp-val") && !e.target.closest("[data-meny]")){ var o = p.querySelector(".vp-val"); if (o) o.remove(); } });
    if (fokus && p.querySelector("#" + fokus)) p.querySelector("#" + fokus).focus();
    else if (!p.contains(document.activeElement)) p.querySelector("#vp-stang").focus();
  }
  function visaMsg(t, fel){ msg = { t: t, fel: !!fel }; var m = panel && panel.querySelector(".vp-msg"); if (m){ m.textContent = t; m.className = "vp-msg" + (fel ? " fel" : ""); } }
  function kor(knapp, typ, extra, klar){
    if (knapp) knapp.disabled = true;
    gor(typ, extra).then(function(d){ msg = { t: d.meddelande || "", fel: false }; ritaPanel(); if (klar) klar(); },
      function(e){ if (knapp) knapp.disabled = false; visaMsg(e.message === "utloggad" ? "Du är utloggad. Logga in igen." : (e.message || "Något gick fel. Försök igen."), true); });
  }
  function visaVal(knapp){
    var gammal = panel.querySelector(".vp-val"); if (gammal){ var samma = gammal.parentNode === knapp.parentNode; gammal.remove(); if (samma) return; }
    var id = knapp.getAttribute("data-id"), typ = knapp.getAttribute("data-meny");
    var v = document.createElement("div"); v.className = "vp-val";
    v.innerHTML = typ === "in"
      ? '<button type="button" class="k" data-x="van_svara">Neka</button><button type="button" class="k rod" data-x="van_blockera">Blockera</button>'
      : '<button type="button" class="k" data-x="van_ta_bort">Ta bort vän</button><button type="button" class="k rod" data-x="van_blockera">Blockera</button>';
    knapp.parentNode.appendChild(v);
    v.querySelectorAll("[data-x]").forEach(function(b){
      b.addEventListener("click", function(e){
        e.stopPropagation();
        var x = b.getAttribute("data-x");
        if ((x === "van_blockera" || x === "van_ta_bort") && !b.dataset.sakert){
          b.dataset.sakert = "1"; b.textContent = x === "van_blockera" ? "Säker? Blockera" : "Säker? Ta bort"; return;
        }
        kor(b, x, { id: id, ja: false });
      });
    });
    v.querySelector("button").focus();
  }

  // ---------- Klicka på en spelare i en topplista ----------
  var ruta = null;
  function stangRuta(){ if (ruta){ ruta.remove(); ruta = null; } }
  function visaSpelare(sp, el){
    stangRuta();
    ruta = document.createElement("div"); ruta.className = "vs"; ruta.setAttribute("role", "dialog"); ruta.setAttribute("aria-label", sp.namn);
    document.body.appendChild(ruta);
    function rita(){
      if (!ruta) return;
      var s = status(sp.id), knapp = "";
      if (s === "utloggad") knapp = '<button type="button" class="bla" data-a="logga">Logga in för att lägga till vänner</button>';
      else if (s === "jag") knapp = '<p>Det är du! 🫧</p>';
      else if (s === "okand") knapp = '<p>Laddar…</p>';
      else if (s === "van") knapp = '<span class="ok">✓ Ni är vänner</span>';
      else if (s === "skickad") knapp = '<p>Vänförfrågan skickad</p><button type="button" data-a="van_avbryt">Ta tillbaka</button>';
      else if (s === "inkommande") knapp = '<button type="button" class="gron" data-a="van_svara">Godkänn vänförfrågan</button>';
      else if (s === "blockerad") knapp = '<p>Du har blockerat den här spelaren.</p>';
      else knapp = '<button type="button" class="gron" data-a="van_lagg_till">Lägg till som vän</button>';
      ruta.innerHTML = '<img src="' + esc(sp.avatar) + '" alt="" referrerpolicy="no-referrer"><b>' + esc(sp.namn) + '</b>' + knapp + '<p class="vs-msg" role="status" style="color:#9B1C1C"></p>';
      var b = ruta.querySelector("[data-a]");
      if (b) b.addEventListener("click", function(e){
        e.stopPropagation();
        var a = b.getAttribute("data-a");
        if (a === "logga"){ K.loggaIn(); return; }
        b.disabled = true;
        gor(a, { id: sp.id, ja: true }).then(function(d){ rita(); if (d.meddelande) K.toast(d.meddelande); },
          function(err){ b.disabled = false; var m = ruta && ruta.querySelector(".vs-msg"); if (m) m.textContent = err.message === "utloggad" ? "Logga in igen." : err.message; });
      });
      placera();
    }
    function placera(){
      if (!ruta) return;
      var r = el.getBoundingClientRect(), w = ruta.offsetWidth, h = ruta.offsetHeight;
      var x = Math.min(window.innerWidth - w - 10, Math.max(10, r.left + r.width / 2 - w / 2));
      var y = r.bottom + 8; if (y + h > window.innerHeight - 10) y = Math.max(10, r.top - h - 8);
      ruta.style.left = x + "px"; ruta.style.top = y + "px";
    }
    rita();
    if (status(sp.id) === "okand") hamta().then(rita);
    var f = ruta.querySelector("button"); if (f) f.focus();
  }
  document.addEventListener("click", function(e){ if (ruta && !ruta.contains(e.target) && !e.target.closest("[data-spelare]")) stangRuta(); });
  document.addEventListener("keydown", function(e){ if (e.key === "Escape") stangRuta(); });
  window.addEventListener("scroll", stangRuta, { passive: true });
  window.addEventListener("resize", stangRuta);

  // Topplistornas rader har data-spelare="id" data-namn data-avatar
  function fran(el){ return { id: el.getAttribute("data-spelare"), namn: el.getAttribute("data-namn") || "", avatar: el.getAttribute("data-avatar") || "" }; }
  document.addEventListener("click", function(e){
    var el = e.target.closest && e.target.closest("[data-spelare]");
    if (!el) return;
    e.stopPropagation();
    if (ruta && ruta.dataset.for === el.getAttribute("data-spelare")){ stangRuta(); return; }
    visaSpelare(fran(el), el); if (ruta) ruta.dataset.for = el.getAttribute("data-spelare");
  });
  document.addEventListener("keydown", function(e){
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches("[data-spelare]")){
      e.preventDefault(); visaSpelare(fran(e.target), e.target); if (ruta) ruta.dataset.for = e.target.getAttribute("data-spelare");
    }
  });

  window.loomboomVanner = {
    oppna: oppna,
    data: function(){ return data; },
    hamta: hamta,
    vidAndring: function(f){ lyssnare.push(f); if (data) f(data); },
    visaSpelare: visaSpelare
  };

  // Hämta vännerna direkt, och igen när man loggar in eller ut
  var senast = K.anvandare() ? K.anvandare().id : null;
  K.vidAndring(function(u){
    var id = u ? u.id : null;
    if (id === senast) return;
    senast = id; data = null;
    if (id) hamta(); else { lyssnare.forEach(function(f){ try{ f(null); }catch(e){} }); stang(); }
  });
  hamta();
  try{ window.dispatchEvent(new CustomEvent("loomboom-vanner-redo")); }catch(e){}
})();
