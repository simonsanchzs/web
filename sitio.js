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

  // Página de info
  var info = $("info");
  info.innerHTML = '<h1>' + esc(C.nombre || "") + '</h1>' + (C.info || []).map(function(bloque){
    return bloque.map(function(l){
      return "<p>" + esc(l).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(_,t,u){
        return '<a href="'+u+'"'+(/^http/.test(u)?' target="_blank" rel="noopener"':'')+'>'+t+'</a>'; }) + "</p>";
    }).join("");
  }).join("<hr>") + "<hr>";

  // Portada
  var indice = null;
  var fotos = (C.fotos || []).filter(function(f){ return f && f.archivo; });
  var pase = $("pase"), marco = $("marco"), img = $("foto"), pie = $("pie"), i = 0;
  function enInfo(){ return location.hash === "#info"; }
  function vista(){
    var v = enInfo();
    info.hidden = !v; pase.hidden = v;
    $("btnIndice").hidden = v || !fotos.length;
    if (v && indiceAbierto()) cerrarIndice();
    document.body.classList.toggle("portada", !v);
    window.scrollTo(0,0);
  }
  window.addEventListener("hashchange", function(){ vista(); programar(); }); vista();
  if (!fotos.length) return;

  function ruta(f){ return /^(https?:)?\//.test(f.archivo) ? f.archivo : "fotos/" + encodeURIComponent(f.archivo); }
  function cerrar(){ marco.classList.remove("abierto"); }

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
    pie.textContent = f.pie || "";
    img.alt = f.pie || "";
    img.src = ruta(f);
    [1,2].forEach(function(k){ new Image().src = ruta(fotos[(i+k) % fotos.length]); });
    programar();
  }
  function sig(){ ver(i+1); } function ant(){ ver(i-1); }
  // Si una foto no se puede cargar (por ejemplo, ya eliminada), salta a la siguiente
  var saltos = 0;
  img.addEventListener("load", function(){ saltos = 0; });
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
    if (enInfo() || e.target.closest("a, #btnIndice, #indice")) return;
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
  var PAG = 20, pagina = 0;
  indice = $("indice"); var rejilla = $("rejilla"), panel = $("panel");
  function indiceAbierto(){ return !!indice && !indice.hidden; }
  function miniatura(f){ return /^(https?:)?\//.test(f.archivo) ? f.archivo : "fotos/min/" + encodeURIComponent(f.archivo); }
  // El panel ocupa exactamente el marco de la foto; la rejilla elige las columnas y filas que dan miniaturas más grandes
  var FORMAS = [[5,4],[4,5],[6,4],[7,3],[3,7],[10,2],[2,10]], GAP = 5;
  function ajustar(){
    var r = marco.getBoundingClientRect();
    panel.style.left = r.left + "px"; panel.style.top = r.top + "px"; panel.style.width = r.width + "px"; panel.style.height = r.height + "px";
    var px = r.width < 500 ? 30 : 48, W = r.width - 2 * px, H = r.height - 28 - 10, mejor = null;
    FORMAS.forEach(function(f){
      var t = Math.floor(Math.min((W - (f[0] - 1) * GAP) / f[0], (H - (f[1] - 1) * GAP) / f[1]));
      if (!mejor || t > mejor.t) mejor = { c: f[0], t: t };
    });
    var t = Math.max(24, mejor.t);
    rejilla.style.gridTemplateColumns = "repeat(" + mejor.c + "," + t + "px)";
    rejilla.style.gridAutoRows = t + "px";
    rejilla.style.marginTop = "14px";
  }
  window.addEventListener("resize", function(){ if (indiceAbierto()) ajustar(); });
  function totalPaginas(){ return Math.ceil(fotos.length / PAG); }
  function mostrarPagina(p){
    pagina = Math.max(0, Math.min(totalPaginas() - 1, p));
    rejilla.innerHTML = "";
    var desde = pagina * PAG, hasta = Math.min(fotos.length, desde + PAG);
    for (var n = desde; n < hasta; n++) (function(n){
      var f = fotos[n];
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Foto " + (n + 1));
      if (n === i) b.className = "actual";
      var im = document.createElement("img"); im.alt = ""; im.decoding = "async";
      im.onerror = function(){   // si no hay miniatura usa la grande; si tampoco existe la foto, no se muestra el hueco
        im.onerror = function(){ b.remove(); };
        im.src = ruta(f);
      };
      im.src = miniatura(f);
      b.appendChild(im);
      b.addEventListener("click", function(){ if (deslizado) { deslizado = false; return; } cerrarIndice(true); ver(n); });
      rejilla.appendChild(b);
    })(n);
    $("pagAnt").hidden = pagina === 0; $("pagSig").hidden = pagina >= totalPaginas() - 1;
    $("pagNum").textContent = totalPaginas() > 1 ? (pagina + 1) + " / " + totalPaginas() : "";
    // Precarga las miniaturas de la página siguiente
    for (var m = hasta; m < Math.min(fotos.length, hasta + PAG); m++) new Image().src = miniatura(fotos[m]);
  }
  function abrirIndice(){
    if (window.matchMedia("(max-width:600px),(max-height:500px)").matches) return;   // en móvil no hay collage
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

  ver(0);
})();
