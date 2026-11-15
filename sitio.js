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
  info.innerHTML = (C.info || []).map(function(bloque){
    return bloque.map(function(l){
      return "<p>" + esc(l).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function(_,t,u){
        return '<a href="'+u+'"'+(/^http/.test(u)?' target="_blank" rel="noopener"':'')+'>'+t+'</a>'; }) + "</p>";
    }).join("");
  }).join("<hr>") + "<hr>";

  // Portada
  var fotos = (C.fotos || []).filter(function(f){ return f && f.archivo; });
  var pase = $("pase"), marco = $("marco"), img = $("foto"), pie = $("pie"), i = 0;
  function enInfo(){ return location.hash === "#info"; }
  function vista(){
    var v = enInfo();
    info.hidden = !v; pase.hidden = v;
    document.body.classList.toggle("portada", !v);
    window.scrollTo(0,0);
  }
  window.addEventListener("hashchange", vista); vista();
  if (!fotos.length) return;

  function ruta(f){ return /^(https?:)?\//.test(f.archivo) ? f.archivo : "fotos/" + encodeURIComponent(f.archivo); }
  function cerrar(){ marco.classList.remove("abierto"); }
  function ver(n){
    i = (n + fotos.length) % fotos.length;
    var f = fotos[i];
    cerrar();
    pie.textContent = f.pie || "";
    img.alt = f.pie || "";
    img.src = ruta(f);
    [1,2].forEach(function(k){ new Image().src = ruta(fotos[(i+k) % fotos.length]); });
  }
  function sig(){ ver(i+1); } function ant(){ ver(i-1); }

  // Deslizar con el dedo o el ratón
  var x0 = null, arrastrado = false;
  document.addEventListener("pointerdown", function(e){ x0 = e.clientX; arrastrado = false; });
  document.addEventListener("pointerup", function(e){
    if (x0 === null || enInfo()) { x0 = null; return; }
    var d = e.clientX - x0; x0 = null;
    if (Math.abs(d) > 40) { arrastrado = true; d < 0 ? sig() : ant(); }
  });

  // Clic sobre la foto: muestra/oculta el pie. Clic fuera: anterior (izquierda) o siguiente (derecha).
  document.addEventListener("click", function(e){
    if (enInfo() || e.target.closest("a")) return;
    if (arrastrado) { arrastrado = false; return; }
    if (e.target.closest("#marco")) {
      if (fotos[i].pie) marco.classList.toggle("abierto"); else sig();
      return;
    }
    e.clientX < window.innerWidth / 2 ? ant() : sig();
  });
  document.addEventListener("keydown", function(e){
    if (enInfo()) return;
    if (e.key === "ArrowRight") sig();
    if (e.key === "ArrowLeft") ant();
    if (e.key === "Escape") cerrar();
  });

  ver(0);
})();
