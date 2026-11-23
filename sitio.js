(function(){
  var C = window.CONTENIDO || {};
  var $ = function(id){ return document.getElementById(id); };
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }

  // Las cuatro esquinas
  document.title = C.nombre || "";
  $("nombre").textContent = C.nombre || "";
  $("menu").textContent = C.textoMenu || "INFO";
  if (C.instagram) $("insta").href = C.instagram; else $("insta").style.display = "none";
  if (C.email) { $("mail").href = "mailto:" + C.email; $("mail").textContent = C.email; } else $("mail").style.display = "none";

  // Página de info (con selector ES/EN; cada vez que se entra empieza en español)
  var info = $("info"), selInfo = $("langInfo");
  function pintarInfo(l){
    var en = l === "en" && Array.isArray(window.INFO_EN);
    var datos = en ? window.INFO_EN : (C.info || []);
    info.innerHTML = '<h1>' + esc(C.nombre || "") + '</h1>' + datos.map(function(bloque){
      return bloque.map(function(l){
        return "<p>" + esc(l).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(_,t,u){
          return '<a href="'+u+'"'+(/^http/.test(u)?' target="_blank" rel="noopener"':'')+'>'+t+'</a>'; }) + "</p>";
      }).join("");
    }).join("<hr>") + "<hr>";
    info.lang = en ? "en" : "es";
    selInfo.hidden = !Array.isArray(window.INFO_EN);
    [].forEach.call(selInfo.querySelectorAll("button"), function(b){ b.classList.toggle("on", b.getAttribute("data-l") === (en ? "en" : "es")); });
  }
  selInfo.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (b) pintarInfo(b.getAttribute("data-l"));
  });
  pintarInfo("es");

  // Portada
  var indice = null;
  var fotos = (C.fotos || []).filter(function(f){ return f && f.archivo; });
  var pase = $("pase"), marco = $("marco"), img = $("foto"), pie = $("pie"), i = 0;
  function enInfo(){ return location.hash === "#info"; }
  function vista(){
    var v = enInfo();
    info.hidden = !v; pase.hidden = v;
    if (v) pintarInfo("es"); else selInfo.hidden = true;
    $("btnIndice").hidden = v || !fotos.length;
    if (v && indiceAbierto()) cerrarIndice();
    document.body.classList.toggle("portada", !v);
    window.scrollTo(0,0);
  }
  window.addEventListener("hashchange", function(){ vista(); programar(); }); vista();
  if (!fotos.length) return;

  function ruta(f){ return /^(https?:)?\//.test(f.archivo) ? f.archivo : "fotos/" + encodeURIComponent(f.archivo); }
  function cerrar(){ marco.classList.remove("abierto"); }

  // Selector ES/EN del pie de foto: cada foto nueva empieza siempre en español
  var EN = window.PIES_EN || {}, selector = $("lang");
  function idioma(l, f){
    f = f || fotos[i];
    var en = l === "en" && EN[f.archivo];
    pie.textContent = (en ? EN[f.archivo] : f.pie) || "";
    pie.lang = en ? "en" : "es";
    selector.hidden = !EN[f.archivo];
    [].forEach.call(selector.querySelectorAll("button"), function(b){ b.classList.toggle("on", b.getAttribute("data-l") === (en ? "en" : "es")); });
  }
  selector.addEventListener("click", function(e){
    var b = e.target.closest("button"); if (!b) return;
    idioma(b.getAttribute("data-l")); programar();
  });

  // Pase automático: avanza sola cada X segundos (se ajusta en el panel; 0 lo desactiva). Cualquier toque reinicia la cuenta.
  // Se detiene mientras el pie de foto está abierto o se está viendo la página de info.
  var SEGUNDOS = (typeof C.segundos === "number" && C.segundos >= 0) ? C.segundos : 5, reloj = null;
  function programar(){
    clearTimeout(reloj);
    if (fotos.length < 2 || !SEGUNDOS) return;
    reloj = setTimeout(function(){
      if (enInfo() || document.hidden || indiceAbierto() || marco.classList.contains("abierto")) programar(); else sig();
    }, SEGUNDOS * 1000);
  }
  function ver(n){
    i = (n + fotos.length) % fotos.length;
    var f = fotos[i];
    cerrar();
    idioma("es", f);
    img.alt = f.pie || "";
    img.src = ruta(f);
    [1,2].forEach(function(k){ new Image().src = ruta(fotos[(i+k) % fotos.length]); });
    programar();
  }
  function sig(){ ver(i+1); } function ant(){ ver(i-1); }
  // Si una foto no se puede cargar (por ejemplo, ya eliminada), salta a la siguiente
  var saltos = 0;
  img.addEventListener("load", function(){ saltos = 0; colocarDado(); });
  // Móvil vertical: el dado queda a media altura entre el borde inferior de la foto y la línea de Instagram y el correo
  function colocarDado(){
    var b = $("btnIndice");
    if (window.innerWidth > 600 || window.innerHeight <= 500) { b.style.bottom = ""; return; }
    var r = marco.getBoundingClientRect(); if (!r.height) return;
    var centro = Math.min((r.bottom + window.innerHeight - 40) / 2, window.innerHeight - 56);
    b.style.bottom = Math.round(window.innerHeight - centro - 14) + "px";
  }
  window.addEventListener("resize", colocarDado);
  img.addEventListener("error", function(){ if (++saltos < fotos.length) sig(); });

  // Deslizar con el dedo o el ratón
  var x0 = null, arrastrado = false;
  document.addEventListener("pointerdown", function(e){ x0 = e.clientX; arrastrado = false; });
  document.addEventListener("pointerup", function(e){
    if (x0 === null || enInfo() || indiceAbierto()) { x0 = null; return; }
    var d = e.clientX - x0; x0 = null;
    if (Math.abs(d) > 40) { arrastrado = true; d < 0 ? sig() : ant(); }
  });

  // Clic sobre la foto: muestra/oculta el pie. Clic fuera: anterior (izquierda) o siguiente (derecha).
  document.addEventListener("click", function(e){
    if (enInfo() || e.target.closest("a, #btnIndice, #indice, #lang")) return;
    if (arrastrado) { arrastrado = false; return; }
    if (e.target.closest("#marco")) {
      if (fotos[i].pie) { marco.classList.toggle("abierto"); programar(); }
      else e.clientX < window.innerWidth / 2 ? ant() : sig();   // sin pie: mitad izquierda = anterior, mitad derecha = siguiente
      return;
    }
    e.clientX < window.innerWidth / 2 ? ant() : sig();
  });
  document.addEventListener("keydown", function(e){
    if (enInfo()) return;
    if (e.key === "Escape") { if (indiceAbierto()) cerrarIndice(); else { cerrar(); programar(); } return; }
    if (indiceAbierto()) { if (e.key === "ArrowRight") mostrarPagina(pagina + 1); if (e.key === "ArrowLeft") mostrarPagina(pagina - 1); return; }
    if (e.key === "ArrowRight") sig();
    if (e.key === "ArrowLeft") ant();
  });

  // Collage con todas las fotos (botón del dado), de 20 en 20. Tocar una foto va directamente a ella; tocar fuera vuelve a la foto actual.
  // En móvil el collage lleva menos fotos por página (miniaturas horizontales, cuantas quepan)
  var MOVIL = "(max-width:600px),(max-height:500px)";
  function esMovil(){ return window.matchMedia(MOVIL).matches; }
  var PAG = 20, pagina = 0;
  indice = $("indice"); var rejilla = $("rejilla"), panel = $("panel");
  function indiceAbierto(){ return !!indice && !indice.hidden; }
  function miniatura(f){ return /^(https?:)?\//.test(f.archivo) ? f.archivo : "fotos/min/" + encodeURIComponent(f.archivo); }
  // El panel ocupa exactamente el marco de la foto; la rejilla elige las columnas y filas que dan miniaturas más grandes
  var FORMAS_PC = [[5,4],[4,5],[6,4],[7,3],[3,7],[10,2],[2,10]], GAP = 5;
  // Zona que ocupa el collage. En móvil: todo el espacio que puede ocupar una foto; en el resto, el marco de la foto actual
  function rectPanel(){
    return esMovil()
      ? { left: (window.innerWidth - window.innerWidth * .95) / 2, top: 56, width: window.innerWidth * .95, height: window.innerHeight - 112 }
      : marco.getBoundingClientRect();
  }
  // Móvil: miniaturas horizontales (3:2), las más grandes posibles con al menos 2 filas; cuantas filas quepan
  function formaMovil(){
    var r = rectPanel(), px = 30;
    var W = r.width - 2 * px, H = r.height - 28 - 10 - (window.innerWidth <= 600 ? 36 : 0), mejor = null;
    for (var c = 2; c <= 8; c++) {
      var w = Math.floor((W - (c - 1) * GAP) / c), h = Math.floor(w * 2 / 3), filas = Math.floor((H + GAP) / (h + GAP));
      if (filas >= 2 && w >= 40) { mejor = { c: c, w: w, h: h, filas: filas }; break; }
    }
    return mejor || { c: 2, w: 100, h: 66, filas: 2 };
  }
  function ajustar(){
    var r = rectPanel();
    panel.style.left = r.left + "px"; panel.style.top = r.top + "px"; panel.style.width = r.width + "px"; panel.style.height = r.height + "px";
    if (esMovil()) {
      var m = formaMovil();
      rejilla.style.gridTemplateColumns = "repeat(" + m.c + "," + m.w + "px)";
      rejilla.style.gridAutoRows = m.h + "px";
      rejilla.style.marginTop = "14px";
      return;
    }
    var px = r.width < 500 ? 30 : 48, W = r.width - 2 * px, H = r.height - 28 - 10, mejor = null;
    FORMAS_PC.forEach(function(f){
      var t = Math.floor(Math.min((W - (f[0] - 1) * GAP) / f[0], (H - (f[1] - 1) * GAP) / f[1]));
      if (!mejor || t > mejor.t) mejor = { c: f[0], t: t };
    });
    var t = Math.max(24, mejor.t);
    rejilla.style.gridTemplateColumns = "repeat(" + mejor.c + "," + t + "px)";
    rejilla.style.gridAutoRows = t + "px";
    rejilla.style.marginTop = "14px";
  }
  function fotosPorPagina(){ if (!esMovil()) return 20; var m = formaMovil(); return m.c * m.filas; }
  window.addEventListener("resize", function(){
    if (!indiceAbierto()) return;
    var antes = PAG; PAG = fotosPorPagina();
    if (PAG !== antes) { vaciar(); mostrarPagina(Math.floor(pagina * antes / PAG)); }
    ajustar();
  });
  function totalPaginas(){ return Math.ceil(fotos.length / PAG); }
  // Cada página se construye una sola vez y se conserva (oculta), junto con las vecinas ya cargadas: pasar de página es instantáneo
  var paginas = {};
  function vaciar(){ rejilla.innerHTML = ""; paginas = {}; }
  function crearPagina(p){
    if (p < 0 || p >= totalPaginas()) return null;
    if (paginas[p]) return paginas[p];
    var el = document.createElement("div"); el.className = "pagina"; el.hidden = true;
    var desde = p * PAG, hasta = Math.min(fotos.length, desde + PAG);
    for (var n = desde; n < hasta; n++) (function(n){
      var f = fotos[n];
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Foto " + (n + 1)); b._n = n;
      var im = document.createElement("img"); im.alt = ""; im.decoding = "async";
      im.onerror = function(){   // si no hay miniatura usa la grande; si tampoco existe la foto, no se muestra el hueco
        im.onerror = function(){ b.remove(); };
        im.src = ruta(f);
      };
      im.src = miniatura(f);
      b.appendChild(im);
      b.addEventListener("click", function(){ if (deslizado) { deslizado = false; return; } cerrarIndice(true); ver(n); });
      el.appendChild(b);
    })(n);
    rejilla.appendChild(el);
    return (paginas[p] = el);
  }
  function mostrarPagina(p){
    pagina = Math.max(0, Math.min(totalPaginas() - 1, p));
    var pg = crearPagina(pagina);
    for (var k in paginas) paginas[k].hidden = (+k !== pagina);
    [].forEach.call(pg.children, function(b){ b.classList.toggle("actual", b._n === i); });
    $("pagAnt").hidden = pagina === 0; $("pagSig").hidden = pagina >= totalPaginas() - 1;
    $("pagNum").textContent = totalPaginas() > 1 ? (pagina + 1) + " / " + totalPaginas() : "";
    // Prepara las páginas vecinas mientras el navegador está libre
    var yo = pagina;
    setTimeout(function(){ if (yo !== pagina) return; crearPagina(yo + 1); setTimeout(function(){ if (yo === pagina) crearPagina(yo - 1); }, 150); }, 80);
  }
  function abrirIndice(){
    var nuevoPAG = fotosPorPagina();
    if (nuevoPAG !== PAG) { PAG = nuevoPAG; vaciar(); }
    cerrar();
    mostrarPagina(Math.floor(i / PAG));
    indice.hidden = false; document.body.classList.add("indice-abierto");
    ajustar();
  }
  function cerrarIndice(sinProgramar){
    indice.hidden = true; document.body.classList.remove("indice-abierto");
    if (sinProgramar !== true) programar();
  }
  $("btnIndice").addEventListener("click", function(){ indiceAbierto() ? cerrarIndice() : abrirIndice(); });
  $("pagAnt").addEventListener("click", function(){ mostrarPagina(pagina - 1); });
  $("pagSig").addEventListener("click", function(){ mostrarPagina(pagina + 1); });
  indice.addEventListener("click", function(e){
    if (deslizado) { deslizado = false; return; }
    if (e.target === indice || e.target === panel || e.target === rejilla) cerrarIndice();
  });
  // Deslizar el dedo dentro del collage también cambia de página
  var deslizado = false, xi = null;
  indice.addEventListener("pointerdown", function(e){ xi = e.clientX; deslizado = false; });
  indice.addEventListener("pointerup", function(e){
    if (xi === null) return;
    var d = e.clientX - xi; xi = null;
    if (Math.abs(d) > 50) { deslizado = true; mostrarPagina(pagina + (d < 0 ? 1 : -1)); }
  });
  $("btnIndice").hidden = enInfo();

  // Tocar el nombre (arriba a la izquierda): desde la info vuelve a la foto donde estabas; en cualquier otro caso vuelve a la primera foto
  $("nombre").addEventListener("click", function(e){
    e.preventDefault();
    if (enInfo()) { location.hash = "#inicio"; return; }
    if (indiceAbierto()) cerrarIndice(true);
    vista();
    ver(0);
  });

  ver(0);
})();
