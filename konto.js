/*
  LoomBoom – inloggning med Discord (via Supabase)

  Fyll i de två värdena nedan från Supabase:
  Project Settings → API → "Project URL" och "anon / publishable key".
  De är gjorda för att synas på en hemsida och är säkra att lägga här.
  Lägg ALDRIG in "service_role" eller "secret key" här.
*/
var SUPABASE_URL = "https://cipqlojdcdcqahyqqttj.supabase.co";
var SUPABASE_ANON_KEY = "sb_publishable_wYu-AZc81VeCJp9XjrTTfA_4FcFVLYh";

(function(){
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
  '.konto-fel{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:60;background:#fff;border:3px solid #121826;border-radius:10px;box-shadow:4px 4px 0 #121826;padding:8px 16px;font:600 14px "Figtree",system-ui,sans-serif;max-width:calc(100% - 32px)}';

  var DISCORD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1.1a15.6 15.6 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17 17 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.2 12.2 0 0 0 11.4 0l.4.3-1.7.8 1.1 1.8a17 17 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7ZM8.7 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Zm6.6 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1Z"/></svg>';

  function esc(t){ return String(t == null ? "" : t).replace(/[&<>"]/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function toast(msg){
    var d = document.createElement("div"); d.className = "konto-fel"; d.setAttribute("role","status"); d.textContent = msg;
    document.body.appendChild(d); setTimeout(function(){ d.remove(); }, 5000);
  }

  function start(){
    var nav = document.querySelector(".nav ul");
    if (!nav) return;
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var li = document.createElement("li"); li.className = "konto"; nav.appendChild(li);

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY){
      console.info("LoomBoom: inloggningen är inte inställd än. Fyll i SUPABASE_URL och SUPABASE_ANON_KEY i konto.js.");
      li.remove(); return;
    }
    if (!window.supabase || !window.supabase.createClient){ li.remove(); return; }

    var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, detectSessionInUrl: true, flowType: "pkce" } });
    window.loomboomKonto = sb; // så att andra sidor (t.ex. topplistor) kan använda samma inloggning senare

    function showOut(){
      li.innerHTML = '<button type="button" class="konto-btn" id="konto-in">' + DISCORD + 'Logga in</button>';
      li.querySelector("#konto-in").addEventListener("click", function(){
        var back = location.href.split("#")[0];
        sb.auth.signInWithOAuth({ provider: "discord", options: { redirectTo: back, scopes: "identify" } })
          .then(function(r){ if (r && r.error) toast("Det gick inte att logga in just nu. Försök igen om en stund."); });
      });
    }
    function showIn(user){
      var m = user.user_metadata || {};
      var name = (m.custom_claims && m.custom_claims.global_name) || m.full_name || m.name || m.user_name || "Inloggad";
      var pic = m.avatar_url || m.picture || "";
      li.innerHTML = '<button type="button" class="konto-btn" id="konto-knapp" aria-expanded="false" aria-haspopup="true">' +
        (pic ? '<img src="' + esc(pic) + '" alt="" referrerpolicy="no-referrer">' : DISCORD) + '<span class="namn">' + esc(name) + '</span></button>' +
        '<div class="konto-meny" id="konto-meny" hidden><p>Inloggad med Discord som<b>' + esc(name) + '</b></p><button type="button" id="konto-ut">Logga ut</button></div>';
      var btn = li.querySelector("#konto-knapp"), menu = li.querySelector("#konto-meny");
      btn.addEventListener("click", function(e){ e.stopPropagation(); var open = menu.hidden; menu.hidden = !open; btn.setAttribute("aria-expanded", open ? "true" : "false"); });
      li.querySelector("#konto-ut").addEventListener("click", function(){ sb.auth.signOut().then(showOut); });
    }

    function closeMenu(){ var m = li.querySelector("#konto-meny"), b = li.querySelector("#konto-knapp"); if (m){ m.hidden = true; b.setAttribute("aria-expanded","false"); } }
    document.addEventListener("click", function(e){ if (!li.contains(e.target)) closeMenu(); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeMenu(); });

    showOut();
    sb.auth.getSession().then(function(r){ var s = r && r.data && r.data.session; if (s) showIn(s.user); });
    sb.auth.onAuthStateChange(function(ev, session){
      if (session && session.user) showIn(session.user); else showOut();
      if (ev === "SIGNED_IN" && /[?&]code=/.test(location.search)){
        try{ history.replaceState(null, "", location.pathname + location.hash); }catch(e){}
      }
    });
    var p = new URLSearchParams(location.search + "&" + location.hash.replace(/^#/, ""));
    if (p.get("error")) toast("Inloggningen avbröts. Du kan försöka igen.");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
