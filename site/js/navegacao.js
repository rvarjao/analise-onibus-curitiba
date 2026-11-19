const $ = (id) => document.getElementById(id),
    fmt = (n) =>
        Number(n || 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 }),
    mm = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const JANELA_GRAFICO = 600,
    LACUNA_GRAFICO = 90;
let sb,
    map,
    rota,
    marcador,
    pts = [],
    viagem,
    chart,
    timer = null,
    atual = 0,
    ultimoFrame = null,
    ultimoGrafico = 0,
    velocidadeMax = 10,
    seguir = true,
    inicioHorario = 0,
    formatadorHorario,
    seriesGrafico = [];
function cliente() {
    const c = window.APP_CONFIG;
    if (!c?.supabaseUrl)
        throw Error("Configuração do Supabase não encontrada.");
    return (sb ??= window.supabase.createClient(
        c.supabaseUrl,
        c.supabasePublishableKey,
        { auth: { persistSession: true, storageKey: "viagem-auth" } },
    ));
}

function erro(t) {
    $("erro").textContent = t;
    $("erro").hidden = false;
}

function icone(tipo) {
    return L.divIcon({
        className: "bus",
        html:
            tipo === "biarticulado"
                ? "🚌🚌"
                : tipo === "articulado"
                  ? "🚌"
                  : "🚌",
        iconSize: [45, 35],
        iconAnchor: [22, 18],
    });
}

function ponto(s) {
    if (s <= pts[0][0]) return pts[0];
    if (s >= pts.at(-1)[0]) return pts.at(-1);
    let lo = 0,
        hi = pts.length - 1;
    while (hi - lo > 1) {
        const i = (lo + hi) >> 1;
        if (pts[i][0] < s) lo = i;
        else hi = i;
    }
    const a = pts[lo],
        b = pts[hi],
        f = (s - a[0]) / (b[0] - a[0] || 1);
    return [
        s,
        a[1] + (b[1] - a[1]) * f,
        a[2] + (b[2] - a[2]) * f,
        a[3] + (b[3] - a[3]) * f,
    ];
}

function prepararSerie(pontos) {
    const serie = [];
    let anterior = null;
    for (const p of pontos) {
        const t = Number(p[0]),
            y = Number(p[1]);
        if (!Number.isFinite(t) || !Number.isFinite(y)) continue;
        if (anterior !== null && t - anterior > LACUNA_GRAFICO)
            serie.push({ t: anterior + 0.001, y: null });
        serie.push({ t, y });
        anterior = t;
    }
    return serie;
}

function trechoSerie(serie) {
    const inicio = atual - JANELA_GRAFICO;
    let lo = 0,
        hi = serie.length;
    while (lo < hi) {
        const i = (lo + hi) >> 1;
        if (serie[i].t < inicio) lo = i + 1;
        else hi = i;
    }
    const primeiro = Math.max(0, lo - 1);
    hi = serie.length;
    let fim = lo;
    while (fim < hi) {
        const i = (fim + hi) >> 1;
        if (serie[i].t <= atual) fim = i + 1;
        else hi = i;
    }
    return serie
        .slice(primeiro, fim)
        .map((p) => ({ x: (p.t - atual) / 60, y: p.y }));
}

function atualizarGrafico() {
    seriesGrafico.forEach(
        (serie, i) => (chart.data.datasets[i].data = trechoSerie(serie)),
    );
    chart.data.datasets.at(-1).data = [
        { x: 0, y: 0 },
        { x: 0, y: velocidadeMax },
    ];
    chart.update("none");
}

function desenhar(frame) {
    const p = ponto(atual);
    if (!p) return;
    $("vel").textContent = fmt(p[1]);
    $("tempo").textContent = mm(atual);
    $("horario").textContent = formatadorHorario.format(
        new Date((inicioHorario + atual) * 1000),
    );
    $("posicao").value = atual;
    marcador.setLatLng([p[2], p[3]]);
    if (seguir) {
        const tamanho = map.getSize(),
            margem = [tamanho.x * 0.33, tamanho.y * 0.33];
        map.panInside(marcador.getLatLng(), {
            paddingTopLeft: margem,
            paddingBottomRight: margem,
            animate: false,
        });
    }
    if (
        frame === undefined ||
        frame - ultimoGrafico >= 100 ||
        atual >= Number($("posicao").max)
    ) {
        atualizarGrafico();
        ultimoGrafico = frame || 0;
    }
}

