// Hämtar LoomBooms statistik från Steam och sparar den i data/stats.json.
// Körs av GitHub Actions (.github/workflows/statistik.yml). Nyckeln ligger i GitHub Secrets.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const KEY = process.env.STEAM_API_KEY;
const ID_IN = (process.env.STEAM_ID || "").trim();
if (!KEY || !ID_IN) {
  console.error("Saknar STEAM_API_KEY eller STEAM_ID. Lägg in dem under Settings → Secrets and variables → Actions.");
  process.exit(1);
}

// Spelen som visas extra tydligt på sidan (Steams app-id)
const TRACKED = [
  { appid: 730, name: "Counter-Strike 2" },
  { appid: 1966720, name: "Lethal Company" }
];

async function get(path, params = {}) {
  const url = new URL("https://api.steampowered.com" + path);
  url.searchParams.set("key", KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path} svarade ${res.status}`);
  return res.json();
}
const hours = (min) => Math.round(((min || 0) / 60) * 10) / 10;

let steamid = ID_IN;
if (!/^\d{17}$/.test(steamid)) {
  const v = await get("/ISteamUser/ResolveVanityURL/v1/", { vanityurl: steamid });
  if (v.response?.success !== 1) throw new Error("Hittade ingen Steam-profil med namnet " + steamid);
  steamid = v.response.steamid;
}

const [summary, level, owned, recent] = await Promise.all([
  get("/ISteamUser/GetPlayerSummaries/v2/", { steamids: steamid }),
  get("/IPlayerService/GetSteamLevel/v1/", { steamid }),
  get("/IPlayerService/GetOwnedGames/v1/", { steamid, include_appinfo: 1, include_played_free_games: 1 }),
  get("/IPlayerService/GetRecentlyPlayedGames/v1/", { steamid })
]);

const p = summary.response?.players?.[0] || {};
const games = owned.response?.games || [];
if (!games.length) console.warn("Inga spel hittades. Är Speldetaljer satt till Offentlig i Steams sekretessinställningar?");

let cs = null;
try {
  const s = await get("/ISteamUserStats/GetUserStatsForGame/v2/", { steamid, appid: 730 });
  const m = Object.fromEntries((s.playerstats?.stats || []).map((x) => [x.name, x.value]));
  cs = {
    kills: m.total_kills ?? null,
    deaths: m.total_deaths ?? null,
    headshots: m.total_kills_headshot ?? null,
    shotsFired: m.total_shots_fired ?? null,
    shotsHit: m.total_shots_hit ?? null,
    roundsWon: m.total_wins ?? null,
    roundsPlayed: m.total_rounds_played ?? null,
    matchesWon: m.total_matches_won ?? null,
    matchesPlayed: m.total_matches_played ?? null,
    mvps: m.total_mvps ?? null,
    damage: m.total_damage_done ?? null
  };
} catch (e) {
  console.warn("Kunde inte hämta CS-statistik:", e.message);
}

// Premier, Leetify-rating m.m. via Leetifys öppna API (kräver att du har loggat in på leetify.com med Steam)
let leetify = null;
try {
  const headers = process.env.LEETIFY_API_KEY ? { _leetify_key: process.env.LEETIFY_API_KEY } : {};
  const res = await fetch(`https://api-public.cs-prod.leetify.com/v3/profile?steam64_id=${steamid}`, { headers });
  if (!res.ok) throw new Error("Leetify svarade " + res.status);
  const L = await res.json();
  const r = L.ranks || {}, rt = L.rating || {};
  leetify = {
    url: `https://leetify.com/app/profile/${steamid}`,
    premier: r.premier ?? null,
    leetifyRating: r.leetify ?? null,
    faceitLevel: r.faceit ?? null,
    faceitElo: r.faceit_elo ?? null,
    wingman: r.wingman ?? null,
    renown: r.renown ?? null,
    winrate: L.winrate ?? null,
    totalMatches: L.total_matches ?? null,
    rating: { aim: rt.aim ?? null, positioning: rt.positioning ?? null, utility: rt.utility ?? null, clutch: rt.clutch ?? null, opening: rt.opening ?? null },
    recent: (L.recent_matches || []).slice(0, 8).map((m) => ({
      date: m.finished_at ?? null,
      map: m.map_name ?? null,
      source: m.data_source ?? null,
      outcome: m.outcome ?? null,
      score: m.score ?? null,
      rating: m.leetify_rating ?? null
    }))
  };
} catch (e) {
  console.warn("Kunde inte hämta Leetify:", e.message);
}

