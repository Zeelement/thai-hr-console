/* ===========================================================
   Vue 应用外壳：登录状态、数据加载、视图容器
   视图渲染与交互逻辑仍由 app.js 提供（通过 HRBridge 对接）
   =========================================================== */
(function () {
  'use strict';

  var api = window.HR_API;
  var Vue = window.Vue;

  var app = Vue.createApp({
    setup: function () {
      var authenticated = Vue.ref(!!api.getToken());
      var ready = Vue.ref(false);
      var busy = Vue.ref(false);
      var loginError = Vue.ref('');
      var loginForm = Vue.reactive({ username: '', password: '' });
      var pwOpen = Vue.ref(false);
      var pwBusy = Vue.ref(false);
      var pwError = Vue.ref('');
      var pwNotice = Vue.ref('');
      var pwForm = Vue.reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
      var navHtml = Vue.ref('');
      var viewHtml = Vue.ref('');
      var lang = Vue.ref('zh');
      var top = Vue.reactive({
        title: '总览', desc: '', today: '',
        brandName: '人事工作台', brandSub: '泰国 · 罗勇工厂', backup: '备份数据'
      });

      // app.js 通过这个桥接更新 Vue 管理的 DOM 区域
      window.HRBridge = {
        setNav: function (html) { navHtml.value = html; },
        setView: function (html) { viewHtml.value = html; },
        setTop: function (values) { Object.assign(top, values); },
        setLang: function (value) { lang.value = value; },
        nextTick: Vue.nextTick
      };

      function showLogin() {
        authenticated.value = false;
        ready.value = false;
      }
      api.onUnauthorized(showLogin);

      async function loadState() {
        var res = await api.getState();
        if (!res.seeded || !res.state) {
          // 首次运行：沿用现有 data.js 的种子，写入后端后再载入
          var seed = window.HR_SEED.make();
          await api.saveState(seed);
          res = await api.getState();
        }
        window.HRApp.init(res.state);
        lang.value = (res.state.settings && res.state.settings.lang) || 'zh';
        ready.value = true;
        Vue.nextTick(function () { window.HRApp.render(); });
      }

      if (authenticated.value) {
        loadState().catch(function (e) {
          if (e.status !== 401) loginError.value = '数据加载失败：' + e.message;
          showLogin();
        });
      }

      async function doLogin() {
        loginError.value = '';
        pwNotice.value = '';
        if (!loginForm.username || !loginForm.password) {
          loginError.value = '请输入用户名和密码';
          return;
        }
        busy.value = true;
        try {
          await api.login(loginForm.username, loginForm.password);
          authenticated.value = true;
          await loadState();
        } catch (e) {
          loginError.value = e.status === 401
            ? ((e.data && e.data.message) || '用户名或密码错误')
            : ('登录失败：' + e.message);
          if (e.status === 401) showLogin();
        } finally {
          busy.value = false;
        }
      }

      function doLogout() {
        api.clearToken();
        window.location.reload();
      }

      function openPasswordModal() {
        pwError.value = '';
        pwForm.oldPassword = '';
        pwForm.newPassword = '';
        pwForm.confirmPassword = '';
        pwOpen.value = true;
      }

      function closePasswordModal() { pwOpen.value = false; }

      async function doChangePassword() {
        pwError.value = '';
        if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
          pwError.value = '请填写原密码、新密码和确认密码';
          return;
        }
        if (pwForm.newPassword !== pwForm.confirmPassword) {
          pwError.value = '两次输入的新密码不一致';
          return;
        }
        pwBusy.value = true;
        try {
          await api.changePassword(pwForm.oldPassword, pwForm.newPassword);
          pwOpen.value = false;
          api.clearToken();
          authenticated.value = false;
          ready.value = false;
          loginForm.username = '';
          loginForm.password = '';
          pwNotice.value = '密码已修改，请使用新密码重新登录';
        } catch (e) {
          if (e.status === 401) pwOpen.value = false;
          pwError.value = (e.data && e.data.message) || ('修改失败：' + e.message);
        } finally {
          pwBusy.value = false;
        }
      }

      return {
        authenticated: authenticated, ready: ready, busy: busy,
        loginError: loginError, loginForm: loginForm,
        pwOpen: pwOpen, pwBusy: pwBusy, pwError: pwError,
        pwNotice: pwNotice, pwForm: pwForm,
        navHtml: navHtml, viewHtml: viewHtml, lang: lang, top: top,
        doLogin: doLogin, doLogout: doLogout,
        openPasswordModal: openPasswordModal, closePasswordModal: closePasswordModal,
        doChangePassword: doChangePassword
      };
    },

    template: [
      '<div v-if="!authenticated" class="login-page">',
      '  <div class="login-card">',
      '    <div class="login-logo">HR</div>',
      '    <div class="login-title">人事工作台</div>',
      '    <div class="login-sub">泰国 · 罗勇工厂</div>',
      '    <div v-if="pwNotice" class="login-sub" style="color:#0f7a55;margin:-12px 0 16px">{{ pwNotice }}</div>',
      '    <label class="login-label">用户名',
      '      <input class="input" v-model="loginForm.username" autocomplete="username" @keyup.enter="doLogin">',
      '    </label>',
      '    <label class="login-label">密码',
      '      <input class="input" type="password" v-model="loginForm.password" autocomplete="current-password" @keyup.enter="doLogin">',
      '    </label>',
      '    <div v-if="loginError" class="login-error">{{ loginError }}</div>',
      '    <button class="btn btn-primary login-btn" :disabled="busy" @click="doLogin">{{ busy ? \'登录中…\' : \'登录\' }}</button>',
      '    <div class="login-foot">账号由管理员在服务端配置</div>',
      '  </div>',
      '</div>',
      '<div v-else-if="!ready" class="boot">正在加载数据…</div>',
      '<div v-else class="app">',
      '  <aside class="sidebar" id="sidebar">',
      '    <div class="brand">',
      '      <div class="brand-mark"><div class="brand-logo">HR</div>',
      '        <div><div class="brand-name" id="brandName">{{ top.brandName }}</div></div></div>',
      '      <div class="brand-sub"><span class="dot" style="color:#0f7a55"></span>',
      '        <span id="brandSub">{{ top.brandSub }}</span></div>',
      '    </div>',
      '    <nav class="nav" id="nav" v-html="navHtml"></nav>',
      '    <div class="sidebar-foot"><div class="seg" id="langSeg">',
      '      <button v-for="l in [\'zh\',\'th\']" :key="l" :data-lang="l" :class="{ on: lang === l }">{{ l === \'zh\' ? \'中文\' : \'ไทย\' }}</button>',
      '    </div></div>',
      '  </aside>',
      '  <div class="main">',
      '    <header class="topbar">',
      '      <button class="btn btn-ghost menu-btn" data-act="toggle-menu" aria-label="menu">☰</button>',
      '      <div><h1 class="page-title" id="pageTitle">{{ top.title }}</h1>',
      '        <div class="page-desc" id="pageDesc">{{ top.desc }}</div></div>',
      '      <div class="topbar-right">',
      '        <span class="tiny muted" id="todayLabel">{{ top.today }}</span>',
      '        <button class="btn btn-sm" id="backupBtn" data-act="backup">{{ top.backup }}</button>',
      '        <button class="btn btn-sm" @click="openPasswordModal">修改密码</button>',
      '        <button class="btn btn-sm" data-act="logout" @click="doLogout">退出</button>',
      '      </div>',
      '    </header>',
      '    <main class="content" id="view" v-html="viewHtml"></main>',
      '  </div>',
      '</div>',
      '<div id="modalRoot"></div>',
      '<div v-if="pwOpen" class="overlay">',
      '  <div class="modal">',
      '    <div class="modal-head"><div class="modal-title">修改密码</div>',
      '      <button class="close-x" @click="closePasswordModal">×</button></div>',
      '    <div class="modal-body">',
      '      <div class="field"><label>原密码</label>',
      '        <input class="input" type="password" v-model="pwForm.oldPassword" autocomplete="current-password"></div>',
      '      <div class="field"><label>新密码</label>',
      '        <input class="input" type="password" v-model="pwForm.newPassword" autocomplete="new-password"></div>',
      '      <div class="field"><label>确认新密码</label>',
      '        <input class="input" type="password" v-model="pwForm.confirmPassword" autocomplete="new-password" @keyup.enter="doChangePassword"></div>',
      '      <div v-if="pwError" class="login-error">{{ pwError }}</div>',
      '    </div>',
      '    <div class="modal-foot">',
      '      <button class="btn" @click="closePasswordModal">取消</button>',
      '      <button class="btn btn-primary" :disabled="pwBusy" @click="doChangePassword">{{ pwBusy ? \'提交中…\' : \'确认修改\' }}</button>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div class="toast" id="toast"></div>'
    ].join('\n')
  });

  app.mount('#app');
})();
