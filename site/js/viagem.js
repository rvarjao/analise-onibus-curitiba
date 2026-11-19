const LINHAS = [["010", "INTERBAIRROS I (HORÁRIO)"], ["011", "INTERBAIRROS I (ANTI-HORÁRIO)"], ["020", "INTERBAIRROS II (HORÁRIO)"], ["021", "INTERBAIRROS II (ANTI-HORÁRIO)"], ["022", "INTER 2 (HORÁRIO)"], ["023", "INTER 2 ( ANTI-HORÁRIO)"], ["024", "C. RASO / CAMP. SIQUEIRA"], ["027", "C. RASO / C. DO SIQUEIRA"], ["030", "INTERBAIRROS III"], ["040", "INTERBAIRROS IV"], ["050", "INTERBAIRROS V"], ["060", "INTERBAIRROS VI"], ["150", "C. MÚSICA / V. ALEGRE"], ["160", "JD. MERCÊS / GUANABARA"], ["164", "R.PRADO/C.GOMES"], ["166", "V. NORI"], ["168", "RAPOSO TAVARES"], ["169", "JD. KOSMOS"], ["170", "BRACATINGA"], ["171", "PRIMAVERA"], ["175", "BOM RETIRO / PUC"], ["176", "PARQUE TANGUÁ"], ["177", "CABRAL / PQ.TANGUÁ"], ["181", "MATEUS LEME"], ["182", "ABRANCHES"], ["183", "JD. CHAPARRAL"], ["184", "V. SUIÇA"], ["188", "MAD. PILARZINHO / UBERABA"], ["189", "MAD. ABRANCHES"], ["203", "STA. CÂNDIDA / C. RASO"], ["205", "BARREIRINHA"], ["206", "BARREIRINHA / SÃO JOSÉ"], ["207", "CABRAL / OSÓRIO"], ["209", "MAD. S. CÂNDIDA / C. RASO"], ["210", "CIC/CABRAL"], ["211", "COLINA VERDE"], ["212", "SOLAR"], ["213", "SÃO JOÃO"], ["214", "TINGUI"], ["216", "CABRAL / PORTÃO"], ["220", "CABRAL/HAUER"], ["222", "V. ESPERANÇA"], ["224", "CASSIOPÉIA"], ["225", "BOA VISTA / BARREIRINHA"], ["226", "ABAETÉ"], ["229", "MAD. PENHA / F. NORONHA"], ["231", "BANESTADO / CALIFÓRNIA"], ["232", "ALIANÇA"], ["233", "OLARIA"], ["236", "SÃO BENEDITO"], ["237", "PARQUE ATUBA"], ["238", "ATUBA/STA.CANDIDA"], ["242", "V. LEONICE"], ["243", "STA. TEREZINHA"], ["244", "JD. DO ARROIO"], ["245", "ANITA GARIBALDI"], ["247", "HOSP. VETERINÁRIO"], ["250", "LIGEIRÃO NORTE / SUL"], ["260", "MAL. HERMES / STA. EFIGÊNIA"], ["265", "AHÚ / LOS ANGELES"], ["266", "ESTRIBO AHÚ"], ["272", "PAINEIRAS"], ["274", "STA. GEMA"], ["275", "F. NORONHA / LARANJEIRAS"], ["280", "NSA.SRA.DE NAZARÉ"], ["302", "CENTENÁRIO / RUI BARBOSA"], ["303", "CENTENÁRIO / C. COMPRIDO"], ["304", "PINHAIS / C. COMPRIDO"], ["305", "CENTENÁRIO"], ["307", "B. ALTO / STA. FELICIDADE"], ["308", "MAD. CENTENÁRIO / RUI BARBOSA"], ["309", "MAD. CENTENÁRIO"], ["311", "ARAGUAIA"], ["321", "TRINDADE"], ["322", "CAMARGO"], ["323", "V. AUTÓDROMO"], ["331", "MERCÚRIO"], ["332", "ACRÓPOLE"], ["334", "AGRÍCOLA"], ["335", "CENTENÁRIO / BOQUEIRÃO"], ["336", "V. RENO"], ["338", "CENTENÁRIO / HAUER"], ["342", "B. ALTO / BOA VISTA"], ["343", "PARAÍSO"], ["345", "B. ALTO / ATUBA"], ["350", "ATUBA / PINHEIRINHO"], ["360", "NOVENA"], ["361", "AUGUSTO STRESSER"], ["365", "JD. SOCIAL / BATEL"], ["366", "ITUPAVA / HOSP. MILITAR"], ["371", "HIGIENÓPOLIS"], ["372", "TARUMÃ"], ["373", "ALTO TARUMÃ"], ["374", "HUGO LANGE"], ["375", "SAGRADO CORAÇÃO"], ["380", "DETRAN / VIC. MACHADO"], ["385", "CRISTO REI"], ["386", "CAJURU"], ["387", "PALOTINOS"], ["389", "MAD. TARUMÃ / AUGUSTA"], ["461", "STA. BARBARA"], ["462", "PETRÓPOLIS"], ["463", "SOLITUDE"], ["464", "A. MUNHOZ / JD. BOTÂNICO"], ["465", "ERASTO GAERTNER"], ["466", "ESTUDANTES"], ["468", "JD. CENTAURO"], ["469", "CENTRO POLITÉCNICO"], ["471", "V. SÃO PAULO"], ["472", "UBERABA"], ["474", "JD. ITIBERÊ"], ["475", "CANAL BELÉM"], ["477", "V. MACEDO VIA GUABIROTUBA"], ["489", "MAD. PETRÓPOLIS / SOLITUDE"], ["500", "LIGEIRÃO BOQUEIRÃO"], ["502", "CIRCULAR SUL (HORÁRIO)"], ["503", "BOQUEIRÃO"], ["505", "BOQUEIRÃO / C. CÍVICO"], ["506", "BAIRRO NOVO"], ["507", "SÍTIO CERCADO (HORÁRIO)"], ["508", "SÍTIO CERCADO (ANTI-HORÁRIO)"], ["509", "MAD. BOQUEIRÃO"], ["513", "HAUER / BOQUEIRÃO"], ["515", "IGUAPE II"], ["516", "C. BELEM / S. FILHO"], ["519", "MAD. S. FRANCISCO / IGUAPE"], ["520", "OSTERNACK / S. CERCADO L.D."], ["521", "NIVALDO BRAGA"], ["522", "MARINGÁ"], ["523", "IGUAPE I"], ["524", "BAIRRO NOVO B/C"], ["525", "HAUER / C.RASO"], ["526", "ITAMARATI / V. SÃO PEDRO"], ["528", "BOQUEIRÃO/PINHEIRINHO"], ["529", "PARQUE NÁUTICO"], ["531", "STA. INÊS"], ["532", "JD.PARANAENSE"], ["533", "E. VERÍSSIMO / PANTANAL"], ["534", "PARIGOT DE SOUZA"], ["535", "OSTERNACK / BOQUEIRÃO"], ["536", "ZOOLÓGICO"], ["541", "BAIRRO NOVO A"], ["542", "BAIRRO NOVO B"], ["545", "TRABALHADOR"], ["547", "BAIRRO NOVO C"], ["548", "OSTERNACK / S. CERCADO"], ["549", "MAD. BAIRRO NOVO"], ["550", "LIGEIRÃO PINHEIRINHO / C. GOMES"], ["552", "SAMBAQUI"], ["553", "MORADIAS PQ. IGUAÇU"], ["560", "ALFERES POLI"], ["561", "GUILHERMINA"], ["600", "TEQUALY/QUARTEL GENERAL"], ["602", "CIRCULAR SUL (ANTI-HORÁRIO)"], ["603", "PINHEIRINHO/RUI BARBOSA"], ["607", "COLOMBO / CIC"], ["609", "MAD. CIC"], ["610", "S. CERCADO / C. RASO"], ["611", "FAZENDINHA / PORTÃO"], ["612", "PORTÃO / CIC"], ["614", "FAZENDINHA / PUC"], ["615", "UBERLÂNDIA"], ["616", "PORTAO / STA.BERNADETHE"], ["617", "JD. LUDOVICA"], ["619", "STA. RITA / CIC"], ["620", "STA. CRUZ"], ["621", "FANNY"], ["622", "RONDON"], ["623", "PARQUE INDUSTRIAL"], ["625", "GRAMADOS"], ["627", "BOSCH"], ["628", "CARBOMAFRA"], ["629", "ALTO BOQUEIRÃO"], ["630", "VITÓRIA RÉGIA"], ["631", "PIRATINI / BR-476"], ["632", "QUARTEL GENERAL"], ["633", "MARIA ANGÉLICA"], ["635", "LONDRINA"], ["636", "RIO NEGRO"], ["637", "STA. JOANA"], ["638", "PINHEIRINHO"], ["639", "FUTURAMA"], ["640", "PALMEIRA"], ["641", "LUIZ NICHELE"], ["642", "GANCHINHO"], ["643", "UMBARÁ"], ["644", "PINHEIRINHO / CIC"], ["646", "POMPEIA/JANAINA"], ["649", "PIRINEUS"], ["650", "STA. RITA / PINHEIRINHO"], ["652", "V. VERDE"], ["653", "SABARÁ"], ["654", "CAMPO ALEGRE"], ["655", "JD. DA ORDEM"], ["658", "C. RASO / CAIUÁ"], ["659", "CAXIMBA / OLARIA"], ["661", "LINDÓIA"], ["662", "DOM ÁTICO"], ["663", "V. CUBAS"], ["665", "V. REX"], ["666", "NOVO MUNDO"], ["670", "SÃO JORGE"], ["671", "PORTÃO"], ["673", "FORMOSA"], ["674", "NSA. SRA. DA LUZ"], ["679", "MAD. TATUQUARA"], ["680", "RURBANA"], ["681", "DALAGASSA"], ["683", "FUTURAMA / S. CERCADO"], ["684", "RIO BONITO"], ["685", "RIO BONITO / CIC"], ["689", "MAD. S. PEDRO / R. NEGRO"], ["690", "V. JULIANA"], ["700", "PINHEIRINHO/CABRAL"], ["701", "FAZENDINHA"], ["702", "CAIUA/CACHOEIRA"], ["703", "CAIUÁ"], ["706", "CAIUA/FAZ/CENTRO"], ["707", "TATUQUARA / CENTRO"], ["708", "TATUQUARA / S. CERCADO"], ["709", "V. TIRADENTES / CIC"], ["710", "STA.AMELIA/P.BELO"], ["711", "ITATIAIA"], ["712", "JD. INDEPENDÊNCIA / CIC"], ["713", "STA. AMÉLIA"], ["718", "PORTO BELO"], ["720", "FAZENDINHA / C. COMPRIDO"], ["721", "MÁRIO JORGE"], ["722", "COMPLEXO INDUSTRIAL"], ["723", "EMÍLIO ROMANI"], ["724", "FAZENDINHA/CAIUÁ-B.VISTA"], ["725", "BATEL / MOSSUNGUÊ"], ["760", "STA. QUITÉRIA"], ["761", "V. IZABEL"], ["762", "V. ROSINHA"], ["772", "TUPY/JULIANA"], ["773", "VIZINHANÇA/STA. RITA"], ["777", "V. VELHA"], ["778", "COTOLENGO"], ["779", "V. VELHA/BURITI"], ["788", "MAD. V. VELHA"], ["789", "MAD. CAIUÁ"], ["794", "PQ. LAGO AZUL"], ["801", "CAMP. SIQUEIRA / BATEL"], ["809", "MAD. CAMPO COMPRIDO"], ["812", "MONTANA"], ["814", "MOSSUNGUÊ"], ["815", "REFORÇO TUIUTI"], ["816", "CAMP. SIQUEIRA / STA.FELICIDADE"], ["817", "SATURNO / VENEZA"], ["820", "AUGUSTA/V. MARQUETO"], ["821", "FERNÃO DIAS"], ["822", "GABINETO"], ["823", "AUGUSTA"], ["825", "V. MARQUETO"], ["826", "C. COMPRIDO / CIC"], ["827", "RIVIERA"], ["828", "C. COMPRIDO / C. RASO"], ["829", "UNIV.POSITIVO"], ["831", "FAZENDINHA / C.RASO"], ["832", "POSIVILLE / INC"], ["860", "V. SANDRA"], ["861", "TRAMONTINA"], ["862", "BARIGUI"], ["863", "ÁGUA VERDE"], ["864", "TEQUALY"], ["865", "JD. ESPLANADA"], ["870", "SÃO BRAZ"], ["875", "BIGORRILHO"], ["876", "SAVÓIA"], ["889", "MAD. SÃO BRÁZ"], ["901", "STA. FELICIDADE"], ["902", "STA. FELICIDADE / PCA.TIRADENTES"], ["911", "PASSAÚNA"], ["912", "JOSÉ CULPI"], ["913", "BUTIATUVINHA"], ["915", "OURO VERDE (VIA VL.BÁDIA)"], ["916", "PINHEIROS"], ["917", "JD. IPÊ"], ["924", "STA. FELICIDADE / STA. CÂNDIDA"], ["928", "PASSAÚNA / JD.IPÊ"], ["948", "BUTIATUVINHA/ OURO VERDE"], ["958", "PINHEIROS / JOSÉ CULPI"], ["965", "SÃO BERNARDO"], ["967", "JÚLIO GRAF"], ["972", "JD. ITÁLIA"], ["979", "TURISMO"], ["989", "MAD. STA. FELICIDADE"], ["X02", "REFORÇO TUBO BARIGUI"], ["X08", "REFORÇO PINHEIRINHO"], ["X11", "SITIO CERCADO / C. RASO"], ["X12", "ESPECIAL BOQUEIRAO"], ["X14", "REFORÇO HAUER"], ["X20", "PORTAO/SITIO CERCADO"], ["X36", "REF. GUADALUPE / FAZENDINHA"], ["X37", "STA. RITA / PINH. (SEMI DIRETO)"], ["X38", "RIO BONITO (SEMI-DIRETO)"], ["X41", "REFORÇO SABARÁ"], ["X43", "BRF / COPEL"], ["X45", "ESPECIAL B.ALTO / C.IMBUIA"], ["X47", "ESPECIAL PINHEIRINHO"], ["X48", "ESP. EUFRÁSIO / RUI BARBOSA"], ["X49", "REFORÇO PORTÃO / CABRAL"], ["X55", "REFORÇO CIC / AV. J.K."]];
const $ = id => document.getElementById(id);
const CHAVE = "viagem_em_andamento", CHAVE_PEND = "viagens_pendentes", MAX_CMP = 6;
const fmt = (n, d = 0) => n == null || isNaN(n) ? "--" : Number(n).toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const cor = i => css("--s" + (i % MAX_CMP + 1));
const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
let viagem = null, watchId = null, wakeLock = null, timerUI = null, timerSave = null, ultimo = null, vmax = 0;
let sb = null, usuario = null, enviadas = [], selecionadas = new Set(), series = {}, comparacoesUrbs = {}, grafico = null, graficoUrbs = null, mapa = null, camadaMapa = null, eixo = "tempo";