function acompanhar(ativo) {
    seguir = ativo;
    $("centralizar").setAttribute("aria-pressed", String(ativo));
    $("centralizar").textContent = ativo ? "◎ Acompanhando" : "◎ Centralizar";
    $("centralizar").title = ativo
        ? "Acompanhamento automático ligado"
        : "Centralizar o ônibus e retomar o acompanhamento";
}

function configurarMapa() {
    acompanhar(true);
    map.on("dragstart zoomstart", () => acompanhar(false));
    map.getContainer().addEventListener("keydown", (e) => {
        if (
            [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "+",
                "-",
            ].includes(e.key)
        )
            acompanhar(false);
    });
}

function parar() {
    if (timer !== null) cancelAnimationFrame(timer);
    timer = null;
    ultimoFrame = null;
    $("play").textContent = "▶ Reproduzir";
}

function quadro(frame) {
    if (ultimoFrame !== null)
        atual = Math.min(
            Number($("posicao").max),
            atual +
                Math.min((frame - ultimoFrame) / 1000, 0.1) *
                    Number($("ritmo").value),
        );
    ultimoFrame = frame;
    desenhar(frame);
    if (atual >= Number($("posicao").max)) {
        parar();
        return;
    }
    timer = requestAnimationFrame(quadro);
}

function tocar() {
    if (timer !== null) return;
    if (atual >= Number($("posicao").max)) {
        atual = 0;
        desenhar();
    }
    ultimoFrame = null;
    timer = requestAnimationFrame(quadro);
    $("play").textContent = "❚❚ Pausar";
}

async function abrir(id) {
    parar();
    const { data: v, error: e } = await cliente()
        .from("viagens")
        .select("id,linha,veiculo,tipo_onibus,inicio")
        .eq("id", id)
        .single();
    if (e) throw e;
    viagem = v;
    inicioHorario = new Date(v.inicio).getTime() / 1000;
    formatadorHorario = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    });
    const { data: s, error } = await cliente().rpc("viagens_series", {
        p_ids: [id],
    });
    if (error) throw error;
    pts = s[id] || [];
    velocidadeMax = pts.reduce((m, p) => Math.max(m, Number(p[1]) || 0), 10);
    if (pts.length < 2) throw Error("A viagem não possui pontos suficientes.");
    $("titulo").textContent =
        `Linha ${v.linha} · ${new Date(v.inicio).toLocaleString("pt-BR")}`;
    $("codigo").textContent = v.veiculo || "—";
    $("tipo").textContent =
        {
            comum: "Comum",
            articulado: "Articulado",
            biarticulado: "Biarticulado",
        }[v.tipo_onibus] || "Não identificado";
    $("app").hidden = false;
    $("graficoCard").hidden = false;
    atual = 0;
    $("posicao").max = pts.at(-1)[0];
    if (map) map.remove();
    map = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
    }).addTo(map);
    rota = L.polyline(
        pts.map((p) => [p[2], p[3]]),
        { color: "#2a78d6", weight: 5 },
    ).addTo(map);
    map.fitBounds(rota.getBounds(), { padding: [24, 24] });
    marcador = L.marker([pts[0][2], pts[0][3]], {
        icon: icone(v.tipo_onibus),
    }).addTo(map);
    configurarMapa();
    const { data: c } = await cliente()
        .from("comparacoes_urbs")
        .select("status,serie_urbs")
        .eq("viagem_id", id)
        .maybeSingle();
    seriesGrafico = [
        prepararSerie(pts),
        prepararSerie(c?.status === "concluida" ? c.serie_urbs || [] : []),
    ];
    if (chart) chart.destroy();
    chart = new Chart($("grafico"), {
        type: "line",
        data: {
            datasets: [
                {
                    label: "GPS do celular",
                    data: [],
                    borderColor: "#2a78d6",
                    pointRadius: 0,
                    borderWidth: 1.5,
                    tension: 0.15,
                },
                {
                    label: "URBS (estimada)",
                    data: [],
                    borderColor: "#eb6834",
                    pointRadius: 0,
                    borderWidth: 2,
                },
                {
                    label: "Agora",
                    data: [],
                    borderColor: "#111",
                    borderDash: [4, 4],
                    pointRadius: 0,
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
            scales: {
                x: {
                    type: "linear",
                    min: -10,
                    max: 0,
                    title: { display: true, text: "minutos atrás" },
                    ticks: {
                        callback: (value) =>
                            value === 0 ? "agora" : Math.abs(value) + " min",
                    },
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "km/h" },
                },
            },
        },
    });
    desenhar();
}

