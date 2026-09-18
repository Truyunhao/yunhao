/* ==========================================================================
   液态玻璃 · 新标签页  —  应用逻辑
   ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'liquidNewtabData';

  /* =======================  默认数据  ======================= */

  /* 默认分类与链接。
     _id 是写死的（不再用 uid() 现生成）：这样每次全新安装拿到的是同一份数据，
     导入导出、回归断言都能直接比对；用户自己增删的条目仍由 ensureIds 补 uid。 */
  var DEFAULT_TABS = [
    {
      _id: 't_mu6w7v4t_1',
      icon: '⭐',
      links: [
        { _id: 'l_mu6w7v4t_2', icon: '', name: '哔哩哔哩', url: 'https://www.bilibili.com' },
        { _id: 'l_mu6w7v4t_3', icon: '', name: '知乎', url: 'https://www.zhihu.com' },
        { _id: 'l_mu6w7v4t_4', icon: '', name: '微博', url: 'https://weibo.com' },
        { _id: 'l_mu6w7v4t_5', icon: '', name: '豆瓣', url: 'https://www.douban.com' },
        { _id: 'l_mu6w7v4t_6', icon: '', name: '淘宝', url: 'https://www.taobao.com' },
        { _id: 'l_mu6w7v4t_7', icon: '', name: '京东', url: 'https://www.jd.com' }
      ],
      name: '常用'
    },
    {
      _id: 't_mu6w7v4t_a',
      icon: '🛠',
      links: [
        { _id: 'l_mu6w7v4t_b', icon: '', name: 'GitHub', url: 'https://github.com' },
        { _id: 'l_mu6w7v4t_c', icon: '', name: 'Stack Overflow', url: 'https://stackoverflow.com' },
        { _id: 'l_mu6w7v4t_d', icon: '', name: 'MDN', url: 'https://developer.mozilla.org' },
        { _id: 'l_mu6w7v4t_e', icon: '', name: 'npm', url: 'https://www.npmjs.com' },
        { _id: 'l_mu6w7v4t_f', icon: '', name: '掘金', url: 'https://juejin.cn' },
        { _id: 'l_mu6w7v4t_g', icon: '', name: 'CSDN', url: 'https://www.csdn.net' },
        { _id: 'l_mu6w7v4t_h', icon: '', name: 'LeetCode', url: 'https://leetcode.cn' },
        { _id: 'l_mu6w7v4t_i', icon: '', name: 'Can I use', url: 'https://caniuse.com' }
      ],
      name: '开发'
    },
    {
      _id: 't_mu6w7v4t_j',
      icon: '🧰',
      links: [
        { _id: 'l_mu6w7v4t_k', icon: '', name: 'DeepSeek', url: 'https://chat.deepseek.com' },
        { _id: 'l_mu6w7v4t_l', icon: '', name: 'ChatGPT', url: 'https://chat.openai.com' },
        { _id: 'l_mu6w7v4t_m', icon: '', name: 'Claude', url: 'https://claude.ai' },
        { _id: 'l_mu6w7v4t_n', icon: '', name: 'Figma', url: 'https://www.figma.com' },
        { _id: 'l_mu6w7v4t_o', icon: '', name: 'Notion', url: 'https://www.notion.so' },
        { _id: 'l_mu6w7v4t_p', icon: '', name: '腾讯文档', url: 'https://docs.qq.com' },
        { _id: 'l_mu6w7v4t_q', icon: '', name: 'Vercel', url: 'https://vercel.com' },
        { _id: 'l_mu6w7v4t_r', icon: '', name: 'Unsplash', url: 'https://unsplash.com' }
      ],
      name: '工具'
    },
    {
      _id: 't_mu6w7v4t_s',
      icon: '🎬',
      links: [
        { _id: 'l_mu6w7v4t_t', icon: '', name: 'YouTube', url: 'https://www.youtube.com' },
        { _id: 'l_mu6w7v4t_u', icon: '', name: '腾讯视频', url: 'https://v.qq.com' },
        { _id: 'l_mu6w7v4t_v', icon: '', name: '爱奇艺', url: 'https://www.iqiyi.com' },
        { _id: 'l_mu6w7v4t_w', icon: '', name: '优酷', url: 'https://www.youku.com' },
        { _id: 'l_mu6w7v4t_x', icon: '', name: 'Netflix', url: 'https://www.netflix.com' },
        { _id: 'l_mu6w7v4t_y', icon: '', name: 'Spotify', url: 'https://open.spotify.com' }
      ],
      name: '影音'
    }
  ];

  var GRADIENTS = {
    liquid: 'linear-gradient(135deg, #0f1220 0%, #1a1a2e 32%, #16213e 62%, #0f3460 100%)',
    dark: 'linear-gradient(135deg, #07080d 0%, #12131c 55%, #0a0b11 100%)',
    light: 'linear-gradient(150deg, #eef2fb 0%, #dde5f6 45%, #eaf0fa 100%)'
  };

  /* 默认壁纸既当"初始背景"，也作为静态壁纸列表里的第一张。
     _id 固定为 w_default —— 迁移时靠它判断"列表里已经有这张默认壁纸了吗"。 */
  function defaultWallpaperMeta() {
    var url = window.LG_DEFAULT_WALLPAPER;
    if (!url) return null;
    var nat = window.LG_DEFAULT_WALLPAPER_NATURAL || {};
    return { _id: 'w_default', data: url, w: nat.w || 0, h: nat.h || 0 };
  }

  function defaultData() {
    var dfltWp = defaultWallpaperMeta();
    return {
      version: 3,
      engine: 'google',
      // 面板：每个面板 = 页面上一块 <section class="links-module">，内含自己的分类条与链接网格
      panels: [
        {
          _id: 'p_default',
          activeTab: 0,
          tabs: JSON.parse(JSON.stringify(DEFAULT_TABS))
        }
      ],
      // 静态壁纸池：[{_id, data(DataURL), w, h}]。默认壁纸就是其中的第一张，开局即选中。
      wallpapers: dfltWp ? [dfltWp] : [],
      // 动态壁纸元数据：[{_id, name, w, h, dur, poster}]。
      // 视频二进制太大，不放这里（会被整份序列化进 chrome.storage）——存 IndexedDB。
      videos: [],
      settings: {
        // 默认壁纸来自 js/default-wallpaper.js（独立文件，避免超长 DataURL 挤在 app.js 里）
        wallpaper: window.LG_DEFAULT_WALLPAPER || '',
        wallpaperNatural: window.LG_DEFAULT_WALLPAPER ? (window.LG_DEFAULT_WALLPAPER_NATURAL || null) : null,
        // 当前生效的是静态图还是视频：'image' | 'video'
        wallpaperKind: 'image',
        // wallpaperKind === 'video' 时指向 state.videos 里的某个 _id
        wallpaperVideoId: '',
        // 轮播默认「无」（不轮播）：壁纸不会在用户没要求的情况下自己换掉
        carousel: { every: 'none', mode: 'random', lastIndex: 0, customMin: 30 },
        theme: 'liquid',
        showTime: true,
        showSeconds: true,
        timeFont: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        timeSize: 96,
        timeWeight: 700,
        timeLetter: 0,
        autoTimeColor: false,
        timeColor: '#ffffff',
        timeTop: 9,
        searchTop: 6,
        linksTop: 9,
        linksWidth: 1200,
        btnWidth: 126,
        btnHeight: 50,
        btnRadius: 10,
        iconRadius: 50,
        btnGap: 14,
        btnAlign: 'left',
        // 高光显示：控制 .tab-item / .engine-btn 那圈描边 + 四边内高光（见 newtab.css 的 --nav-glint）
        showGlint: true,
        liquid: {
          refract: true,
          depth: 44,
          splay: 6,
          feather: 3,
          curve: 2.3,
          blur: 1.7,
          chroma: 0.09,
          glint: 125,
          alpha: 12,
          tint: 0.76,
          tintColor: '#0d0c0c'
        }
      }
    };
  }

  /* =======================  工具  ======================= */

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function deepMerge(target, source) {
    if (!source || typeof source !== 'object') return target;
    Object.keys(source).forEach(function (key) {
      var sv = source[key];
      if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
        target[key] = deepMerge((target[key] && typeof target[key] === 'object') ? target[key] : {}, sv);
      } else if (sv !== undefined) {
        target[key] = sv;
      }
    });
    return target;
  }

  function isEmojiLike(s) { return !!s && !/^(https?:|data:|chrome-extension:)/i.test(s); }

  /* ---------- 稳定 ID（用于"挤动"动画识别同一个按钮） ---------- */

  var uidSeq = 0;
  function uid(prefix) {
    uidSeq++;
    return prefix + '_' + Date.now().toString(36) + '_' + uidSeq.toString(36);
  }

  function ensureIds(d) {
    if (!d || !Array.isArray(d.panels)) return d;
    d.panels.forEach(function (p) {
      if (!p._id) p._id = uid('p');
      if (!Array.isArray(p.tabs)) p.tabs = [];
      if (typeof p.activeTab !== 'number') p.activeTab = 0;
      p.activeTab = clamp(p.activeTab, 0, Math.max(0, p.tabs.length - 1));
      p.tabs.forEach(function (t) {
        if (!t._id) t._id = uid('t');
        if (!Array.isArray(t.links)) t.links = [];
        t.links.forEach(function (l) { if (!l._id) l._id = uid('l'); });
      });
    });
    return d;
  }

  /* 旧数据（v1：单面板 tabs/activeTab）→ v2（panels 数组）+ 刷新为新默认设置 */
  function migrate(st, isFreshImport) {
    if (!Array.isArray(st.panels) || !st.panels.length) {
      var tabs = (Array.isArray(st.tabs) && st.tabs.length)
        ? st.tabs : JSON.parse(JSON.stringify(DEFAULT_TABS));
      st.panels = [{
        _id: uid('p'),
        activeTab: clamp(st.activeTab || 0, 0, tabs.length - 1),
        tabs: tabs
      }];
    }
    delete st.tabs;
    delete st.activeTab;

    if (!st.settings || typeof st.settings !== 'object') st.settings = {};

    // v1 数据升级到 v2：一次性刷成用户指定的新默认设置（分类、链接、壁纸都保留）
    if (!isFreshImport && st.version !== 2) {
      var d = defaultData().settings;
      ['theme', 'showTime', 'showSeconds', 'timeFont', 'timeSize', 'timeWeight', 'timeLetter',
        'autoTimeColor', 'timeColor', 'timeTop', 'searchTop', 'linksTop', 'linksWidth',
        'btnWidth', 'btnHeight', 'btnRadius', 'iconRadius', 'btnGap'].forEach(function (k) {
          if (d[k] !== undefined) st.settings[k] = d[k];
        });
    }
    if (st.settings.btnAlign !== 'left' && st.settings.btnAlign !== 'center') {
      st.settings.btnAlign = 'left';
    }
    if (!st.settings.carousel || typeof st.settings.carousel !== 'object') {
      st.settings.carousel = { every: 'none', mode: 'random', lastIndex: -1, customMin: 30 };
    }
    if (!Array.isArray(st.wallpapers)) st.wallpapers = [];
    st.wallpapers.forEach(function (w) {
      if (!w._id) w._id = uid('w');
      if (typeof w.w !== 'number') w.w = 0;
      if (typeof w.h !== 'number') w.h = 0;
    });
    if (!Array.isArray(st.videos)) st.videos = [];
    st.videos.forEach(function (v) {
      if (!v._id) v._id = uid('v');
      if (typeof v.name !== 'string' || !v.name) v.name = '动态壁纸';
      if (typeof v.poster !== 'string') v.poster = '';
      if (typeof v.w !== 'number') v.w = 0;
      if (typeof v.h !== 'number') v.h = 0;
      if (typeof v.dur !== 'number') v.dur = 0;
    });
    if (st.settings.wallpaperKind !== 'video') st.settings.wallpaperKind = 'image';
    if (typeof st.settings.wallpaperVideoId !== 'string') st.settings.wallpaperVideoId = '';
    // 选中的视频已不在列表里（被删掉 / 换设备）→ 回落到静态壁纸，免得开出一片黑
    if (st.settings.wallpaperKind === 'video' &&
        !st.videos.some(function (v) { return v._id === st.settings.wallpaperVideoId; })) {
      st.settings.wallpaperKind = 'image';
      st.settings.wallpaperVideoId = '';
    }

    // v2 → v3：把用户指定的新默认壁纸补进静态壁纸列表并【选中】它。
    // 只碰壁纸这一项，分类/链接/主题/液态参数都保留用户自己的。
    // 导入的存档（isFreshImport）不动 —— 那是用户明确要恢复的数据。
    if (!isFreshImport && st.version !== 3) {
      var dwp = defaultWallpaperMeta();
      if (dwp) {
        if (!st.wallpapers.some(function (w) { return w._id === dwp._id; })) {
          st.wallpapers.unshift(dwp);
        }
        st.settings.wallpaper = dwp.data;
        st.settings.wallpaperNatural = { w: dwp.w, h: dwp.h };
        st.settings.wallpaperKind = 'image';
        st.settings.wallpaperVideoId = '';
      }
    }
    st.version = 3;
    return ensureIds(st);
  }

  /* ---------- FLIP：按钮位置变化时的"挤动"动画 ---------- */

  var FLIP_EASE = 'transform .34s cubic-bezier(.22,1.05,.3,1)';

  function captureRects(container) {
    var map = {};
    Array.prototype.forEach.call(container.children, function (el) {
      var key = el.dataset && el.dataset.flipKey;
      if (!key) return;
      map[key] = el.getBoundingClientRect();
    });
    return map;
  }

  function playFlip(container, prev) {
    if (!prev) return;
    Array.prototype.forEach.call(container.children, function (el) {
      var key = el.dataset && el.dataset.flipKey;
      var oldRect = key ? prev[key] : null;
      if (!oldRect) return;
      var nowRect = el.getBoundingClientRect();
      var dx = oldRect.left - nowRect.left;
      var dy = oldRect.top - nowRect.top;
      if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6) return;
      el.style.transition = 'none';
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      el.style.zIndex = '3';
      flipRefract();
      requestAnimationFrame(function () {
        el.style.transition = FLIP_EASE;
        el.style.transform = '';
      });
      // 兜底：即使 rAF 未执行也要复位，避免按钮卡在偏移位置
      setTimeout(function () {
        el.style.transition = '';
        el.style.transform = '';
        el.style.zIndex = '';
      }, 420);
    });
  }

  /* ---- FLIP 期间让折射层"实时"重算 ----
     折射层是把当前背景拷一份贴进元素里，拷贝的 background-position 由元素的
     getBoundingClientRect() 算出 —— 那是【含 transform】的视觉位置。
     FLIP 的做法正好是给元素加 transform：先把它推回旧位置，再动画归零。
     这期间元素的视觉位置一直在变，但折射层只在动画开始前算过一次，
     于是玻璃里那份拷贝还停在移动前的背景上，看着就像"背景被冻住、跟着一起搬走"。
     修法：FLIP 期间每帧都重算一次 —— 拷贝永远贴着此刻压在它下面的背景。 */
  var flipRefractUntil = 0;
  var flipRefractRaf = 0;

  function pumpFlipRefract() {
    if (!engine) { flipRefractRaf = 0; return; }
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    if (now > flipRefractUntil) {
      flipRefractRaf = 0;
      engine.schedule();          // 收尾对齐一次，避免最后一帧留偏差
      return;
    }
    engine.render();
    flipRefractRaf = requestAnimationFrame(pumpFlipRefract);
  }

  /* 开启一段"逐帧重算折射层"的窗口。
     调用点：FLIP 开始处（默认 420ms，略长于动画）、拖动期间（靠 dragover 持续续期）。 */
  function flipRefract(ms) {
    if (!engine || !engine.enabled) return;
    var p = engine.params;
    if (p && !p.refract) return;             // 没开折射就不用白算
    var now = (window.performance && performance.now) ? performance.now() : Date.now();
    flipRefractUntil = Math.max(flipRefractUntil, now + (ms || 420));
    if (!flipRefractRaf) flipRefractRaf = requestAnimationFrame(pumpFlipRefract);
  }

  /* ---- 拖动代理：让"手里那个按钮"的透镜实时跟着走 ----
     原生 HTML5 拖拽只肯给一张"拖起那一瞬间"的位图当幽灵：之后无论你把指针移到哪，
     那张位图里冻着的都是【出发点】的背景 —— 看起来就像"玻璃把出发点的背景一起搬走了"。
     修法：把原生幽灵换成一张 1×1 透明图（等于藏掉），自己做一个 position:fixed 的
     真实克隆体跟着指针走，并把它挂进折射引擎；拖动期间逐帧重算，
     它就一直显示"此刻压在它下面的背景"。

     两个容易踩的点：
     1) 克隆体必须 pointer-events:none（见 CSS）—— 否则它会成为指针下最上层的元素，
        把 dragover/drop 的 e.target 抢走，落点判断全废；
     2) 克隆出来的 .glass-refract 是【旧图层】，要先删掉再 attach，否则会叠两层。 */
  var DRAG_GHOST_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var dragProxy = null;
  var dragProxyGrab = { x: 0, y: 0 };

  function startDragProxy(src, e) {
    stopDragProxy();
    var r = src.getBoundingClientRect();
    var proxy = src.cloneNode(true);
    proxy.className = src.className.replace(/\b(dragging|drag-over)\b/g, '').trim() + ' drag-proxy';
    proxy.removeAttribute('draggable');
    proxy.removeAttribute('href');
    proxy.removeAttribute('data-index');
    Array.prototype.forEach.call(proxy.querySelectorAll('.glass-refract'), function (n) {
      n.parentNode.removeChild(n);
    });
    // 克隆体里那些"悬浮才出现"的小按钮不该跟着被拖出来
    Array.prototype.forEach.call(proxy.querySelectorAll('.link-actions'), function (n) {
      n.style.display = 'none';
    });
    proxy.style.width = Math.round(r.width) + 'px';
    proxy.style.height = Math.round(r.height) + 'px';
    proxy.style.left = Math.round(r.left) + 'px';
    proxy.style.top = Math.round(r.top) + 'px';
    document.body.appendChild(proxy);

    // 记住指针在元素内的抓取点，拖动时保持同样的手感
    var cx = typeof e.clientX === 'number' ? e.clientX : r.left + r.width / 2;
    var cy = typeof e.clientY === 'number' ? e.clientY : r.top + r.height / 2;
    dragProxyGrab.x = cx - r.left;
    dragProxyGrab.y = cy - r.top;

    // 藏掉原生幽灵（部分浏览器要求元素已在文档里，所以插一个临时的 1×1 图）
    try {
      var ghost = document.createElement('img');
      ghost.src = DRAG_GHOST_SRC;
      ghost.width = 1; ghost.height = 1;
      ghost.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
      document.body.appendChild(ghost);
      e.dataTransfer.setDragImage(ghost, 0, 0);
      setTimeout(function () {
        if (ghost.parentNode) ghost.parentNode.removeChild(ghost);
      }, 0);
    } catch (err) { }

    // 只有本身就是玻璃表面的（链接按钮）才需要折射层；分类标签没有自己的玻璃底
    if (engine && src.classList.contains('glass')) engine.attach(proxy);
    if (engine) engine.render();
    dragProxy = proxy;
  }

  function moveDragProxy(e) {
    if (!dragProxy) return;
    if (typeof e.clientX !== 'number' || (e.clientX === 0 && e.clientY === 0)) return;  // 拖拽结束时的 (0,0) 不采
    dragProxy.style.left = (e.clientX - dragProxyGrab.x) + 'px';
    dragProxy.style.top = (e.clientY - dragProxyGrab.y) + 'px';
    // 续期"逐帧重算"窗口：指针一直在动 → 拷贝一直贴着背后的背景
    flipRefract(400);
  }

  function stopDragProxy() {
    if (!dragProxy) return;
    if (dragProxy.parentNode) dragProxy.parentNode.removeChild(dragProxy);
    dragProxy.__lgLayer = null;
    dragProxy = null;
    if (engine) engine.prune();
  }

  /* =======================  存储  ======================= */

  var hasChromeStorage = false;
  try {
    hasChromeStorage = !!(window.chrome && chrome.storage && chrome.storage.local);
  } catch (e) { hasChromeStorage = false; }

  function readLocal() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeLocal(value) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return true;
    } catch (e) {
      toast('本地存储空间不足，建议改用更小的壁纸');
      return false;
    }
  }

  function loadStored(done) {
    if (!hasChromeStorage) { done(readLocal()); return; }
    try {
      chrome.storage.local.get([STORAGE_KEY], function (res) {
        var fromChrome = res && res[STORAGE_KEY];
        if (fromChrome) { done(fromChrome); return; }
        var local = readLocal();
        if (local) {
          try { var o = {}; o[STORAGE_KEY] = local; chrome.storage.local.set(o); } catch (e) { }
          done(local);
        } else {
          done(null);
        }
      });
    } catch (e) { done(readLocal()); }
  }

  var saveTimer = 0;
  function save(immediate) {
    var snapshot = state;
    // chrome.storage 可用时【不再镜像到 localStorage】：
    // localStorage 配额只有 ~5MB，几张壁纸的 DataURL 就能撑爆，
    // 于是「加壁纸」时弹出"本地存储空间不足"，而权威存储（chrome.storage）其实是好的。
    if (!hasChromeStorage) { writeLocal(snapshot); return; }
    clearTimeout(saveTimer);
    var push = function () {
      try {
        var o = {};
        o[STORAGE_KEY] = snapshot;
        chrome.storage.local.set(o, function () {
          if (chrome.runtime && chrome.runtime.lastError) {
            toast('保存失败：' + chrome.runtime.lastError.message);
          }
        });
      } catch (e) { }
    };
    if (immediate) push(); else saveTimer = setTimeout(push, 400);
  }

  /* =======================  状态  ======================= */

  var state = defaultData();
  var sel = { kind: 'tab', index: 0 };
  var dragCtx = null;
  var lastDragEnd = 0;
  var bgSample = null;
  var engine = null;

  /* =======================  DOM  ======================= */

  var bgLayer = $('bgLayer');
  var bgVignette = $('bgVignette');
  var bgVideo = $('bgVideo');
  var timeModule = $('timeModule');
  var timeDisplay = $('timeDisplay');
  var timeDate = $('timeDate');
  var searchModule = $('searchModule');
  var searchBox = $('searchBox');
  var searchInput = $('searchInput');
  var engineSwitcher = $('engineSwitcher');
  var panelsWrap = $('panels');
  var settingsBtn = $('settingsBtn');
  var settingsOverlay = $('settingsOverlay');
  var settingsPanel = $('settingsPanel');
  var modalMask = $('modalMask');
  var toastEl = $('toast');
  var importFile = $('importFile');

  /* =======================  提示  ======================= */

  var toastTimer = 0;
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, ms || 2200);
  }

  /* =======================  背景与主题  ======================= */

  function resolvedTheme() {
    var t = state.settings.theme;
    if (t === 'system') {
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return t === 'light' ? 'light' : (t === 'dark' ? 'dark' : 'liquid');
  }

  function bgGeometry() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var nat = state.settings.wallpaperNatural;
    if (state.settings.wallpaper && nat && nat.w > 0) {
      var s = Math.max(vw / nat.w, vh / nat.h);
      var w = nat.w * s, h = nat.h * s;
      return { mode: 'cover', w: w, h: h, x: (vw - w) / 2, y: (vh - h) / 2 };
    }
    return { mode: 'viewport', w: vw, h: vh, x: 0, y: 0 };
  }

  function currentBgImage() {
    var s = state.settings;
    if (s.wallpaper) return 'url("' + s.wallpaper + '")';
    return GRADIENTS[resolvedTheme()] || GRADIENTS.liquid;
  }

  function applyBackground() {
    if (isVideoWallpaper()) {
      // 动态壁纸：静态底图留在下面当海报（视频盖在上面），
      // 折射背景交给帧拷贝循环喂（见 feedTick）—— 视频没法直接当 background-image。
      setVar('--bg-image', currentBgImage());
      if (engine) engine.setBackground('', 'viewport', null);
      startFrameFeed();
      return;
    }
    stopFrameFeed();
    var img = currentBgImage();
    setVar('--bg-image', img);
    if (engine) {
      engine.setBackground(img, state.settings.wallpaper ? 'cover' : 'viewport',
        state.settings.wallpaper ? state.settings.wallpaperNatural : null);
    }
  }

  // 变量写入 body：body 的内联值优先于 .ui-light 中的同名声明，保证 JS 计算结果一定生效
  function setVar(name, value) {
    document.body.style.setProperty(name, value);
  }

  /* ---------- 亮度分析：字体颜色自动适配 ---------- */

  function analyzeBackground(cb) {
    var url = state.settings.wallpaper;
    if (!url) { bgSample = null; if (cb) cb(); return; }
    var img = new Image();
    img.onload = function () {
      // 采样图要够细：按钮/搜索框的逐个取色需要 ≥20 个采样点，
      // 原来 72px 宽在 1600px 视口下 1 像素≈22px，一个按钮只有 6×2 个点，太粗。
      var W = 320;
      var H = Math.max(8, Math.round(W * img.height / img.width));
      if (H > 420) { H = 420; W = Math.max(8, Math.round(H * img.width / img.height)); }
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      var ctx = cv.getContext('2d', { willReadFrequently: true });
      try {
        ctx.drawImage(img, 0, 0, W, H);
        bgSample = { w: W, h: H, data: ctx.getImageData(0, 0, W, H).data };
      } catch (e) { bgSample = null; }
      if (cb) cb();
    };
    img.onerror = function () { bgSample = null; if (cb) cb(); };
    img.src = url;
  }

  function sampleLum(x0, y0, x1, y1) {
    if (!bgSample) return null;
    var xs = clamp(Math.floor(x0), 0, bgSample.w - 1);
    var xe = clamp(Math.ceil(x1), 0, bgSample.w - 1);
    var ys = clamp(Math.floor(y0), 0, bgSample.h - 1);
    var ye = clamp(Math.ceil(y1), 0, bgSample.h - 1);
    if (xe <= xs || ye <= ys) return null;
    var total = 0, count = 0;
    for (var y = ys; y <= ye; y++) {
      for (var x = xs; x <= xe; x++) {
        var i = (y * bgSample.w + x) * 4;
        var r = bgSample.data[i] / 255, g = bgSample.data[i + 1] / 255, b = bgSample.data[i + 2] / 255;
        total += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        count++;
      }
    }
    return count ? total / count : null;
  }

  function viewportRectToSample(rect) {
    var box = bgGeometry();
    return {
      x0: (rect.left - box.x) * bgSample.w / box.w,
      y0: (rect.top - box.y) * bgSample.h / box.h,
      x1: (rect.right - box.x) * bgSample.w / box.w,
      y1: (rect.bottom - box.y) * bgSample.h / box.h
    };
  }

  function luminanceReport() {
    var theme = resolvedTheme();
    if (!bgSample) {
      // 无壁纸：按主题渐变推断
      if (theme === 'light') return { global: 0.9, local: 0.9 };
      return { global: 0.08, local: 0.08 };
    }
    var r = timeModule.getBoundingClientRect();
    var m = viewportRectToSample(r);
    var local = r.width > 4 ? sampleLum(m.x0, m.y0, m.x1, m.y1) : null;
    var global = sampleLum(0, 0, bgSample.w - 1, bgSample.h - 1);
    return {
      global: global == null ? 0.5 : global,
      local: local == null ? (global == null ? 0.5 : global) : local
    };
  }

  /* 明暗切换阈值（合成亮度 > 该值 → 用深色字） */
  var LUM_SWITCH = 0.62;
  var FG_ON_DARK = '#ffffff';   // 暗底上的字
  var FG_ON_LIGHT = '#16181f';  // 亮底上的字

  /* 玻璃面的填充色 rgba（与 applySettings 里写给 --glass-bg 的完全同一套算法） */
  function glassFill(lp, isLightUI) {
    lp = lp || {};
    var alpha = typeof lp.alpha === 'number' ? lp.alpha : 10;
    var tint = typeof lp.tint === 'number' ? lp.tint : 0;
    var veil = clamp(alpha / 100, 0, 0.6);
    if (isLightUI) veil = Math.max(veil, 0.30);
    var t = hexToRgb(lp.tintColor || '#ffffff');
    return {
      a: veil,
      r: 255 + (t[0] - 255) * tint,
      g: 255 + (t[1] - 255) * tint,
      b: 255 + (t[2] - 255) * tint
    };
  }

  /* 某个元素所在玻璃面的“实际底色亮度”：
     壁纸在该矩形下的平均亮度 × (1-veil) + 玻璃填充亮度 × veil。
     不能只看壁纸——玻璃自己叠了一层白纱，亮底会被进一步提亮。 */
  function elementLum(rect, fill) {
    var base = null;
    if (bgSample && rect && rect.width > 1 && rect.height > 1) {
      var m = viewportRectToSample(rect);
      base = sampleLum(m.x0, m.y0, m.x1, m.y1);
    }
    if (base == null) base = resolvedTheme() === 'light' ? 0.9 : 0.08;
    var fl = (0.2126 * fill.r + 0.7152 * fill.g + 0.0722 * fill.b) / 255;
    return base * (1 - fill.a) + fl * fill.a;
  }

  /* 逐元素上色：每个链接按钮名称、搜索框输入文字，各按自己脚下的底色选色。
     受「字体颜色 · 自动适配」开关（autoTimeColor）控制：
       开 → 自动按底色选深/浅；关 → 统一用用户设定的 timeColor。 */
  function applyElementColors(fill) {
    var s = state.settings;
    var auto = !!s.autoTimeColor;
    var fixed = s.timeColor || FG_ON_DARK;

    function setFg(el, lum, varName) {
      var fg = auto ? (lum > LUM_SWITCH ? FG_ON_LIGHT : FG_ON_DARK) : fixed;
      var inv = (fg === FG_ON_LIGHT) ? FG_ON_DARK : FG_ON_LIGHT;
      el.style.setProperty(varName, fg);
      el.style.setProperty('--auto-fg', fg);
      el.style.setProperty('--auto-fg-inv', inv);
      return fg;
    }

    var buttons = document.querySelectorAll('#panels .link-btn');
    Array.prototype.forEach.call(buttons, function (btn) {
      setFg(btn, elementLum(btn.getBoundingClientRect(), fill), '--link-fg');
    });

    var input = $('searchInput');
    if (input) {
      var box = (input.closest('.search-box') || input).getBoundingClientRect();
      setFg(input, elementLum(box, fill), '--search-fg');
    }
  }

  /* 重新算一遍玻璃填充色再上色（不改主题，用于渲染出新按钮后补色） */
  function refreshElementColors() {
    if (!state.settings || !state.settings.liquid) return;
    var lightUI = document.body.classList.contains('ui-light');
    applyElementColors(glassFill(state.settings.liquid, lightUI));
  }

  function applyContrast() {
    var s = state.settings;
    var rep = luminanceReport();
    // 明亮界面判定：浅色主题恒为亮；深色主题恒为暗；液态玻璃/跟随系统按背景明暗自动切换
    var lightUI;
    if (s.theme === 'light') lightUI = true;
    else if (s.theme === 'dark') lightUI = false;
    else lightUI = rep.global > LUM_SWITCH;
    document.body.classList.toggle('ui-light', !!lightUI);
    // ui-dark 只是标记类，与 ui-light 互斥，避免两个类同时挂着让人误判当前主题
    document.body.classList.toggle('ui-dark', !lightUI);
    // 主题本体（liquid / light / dark）另存在 data-theme 上：
    // 「液态玻璃」主题下设置面板/弹窗要用与主页面同一套液态玻璃材质，
    // 而 ui-light / ui-dark 只区分明暗、区分不出「液态玻璃」这一档。
    document.body.dataset.theme = resolvedTheme();

    // 时间文字颜色（按时间模块所在区域的亮度）
    var color = s.timeColor;
    if (s.autoTimeColor) color = rep.local > LUM_SWITCH ? FG_ON_LIGHT : FG_ON_DARK;
    setVar('--time-color', color);
    setVar('--time-shadow',
      color === FG_ON_DARK ? '0 4px 30px rgba(0,0,0,.40)' : '0 2px 20px rgba(255,255,255,.55)');

    // 链接按钮名称 / 搜索框输入文字：各自独立取色
    applyElementColors(glassFill(s.liquid, lightUI));
  }

  /* =======================  应用设置  ======================= */

  function applySettings() {
    var s = state.settings;

    applyBackground();

    // 布局尺寸
    setVar('--time-top', s.timeTop + 'vh');
    setVar('--search-top', s.searchTop + 'vh');
    setVar('--links-top', s.linksTop + 'vh');
    setVar('--time-size', s.timeSize + 'px');
    setVar('--time-weight', String(s.timeWeight));
    setVar('--time-letter', s.timeLetter + 'px');
    setVar('--time-font', s.timeFont);
    setVar('--links-w', s.linksWidth + 'px');
    setVar('--btn-w', s.btnWidth + 'px');
    setVar('--btn-h', s.btnHeight + 'px');
    setVar('--btn-r', s.btnRadius + 'px');
    setVar('--icon-r', s.iconRadius + '%');
    setVar('--btn-gap', s.btnGap + 'px');
    setVar('--btn-align', s.btnAlign === 'center' ? 'center' : 'flex-start');

    timeModule.classList.toggle('hidden', !s.showTime);

    // 高光显示：只是把 --nav-glint 置空，不动布局
    document.body.classList.toggle('glint-off', !s.showGlint);

    // 玻璃参数（明亮界面下抬高底线，避免白底上玻璃过淡）
    var lp = s.liquid;
    var isLightUI = document.body.classList.contains('ui-light');
    setVar('--glass-blur', (10 + lp.depth * 0.18).toFixed(1) + 'px');
    setVar('--glass-sat', (150 + lp.splay * 1.5).toFixed(0) + '%');

    var glintA = 0.12 + (lp.glint / 150) * 0.72;
    if (isLightUI) glintA = Math.max(glintA, 0.62);
    setVar('--glint-a', glintA.toFixed(3));

    var veilFill = glassFill(lp, isLightUI);
    setVar('--glass-bg', 'rgba(' + Math.round(veilFill.r) + ',' +
      Math.round(veilFill.g) + ',' + Math.round(veilFill.b) + ',' +
      veilFill.a.toFixed(3) + ')');

    // 折射引擎
    if (engine) {
      engine.setParams({
        depth: lp.depth, splay: lp.splay, feather: lp.feather, curve: lp.curve,
        blur: lp.blur, chroma: lp.chroma, glint: lp.glint,
        tint: lp.tint, tintColor: lp.tintColor, alpha: lp.alpha,
        refract: lp.refract && resolvedTheme() === 'liquid'
      });
    }

    // 搜索引擎
    Array.prototype.forEach.call(document.querySelectorAll('.engine-btn'), function (b) {
      b.classList.toggle('active', b.dataset.engine === state.engine);
    });
  }

  function hexToRgb(hex) {
    var h = String(hex || '#ffffff').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return [255, 255, 255];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /* =======================  时间  ======================= */

  function renderTime() {
    var now = new Date();
    var hh = String(now.getHours()).padStart(2, '0');
    var mm = String(now.getMinutes()).padStart(2, '0');
    var ss = String(now.getSeconds()).padStart(2, '0');
    timeDisplay.textContent = state.settings.showSeconds ? hh + ':' + mm + ':' + ss : hh + ':' + mm;
    var wd = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    timeDate.textContent = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + wd;
  }

  /* =======================  图标  ======================= */

  function faviconFor(url) {
    if (!url) return '';
    try {
      if (window.chrome && chrome.runtime && chrome.runtime.getURL) {
        return chrome.runtime.getURL('_favicon/?pageUrl=' + encodeURIComponent(url) + '&size=64');
      }
    } catch (e) { }
    return '';
  }

  function makeIconEl(link, cls) {
    var wrap = document.createElement('div');
    wrap.className = cls || 'link-icon';
    var letter = document.createElement('span');
    letter.className = 'fallback';
    var nm = String(link.name || '?').trim();
    letter.textContent = nm ? nm[0].toUpperCase() : '?';
    var src = link.icon || faviconFor(link.url);
    if (src) {
      letter.style.display = 'none';
      var img = document.createElement('img');
      img.alt = '';
      img.draggable = false;
      img.addEventListener('error', function () {
        if (img.parentNode) img.parentNode.removeChild(img);
        letter.style.display = 'flex';
      });
      img.src = src;
      wrap.appendChild(letter);
      wrap.appendChild(img);
    } else {
      wrap.appendChild(letter);
    }
    return wrap;
  }

  /* =======================  面板（每个面板 = 一块 <section class="links-module">）  ======================= */

  var ICON_ADD_CAT = '<svg viewBox="0 0 24 24"><path d="M3 5.5A2.5 2.5 0 0 1 5.5 3h4A2.5 2.5 0 0 1 12 5.5v13A2.5 2.5 0 0 1 9.5 21h-4A2.5 2.5 0 0 1 3 18.5v-13zm3 1.75a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5H6zM14 7h3V4h2v3h3v2h-3v3h-2V9h-3V7z"/></svg>';
  var ICON_ADD_LINK = '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
  var ICON_UP = '<svg viewBox="0 0 24 24"><path d="M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>';
  var ICON_DOWN = '<svg viewBox="0 0 24 24"><path d="M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
  var ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
  var ICON_ADD_PANEL = '<svg viewBox="0 0 24 24"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-1 9h-4v4h-2v-4H8v-2h4V6h2v4h4v2z"/></svg>';
  var ICON_DEL_PANEL = '<svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>';

  /* 面板工具条拆成两组：
     · INLINE_ACTS —— 常驻在分类条右侧的 .tab-actions 里（作用对象是"当前分类"）
     · SIDE_ACTS   —— 作用对象是【整个面板】的四颗（上移 / 下移 / 新增 / 删除），
       不属于"分类"那一行，所以放到导航条【外面】右侧 3px 的独立玻璃条 .nav-side 里，
       平时透明占位、悬停面板头时淡入（两者之间那 3px 空隙由 .panel-head::after
       的悬停桥覆盖，指针滑过去 hover 不会断）。顺序即视觉顺序：
       上移、下移在第 1、2 位，删除面板放最后。
       删除面板的悬停色**保持默认**（不加红色提醒）—— 用户明确取消了那条改动。 */
  var INLINE_ACTS = [
    { act: 'addCat', title: '新增类别', icon: ICON_ADD_CAT },
    { act: 'add', title: '添加链接', icon: ICON_ADD_LINK },
    { act: 'edit', title: '修改分类与图标', icon: ICON_EDIT }
  ];
  var SIDE_ACTS = [
    { act: 'up', title: '上移面板', icon: ICON_UP },
    { act: 'down', title: '下移面板', icon: ICON_DOWN },
    { act: 'addPanel', title: '新增面板', icon: ICON_ADD_PANEL },
    { act: 'delPanel', title: '删除此面板', icon: ICON_DEL_PANEL }
  ];
  // 初始就隐藏的：位置/数量定下来之前先不显示，避免首帧闪一下
  var ACTS_HIDDEN_AT_FIRST = { up: 1, down: 1, delPanel: 1 };

  function makeActionBtn(a) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'icon-btn' + (ACTS_HIDDEN_AT_FIRST[a.act] ? ' hidden' : '');
    b.dataset.act = a.act;
    b.title = a.title;
    b.innerHTML = a.icon;
    return b;
  }

  var panelEls = [];   // 与 state.panels 一一对应

  function createPanelEl() {
    var section = document.createElement('section');
    section.className = 'links-module';

    // 面板头：分类导航条 + 右侧外挂的操作条，两者由 CSS 拉成等高
    var head = document.createElement('div');
    head.className = 'panel-head';

    var nav = document.createElement('div');
    nav.className = 'tab-nav glass';

    var list = document.createElement('div');
    list.className = 'tab-list';

    var actions = document.createElement('div');
    actions.className = 'tab-actions';
    INLINE_ACTS.forEach(function (a) { actions.appendChild(makeActionBtn(a)); });

    nav.appendChild(list);
    nav.appendChild(actions);

    // 外挂操作条：在导航条外面右侧 3px，同款玻璃条（也挂进折射引擎）
    var side = document.createElement('div');
    side.className = 'nav-side glass';
    SIDE_ACTS.forEach(function (a) { side.appendChild(makeActionBtn(a)); });

    head.appendChild(nav);
    head.appendChild(side);
    enableWheelTabs(nav, list);

    var grid = document.createElement('div');
    grid.className = 'links-grid';

    section.appendChild(head);
    section.appendChild(grid);
    panelsWrap.appendChild(section);

    return {
      section: section, panelHead: head, tabNav: nav, tabList: list,
      tabActions: actions, navSide: side, linksGrid: grid
    };
  }

  /* 让 DOM 中面板的数量与上下顺序和 state.panels 保持一致 */
  function syncPanelEls() {
    var prevRects = captureRects(panelsWrap);
    while (panelEls.length > state.panels.length) {
      var dead = panelEls.pop();
      if (dead.section.parentNode) dead.section.parentNode.removeChild(dead.section);
    }
    while (panelEls.length < state.panels.length) {
      panelEls.push(createPanelEl());
    }
    var reorder = false;
    panelEls.forEach(function (pe, i) {
      if (panelsWrap.children[i] !== pe.section) reorder = true;
    });
    if (reorder) panelEls.forEach(function (pe) { panelsWrap.appendChild(pe.section); });
    updatePanelIndexes();
    playFlip(panelsWrap, prevRects);
  }

  function updatePanelIndexes() {
    panelEls.forEach(function (pe, i) {
      pe.section.dataset.panel = i;
      pe.section.dataset.flipKey = (state.panels[i] && state.panels[i]._id) || ('p' + i);
      updateNavButtons(i);
    });
  }

  function panelOf(el) {
    var sec = (el && el.closest) ? el.closest('.links-module') : null;
    if (!sec) return -1;
    var n = parseInt(sec.dataset.panel, 10);
    return isNaN(n) ? -1 : n;
  }

  function renderAllPanels() {
    syncPanelEls();
    state.panels.forEach(function (p, i) { renderTabs(i); renderLinks(i); });
  }

  /* 鼠标在分类条上滚动 → 分类列表左右滚动（到两端时交还给页面滚动）
     注意：.tab-list 的 scroll-behavior 是 smooth，直接赋值 scrollLeft 会被
     平滑动画接管（每格滚轮都会重启动画，手感发飘且读取时位移为 0），
     所以这里必须显式用 behavior:'instant' 做 1:1 跟手滚动。 */
  function scrollListBy(list, d) {
    var max = list.scrollWidth - list.clientWidth;
    if (max <= 1) return false;
    var next = clamp(list.scrollLeft + d, 0, max);
    if (next === list.scrollLeft) return false;
    if (list.scrollTo) {
      try { list.scrollTo({ left: next, behavior: 'instant' }); return true; }
      catch (err) { /* 老内核回退 */ }
    }
    var prev = list.style.scrollBehavior;
    list.style.scrollBehavior = 'auto';
    list.scrollLeft = next;
    list.style.scrollBehavior = prev;
    return true;
  }

  function enableWheelTabs(nav, list) {
    nav.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!d) return;
      // 能滚就横向吃掉这次滚动，不能滚（到两端/无溢出）则交还给页面纵向滚动
      if (scrollListBy(list, d)) e.preventDefault();
    }, { passive: false });
  }

  /* =======================  分类标签  ======================= */

  function renderTabs(pi) {
    var pe = panelEls[pi], panel = state.panels[pi];
    if (!pe || !panel) return;
    var prevRects = captureRects(pe.tabList);
    pe.tabList.textContent = '';
    panel.tabs.forEach(function (tab, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab-item' + (i === panel.activeTab ? ' active' : '');
      b.draggable = true;
      b.dataset.index = i;
      b.dataset.flipKey = tab._id || ('i' + i);
      b.title = tab.name + '（可拖动排序，双击重命名）';

      if (tab.icon) {
        var ic = document.createElement('span');
        ic.className = 'tab-emoji';
        if (isEmojiLike(tab.icon)) {
          ic.textContent = tab.icon;
        } else {
          var im = document.createElement('img');
          im.src = tab.icon; im.alt = '';
          im.addEventListener('error', function () { ic.textContent = ''; });
          ic.appendChild(im);
        }
        b.appendChild(ic);
      }
      var nm = document.createElement('span');
      nm.className = 'tab-name';
      nm.textContent = tab.name;
      b.appendChild(nm);

      // 面板会被上移/下移/新增，序号必须实时从 DOM 取，不能闭包捕获
      b.addEventListener('click', function () { activateTab(panelOf(b), parseInt(b.dataset.index, 10)); });
      b.addEventListener('dblclick', function (e) {
        e.preventDefault();
        editTabModal(panelOf(b), parseInt(b.dataset.index, 10));
      });
      pe.tabList.appendChild(b);
    });
    playFlip(pe.tabList, prevRects);
    updateNavButtons(pi);
    // 分类标签重建过（旧节点被 prune、新节点要挂折射层），交给 refreshGlass 统一处理
    refreshGlass();
  }

  /* 面板位于第一层时不显示"上移"，位于最下层时不显示"下移"，只剩一个面板时
     不显示"删除此面板"。这三颗按钮现在都在绝对定位的 .nav-side 里，
     所以统一从 section 整棵子树里查，不要写死某一个容器。

     另外要把操作条的**实际宽度**写进 --nav-side-w：.nav-side 挂在导航条
     外面右侧 3px，right 取 -(自身宽度 + 3px)，而 CSS 的 right 百分比/计算式
     拿不到"自身宽度"，只能由 JS 量一次告诉它。宽度一变（比如多个面板时多出
     "上移/下移"）位置就要跟着变，所以每次更新按钮显隐后都要重新写一遍。

     ⚠️ 外挂的前提是视口右侧真的有空地。当「区域宽度」被容器夹住时，
     .links-module 右边缘离视口只剩 .main 的 24px 内边距 —— 装不下 3px 间隙 +
     一条 48~122px 的操作条，右半截会被 .main 的 overflow-x:hidden 沿视口右缘截掉。
     这种情况（.side-inside）就退回"收回导航条内部 + 导航条让出右内边距"的老方案。 */
  function updateNavButtons(pi) {
    var pe = panelEls[pi];
    if (!pe) return;
    var sec = pe.section;
    var up = sec.querySelector('[data-act="up"]');
    var down = sec.querySelector('[data-act="down"]');
    var del = sec.querySelector('[data-act="delPanel"]');
    var total = state.panels.length;
    if (up) up.classList.toggle('hidden', pi <= 0);
    if (down) down.classList.toggle('hidden', pi >= total - 1);
    if (del) del.classList.toggle('hidden', total <= 1);
    var side = sec.querySelector('.nav-side');
    if (!side) return;
    // 先量宽度再判断：offsetWidth 只取决于内容，不受 right 取值影响，所以不会来回抖
    var w = side.offsetWidth;
    sec.style.setProperty('--nav-side-w', w + 'px');
    var head = sec.querySelector('.panel-head');
    var hr = head ? head.getBoundingClientRect() : null;
    var room = hr ? (document.documentElement.clientWidth - hr.right) : 0;
    // 留 2px 容差；宽度为 0（首帧还没排完）时不切，等下一次量准了再说
    sec.classList.toggle('side-inside', w > 0 && room < w + 3 + 2);
  }

  function scrollTabIntoView(pi, i) {
    var pe = panelEls[pi];
    if (!pe) return;
    var el = pe.tabList.querySelector('.tab-item[data-index="' + i + '"]');
    if (!el) return;
    try { el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); }
    catch (e) { el.scrollIntoView(false); }
  }

  function activateTab(pi, i) {
    var panel = state.panels[pi];
    if (!panel || i < 0 || i >= panel.tabs.length) return;
    panel.activeTab = i;
    save();
    renderTabs(pi);
    renderLinks(pi);
    scrollTabIntoView(pi, i);
  }

  // 面板与链接按钮都不再有虚线选中环（保持默认样式），sel 仅作内部状态记录
  function setSel(kind, index) {
    sel = { kind: kind, index: index };
  }

  /* =======================  链接按钮  ======================= */

  function renderLinks(pi) {
    var pe = panelEls[pi], panel = state.panels[pi];
    if (!pe) return;
    var prevRects = captureRects(pe.linksGrid);
    var tab = panel && panel.tabs[panel.activeTab];
    pe.linksGrid.textContent = '';
    if (!tab) {
      var empty = document.createElement('div');
      empty.className = 'empty-links';
      empty.textContent = '请先新建一个类别';
      pe.linksGrid.appendChild(empty);
      refreshGlass();
      return;
    }

    var links = tab.links || [];
    links.forEach(function (link, i) {
      var a = document.createElement('a');
      a.className = 'link-btn glass';
      a.href = link.url || '#';
      a.draggable = true;
      a.dataset.index = i;
      a.dataset.flipKey = link._id || ('i' + i);
      a.title = link.url || '';

      // 悬浮时在右上角显示「修改」小按钮。
      // 删除不放在这里：右上角那颗删除太容易误点（而且和「修改」挤在一起），
      // 统一收进「修改链接」弹窗的右上角（见 editLinkModal）。
      var actions = document.createElement('div');
      actions.className = 'link-actions';
      var edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'mini-btn';
      edit.title = '修改';
      edit.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
      actions.appendChild(edit);
      a.appendChild(actions);

      a.appendChild(makeIconEl(link, 'link-icon'));

      var nm = document.createElement('div');
      nm.className = 'link-name';
      nm.textContent = link.name;
      a.appendChild(nm);

      edit.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        editLinkModal(panelOf(a), parseInt(a.dataset.index, 10));
      });
      a.addEventListener('click', function (e) {
        if (Date.now() - lastDragEnd < 250) { e.preventDefault(); return; }
        if (!link.url) e.preventDefault();
      });

      pe.linksGrid.appendChild(a);
    });

    // 网格里不再有末尾的「+ 添加链接」格子：添加链接统一走分类条上的 + 按钮
    // （.tab-actions 的 [data-act="add"]），少一个入口也就少一份误点。

    playFlip(pe.linksGrid, prevRects);
    refreshGlass();
    // 新渲染出来的按钮要按各自底色补上文字颜色
    refreshElementColors();
  }

  /* =======================  拖动排序（面板内分类 / 链接，事件委托在容器上）  ======================= */

  var DND_SEL = '.tab-item, .link-btn';

  function dndKindOf(item) {
    return item && item.classList.contains('tab-item') ? 'tab' : 'link';
  }

  function setupDnD() {
    panelsWrap.addEventListener('dragstart', function (e) {
      var item = e.target.closest(DND_SEL);
      if (!item) return;
      var pi = panelOf(item);
      if (pi < 0) return;
      dragCtx = { kind: dndKindOf(item), panel: pi, index: parseInt(item.dataset.index, 10) };
      item.classList.add('dragging');
      try {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(dragCtx.index));
      } catch (err) { }
      // 把原生那张"冻住背景"的幽灵换成跟着指针走、逐帧重算折射的代理
      startDragProxy(item, e);
    });

    panelsWrap.addEventListener('dragover', function (e) {
      if (!dragCtx) return;
      var item = e.target.closest(DND_SEL);
      if (!item) return;
      if (panelOf(item) !== dragCtx.panel || dndKindOf(item) !== dragCtx.kind) return;
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch (err) { }
      Array.prototype.forEach.call(item.parentNode.querySelectorAll('.drag-over'), function (el) {
        el.classList.remove('drag-over');
      });
      item.classList.add('drag-over');
    });

    panelsWrap.addEventListener('dragleave', function (e) {
      var item = e.target.closest(DND_SEL);
      if (item) item.classList.remove('drag-over');
    });

    panelsWrap.addEventListener('drop', function (e) {
      if (!dragCtx) return;
      var item = e.target.closest(DND_SEL);
      if (!item) return;
      var pi = panelOf(item);
      if (pi !== dragCtx.panel || dndKindOf(item) !== dragCtx.kind) return;
      e.preventDefault();
      var to = parseInt(item.dataset.index, 10);
      var from = dragCtx.index;
      var kind = dragCtx.kind;
      dragCtx = null;
      lastDragEnd = Date.now();
      if (from === to) { cleanupDrag(); return; }
      var panel = state.panels[pi];
      if (!panel) { cleanupDrag(); return; }
      if (kind === 'tab') {
        var moved = panel.tabs.splice(from, 1)[0];
        panel.tabs.splice(to, 0, moved);
        panel.activeTab = to;
        save();
        renderTabs(pi);
        renderLinks(pi);
      } else {
        var tab = panel.tabs[panel.activeTab];
        if (tab) {
          var lm = tab.links.splice(from, 1)[0];
          tab.links.splice(to, 0, lm);
          save();
          renderLinks(pi);
        }
      }
      cleanupDrag();
    });

    panelsWrap.addEventListener('dragend', function () {
      if (dragCtx) lastDragEnd = Date.now();
      dragCtx = null;
      cleanupDrag();
      stopDragProxy();
    });

    // 代理要跟着指针走：dragover 在整个拖拽期间持续触发（不限于面板区域内），
    // 所以挂在 document 上。每来一次就把"逐帧重算折射"的窗口往后续一段 ——
    // 指针不动时窗口自然过期，也就没必要继续空转。
    document.addEventListener('dragover', function (e) { moveDragProxy(e); });
    document.addEventListener('dragend', stopDragProxy);
    document.addEventListener('drop', stopDragProxy);
  }

  function cleanupDrag() {
    Array.prototype.forEach.call(document.querySelectorAll('.dragging, .drag-over'), function (el) {
      el.classList.remove('dragging');
      el.classList.remove('drag-over');
    });
  }

  /* =======================  面板：上移 / 下移 / 新增 / 删除  ======================= */

  /* 上移 / 下移：改变当前面板与上下相邻面板的相对位置（整个面板一起搬） */
  function movePanel(pi, dir) {
    if (pi < 0 || pi >= state.panels.length) return;
    var to = pi + dir;
    if (to < 0) { toast('已经在最上层'); return; }
    if (to >= state.panels.length) { toast('已经在最下层'); return; }
    var movedP = state.panels.splice(pi, 1)[0];
    state.panels.splice(to, 0, movedP);
    var movedEl = panelEls.splice(pi, 1)[0];
    panelEls.splice(to, 0, movedEl);
    syncPanelEls();            // 重排 DOM 顺序并播放位移动画
    save();
    var sec = movedEl && movedEl.section;
    if (sec && sec.scrollIntoView) {
      try { sec.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) { }
    }
  }

  /* 新增面板：在当前面板下方插入一块同类的 links-module 面板 */
  function addPanel(pi) {
    var at = (pi < 0 ? state.panels.length - 1 : pi) + 1;
    state.panels.splice(at, 0, {
      _id: uid('p'),
      activeTab: 0,
      tabs: [{ _id: uid('t'), name: '新分类', icon: '⭐', links: [] }]
    });
    panelEls.splice(at, 0, createPanelEl());
    syncPanelEls();
    renderTabs(at);
    renderLinks(at);
    save();
  }

  function removePanel(pi) {
    if (state.panels.length <= 1) { toast('至少要保留一个面板'); return; }
    var panel = state.panels[pi];
    if (!panel) return;
    var body = document.createElement('div');
    body.style.cssText = 'font-size:13.5px;line-height:1.7;opacity:.85';
    body.textContent = '确定删除这个面板吗？面板下的 ' + panel.tabs.length +
      ' 个分类、' + countLinks(panel) + ' 个链接会一并删除。';
    openModal('删除面板', body, '删除', function () {
      state.panels.splice(pi, 1);
      var dead = panelEls.splice(pi, 1)[0];
      if (dead && dead.section.parentNode) dead.section.parentNode.removeChild(dead.section);
      renderAllPanels();
      save();
    });
  }

  function countLinks(panel) {
    var n = 0;
    (panel.tabs || []).forEach(function (t) { n += (t.links || []).length; });
    return n;
  }

  /* 面板工具条统一入口 */
  function handlePanelAction(pi, act) {
    var panel = state.panels[pi];
    if (pi < 0 || !panel) return;
    if (act === 'addCat') editTabModal(pi, null);
    else if (act === 'add') addLinkModal(pi);
    else if (act === 'edit') editTabModal(pi, panel.activeTab);
    else if (act === 'up') movePanel(pi, -1);
    else if (act === 'down') movePanel(pi, 1);
    else if (act === 'addPanel') addPanel(pi);
    else if (act === 'delPanel') removePanel(pi);
  }

  /* =======================  弹窗  ======================= */

  var modalCloser = null;
  var modalCloseTimer = 0;

  /* headAction（可选）：{ text, onClick, className } —— 渲染在标题右上角、
     与标题同一行且顶部对齐。用于「修改链接」弹窗里的「删除链接」：
     破坏性操作用一颗文字按钮挂在头部，比塞进底部按钮列更显眼、也不容易误点。 */
  function openModal(title, bodyEl, submitText, onSubmit, headAction) {
    closeModal();
    // 取消上一次关闭动作的延迟清理，避免它把刚打开的新弹窗一起清掉
    clearTimeout(modalCloseTimer);
    modalMask.textContent = '';
    modalMask.hidden = false;

    var modal = document.createElement('div');
    modal.className = 'modal';
    var head = document.createElement('div');
    head.className = 'modal-head';
    var h = document.createElement('h3');
    h.textContent = title;
    head.appendChild(h);
    if (headAction) {
      var ha = document.createElement('button');
      ha.type = 'button';
      ha.className = headAction.className || 'btn danger sm';
      ha.textContent = headAction.text;
      ha.addEventListener('click', function () { headAction.onClick(); });
      head.appendChild(ha);
    }
    modal.appendChild(head);
    modal.appendChild(bodyEl);

    var foot = document.createElement('div');
    foot.className = 'modal-foot';
    var cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn';
    cancel.textContent = '取消';
    var ok = document.createElement('button');
    ok.type = 'button';
    ok.className = 'btn primary';
    ok.textContent = submitText || '确定';
    foot.appendChild(cancel);
    foot.appendChild(ok);
    modal.appendChild(foot);
    modalMask.appendChild(modal);

    cancel.addEventListener('click', closeModal);
    ok.addEventListener('click', function () {
      if (onSubmit() !== false) closeModal();
    });
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'BUTTON' && e.target.type !== 'color') {
        e.preventDefault();
        if (onSubmit() !== false) closeModal();
      }
    });

    requestAnimationFrame(function () { modalMask.classList.add('show'); });
    modalCloser = closeModal;

    var first = modal.querySelector('input.text-input, input');
    if (first) setTimeout(function () { first.focus(); first.select && first.select(); }, 60);
    return modal;
  }

  function closeModal() {
    if (modalMask.hidden) return;
    modalMask.classList.remove('show');
    modalCloser = null;
    clearTimeout(modalCloseTimer);
    modalCloseTimer = setTimeout(function () {
      modalMask.hidden = true;
      modalMask.textContent = '';
    }, 200);
  }

  modalMask.addEventListener('mousedown', function (e) {
    if (e.target === modalMask) closeModal();
  });

  function field(labelText, inputEl) {
    var row = document.createElement('div');
    row.className = 'row';
    var lb = document.createElement('label');
    lb.textContent = labelText;
    var ctrl = document.createElement('div');
    ctrl.className = 'ctrl';
    ctrl.appendChild(inputEl);
    row.appendChild(lb);
    row.appendChild(ctrl);
    return row;
  }

  function textInput(value, placeholder) {
    var i = document.createElement('input');
    i.type = 'text';
    i.className = 'text-input';
    i.value = value || '';
    if (placeholder) i.placeholder = placeholder;
    return i;
  }

  /* ---------- 链接编辑 ---------- */

  function linkEditorBody(link) {
    var body = document.createElement('div');
    var iconValue = link.icon || '';

    // placeholder 一律留空：输入框里的灰字（尤其是 "https://"）容易被误当成已填内容。
    var nameInput = textInput(link.name);
    var urlInput = textInput(link.url);
    body.appendChild(field('名称', nameInput));
    body.appendChild(field('网址', urlInput));

    var editor = document.createElement('div');
    editor.className = 'icon-editor';
    var preview = document.createElement('div');
    preview.className = 'icon-preview';
    var stack = document.createElement('div');
    stack.className = 'stack';
    var row1 = document.createElement('div');
    row1.className = 'mini-row';
    var pick = document.createElement('button');
    pick.type = 'button'; pick.className = 'btn'; pick.textContent = '上传图片';
    var clear = document.createElement('button');
    clear.type = 'button'; clear.className = 'btn'; clear.textContent = '清除';
    row1.appendChild(pick); row1.appendChild(clear);
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.className = 'file-input';
    stack.appendChild(row1);
    stack.appendChild(fileInput);
    editor.appendChild(preview);
    editor.appendChild(stack);
    body.appendChild(editor);

    function paintPreview() {
      preview.textContent = '';
      var raw = urlInput.value.trim();
      var src = (iconValue === '#none' ? '' : iconValue) || (raw ? faviconFor(normalizeUrl(raw)) : '');
      if (src) {
        var im = document.createElement('img');
        im.alt = '';
        im.addEventListener('error', function () {
          preview.textContent = (nameInput.value || '?').trim()[0] || '?';
        });
        im.src = src;
        preview.appendChild(im);
      } else {
        preview.textContent = (nameInput.value || '?').trim()[0] || '?';
      }
    }

    nameInput.addEventListener('input', paintPreview);
    urlInput.addEventListener('input', paintPreview);
    urlInput.addEventListener('blur', paintPreview);
    paintPreview();

    pick.addEventListener('click', function () { fileInput.click(); });
    // 未上传图片时（iconValue 为空）paintPreview 会自动使用网站图标。
    clear.addEventListener('click', function () {
      iconValue = '#none';
      preview.textContent = (nameInput.value || '?').trim()[0] || '?';
    });
    fileInput.addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function (ev) { iconValue = ev.target.result; paintPreview(); };
      rd.readAsDataURL(f);
    });

    return {
      body: body,
      read: function () {
        return {
          name: nameInput.value.trim() || '新链接',
          // 提示语已去掉 "https://"，用户通常直接输 "bilibili.com"，这里补全协议。
          url: normalizeUrl(urlInput.value.trim()),
          icon: iconValue === '#none' ? '' : iconValue
        };
      }
    };
  }

  /* 裸域名补 https://；已经是 scheme: / 绝对路径 / 锚点的原样保留 */
  function normalizeUrl(u) {
    if (!u) return 'https://';
    if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.charAt(0) === '/' || u.charAt(0) === '#') return u;
    return 'https://' + u;
  }

  function activeTabOf(pi) {
    var panel = state.panels[pi];
    return panel ? panel.tabs[panel.activeTab] : null;
  }

  function addLinkModal(pi) {
    var tab = activeTabOf(pi);
    if (!tab) { toast('请先新建一个类别'); return; }
    var ui = linkEditorBody({ name: '', url: '', icon: '' });
    openModal('添加链接', ui.body, '添加', function () {
      var v = ui.read();
      v._id = uid('l');
      tab.links.push(v);
      save();
      renderLinks(pi);
    });
  }

  function editLinkModal(pi, index) {
    var tab = activeTabOf(pi);
    if (!tab || !tab.links[index]) return;
    var ui = linkEditorBody(tab.links[index]);
    openModal('修改链接', ui.body, '保存', function () {
      var v = ui.read();
      v._id = tab.links[index]._id || uid('l');
      tab.links[index] = v;
      save();
      renderLinks(pi);
    }, {
      // 头部右上角、与「修改链接」标题同一行（顶部对齐）
      text: '删除链接',
      className: 'btn danger sm',
      onClick: function () { closeModal(); removeLink(pi, index); }
    });
  }

  function removeLink(pi, index) {
    var tab = activeTabOf(pi);
    if (!tab || !tab.links[index]) return;
    var link = tab.links[index];
    var body = document.createElement('div');
    body.style.cssText = 'font-size:13.5px;line-height:1.7;opacity:.85';
    body.textContent = '确定删除「' + link.name + '」吗？';
    openModal('删除链接', body, '删除', function () {
      tab.links.splice(index, 1);
      save();
      renderLinks(pi);
    });
  }

  /* ---------- 分类编辑 ---------- */

  var EMOJI_LIST = ['⭐', '🔥', '📌', '🧰', '🛠', '💻', '🎬', '🎵', '📚', '🛒', '🎮', '☁️', '📊', '🧠', '🌐', '❤️'];

  function editTabModal(pi, index) {
    var panel = state.panels[pi];
    if (!panel) return;
    var isNew = index === null || index === undefined || !panel.tabs[index];
    var tab = isNew ? { name: '新分类', icon: '⭐', links: [] } : panel.tabs[index];
    var body = document.createElement('div');

    var nameInput = textInput(tab.name, '分类名称');
    body.appendChild(field('名称', nameInput));

    var iconInput = textInput(tab.icon || '', '表情符号或图片地址');
    body.appendChild(field('图标', iconInput));

    var picks = document.createElement('div');
    picks.className = 'emoji-picks';
    EMOJI_LIST.forEach(function (em) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'emoji-pick';
      b.textContent = em;
      b.addEventListener('click', function () { iconInput.value = em; });
      picks.appendChild(b);
    });
    body.appendChild(picks);

    openModal(isNew ? '新增类别' : '修改分类与图标', body, isNew ? '创建' : '保存', function () {
      var name = nameInput.value.trim() || '新分类';
      var icon = iconInput.value.trim();
      if (isNew) {
        // 新类别插在当前类别后面
        var at = clamp(panel.activeTab, 0, panel.tabs.length - 1) + 1;
        panel.tabs.splice(at, 0, { name: name, icon: icon, links: [], _id: uid('t') });
        panel.activeTab = at;
      } else {
        panel.tabs[index].name = name;
        panel.tabs[index].icon = icon;
      }
      save();
      renderTabs(pi);
      renderLinks(pi);
      scrollTabIntoView(pi, panel.activeTab);
    }, isNew ? null : {
      text: '删除类别',
      onClick: function () { closeModal(); removeTab(pi, index); }
    });
  }

  function removeTab(pi, index) {
    var panel = state.panels[pi];
    if (!panel || !panel.tabs[index]) return;
    if (panel.tabs.length <= 1) { toast('每个面板至少要保留一个类别'); return; }
    var tab = panel.tabs[index];
    var count = (tab.links && tab.links.length) || 0;
    // 空类别没有损失，直接删除，不弹确认窗
    if (count === 0) { doRemoveTab(pi, index); return; }
    var body = document.createElement('div');
    body.style.cssText = 'font-size:13.5px;line-height:1.7;opacity:.85';
    body.textContent = '确定删除类别「' + tab.name + '」吗？该类别下的 ' +
      count + ' 个链接会一并删除。';
    openModal('删除类别', body, '删除', function () { doRemoveTab(pi, index); });
  }

  function doRemoveTab(pi, index) {
    var panel = state.panels[pi];
    if (!panel || !panel.tabs[index]) return;
    panel.tabs.splice(index, 1);
    if (panel.activeTab > index) panel.activeTab--;
    panel.activeTab = clamp(panel.activeTab, 0, panel.tabs.length - 1);
    save();
    renderTabs(pi);
    renderLinks(pi);
  }

  /* =======================  玻璃层维护  ======================= */

  function refreshGlass() {
    if (!engine) return;
    engine.prune();
    engine.attach(settingsBtn);
    engine.attach(searchBox);
    // 搜索模块里的引擎切换胶囊 + 三颗引擎按钮：交互态是液态玻璃，
    // 所以也要挂折射层（.engine-btn 的折射层由 CSS 控制 opacity，只在 hover/选中显形）
    engine.attach(engineSwitcher);
    Array.prototype.forEach.call(document.querySelectorAll('.engine-btn'), function (el) {
      engine.attach(el);
    });
    panelEls.forEach(function (pe) {
      engine.attach(pe.tabNav);
      // 右侧外挂的面板级操作条也是一块玻璃，跟导航条一起挂折射
      engine.attach(pe.navSide);
      // 分类标签：hover/选中是液态玻璃（同样靠 CSS 控 opacity）
      Array.prototype.forEach.call(pe.tabList.querySelectorAll('.tab-item'), function (el) {
        engine.attach(el);
      });
      // 链接按钮同为 .glass，一起加折射层
      Array.prototype.forEach.call(pe.linksGrid.querySelectorAll('.link-btn'), function (el) {
        engine.attach(el);
      });
    });
  }

  /* =======================  搜索引擎  ======================= */

  var ENGINES = {
    baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' },
    bing: { name: '必应', url: 'https://www.bing.com/search?q=' },
    google: { name: 'Google', url: 'https://www.google.com/search?q=' }
  };

  function doSearch() {
    var q = searchInput.value.trim();
    if (!q) return;
    if (/^(https?:\/\/|localhost[:/]|[^\s]+\.[a-z]{2,}(\/|$))/i.test(q) && !/\s/.test(q)) {
      window.location.href = /^https?:\/\//i.test(q) ? q : 'https://' + q;
      return;
    }
    var e = ENGINES[state.engine] || ENGINES.baidu;
    window.location.href = e.url + encodeURIComponent(q);
  }

  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
  });

  engineSwitcher.addEventListener('click', function (e) {
    var b = e.target.closest('.engine-btn');
    if (!b) return;
    state.engine = b.dataset.engine;
    save();
    applySettings();
  });

  /* =======================  设置面板  ======================= */

  /* 设置面板内的三页：settings / liquid / carousel，共用同一套宽高与风格 */
  function setPage(name) {
    settingsPanel.dataset.page = name;
    if (name === 'carousel') {
      renderCarousel();
      syncCarouselUI();
    }
    syncUI();
  }

  /* 面板的显示/隐藏用 opacity 过渡，DOM 始终在文档里，所以关闭态必须主动
     切断可聚焦性。过去用 aria-hidden="true"：它只把子树从无障碍树摘掉，
     里面的 <button> 依然能被 Tab 聚焦 —— 关闭瞬间焦点还停在 #settingsClose 上，
     Chrome 就会报 "Blocked aria-hidden on an element because its descendant
     retained focus"。改用 inert：既摘出无障碍树，又真正不可聚焦、不可点击。 */
  function openSettings() {
    // 必须先把 inert 摘掉：还带着 inert 时面板整体不可聚焦，任何 focus() 都会被忽略
    settingsOverlay.removeAttribute('inert');
    settingsOverlay.classList.add('open');
    settingsBtn.classList.add('active');
    syncUI();
    applyContrast();
    applySettings();
  }

  function closeSettings() {
    settingsOverlay.classList.remove('open');
    // 焦点要先从面板里退出来：若把焦点关在 inert 子树里，浏览器会把它丢回 <body>，
    // 键盘用户下次按 Tab 就得从页面开头重新走。还给设置按钮最符合直觉。
    if (settingsOverlay.contains(document.activeElement)) {
      try { settingsBtn.focus({ preventScroll: true }); } catch (e) { settingsBtn.focus(); }
    }
    settingsOverlay.setAttribute('inert', '');
    settingsBtn.classList.remove('active');
    settingsPanel.dataset.page = 'settings';
    setTimeout(function () {
      applyContrast();
      applySettings();
    }, 220);
  }

  settingsBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (settingsOverlay.classList.contains('open')) closeSettings(); else openSettings();
  });
  $('settingsClose').addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('mousedown', function (e) {
    if (e.target === settingsOverlay) closeSettings();
  });

  $('openLiquidPage').addEventListener('click', function () { setPage('liquid'); });
  $('liquidBack').addEventListener('click', function () { setPage('settings'); });
  $('liquidClose').addEventListener('click', closeSettings);

  $('openCarousel').addEventListener('click', function () { setPage('carousel'); });
  $('carouselBack').addEventListener('click', function () { setPage('settings'); });
  $('carouselClose').addEventListener('click', closeSettings);

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!modalMask.hidden) { closeModal(); return; }
    if (settingsOverlay.classList.contains('open')) {
      if (settingsPanel.dataset.page !== 'settings') setPage('settings');
      else closeSettings();
    }
  });

  // 任意输入自动聚焦搜索框
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape' || e.key === 'Tab' || e.key === 'Enter') return;
    if (!modalMask.hidden) return;
    if (settingsOverlay.classList.contains('open')) return;
    var a = document.activeElement;
    if (a && (a.tagName === 'INPUT' || a.tagName === 'SELECT' || a.isContentEditable)) return;
    if (e.key.length === 1) searchInput.focus();
  });

  /* =======================  设置面板 UI 同步  ======================= */

  function bindRange(id, key, fmt, after) {
    var el = $(id), val = $(id + 'Val');
    el.addEventListener('input', function () {
      var v = parseFloat(el.value);
      state.settings[key] = v;
      if (val) val.textContent = fmt ? fmt(v) : v;
      if (key === 'btnWidth' || key === 'btnHeight') syncRadiusLimit();
      save();
      applySettings();
      if (after) after(v);
    });
  }

  function bindSwitch(id, key, after) {
    var el = $(id);
    el.addEventListener('click', function () {
      state.settings[key] = !state.settings[key];
      el.classList.toggle('on', !!state.settings[key]);
      el.setAttribute('aria-checked', String(!!state.settings[key]));
      save();
      applySettings();
      if (after) after();
    });
  }

  function bindLiquidRange(id, key, after) {
    var el = $(id), val = $(id + 'Val');
    el.addEventListener('input', function () {
      state.settings.liquid[key] = parseFloat(el.value);
      if (val) val.textContent = el.value;
      save();
      applySettings();
      if (after) after();
    });
  }

  function syncRadiusLimit() {
    var s = state.settings;
    var max = Math.floor(Math.min(s.btnWidth, s.btnHeight) / 2);
    var el = $('btnRadius');
    el.max = max;
    if (s.btnRadius > max) s.btnRadius = max;
    el.value = s.btnRadius;
    $('btnRadiusVal').textContent = s.btnRadius;
  }

  function syncUI() {
    var s = state.settings;

    /* 壁纸预览：静态壁纸走 background-image；动态壁纸时往里面挂一个循环 <video>
       （交给 syncVideoPreview —— 它是幂等的，id 没变就不重建，
       否则每次 syncUI 都会让预览里的视频从头开始播）。 */
    var preview = $('wallpaperPreview');
    var wantVid = isVideoWallpaper() ? state.settings.wallpaperVideoId : '';
    var empty = preview.querySelector('.wp-empty');
    preview.style.backgroundImage = (!wantVid && s.wallpaper) ? 'url("' + s.wallpaper + '")' : '';
    if (empty) empty.style.display = (wantVid || s.wallpaper) ? 'none' : '';
    syncVideoPreview();

    Array.prototype.forEach.call(document.querySelectorAll('.theme-option'), function (el) {
      el.classList.toggle('active', el.dataset.theme === s.theme);
    });

    var t = $('toggleTime');
    t.classList.toggle('on', s.showTime); t.setAttribute('aria-checked', String(s.showTime));
    var sec = $('showSeconds');
    sec.classList.toggle('on', s.showSeconds); sec.setAttribute('aria-checked', String(s.showSeconds));
    var ac = $('autoTimeColor');
    ac.classList.toggle('on', s.autoTimeColor); ac.setAttribute('aria-checked', String(s.autoTimeColor));
    var sg = $('showGlint');
    sg.classList.toggle('on', !!s.showGlint); sg.setAttribute('aria-checked', String(!!s.showGlint));
    $('timeColor').value = s.timeColor;
    $('timeFont').value = s.timeFont;
    $('timeSize').value = s.timeSize; $('timeSizeVal').textContent = s.timeSize;
    $('timeWeight').value = s.timeWeight; $('timeWeightVal').textContent = s.timeWeight;
    $('timeLetter').value = s.timeLetter; $('timeLetterVal').textContent = s.timeLetter + 'px';
    $('timeTop').value = s.timeTop; $('timeTopVal').textContent = s.timeTop + 'vh';
    $('searchTop').value = s.searchTop; $('searchTopVal').textContent = s.searchTop + 'vh';
    $('linksTop').value = s.linksTop; $('linksTopVal').textContent = s.linksTop + 'vh';

    $('linksWidth').value = s.linksWidth; $('linksWidthVal').textContent = s.linksWidth;
    $('btnWidth').value = s.btnWidth; $('btnWidthVal').textContent = s.btnWidth;
    $('btnHeight').value = s.btnHeight; $('btnHeightVal').textContent = s.btnHeight;
    $('iconRadius').value = s.iconRadius; $('iconRadiusVal').textContent = s.iconRadius + '%';
    $('btnGap').value = s.btnGap; $('btnGapVal').textContent = s.btnGap;
    Array.prototype.forEach.call(document.querySelectorAll('#btnAlign .seg-btn'), function (b) {
      b.classList.toggle('active', b.dataset.align === (s.btnAlign === 'center' ? 'center' : 'left'));
    });
    syncRadiusLimit();

    var lp = s.liquid;
    var rf = $('lpRefract');
    rf.classList.toggle('on', lp.refract); rf.setAttribute('aria-checked', String(lp.refract));
    ['depth', 'splay', 'feather', 'curve', 'blur', 'chroma', 'glint', 'alpha'].forEach(function (k) {
      var el = $('lp' + k.charAt(0).toUpperCase() + k.slice(1));
      var val = $('lp' + k.charAt(0).toUpperCase() + k.slice(1) + 'Val');
      if (el) el.value = lp[k];
      if (val) val.textContent = lp[k];
    });
    $('lpTint').value = lp.tint; $('lpTintVal').textContent = lp.tint;
    $('lpTintColor').value = lp.tintColor;

    syncCarouselUI();
  }

  /* =======================  设置事件绑定  ======================= */

  function bindSettings() {
    // 壁纸：选择 / 移除。单选壁纸入口已并入「选择壁纸」页（原来的轮播页）。
    $('removeWallpaper').addEventListener('click', function () {
      // 「移除壁纸」两类一起清：静态图与动态视频都不再生效
      if (!state.settings.wallpaper && !isVideoWallpaper()) return;
      state.settings.wallpaper = '';
      state.settings.wallpaperNatural = null;
      state.settings.wallpaperKind = 'image';
      state.settings.wallpaperVideoId = '';
      bgSample = null;
      save(true);
      loadBgVideo();          // 停播并摘掉 .on
      stopFrameFeed();
      applyContrast();
      applySettings();        // 内部会调 applyBackground
      syncUI();
      renderCarousel();
      renderVideoGrid();
      syncCarouselUI();
      scheduleCarousel();
    });

    // 选择壁纸页：轮播时间 / 轮播方式
    Array.prototype.forEach.call(document.querySelectorAll('#carouselEvery .seg-btn'), function (b) {
      b.addEventListener('click', function () {
        carouselCfg().every = b.dataset.every;
        save();
        scheduleCarousel();
        syncCarouselUI();
      });
    });
    // 自定义间隔（分钟）
    var customMin = $('carouselCustomMin');
    if (customMin) {
      customMin.addEventListener('input', function () {
        var n = parseInt(customMin.value, 10);
        if (!(n > 0)) return;            // 清空/非法值先不生效，失焦时再还原显示
        if (n > 9999) n = 9999;          // 上限 9999 分钟（与 HTML 的 max 一致）
        var c = carouselCfg();
        c.customMin = n;
        c.every = 'custom:' + n;
        save();
        scheduleCarousel();
        syncCarouselUI();
      });
      customMin.addEventListener('blur', function () { syncCarouselUI(); });
    }
    Array.prototype.forEach.call(document.querySelectorAll('#carouselMode .seg-btn'), function (b) {
      b.addEventListener('click', function () {
        var c = carouselCfg();
        c.mode = b.dataset.mode === 'seq' ? 'seq' : 'random';
        if (c.mode === 'random') c.lastIndex = -1;
        save();
        scheduleCarousel();
        syncCarouselUI();
      });
    });
    $('carouselFile').addEventListener('change', function (e) {
      // 必须先把 FileList 拷成真数组再清 value：
      // e.target.files 是【活的】FileList，把它赋给变量后 e.target.value = '' 会当场清空它，
      // 于是 addCarouselFiles 收到一个空列表 —— 表现就是「选了图，列表里什么都不出现」。
      var files = Array.prototype.slice.call(e.target.files || []);
      e.target.value = '';
      addCarouselFiles(files);
    });

    // 动态壁纸：同样是"先拍成真数组再清 value"（同一个活 FileList 的坑）
    $('videoFile').addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      e.target.value = '';
      addVideoFiles(files);
    });

    // 主题
    Array.prototype.forEach.call(document.querySelectorAll('.theme-option'), function (el) {
      el.addEventListener('click', function () {
        state.settings.theme = el.dataset.theme;
        save();
        applyContrast();
        applySettings();
        syncUI();
      });
    });

    // 时间
    bindSwitch('toggleTime', 'showTime', function () { applyContrast(); });
    bindSwitch('showSeconds', 'showSeconds', renderTime);
    bindSwitch('autoTimeColor', 'autoTimeColor', applyContrast);
    // 高光显示：只影响 .tab-item / .engine-btn 的 box-shadow（--nav-glint 置空），
    // 不碰布局、也不影响对比度，bindSwitch 内部已经会跑 applySettings()。
    bindSwitch('showGlint', 'showGlint');
    $('timeColor').addEventListener('input', function (e) {
      state.settings.timeColor = e.target.value;
      state.settings.autoTimeColor = false;
      var ac = $('autoTimeColor');
      ac.classList.remove('on'); ac.setAttribute('aria-checked', 'false');
      save();
      applyContrast();
      applySettings();
    });
    $('timeFont').addEventListener('change', function (e) {
      state.settings.timeFont = e.target.value;
      save();
      applySettings();
    });
    bindRange('timeSize', 'timeSize', null, function () { scheduleContrast(); });
    bindRange('timeWeight', 'timeWeight');
    bindRange('timeLetter', 'timeLetter', function (v) { return v + 'px'; });
    bindRange('timeTop', 'timeTop', function (v) { return v + 'vh'; }, scheduleContrast);
    bindRange('searchTop', 'searchTop', function (v) { return v + 'vh'; });
    bindRange('linksTop', 'linksTop', function (v) { return v + 'vh'; });

    // 链接按钮
    bindRange('linksWidth', 'linksWidth');
    bindRange('btnWidth', 'btnWidth');
    bindRange('btnHeight', 'btnHeight');
    bindRange('btnRadius', 'btnRadius');
    bindRange('iconRadius', 'iconRadius', function (v) { return v + '%'; });
    bindRange('btnGap', 'btnGap');

    // 链接按钮内容对齐：靠左 / 居中
    Array.prototype.forEach.call(document.querySelectorAll('#btnAlign .seg-btn'), function (b) {
      b.addEventListener('click', function () {
        state.settings.btnAlign = b.dataset.align === 'center' ? 'center' : 'left';
        save();
        applySettings();
        syncUI();
      });
    });

    // 液态玻璃参数
    $('lpRefract').addEventListener('click', function () {
      var on = !state.settings.liquid.refract;
      state.settings.liquid.refract = on;
      $('lpRefract').classList.toggle('on', on);
      $('lpRefract').setAttribute('aria-checked', String(on));
      save();
      applySettings();
    });
    ['depth', 'splay', 'feather', 'curve', 'blur', 'chroma', 'glint', 'alpha'].forEach(function (k) {
      var id = 'lp' + k.charAt(0).toUpperCase() + k.slice(1);
      if ($(id)) bindLiquidRange(id, k);
    });
    $('lpTint').addEventListener('input', function () {
      state.settings.liquid.tint = parseFloat($('lpTint').value);
      $('lpTintVal').textContent = $('lpTint').value;
      save(); applySettings();
    });
    $('lpTintColor').addEventListener('input', function (e) {
      state.settings.liquid.tintColor = e.target.value;
      save(); applySettings();
    });

    var PRESETS = {
      soft: { refract: true, depth: 60, splay: 2, feather: 24, curve: 2, blur: 0, chroma: 0, glint: 25, alpha: 10, tint: 0, tintColor: '#ffffff' },
      thick: { refract: true, depth: 120, splay: 2, feather: 30, curve: 3, blur: 0, chroma: 0, glint: 60, alpha: 14, tint: 0, tintColor: '#ffffff' },
      frosted: { refract: true, depth: 120, splay: 16, feather: 26, curve: 2.6, blur: 5, chroma: 0, glint: 20, alpha: 22, tint: 0, tintColor: '#ffffff' },
      cut: { refract: true, depth: 120, splay: 40, feather: 40, curve: 0.6, blur: 0.1, chroma: 0, glint: 15, alpha: 8, tint: 0, tintColor: '#ffffff' },
      plexi: { refract: true, depth: 60, splay: 4, feather: 10, curve: 1.2, blur: 2.5, chroma: 0, glint: 25, alpha: 20, tint: 0.94, tintColor: '#ff6600' },
      clear: { refract: true, depth: 40, splay: 3, feather: 18, curve: 1.6, blur: 0, chroma: 0.06, glint: 55, alpha: 4, tint: 0, tintColor: '#ffffff' }
    };
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (btn) {
      btn.addEventListener('click', function () {
        var p = PRESETS[btn.dataset.preset];
        if (!p) return;
        Object.keys(p).forEach(function (k) { state.settings.liquid[k] = p[k]; });
        save();
        applySettings();
        syncUI();
      });
    });

    // 数据
    $('exportData').addEventListener('click', exportData);
    $('importData').addEventListener('click', function () { importFile.click(); });
    importFile.addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      importFile.value = '';
      var rd = new FileReader();
      rd.onload = function (ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (!data || !data.settings || (!data.panels && !data.tabs)) throw new Error('数据格式不正确');
          state = migrate(deepMerge(defaultData(), data), true);
          if (!Array.isArray(state.panels) || !state.panels.length) throw new Error('面板数据为空');
          save(true);
          fullRefresh();
        } catch (err) {
          toast('导入失败：' + err.message, 3000);
        }
      };
      rd.readAsText(f);
    });
    $('resetData').addEventListener('click', function () {
      var body = document.createElement('div');
      body.style.fontSize = '13.5px';
      body.style.lineHeight = '1.7';
      body.style.opacity = '.85';
      body.textContent = '确定恢复默认设置？所有自定义的分类、链接与偏好都会被清除。';
      openModal('恢复默认', body, '恢复默认', function () {
        state = migrate(defaultData(), true);
        bgSample = null;
        save(true);
        fullRefresh();
      });
    });
  }

  /* =======================  壁纸处理  ======================= */

  /* 图片文件 → 压缩后的 DataURL（失败时会调用 failed 回调，避免链式处理卡住） */
  function fileToWallpaper(file, maxPx, quality, cb, failed) {
    function fail(msg) { toast(msg); if (failed) failed(); }
    if (!file || !/^image\//.test(file.type)) { fail('请选择图片文件'); return; }
    var rd = new FileReader();
    rd.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, maxPx / Math.max(w, h));
        var cw = Math.max(1, Math.round(w * scale));
        var ch = Math.max(1, Math.round(h * scale));
        var cv = document.createElement('canvas');
        cv.width = cw; cv.height = ch;
        var ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, cw, ch);
        var out = '';
        try { out = cv.toDataURL('image/webp', quality); } catch (e) { out = ''; }
        if (!out || out.indexOf('data:image/webp') !== 0) {
          try { out = cv.toDataURL('image/jpeg', quality); } catch (e) { out = ''; }
        }
        if (!out) { fail('图片处理失败'); return; }
        cb(out, cw, ch);
      };
      img.onerror = function () { fail('图片读取失败'); };
      img.src = ev.target.result;
    };
    rd.onerror = function () { fail('图片读取失败'); };
    rd.readAsDataURL(file);
  }

  /* 把某张静态壁纸设为当前背景（操作类提示框已全部取消，这里不再弹 toast）。
     顺带让出动态壁纸：选了静态图就把 wallpaperKind 拨回 'image'。 */
  function applyWallpaperData(dataUrl, nw, nh) {
    state.settings.wallpaper = dataUrl;
    state.settings.wallpaperNatural = { w: nw, h: nh };
    state.settings.wallpaperKind = 'image';
    state.settings.wallpaperVideoId = '';
    save(true);
    loadBgVideo();
    stopFrameFeed();
    renderVideoGrid();
    analyzeBackground(function () {
      applyContrast();
      applySettings();
      syncUI();
    });
  }

  /* =======================  壁纸轮播  ======================= */

  // 'none' = 不轮播；'custom:<分钟>' = 自定义间隔。其余为预设键。
  var CAROUSEL_EVERY = {
    'none': 0,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '3h': 3 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };
  var CAROUSEL_LABEL = {
    'none': '无', '5min': '5 分钟', '15min': '15 分钟', '1h': '1 小时',
    '3h': '3 小时', '12h': '12 小时', '1d': '1 天'
  };

  /* 把 every 值解析成毫秒；0 表示不轮播（'none' 或非法自定义值） */
  function carouselEveryMs(v) {
    if (typeof v === 'string' && v.indexOf('custom:') === 0) {
      var m = parseInt(v.slice(7), 10);
      return (m > 0) ? m * 60 * 1000 : 0;
    }
    return CAROUSEL_EVERY[v] || 0;
  }

  function carouselEveryLabel(v) {
    if (typeof v === 'string' && v.indexOf('custom:') === 0) {
      return parseInt(v.slice(7), 10) + ' 分钟';
    }
    return CAROUSEL_LABEL[v] || v;
  }

  var carouselTimer = 0;

  function carouselCfg() {
    if (!state.settings.carousel || typeof state.settings.carousel !== 'object') {
      state.settings.carousel = { every: 'none', mode: 'random', lastIndex: -1, customMin: 30 };
    }
    var c = state.settings.carousel;
    if (!c.every) c.every = 'none';
    if (!(c.customMin > 0)) c.customMin = 30;
    return c;
  }

  function carouselList() { return Array.isArray(state.wallpapers) ? state.wallpapers : []; }

  function indexOfWallpaper(id) {
    var list = carouselList();
    for (var i = 0; i < list.length; i++) if (list[i]._id === id) return i;
    return -1;
  }

  function scheduleCarousel() {
    clearInterval(carouselTimer);
    carouselTimer = 0;
    // 动态壁纸生效时不参与静态轮播 —— 否则定时器会把用户刚选的视频换掉
    if (isVideoWallpaper()) return;
    var c = carouselCfg();
    var every = carouselEveryMs(c.every);
    if (!every || carouselList().length < 2) return;
    carouselTimer = setInterval(rotateWallpaper, every);
  }

  function rotateWallpaper() {
    var list = carouselList();
    if (list.length < 2) return;
    var c = carouselCfg();
    var idx;
    if (c.mode === 'seq') {
      idx = (c.lastIndex + 1) % list.length;
      if (idx < 0) idx = 0;
    } else {
      idx = Math.floor(Math.random() * list.length);
      if (idx === c.lastIndex) idx = (idx + 1) % list.length;
    }
    c.lastIndex = idx;
    var wp = list[idx];
    applyWallpaperData(wp.data, wp.w, wp.h);
    if (settingsPanel.dataset.page === 'carousel') renderCarousel();
  }

  function addCarouselFiles(files) {
    if (!Array.isArray(state.wallpapers)) state.wallpapers = [];
    var list = Array.prototype.slice.call(files || []).filter(function (f) { return f && f.size; });
    if (!list.length) return;
    var hadNoWallpaper = !state.settings.wallpaper;
    var i = 0;
    function next() {
      if (i >= list.length) {
        if (!state.wallpapers.length) { toast('没有添加成功'); return; }
        save(true);
        scheduleCarousel();
        // 原本没有壁纸时，顺手把第一张用上，否则用户会以为"加了但没反应"。
        // 必须放在 renderCarousel 之前：那一轮渲染要能标出「使用中」。
        if (hadNoWallpaper) {
          var first = state.wallpapers[0];
          carouselCfg().lastIndex = 0;
          applyWallpaperData(first.data, first.w, first.h);
        }
        renderCarousel();
        syncCarouselUI();
        return;
      }
      fileToWallpaper(list[i++], 1600, 0.85, function (data, w, h) {
        state.wallpapers.push({ _id: uid('w'), data: data, w: w, h: h });
        next();
      }, next);
    }
    next();
  }

  function removeCarouselItem(id) {
    var i = indexOfWallpaper(id);
    if (i < 0) return;
    state.wallpapers.splice(i, 1);
    var c = carouselCfg();
    if (c.lastIndex >= state.wallpapers.length) c.lastIndex = state.wallpapers.length - 1;
    save(true);
    scheduleCarousel();
    renderCarousel();
    syncCarouselUI();
  }

  function renderCarousel() {
    var grid = $('carouselGrid');
    if (!grid) return;
    grid.textContent = '';
    var list = carouselList();
    // 动态壁纸生效时，静态壁纸里不该再有人挂着「使用中」（它此时只是海报）
    var current = isVideoWallpaper() ? null : state.settings.wallpaper;

    list.forEach(function (wp) {
      var item = document.createElement('div');
      item.className = 'carousel-item' + (wp.data === current ? ' active' : '');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.title = '点击设为当前壁纸';
      item.style.backgroundImage = 'url("' + wp.data + '")';

      if (wp.data === current) {
        var tag = document.createElement('span');
        tag.className = 'ci-tag';
        tag.textContent = '使用中';
        item.appendChild(tag);
      }

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'ci-del';
      del.title = '删除这张壁纸';
      del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        removeCarouselItem(wp._id);
      });
      item.appendChild(del);

      function pick() {
        var k = indexOfWallpaper(wp._id);
        if (k >= 0) carouselCfg().lastIndex = k;
        applyWallpaperData(wp.data, wp.w, wp.h, '已切换壁纸');
        renderCarousel();
      }
      item.addEventListener('click', pick);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });

      grid.appendChild(item);
    });

    var add = document.createElement('div');
    add.className = 'carousel-item add';
    add.setAttribute('role', 'button');
    add.setAttribute('tabindex', '0');
    add.title = '添加壁纸';
    add.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg><span>添加</span>';
    add.addEventListener('click', function () { $('carouselFile').click(); });
    grid.appendChild(add);

    if (!list.length) {
      var hint = document.createElement('div');
      hint.className = 'carousel-empty';
      hint.textContent = '还没有壁纸。点「添加」上传图片，点缩略图即可设为新标签页背景。';
      grid.appendChild(hint);
    }
  }

  function syncCarouselUI() {
    var c = carouselCfg();
    Array.prototype.forEach.call(document.querySelectorAll('#carouselEvery .seg-btn'), function (b) {
      b.classList.toggle('active', b.dataset.every === c.every);
    });
    // 自定义间隔：输入框有值时高亮整格
    var isCustom = typeof c.every === 'string' && c.every.indexOf('custom:') === 0;
    var wrap = $('carouselCustomWrap');
    if (wrap) wrap.classList.toggle('active', isCustom);
    var input = $('carouselCustomMin');
    // 正在输入时不要回写，否则会把用户敲到一半的数字顶掉
    if (input && document.activeElement !== input) input.value = String(c.customMin);
    Array.prototype.forEach.call(document.querySelectorAll('#carouselMode .seg-btn'), function (b) {
      b.classList.toggle('active', b.dataset.mode === (c.mode === 'seq' ? 'seq' : 'random'));
    });
    var el = $('carouselStatus');
    if (!el) return;
    var n = carouselList().length;
    var vid = isVideoWallpaper();
    var head = vid ? '动态壁纸播放中 · ' : '';
    var txt;
    if (!n && !vid) txt = '还没有壁纸';
    else if (vid) txt = head + '共 ' + n + ' 张静态壁纸（选中动态壁纸时不轮播）';
    else if (!carouselEveryMs(c.every)) txt = '不轮播 · 共 ' + n + ' 张';
    else if (n < 2) txt = '已选 ' + n + ' 张，至少 2 张才会轮播';
    else txt = '每 ' + carouselEveryLabel(c.every) + ' 换一张 · ' +
      (c.mode === 'seq' ? '顺序' : '随机') + ' · 共 ' + n + ' 张';
    el.textContent = txt;
  }

  /* =======================  动态壁纸（视频）  =======================

     存储：视频二进制放 IndexedDB，state 里只留元数据
     （_id / name / w / h / dur / poster）。
     原因：state 会被整份 JSON.stringify 进 chrome.storage —— 一个几十 MB 的视频
     既能撑爆配额，又会让每次保存都卡一下；而且 DataURL 还要再胖 1/3。

     播放：页面背景是一个 object-fit:cover 的 <video>，muted + loop 自动循环；
     设置页的预览框里嵌第二个 <video>，与它共用同一个 Blob URL（同步循环）。

     折射：折射层的"背景拷贝"只能吃图片（background-image 吃不了视频），
     所以用离屏 canvas 按固定节奏把当前帧画出来再当背景喂给引擎（见 feedTick）。
     整屏只拷一张，所有玻璃层共用同一张，只是各自按 rect 取不同区域。 */

  var MEDIA_DB = 'liquidNewtabMedia';
  var MEDIA_STORE = 'videos';
  var mediaDbPromise = null;

  function mediaDb() {
    if (mediaDbPromise) return mediaDbPromise;
    mediaDbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error('indexedDB 不可用')); return; }
      var req = indexedDB.open(MEDIA_DB, 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains(MEDIA_STORE)) {
          db.createObjectStore(MEDIA_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error || new Error('打开本地媒体库失败')); };
    });
    return mediaDbPromise;
  }

  function mediaPut(id, blob, cb) {
    mediaDb().then(function (db) {
      var tx = db.transaction(MEDIA_STORE, 'readwrite');
      tx.objectStore(MEDIA_STORE).put({ id: id, blob: blob, at: Date.now() });
      tx.oncomplete = function () { if (cb) cb(true); };
      tx.onerror = function () { if (cb) cb(false); };
    }).catch(function () { if (cb) cb(false); });
  }

  function mediaGet(id, cb) {
    mediaDb().then(function (db) {
      var tx = db.transaction(MEDIA_STORE, 'readonly');
      var rq = tx.objectStore(MEDIA_STORE).get(id);
      rq.onsuccess = function () { cb(rq.result ? rq.result.blob : null); };
      rq.onerror = function () { cb(null); };
    }).catch(function () { cb(null); });
  }

  function mediaDel(id) {
    mediaDb().then(function (db) {
      var tx = db.transaction(MEDIA_STORE, 'readwrite');
      tx.objectStore(MEDIA_STORE).delete(id);
    }).catch(function () { });
  }

  /* 同一个会话里同一个 _id 只造一次 object URL（页面背景与预览各用一次同一个 URL） */
  var videoUrls = {};
  function videoUrlFor(id, cb) {
    if (videoUrls[id]) { cb(videoUrls[id]); return; }
    mediaGet(id, function (blob) {
      if (!blob) { cb(''); return; }
      var u = URL.createObjectURL(blob);
      videoUrls[id] = u;
      cb(u);
    });
  }
  function dropVideoUrl(id) {
    if (!videoUrls[id]) return;
    try { URL.revokeObjectURL(videoUrls[id]); } catch (e) { }
    delete videoUrls[id];
  }

  function videoList() { return Array.isArray(state.videos) ? state.videos : []; }

  function findVideo(id) {
    var l = videoList();
    for (var i = 0; i < l.length; i++) if (l[i]._id === id) return l[i];
    return null;
  }

  /* 当前生效的是不是动态壁纸（且那条视频还在列表里） */
  function isVideoWallpaper() {
    return state.settings.wallpaperKind === 'video' &&
      !!findVideo(state.settings.wallpaperVideoId);
  }

  function perfNow() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function fmtDur(sec) {
    var s = Math.max(0, Math.round(sec || 0));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  /* ---------- 读取视频元信息 + 抓首帧当缩略图 ---------- */

  var POSTER_W = 320;

  function probeVideo(file, cb) {
    var url = URL.createObjectURL(file);
    var v = document.createElement('video');
    var settled = false;
    v.preload = 'auto';
    v.muted = true;
    v.setAttribute('muted', '');
    v.playsInline = true;

    function bail() {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      cb(null);
    }

    function grabAndFinish() {
      if (settled) return;
      settled = true;
      var meta = {
        w: v.videoWidth || 0,
        h: v.videoHeight || 0,
        dur: (typeof v.duration === 'number' && isFinite(v.duration)) ? v.duration : 0,
        poster: ''
      };
      if (meta.w > 0 && meta.h > 0) {
        var W = POSTER_W;
        var H = Math.max(1, Math.round(W * meta.h / meta.w));
        var cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        try {
          cv.getContext('2d').drawImage(v, 0, 0, W, H);
          meta.poster = cv.toDataURL('image/jpeg', 0.7);
        } catch (e) { meta.poster = ''; }
      }
      URL.revokeObjectURL(url);
      cb(meta);
    }

    v.addEventListener('loadeddata', function () {
      // 很多视频第 0 帧是纯黑，往前挪一点点再抓
      v.addEventListener('seeked', grabAndFinish, { once: true });
      try { v.currentTime = Math.min(0.15, (v.duration || 1) / 3); } catch (e) { }
      setTimeout(grabAndFinish, 1200);   // 兜底：部分封装不触发 seeked
    });
    v.addEventListener('error', bail);
    setTimeout(function () { if (!settled && !v.videoWidth) bail(); }, 8000);

    v.src = url;
  }

  /* ---------- 页面背景视频 / 设置页预览视频 ---------- */

  function playBgVideo() {
    try {
      var p = bgVideo.play();
      if (p && p.catch) p.catch(function () { });
    } catch (e) { }
  }

  function loadBgVideo() {
    if (!bgVideo) return;
    if (!isVideoWallpaper()) {
      bgVideo.pause();
      bgVideo.classList.remove('on');
      delete bgVideo.dataset.vid;
      bgVideo.removeAttribute('src');
      try { bgVideo.load(); } catch (e) { }
      stopFrameFeed();
      return;
    }
    var id = state.settings.wallpaperVideoId;
    if (bgVideo.dataset.vid === id) { bgVideo.classList.add('on'); playBgVideo(); return; }
    videoUrlFor(id, function (url) {
      if (!url) { toast('动态壁纸读取失败（本地媒体库里的视频不见了）'); return; }
      if (!isVideoWallpaper()) return;
      bgVideo.dataset.vid = id;
      bgVideo.src = url;
      bgVideo.classList.add('on');
      playBgVideo();
    });
  }

  /* 设置页壁纸预览里的循环视频。幂等：id 没变就不重建，免得每次 syncUI 都从头播。 */
  function syncVideoPreview() {
    var preview = $('wallpaperPreview');
    if (!preview) return;
    var want = isVideoWallpaper() ? state.settings.wallpaperVideoId : '';
    var cur = preview.querySelector('video');
    if (cur && cur.dataset.vid !== want) { cur.remove(); cur = null; }
    if (!want || cur) return;
    videoUrlFor(want, function (url) {
      if (!url || !isVideoWallpaper() || state.settings.wallpaperVideoId !== want) return;
      var p = $('wallpaperPreview');
      if (!p || p.querySelector('video')) return;
      var v = document.createElement('video');
      v.dataset.vid = want;
      v.muted = true;
      v.loop = true;
      v.autoplay = true;
      v.playsInline = true;
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('aria-hidden', 'true');
      v.src = url;
      p.appendChild(v);
      try {
        var pr = v.play();
        if (pr && pr.catch) pr.catch(function () { });
      } catch (e) { }
    });
  }

  /* ---------- 折射帧拷贝 ---------- */

  var FEED_FAST = 90;     // ~11fps
  var FEED_SLOW = 190;    // 单帧拷贝太贵时退让到 ~5fps
  var feedTimer = 0;
  var feedMs = FEED_FAST;
  var feedCanvas = null;
  var feedCtx = null;

  function feedRunning() { return !!feedTimer; }

  function stopFrameFeed() {
    if (!feedTimer) return;
    clearInterval(feedTimer);
    feedTimer = 0;
  }

  function startFrameFeed() {
    if (feedTimer || !isVideoWallpaper()) return;
    feedMs = FEED_FAST;
    feedTimer = setInterval(feedTick, feedMs);
    feedTick();                       // 别等第一个间隔，先来一帧
  }

  function feedTick() {
    if (document.hidden) return;
    var v = bgVideo;
    if (!v || !v.videoWidth || v.readyState < 2) return;
    var t0 = perfNow();
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    if (!feedCanvas) {
      feedCanvas = document.createElement('canvas');
      feedCtx = feedCanvas.getContext('2d');
    }
    if (feedCanvas.width !== vw || feedCanvas.height !== vh) {
      feedCanvas.width = vw;
      feedCanvas.height = vh;
    }
    // 与 <video style="object-fit:cover"> 同一套铺法：按较大比例放大后居中裁切，
    // 这样拷贝出来的图与用户看到的画面逐像素对齐，折射才不会错位。
    var s = Math.max(vw / v.videoWidth, vh / v.videoHeight);
    var dw = v.videoWidth * s;
    var dh = v.videoHeight * s;
    try {
      feedCtx.drawImage(v, (vw - dw) / 2, (vh - dh) / 2, dw, dh);
    } catch (e) { return; }
    var url = '';
    try { url = feedCanvas.toDataURL('image/jpeg', 0.72); } catch (e) { url = ''; }
    if (url && engine) engine.setBackground('url("' + url + '")', 'viewport', null);

    var cost = perfNow() - t0;
    var want = cost > 55 ? FEED_SLOW : (cost < 22 ? FEED_FAST : feedMs);
    if (want !== feedMs) {
      feedMs = want;
      clearInterval(feedTimer);
      feedTimer = setInterval(feedTick, feedMs);
    }
  }

  /* 视频帧的亮度采样（给 applyContrast 用）。与 analyzeBackground 同一套输出格式，
     不同点是：视频要按 cover 裁切后再采，否则采样到的画面和用户看到的不是一回事。 */
  function analyzeVideoFrame() {
    var v = bgVideo;
    if (!v || !v.videoWidth || !v.videoHeight) return false;
    var W = 320;
    var H = Math.max(8, Math.round(W * v.videoHeight / v.videoWidth));
    if (H > 420) { H = 420; W = Math.max(8, Math.round(H * v.videoWidth / v.videoHeight)); }
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    try {
      var s = Math.max(W / v.videoWidth, H / v.videoHeight);
      var dw = v.videoWidth * s;
      var dh = v.videoHeight * s;
      ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
      bgSample = { w: W, h: H, data: ctx.getImageData(0, 0, W, H).data };
      return true;
    } catch (e) {
      bgSample = null;
      return false;
    }
  }

  /* ---------- 列表渲染与增删选 ---------- */

  function renderVideoGrid() {
    var grid = $('videoGrid');
    if (!grid) return;
    grid.textContent = '';
    var list = videoList();
    var cur = isVideoWallpaper() ? state.settings.wallpaperVideoId : '';

    list.forEach(function (v) {
      var item = document.createElement('div');
      item.className = 'carousel-item video-item' + (v._id === cur ? ' active' : '');
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.title = '点击设为动态壁纸（循环播放）';
      // 缩略图用导入时抓到的首帧，不摆真的 <video>：一屏十几个会同时解码，又卡又费电
      if (v.poster) item.style.backgroundImage = 'url("' + v.poster + '")';

      var play = document.createElement('span');
      play.className = 'vi-play';
      play.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      item.appendChild(play);

      if (v.dur) {
        var tag = document.createElement('span');
        tag.className = 'ci-tag';
        tag.textContent = fmtDur(v.dur);
        item.appendChild(tag);
      }
      if (v._id === cur) {
        var use = document.createElement('span');
        use.className = 'ci-tag in-use';
        use.textContent = '使用中';
        item.appendChild(use);
      }

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'ci-del';
      del.title = '删除这个动态壁纸';
      del.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        removeVideoItem(v._id);
      });
      item.appendChild(del);

      function pick() { selectVideo(v._id); }
      item.addEventListener('click', pick);
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); }
      });

      grid.appendChild(item);
    });

    var add = document.createElement('div');
    add.className = 'carousel-item add';
    add.setAttribute('role', 'button');
    add.setAttribute('tabindex', '0');
    add.title = '添加动态壁纸（视频）';
    add.innerHTML = '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg><span>添加</span>';
    add.addEventListener('click', function () { $('videoFile').click(); });
    grid.appendChild(add);

    if (!list.length) {
      var hint = document.createElement('div');
      hint.className = 'carousel-empty';
      hint.textContent = '还没有动态壁纸。点「添加」上传视频（mp4 / webm 等），点缩略图即可循环播放。';
      grid.appendChild(hint);
    }
  }

  function selectVideo(id) {
    var meta = findVideo(id);
    if (!meta) return;
    state.settings.wallpaperKind = 'video';
    state.settings.wallpaperVideoId = id;
    save(true);
    loadBgVideo();
    renderVideoGrid();
    renderCarousel();          // 静态壁纸那边要撤掉「使用中」
    applyBackground();         // 开帧拷贝循环
    scheduleCarousel();        // 动态壁纸生效 → 静态轮播让位
    syncUI();
    analyzeVideoFrame();       // 视频还没出帧时返回 false，等 loadeddata 再采
    applyContrast();
    applySettings();
    toast('已切换动态壁纸');
  }

  function removeVideoItem(id) {
    var l = videoList();
    var i = -1;
    for (var k = 0; k < l.length; k++) if (l[k]._id === id) { i = k; break; }
    if (i < 0) return;
    l.splice(i, 1);
    mediaDel(id);
    dropVideoUrl(id);
    if (state.settings.wallpaperVideoId === id) {
      state.settings.wallpaperVideoId = '';
      state.settings.wallpaperKind = 'image';   // 回落到静态壁纸，别留一片黑
    }
    save(true);
    loadBgVideo();
    renderVideoGrid();
    renderCarousel();
    applyBackground();
    syncUI();
    analyzeBackground(function () { applyContrast(); applySettings(); });
    scheduleCarousel();
  }

  function addVideoFiles(files) {
    var list = Array.prototype.slice.call(files || []).filter(function (f) { return f && f.size; });
    if (!list.length) return;
    var hadActive = isVideoWallpaper();
    var i = 0;
    var added = 0;
    function next() {
      if (i >= list.length) {
        if (!added) { toast('没有添加成功（格式浏览器不支持？）'); return; }
        save(true);
        // 原本一个都没有 → 顺手把第一个用上，否则用户会以为"加了但没动静"
        if (!hadActive) selectVideo(videoList()[0]._id);
        else { renderVideoGrid(); syncVideoPreview(); }
        return;
      }
      var f = list[i++];
      probeVideo(f, function (meta) {
        if (!meta) { next(); return; }
        var id = uid('v');
        mediaPut(id, f, function (ok) {
          if (!ok) { toast('视频保存失败：本地媒体库不可用'); next(); return; }
          state.videos.push({
            _id: id,
            name: f.name || ('动态壁纸 ' + (videoList().length + 1)),
            poster: meta.poster,
            w: meta.w, h: meta.h, dur: meta.dur
          });
          added++;
          next();
        });
      });
    }
    next();
  }

  /* =======================  数据导入导出  ======================= */

  function exportData() {
    try {
      var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      var d = new Date();
      var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
      a.href = url;
      a.download = 'liquid-newtab-' + stamp + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    } catch (e) {
      toast('导出失败');
    }
  }

  /* =======================  刷新  ======================= */

  var contrastTimer = 0;
  function scheduleContrast() {
    clearTimeout(contrastTimer);
    contrastTimer = setTimeout(function () { applyContrast(); applySettings(); }, 120);
  }

  function fullRefresh() {
    ensureIds(state);
    renderAllPanels();
    syncUI();
    renderTime();
    applyContrast();
    applySettings();
  }

  /* =======================  初始化  ======================= */

  /* 首帧遮罩：newtab.html 的 <html class="booting"> 让 body 先保持透明，
     等壁纸 + 设置 + 折射层都应用完再淡入，避免"先画默认画面、再被存档改写"的割裂感。 */
  var revealed = false;
  function revealNow() {
    if (!revealed) return;
    document.documentElement.classList.remove('booting');
  }
  function revealPage() {
    if (revealed) return;
    revealed = true;
    // 双 rAF ≈ "等下一帧绘制完成后再淡入"。
    // 但个别场景（无头、后台标签页、被节流的窗口）可能整段不产帧，
    // 内层 rAF 就永远不来，页面会一直停在 opacity:0 —— 再挂一个 setTimeout 兜底。
    // 兜底是安全的：此时样式已经同步写进 DOM，首帧画出来就是最终结果。
    requestAnimationFrame(function () { requestAnimationFrame(revealNow); });
    setTimeout(revealNow, 260);
  }

  function init() {
    // 兜底：任何一步异常都不能让页面永远停在透明状态
    setTimeout(revealPage, 1500);

    // 折射引擎
    if (window.LiquidGlass) {
      engine = new window.LiquidGlass($('filter-housing'));
      engine.setEnabled(true);
    }

    bindSettings();

    loadStored(function (stored) {
      // 有存档：默认值打底 → 存档覆盖 → 迁移到面板结构（并按需刷成新默认设置）
      state = stored ? migrate(deepMerge(defaultData(), stored)) : migrate(defaultData(), true);
      ensureIds(state);
      finishInit();
    });
  }

  function finishInit() {
    renderAllPanels();
    // 动态壁纸：先把网格画出来、再把选中的视频挂上背景，最后才 syncUI
    // （syncUI 里的预览要靠 isVideoWallpaper 判断，顺序反了会漏掉一次预览）
    renderVideoGrid();
    loadBgVideo();
    syncUI();
    renderTime();
    setInterval(renderTime, 1000);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { renderTime(); applyContrast(); applySettings(); }
    });

    // 背景视频出帧后：采一次亮度、把帧拷给折射层、把循环开起来。
    // 放在这里而不是 loadBgVideo 之后，是因为 readyState 到位是异步的。
    bgVideo.addEventListener('loadeddata', function () {
      if (!isVideoWallpaper()) return;
      analyzeVideoFrame();
      applyContrast();
      applySettings();       // 内部会 applyBackground → startFrameFeed
      startFrameFeed();
      feedTick();
    });

    // 有壁纸但缺少尺寸信息时补全
    var done = function () {
      applyContrast();
      applySettings();
      refreshGlass();
      revealPage();
    };
    if (isVideoWallpaper()) {
      // 动态壁纸：底图只当海报，亮度采样等视频出帧后由 loadeddata 做
      done();
    } else if (state.settings.wallpaper && !state.settings.wallpaperNatural) {
      var im = new Image();
      im.onload = function () {
        state.settings.wallpaperNatural = { w: im.naturalWidth, h: im.naturalHeight };
        save(true);
        analyzeBackground(done);
      };
      im.onerror = function () { analyzeBackground(done); };
      im.src = state.settings.wallpaper;
    } else if (state.settings.wallpaper) {
      analyzeBackground(done);
    } else {
      done();
    }

    // 系统主题变化
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (state.settings.theme === 'system') { applyContrast(); applySettings(); }
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        applyContrast();
        applySettings();
        // 视口宽度变了，"外挂操作条放不放得下"要重新判定（也顺带重算 --nav-side-w）
        updatePanelIndexes();
      }, 180);
    });

    setupDnD();

    // 面板工具条（事件委托，面板 DOM 变化后无需重新绑定）
    panelsWrap.addEventListener('click', function (e) {
      var b = e.target.closest('.icon-btn');
      if (!b) return;
      handlePanelAction(panelOf(b), b.dataset.act);
    });

    // 壁纸轮播
    scheduleCarousel();

    // 搜索框自动聚焦
    setTimeout(function () { try { searchInput.focus(); } catch (e) { } }, 30);
  }

  /* 把当前档案整个刷成新默认（分类 / 链接 / 搜索引擎 / 壁纸都回出厂值）。
     只在控制台手动用：__liquidGlass.resetDefaults()。
     老档案的 migrate 只补默认壁纸、不动分类与链接；想整体重置就调这个。 */
  function resetDefaults() {
    state = migrate(defaultData(), true);
    ensureIds(state);
    renderAllPanels();
    renderVideoGrid();
    loadBgVideo();
    syncUI();
    renderCarousel();
    syncCarouselUI();
    scheduleCarousel();
    applyContrast();
    applySettings();
    refreshGlass();
    save(true);
    return state;
  }

  /* 调试 / 自动化验证入口（无头脚本、控制台手动排查都用它）。
     例如把间隔临时改小，观察真实定时器是否在切换：
       __liquidGlass.CAROUSEL_EVERY['5min'] = 1500;
       document.querySelector('#carouselEvery [data-every="5min"]').click(); */
  window.__liquidGlass = {
    get state() { return state; },
    get bgSample() { return bgSample; },
    get carouselTimer() { return carouselTimer; },
    // FLIP 期间折射层逐帧重算的验证入口：
    //   flipRaf !== 0 说明"逐帧重算窗口"已开启；renderEngine() 可在任意时刻强制重算一次。
    get flipRaf() { return flipRefractRaf; },
    renderEngine: function () { if (engine) engine.render(); },
    get engineBgPos() {
      var bg = document.querySelector('.glass-refract-bg');
      return bg ? bg.style.backgroundPosition : '';
    },
    get engineInfo() {
      if (!engine) return null;
      return {
        enabled: !!engine.enabled,
        refract: !!(engine.params && engine.params.refract),
        layers: engine.layers ? engine.layers.length : 0,
        hasImage: !!(engine.bg && engine.bg.image),
        vw: engine.vw, vh: engine.vh
      };
    },
    carouselEveryMs: carouselEveryMs,
    carouselEveryLabel: carouselEveryLabel,
    applyContrast: applyContrast,
    applySettings: applySettings,
    refreshElementColors: refreshElementColors,
    analyzeBackground: analyzeBackground,
    renderCarousel: renderCarousel,
    syncCarouselUI: syncCarouselUI,
    scheduleCarousel: scheduleCarousel,
    rotateWallpaper: rotateWallpaper,
    addCarouselFiles: addCarouselFiles,
    applyWallpaperData: applyWallpaperData,
    carouselCfg: carouselCfg,
    CAROUSEL_EVERY: CAROUSEL_EVERY,

    // ---- 动态壁纸（视频）----
    get bgVideo() { return bgVideo; },
    get videoFeedTimer() { return feedTimer; },
    get videoFeedMs() { return feedMs; },
    get videoUrls() { return videoUrls; },
    isVideoWallpaper: isVideoWallpaper,
    videoList: videoList,
    renderVideoGrid: renderVideoGrid,
    addVideoFiles: addVideoFiles,
    selectVideo: selectVideo,
    removeVideoItem: removeVideoItem,
    loadBgVideo: loadBgVideo,
    syncVideoPreview: syncVideoPreview,
    feedTick: feedTick,
    analyzeVideoFrame: analyzeVideoFrame,
    mediaGet: mediaGet,
    // 「外挂操作条放不放得下」的判定入口：改完 --links-w / 视口尺寸后调一次，
    // 会重算 --nav-side-w 并视情况切 .side-inside
    layoutNav: updatePanelIndexes,
    resetDefaults: resetDefaults
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