// ---------- linhas ----------
const dl = $("listaLinhas");
LINHAS.forEach(([cod, nome]) => { const o = document.createElement("option"); o.value = cod + " — " + nome; dl.appendChild(o); });
function codigoDaLinha(txt) { const m = txt.trim().match(/^([0-9A-Za-z]{2,4})(\s|—|-|$)/); return m ? m[1].toUpperCase() : txt.trim(); }

// ---------- utilidades ----------
function hav(a, b, c, d) { const p = Math.PI / 180, x = Math.sin((c - a) * p / 2) ** 2 + Math.cos(a * p) * Math.cos(c * p) * Math.sin((d - b) * p / 2) ** 2; return 2 * 6371000 * Math.asin(Math.sqrt(x)); }
const mmss = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60; return (h ? h + ":" : "") + String(m).padStart(2, "0") + ":" + String(r).padStart(2, "0"); };
const dataHora = ms => new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
function lerJSON(k, padrao) { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : padrao; } catch (e) { return padrao; } }
function gravarJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
function salvarLocal() { if (viagem) gravarJSON(CHAVE, viagem); }
function limparLocal() { try { localStorage.removeItem(CHAVE); } catch (e) { } }
const pendentes = () => lerJSON(CHAVE_PEND, []);
function guardarPendente(v) { return gravarJSON(CHAVE_PEND, pendentes().filter(x => x.id_local !== v.id_local).concat([v])); }
function removerPendente(id) { gravarJSON(CHAVE_PEND, pendentes().filter(x => x.id_local !== id)); }
function status(txt, cls) { const s = $("status"); s.textContent = txt; s.className = "status " + (cls || ""); }
function msg(el, txt, cls) { el.textContent = txt; el.className = "msg " + (cls || ""); }