async function abrirUrbs(q) {
    const { data, error } = await cliente().rpc("navegacao_urbs", {
        p_dia: q.get("urbs_dia"),
        p_linha: q.get("urbs_linha"),
        p_veiculo: q.get("urbs_veiculo"),
    });
    if (error) throw error;
    if (data.length < 2)
        throw Error(
            "O trajeto ainda não foi publicado. Rode a sincronização novamente.",
        );
    const hav = (a, b, c, d) => {
        const p = Math.PI / 180,
            x =
                Math.sin(((c - a) * p) / 2) ** 2 +
                Math.cos(a * p) *
                    Math.cos(c * p) *
                    Math.sin(((d - b) * p) / 2) ** 2;
        return 2 * 6371000 * Math.asin(Math.sqrt(x));
    };
    inicioHorario = Number(data[0][0]);
    formatadorHorario = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "UTC",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    });
    pts = data.map((p, i) => {
        const ant = data[i - 1],
            dt = ant ? p[0] - ant[0] : 1,
            v =
                ant && dt > 0
                    ? (hav(ant[1], ant[2], p[1], p[2]) / dt) * 3.6
                    : 0;
        return [p[0] - data[0][0], v, Number(p[1]), Number(p[2])];
    });
    velocidadeMax = pts.reduce((m, p) => Math.max(m, p[1]), 10);
    $("viagens").hidden = true;
    $("titulo").textContent =
        `Linha ${q.get("urbs_linha")} · veículo ${q.get("urbs_veiculo")} · URBS`;
    $("codigo").textContent = q.get("urbs_veiculo");
    $("tipo").textContent = "Não identificado";
    $("app").hidden = false;
    $("graficoCard").hidden = false;
    atual = 0;
    $("posicao").max = pts.at(-1)[0];
    map = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
    }).addTo(map);
    rota = L.polyline(
        pts.map((p) => [p[2], p[3]]),
        { color: "#eb6834", weight: 5 },
    ).addTo(map);
    map.fitBounds(rota.getBounds(), { padding: [24, 24] });
    marcador = L.marker([pts[0][2], pts[0][3]], { icon: icone() }).addTo(map);
    configurarMapa();
    seriesGrafico = [prepararSerie(pts)];
    chart = new Chart($("grafico"), {
        type: "line",
        data: {
            datasets: [
                {
                    label: "URBS (estimada)",
                    data: [],
                    borderColor: "#eb6834",
                    pointRadius: 0,
                    borderWidth: 2,
                },
                {
                    label: "Agora",
                    data: [],
                    borderColor: "#111",
                    borderDash: [4, 4],
                    pointRadius: 0,
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            parsing: false,
            scales: {
                x: {
                    type: "linear",
                    min: -10,
                    max: 0,
                    title: { display: true, text: "minutos atrás" },
                    ticks: {
                        callback: (value) =>
                            value === 0 ? "agora" : Math.abs(value) + " min",
                    },
                },
                y: { beginAtZero: true },
            },
        },
    });
    desenhar();
}

async function iniciar() {
    try {
        const q = new URLSearchParams(location.search);
        if (q.get("urbs_dia")) return await abrirUrbs(q);
        const {
            data: { session },
        } = await cliente().auth.getSession();
        if (!session)
            throw Error(
                "Entre em Registrar viagem para acessar suas rotas privadas.",
            );
        const { data, error } = await cliente()
            .from("viagens")
            .select("id,linha,inicio")
            .order("inicio", { ascending: false });
        if (error) throw error;
        if (!data.length)
            throw Error("Você ainda não possui viagens enviadas.");
        $("viagens").innerHTML = data
            .map(
                (v) =>
                    `<option value="${v.id}">Linha ${v.linha} · ${new Date(v.inicio).toLocaleString("pt-BR")}</option>`,
            )
            .join("");
        const id = q.get("viagem");
        $("viagens").value = data.some((v) => v.id === id) ? id : data[0].id;
        await abrir($("viagens").value);
    } catch (e) {
        erro(e.message || String(e));
    }
}
$("centralizar").addEventListener("click", () => {
    if (!map || !marcador) return;
    acompanhar(true);
    map.panTo(marcador.getLatLng(), { animate: false });
});
$("viagens").addEventListener("change", () =>
    abrir($("viagens").value).catch((e) => erro(e.message)),
);
$("play").addEventListener("click", () => (timer ? parar() : tocar()));
$("posicao").addEventListener("input", (e) => {
    atual = Number(e.target.value);
    ultimoFrame = null;
    desenhar();
});
iniciar();
