(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Subtle scroll reveals ── */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, i) {
        if (e.isIntersecting) {
          var el = e.target;
          // gentle stagger within a viewport batch
          el.style.transitionDelay = (Math.min(i, 4) * 0.05) + 's';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* ── Hero depth field — point cloud with near=warm / far=cool coloring ── */
  var canvas = document.getElementById('depthfield');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0, pts = [], mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

  var NEAR = [255, 125, 84], FAR = [54, 198, 210], MID = [199, 155, 208];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function rampColor(z) {
    // z: 0 (near/warm) → 1 (far/cool), passing through mid
    var r, g, b;
    if (z < 0.5) {
      var t = z / 0.5;
      r = lerp(NEAR[0], MID[0], t); g = lerp(NEAR[1], MID[1], t); b = lerp(NEAR[2], MID[2], t);
    } else {
      var t2 = (z - 0.5) / 0.5;
      r = lerp(MID[0], FAR[0], t2); g = lerp(MID[1], FAR[1], t2); b = lerp(MID[2], FAR[2], t2);
    }
    return [r | 0, g | 0, b | 0];
  }

  function build() {
    var rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var area = W * H;
    var count = Math.max(36, Math.min(110, Math.round(area / 16000)));
    pts = [];
    for (var i = 0; i < count; i++) {
      var z = Math.random();              // depth
      pts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        z: z,
        r: lerp(0.7, 2.6, 1 - z),         // near points larger
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        ph: Math.random() * Math.PI * 2
      });
    }
  }

  var maxLink = 132, maxLink2 = maxLink * maxLink;
  function frame(ts) {
    ctx.clearRect(0, 0, W, H);
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    var px = (mouse.x - 0.5), py = (mouse.y - 0.5);

    // ambient drift
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
    }

    // faint links between nearby points (depth-graded) — evokes a sparse mesh
    for (var a = 0; a < pts.length; a++) {
      var pa = pts[a];
      var ax = pa.x + px * (1 - pa.z) * 46;
      var ay = pa.y + py * (1 - pa.z) * 46;
      for (var b = a + 1; b < pts.length; b++) {
        var pb = pts[b];
        var bx = pb.x + px * (1 - pb.z) * 46;
        var by = pb.y + py * (1 - pb.z) * 46;
        var dx = ax - bx, dy = ay - by, d2 = dx * dx + dy * dy;
        if (d2 < maxLink2) {
          var alpha = (1 - d2 / maxLink2) * 0.16;
          var zc = (pa.z + pb.z) / 2;
          var col = rampColor(zc);
          ctx.strokeStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + alpha + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        }
      }
    }

    // points
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k];
      var ox = p.x + px * (1 - p.z) * 46;
      var oy = p.y + py * (1 - p.z) * 46;
      var twinkle = 0.55 + 0.45 * Math.sin(ts * 0.0009 + p.ph);
      var col = rampColor(p.z);
      var a2 = (0.28 + (1 - p.z) * 0.5) * twinkle;
      ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + a2 + ')';
      ctx.beginPath(); ctx.arc(ox, oy, p.r, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }

  var raf = null;
  function start() { if (!raf && !reduce) raf = requestAnimationFrame(frame); }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

  build();
  if (reduce) {
    // single static frame
    for (var k = 0; k < pts.length; k++) {
      var p = pts[k], col = rampColor(p.z);
      ctx.fillStyle = 'rgba(' + col[0] + ',' + col[1] + ',' + col[2] + ',' + (0.3 + (1 - p.z) * 0.4) + ')';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  } else {
    start();
  }

  window.addEventListener('resize', function () { build(); }, { passive: true });
  window.addEventListener('mousemove', function (e) {
    mouse.tx = e.clientX / window.innerWidth;
    mouse.ty = e.clientY / Math.max(window.innerHeight, 1);
  }, { passive: true });

  // pause when hero off-screen to save battery
  var hero = document.getElementById('hero');
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0.02 }).observe(hero);
  }
})();