const TELAS = { login: "telaLogin", prep: "telaPrep", rec: "telaRec", fim: "telaFim", lista: "telaLista" };
function tela(n) {
  Object.entries(TELAS).forEach(([k, id]) => { $(id).hidden = k !== n; });
  $("logado").hidden = !usuario || n === "login" || n === "rec";
  document.querySelectorAll("#abas button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.aba === n || (n === "fim" && b.dataset.aba === "prep"))));
  $("main").classList.toggle("largo", n === "lista");
  $("subtitulo").hidden = n === "lista" || n === "rec";
  if (n !== "rec") verificarEmAndamento();
}

// ---------- Supabase ----------
function cliente() {
  if (sb) return sb;
  const c = window.APP_CONFIG;
  if (!window.supabase || !c?.supabaseUrl || c.supabaseUrl.includes("SEU-PROJETO")) return null;
  sb = window.supabase.createClient(c.supabaseUrl, c.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, storageKey: "viagem-auth" } });
  return sb;
}
function traduzErro(e) {
  const m = (e && e.message) || String(e);
  if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/Email not confirmed/i.test(m)) return "Confirme o seu e-mail antes de entrar.";
  if (/Failed to fetch|NetworkError|network/i.test(m)) return "Sem conexão com o servidor.";
  if (/JWT|not authenticated|logado/i.test(m)) return "Sua sessão expirou. Saia e entre novamente.";
  return m;
}
function entrou(session) {
  usuario = session.user;
  $("quem").textContent = usuario.email || "";
  tela("prep");
}
async function iniciarApp() {
  migrarDadosAntigos();
  const c = cliente();
  if (!c) { tela("login"); msg($("msgLogin"), "O site ainda não foi configurado (config.js com a URL e a chave do Supabase).", "bad"); $("btnEntrar").disabled = true; return; }
  c.auth.onAuthStateChange((ev, s) => {
    if (ev === "SIGNED_OUT") { usuario = null; if (watchId === null) tela("login"); }
    else if (s) usuario = s.user;
  });
  const { data } = await c.auth.getSession();
  if (data.session) entrou(data.session); else tela("login");
}
$("formLogin").addEventListener("submit", async e => {
  e.preventDefault();
  const c = cliente(); if (!c) return;
  $("btnEntrar").disabled = true; msg($("msgLogin"), "Entrando…");
  try {
    const { data, error } = await c.auth.signInWithPassword({ email: $("email").value.trim(), password: $("senha").value });
    if (error) throw error;
    $("senha").value = ""; msg($("msgLogin"), ""); entrou(data.session);
  } catch (err) { msg($("msgLogin"), traduzErro(err), "bad"); }
  finally { $("btnEntrar").disabled = false; }
});
$("btnSair").addEventListener("click", async () => {
  const n = pendentes().length;
  if (!confirm(n ? `Há ${n} viagem(ns) não enviada(s). Elas continuam neste aparelho. Sair mesmo assim?` : "Sair da sua conta?")) return;
  enviadas = []; selecionadas.clear(); series = {};
  await cliente().auth.signOut();
  usuario = null; tela("login");
});
async function enviar(v) {
  const c = cliente(); if (!c) throw new Error("Supabase não configurado.");
  if (v.amostras.length < 2) throw new Error(`A viagem da linha ${v.linha} tem poucos pontos de GPS para enviar; baixe ou descarte.`);
  const payload = { ...v, amostras: v.amostras.map((a, i) => { const b = [...a]; b[4] = leitura(v, i).valor; return b; }), amostras_originais: v.amostras };
  const { data, error } = await c.rpc("salvar_viagem", { p: payload });
  if (error) throw error;
  if (v.tipo_onibus) {
    const { error: erroTipo } = await c.from("viagens").update({ tipo_onibus: v.tipo_onibus }).eq("id", data);
    if (erroTipo) throw erroTipo;
  }
  removerPendente(v.id_local);
  return data;
}

// ---------- gravação ----------
async function pegarTela() {
  try {
    if ("wakeLock" in navigator) { wakeLock = await navigator.wakeLock.request("screen"); $("wl").textContent = "ativo"; wakeLock.addEventListener("release", () => { $("wl").textContent = "liberado"; }); }
    else $("wl").textContent = "não suportado: desative o bloqueio automático nas configurações do celular";
  } catch (e) { $("wl").textContent = "indisponível (" + (e.name || "erro") + ")"; }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && watchId !== null) pegarTela(); });

