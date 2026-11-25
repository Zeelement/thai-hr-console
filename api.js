/* ===========================================================
   前端 API 层：JWT 令牌存取、请求头携带、401 统一处理
   =========================================================== */
(function (global) {
  'use strict';

  var TOKEN_KEY = 'hr_jwt_token';

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(token) { localStorage.setItem(TOKEN_KEY, token); }
  function clearToken() { localStorage.removeItem(TOKEN_KEY); }

  function onUnauthorized(cb) {
    global.addEventListener('hr:unauthorized', cb);
  }

  async function request(url, options) {
    var opt = Object.assign({ method: 'GET', headers: {} }, options || {});
    opt.headers = Object.assign({}, opt.headers);
    var token = getToken();
    if (token) opt.headers['Authorization'] = 'Bearer ' + token;
    if (opt.body && typeof opt.body === 'object' && !(opt.body instanceof Blob)) {
      opt.headers['Content-Type'] = 'application/json';
      opt.body = JSON.stringify(opt.body);
    }

    var resp;
    try {
      resp = await fetch(url, opt);
    } catch (e) {
      var netErr = new Error('无法连接服务器：' + e.message);
      netErr.status = 0;
      throw netErr;
    }

    var data = null;
    try { data = await resp.json(); } catch (e) { data = null; }

    if (resp.status === 401) {
      clearToken();
      global.dispatchEvent(new CustomEvent('hr:unauthorized', { detail: data }));
      var authErr = new Error((data && data.message) || '未登录');
      authErr.status = 401;
      authErr.data = data;
      throw authErr;
    }
    if (!resp.ok) {
      var err = new Error((data && data.message) || ('请求失败（' + resp.status + '）'));
      err.status = resp.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  global.HR_API = {
    TOKEN_KEY: TOKEN_KEY,
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    isLogged: function () { return !!getToken(); },
    onUnauthorized: onUnauthorized,
    request: request,
    login: async function (username, password) {
      var data = await request('/api/auth/login/', {
        method: 'POST',
        body: { username: username, password: password }
      });
      setToken(data.token);
      return data;
    },
    changePassword: function (oldPassword, newPassword) {
      return request('/api/auth/change-password/', {
        method: 'POST',
        body: { oldPassword: oldPassword, newPassword: newPassword }
      });
    },
    getState: function () { return request('/api/state/'); },
    saveState: function (state) {
      return request('/api/state/', { method: 'PUT', body: state });
    }
  };
})(window);