// FACEIT via FACEITs Data API (kräver FACEIT_API_KEY). Kontot hittas med ditt Steam-ID.
let faceit = null;
if (process.env.FACEIT_API_KEY) {
  try {
    const fh = { Authorization: "Bearer " + process.env.FACEIT_API_KEY };
    const nick = (process.env.FACEIT_NICKNAME || "").trim();
    const q = nick ? `nickname=${encodeURIComponent(nick)}` : `game=cs2&game_player_id=${steamid}`;
    const pr = await fetch(`https://open.faceit.com/data/v4/players?${q}`, { headers: fh });
    if (!pr.ok) throw new Error("FACEIT-spelare svarade " + pr.status);
    const P = await pr.json();
    const g = P.games?.cs2 || {};
    const st = await fetch(`https://open.faceit.com/data/v4/players/${P.player_id}/stats/cs2`, { headers: fh });
    const S = st.ok ? await st.json() : {};
    const lt = S.lifetime || {};
    const num = (v) => (v == null || v === "" ? null : Number(String(v).replace(",", ".")));
    faceit = {
      nickname: P.nickname ?? null,
      url: P.nickname ? `https://www.faceit.com/sv/players/${P.nickname}` : null,
      level: g.skill_level ?? null,
      elo: g.faceit_elo ?? null,
      matches: num(lt["Matches"]),
      wins: num(lt["Wins"]),
      winrate: num(lt["Win Rate %"]),
      kd: num(lt["Average K/D Ratio"]),
      hs: num(lt["Average Headshots %"]),
      longestStreak: num(lt["Longest Win Streak"]),
      currentStreak: num(lt["Current Win Streak"]),
      recent: (lt["Recent Results"] || []).map((x) => String(x) === "1")
    };
  } catch (e) {
    console.warn("Kunde inte hämta FACEIT:", e.message);
  }
}

// Schack via chess.coms öppna API (ingen nyckel behövs)
let chess = null;
try {
  const user = (process.env.CHESS_USERNAME || "LoomBoom10").trim().toLowerCase();
  const ch = { "User-Agent": "LoomBoom-hemsida (loomboom.se)" };
  const cj = async (u) => { const r = await fetch(u, { headers: ch }); if (!r.ok) throw new Error(u + " svarade " + r.status); return r.json(); };
  const [P, S] = await Promise.all([cj(`https://api.chess.com/pub/player/${user}`), cj(`https://api.chess.com/pub/player/${user}/stats`)]);
  const mode = (k, label) => S[k] ? {
    key: k, label,
    rating: S[k].last?.rating ?? null,
    best: S[k].best?.rating ?? null,
    win: S[k].record?.win ?? 0, loss: S[k].record?.loss ?? 0, draw: S[k].record?.draw ?? 0
  } : null;
  let games = [];
  try {
    const A = await cj(`https://api.chess.com/pub/player/${user}/games/archives`);
    const urls = (A.archives || []).slice(-2);
    for (const u of urls) games = games.concat((await cj(u)).games || []);
  } catch (e) { console.warn("Kunde inte hämta schackpartier:", e.message); }
  const drawish = ["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"];
  const recent = games.sort((a, b) => (b.end_time || 0) - (a.end_time || 0)).slice(0, 6).map((g) => {
    const white = (g.white?.username || "").toLowerCase() === user;
    const me = white ? g.white : g.black, opp = white ? g.black : g.white;
    const res = me?.result === "win" ? "win" : drawish.includes(me?.result) ? "draw" : "loss";
    return { date: g.end_time ? new Date(g.end_time * 1000).toISOString() : null, mode: g.time_class || null, color: white ? "vit" : "svart",
             result: res, opponent: opp?.username || null, oppRating: opp?.rating ?? null, myRating: me?.rating ?? null, url: g.url || null };
  });
  chess = {
    username: P.username || user,
    url: P.url || `https://www.chess.com/member/${user}`,
    avatar: P.avatar || null,
    league: P.league || null,
    joined: P.joined ? new Date(P.joined * 1000).toISOString() : null,
    modes: [mode("chess_rapid", "Rapid"), mode("chess_blitz", "Blitz"), mode("chess_bullet", "Bullet"), mode("chess_daily", "Daily")].filter(Boolean),
    puzzles: S.tactics?.highest?.rating ?? null,
    puzzleRush: S.puzzle_rush?.best?.score ?? null,
    recent
  };
} catch (e) {
  console.warn("Kunde inte hämta schack:", e.message);
}