function iniciar() {
  if (!("geolocation" in navigator)) { alert("Este navegador não tem geolocalização."); return; }
  const cod = codigoDaLinha($("linha").value);
  if (!cod) { $("linha").focus(); return; }
  const conhecida = LINHAS.find(l => l[0] === cod);
  viagem = {
    versao: 1, id_local: novoId(), linha: cod, nome_linha: conhecida ? conhecida[1] : null,
    veiculo: $("veiculo").value.trim().toUpperCase() || null, tipo_onibus: $("tipoOnibus").value || null, obs: $("obs").value.trim() || null,
    inicio_ms: Date.now(), fim_ms: null, fuso_min: new Date().getTimezoneOffset(),
    amostras_colunas: ["t_ms", "lat", "lon", "precisao_m", "vel_ms", "rumo"], amostras: [], marcas: []
  };
  ultimo = null; vmax = 0; $("vel").textContent = "--"; $("velCalc").textContent = ""; $("marcas").textContent = ""; $("pontos").textContent = "0";
  tela("rec"); status("Aguardando sinal de GPS…", "warn");
  pegarTela();
  watchId = navigator.geolocation.watchPosition(aoPosicao, aoErro, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
  timerUI = setInterval(atualizarUI, 500);
  timerSave = setInterval(salvarLocal, 10000);
  salvarLocal();
}
const LIMITE_GPS = 120, ACEL_GPS = 4;
function leitura(v, i) {
  const a = v.amostras[i], b = v.amostras[i - 1], dt = b ? (a[0] - b[0]) / 1000 : 0;
  const calc = b && dt > 0 && dt <= 30 ? hav(b[1], b[2], a[1], a[2]) / dt : null;
  const raw = a[4] ?? calc;
  const anterior = b?.[4];
  let motivo = "";
  if (raw == null || !Number.isFinite(raw) || raw < 0 || raw * 3.6 > LIMITE_GPS) motivo = "Velocidade inválida";
  else if ((a[3] ?? 99) > 50) motivo = "Precisão baixa";
  else if (a[4] == null && ((b?.[3] ?? 99) > 50)) motivo = "Precisão baixa no ponto anterior";
  else if (calc != null && calc * 3.6 > LIMITE_GPS && hav(b[1], b[2], a[1], a[2]) > (a[3] ?? 0) + (b[3] ?? 0)) motivo = "Salto de posição";
  else if (anterior != null && anterior >= 0 && anterior * 3.6 <= LIMITE_GPS && (b[3] ?? 99) <= 50 && dt > 0 && dt <= 5 && Math.abs(raw - anterior) / dt > ACEL_GPS) motivo = "Variação brusca";
  const edit = v.revisoes?.[i];
  return { raw, motivo, valor: edit ? (edit.excluido ? null : edit.vel_ms) : motivo ? null : raw };
}
function recalcularMax() {
  vmax = 0;
  viagem.amostras.forEach((a, i) => { const x = leitura(viagem, i).valor; if (x != null) vmax = Math.max(vmax, x * 3.6); });
}
function abrirRevisao(maxima = false) {
  if (!viagem?.amostras.length) return;
  const ids = viagem.amostras.map((a, i) => i).sort((i, j) => (leitura(viagem, j).raw ?? -1) - (leitura(viagem, i).raw ?? -1));
  $("pontoRev").replaceChildren(...ids.map(i => { const x = leitura(viagem, i), o = document.createElement("option"); o.value = i; o.textContent = new Date(viagem.amostras[i][0]).toLocaleTimeString("pt-BR") + " · " + (x.raw == null ? "sem velocidade" : fmt(x.raw * 3.6) + " km/h") + (viagem.revisoes?.[i] ? " · revisado" : x.motivo ? " · suspeito" : ""); return o; }));
  if (maxima) { const valid = ids.filter(i => leitura(viagem, i).valor != null).sort((i, j) => leitura(viagem, j).valor - leitura(viagem, i).valor); if (valid.length) $("pontoRev").value = valid[0]; }
  mostrarPonto(); if (!$("revisao").open) $("revisao").showModal();
}
function mostrarPonto() {
  const i = Number($("pontoRev").value), x = leitura(viagem, i), a = viagem.amostras[i];
  $("infoRev").textContent = "Precisão: " + (a[3] ?? "—") + " m. " + (x.motivo || "Sem alerta automático.") + (viagem.revisoes?.[i] ? " Revisão manual aplicada." : "");
  $("valorRev").value = x.valor == null ? "" : (x.valor * 3.6).toFixed(1);
}
function aplicarRevisao(tipo) {
  const i = Number($("pontoRev").value); viagem.revisoes ??= {};
  if (tipo === "restaurar") delete viagem.revisoes[i];
  else if (tipo === "excluir") viagem.revisoes[i] = { excluido: true };
  else { const campo = $("valorRev"), n = Number(campo.value); if (!campo.value || !Number.isFinite(n) || n < 0 || n > LIMITE_GPS) { alert("Informe uma velocidade entre 0 e 120 km/h."); return; } viagem.revisoes[i] = { vel_ms: n / 3.6 }; }
  recalcularMax();
  if (watchId !== null) { salvarLocal(); atualizarUI(); } else { if (!guardarPendente(viagem)) { alert("Não foi possível guardar a revisão no aparelho."); salvarLocal(); } mostrarResumo(); }
  abrirRevisao(); $("pontoRev").value = i; mostrarPonto();
}
$("revisarMax").onclick = () => abrirRevisao(true);
$("revisarFim").onclick = () => abrirRevisao();
$("pontoRev").onchange = mostrarPonto;
$("salvarRev").onclick = () => aplicarRevisao("salvar");
$("excluirRev").onclick = () => aplicarRevisao("excluir");
$("restaurarRev").onclick = () => aplicarRevisao("restaurar");
$("fecharRev").onclick = () => $("revisao").close();
function aoPosicao(p) {
  const c = p.coords, t = p.timestamp;
  if (ultimo && t <= ultimo.t) return;                       // ignora repetidos
  const vel_ms = (c.speed !== null && !isNaN(c.speed)) ? c.speed : null;
  viagem.amostras.push([t, +c.latitude.toFixed(6), +c.longitude.toFixed(6), c.accuracy !== null ? +c.accuracy.toFixed(1) : null,
    vel_ms !== null ? +vel_ms.toFixed(2) : null, (c.heading !== null && !isNaN(c.heading)) ? Math.round(c.heading) : null]);
  let v = vel_ms, calc = false;
  if (v === null && ultimo) { const dt = (t - ultimo.t) / 1000; if (dt > 0) { v = hav(ultimo.lat, ultimo.lon, c.latitude, c.longitude) / dt; calc = true; } }
  ultimo = { t, lat: c.latitude, lon: c.longitude, acc: c.accuracy, v, calc };
  const validada = leitura(viagem, viagem.amostras.length - 1); ultimo.v = validada.valor; if (validada.valor !== null) vmax = Math.max(vmax, validada.valor * 3.6);
  $("pontos").textContent = viagem.amostras.length;
  const a = c.accuracy;
  status(a <= 20 ? "GPS bom" : a <= 50 ? "GPS razoável" : "GPS fraco (precisão baixa)", a <= 20 ? "ok" : a <= 50 ? "warn" : "bad");
}
function aoErro(e) {
  if (e.code === 1) status("Permissão de localização negada. Libere nas configurações do navegador.", "bad");
  else if (e.code === 2) status("Posição indisponível. Procure céu aberto/janela.", "warn");
  else status("Sem sinal de GPS há um tempo…", "warn");
}
function atualizarUI() {
  if (!viagem) return;
  $("tempo").textContent = mmss((Date.now() - viagem.inicio_ms) / 1000);
  if (ultimo) {
    const idade = (Date.now() - ultimo.t) / 1000;
    $("vel").textContent = ultimo.v !== null && idade < 5 ? fmt(ultimo.v * 3.6) : "--";
    $("velCalc").textContent = ultimo.calc && idade < 5 ? "calculada pela posição (o aparelho não informou velocidade)" : "";
    $("prec").textContent = ultimo.acc !== null ? fmt(ultimo.acc) + " m" : "--";
    if (idade >= 10) status("Sem atualização de GPS há " + Math.round(idade) + " s", "warn");
  }
  $("vmax").textContent = vmax ? fmt(vmax) + " km/h" : "--";
}
function marcar() {
  if (!viagem) return;
  viagem.marcas.push({
    t_ms: Date.now(), lat: ultimo ? +ultimo.lat.toFixed(6) : null, lon: ultimo ? +ultimo.lon.toFixed(6) : null,
    vel_ms: ultimo && ultimo.v !== null ? +ultimo.v.toFixed(2) : null
  });
  $("marcas").textContent = viagem.marcas.length + " momento(s) marcado(s). Último às " + new Date().toLocaleTimeString("pt-BR");
  if (navigator.vibrate) navigator.vibrate(60);
  salvarLocal();
}
function parar() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null; clearInterval(timerUI); clearInterval(timerSave);
  try { if (wakeLock) wakeLock.release(); } catch (e) { }
  viagem.fim_ms = Date.now();
  finalizar();
}
// Move a viagem encerrada para a lista de pendentes do aparelho.
function finalizar() {
  if (guardarPendente(viagem)) limparLocal();
  else { salvarLocal(); alert("Não há espaço no aparelho para guardar mais viagens. Envie ou baixe o arquivo desta viagem agora."); }
  mostrarResumo();
}

