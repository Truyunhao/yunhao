/* ==========================================================================
   液态玻璃折射引擎
   --------------------------------------------------------------------------
   原理：为每个玻璃表面生成一张「圆角矩形有符号距离场」位移贴图，
   再用 SVG feDisplacementMap 对「背景的精准拷贝」做边缘折射。
   背景拷贝通过精确复算 cover 后的背景尺寸与偏移实现，因此与真实壁纸完全对齐。
   ========================================================================== */
(function (global) {
  'use strict';

  var PAD = 24;          // 位移留白（px），让边缘折射有内容可采
  var BOOST = 0.8;       // 折射强度系数
  var MAX_MAP_PX = 900000; // 单张位移贴图的最大像素数，防止超宽元素卡顿

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function clamp255(v) { return v < 0 ? 0 : (v > 255 ? 255 : v); }

  function hexToRgb(hex) {
    var h = String(hex || '#ffffff').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return [255, 255, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function getRadius(el, w, h) {
    var cs = getComputedStyle(el);
    var raw = (cs.borderTopLeftRadius || '0px').trim();
    var parts = raw.split(/\s+/);
    function toPx(v, base) {
      if (v.indexOf('%') > -1) return parseFloat(v) / 100 * base;
      return parseFloat(v) || 0;
    }
    var hr = toPx(parts[0], w);
    var vr = toPx(parts[1] || parts[0], h);
    return Math.max(0, Math.min(hr, vr, Math.min(w, h) / 2));
  }

  var seq = 0;

  function LiquidGlass(housing, opts) {
    this.housing = housing;
    this.params = Object.assign({
      depth: 60, splay: 2, feather: 24, curve: 2,
      blur: 0, chroma: 0, glint: 25,
      tint: 0, tintColor: '#ffffff', alpha: 10,
      refract: true
    }, opts || {});

    this.layers = [];
    this.mapCache = new Map();
    this.filters = new Map();
    this.version = 0;
    this.enabled = true;

    this.bg = { image: '', mode: 'viewport', natural: null };
    this._bgBox = null;

    this.vw = window.innerWidth;
    this.vh = window.innerHeight;

    this._scheduled = false;
    this._raf = 0;

    var self = this;
    this.ro = (typeof ResizeObserver !== 'undefined')
      ? new ResizeObserver(function () { self.schedule(); })
      : null;

    window.addEventListener('resize', function () {
      self.vw = window.innerWidth;
      self.vh = window.innerHeight;
      self._bgBox = null;
      self.schedule();
    }, { passive: true });

    document.addEventListener('scroll', function () { self.schedule(); }, { passive: true, capture: true });
  }

  /* ---------- 背景信息 ---------- */

  // mode: 'viewport'（渐变，随视口拉伸） | 'cover'（图片，cover 铺满）
  LiquidGlass.prototype.setBackground = function (image, mode, natural) {
    this.bg.image = image || '';
    this.bg.mode = mode || 'viewport';
    this.bg.natural = natural || null;
    this._bgBox = null;
    this.schedule();
  };

  LiquidGlass.prototype._bgGeometry = function () {
    var vw = this.vw, vh = this.vh;
    if (this._bgBox && this._bgBox.vw === vw && this._bgBox.vh === vh) return this._bgBox;
    var bgW = vw, bgH = vh;
    if (this.bg.mode === 'cover' && this.bg.natural && this.bg.natural.w > 0) {
      var s = Math.max(vw / this.bg.natural.w, vh / this.bg.natural.h);
      bgW = this.bg.natural.w * s;
      bgH = this.bg.natural.h * s;
    }
    this._bgBox = {
      vw: vw, vh: vh, w: bgW, h: bgH,
      x: (vw - bgW) / 2, y: (vh - bgH) / 2
    };
    return this._bgBox;
  };

  /* ---------- 图层管理 ---------- */

  LiquidGlass.prototype.attach = function (el) {
    if (!el || el.__lgLayer) return el && el.__lgLayer;
    var layer = { el: el, w: 0, h: 0, radius: 0, visible: false };

    var wrap = document.createElement('div');
    wrap.className = 'glass-refract';
    wrap.setAttribute('aria-hidden', 'true');

    var bg = document.createElement('div');
    bg.className = 'glass-refract-bg';

    var tint = document.createElement('div');
    tint.className = 'glass-refract-tint';

    wrap.appendChild(bg);
    wrap.appendChild(tint);
    el.insertBefore(wrap, el.firstChild);

    layer.wrap = wrap;
    layer.bg = bg;
    layer.tint = tint;

    el.__lgLayer = layer;
    this.layers.push(layer);
    if (this.ro) this.ro.observe(el);
    this.schedule();
    return layer;
  };

  LiquidGlass.prototype.detachAll = function () {
    this.layers.forEach(function (l) {
      if (l.wrap && l.wrap.parentNode) l.wrap.parentNode.removeChild(l.wrap);
      if (l.el) l.el.__lgLayer = null;
    });
    this.layers.length = 0;
  };

  // 清理已从文档中移除的表面（重新渲染后调用）
  LiquidGlass.prototype.prune = function () {
    var keep = [];
    for (var i = 0; i < this.layers.length; i++) {
      var l = this.layers[i];
      if (l.el && l.el.isConnected) {
        keep.push(l);
      } else {
        if (l.wrap && l.wrap.parentNode) l.wrap.parentNode.removeChild(l.wrap);
        if (this.ro && l.el) { try { this.ro.unobserve(l.el); } catch (e) { } }
        if (l.el) l.el.__lgLayer = null;
      }
    }
    this.layers = keep;
  };

  /* ---------- 参数 ---------- */

  LiquidGlass.prototype.setParams = function (p) {
    var old = this.params;
    var changed = false;
    var geometryChanged = false;
    var keys = Object.keys(p);

    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (p[k] === old[k]) continue;
      changed = true;
      if ((k === 'splay' || k === 'feather' || k === 'curve') && p[k] !== old[k]) geometryChanged = true;
    }
    if (!changed) return;

    if (geometryChanged) this.mapCache.clear();
    this.params = Object.assign({}, old, p);
    this.version++;
    this.filters.clear();
    this._rebuild = true;
    this.schedule();
  };

  LiquidGlass.prototype.setEnabled = function (on) {
    this.enabled = !!on;
    this.schedule();
  };

  /* ---------- 位移贴图 ---------- */

  LiquidGlass.prototype.buildMap = function (mw, mh, winW, winH, radius, rim, curve, feather) {
    var key = mw + ':' + winW + ':' + radius + ':' + rim + ':' + curve + ':' + feather;
    var hit = this.mapCache.get(key);
    if (hit) return hit;

    var cv = document.createElement('canvas');
    cv.width = mw;
    cv.height = mh;
    var ctx = cv.getContext('2d');
    var img = ctx.createImageData(mw, mh);
    var px = img.data;

    var hx = winW / 2, hy = winH / 2;
    function sdf(x, y) {
      var qx = Math.abs(x - mw / 2) - (hx - radius);
      var qy = Math.abs(y - mh / 2) - (hy - radius);
      var ox = Math.max(qx, 0), oy = Math.max(qy, 0);
      return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - radius;
    }

    for (var y = 0; y < mh; y++) {
      for (var x = 0; x < mw; x++) {
        var cx = x + 0.5, cy = y + 0.5;
        var s = sdf(cx, cy);
        var gx = sdf(cx + 1, cy) - sdf(cx - 1, cy);
        var gy = sdf(cx, cy + 1) - sdf(cx, cy - 1);
        var len = Math.hypot(gx, gy) || 1;
        var nx = gx / len, ny = gy / len;
        var span = s < 0 ? rim + feather : rim;
        var amt = Math.max(0, 1 - Math.abs(s) / span);
        amt = amt * amt * amt * (amt * (amt * 6 - 15) + 10);
        amt = Math.pow(amt, curve);
        var i = (y * mw + x) * 4;
        px[i] = clamp255(Math.round(127.5 - nx * amt * 127 * BOOST));
        px[i + 1] = clamp255(Math.round(127.5 - ny * amt * 127 * BOOST));
        px[i + 2] = 128;
        px[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    var url = cv.toDataURL('image/png');
    if (this.mapCache.size > 40) {
      this.mapCache.delete(this.mapCache.keys().next().value);
    }
    this.mapCache.set(key, url);
    return url;
  };

  /* ---------- 滤镜 ---------- */

  LiquidGlass.prototype.getFilterId = function (w, h, radius) {
    var pw = Math.max(4, Math.round(w));
    var ph = Math.max(4, Math.round(h));
    var pr = Math.max(0, Math.min(Math.round(radius), Math.min(pw, ph) / 2));
    var key = pw + 'x' + ph + 'r' + pr;

    var hit = this.filters.get(key);
    if (hit) return hit;

    var mw = pw + PAD * 2;
    var mh = ph + PAD * 2;
    if (mw * mh > MAX_MAP_PX) {
      this.filters.set(key, null);
      return null;
    }

    var p = this.params;
    var mapUrl = this.buildMap(mw, mh, pw, ph, pr, p.splay, p.curve, p.feather);
    var id = 'lg-f' + (++seq) + '-v' + this.version;

    var disp;
    if (p.chroma > 0) {
      var sc = p.depth;
      var sR = sc * (1 + p.chroma), sB = sc * (1 - p.chroma);
      disp =
        '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + sR + '" xChannelSelector="R" yChannelSelector="G" result="dR"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + sB + '" xChannelSelector="R" yChannelSelector="G" result="dGB"/>' +
        '<feColorMatrix in="dR" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cR"/>' +
        '<feColorMatrix in="dGB" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cGB"/>' +
        '<feComposite in="cR" in2="cGB" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/>';
    } else {
      disp = '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + p.depth + '" xChannelSelector="R" yChannelSelector="G"/>';
    }

    var markup =
      '<filter id="' + id + '" x="0" y="0" width="100%" height="100%" ' +
      'filterUnits="objectBoundingBox" color-interpolation-filters="sRGB">' +
      '<feImage href="' + mapUrl + '" x="0" y="0" width="' + mw + '" height="' + mh + '" ' +
      'preserveAspectRatio="none" result="map"/>' + disp +
      '</filter>';

    var tmp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tmp.innerHTML = '<defs>' + markup + '</defs>';
    var node = tmp.firstChild.firstChild;
    this.housing.appendChild(node);

    this.filters.set(key, id);
    return id;
  };

  /* ---------- 渲染 ---------- */

  LiquidGlass.prototype.schedule = function () {
    var self = this;
    if (this._scheduled) return;
    this._scheduled = true;
    this._raf = requestAnimationFrame(function () {
      self._scheduled = false;
      self.render();
    });
  };

  LiquidGlass.prototype.render = function () {
    var p = this.params;
    var active = this.enabled && p.refract;

    if (this._rebuild) {
      // 一次性清空并重建滤镜，避免中间态闪烁
      this.housing.textContent = '';
      this.filters.clear();
      this._rebuild = false;
    }

    var box = this._bgGeometry();
    var showRefract = active && !!this.bg.image;

    // 玻璃染色 / 高光（与折射层无关，始终生效）
    var rgbA = hexToRgb('#ffffff');
    var rgbB = hexToRgb(p.tintColor);
    var t = clamp(p.tint, 0, 1);
    var mix = [
      Math.round(rgbA[0] + (rgbB[0] - rgbA[0]) * t),
      Math.round(rgbA[1] + (rgbB[1] - rgbA[1]) * t),
      Math.round(rgbA[2] + (rgbB[2] - rgbA[2]) * t)
    ];
    var veil = clamp(p.alpha, 0, 100) / 100;
    var tintCss = 'rgba(' + mix[0] + ',' + mix[1] + ',' + mix[2] + ',' + veil.toFixed(3) + ')';

    var i, layer;
    for (i = 0; i < this.layers.length; i++) {
      layer = this.layers[i];
      var el = layer.el;
      var r = el.getBoundingClientRect();
      var w = Math.round(r.width);
      var h = Math.round(r.height);

      if (!showRefract || w < 6 || h < 6 ||
          r.bottom < -PAD || r.top > this.vh + PAD ||
          r.right < 0 || r.left > this.vw) {
        if (layer.visible) {
          layer.wrap.style.display = 'none';
          layer.visible = false;
        }
        continue;
      }

      var radius = getRadius(el, w, h);

      layer.wrap.style.display = '';
      layer.wrap.style.left = (-PAD) + 'px';
      layer.wrap.style.top = (-PAD) + 'px';
      layer.wrap.style.width = (w + PAD * 2) + 'px';
      layer.wrap.style.height = (h + PAD * 2) + 'px';
      layer.wrap.style.filter = p.blur > 0 ? 'blur(' + p.blur + 'px)' : 'none';
      layer.visible = true;

      layer.bg.style.backgroundImage = this.bg.image;
      layer.bg.style.backgroundSize = box.w + 'px ' + box.h + 'px';
      layer.bg.style.backgroundPosition =
        (box.x - r.left + PAD) + 'px ' + (box.y - r.top + PAD) + 'px';

      var fid = this.getFilterId(w, h, radius);
      layer.bg.style.filter = fid ? 'url(#' + fid + ')' : 'none';

      layer.tint.style.inset = PAD + 'px';
      layer.tint.style.borderRadius = radius + 'px';
      layer.tint.style.background = tintCss;
      layer.w = w;
      layer.h = h;
      layer.radius = radius;
    }
  };

  global.LiquidGlass = LiquidGlass;
})(window);