// 100 % avklarade spel: kollar achievements för alla spel jag har spelat
let perfect = null;
try {
  const played = games.filter((g) => (g.playtime_forever || 0) > 0).slice(0, 300);
  const list = [];
  let withAch = 0, unlocked = 0, total = 0;
  for (let i = 0; i < played.length; i += 8) {
    const batch = played.slice(i, i + 8);
    const res = await Promise.all(batch.map(async (g) => {
      try {
        const url = new URL("https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/");
        url.searchParams.set("key", KEY); url.searchParams.set("steamid", steamid); url.searchParams.set("appid", g.appid);
        const r = await fetch(url); if (!r.ok) return null;
        const a = (await r.json()).playerstats?.achievements || [];
        if (!a.length) return null;
        return { g, done: a.filter((x) => x.achieved === 1).length, all: a.length };
      } catch { return null; }
    }));
    for (const x of res) {
      if (!x) continue;
      withAch++; unlocked += x.done; total += x.all;
      if (x.done === x.all) list.push({ appid: x.g.appid, name: x.g.name, achievements: x.all, hours: hours(x.g.playtime_forever) });
    }
  }
  list.sort((a, b) => b.achievements - a.achievements);
  perfect = { count: list.length, gamesWithAchievements: withAch, unlocked, total, games: list };
} catch (e) {
  console.warn("Kunde inte räkna achievements:", e.message);
}

// Fortnite via fortnite-api.com (kräver FORTNITE_API_KEY och att statistiken är offentlig i Fortnite)
let fortnite = null;
if (process.env.FORTNITE_API_KEY) {
  try {
    const name = (process.env.FORTNITE_NAME || "LooomBooom").trim();
    const r = await fetch(`https://fortnite-api.com/v2/stats/br/v2?name=${encodeURIComponent(name)}&accountType=epic`, { headers: { Authorization: process.env.FORTNITE_API_KEY } });
    if (r.status === 403) throw new Error("statistiken är privat. Slå på offentlig statistik i Fortnite.");
    if (r.status === 404) throw new Error("hittade inget Epic-konto som heter " + name);
    if (!r.ok) throw new Error("fortnite-api svarade " + r.status);
    const D = (await r.json()).data || {};
    const pick = (o) => o ? { matches: o.matches ?? null, wins: o.wins ?? null, winRate: o.winRate ?? null, kills: o.kills ?? null, kd: o.kd ?? null,
      top10: o.top10 ?? null, minutes: o.minutesPlayed ?? null } : null;
    const all = D.stats?.all || {};
    fortnite = {
      name: D.account?.name || name,
      level: D.battlePass?.level ?? null,
      overall: pick(all.overall),
      solo: pick(all.solo), duo: pick(all.duo), squad: pick(all.squad)
    };
  } catch (e) {
    console.warn("Kunde inte hämta Fortnite:", e.message);
  }
}

const stats = {
  updated: new Date().toISOString(),
  player: {
    name: p.personaname || null,
    avatar: p.avatarfull || null,
    url: p.profileurl || null,
    online: (p.personastate || 0) > 0,
    playing: p.gameextrainfo || null,
    level: level.response?.player_level ?? null
  },
  library: {
    count: owned.response?.game_count ?? games.length,
    hours: hours(games.reduce((a, g) => a + (g.playtime_forever || 0), 0))
  },
  tracked: TRACKED.map((t) => {
    const g = games.find((x) => x.appid === t.appid);
    return { appid: t.appid, name: t.name, hours: hours(g?.playtime_forever), hours2w: hours(g?.playtime_2weeks) };
  }),
  recent: (recent.response?.games || [])
    .map((g) => ({ appid: g.appid, name: g.name, hours2w: hours(g.playtime_2weeks), hours: hours(g.playtime_forever) }))
    .sort((a, b) => b.hours2w - a.hours2w)
    .slice(0, 6),
  cs,
  leetify,
  faceit,
  chess,
  perfect,
  fortnite
};

await mkdir("data", { recursive: true });
await writeFile("data/stats.json", JSON.stringify(stats, null, 2) + "\n");

// Historik: en punkt per dag, de senaste 180 dagarna
let history = [];
try { history = JSON.parse(await readFile("data/history.json", "utf8")); } catch {}
const day = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
const point = { date: day };
for (const t of stats.tracked) point[t.appid] = t.hours;
if (leetify?.premier) point.premier = leetify.premier;
if (faceit?.elo) point.faceitElo = faceit.elo;
if (fortnite?.overall?.wins != null) point.fortniteWins = fortnite.overall.wins;
if (perfect) point.perfect = perfect.count;
for (const m of chess?.modes || []) if (m.rating) point["chess_" + m.label.toLowerCase()] = m.rating;
history = history.filter((h) => h.date !== day);
history.push(point);
history.sort((a, b) => a.date.localeCompare(b.date));
history = history.slice(-180);
await writeFile("data/history.json", JSON.stringify(history, null, 2) + "\n");

console.log("Klart:", stats.player.name, "–", stats.tracked.map((t) => `${t.name} ${t.hours} h`).join(", "));