// ---------- resumo ----------
function resumoLocal(v) {
  const A = v.amostras; let dist = 0; const vs = [];
  for (let i = 1; i < A.length; i++) {
    const d = hav(A[i - 1][1], A[i - 1][2], A[i][1], A[i][2]);
    if (d >= 2 && (A[i][3] ?? 99) <= 30 && (A[i - 1][3] ?? 99) <= 30 && (A[i][0] - A[i - 1][0]) > 0 && d * 3600 / (A[i][0] - A[i - 1][0]) <= LIMITE_GPS) dist += d;
  }
  A.forEach((a, i) => { const x = leitura(v, i).valor; if (x !== null) vs.push(x * 3.6); });
  vs.sort((x, y) => x - y);
  const q = p => vs.length ? vs[Math.min(vs.length - 1, Math.floor(vs.length * p))] : null;
  return { dist, dur: ((v.fim_ms || Date.now()) - v.inicio_ms) / 1000, max: vs.length ? vs[vs.length - 1] : null, p95: q(.95), comVel: vs.length };
}
function mostrarResumo() {
  const r = resumoLocal(viagem), A = viagem.amostras;
  const itens = [["Linha", viagem.linha + (viagem.veiculo ? " · " + viagem.veiculo : "")], ["Duração", mmss(r.dur)],
  ["Pontos", A.length], ["Distância", fmt(r.dist / 1000, 1) + " km"], ["Vel. máxima", r.max !== null ? fmt(r.max) + " km/h" : "--"],
  ["Vel. p95", r.p95 !== null ? fmt(r.p95) + " km/h" : "--"], ["Marcas", viagem.marcas.length],
  ["Velocidade do aparelho", r.comVel ? Math.round(100 * r.comVel / A.length) + "% dos pontos" : "não informada"]];
  $("resumo").innerHTML = itens.map(([k, v]) => '<div><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) + '</div></div>').join("");
  $("btnCompartilhar").hidden = !(navigator.canShare && navigator.canShare({ files: [arquivo(viagem)] }));
  $("revisarFim").hidden = false; $("btnEnviar").hidden = false; $("btnEnviar").disabled = false; msg($("msgEnvio"), "");
  tela("fim");
}
function nomeArquivo(v) {
  const d = new Date(v.inicio_ms), z = n => String(n).padStart(2, "0");
  return "viagem_" + d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + "_" + z(d.getHours()) + z(d.getMinutes()) + "_linha" + v.linha + ".json";
}
function arquivo(v) { return new File([JSON.stringify(v)], nomeArquivo(v), { type: "application/json" }); }
function baixar(v) {
  const f = arquivo(v), url = URL.createObjectURL(f), a = document.createElement("a");
  a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
async function compartilhar() { try { await navigator.share({ files: [arquivo(viagem)], title: "Viagem " + viagem.linha }); } catch (e) { } }
async function enviarAtual() {
  $("btnEnviar").disabled = true; msg($("msgEnvio"), "Enviando…");
  try { await enviar(viagem); $("revisarFim").hidden = true; $("btnEnviar").hidden = true; msg($("msgEnvio"), "Viagem enviada. Ela já aparece em Minhas viagens.", "ok"); enviadas = []; }
  catch (e) { $("btnEnviar").disabled = false; msg($("msgEnvio"), traduzErro(e) + " Ela continua guardada neste aparelho.", "bad"); }
}

// ---------- viagem não finalizada / dados de versões antigas ----------
function migrarDadosAntigos() {
  const l = pendentes(); let mudou = false;
  l.forEach(v => { if (!v.id_local) { v.id_local = novoId(); mudou = true; } });
  if (mudou) gravarJSON(CHAVE_PEND, l);
  const a = lerJSON(CHAVE, null);
  if (a && !a.id_local) { a.id_local = novoId(); gravarJSON(CHAVE, a); }
}
function verificarEmAndamento() {
  const pend = watchId === null ? lerJSON(CHAVE, null) : null;
  $("recuperar").hidden = !(pend && pend.amostras && usuario);
  if (!$("recuperar").hidden) $("recInfo").textContent = "linha " + pend.linha + ", " + pend.amostras.length + " pontos, " + dataHora(pend.inicio_ms);
}
$("btnRecuperar").addEventListener("click", () => {
  const pend = lerJSON(CHAVE, null); if (!pend) return;
  viagem = pend;
  if (!viagem.fim_ms) viagem.fim_ms = (viagem.amostras.at(-1) || [viagem.inicio_ms])[0];
  $("recuperar").hidden = true; finalizar();
});
$("btnDescartar").addEventListener("click", () => { if (confirm("Descartar a viagem não finalizada?")) { limparLocal(); $("recuperar").hidden = true; } });

// ---------- minhas viagens ----------
async function abrirLista() {
  tela("lista");
  renderPendentes();
  if (!enviadas.length) await carregarEnviadas(); else renderEnviadas();
}
function renderPendentes() {
  const l = pendentes().sort((a, b) => b.inicio_ms - a.inicio_ms);
  $("boxPend").hidden = !l.length;
  $("listaPend").innerHTML = l.map(v => {
    const r = resumoLocal(v);
    return `<div class="item"><div class="corpo"><div class="t">Linha ${esc(v.linha)}${v.veiculo ? " · " + esc(v.veiculo) : ""}</div>
  <div class="d">${dataHora(v.inicio_ms)} · ${mmss(r.dur)} · ${fmt(r.dist / 1000, 1)} km · ${v.amostras.length} pontos</div>
  ${v.obs ? `<div class="d">${esc(v.obs)}</div>` : ""}
  <div class="acoes"><button class="mini" data-acao="enviar" data-id="${esc(v.id_local)}" type="button">Enviar</button>
  <button class="mini sec" data-acao="revisar" data-id="${esc(v.id_local)}" type="button">Revisar</button><button class="mini sec" data-acao="baixar" data-id="${esc(v.id_local)}" type="button">Baixar .json</button>
  <button class="mini sec" data-acao="descartar" data-id="${esc(v.id_local)}" type="button">Descartar</button></div></div></div>`;
  }).join("");
}
async function enviarPendentes(lista) {
  const el = $("msgPend"); let ok = 0, falha = null;
  document.querySelectorAll("#boxPend button").forEach(b => { b.disabled = true; });
  for (const v of lista) {
    msg(el, `Enviando ${ok + 1} de ${lista.length}…`);
    try { await enviar(v); ok++; } catch (e) { falha = traduzErro(e); break; }
  }
  renderPendentes();
  $("btnEnviarTodas").disabled = false;
  msg(el, falha ? `${ok} enviada(s). Erro: ${falha}` : `${ok} viagem(ns) enviada(s).`, falha ? "bad" : "ok");
  if (ok) await carregarEnviadas();
}
$("listaPend").addEventListener("click", e => {
  const b = e.target.closest("button[data-acao]"); if (!b) return;
  const v = pendentes().find(x => x.id_local === b.dataset.id); if (!v) return;
  if (b.dataset.acao === "enviar") enviarPendentes([v]);
  else if (b.dataset.acao === "revisar") { viagem = v; mostrarResumo(); abrirRevisao(); }
  else if (b.dataset.acao === "baixar") baixar(v);
  else if (b.dataset.acao === "descartar" && confirm("Apagar esta viagem do aparelho? Ela ainda não foi enviada e não poderá ser recuperada.")) { removerPendente(v.id_local); renderPendentes(); }
});
$("btnEnviarTodas").addEventListener("click", () => enviarPendentes(pendentes().sort((a, b) => a.inicio_ms - b.inicio_ms)));

async function carregarEnviadas() {
  $("listaEnv").innerHTML = '<p class="vazio">Carregando…</p>';
  try {
    const { data, error } = await cliente().from("viagens")
      .select("id,linha,nome_linha,veiculo,tipo_onibus,obs,inicio,fim,duracao_s,distancia_m,vel_media_kmh,vel_max_kmh,vel_p95_kmh,n_pontos,marcas")
      .order("inicio", { ascending: false });
    if (error) throw error;
    enviadas = data;
    const ids = new Set(enviadas.map(v => v.id));
    selecionadas = new Set([...selecionadas].filter(id => ids.has(id)));
    const f = $("filtroLinha"), atual = f.value, linhas = [...new Set(enviadas.map(v => v.linha))].sort();
    f.innerHTML = '<option value="">Todas</option>' + linhas.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join("");
    f.value = linhas.includes(atual) ? atual : "";
    await carregarComparacoesUrbs();
    renderEnviadas();
  } catch (e) { $("listaEnv").innerHTML = `<p class="msg bad">${esc(traduzErro(e))}</p>`; }
}
async function carregarComparacoesUrbs() {
  if (!enviadas.length) { comparacoesUrbs = {}; return; }
  const { data, error } = await cliente().from("comparacoes_urbs")
    .select("viagem_id,status,solicitada_em,processada_em,veiculo_urbs,distancia_mediana_m,motivo,resumo,serie_celular,serie_urbs")
    .in("viagem_id", enviadas.map(v => v.id));
  if (error) { console.warn("Comparações URBS indisponíveis:", error.message); return; }
  comparacoesUrbs = Object.fromEntries((data || []).map(c => [c.viagem_id, c]));
}
function rotuloComparacaoUrbs(id) {
  const c = comparacoesUrbs[id];
  if (!c) return "";
  const textos = {
    pendente: "Comparação URBS aguardando a próxima sincronização.", processando: "Comparação URBS em processamento.",
    concluida: "Comparação URBS pronta.", indisponivel: "Comparação URBS indisponível.", erro: "A comparação URBS falhou."
  };
  return `<div class="d">${esc(textos[c.status] || "Comparação URBS: status desconhecido.")}</div>`;
}
function mostrarComparacaoUrbs(id) {
  const c = comparacoesUrbs[id];
  $("cmpUrbs").hidden = !c;
  if (!c) return;
  const resultado = $("resultadoUrbs"), graf = $("graficoUrbsBox");
  if (graficoUrbs) { graficoUrbs.destroy(); graficoUrbs = null; }
  graf.hidden = c.status !== "concluida";
  if (c.status === "pendente" || c.status === "processando") {
    resultado.innerHTML = `<p class="aviso">Sua solicitação está na fila. Ela será processada quando o computador com os dados da URBS executar a sincronização.</p>`;
    return;
  }
  if (c.status !== "concluida") {
    resultado.innerHTML = `<p class="msg bad">${esc(c.motivo || "Não foi possível comparar esta viagem.")}</p>`;
    return;
  }
  const r = c.resumo || {};
  resultado.innerHTML = `<div class="grid"><div><div class="k">Veículo URBS</div><div class="v">${esc(c.veiculo_urbs || "—")}</div></div><div><div class="k">Distância mediana</div><div class="v">${fmt(c.distancia_mediana_m)} m</div></div><div><div class="k">URBS mediana</div><div class="v">${fmt(r.urbs_mediana_kmh, 1)} km/h</div></div><div><div class="k">Celular mediana</div><div class="v">${fmt(r.celular_mediana_kmh, 1)} km/h</div></div></div><p class="aviso">${fmt(r.trechos)} trechos comparáveis · diferença mediana URBS − celular: ${fmt(r.diferenca_mediana_kmh, 1)} km/h · erro absoluto médio: ${fmt(r.erro_absoluto_medio_kmh, 1)} km/h.</p>`;
  graficoUrbs = new Chart($("cUrbs"), {
    type: "line", data: {
      datasets: [
        { label: "GPS do celular", data: (c.serie_celular || []).map(p => ({ x: p[0] / 60, y: p[1] })), borderColor: cor(0), pointRadius: 0, borderWidth: 1.5, tension: .15 },
        { label: "URBS (estimada)", data: (c.serie_urbs || []).map(p => ({ x: p[0] / 60, y: p[1] })), borderColor: cor(1), pointRadius: 2, borderWidth: 2, tension: .1 }
      ]
    }, options: { responsive: true, maintainAspectRatio: false, parsing: false, scales: { x: { type: "linear", title: { display: true, text: "minutos desde o início" } }, y: { beginAtZero: true, title: { display: true, text: "km/h" } } } }
  });
}
function renderEnviadas() {
  const f = $("filtroLinha").value, l = enviadas.filter(v => !f || v.linha === f);
  $("listaEnv").innerHTML = l.length ? l.map(v => {
    const sel = selecionadas.has(v.id), cheio = !sel && selecionadas.size >= MAX_CMP;
    return `<div class="item"><input type="checkbox" data-id="${v.id}" ${sel ? "checked" : ""} ${cheio ? "disabled" : ""} aria-label="Selecionar viagem">
  <div class="corpo"><div class="t">Linha ${esc(v.linha)}${v.veiculo ? " · " + esc(v.veiculo) : ""}</div>
  <div class="d">${dataHora(v.inicio)} · ${mmss(v.duracao_s)} · ${fmt(v.distancia_m / 1000, 1)} km</div>
  <div class="d">média ${fmt(v.vel_media_kmh)} · p95 ${fmt(v.vel_p95_kmh)} · máx. ${fmt(v.vel_max_kmh)} km/h</div>
  ${v.obs ? `<div class="d">${esc(v.obs)}</div>` : ""}${rotuloComparacaoUrbs(v.id)}
  <div class="acoes"><a class="link" href="./navegacao.html?viagem=${encodeURIComponent(v.id)}">Navegar</a><button class="link" data-editar="${v.id}" type="button">Editar</button><button class="link" data-excluir="${v.id}" type="button">Excluir</button></div></div></div>`;
  }).join("") : `<p class="vazio">${enviadas.length ? "Nenhuma viagem nesta linha." : "Você ainda não enviou viagens."}</p>`;
  $("btnComparar").disabled = !selecionadas.size;
  $("btnComparar").textContent = selecionadas.size ? `Comparar (${selecionadas.size})` : "Comparar";
  $("btnCompararUrbs").disabled = selecionadas.size !== 1;
}
$("filtroLinha").addEventListener("change", renderEnviadas);
$("btnAtualizar").addEventListener("click", carregarEnviadas);
$("btnAtualizarUrbs").addEventListener("click", async () => {
  await carregarComparacoesUrbs();
  const id = [...selecionadas][0];
  if (id) mostrarComparacaoUrbs(id);
  renderEnviadas();
});
$("listaEnv").addEventListener("change", e => {
  const c = e.target.closest("input[data-id]"); if (!c) return;
  if (c.checked) selecionadas.add(c.dataset.id); else selecionadas.delete(c.dataset.id);
  renderEnviadas();
});
$("listaEnv").addEventListener("click", async e => {
  const editar = e.target.closest("button[data-editar]");
  if (editar) { abrirEdicao(enviadas.find(v => v.id === editar.dataset.editar)); return; }
  const b = e.target.closest("button[data-excluir]"); if (!b) return;
  const v = enviadas.find(x => x.id === b.dataset.excluir);
  if (!v || !confirm(`Excluir do Supabase a viagem da linha ${v.linha} de ${dataHora(v.inicio)}? Isso não pode ser desfeito.`)) return;
  const { error } = await cliente().from("viagens").delete().eq("id", v.id);
  if (error) { alert(traduzErro(error)); return; }
  enviadas = enviadas.filter(x => x.id !== v.id); selecionadas.delete(v.id); delete series[v.id];
  renderEnviadas();
  if (!$("cmp").hidden) selecionadas.size ? comparar() : ($("cmp").hidden = true);
});
$("btnCompararUrbs").addEventListener("click", async () => {
  if (selecionadas.size !== 1) return;
  const id = [...selecionadas][0];
  $("btnCompararUrbs").disabled = true;
  try {
    const { error } = await cliente().rpc("solicitar_comparacao_urbs", { p_viagem_id: id });
    if (error) throw error;
    await carregarComparacoesUrbs();
    renderEnviadas();
    mostrarComparacaoUrbs(id);
    $("cmpUrbs").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (erro) { alert(traduzErro(erro)); renderEnviadas(); }
});

function abrirEdicao(v) {
  if (!v) return;
  $("editarViagem").dataset.id = v.id;
  $("editarLinha").value = v.linha;
  $("editarVeiculo").value = v.veiculo || "";
  $("editarTipoOnibus").value = v.tipo_onibus || "";
  $("editarObs").value = v.obs || "";
  msg($("msgEditarViagem"), "");
  $("editarViagem").showModal();
  $("editarLinha").focus();
}
$("btnCancelarEdicao").addEventListener("click", () => $("editarViagem").close());
$("formEditarViagem").addEventListener("submit", async e => {
  e.preventDefault();
  const dialogo = $("editarViagem"), id = dialogo.dataset.id;
  const codigo = codigoDaLinha($("editarLinha").value);
  const aviso = $("msgEditarViagem"), salvar = $("btnSalvarEdicao");
  if (!codigo) { msg(aviso, "Informe o código da linha.", "bad"); return; }
  const conhecida = LINHAS.find(([cod]) => cod === codigo);
  const alteracao = {
    linha: codigo, nome_linha: conhecida ? conhecida[1] : null,
    veiculo: $("editarVeiculo").value.trim().toUpperCase() || null, tipo_onibus: $("editarTipoOnibus").value || null, obs: $("editarObs").value.trim() || null
  };
  salvar.disabled = true; msg(aviso, "Salvando…");
  try {
    const { data, error } = await cliente().from("viagens").update(alteracao).eq("id", id)
      .select("id,linha,nome_linha,veiculo,tipo_onibus,obs").single();
    if (error) throw error;
    const indice = enviadas.findIndex(v => v.id === id);
    if (indice >= 0) Object.assign(enviadas[indice], data);
    dialogo.close();
    await carregarEnviadas();
    if (!$("cmp").hidden && selecionadas.size) comparar();
  } catch (erro) { msg(aviso, traduzErro(erro), "bad"); }
  finally { salvar.disabled = false; }
});

// ---------- comparação ----------
async function comparar() {
  const ids = [...selecionadas], faltam = ids.filter(id => !series[id]);
  $("cmp").hidden = false;
  if (faltam.length) {
    $("tCmp").innerHTML = '<tr><td>Carregando pontos…</td></tr>';
    const { data, error } = await cliente().rpc("viagens_series", { p_ids: faltam });
    if (error) { $("tCmp").innerHTML = `<tr><td class="msg bad">${esc(traduzErro(error))}</td></tr>`; return; }
    Object.assign(series, data);
  }
  const vs = ids.map(id => enviadas.find(v => v.id === id)).filter(Boolean).sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  tabelaComparacao(vs); graficoComparacao(vs); mapaComparacao(vs);
  $("cmp").scrollIntoView({ behavior: "smooth", block: "start" });
}
function tabelaComparacao(vs) {
  const linhas = [
    ["Linha", v => esc(v.linha) + (v.veiculo ? " · " + esc(v.veiculo) : "")],
    ["Duração", v => mmss(v.duracao_s)],
    ["Distância", v => fmt(v.distancia_m / 1000, 1) + " km"],
    ["Vel. média", v => fmt(v.vel_media_kmh, 1) + " km/h"],
    ["Vel. p95", v => fmt(v.vel_p95_kmh, 1) + " km/h"],
    ["Vel. máxima", v => fmt(v.vel_max_kmh, 1) + " km/h"],
    ["Tempo parado (< 3 km/h)", v => { const s = tempoParado(series[v.id] || []); return s == null ? "--" : mmss(s); }],
    ["Pontos", v => fmt(v.n_pontos)],
    ["Marcas", v => (v.marcas || []).length],
    ["Observação", v => esc(v.obs || "")],
  ];
  $("tCmp").innerHTML = "<tr><th></th>" + vs.map(v => `<th><span class="sw" style="background:${cor(idxCor(v))}"></span>${dataHora(v.inicio)}</th>`).join("") + "</tr>"
    + linhas.map(([k, f]) => `<tr><td>${k}</td>${vs.map(v => `<td>${f(v)}</td>`).join("")}</tr>`).join("");
}
// Cor estável por viagem enquanto estiver selecionada.
const idxCor = v => [...selecionadas].indexOf(v.id);
function tempoParado(pts) {
  let s = 0, com = 0;
  for (let i = 1; i < pts.length; i++) { const dt = pts[i][0] - pts[i - 1][0]; if (pts[i][1] == null || dt <= 0 || dt > 30) continue; com++; if (pts[i][1] < 3) s += dt; }
  return com ? s : null;
}
// Média da velocidade em faixas de 30 s (eixo tempo) ou 100 m (eixo distância).
function curva(pts) {
  const passo = eixo === "tempo" ? 30 : 100, acc = new Map(); let dist = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[i - 1];
    let v = p[1];
    if (q) {
      const d = hav(q[2], q[3], p[2], p[3]), dt = p[0] - q[0];
      if (d >= 2 && (p[4] ?? 99) <= 30 && (q[4] ?? 99) <= 30) dist += d;
      // Não reconstruir velocidades invalidadas a partir da posição.
    }
    if (v == null || v < 0 || v > LIMITE_GPS) continue;
    const k = Math.floor((eixo === "tempo" ? p[0] : dist) / passo), a = acc.get(k) || [0, 0];
    a[0] += v; a[1]++; acc.set(k, a);
  }
  return [...acc].sort((a, b) => a[0] - b[0]).map(([k, [s, n]]) => ({ x: (k + .5) * passo / (eixo === "tempo" ? 60 : 1000), y: +(s / n).toFixed(1) }));
}
function graficoComparacao(vs) {
  if (typeof Chart === "undefined") return;
  $("dicaEixo").textContent = eixo === "tempo" ? "Média a cada 30 s, em minutos desde o início da gravação." : "Média a cada 100 m, em km percorridos desde o início da gravação. Útil para comparar viagens que começaram no mesmo ponto.";
  const ds = vs.map(v => ({ label: `${v.linha} · ${dataHora(v.inicio)}`, data: curva(series[v.id] || []), borderColor: cor(idxCor(v)), backgroundColor: cor(idxCor(v)), borderWidth: 2, pointRadius: 0, tension: .2, spanGaps: false }));
  const eixoCor = { grid: { color: css("--grid") }, ticks: { color: css("--text-3") }, border: { color: css("--border") } };
  if (grafico) grafico.destroy();
  grafico = new Chart($("cVel"), {
    type: "line", data: { datasets: ds }, options: {
      responsive: true, maintainAspectRatio: false, animation: false, parsing: false, interaction: { mode: "nearest", axis: "x", intersect: false },
      plugins: { legend: { labels: { color: css("--text-2"), boxWidth: 12 } }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${fmt(c.parsed.y)} km/h` } } },
      scales: {
        x: { type: "linear", ...eixoCor, title: { display: true, text: eixo === "tempo" ? "minutos" : "km", color: css("--text-3") } },
        y: { beginAtZero: true, ...eixoCor, title: { display: true, text: "km/h", color: css("--text-3") } }
      }
    }
  });
}
function mapaComparacao(vs) {
  if (typeof L === "undefined") return;
  if (!mapa) {
    mapa = L.map("mapa", { preferCanvas: true }).setView([-25.45, -49.27], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(mapa);
    camadaMapa = L.layerGroup().addTo(mapa);
  }
  setTimeout(() => mapa.invalidateSize(), 50);
  camadaMapa.clearLayers();
  const todos = [];
  vs.forEach(v => {
    const pts = (series[v.id] || []).filter(p => (p[4] ?? 99) <= 50).map(p => [p[2], p[3]]);
    if (!pts.length) return;
    L.polyline(pts, { color: cor(idxCor(v)), weight: 4, opacity: .85 }).bindPopup(`Linha ${esc(v.linha)} · ${dataHora(v.inicio)}`).addTo(camadaMapa);
    (v.marcas || []).forEach(m => { if (m.lat != null) L.circleMarker([m.lat, m.lon], { radius: 5, color: cor(idxCor(v)), fillOpacity: 1 }).bindPopup("Momento marcado").addTo(camadaMapa); });
    todos.push(...pts);
  });
  if (todos.length) mapa.fitBounds(todos, { padding: [20, 20] });
}
document.querySelectorAll("#eixo button").forEach(b => b.addEventListener("click", () => {
  eixo = b.dataset.eixo;
  document.querySelectorAll("#eixo button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
  const vs = [...selecionadas].map(id => enviadas.find(v => v.id === id)).filter(Boolean).sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
  graficoComparacao(vs);
}));
$("btnComparar").addEventListener("click", comparar);

// ---------- eventos ----------
$("btnIniciar").addEventListener("click", iniciar);
$("btnMarcar").addEventListener("click", marcar);
$("btnParar").addEventListener("click", () => { if (confirm("Encerrar a viagem?")) parar(); });
$("btnEnviar").addEventListener("click", enviarAtual);
$("btnBaixar").addEventListener("click", () => baixar(viagem));
$("btnCompartilhar").addEventListener("click", compartilhar);
$("btnNova").addEventListener("click", () => { viagem = null; tela("prep"); });
document.querySelectorAll("#abas button").forEach(b => b.addEventListener("click", () => b.dataset.aba === "lista" ? abrirLista() : tela("prep")));
iniciarApp().catch(e => { tela("login"); msg($("msgLogin"), traduzErro(e), "bad"); });
