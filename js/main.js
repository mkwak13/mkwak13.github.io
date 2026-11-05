/* Minseok Kwak · portfolio v2 · interactions */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };


  /* shared cardiac clock: the ECG trace and the background heart beat together */
  var BEAT_MS = 900, T0 = performance.now();
  function beatPhase(now) { return (((now - T0) % BEAT_MS) + BEAT_MS) % BEAT_MS / BEAT_MS; } /* 0 = R peak */

  /* background: a 3D scan volume (stacked contour slices) sliced by a moving plane, over a faint neural network.
     Scroll rotates the volume, moves the active slice and pushes signal through the network. */
  (function () {
    var cv = document.createElement('canvas');
    cv.className = 'bg-lumen'; cv.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(cv, document.body.firstChild);
    var ctx = cv.getContext('2d');
    var isHome = !!document.querySelector('.hero'); /* project pages get a quieter background: no hologram, faint right heart */
    if (!ctx) return;
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var SLICES = 26, SEG = 64, N_SLICE_LABEL = 240;
    var rot = 0, rotT = 0, prog = 0, progT = 0, rec = 0, recT = 0, mx = 0, my = 0, tmx = 0, tmy = 0, t = 0, last = 0, raf = 0;
    var net = [];
    function buildNet() {
      var layers = W < 900 ? [4, 6, 6, 3] : [5, 8, 8, 6, 3], L = layers.length;
      net = layers.map(function (n, li) {
        var arr = [];
        for (var i = 0; i < n; i++) {
          var x = W * (0.08 + 0.84 * li / (L - 1)), y = H * (0.18 + 0.64 * (n === 1 ? 0.5 : i / (n - 1)));
          arr.push({ x: x + Math.sin(i * 3.1 + li) * 18, y: y + Math.cos(i * 1.7 + li * 2) * 14 });
        }
        return arr;
      });
    }
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildNet();
    }
    /* anatomical heart (anterior view; x = viewer's right, y = up, d = toward viewer), as a smooth union of
       chamber ellipsoids, then sliced axially (like CT) into contours once with marching squares */
    function rot2(x, y, a) { var c = Math.cos(a), s = Math.sin(a); return [x * c - y * s, x * s + y * c]; }
    function sdEll(px, py, pz, rx, ry, rz) {
      var k0 = Math.sqrt(px * px / (rx * rx) + py * py / (ry * ry) + pz * pz / (rz * rz));
      var k1 = Math.sqrt(px * px / (rx * rx * rx * rx) + py * py / (ry * ry * ry * ry) + pz * pz / (rz * rz * rz * rz));
      return k1 ? k0 * (k0 - 1) / k1 : -Math.min(rx, ry, rz);
    }
    function smin(a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
    var AX = -0.62; /* long axis tilt: apex down and to the viewer's right */
    function ventricle(x, y, d, cx, cy, cd, rx, ry, rd) {
      var q = rot2(x - cx, y - cy, AX), lx = q[0], ly = q[1];
      var taper = 1 + 0.42 * Math.max(-1, Math.min(1, ly / ry)); /* narrow toward the apex */
      return sdEll(lx, ly, d - cd, rx * taper, ry, rd * taper);
    }
    function heartF(x, d, y) {
      var lv = ventricle(x, y, d, 0.24, -0.2, -0.08, 0.56, 1.0, 0.5);
      var rv = ventricle(x, y, d, -0.1, -0.06, 0.22, 0.6, 0.82, 0.32);
      var ra = sdEll(x + 0.56, y - 0.36, d - 0.04, 0.36, 0.42, 0.36);
      var la = sdEll(x - 0.18, y - 0.56, d + 0.38, 0.46, 0.3, 0.3);
      var raa = sdEll(x + 0.32, y - 0.62, d - 0.32, 0.2, 0.13, 0.13);
      var laa = sdEll(x - 0.56, y - 0.5, d - 0.06, 0.18, 0.11, 0.12);
      var f = smin(lv, rv, 0.22); f = smin(f, ra, 0.2); f = smin(f, la, 0.2); f = smin(f, raa, 0.08); f = smin(f, laa, 0.08);
      return f;
    }
    var HS = [], ZMIN = -1.25, ZMAX = 0.92, NS = 32;
    (function buildHeart() {
      var GX = 52, GD = 36, x0 = -1.15, x1 = 1.45, d0 = -0.95, d1 = 0.8;
      for (var s = 0; s < NS; s++) {
        var u = ZMIN + (ZMAX - ZMIN) * s / (NS - 1), segs = [], g = [];
        for (var i = 0; i <= GX; i++) { g[i] = []; for (var k = 0; k <= GD; k++) g[i][k] = heartF(x0 + (x1 - x0) * i / GX, d0 + (d1 - d0) * k / GD, u); }
        var X = function (i) { return x0 + (x1 - x0) * i / GX; }, D = function (k) { return d0 + (d1 - d0) * k / GD; };
        for (var i2 = 0; i2 < GX; i2++) for (var k2 = 0; k2 < GD; k2++) {
          var v = [g[i2][k2], g[i2 + 1][k2], g[i2 + 1][k2 + 1], g[i2][k2 + 1]];
          var c = [[X(i2), D(k2)], [X(i2 + 1), D(k2)], [X(i2 + 1), D(k2 + 1)], [X(i2), D(k2 + 1)]], pts = [];
          for (var e = 0; e < 4; e++) {
            var a1 = v[e], a2 = v[(e + 1) % 4];
            if ((a1 < 0) !== (a2 < 0)) { var tt = a1 / (a1 - a2), p1 = c[e], p2 = c[(e + 1) % 4]; pts.push([p1[0] + (p2[0] - p1[0]) * tt, p1[1] + (p2[1] - p1[1]) * tt]); }
          }
          if (pts.length >= 2) segs.push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
          if (pts.length === 4) segs.push([pts[2][0], pts[2][1], pts[3][0], pts[3][1]]);
        }
        var key = function (x, y) { return Math.round(x * 1000) + ',' + Math.round(y * 1000); }, adj = {}, used = [], loops = [];
        segs.forEach(function (sg, si) {
          [key(sg[0], sg[1]), key(sg[2], sg[3])].forEach(function (kk) { (adj[kk] = adj[kk] || []).push(si); });
        });
        for (var s0 = 0; s0 < segs.length; s0++) {
          if (used[s0]) continue;
          var loop = [[segs[s0][0], segs[s0][1]], [segs[s0][2], segs[s0][3]]], cur = s0; used[s0] = true;
          for (var guard = 0; guard < 4000; guard++) {
            var end = loop[loop.length - 1], nb = (adj[key(end[0], end[1])] || []).filter(function (n) { return !used[n]; });
            if (!nb.length) break;
            var n = nb[0], sg = segs[n]; used[n] = true;
            loop.push(key(sg[0], sg[1]) === key(end[0], end[1]) ? [sg[2], sg[3]] : [sg[0], sg[1]]);
          }
          if (loop.length > 4) loops.push(loop);
        }
        HS.push({ u: u, segs: segs, loops: loops });
      }
    })();
    /* great vessels (x, up, d); art = oxygenated (coral), else deoxygenated (teal) */
    var VESSELS = [
      { r: 0.14, art: true, p: [[0.0, 0.5, 0.02], [0.04, 1.05, 0.02], [0.22, 1.36, -0.12], [0.46, 1.32, -0.42], [0.42, 1.0, -0.72], [0.3, 0.2, -0.82], [0.24, -1.05, -0.82]] },
      { r: 0.05, art: true, p: [[0.1, 1.28, -0.03], [-0.06, 1.88, 0.0]] },
      { r: 0.042, art: true, p: [[0.3, 1.4, -0.18], [0.3, 1.92, -0.2]] },
      { r: 0.042, art: true, p: [[0.44, 1.36, -0.36], [0.56, 1.86, -0.42]] },
      { r: 0.12, art: false, p: [[0.12, 0.42, 0.34], [0.22, 0.84, 0.28], [0.3, 1.0, 0.08]] },
      { r: 0.085, art: false, p: [[0.3, 1.0, 0.08], [0.68, 1.02, -0.18], [1.02, 0.96, -0.3]] },
      { r: 0.085, art: false, p: [[0.3, 1.0, 0.08], [0.0, 1.0, -0.26], [-0.62, 0.96, -0.36]] },
      { r: 0.1, art: false, p: [[-0.5, 0.66, 0.04], [-0.5, 1.1, 0.04], [-0.5, 1.62, 0.04]] },
      { r: 0.1, art: false, p: [[-0.5, 0.02, -0.06], [-0.5, -0.5, -0.06], [-0.5, -0.95, -0.06]] },
      { r: 0.05, art: true, p: [[0.56, 0.62, -0.46], [0.95, 0.68, -0.52]] },
      { r: 0.05, art: true, p: [[0.56, 0.46, -0.46], [0.95, 0.4, -0.52]] },
      { r: 0.05, art: true, p: [[-0.16, 0.62, -0.46], [-0.42, 0.7, -0.6]] },
      { r: 0.05, art: true, p: [[-0.16, 0.46, -0.46], [-0.42, 0.4, -0.6]] }
    ];
    VESSELS.forEach(function (V) { /* Catmull-Rom resample */
      var P = V.p, out = [];
      for (var i = 0; i < P.length - 1; i++) {
        var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
        for (var s = 0; s < 8; s++) {
          var t = s / 8, t2 = t * t, t3 = t2 * t, pt = [];
          for (var d = 0; d < 3; d++) pt.push(0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3));
          out.push(pt);
        }
      }
      out.push(P[P.length - 1]); V.c = out;
    });
    /* left heart: a low-poly mesh (vertices, edges, faceted triangles) built from a sparse sample of the same model.
       Vertices start scattered and fly into place as the visitor scrolls; edges and facets appear once their vertices land. */
    var CLOUD = [], EDGES = [], TRIS = [];
    var GLOW = document.createElement('canvas'); GLOW.width = GLOW.height = 36;
    (function () { var g = GLOW.getContext('2d'), rg = g.createRadialGradient(18, 18, 0, 18, 18, 18);
      rg.addColorStop(0, 'rgba(120,230,255,0.95)'); rg.addColorStop(0.18, 'rgba(0,190,230,0.55)'); rg.addColorStop(0.5, 'rgba(0,168,204,0.14)'); rg.addColorStop(1, 'rgba(0,168,204,0)');
      g.fillStyle = rg; g.fillRect(0, 0, 36, 36); })();
    (function buildMesh() {
      var seed = 1234567, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      var add = function (x, u, d) { CLOUD.push({ x: x, u: u, d: d, sx: rnd(), sy: rnd(), dl: rnd() * 0.45, ph: rnd() * 6.283 }); return CLOUD.length - 1; };
      var es = {}, edge = function (p, q) { var k = p < q ? p + '_' + q : q + '_' + p; if (!es[k]) { es[k] = 1; EDGES.push([p, q]); } };
      var tri = function (p, q, r) { TRIS.push([p, q, r]); edge(p, q); edge(q, r); edge(p, r); };
      var band = function (A, B) { /* stitch two rings of equal size with triangles */
        for (var i = 0; i < A.length; i++) { var i2 = (i + 1) % A.length; tri(A[i], A[i2], B[i]); tri(A[i2], B[i2], B[i]); }
      };
      var cap = function (Rg, c) { for (var i = 0; i < Rg.length; i++) tri(Rg[i], Rg[(i + 1) % Rg.length], c); };
      /* heart: every third CT slice, its largest contour resampled to M points by angle around its centroid */
      var M = 11, rings = [], cents = [];
      for (var si = 1; si < HS.length; si += 3) {
        var S = HS[si]; if (!S.loops.length) continue;
        var L = S.loops.reduce(function (a2, b3) { return b3.length > a2.length ? b3 : a2; });
        var mx2 = 0, md = 0; L.forEach(function (q) { mx2 += q[0]; md += q[1]; }); mx2 /= L.length; md /= L.length;
        var ring = [];
        for (var k = 0; k < M; k++) {
          var th = (k + (rings.length % 2) * 0.5) / M * Math.PI * 2, best = null, bd = 9;
          L.forEach(function (q) { var a3 = Math.atan2(q[1] - md, q[0] - mx2), dd = Math.abs(Math.atan2(Math.sin(a3 - th), Math.cos(a3 - th))); if (dd < bd) { bd = dd; best = q; } });
          ring.push(add(best[0] + (rnd() - 0.5) * 0.04, S.u + (rnd() - 0.5) * 0.04, best[1] + (rnd() - 0.5) * 0.04));
        }
        rings.push(ring); cents.push([mx2, S.u, md]);
      }
      for (var r = 0; r < rings.length - 1; r++) band(rings[r], rings[r + 1]);
      if (rings.length) {
        var c0 = cents[0]; cap(rings[0], add(c0[0], c0[1] - 0.12, c0[2]));               /* apex */
        var c1 = cents[cents.length - 1]; cap(rings[rings.length - 1], add(c1[0], c1[1] + 0.06, c1[2]));
      }
      /* vessels: tubes of rings along each centerline */
      VESSELS.forEach(function (V) {
        var C = V.c, n0 = V.r > 0.07 ? 6 : 4, prev = null;
        for (var i = 0; i < C.length; i += 3) {
          var p = C[i], n = C[Math.min(C.length - 1, i + 1)], m = C[Math.max(0, i - 1)];
          var tx = n[0] - m[0], ty = n[1] - m[1], tz = n[2] - m[2], tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          var ax = Math.abs(ty) < 0.9 ? [0, 1, 0] : [1, 0, 0];
          var b1x = ty * ax[2] - tz * ax[1], b1y = tz * ax[0] - tx * ax[2], b1z = tx * ax[1] - ty * ax[0], bl = Math.hypot(b1x, b1y, b1z) || 1; b1x /= bl; b1y /= bl; b1z /= bl;
          var b2x = ty * b1z - tz * b1y, b2y = tz * b1x - tx * b1z, b2z = tx * b1y - ty * b1x, ring = [];
          for (var k = 0; k < n0; k++) {
            var th = k / n0 * Math.PI * 2, co = Math.cos(th) * V.r, s2 = Math.sin(th) * V.r;
            ring.push(add(p[0] + b1x * co + b2x * s2, p[1] + b1y * co + b2y * s2, p[2] + b1z * co + b2z * s2));
          }
          if (prev) band(prev, ring);
          prev = ring;
        }
      });
    })();
    function drawNet() {
      var L = net.length, phase = t * 0.00025 + prog * 6;
      ctx.lineWidth = 0.8;
      for (var l = 0; l < L - 1; l++) {
        for (var i = 0; i < net[l].length; i++) {
          for (var k = 0; k < net[l + 1].length; k++) {
            if ((i * 7 + k * 3 + l) % 3 === 0) continue; /* sparse */
            var A = net[l][i], B = net[l + 1][k];
            ctx.strokeStyle = 'rgba(10,116,128,0.045)';
            ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
            var s = (phase + i * 0.37 + k * 0.21 + l * 0.5) % 1; /* travelling pulse */
            if ((i + k + l) % 4 === 0) {
              ctx.fillStyle = 'rgba(10,116,128,0.26)';
              ctx.beginPath(); ctx.arc(A.x + (B.x - A.x) * s, A.y + (B.y - A.y) * s, 1.6, 0, Math.PI * 2); ctx.fill();
            }
          }
        }
      }
      for (var l2 = 0; l2 < L; l2++) for (var n = 0; n < net[l2].length; n++) {
        var P = net[l2][n], act = 0.5 + 0.5 * Math.sin(t * 0.0012 + n * 1.3 + l2 + prog * 8);
        ctx.fillStyle = 'rgba(10,116,128,' + (0.08 + 0.14 * act) + ')';
        ctx.beginPath(); ctx.arc(P.x, P.y, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
    function drawVolume() {
      var GA = ctx.globalAlpha, sm = function (a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); };
      var mobile = W < 900;
      var cx = W * (mobile ? 0.5 : 0.72), cy = H * 0.52;
      var R = Math.min(W, H) * (mobile ? 0.26 : 0.26), tilt = 0.22;
      var ang = -0.6, ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt); var cr = Math.cos(0.349), sr = Math.sin(0.349);
      var ph = beatPhase(performance.now()), beat = ph < 0.1 ? Math.sin(ph / 0.1 * Math.PI / 2) : ph < 0.4 ? Math.cos((ph - 0.1) / 0.3 * Math.PI / 2) : 0;
      var squeeze = reduce ? 0 : beat * 0.045; /* systole: the ventricles contract */
      var sc = 1;
      function proj(x, u, d) {
        if (sc !== 1) { x = 0.15 + (x - 0.15) * sc; u = -0.1 + (u + 0.1) * sc; d = d * sc; }
        u -= 0.38; var z = -d;
        /* like the earth: the model is tilted 20 degrees, then spins about the true vertical axis */
        var xa = x * cr + u * sr, u1 = -x * sr + u * cr;
        var x1 = xa * ca + z * sa, z1 = -xa * sa + z * ca;
        var y2 = u1 * ct - z1 * st, z2 = u1 * st + z1 * ct;
        var p = 4 / (4 + z2);
        return [cx + x1 * R * p, cy - y2 * R * p, z2];
      }
      var ai = Math.round((1 - prog) * (NS - 1)); /* slices run bottom to top; scrolling down moves the active slice down */
      /* heart slices (contract with each beat): soft tissue fill, then contour lines */
      sc = 1 - squeeze;
      for (var sf = 0; sf < NS; sf++) {
        var SF = HS[sf];
        SF.loops.forEach(function (L) {
          ctx.beginPath();
          for (var li = 0; li < L.length; li++) { var Pq = proj(L[li][0], SF.u, L[li][1]); if (!li) ctx.moveTo(Pq[0], Pq[1]); else ctx.lineTo(Pq[0], Pq[1]); }
          ctx.closePath(); ctx.fillStyle = 'rgba(214,96,86,0.028)'; ctx.fill();
        });
      }
      for (var s = 0; s < NS; s++) {
        var S = HS[s], act = s === ai;
        ctx.beginPath();
        for (var g = 0; g < S.segs.length; g++) {
          var q = S.segs[g], A = proj(q[0], S.u, q[1]), B = proj(q[2], S.u, q[3]);
          ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]);
        }
        ctx.strokeStyle = act ? 'rgba(217,83,43,0.75)' : 'rgba(10,116,128,' + (0.18 + 0.12 * (1 - Math.abs(S.u / 1.2))) + ')';
        ctx.lineWidth = act ? 2 : 1; ctx.stroke();
      }
      ctx.lineCap = 'butt';
      /* vessels */
      sc = 1 - squeeze * 0.4;
      VESSELS.forEach(function (V) {
        var col = V.art ? '217,83,43' : '47,105,201', C = V.c, RING = 14, rings = [];
        /* solid tube body: a wide translucent stroke along the centerline */
        ctx.beginPath();
        for (var c0i = 0; c0i < C.length; c0i++) { var Pc = proj(C[c0i][0], C[c0i][1], C[c0i][2]); if (!c0i) ctx.moveTo(Pc[0], Pc[1]); else ctx.lineTo(Pc[0], Pc[1]); }
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, V.r * 2 * R * 0.95); ctx.strokeStyle = 'rgba(' + col + ',0.075)'; ctx.stroke(); ctx.lineCap = 'butt';
        for (var i = 0; i < C.length; i++) {
          var p = C[i], n = C[Math.min(C.length - 1, i + 1)], m = C[Math.max(0, i - 1)];
          var tx = n[0] - m[0], ty = n[1] - m[1], tz = n[2] - m[2], tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
          var ax = Math.abs(ty) < 0.9 ? [0, 1, 0] : [1, 0, 0];
          var b1x = ty * ax[2] - tz * ax[1], b1y = tz * ax[0] - tx * ax[2], b1z = tx * ax[1] - ty * ax[0], bl = Math.hypot(b1x, b1y, b1z) || 1; b1x /= bl; b1y /= bl; b1z /= bl;
          var b2x = ty * b1z - tz * b1y, b2y = tz * b1x - tx * b1z, b2z = tx * b1y - ty * b1x, ring = [];
          for (var k = 0; k < RING; k++) {
            var th = k / RING * Math.PI * 2, co = Math.cos(th) * V.r, si = Math.sin(th) * V.r;
            ring.push(proj(p[0] + b1x * co + b2x * si, p[1] + b1y * co + b2y * si, p[2] + b1z * co + b2z * si));
          }
          rings.push(ring);
        }
        ctx.lineWidth = 1;
        for (var r = 0; r < rings.length; r += 3) {
          ctx.beginPath();
          for (var k2 = 0; k2 <= RING; k2++) { var P = rings[r][k2 % RING]; if (!k2) ctx.moveTo(P[0], P[1]); else ctx.lineTo(P[0], P[1]); }
          ctx.strokeStyle = 'rgba(' + col + ',0.22)'; ctx.stroke();
        }
        for (var k3 = 0; k3 < RING; k3 += 3) {
          ctx.beginPath();
          for (var r2 = 0; r2 < rings.length; r2++) { var Q = rings[r2][k3]; if (!r2) ctx.moveTo(Q[0], Q[1]); else ctx.lineTo(Q[0], Q[1]); }
          ctx.strokeStyle = 'rgba(' + col + ',0.2)'; ctx.stroke();
        }
      });
      /* highlight the current slice: filled cross-section with a glow, on top of the vessels */
      sc = 1 - squeeze;
      var AS = HS[ai];
      ctx.save(); ctx.shadowColor = 'rgba(217,83,43,0.55)'; ctx.shadowBlur = 14;
      AS.loops.forEach(function (L) {
        ctx.beginPath();
        for (var li = 0; li < L.length; li++) { var Pq = proj(L[li][0], AS.u, L[li][1]); if (!li) ctx.moveTo(Pq[0], Pq[1]); else ctx.lineTo(Pq[0], Pq[1]); }
        ctx.closePath(); ctx.fillStyle = 'rgba(217,83,43,' + (0.16 + 0.08 * beat).toFixed(3) + ')'; ctx.fill();
      });
      ctx.beginPath();
      for (var g2 = 0; g2 < AS.segs.length; g2++) { var q2 = AS.segs[g2], A2 = proj(q2[0], AS.u, q2[1]), B2 = proj(q2[2], AS.u, q2[3]); ctx.moveTo(A2[0], A2[1]); ctx.lineTo(B2[0], B2[1]); }
      ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(217,83,43,0.95)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.lineCap = 'butt';
      ctx.restore();
      sc = 1;
      /* scanner plane at the active slice */
      var ua = HS[ai].u;
      var c1 = proj(-1.2, ua, -0.85), c2 = proj(1.35, ua, -0.85), c3 = proj(1.35, ua, 0.75), c4 = proj(-1.2, ua, 0.75);
      ctx.beginPath(); ctx.moveTo(c1[0], c1[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(c3[0], c3[1]); ctx.lineTo(c4[0], c4[1]); ctx.closePath();
      ctx.fillStyle = 'rgba(217,83,43,0.025)'; ctx.fill();
      ctx.strokeStyle = 'rgba(10,116,128,0.22)'; ctx.setLineDash([4, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = '500 11px "IBM Plex Mono", monospace'; ctx.fillStyle = 'rgba(10,116,128,0.55)';
      var idx = Math.round(prog * (N_SLICE_LABEL - 1)) + 1;
      var lab = 'cardiac CT · slice ' + ('00' + idx).slice(-3) + ' / ' + N_SLICE_LABEL, lx = Math.max(c1[0], c2[0], c3[0], c4[0]), ly = Math.max(c1[1], c2[1], c3[1], c4[1]);
      if (!mobile && isHome) { ctx.textAlign = 'right'; ctx.fillText(lab, Math.min(W - 16, lx), Math.min(H - 12, ly + 18)); ctx.textAlign = 'left'; }
      /* a second heart on the left: low-poly mesh reconstructed from scattered vertices; spins on its own clock */
      if (!mobile && isHome) {
        sc = 1 - squeeze; cx = W * 0.25; R *= 0.7; /* smaller than the right heart */
        var GA2 = ctx.globalAlpha; ctx.globalAlpha = GA2 * 0.55; /* keep the hologram faint */
        var ang2 = rot; /* blue heart turns with scroll */ ca = Math.cos(ang2); sa = Math.sin(ang2);
        var uTop = HS[NS - 1].u, uBot = HS[0].u, uScan = uTop - (uTop - uBot) * prog; /* same height as the right heart's active slice */
        var VP = [], VE = [];
        for (var ci = 0; ci < CLOUD.length; ci++) {
          var D = CLOUD[ci], e = Math.min(1, Math.max(0, (D.u - uScan) / 0.32 - D.dl * 0.35)); e = e * e * (3 - 2 * e); /* lands as the scan slice passes its height */
          var Pt = proj(D.x, D.u, D.d), drift = (1 - e) * 10;
          var sx = D.sx * W * 0.62 + Math.sin(t * 0.0004 + D.ph) * drift, sy = D.sy * H + Math.cos(t * 0.00035 + D.ph) * drift;
          VP.push([sx + (Pt[0] - sx) * e, sy + (Pt[1] - sy) * e, Pt[2]]); VE.push(e);
        }
        /* hologram: cyan light, glow, scan lines, a sweeping band, chromatic fringe, flicker, projector base */
        var front = function (z) { return z > 0.25 ? 0.55 : 1; };
        var HC = '0,168,204', flick = 0.88 + 0.12 * Math.sin(t * 0.021) * Math.sin(t * 0.0067);
        var glitch = Math.sin(t * 0.0009) > 0.996 ? (Math.sin(t * 0.09) * 4) : 0;
        var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        for (var b0 = 0; b0 < VP.length; b0++) { if (VE[b0] < 0.95) continue; var Q0 = VP[b0]; Q0[0] += glitch * (Q0[1] % 3 < 1 ? 1 : 0); if (Q0[0] < minX) minX = Q0[0]; if (Q0[0] > maxX) maxX = Q0[0]; if (Q0[1] < minY) minY = Q0[1]; if (Q0[1] > maxY) maxY = Q0[1]; }
        var built = maxY > minY;
        var bandY = built ? minY + ((t * 0.00012) % 1.2) * (maxY - minY + 80) - 40 : -1e9;
        if (built) { /* projector base and light cone */
          var bx = (minX + maxX) / 2, by = maxY + 28, bw = (maxX - minX) * 0.42;
          var gc = ctx.createLinearGradient(0, by, 0, minY);
          gc.addColorStop(0, 'rgba(' + HC + ',' + (0.07 * flick).toFixed(3) + ')'); gc.addColorStop(1, 'rgba(' + HC + ',0)');
          ctx.fillStyle = gc; ctx.beginPath(); ctx.moveTo(bx - bw * 0.55, by); ctx.lineTo(minX - 10, minY); ctx.lineTo(maxX + 10, minY); ctx.lineTo(bx + bw * 0.55, by); ctx.closePath(); ctx.fill();
          for (var rg = 0; rg < 3; rg++) { ctx.strokeStyle = 'rgba(' + HC + ',' + ((0.32 - rg * 0.09) * flick).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(bx, by, bw * (0.55 + rg * 0.22), bw * (0.1 + rg * 0.04), 0, 0, 6.283); ctx.stroke(); }
        }
        var facetPath = new Path2D();
        for (var ti = 0; ti < TRIS.length; ti++) { /* faint facets, brighter inside the sweeping band */
          var T = TRIS[ti], ea = Math.min(VE[T[0]], VE[T[1]], VE[T[2]]); if (ea < 0.95) continue;
          var p0 = VP[T[0]], p1 = VP[T[1]], p2 = VP[T[2]];
          if (Math.abs((p1[0] - p0[0]) * (p2[1] - p0[1]) - (p1[1] - p0[1]) * (p2[0] - p0[0])) < 2) continue;
          var ym = (p0[1] + p1[1] + p2[1]) / 3, bnd = Math.exp(-Math.pow((ym - bandY) / 34, 2));
          var shade = (0.016 + 0.04 * (0.5 + 0.5 * Math.sin(ti * 2.3)) + 0.09 * bnd) * flick;
          ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.closePath();
          ctx.fillStyle = 'rgba(' + HC + ',' + (shade * (ea - 0.95) * 20 * front((p0[2] + p1[2] + p2[2]) / 3)).toFixed(3) + ')'; ctx.fill();
          facetPath.moveTo(p0[0], p0[1]); facetPath.lineTo(p1[0], p1[1]); facetPath.lineTo(p2[0], p2[1]); facetPath.closePath();
        }
        if (built) { /* horizontal scan lines inside the silhouette */
          ctx.save(); ctx.clip(facetPath, 'nonzero');
          ctx.fillStyle = 'rgba(' + HC + ',' + (0.07 * flick).toFixed(3) + ')';
          var off = (t * 0.02) % 4;
          for (var sy = minY - 4 + off; sy < maxY; sy += 4) ctx.fillRect(minX, sy, maxX - minX, 1);
          ctx.restore();
        }
        /* edges in a few alpha buckets, each one path with a soft glow; then a faint magenta fringe offset for chromatic aberration */
        var buckets = [new Path2D(), new Path2D(), new Path2D(), new Path2D()], hot = new Path2D();
        for (var ei = 0; ei < EDGES.length; ei++) {
          var E2 = EDGES[ei], ee = Math.min(VE[E2[0]], VE[E2[1]]); if (ee < 0.9) continue;
          var q0 = VP[E2[0]], q1 = VP[E2[1]];
          var lvl = Math.max(0, Math.min(3, Math.floor(((ee - 0.9) / 0.1) * front((q0[2] + q1[2]) / 2) * 3.99)));
          buckets[lvl].moveTo(q0[0], q0[1]); buckets[lvl].lineTo(q1[0], q1[1]);
          if (Math.abs((q0[1] + q1[1]) / 2 - bandY) < 26) { hot.moveTo(q0[0], q0[1]); hot.lineTo(q1[0], q1[1]); }
        }
        ctx.save(); ctx.lineWidth = 0.9;
        ctx.translate(1.2, 0); ctx.strokeStyle = 'rgba(214,72,170,' + (0.09 * flick).toFixed(3) + ')'; ctx.stroke(buckets[3]); ctx.translate(-1.2, 0);
        ctx.lineCap = 'round';
        for (var bk0 = 1; bk0 < 4; bk0++) { /* wide soft halo under every line */
          ctx.lineWidth = 7; ctx.strokeStyle = 'rgba(' + HC + ',' + ((0.02 + bk0 * 0.016) * flick).toFixed(3) + ')'; ctx.stroke(buckets[bk0]);
          ctx.lineWidth = 3.4; ctx.strokeStyle = 'rgba(' + HC + ',' + ((0.04 + bk0 * 0.035) * flick).toFixed(3) + ')'; ctx.stroke(buckets[bk0]);
        }
        ctx.lineWidth = 0.9;
        for (var bk = 0; bk < 4; bk++) { ctx.strokeStyle = 'rgba(' + HC + ',' + ((0.12 + bk * 0.09) * flick).toFixed(3) + ')'; ctx.stroke(buckets[bk]); }
        ctx.lineWidth = 1.3; ctx.strokeStyle = 'rgba(' + HC + ',' + (0.55 * flick).toFixed(3) + ')'; ctx.stroke(hot);
        ctx.restore();
        for (var vi2 = 0; vi2 < VP.length; vi2++) { /* vertices: bright points with a halo */
          var V2 = VP[vi2], ve = VE[vi2], fa = front(V2[2]) * (0.3 + 0.3 * ve) * flick * (1 + 1.2 * Math.exp(-Math.pow((V2[1] - bandY) / 26, 2)));
          ctx.globalAlpha = GA2 * 0.55 * Math.min(1, fa * 1.4); ctx.drawImage(GLOW, V2[0] - 9, V2[1] - 9, 18, 18); ctx.globalAlpha = GA2 * 0.55; /* glow sprite */
          ctx.fillStyle = 'rgba(0,120,160,' + Math.min(1, fa).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(V2[0], V2[1], 1.3, 0, 6.283); ctx.fill();
        }
        ctx.globalAlpha = GA2;
        sc = 1;
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = (W < 900 ? 0.5 : 1) * (isHome ? 1 : 0.4);
      drawNet();
      drawVolume();
    }
    var lastScrollT = 0, odd = false;
    function tick(ts) {
      raf = 0;
      odd = !odd;
      if (ts - lastScrollT > 1200 && odd) { if (!document.hidden) raf = requestAnimationFrame(tick); return; } /* idle: draw every other frame */
      var dt = last ? Math.min(64, ts - last) : 16; last = ts; t += dt;
      rot += (rotT - rot) * 0.08; /* right heart turns only with scroll */ prog += (progT - prog) * 0.08; rec += (recT - rec) * 0.06;
      mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
      draw();
      if (!document.hidden) raf = requestAnimationFrame(tick);
    }
    function onScroll() {
      lastScrollT = performance.now();
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight), y = window.scrollY || 0;
      progT = Math.min(1, Math.max(0, y / max)); rotT = y * 0.0021; recT = reduce ? 1 : Math.min(1, Math.max(0, y / (window.innerHeight * 1.4)));
    }
    size(); onScroll(); prog = progT; rot = rotT; rec = recT;
    window.addEventListener('resize', function () { size(); onScroll(); draw(); }, { passive: true });
    if (reduce) { draw(); return; }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', function (e) { tmx = e.clientX / W - 0.5; tmy = e.clientY / H - 0.5; }, { passive: true });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !raf) { last = 0; raf = requestAnimationFrame(tick); } });
    raf = requestAnimationFrame(tick);
  })();

  /* mobile menu */
  var nav = $('.nav'), menuBtn = $('.menu-btn');
  if (nav && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('.nav-links a').forEach(function (a) { a.addEventListener('click', function () { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ECG monitor: a dot sweeps left to right across three beats; three spikes sit at 1/6, 1/2 and 5/6 of the strip and the dot
     crosses each at an R peak (in sync with the heart). Each beat gets a random PQRST shape; the trace lights up behind the dot and fades. */
  function rng(n) { var s = (n * 2654435761) >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  var shapeCache = {};
  function beatShape(n) {
    if (shapeCache[n]) return shapeCache[n];
    var r = rng(n + 7919), u = function (a, b) { return a + (b - a) * r(); }, s = [];
    s.push([u(-0.13, -0.1), u(0.018, 0.03), u(0.06, 0.24)]);                 /* P */
    s.push([u(-0.03, -0.018), u(0.006, 0.01), -u(0.03, 0.35)]);               /* Q */
    if (r() < 0.3) { s.push([-0.01, 0.008, u(0.55, 0.8)]); s.push([0.018, 0.008, u(0.45, 0.75)]); } /* notched R */
    else s.push([0, u(0.008, 0.013), u(0.7, 1.15)]);                           /* R */
    s.push([u(0.022, 0.035), u(0.008, 0.013), -u(0.08, 0.5)]);                /* S */
    s.push([u(0.12, 0.16), u(0.03, 0.045), r() < 0.15 ? -u(0.08, 0.18) : u(0.12, 0.4)]); /* T */
    shapeCache[n] = s; delete shapeCache[n - 12];
    return s;
  }
  function shapeY(p, s) { if (Math.abs(p) > 0.22) return 0; var v = 0; for (var i = 0; i < s.length; i++) { var x = (p - s[i][0]) / s[i][1]; v += s[i][2] * Math.exp(-x * x); } return v; }
  function ecgY(ph) { var p = ph > 0.5 ? ph - 1 : ph, g = function (c, w, a) { var x = (p - c) / w; return a * Math.exp(-x * x); }; return g(-0.16, 0.035, 0.14) + g(-0.025, 0.008, -0.18) + g(0, 0.011, 1) + g(0.03, 0.01, -0.32) + g(0.2, 0.05, 0.26); }
  $$('canvas[data-ecg]').forEach(function (cv) {
    var c = cv.getContext('2d'), w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), SWEEP = 3 * BEAT_MS;
    function size() { var r = cv.getBoundingClientRect(); w = r.width; h = r.height; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); c.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function frame(now) {
      c.clearRect(0, 0, w, h);
      var t = now - T0, mid = h * 0.68, amp = h * 0.56, scale = (w / 6) / 0.24, trail = w * 0.45;
      var fr = (((t / SWEEP + 1 / 6) % 1) + 1) % 1, xd = fr * w;
      var yAt = function (x) {
        var k = Math.min(2, Math.floor(x / (w / 3))), cxk = (k + 0.5) * w / 3;
        var since = (((xd - x) / w) % 1 + 1) % 1, tPass = t - since * SWEEP;  /* when the dot last crossed x */
        var n = Math.round(tPass / BEAT_MS);
        return mid - shapeY((x - cxk) / scale, beatShape(n)) * amp;
      };
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.lineWidth = 1.5; c.strokeStyle = 'rgba(18,33,42,0.12)';
      c.beginPath(); c.moveTo(0, mid); c.lineTo(w, mid); c.stroke();
      c.lineWidth = 2;
      var start = xd - trail;
      for (var x0 = start; x0 < xd; x0 += 2) { /* lit trace behind the dot, wrapping at the left edge */
        var x1 = Math.min(xd, x0 + 2), a = Math.pow((x1 - start) / trail, 1.6);
        var sx0 = x0 < 0 ? x0 + w : x0, sx1 = x0 < 0 ? x1 + w : x1;
        if (x0 < 0 && x1 > 0) { sx0 = 0; sx1 = x1; }
        c.strokeStyle = 'rgba(10,116,128,' + a.toFixed(3) + ')';
        c.beginPath(); c.moveTo(sx0, yAt(sx0)); for (var xx = sx0 + 0.5; xx <= sx1; xx += 0.5) c.lineTo(xx, yAt(xx)); c.stroke();
      }
      var yd = yAt(xd);
      c.fillStyle = 'rgba(79,209,220,0.35)'; c.beginPath(); c.arc(xd, yd, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#0a7480'; c.beginPath(); c.arc(xd, yd, 3, 0, Math.PI * 2); c.fill();
    }
    function still() { /* reduced motion: one complex in the middle of a flat line */
      c.clearRect(0, 0, w, h); var mid = h * 0.62, amp = h * 0.5;
      c.strokeStyle = '#0a7480'; c.lineWidth = 2; c.beginPath();
      for (var x = 0; x <= w; x++) { var ph = (x - w * 0.55) / (w * 0.35); var y = mid - ecgY(Math.abs(ph) < 0.5 ? (ph + 1) % 1 : 0.5) * amp; if (!x) c.moveTo(x, y); else c.lineTo(x, y); }
      c.stroke();
    }
    size(); window.addEventListener('resize', function () { size(); if (reduce) still(); }, { passive: true });
    if (reduce) { still(); return; }
    (function loop(now) { frame(now); requestAnimationFrame(loop); })(performance.now());
  });

  /* compare sliders */
  $$('[data-compare]').forEach(function (el) {
    var r = $('input[type=range]', el);
    if (!r) return;
    var set = function () { el.style.setProperty('--x', r.value + '%'); };
    r.addEventListener('input', set); set();
  });

  /* depth probe: reads the predicted depth map under the pointer */
  function makeSampler(src, cb) {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = 128; c.height = 128;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 128, 128);
      try { ctx.getImageData(0, 0, 1, 1); } catch (e) { return; }
      cb(function (u, v) {
        var x = Math.max(0, Math.min(127, Math.round(u * 127))), y = Math.max(0, Math.min(127, Math.round(v * 127)));
        var p = ctx.getImageData(x, y, 1, 1).data;
        var L = (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
        return 1 - L; /* colormap: bright = near, dark = far */
      });
    };
    img.src = src;
  }
  $$('[data-probe]').forEach(function (stage) {
    var src = stage.getAttribute('data-probe');
    var host = stage.closest('.viewer') || stage.parentNode;
    var out = $('[data-readout]', host);
    var dot = document.createElement('span'); dot.className = 'probe'; dot.setAttribute('aria-hidden', 'true');
    stage.appendChild(dot);
    var idle = out ? out.innerHTML : '';
    makeSampler(src, function (sample) {
      stage.addEventListener('pointermove', function (e) {
        if (stage.hasAttribute('data-probe-off')) return;
        var b = stage.getBoundingClientRect();
        var u = (e.clientX - b.left) / b.width, v = (e.clientY - b.top) / b.height;
        if (u < 0 || u > 1 || v < 0 || v > 1) return;
        dot.style.left = (u * 100) + '%'; dot.style.top = (v * 100) + '%';
        stage.classList.add('probing');
        if (out) {
          var d = sample(u, v);
          var word = d < 0.33 ? 'near' : d < 0.66 ? 'mid' : 'far';
          out.innerHTML = 'depth <b>' + d.toFixed(2) + '</b><span class="depth-bar" style="--d:' + (100 - (1 - d) * 100) + '%"><i></i></span>' + word;
        }
      });
      stage.addEventListener('pointerleave', function () { stage.classList.remove('probing'); if (out) out.innerHTML = idle; });
    });
  });

  /* scan-line reveal, once, on load */
  $$('.scan-reveal').forEach(function (el) {
    if (reduce) return;
    requestAnimationFrame(function () { el.classList.add('run'); });
  });

  /* layer explorers */
  $$('[data-explorer]').forEach(function (ex) {
    var btns = $$('[data-layer]', ex), imgs = $$('.layers img', ex), text = $('[data-explain]', ex), stage = $('.stage', ex);
    function show(name, focus) {
      btns.forEach(function (b) {
        var on = b.getAttribute('data-layer') === name;
        b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
        if (on && text) text.innerHTML = b.getAttribute('data-text');
        if (on && focus) b.focus();
      });
      imgs.forEach(function (i) { i.classList.toggle('on', i.getAttribute('data-name') === name); });
      if (stage && stage.hasAttribute('data-probe')) {
        if (name === stage.getAttribute('data-probe-layer')) stage.removeAttribute('data-probe-off');
        else { stage.setAttribute('data-probe-off', ''); stage.classList.remove('probing'); }
      }
    }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { show(b.getAttribute('data-layer')); });
      b.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!k) return; e.preventDefault();
        show(btns[(i + k + btns.length) % btns.length].getAttribute('data-layer'), true);
      });
    });
    var first = $('[data-layer][aria-selected="true"]', ex) || btns[0];
    if (first) show(first.getAttribute('data-layer'));
  });

  /* results chart */
  $$('[data-chart]').forEach(function (ch) {
    var data = JSON.parse($('script[type="application/json"]', ch).textContent);
    var bars = $('.bars', ch), note = $('.chart-note', ch);
    var state = { ds: Object.keys(data.sets)[0], m: data.metrics[0].id };
    function render() {
      var rows = data.sets[state.ds].rows, met = data.metrics.filter(function (x) { return x.id === state.m; })[0];
      var vals = rows.map(function (r) { return r[state.m]; });
      var max = Math.max.apply(null, vals);
      var prevW = {}; $$('.bar-row', bars).forEach(function (row) { prevW[$('.nm', row).textContent] = $('.fill', row).style.getPropertyValue('--w'); }); /* bars glide from their current length, so quick toggles never restart from zero */
      bars.innerHTML = rows.map(function (r) {
        var w = met.higher ? r[state.m] * 100 : (r[state.m] / max) * 100;
        return '<div class="bar-row' + (r.me ? ' me' : '') + '"><span class="nm">' + r.name + '</span><span class="tr"><span class="fill" style="--w:' + (prevW[r.name] || '0%') + '" data-w="' + w.toFixed(1) + '%"></span></span><span class="val">' + r[state.m].toFixed(met.dp) + '</span></div>';
      }).join('');
      requestAnimationFrame(function () { $$('.fill', bars).forEach(function (f) { f.style.setProperty('--w', f.getAttribute('data-w')); }); });
      var me = rows.filter(function (r) { return r.me; })[0], ref = rows.filter(function (r) { return r.ref; })[0];
      if (note && me && ref) {
        var diff = met.higher ? (me[state.m] - ref[state.m]) * 100 : (ref[state.m] - me[state.m]) / ref[state.m] * 100;
        note.innerHTML = met.higher
          ? 'SEAMLESS vs SHADeS on ' + data.sets[state.ds].label + ': <b>+' + diff.toFixed(1) + ' points</b> ' + met.label + ' (' + met.hint + ').'
          : 'SEAMLESS vs SHADeS on ' + data.sets[state.ds].label + ': <b>' + diff.toFixed(1) + '% lower</b> ' + met.label + ' (' + met.hint + ').';
      }
      $$('[data-ds]', ch).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-ds') === state.ds ? 'true' : 'false'); });
      $$('[data-m]', ch).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-m') === state.m ? 'true' : 'false'); });
    }
    $$('[data-ds]', ch).forEach(function (b) { b.addEventListener('click', function () { state.ds = b.getAttribute('data-ds'); render(); }); });
    $$('[data-m]', ch).forEach(function (b) { b.addEventListener('click', function () { state.m = b.getAttribute('data-m'); render(); }); });
    render();
  });

  /* email links: still open the mail app, but also copy the address and confirm it, since mailto does nothing without a mail app */
  (function () {
    var links = $$('a[href^="mailto:"]'); if (!links.length) return;
    var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast); var hideT = 0;
    var copy = function (txt) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(txt);
      return new Promise(function (res, rej) { var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy') ? res() : rej(); } catch (e) { rej(e); } ta.remove(); });
    };
    links.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var addr = a.getAttribute('href').replace('mailto:', '').split('?')[0];
        if (window.self !== window.top) { /* inside a frame (e.g. a preview): navigating to mailto blanks the frame, so hand it to a new window instead */
          e.preventDefault();
          try { window.open(a.getAttribute('href'), '_blank', 'noopener'); } catch (err) {}
        }
        var show = function (msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(hideT); hideT = setTimeout(function () { toast.classList.remove('show'); }, 2800); };
        copy(addr).then(function () { show('Email copied: ' + addr); }, function () { show('Email: ' + addr); });
      });
    });
  })();

  /* copy citation */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = document.getElementById(btn.getAttribute('data-copy')).innerText;
      var swap = function (txt) { btn.classList.add('swap'); setTimeout(function () { btn.textContent = txt; btn.classList.remove('swap'); }, 120); };
      var done = function () { swap('Copied'); setTimeout(function () { swap('Copy'); }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { btn.textContent = 'Select and copy'; });
    });
  });

  /* click-to-load YouTube */
  $$('[data-yt]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-yt') + '?autoplay=1';
      f.title = 'Demo video'; f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'; f.allowFullscreen = true;
      btn.replaceWith(f);
    });
  });

  /* figure lightbox */
  var figs = $$('.figure img');
  if (figs.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Enlarged figure');
    lb.innerHTML = '<img alt="">';
    document.body.appendChild(lb);
    var li = $('img', lb), last = null;
    var close = function () { lb.classList.remove('open'); if (last) last.focus(); };
    figs.forEach(function (im) {
      im.tabIndex = 0;
      var open = function () { last = im; li.src = im.currentSrc || im.src; li.alt = im.alt; lb.classList.add('open'); };
      im.addEventListener('click', open);
      im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
    lb.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('open')) close(); });
  }
})();
