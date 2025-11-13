import Ot, { dialog as mr, app as ut, BrowserWindow as Ol, ipcMain as mt, shell as ac } from "electron";
import gt from "fs";
import oc from "constants";
import gr from "stream";
import ea from "util";
import Il from "assert";
import Re from "path";
import Br, { spawn as Ca } from "child_process";
import Dl from "events";
import vr from "crypto";
import Nl from "tty";
import Hr from "os";
import qt, { fileURLToPath as sc } from "url";
import lc from "string_decoder";
import Fl from "zlib";
import uc from "http";
var et = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {}, Tt = {}, Qr = {}, br = {}, ba;
function Ye() {
  return ba || (ba = 1, br.fromCallback = function(t) {
    return Object.defineProperty(function(...f) {
      if (typeof f[f.length - 1] == "function") t.apply(this, f);
      else
        return new Promise((h, u) => {
          f.push((c, l) => c != null ? u(c) : h(l)), t.apply(this, f);
        });
    }, "name", { value: t.name });
  }, br.fromPromise = function(t) {
    return Object.defineProperty(function(...f) {
      const h = f[f.length - 1];
      if (typeof h != "function") return t.apply(this, f);
      f.pop(), t.apply(this, f).then((u) => h(null, u), h);
    }, "name", { value: t.name });
  }), br;
}
var Zr, Pa;
function cc() {
  if (Pa) return Zr;
  Pa = 1;
  var t = oc, f = process.cwd, h = null, u = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    return h || (h = f.call(process)), h;
  };
  try {
    process.cwd();
  } catch {
  }
  if (typeof process.chdir == "function") {
    var c = process.chdir;
    process.chdir = function(a) {
      h = null, c.call(process, a);
    }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, c);
  }
  Zr = l;
  function l(a) {
    t.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && d(a), a.lutimes || i(a), a.chown = o(a.chown), a.fchown = o(a.fchown), a.lchown = o(a.lchown), a.chmod = s(a.chmod), a.fchmod = s(a.fchmod), a.lchmod = s(a.lchmod), a.chownSync = n(a.chownSync), a.fchownSync = n(a.fchownSync), a.lchownSync = n(a.lchownSync), a.chmodSync = r(a.chmodSync), a.fchmodSync = r(a.fchmodSync), a.lchmodSync = r(a.lchmodSync), a.stat = m(a.stat), a.fstat = m(a.fstat), a.lstat = m(a.lstat), a.statSync = v(a.statSync), a.fstatSync = v(a.fstatSync), a.lstatSync = v(a.lstatSync), a.chmod && !a.lchmod && (a.lchmod = function(p, A, R) {
      R && process.nextTick(R);
    }, a.lchmodSync = function() {
    }), a.chown && !a.lchown && (a.lchown = function(p, A, R, P) {
      P && process.nextTick(P);
    }, a.lchownSync = function() {
    }), u === "win32" && (a.rename = typeof a.rename != "function" ? a.rename : (function(p) {
      function A(R, P, O) {
        var M = Date.now(), C = 0;
        p(R, P, function S(T) {
          if (T && (T.code === "EACCES" || T.code === "EPERM" || T.code === "EBUSY") && Date.now() - M < 6e4) {
            setTimeout(function() {
              a.stat(P, function(E, q) {
                E && E.code === "ENOENT" ? p(R, P, S) : O(T);
              });
            }, C), C < 100 && (C += 10);
            return;
          }
          O && O(T);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(A, p), A;
    })(a.rename)), a.read = typeof a.read != "function" ? a.read : (function(p) {
      function A(R, P, O, M, C, S) {
        var T;
        if (S && typeof S == "function") {
          var E = 0;
          T = function(q, U, L) {
            if (q && q.code === "EAGAIN" && E < 10)
              return E++, p.call(a, R, P, O, M, C, T);
            S.apply(this, arguments);
          };
        }
        return p.call(a, R, P, O, M, C, T);
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(A, p), A;
    })(a.read), a.readSync = typeof a.readSync != "function" ? a.readSync : /* @__PURE__ */ (function(p) {
      return function(A, R, P, O, M) {
        for (var C = 0; ; )
          try {
            return p.call(a, A, R, P, O, M);
          } catch (S) {
            if (S.code === "EAGAIN" && C < 10) {
              C++;
              continue;
            }
            throw S;
          }
      };
    })(a.readSync);
    function d(p) {
      p.lchmod = function(A, R, P) {
        p.open(
          A,
          t.O_WRONLY | t.O_SYMLINK,
          R,
          function(O, M) {
            if (O) {
              P && P(O);
              return;
            }
            p.fchmod(M, R, function(C) {
              p.close(M, function(S) {
                P && P(C || S);
              });
            });
          }
        );
      }, p.lchmodSync = function(A, R) {
        var P = p.openSync(A, t.O_WRONLY | t.O_SYMLINK, R), O = !0, M;
        try {
          M = p.fchmodSync(P, R), O = !1;
        } finally {
          if (O)
            try {
              p.closeSync(P);
            } catch {
            }
          else
            p.closeSync(P);
        }
        return M;
      };
    }
    function i(p) {
      t.hasOwnProperty("O_SYMLINK") && p.futimes ? (p.lutimes = function(A, R, P, O) {
        p.open(A, t.O_SYMLINK, function(M, C) {
          if (M) {
            O && O(M);
            return;
          }
          p.futimes(C, R, P, function(S) {
            p.close(C, function(T) {
              O && O(S || T);
            });
          });
        });
      }, p.lutimesSync = function(A, R, P) {
        var O = p.openSync(A, t.O_SYMLINK), M, C = !0;
        try {
          M = p.futimesSync(O, R, P), C = !1;
        } finally {
          if (C)
            try {
              p.closeSync(O);
            } catch {
            }
          else
            p.closeSync(O);
        }
        return M;
      }) : p.futimes && (p.lutimes = function(A, R, P, O) {
        O && process.nextTick(O);
      }, p.lutimesSync = function() {
      });
    }
    function s(p) {
      return p && function(A, R, P) {
        return p.call(a, A, R, function(O) {
          y(O) && (O = null), P && P.apply(this, arguments);
        });
      };
    }
    function r(p) {
      return p && function(A, R) {
        try {
          return p.call(a, A, R);
        } catch (P) {
          if (!y(P)) throw P;
        }
      };
    }
    function o(p) {
      return p && function(A, R, P, O) {
        return p.call(a, A, R, P, function(M) {
          y(M) && (M = null), O && O.apply(this, arguments);
        });
      };
    }
    function n(p) {
      return p && function(A, R, P) {
        try {
          return p.call(a, A, R, P);
        } catch (O) {
          if (!y(O)) throw O;
        }
      };
    }
    function m(p) {
      return p && function(A, R, P) {
        typeof R == "function" && (P = R, R = null);
        function O(M, C) {
          C && (C.uid < 0 && (C.uid += 4294967296), C.gid < 0 && (C.gid += 4294967296)), P && P.apply(this, arguments);
        }
        return R ? p.call(a, A, R, O) : p.call(a, A, O);
      };
    }
    function v(p) {
      return p && function(A, R) {
        var P = R ? p.call(a, A, R) : p.call(a, A);
        return P && (P.uid < 0 && (P.uid += 4294967296), P.gid < 0 && (P.gid += 4294967296)), P;
      };
    }
    function y(p) {
      if (!p || p.code === "ENOSYS")
        return !0;
      var A = !process.getuid || process.getuid() !== 0;
      return !!(A && (p.code === "EINVAL" || p.code === "EPERM"));
    }
  }
  return Zr;
}
var en, Oa;
function fc() {
  if (Oa) return en;
  Oa = 1;
  var t = gr.Stream;
  en = f;
  function f(h) {
    return {
      ReadStream: u,
      WriteStream: c
    };
    function u(l, a) {
      if (!(this instanceof u)) return new u(l, a);
      t.call(this);
      var d = this;
      this.path = l, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, a = a || {};
      for (var i = Object.keys(a), s = 0, r = i.length; s < r; s++) {
        var o = i[s];
        this[o] = a[o];
      }
      if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.end === void 0)
          this.end = 1 / 0;
        else if (typeof this.end != "number")
          throw TypeError("end must be a Number");
        if (this.start > this.end)
          throw new Error("start must be <= end");
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          d._read();
        });
        return;
      }
      h.open(this.path, this.flags, this.mode, function(n, m) {
        if (n) {
          d.emit("error", n), d.readable = !1;
          return;
        }
        d.fd = m, d.emit("open", m), d._read();
      });
    }
    function c(l, a) {
      if (!(this instanceof c)) return new c(l, a);
      t.call(this), this.path = l, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, a = a || {};
      for (var d = Object.keys(a), i = 0, s = d.length; i < s; i++) {
        var r = d[i];
        this[r] = a[r];
      }
      if (this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.start < 0)
          throw new Error("start must be >= zero");
        this.pos = this.start;
      }
      this.busy = !1, this._queue = [], this.fd === null && (this._open = h.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
    }
  }
  return en;
}
var tn, Ia;
function dc() {
  if (Ia) return tn;
  Ia = 1, tn = f;
  var t = Object.getPrototypeOf || function(h) {
    return h.__proto__;
  };
  function f(h) {
    if (h === null || typeof h != "object")
      return h;
    if (h instanceof Object)
      var u = { __proto__: t(h) };
    else
      var u = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(h).forEach(function(c) {
      Object.defineProperty(u, c, Object.getOwnPropertyDescriptor(h, c));
    }), u;
  }
  return tn;
}
var Pr, Da;
function We() {
  if (Da) return Pr;
  Da = 1;
  var t = gt, f = cc(), h = fc(), u = dc(), c = ea, l, a;
  typeof Symbol == "function" && typeof Symbol.for == "function" ? (l = Symbol.for("graceful-fs.queue"), a = Symbol.for("graceful-fs.previous")) : (l = "___graceful-fs.queue", a = "___graceful-fs.previous");
  function d() {
  }
  function i(p, A) {
    Object.defineProperty(p, l, {
      get: function() {
        return A;
      }
    });
  }
  var s = d;
  if (c.debuglog ? s = c.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (s = function() {
    var p = c.format.apply(c, arguments);
    p = "GFS4: " + p.split(/\n/).join(`
GFS4: `), console.error(p);
  }), !t[l]) {
    var r = et[l] || [];
    i(t, r), t.close = (function(p) {
      function A(R, P) {
        return p.call(t, R, function(O) {
          O || v(), typeof P == "function" && P.apply(this, arguments);
        });
      }
      return Object.defineProperty(A, a, {
        value: p
      }), A;
    })(t.close), t.closeSync = (function(p) {
      function A(R) {
        p.apply(t, arguments), v();
      }
      return Object.defineProperty(A, a, {
        value: p
      }), A;
    })(t.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
      s(t[l]), Il.equal(t[l].length, 0);
    });
  }
  et[l] || i(et, t[l]), Pr = o(u(t)), process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !t.__patched && (Pr = o(t), t.__patched = !0);
  function o(p) {
    f(p), p.gracefulify = o, p.createReadStream = ce, p.createWriteStream = ue;
    var A = p.readFile;
    p.readFile = R;
    function R(K, Ee, _) {
      return typeof Ee == "function" && (_ = Ee, Ee = null), g(K, Ee, _);
      function g(H, I, le, me) {
        return A(H, I, function(pe) {
          pe && (pe.code === "EMFILE" || pe.code === "ENFILE") ? n([g, [H, I, le], pe, me || Date.now(), Date.now()]) : typeof le == "function" && le.apply(this, arguments);
        });
      }
    }
    var P = p.writeFile;
    p.writeFile = O;
    function O(K, Ee, _, g) {
      return typeof _ == "function" && (g = _, _ = null), H(K, Ee, _, g);
      function H(I, le, me, pe, _e) {
        return P(I, le, me, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? n([H, [I, le, me, pe], ye, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var M = p.appendFile;
    M && (p.appendFile = C);
    function C(K, Ee, _, g) {
      return typeof _ == "function" && (g = _, _ = null), H(K, Ee, _, g);
      function H(I, le, me, pe, _e) {
        return M(I, le, me, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? n([H, [I, le, me, pe], ye, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var S = p.copyFile;
    S && (p.copyFile = T);
    function T(K, Ee, _, g) {
      return typeof _ == "function" && (g = _, _ = 0), H(K, Ee, _, g);
      function H(I, le, me, pe, _e) {
        return S(I, le, me, function(ye) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? n([H, [I, le, me, pe], ye, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    var E = p.readdir;
    p.readdir = U;
    var q = /^v[0-5]\./;
    function U(K, Ee, _) {
      typeof Ee == "function" && (_ = Ee, Ee = null);
      var g = q.test(process.version) ? function(le, me, pe, _e) {
        return E(le, H(
          le,
          me,
          pe,
          _e
        ));
      } : function(le, me, pe, _e) {
        return E(le, me, H(
          le,
          me,
          pe,
          _e
        ));
      };
      return g(K, Ee, _);
      function H(I, le, me, pe) {
        return function(_e, ye) {
          _e && (_e.code === "EMFILE" || _e.code === "ENFILE") ? n([
            g,
            [I, le, me],
            _e,
            pe || Date.now(),
            Date.now()
          ]) : (ye && ye.sort && ye.sort(), typeof me == "function" && me.call(this, _e, ye));
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var L = h(p);
      $ = L.ReadStream, W = L.WriteStream;
    }
    var k = p.ReadStream;
    k && ($.prototype = Object.create(k.prototype), $.prototype.open = J);
    var N = p.WriteStream;
    N && (W.prototype = Object.create(N.prototype), W.prototype.open = ne), Object.defineProperty(p, "ReadStream", {
      get: function() {
        return $;
      },
      set: function(K) {
        $ = K;
      },
      enumerable: !0,
      configurable: !0
    }), Object.defineProperty(p, "WriteStream", {
      get: function() {
        return W;
      },
      set: function(K) {
        W = K;
      },
      enumerable: !0,
      configurable: !0
    });
    var D = $;
    Object.defineProperty(p, "FileReadStream", {
      get: function() {
        return D;
      },
      set: function(K) {
        D = K;
      },
      enumerable: !0,
      configurable: !0
    });
    var F = W;
    Object.defineProperty(p, "FileWriteStream", {
      get: function() {
        return F;
      },
      set: function(K) {
        F = K;
      },
      enumerable: !0,
      configurable: !0
    });
    function $(K, Ee) {
      return this instanceof $ ? (k.apply(this, arguments), this) : $.apply(Object.create($.prototype), arguments);
    }
    function J() {
      var K = this;
      Ae(K.path, K.flags, K.mode, function(Ee, _) {
        Ee ? (K.autoClose && K.destroy(), K.emit("error", Ee)) : (K.fd = _, K.emit("open", _), K.read());
      });
    }
    function W(K, Ee) {
      return this instanceof W ? (N.apply(this, arguments), this) : W.apply(Object.create(W.prototype), arguments);
    }
    function ne() {
      var K = this;
      Ae(K.path, K.flags, K.mode, function(Ee, _) {
        Ee ? (K.destroy(), K.emit("error", Ee)) : (K.fd = _, K.emit("open", _));
      });
    }
    function ce(K, Ee) {
      return new p.ReadStream(K, Ee);
    }
    function ue(K, Ee) {
      return new p.WriteStream(K, Ee);
    }
    var ie = p.open;
    p.open = Ae;
    function Ae(K, Ee, _, g) {
      return typeof _ == "function" && (g = _, _ = null), H(K, Ee, _, g);
      function H(I, le, me, pe, _e) {
        return ie(I, le, me, function(ye, xe) {
          ye && (ye.code === "EMFILE" || ye.code === "ENFILE") ? n([H, [I, le, me, pe], ye, _e || Date.now(), Date.now()]) : typeof pe == "function" && pe.apply(this, arguments);
        });
      }
    }
    return p;
  }
  function n(p) {
    s("ENQUEUE", p[0].name, p[1]), t[l].push(p), y();
  }
  var m;
  function v() {
    for (var p = Date.now(), A = 0; A < t[l].length; ++A)
      t[l][A].length > 2 && (t[l][A][3] = p, t[l][A][4] = p);
    y();
  }
  function y() {
    if (clearTimeout(m), m = void 0, t[l].length !== 0) {
      var p = t[l].shift(), A = p[0], R = p[1], P = p[2], O = p[3], M = p[4];
      if (O === void 0)
        s("RETRY", A.name, R), A.apply(null, R);
      else if (Date.now() - O >= 6e4) {
        s("TIMEOUT", A.name, R);
        var C = R.pop();
        typeof C == "function" && C.call(null, P);
      } else {
        var S = Date.now() - M, T = Math.max(M - O, 1), E = Math.min(T * 1.2, 100);
        S >= E ? (s("RETRY", A.name, R), A.apply(null, R.concat([O]))) : t[l].push(p);
      }
      m === void 0 && (m = setTimeout(y, 0));
    }
  }
  return Pr;
}
var Na;
function Mt() {
  return Na || (Na = 1, (function(t) {
    const f = Ye().fromCallback, h = We(), u = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "lchmod",
      "lchown",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((c) => typeof h[c] == "function");
    Object.assign(t, h), u.forEach((c) => {
      t[c] = f(h[c]);
    }), t.exists = function(c, l) {
      return typeof l == "function" ? h.exists(c, l) : new Promise((a) => h.exists(c, a));
    }, t.read = function(c, l, a, d, i, s) {
      return typeof s == "function" ? h.read(c, l, a, d, i, s) : new Promise((r, o) => {
        h.read(c, l, a, d, i, (n, m, v) => {
          if (n) return o(n);
          r({ bytesRead: m, buffer: v });
        });
      });
    }, t.write = function(c, l, ...a) {
      return typeof a[a.length - 1] == "function" ? h.write(c, l, ...a) : new Promise((d, i) => {
        h.write(c, l, ...a, (s, r, o) => {
          if (s) return i(s);
          d({ bytesWritten: r, buffer: o });
        });
      });
    }, typeof h.writev == "function" && (t.writev = function(c, l, ...a) {
      return typeof a[a.length - 1] == "function" ? h.writev(c, l, ...a) : new Promise((d, i) => {
        h.writev(c, l, ...a, (s, r, o) => {
          if (s) return i(s);
          d({ bytesWritten: r, buffers: o });
        });
      });
    }), typeof h.realpath.native == "function" ? t.realpath.native = f(h.realpath.native) : process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  })(Qr)), Qr;
}
var Or = {}, rn = {}, Fa;
function hc() {
  if (Fa) return rn;
  Fa = 1;
  const t = Re;
  return rn.checkPath = function(h) {
    if (process.platform === "win32" && /[<>:"|?*]/.test(h.replace(t.parse(h).root, ""))) {
      const c = new Error(`Path contains invalid characters: ${h}`);
      throw c.code = "EINVAL", c;
    }
  }, rn;
}
var xa;
function pc() {
  if (xa) return Or;
  xa = 1;
  const t = /* @__PURE__ */ Mt(), { checkPath: f } = /* @__PURE__ */ hc(), h = (u) => {
    const c = { mode: 511 };
    return typeof u == "number" ? u : { ...c, ...u }.mode;
  };
  return Or.makeDir = async (u, c) => (f(u), t.mkdir(u, {
    mode: h(c),
    recursive: !0
  })), Or.makeDirSync = (u, c) => (f(u), t.mkdirSync(u, {
    mode: h(c),
    recursive: !0
  })), Or;
}
var nn, La;
function it() {
  if (La) return nn;
  La = 1;
  const t = Ye().fromPromise, { makeDir: f, makeDirSync: h } = /* @__PURE__ */ pc(), u = t(f);
  return nn = {
    mkdirs: u,
    mkdirsSync: h,
    // alias
    mkdirp: u,
    mkdirpSync: h,
    ensureDir: u,
    ensureDirSync: h
  }, nn;
}
var an, Ua;
function It() {
  if (Ua) return an;
  Ua = 1;
  const t = Ye().fromPromise, f = /* @__PURE__ */ Mt();
  function h(u) {
    return f.access(u).then(() => !0).catch(() => !1);
  }
  return an = {
    pathExists: t(h),
    pathExistsSync: f.existsSync
  }, an;
}
var on, $a;
function xl() {
  if ($a) return on;
  $a = 1;
  const t = We();
  function f(u, c, l, a) {
    t.open(u, "r+", (d, i) => {
      if (d) return a(d);
      t.futimes(i, c, l, (s) => {
        t.close(i, (r) => {
          a && a(s || r);
        });
      });
    });
  }
  function h(u, c, l) {
    const a = t.openSync(u, "r+");
    return t.futimesSync(a, c, l), t.closeSync(a);
  }
  return on = {
    utimesMillis: f,
    utimesMillisSync: h
  }, on;
}
var sn, ka;
function Bt() {
  if (ka) return sn;
  ka = 1;
  const t = /* @__PURE__ */ Mt(), f = Re, h = ea;
  function u(n, m, v) {
    const y = v.dereference ? (p) => t.stat(p, { bigint: !0 }) : (p) => t.lstat(p, { bigint: !0 });
    return Promise.all([
      y(n),
      y(m).catch((p) => {
        if (p.code === "ENOENT") return null;
        throw p;
      })
    ]).then(([p, A]) => ({ srcStat: p, destStat: A }));
  }
  function c(n, m, v) {
    let y;
    const p = v.dereference ? (R) => t.statSync(R, { bigint: !0 }) : (R) => t.lstatSync(R, { bigint: !0 }), A = p(n);
    try {
      y = p(m);
    } catch (R) {
      if (R.code === "ENOENT") return { srcStat: A, destStat: null };
      throw R;
    }
    return { srcStat: A, destStat: y };
  }
  function l(n, m, v, y, p) {
    h.callbackify(u)(n, m, y, (A, R) => {
      if (A) return p(A);
      const { srcStat: P, destStat: O } = R;
      if (O) {
        if (s(P, O)) {
          const M = f.basename(n), C = f.basename(m);
          return v === "move" && M !== C && M.toLowerCase() === C.toLowerCase() ? p(null, { srcStat: P, destStat: O, isChangingCase: !0 }) : p(new Error("Source and destination must not be the same."));
        }
        if (P.isDirectory() && !O.isDirectory())
          return p(new Error(`Cannot overwrite non-directory '${m}' with directory '${n}'.`));
        if (!P.isDirectory() && O.isDirectory())
          return p(new Error(`Cannot overwrite directory '${m}' with non-directory '${n}'.`));
      }
      return P.isDirectory() && r(n, m) ? p(new Error(o(n, m, v))) : p(null, { srcStat: P, destStat: O });
    });
  }
  function a(n, m, v, y) {
    const { srcStat: p, destStat: A } = c(n, m, y);
    if (A) {
      if (s(p, A)) {
        const R = f.basename(n), P = f.basename(m);
        if (v === "move" && R !== P && R.toLowerCase() === P.toLowerCase())
          return { srcStat: p, destStat: A, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (p.isDirectory() && !A.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${m}' with directory '${n}'.`);
      if (!p.isDirectory() && A.isDirectory())
        throw new Error(`Cannot overwrite directory '${m}' with non-directory '${n}'.`);
    }
    if (p.isDirectory() && r(n, m))
      throw new Error(o(n, m, v));
    return { srcStat: p, destStat: A };
  }
  function d(n, m, v, y, p) {
    const A = f.resolve(f.dirname(n)), R = f.resolve(f.dirname(v));
    if (R === A || R === f.parse(R).root) return p();
    t.stat(R, { bigint: !0 }, (P, O) => P ? P.code === "ENOENT" ? p() : p(P) : s(m, O) ? p(new Error(o(n, v, y))) : d(n, m, R, y, p));
  }
  function i(n, m, v, y) {
    const p = f.resolve(f.dirname(n)), A = f.resolve(f.dirname(v));
    if (A === p || A === f.parse(A).root) return;
    let R;
    try {
      R = t.statSync(A, { bigint: !0 });
    } catch (P) {
      if (P.code === "ENOENT") return;
      throw P;
    }
    if (s(m, R))
      throw new Error(o(n, v, y));
    return i(n, m, A, y);
  }
  function s(n, m) {
    return m.ino && m.dev && m.ino === n.ino && m.dev === n.dev;
  }
  function r(n, m) {
    const v = f.resolve(n).split(f.sep).filter((p) => p), y = f.resolve(m).split(f.sep).filter((p) => p);
    return v.reduce((p, A, R) => p && y[R] === A, !0);
  }
  function o(n, m, v) {
    return `Cannot ${v} '${n}' to a subdirectory of itself, '${m}'.`;
  }
  return sn = {
    checkPaths: l,
    checkPathsSync: a,
    checkParentPaths: d,
    checkParentPathsSync: i,
    isSrcSubdir: r,
    areIdentical: s
  }, sn;
}
var ln, qa;
function mc() {
  if (qa) return ln;
  qa = 1;
  const t = We(), f = Re, h = it().mkdirs, u = It().pathExists, c = xl().utimesMillis, l = /* @__PURE__ */ Bt();
  function a(U, L, k, N) {
    typeof k == "function" && !N ? (N = k, k = {}) : typeof k == "function" && (k = { filter: k }), N = N || function() {
    }, k = k || {}, k.clobber = "clobber" in k ? !!k.clobber : !0, k.overwrite = "overwrite" in k ? !!k.overwrite : k.clobber, k.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0001"
    ), l.checkPaths(U, L, "copy", k, (D, F) => {
      if (D) return N(D);
      const { srcStat: $, destStat: J } = F;
      l.checkParentPaths(U, $, L, "copy", (W) => W ? N(W) : k.filter ? i(d, J, U, L, k, N) : d(J, U, L, k, N));
    });
  }
  function d(U, L, k, N, D) {
    const F = f.dirname(k);
    u(F, ($, J) => {
      if ($) return D($);
      if (J) return r(U, L, k, N, D);
      h(F, (W) => W ? D(W) : r(U, L, k, N, D));
    });
  }
  function i(U, L, k, N, D, F) {
    Promise.resolve(D.filter(k, N)).then(($) => $ ? U(L, k, N, D, F) : F(), ($) => F($));
  }
  function s(U, L, k, N, D) {
    return N.filter ? i(r, U, L, k, N, D) : r(U, L, k, N, D);
  }
  function r(U, L, k, N, D) {
    (N.dereference ? t.stat : t.lstat)(L, ($, J) => $ ? D($) : J.isDirectory() ? O(J, U, L, k, N, D) : J.isFile() || J.isCharacterDevice() || J.isBlockDevice() ? o(J, U, L, k, N, D) : J.isSymbolicLink() ? E(U, L, k, N, D) : J.isSocket() ? D(new Error(`Cannot copy a socket file: ${L}`)) : J.isFIFO() ? D(new Error(`Cannot copy a FIFO pipe: ${L}`)) : D(new Error(`Unknown file: ${L}`)));
  }
  function o(U, L, k, N, D, F) {
    return L ? n(U, k, N, D, F) : m(U, k, N, D, F);
  }
  function n(U, L, k, N, D) {
    if (N.overwrite)
      t.unlink(k, (F) => F ? D(F) : m(U, L, k, N, D));
    else return N.errorOnExist ? D(new Error(`'${k}' already exists`)) : D();
  }
  function m(U, L, k, N, D) {
    t.copyFile(L, k, (F) => F ? D(F) : N.preserveTimestamps ? v(U.mode, L, k, D) : R(k, U.mode, D));
  }
  function v(U, L, k, N) {
    return y(U) ? p(k, U, (D) => D ? N(D) : A(U, L, k, N)) : A(U, L, k, N);
  }
  function y(U) {
    return (U & 128) === 0;
  }
  function p(U, L, k) {
    return R(U, L | 128, k);
  }
  function A(U, L, k, N) {
    P(L, k, (D) => D ? N(D) : R(k, U, N));
  }
  function R(U, L, k) {
    return t.chmod(U, L, k);
  }
  function P(U, L, k) {
    t.stat(U, (N, D) => N ? k(N) : c(L, D.atime, D.mtime, k));
  }
  function O(U, L, k, N, D, F) {
    return L ? C(k, N, D, F) : M(U.mode, k, N, D, F);
  }
  function M(U, L, k, N, D) {
    t.mkdir(k, (F) => {
      if (F) return D(F);
      C(L, k, N, ($) => $ ? D($) : R(k, U, D));
    });
  }
  function C(U, L, k, N) {
    t.readdir(U, (D, F) => D ? N(D) : S(F, U, L, k, N));
  }
  function S(U, L, k, N, D) {
    const F = U.pop();
    return F ? T(U, F, L, k, N, D) : D();
  }
  function T(U, L, k, N, D, F) {
    const $ = f.join(k, L), J = f.join(N, L);
    l.checkPaths($, J, "copy", D, (W, ne) => {
      if (W) return F(W);
      const { destStat: ce } = ne;
      s(ce, $, J, D, (ue) => ue ? F(ue) : S(U, k, N, D, F));
    });
  }
  function E(U, L, k, N, D) {
    t.readlink(L, (F, $) => {
      if (F) return D(F);
      if (N.dereference && ($ = f.resolve(process.cwd(), $)), U)
        t.readlink(k, (J, W) => J ? J.code === "EINVAL" || J.code === "UNKNOWN" ? t.symlink($, k, D) : D(J) : (N.dereference && (W = f.resolve(process.cwd(), W)), l.isSrcSubdir($, W) ? D(new Error(`Cannot copy '${$}' to a subdirectory of itself, '${W}'.`)) : U.isDirectory() && l.isSrcSubdir(W, $) ? D(new Error(`Cannot overwrite '${W}' with '${$}'.`)) : q($, k, D)));
      else
        return t.symlink($, k, D);
    });
  }
  function q(U, L, k) {
    t.unlink(L, (N) => N ? k(N) : t.symlink(U, L, k));
  }
  return ln = a, ln;
}
var un, Ma;
function gc() {
  if (Ma) return un;
  Ma = 1;
  const t = We(), f = Re, h = it().mkdirsSync, u = xl().utimesMillisSync, c = /* @__PURE__ */ Bt();
  function l(S, T, E) {
    typeof E == "function" && (E = { filter: E }), E = E || {}, E.clobber = "clobber" in E ? !!E.clobber : !0, E.overwrite = "overwrite" in E ? !!E.overwrite : E.clobber, E.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0002"
    );
    const { srcStat: q, destStat: U } = c.checkPathsSync(S, T, "copy", E);
    return c.checkParentPathsSync(S, q, T, "copy"), a(U, S, T, E);
  }
  function a(S, T, E, q) {
    if (q.filter && !q.filter(T, E)) return;
    const U = f.dirname(E);
    return t.existsSync(U) || h(U), i(S, T, E, q);
  }
  function d(S, T, E, q) {
    if (!(q.filter && !q.filter(T, E)))
      return i(S, T, E, q);
  }
  function i(S, T, E, q) {
    const L = (q.dereference ? t.statSync : t.lstatSync)(T);
    if (L.isDirectory()) return A(L, S, T, E, q);
    if (L.isFile() || L.isCharacterDevice() || L.isBlockDevice()) return s(L, S, T, E, q);
    if (L.isSymbolicLink()) return M(S, T, E, q);
    throw L.isSocket() ? new Error(`Cannot copy a socket file: ${T}`) : L.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${T}`) : new Error(`Unknown file: ${T}`);
  }
  function s(S, T, E, q, U) {
    return T ? r(S, E, q, U) : o(S, E, q, U);
  }
  function r(S, T, E, q) {
    if (q.overwrite)
      return t.unlinkSync(E), o(S, T, E, q);
    if (q.errorOnExist)
      throw new Error(`'${E}' already exists`);
  }
  function o(S, T, E, q) {
    return t.copyFileSync(T, E), q.preserveTimestamps && n(S.mode, T, E), y(E, S.mode);
  }
  function n(S, T, E) {
    return m(S) && v(E, S), p(T, E);
  }
  function m(S) {
    return (S & 128) === 0;
  }
  function v(S, T) {
    return y(S, T | 128);
  }
  function y(S, T) {
    return t.chmodSync(S, T);
  }
  function p(S, T) {
    const E = t.statSync(S);
    return u(T, E.atime, E.mtime);
  }
  function A(S, T, E, q, U) {
    return T ? P(E, q, U) : R(S.mode, E, q, U);
  }
  function R(S, T, E, q) {
    return t.mkdirSync(E), P(T, E, q), y(E, S);
  }
  function P(S, T, E) {
    t.readdirSync(S).forEach((q) => O(q, S, T, E));
  }
  function O(S, T, E, q) {
    const U = f.join(T, S), L = f.join(E, S), { destStat: k } = c.checkPathsSync(U, L, "copy", q);
    return d(k, U, L, q);
  }
  function M(S, T, E, q) {
    let U = t.readlinkSync(T);
    if (q.dereference && (U = f.resolve(process.cwd(), U)), S) {
      let L;
      try {
        L = t.readlinkSync(E);
      } catch (k) {
        if (k.code === "EINVAL" || k.code === "UNKNOWN") return t.symlinkSync(U, E);
        throw k;
      }
      if (q.dereference && (L = f.resolve(process.cwd(), L)), c.isSrcSubdir(U, L))
        throw new Error(`Cannot copy '${U}' to a subdirectory of itself, '${L}'.`);
      if (t.statSync(E).isDirectory() && c.isSrcSubdir(L, U))
        throw new Error(`Cannot overwrite '${L}' with '${U}'.`);
      return C(U, E);
    } else
      return t.symlinkSync(U, E);
  }
  function C(S, T) {
    return t.unlinkSync(T), t.symlinkSync(S, T);
  }
  return un = l, un;
}
var cn, Ba;
function ta() {
  if (Ba) return cn;
  Ba = 1;
  const t = Ye().fromCallback;
  return cn = {
    copy: t(/* @__PURE__ */ mc()),
    copySync: /* @__PURE__ */ gc()
  }, cn;
}
var fn, Ha;
function vc() {
  if (Ha) return fn;
  Ha = 1;
  const t = We(), f = Re, h = Il, u = process.platform === "win32";
  function c(v) {
    [
      "unlink",
      "chmod",
      "stat",
      "lstat",
      "rmdir",
      "readdir"
    ].forEach((p) => {
      v[p] = v[p] || t[p], p = p + "Sync", v[p] = v[p] || t[p];
    }), v.maxBusyTries = v.maxBusyTries || 3;
  }
  function l(v, y, p) {
    let A = 0;
    typeof y == "function" && (p = y, y = {}), h(v, "rimraf: missing path"), h.strictEqual(typeof v, "string", "rimraf: path should be a string"), h.strictEqual(typeof p, "function", "rimraf: callback function required"), h(y, "rimraf: invalid options argument provided"), h.strictEqual(typeof y, "object", "rimraf: options should be object"), c(y), a(v, y, function R(P) {
      if (P) {
        if ((P.code === "EBUSY" || P.code === "ENOTEMPTY" || P.code === "EPERM") && A < y.maxBusyTries) {
          A++;
          const O = A * 100;
          return setTimeout(() => a(v, y, R), O);
        }
        P.code === "ENOENT" && (P = null);
      }
      p(P);
    });
  }
  function a(v, y, p) {
    h(v), h(y), h(typeof p == "function"), y.lstat(v, (A, R) => {
      if (A && A.code === "ENOENT")
        return p(null);
      if (A && A.code === "EPERM" && u)
        return d(v, y, A, p);
      if (R && R.isDirectory())
        return s(v, y, A, p);
      y.unlink(v, (P) => {
        if (P) {
          if (P.code === "ENOENT")
            return p(null);
          if (P.code === "EPERM")
            return u ? d(v, y, P, p) : s(v, y, P, p);
          if (P.code === "EISDIR")
            return s(v, y, P, p);
        }
        return p(P);
      });
    });
  }
  function d(v, y, p, A) {
    h(v), h(y), h(typeof A == "function"), y.chmod(v, 438, (R) => {
      R ? A(R.code === "ENOENT" ? null : p) : y.stat(v, (P, O) => {
        P ? A(P.code === "ENOENT" ? null : p) : O.isDirectory() ? s(v, y, p, A) : y.unlink(v, A);
      });
    });
  }
  function i(v, y, p) {
    let A;
    h(v), h(y);
    try {
      y.chmodSync(v, 438);
    } catch (R) {
      if (R.code === "ENOENT")
        return;
      throw p;
    }
    try {
      A = y.statSync(v);
    } catch (R) {
      if (R.code === "ENOENT")
        return;
      throw p;
    }
    A.isDirectory() ? n(v, y, p) : y.unlinkSync(v);
  }
  function s(v, y, p, A) {
    h(v), h(y), h(typeof A == "function"), y.rmdir(v, (R) => {
      R && (R.code === "ENOTEMPTY" || R.code === "EEXIST" || R.code === "EPERM") ? r(v, y, A) : R && R.code === "ENOTDIR" ? A(p) : A(R);
    });
  }
  function r(v, y, p) {
    h(v), h(y), h(typeof p == "function"), y.readdir(v, (A, R) => {
      if (A) return p(A);
      let P = R.length, O;
      if (P === 0) return y.rmdir(v, p);
      R.forEach((M) => {
        l(f.join(v, M), y, (C) => {
          if (!O) {
            if (C) return p(O = C);
            --P === 0 && y.rmdir(v, p);
          }
        });
      });
    });
  }
  function o(v, y) {
    let p;
    y = y || {}, c(y), h(v, "rimraf: missing path"), h.strictEqual(typeof v, "string", "rimraf: path should be a string"), h(y, "rimraf: missing options"), h.strictEqual(typeof y, "object", "rimraf: options should be object");
    try {
      p = y.lstatSync(v);
    } catch (A) {
      if (A.code === "ENOENT")
        return;
      A.code === "EPERM" && u && i(v, y, A);
    }
    try {
      p && p.isDirectory() ? n(v, y, null) : y.unlinkSync(v);
    } catch (A) {
      if (A.code === "ENOENT")
        return;
      if (A.code === "EPERM")
        return u ? i(v, y, A) : n(v, y, A);
      if (A.code !== "EISDIR")
        throw A;
      n(v, y, A);
    }
  }
  function n(v, y, p) {
    h(v), h(y);
    try {
      y.rmdirSync(v);
    } catch (A) {
      if (A.code === "ENOTDIR")
        throw p;
      if (A.code === "ENOTEMPTY" || A.code === "EEXIST" || A.code === "EPERM")
        m(v, y);
      else if (A.code !== "ENOENT")
        throw A;
    }
  }
  function m(v, y) {
    if (h(v), h(y), y.readdirSync(v).forEach((p) => o(f.join(v, p), y)), u) {
      const p = Date.now();
      do
        try {
          return y.rmdirSync(v, y);
        } catch {
        }
      while (Date.now() - p < 500);
    } else
      return y.rmdirSync(v, y);
  }
  return fn = l, l.sync = o, fn;
}
var dn, ja;
function jr() {
  if (ja) return dn;
  ja = 1;
  const t = We(), f = Ye().fromCallback, h = /* @__PURE__ */ vc();
  function u(l, a) {
    if (t.rm) return t.rm(l, { recursive: !0, force: !0 }, a);
    h(l, a);
  }
  function c(l) {
    if (t.rmSync) return t.rmSync(l, { recursive: !0, force: !0 });
    h.sync(l);
  }
  return dn = {
    remove: f(u),
    removeSync: c
  }, dn;
}
var hn, Ga;
function Ec() {
  if (Ga) return hn;
  Ga = 1;
  const t = Ye().fromPromise, f = /* @__PURE__ */ Mt(), h = Re, u = /* @__PURE__ */ it(), c = /* @__PURE__ */ jr(), l = t(async function(i) {
    let s;
    try {
      s = await f.readdir(i);
    } catch {
      return u.mkdirs(i);
    }
    return Promise.all(s.map((r) => c.remove(h.join(i, r))));
  });
  function a(d) {
    let i;
    try {
      i = f.readdirSync(d);
    } catch {
      return u.mkdirsSync(d);
    }
    i.forEach((s) => {
      s = h.join(d, s), c.removeSync(s);
    });
  }
  return hn = {
    emptyDirSync: a,
    emptydirSync: a,
    emptyDir: l,
    emptydir: l
  }, hn;
}
var pn, Wa;
function yc() {
  if (Wa) return pn;
  Wa = 1;
  const t = Ye().fromCallback, f = Re, h = We(), u = /* @__PURE__ */ it();
  function c(a, d) {
    function i() {
      h.writeFile(a, "", (s) => {
        if (s) return d(s);
        d();
      });
    }
    h.stat(a, (s, r) => {
      if (!s && r.isFile()) return d();
      const o = f.dirname(a);
      h.stat(o, (n, m) => {
        if (n)
          return n.code === "ENOENT" ? u.mkdirs(o, (v) => {
            if (v) return d(v);
            i();
          }) : d(n);
        m.isDirectory() ? i() : h.readdir(o, (v) => {
          if (v) return d(v);
        });
      });
    });
  }
  function l(a) {
    let d;
    try {
      d = h.statSync(a);
    } catch {
    }
    if (d && d.isFile()) return;
    const i = f.dirname(a);
    try {
      h.statSync(i).isDirectory() || h.readdirSync(i);
    } catch (s) {
      if (s && s.code === "ENOENT") u.mkdirsSync(i);
      else throw s;
    }
    h.writeFileSync(a, "");
  }
  return pn = {
    createFile: t(c),
    createFileSync: l
  }, pn;
}
var mn, Va;
function wc() {
  if (Va) return mn;
  Va = 1;
  const t = Ye().fromCallback, f = Re, h = We(), u = /* @__PURE__ */ it(), c = It().pathExists, { areIdentical: l } = /* @__PURE__ */ Bt();
  function a(i, s, r) {
    function o(n, m) {
      h.link(n, m, (v) => {
        if (v) return r(v);
        r(null);
      });
    }
    h.lstat(s, (n, m) => {
      h.lstat(i, (v, y) => {
        if (v)
          return v.message = v.message.replace("lstat", "ensureLink"), r(v);
        if (m && l(y, m)) return r(null);
        const p = f.dirname(s);
        c(p, (A, R) => {
          if (A) return r(A);
          if (R) return o(i, s);
          u.mkdirs(p, (P) => {
            if (P) return r(P);
            o(i, s);
          });
        });
      });
    });
  }
  function d(i, s) {
    let r;
    try {
      r = h.lstatSync(s);
    } catch {
    }
    try {
      const m = h.lstatSync(i);
      if (r && l(m, r)) return;
    } catch (m) {
      throw m.message = m.message.replace("lstat", "ensureLink"), m;
    }
    const o = f.dirname(s);
    return h.existsSync(o) || u.mkdirsSync(o), h.linkSync(i, s);
  }
  return mn = {
    createLink: t(a),
    createLinkSync: d
  }, mn;
}
var gn, Ya;
function _c() {
  if (Ya) return gn;
  Ya = 1;
  const t = Re, f = We(), h = It().pathExists;
  function u(l, a, d) {
    if (t.isAbsolute(l))
      return f.lstat(l, (i) => i ? (i.message = i.message.replace("lstat", "ensureSymlink"), d(i)) : d(null, {
        toCwd: l,
        toDst: l
      }));
    {
      const i = t.dirname(a), s = t.join(i, l);
      return h(s, (r, o) => r ? d(r) : o ? d(null, {
        toCwd: s,
        toDst: l
      }) : f.lstat(l, (n) => n ? (n.message = n.message.replace("lstat", "ensureSymlink"), d(n)) : d(null, {
        toCwd: l,
        toDst: t.relative(i, l)
      })));
    }
  }
  function c(l, a) {
    let d;
    if (t.isAbsolute(l)) {
      if (d = f.existsSync(l), !d) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: l,
        toDst: l
      };
    } else {
      const i = t.dirname(a), s = t.join(i, l);
      if (d = f.existsSync(s), d)
        return {
          toCwd: s,
          toDst: l
        };
      if (d = f.existsSync(l), !d) throw new Error("relative srcpath does not exist");
      return {
        toCwd: l,
        toDst: t.relative(i, l)
      };
    }
  }
  return gn = {
    symlinkPaths: u,
    symlinkPathsSync: c
  }, gn;
}
var vn, za;
function Sc() {
  if (za) return vn;
  za = 1;
  const t = We();
  function f(u, c, l) {
    if (l = typeof c == "function" ? c : l, c = typeof c == "function" ? !1 : c, c) return l(null, c);
    t.lstat(u, (a, d) => {
      if (a) return l(null, "file");
      c = d && d.isDirectory() ? "dir" : "file", l(null, c);
    });
  }
  function h(u, c) {
    let l;
    if (c) return c;
    try {
      l = t.lstatSync(u);
    } catch {
      return "file";
    }
    return l && l.isDirectory() ? "dir" : "file";
  }
  return vn = {
    symlinkType: f,
    symlinkTypeSync: h
  }, vn;
}
var En, Xa;
function Ac() {
  if (Xa) return En;
  Xa = 1;
  const t = Ye().fromCallback, f = Re, h = /* @__PURE__ */ Mt(), u = /* @__PURE__ */ it(), c = u.mkdirs, l = u.mkdirsSync, a = /* @__PURE__ */ _c(), d = a.symlinkPaths, i = a.symlinkPathsSync, s = /* @__PURE__ */ Sc(), r = s.symlinkType, o = s.symlinkTypeSync, n = It().pathExists, { areIdentical: m } = /* @__PURE__ */ Bt();
  function v(A, R, P, O) {
    O = typeof P == "function" ? P : O, P = typeof P == "function" ? !1 : P, h.lstat(R, (M, C) => {
      !M && C.isSymbolicLink() ? Promise.all([
        h.stat(A),
        h.stat(R)
      ]).then(([S, T]) => {
        if (m(S, T)) return O(null);
        y(A, R, P, O);
      }) : y(A, R, P, O);
    });
  }
  function y(A, R, P, O) {
    d(A, R, (M, C) => {
      if (M) return O(M);
      A = C.toDst, r(C.toCwd, P, (S, T) => {
        if (S) return O(S);
        const E = f.dirname(R);
        n(E, (q, U) => {
          if (q) return O(q);
          if (U) return h.symlink(A, R, T, O);
          c(E, (L) => {
            if (L) return O(L);
            h.symlink(A, R, T, O);
          });
        });
      });
    });
  }
  function p(A, R, P) {
    let O;
    try {
      O = h.lstatSync(R);
    } catch {
    }
    if (O && O.isSymbolicLink()) {
      const T = h.statSync(A), E = h.statSync(R);
      if (m(T, E)) return;
    }
    const M = i(A, R);
    A = M.toDst, P = o(M.toCwd, P);
    const C = f.dirname(R);
    return h.existsSync(C) || l(C), h.symlinkSync(A, R, P);
  }
  return En = {
    createSymlink: t(v),
    createSymlinkSync: p
  }, En;
}
var yn, Ka;
function Tc() {
  if (Ka) return yn;
  Ka = 1;
  const { createFile: t, createFileSync: f } = /* @__PURE__ */ yc(), { createLink: h, createLinkSync: u } = /* @__PURE__ */ wc(), { createSymlink: c, createSymlinkSync: l } = /* @__PURE__ */ Ac();
  return yn = {
    // file
    createFile: t,
    createFileSync: f,
    ensureFile: t,
    ensureFileSync: f,
    // link
    createLink: h,
    createLinkSync: u,
    ensureLink: h,
    ensureLinkSync: u,
    // symlink
    createSymlink: c,
    createSymlinkSync: l,
    ensureSymlink: c,
    ensureSymlinkSync: l
  }, yn;
}
var wn, Ja;
function ra() {
  if (Ja) return wn;
  Ja = 1;
  function t(h, { EOL: u = `
`, finalEOL: c = !0, replacer: l = null, spaces: a } = {}) {
    const d = c ? u : "";
    return JSON.stringify(h, l, a).replace(/\n/g, u) + d;
  }
  function f(h) {
    return Buffer.isBuffer(h) && (h = h.toString("utf8")), h.replace(/^\uFEFF/, "");
  }
  return wn = { stringify: t, stripBom: f }, wn;
}
var _n, Qa;
function Rc() {
  if (Qa) return _n;
  Qa = 1;
  let t;
  try {
    t = We();
  } catch {
    t = gt;
  }
  const f = Ye(), { stringify: h, stripBom: u } = ra();
  async function c(r, o = {}) {
    typeof o == "string" && (o = { encoding: o });
    const n = o.fs || t, m = "throws" in o ? o.throws : !0;
    let v = await f.fromCallback(n.readFile)(r, o);
    v = u(v);
    let y;
    try {
      y = JSON.parse(v, o ? o.reviver : null);
    } catch (p) {
      if (m)
        throw p.message = `${r}: ${p.message}`, p;
      return null;
    }
    return y;
  }
  const l = f.fromPromise(c);
  function a(r, o = {}) {
    typeof o == "string" && (o = { encoding: o });
    const n = o.fs || t, m = "throws" in o ? o.throws : !0;
    try {
      let v = n.readFileSync(r, o);
      return v = u(v), JSON.parse(v, o.reviver);
    } catch (v) {
      if (m)
        throw v.message = `${r}: ${v.message}`, v;
      return null;
    }
  }
  async function d(r, o, n = {}) {
    const m = n.fs || t, v = h(o, n);
    await f.fromCallback(m.writeFile)(r, v, n);
  }
  const i = f.fromPromise(d);
  function s(r, o, n = {}) {
    const m = n.fs || t, v = h(o, n);
    return m.writeFileSync(r, v, n);
  }
  return _n = {
    readFile: l,
    readFileSync: a,
    writeFile: i,
    writeFileSync: s
  }, _n;
}
var Sn, Za;
function Cc() {
  if (Za) return Sn;
  Za = 1;
  const t = Rc();
  return Sn = {
    // jsonfile exports
    readJson: t.readFile,
    readJsonSync: t.readFileSync,
    writeJson: t.writeFile,
    writeJsonSync: t.writeFileSync
  }, Sn;
}
var An, eo;
function na() {
  if (eo) return An;
  eo = 1;
  const t = Ye().fromCallback, f = We(), h = Re, u = /* @__PURE__ */ it(), c = It().pathExists;
  function l(d, i, s, r) {
    typeof s == "function" && (r = s, s = "utf8");
    const o = h.dirname(d);
    c(o, (n, m) => {
      if (n) return r(n);
      if (m) return f.writeFile(d, i, s, r);
      u.mkdirs(o, (v) => {
        if (v) return r(v);
        f.writeFile(d, i, s, r);
      });
    });
  }
  function a(d, ...i) {
    const s = h.dirname(d);
    if (f.existsSync(s))
      return f.writeFileSync(d, ...i);
    u.mkdirsSync(s), f.writeFileSync(d, ...i);
  }
  return An = {
    outputFile: t(l),
    outputFileSync: a
  }, An;
}
var Tn, to;
function bc() {
  if (to) return Tn;
  to = 1;
  const { stringify: t } = ra(), { outputFile: f } = /* @__PURE__ */ na();
  async function h(u, c, l = {}) {
    const a = t(c, l);
    await f(u, a, l);
  }
  return Tn = h, Tn;
}
var Rn, ro;
function Pc() {
  if (ro) return Rn;
  ro = 1;
  const { stringify: t } = ra(), { outputFileSync: f } = /* @__PURE__ */ na();
  function h(u, c, l) {
    const a = t(c, l);
    f(u, a, l);
  }
  return Rn = h, Rn;
}
var Cn, no;
function Oc() {
  if (no) return Cn;
  no = 1;
  const t = Ye().fromPromise, f = /* @__PURE__ */ Cc();
  return f.outputJson = t(/* @__PURE__ */ bc()), f.outputJsonSync = /* @__PURE__ */ Pc(), f.outputJSON = f.outputJson, f.outputJSONSync = f.outputJsonSync, f.writeJSON = f.writeJson, f.writeJSONSync = f.writeJsonSync, f.readJSON = f.readJson, f.readJSONSync = f.readJsonSync, Cn = f, Cn;
}
var bn, io;
function Ic() {
  if (io) return bn;
  io = 1;
  const t = We(), f = Re, h = ta().copy, u = jr().remove, c = it().mkdirp, l = It().pathExists, a = /* @__PURE__ */ Bt();
  function d(n, m, v, y) {
    typeof v == "function" && (y = v, v = {}), v = v || {};
    const p = v.overwrite || v.clobber || !1;
    a.checkPaths(n, m, "move", v, (A, R) => {
      if (A) return y(A);
      const { srcStat: P, isChangingCase: O = !1 } = R;
      a.checkParentPaths(n, P, m, "move", (M) => {
        if (M) return y(M);
        if (i(m)) return s(n, m, p, O, y);
        c(f.dirname(m), (C) => C ? y(C) : s(n, m, p, O, y));
      });
    });
  }
  function i(n) {
    const m = f.dirname(n);
    return f.parse(m).root === m;
  }
  function s(n, m, v, y, p) {
    if (y) return r(n, m, v, p);
    if (v)
      return u(m, (A) => A ? p(A) : r(n, m, v, p));
    l(m, (A, R) => A ? p(A) : R ? p(new Error("dest already exists.")) : r(n, m, v, p));
  }
  function r(n, m, v, y) {
    t.rename(n, m, (p) => p ? p.code !== "EXDEV" ? y(p) : o(n, m, v, y) : y());
  }
  function o(n, m, v, y) {
    h(n, m, {
      overwrite: v,
      errorOnExist: !0
    }, (A) => A ? y(A) : u(n, y));
  }
  return bn = d, bn;
}
var Pn, ao;
function Dc() {
  if (ao) return Pn;
  ao = 1;
  const t = We(), f = Re, h = ta().copySync, u = jr().removeSync, c = it().mkdirpSync, l = /* @__PURE__ */ Bt();
  function a(o, n, m) {
    m = m || {};
    const v = m.overwrite || m.clobber || !1, { srcStat: y, isChangingCase: p = !1 } = l.checkPathsSync(o, n, "move", m);
    return l.checkParentPathsSync(o, y, n, "move"), d(n) || c(f.dirname(n)), i(o, n, v, p);
  }
  function d(o) {
    const n = f.dirname(o);
    return f.parse(n).root === n;
  }
  function i(o, n, m, v) {
    if (v) return s(o, n, m);
    if (m)
      return u(n), s(o, n, m);
    if (t.existsSync(n)) throw new Error("dest already exists.");
    return s(o, n, m);
  }
  function s(o, n, m) {
    try {
      t.renameSync(o, n);
    } catch (v) {
      if (v.code !== "EXDEV") throw v;
      return r(o, n, m);
    }
  }
  function r(o, n, m) {
    return h(o, n, {
      overwrite: m,
      errorOnExist: !0
    }), u(o);
  }
  return Pn = a, Pn;
}
var On, oo;
function Nc() {
  if (oo) return On;
  oo = 1;
  const t = Ye().fromCallback;
  return On = {
    move: t(/* @__PURE__ */ Ic()),
    moveSync: /* @__PURE__ */ Dc()
  }, On;
}
var In, so;
function vt() {
  return so || (so = 1, In = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ Mt(),
    // Export extra methods:
    .../* @__PURE__ */ ta(),
    .../* @__PURE__ */ Ec(),
    .../* @__PURE__ */ Tc(),
    .../* @__PURE__ */ Oc(),
    .../* @__PURE__ */ it(),
    .../* @__PURE__ */ Nc(),
    .../* @__PURE__ */ na(),
    .../* @__PURE__ */ It(),
    .../* @__PURE__ */ jr()
  }), In;
}
var Vt = {}, Rt = {}, Dn = {}, Ct = {}, lo;
function ia() {
  if (lo) return Ct;
  lo = 1, Object.defineProperty(Ct, "__esModule", { value: !0 }), Ct.CancellationError = Ct.CancellationToken = void 0;
  const t = Dl;
  let f = class extends t.EventEmitter {
    get cancelled() {
      return this._cancelled || this._parent != null && this._parent.cancelled;
    }
    set parent(c) {
      this.removeParentCancelHandler(), this._parent = c, this.parentCancelHandler = () => this.cancel(), this._parent.onCancel(this.parentCancelHandler);
    }
    // babel cannot compile ... correctly for super calls
    constructor(c) {
      super(), this.parentCancelHandler = null, this._parent = null, this._cancelled = !1, c != null && (this.parent = c);
    }
    cancel() {
      this._cancelled = !0, this.emit("cancel");
    }
    onCancel(c) {
      this.cancelled ? c() : this.once("cancel", c);
    }
    createPromise(c) {
      if (this.cancelled)
        return Promise.reject(new h());
      const l = () => {
        if (a != null)
          try {
            this.removeListener("cancel", a), a = null;
          } catch {
          }
      };
      let a = null;
      return new Promise((d, i) => {
        let s = null;
        if (a = () => {
          try {
            s != null && (s(), s = null);
          } finally {
            i(new h());
          }
        }, this.cancelled) {
          a();
          return;
        }
        this.onCancel(a), c(d, i, (r) => {
          s = r;
        });
      }).then((d) => (l(), d)).catch((d) => {
        throw l(), d;
      });
    }
    removeParentCancelHandler() {
      const c = this._parent;
      c != null && this.parentCancelHandler != null && (c.removeListener("cancel", this.parentCancelHandler), this.parentCancelHandler = null);
    }
    dispose() {
      try {
        this.removeParentCancelHandler();
      } finally {
        this.removeAllListeners(), this._parent = null;
      }
    }
  };
  Ct.CancellationToken = f;
  class h extends Error {
    constructor() {
      super("cancelled");
    }
  }
  return Ct.CancellationError = h, Ct;
}
var Ir = {}, uo;
function Gr() {
  if (uo) return Ir;
  uo = 1, Object.defineProperty(Ir, "__esModule", { value: !0 }), Ir.newError = t;
  function t(f, h) {
    const u = new Error(f);
    return u.code = h, u;
  }
  return Ir;
}
var Be = {}, Dr = { exports: {} }, Nr = { exports: {} }, Nn, co;
function Fc() {
  if (co) return Nn;
  co = 1;
  var t = 1e3, f = t * 60, h = f * 60, u = h * 24, c = u * 7, l = u * 365.25;
  Nn = function(r, o) {
    o = o || {};
    var n = typeof r;
    if (n === "string" && r.length > 0)
      return a(r);
    if (n === "number" && isFinite(r))
      return o.long ? i(r) : d(r);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(r)
    );
  };
  function a(r) {
    if (r = String(r), !(r.length > 100)) {
      var o = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        r
      );
      if (o) {
        var n = parseFloat(o[1]), m = (o[2] || "ms").toLowerCase();
        switch (m) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return n * l;
          case "weeks":
          case "week":
          case "w":
            return n * c;
          case "days":
          case "day":
          case "d":
            return n * u;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return n * h;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return n * f;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return n * t;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return n;
          default:
            return;
        }
      }
    }
  }
  function d(r) {
    var o = Math.abs(r);
    return o >= u ? Math.round(r / u) + "d" : o >= h ? Math.round(r / h) + "h" : o >= f ? Math.round(r / f) + "m" : o >= t ? Math.round(r / t) + "s" : r + "ms";
  }
  function i(r) {
    var o = Math.abs(r);
    return o >= u ? s(r, o, u, "day") : o >= h ? s(r, o, h, "hour") : o >= f ? s(r, o, f, "minute") : o >= t ? s(r, o, t, "second") : r + " ms";
  }
  function s(r, o, n, m) {
    var v = o >= n * 1.5;
    return Math.round(r / n) + " " + m + (v ? "s" : "");
  }
  return Nn;
}
var Fn, fo;
function Ll() {
  if (fo) return Fn;
  fo = 1;
  function t(f) {
    u.debug = u, u.default = u, u.coerce = s, u.disable = d, u.enable = l, u.enabled = i, u.humanize = Fc(), u.destroy = r, Object.keys(f).forEach((o) => {
      u[o] = f[o];
    }), u.names = [], u.skips = [], u.formatters = {};
    function h(o) {
      let n = 0;
      for (let m = 0; m < o.length; m++)
        n = (n << 5) - n + o.charCodeAt(m), n |= 0;
      return u.colors[Math.abs(n) % u.colors.length];
    }
    u.selectColor = h;
    function u(o) {
      let n, m = null, v, y;
      function p(...A) {
        if (!p.enabled)
          return;
        const R = p, P = Number(/* @__PURE__ */ new Date()), O = P - (n || P);
        R.diff = O, R.prev = n, R.curr = P, n = P, A[0] = u.coerce(A[0]), typeof A[0] != "string" && A.unshift("%O");
        let M = 0;
        A[0] = A[0].replace(/%([a-zA-Z%])/g, (S, T) => {
          if (S === "%%")
            return "%";
          M++;
          const E = u.formatters[T];
          if (typeof E == "function") {
            const q = A[M];
            S = E.call(R, q), A.splice(M, 1), M--;
          }
          return S;
        }), u.formatArgs.call(R, A), (R.log || u.log).apply(R, A);
      }
      return p.namespace = o, p.useColors = u.useColors(), p.color = u.selectColor(o), p.extend = c, p.destroy = u.destroy, Object.defineProperty(p, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => m !== null ? m : (v !== u.namespaces && (v = u.namespaces, y = u.enabled(o)), y),
        set: (A) => {
          m = A;
        }
      }), typeof u.init == "function" && u.init(p), p;
    }
    function c(o, n) {
      const m = u(this.namespace + (typeof n > "u" ? ":" : n) + o);
      return m.log = this.log, m;
    }
    function l(o) {
      u.save(o), u.namespaces = o, u.names = [], u.skips = [];
      const n = (typeof o == "string" ? o : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const m of n)
        m[0] === "-" ? u.skips.push(m.slice(1)) : u.names.push(m);
    }
    function a(o, n) {
      let m = 0, v = 0, y = -1, p = 0;
      for (; m < o.length; )
        if (v < n.length && (n[v] === o[m] || n[v] === "*"))
          n[v] === "*" ? (y = v, p = m, v++) : (m++, v++);
        else if (y !== -1)
          v = y + 1, p++, m = p;
        else
          return !1;
      for (; v < n.length && n[v] === "*"; )
        v++;
      return v === n.length;
    }
    function d() {
      const o = [
        ...u.names,
        ...u.skips.map((n) => "-" + n)
      ].join(",");
      return u.enable(""), o;
    }
    function i(o) {
      for (const n of u.skips)
        if (a(o, n))
          return !1;
      for (const n of u.names)
        if (a(o, n))
          return !0;
      return !1;
    }
    function s(o) {
      return o instanceof Error ? o.stack || o.message : o;
    }
    function r() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return u.enable(u.load()), u;
  }
  return Fn = t, Fn;
}
var ho;
function xc() {
  return ho || (ho = 1, (function(t, f) {
    f.formatArgs = u, f.save = c, f.load = l, f.useColors = h, f.storage = a(), f.destroy = /* @__PURE__ */ (() => {
      let i = !1;
      return () => {
        i || (i = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), f.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function h() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let i;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (i = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(i[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function u(i) {
      if (i[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + i[0] + (this.useColors ? "%c " : " ") + "+" + t.exports.humanize(this.diff), !this.useColors)
        return;
      const s = "color: " + this.color;
      i.splice(1, 0, s, "color: inherit");
      let r = 0, o = 0;
      i[0].replace(/%[a-zA-Z%]/g, (n) => {
        n !== "%%" && (r++, n === "%c" && (o = r));
      }), i.splice(o, 0, s);
    }
    f.log = console.debug || console.log || (() => {
    });
    function c(i) {
      try {
        i ? f.storage.setItem("debug", i) : f.storage.removeItem("debug");
      } catch {
      }
    }
    function l() {
      let i;
      try {
        i = f.storage.getItem("debug") || f.storage.getItem("DEBUG");
      } catch {
      }
      return !i && typeof process < "u" && "env" in process && (i = process.env.DEBUG), i;
    }
    function a() {
      try {
        return localStorage;
      } catch {
      }
    }
    t.exports = Ll()(f);
    const { formatters: d } = t.exports;
    d.j = function(i) {
      try {
        return JSON.stringify(i);
      } catch (s) {
        return "[UnexpectedJSONParseError]: " + s.message;
      }
    };
  })(Nr, Nr.exports)), Nr.exports;
}
var Fr = { exports: {} }, xn, po;
function Lc() {
  return po || (po = 1, xn = (t, f = process.argv) => {
    const h = t.startsWith("-") ? "" : t.length === 1 ? "-" : "--", u = f.indexOf(h + t), c = f.indexOf("--");
    return u !== -1 && (c === -1 || u < c);
  }), xn;
}
var Ln, mo;
function Uc() {
  if (mo) return Ln;
  mo = 1;
  const t = Hr, f = Nl, h = Lc(), { env: u } = process;
  let c;
  h("no-color") || h("no-colors") || h("color=false") || h("color=never") ? c = 0 : (h("color") || h("colors") || h("color=true") || h("color=always")) && (c = 1), "FORCE_COLOR" in u && (u.FORCE_COLOR === "true" ? c = 1 : u.FORCE_COLOR === "false" ? c = 0 : c = u.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(u.FORCE_COLOR, 10), 3));
  function l(i) {
    return i === 0 ? !1 : {
      level: i,
      hasBasic: !0,
      has256: i >= 2,
      has16m: i >= 3
    };
  }
  function a(i, s) {
    if (c === 0)
      return 0;
    if (h("color=16m") || h("color=full") || h("color=truecolor"))
      return 3;
    if (h("color=256"))
      return 2;
    if (i && !s && c === void 0)
      return 0;
    const r = c || 0;
    if (u.TERM === "dumb")
      return r;
    if (process.platform === "win32") {
      const o = t.release().split(".");
      return Number(o[0]) >= 10 && Number(o[2]) >= 10586 ? Number(o[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in u)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((o) => o in u) || u.CI_NAME === "codeship" ? 1 : r;
    if ("TEAMCITY_VERSION" in u)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(u.TEAMCITY_VERSION) ? 1 : 0;
    if (u.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in u) {
      const o = parseInt((u.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (u.TERM_PROGRAM) {
        case "iTerm.app":
          return o >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(u.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(u.TERM) || "COLORTERM" in u ? 1 : r;
  }
  function d(i) {
    const s = a(i, i && i.isTTY);
    return l(s);
  }
  return Ln = {
    supportsColor: d,
    stdout: l(a(!0, f.isatty(1))),
    stderr: l(a(!0, f.isatty(2)))
  }, Ln;
}
var go;
function $c() {
  return go || (go = 1, (function(t, f) {
    const h = Nl, u = ea;
    f.init = r, f.log = d, f.formatArgs = l, f.save = i, f.load = s, f.useColors = c, f.destroy = u.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), f.colors = [6, 2, 3, 4, 5, 1];
    try {
      const n = Uc();
      n && (n.stderr || n).level >= 2 && (f.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    f.inspectOpts = Object.keys(process.env).filter((n) => /^debug_/i.test(n)).reduce((n, m) => {
      const v = m.substring(6).toLowerCase().replace(/_([a-z])/g, (p, A) => A.toUpperCase());
      let y = process.env[m];
      return /^(yes|on|true|enabled)$/i.test(y) ? y = !0 : /^(no|off|false|disabled)$/i.test(y) ? y = !1 : y === "null" ? y = null : y = Number(y), n[v] = y, n;
    }, {});
    function c() {
      return "colors" in f.inspectOpts ? !!f.inspectOpts.colors : h.isatty(process.stderr.fd);
    }
    function l(n) {
      const { namespace: m, useColors: v } = this;
      if (v) {
        const y = this.color, p = "\x1B[3" + (y < 8 ? y : "8;5;" + y), A = `  ${p};1m${m} \x1B[0m`;
        n[0] = A + n[0].split(`
`).join(`
` + A), n.push(p + "m+" + t.exports.humanize(this.diff) + "\x1B[0m");
      } else
        n[0] = a() + m + " " + n[0];
    }
    function a() {
      return f.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function d(...n) {
      return process.stderr.write(u.formatWithOptions(f.inspectOpts, ...n) + `
`);
    }
    function i(n) {
      n ? process.env.DEBUG = n : delete process.env.DEBUG;
    }
    function s() {
      return process.env.DEBUG;
    }
    function r(n) {
      n.inspectOpts = {};
      const m = Object.keys(f.inspectOpts);
      for (let v = 0; v < m.length; v++)
        n.inspectOpts[m[v]] = f.inspectOpts[m[v]];
    }
    t.exports = Ll()(f);
    const { formatters: o } = t.exports;
    o.o = function(n) {
      return this.inspectOpts.colors = this.useColors, u.inspect(n, this.inspectOpts).split(`
`).map((m) => m.trim()).join(" ");
    }, o.O = function(n) {
      return this.inspectOpts.colors = this.useColors, u.inspect(n, this.inspectOpts);
    };
  })(Fr, Fr.exports)), Fr.exports;
}
var vo;
function kc() {
  return vo || (vo = 1, typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Dr.exports = xc() : Dr.exports = $c()), Dr.exports;
}
var Yt = {}, Eo;
function Ul() {
  if (Eo) return Yt;
  Eo = 1, Object.defineProperty(Yt, "__esModule", { value: !0 }), Yt.ProgressCallbackTransform = void 0;
  const t = gr;
  let f = class extends t.Transform {
    constructor(u, c, l) {
      super(), this.total = u, this.cancellationToken = c, this.onProgress = l, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.nextUpdate = this.start + 1e3;
    }
    _transform(u, c, l) {
      if (this.cancellationToken.cancelled) {
        l(new Error("cancelled"), null);
        return;
      }
      this.transferred += u.length, this.delta += u.length;
      const a = Date.now();
      a >= this.nextUpdate && this.transferred !== this.total && (this.nextUpdate = a + 1e3, this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.total * 100,
        bytesPerSecond: Math.round(this.transferred / ((a - this.start) / 1e3))
      }), this.delta = 0), l(null, u);
    }
    _flush(u) {
      if (this.cancellationToken.cancelled) {
        u(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.total,
        delta: this.delta,
        transferred: this.total,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, u(null);
    }
  };
  return Yt.ProgressCallbackTransform = f, Yt;
}
var yo;
function qc() {
  if (yo) return Be;
  yo = 1, Object.defineProperty(Be, "__esModule", { value: !0 }), Be.DigestTransform = Be.HttpExecutor = Be.HttpError = void 0, Be.createHttpError = s, Be.parseJson = n, Be.configureRequestOptionsFromUrl = v, Be.configureRequestUrl = y, Be.safeGetHeader = R, Be.configureRequestOptions = O, Be.safeStringifyJson = M;
  const t = vr, f = kc(), h = gt, u = gr, c = qt, l = ia(), a = Gr(), d = Ul(), i = (0, f.default)("electron-builder");
  function s(C, S = null) {
    return new o(C.statusCode || -1, `${C.statusCode} ${C.statusMessage}` + (S == null ? "" : `
` + JSON.stringify(S, null, "  ")) + `
Headers: ` + M(C.headers), S);
  }
  const r = /* @__PURE__ */ new Map([
    [429, "Too many requests"],
    [400, "Bad request"],
    [403, "Forbidden"],
    [404, "Not found"],
    [405, "Method not allowed"],
    [406, "Not acceptable"],
    [408, "Request timeout"],
    [413, "Request entity too large"],
    [500, "Internal server error"],
    [502, "Bad gateway"],
    [503, "Service unavailable"],
    [504, "Gateway timeout"],
    [505, "HTTP version not supported"]
  ]);
  class o extends Error {
    constructor(S, T = `HTTP error: ${r.get(S) || S}`, E = null) {
      super(T), this.statusCode = S, this.description = E, this.name = "HttpError", this.code = `HTTP_ERROR_${S}`;
    }
    isServerError() {
      return this.statusCode >= 500 && this.statusCode <= 599;
    }
  }
  Be.HttpError = o;
  function n(C) {
    return C.then((S) => S == null || S.length === 0 ? null : JSON.parse(S));
  }
  class m {
    constructor() {
      this.maxRedirects = 10;
    }
    request(S, T = new l.CancellationToken(), E) {
      O(S);
      const q = E == null ? void 0 : JSON.stringify(E), U = q ? Buffer.from(q) : void 0;
      if (U != null) {
        i(q);
        const { headers: L, ...k } = S;
        S = {
          method: "post",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": U.length,
            ...L
          },
          ...k
        };
      }
      return this.doApiRequest(S, T, (L) => L.end(U));
    }
    doApiRequest(S, T, E, q = 0) {
      return i.enabled && i(`Request: ${M(S)}`), T.createPromise((U, L, k) => {
        const N = this.createRequest(S, (D) => {
          try {
            this.handleResponse(D, S, T, U, L, q, E);
          } catch (F) {
            L(F);
          }
        });
        this.addErrorAndTimeoutHandlers(N, L, S.timeout), this.addRedirectHandlers(N, S, L, q, (D) => {
          this.doApiRequest(D, T, E, q).then(U).catch(L);
        }), E(N, L), k(() => N.abort());
      });
    }
    // noinspection JSUnusedLocalSymbols
    // eslint-disable-next-line
    addRedirectHandlers(S, T, E, q, U) {
    }
    addErrorAndTimeoutHandlers(S, T, E = 60 * 1e3) {
      this.addTimeOutHandler(S, T, E), S.on("error", T), S.on("aborted", () => {
        T(new Error("Request has been aborted by the server"));
      });
    }
    handleResponse(S, T, E, q, U, L, k) {
      var N;
      if (i.enabled && i(`Response: ${S.statusCode} ${S.statusMessage}, request options: ${M(T)}`), S.statusCode === 404) {
        U(s(S, `method: ${T.method || "GET"} url: ${T.protocol || "https:"}//${T.hostname}${T.port ? `:${T.port}` : ""}${T.path}

Please double check that your authentication token is correct. Due to security reasons, actual status maybe not reported, but 404.
`));
        return;
      } else if (S.statusCode === 204) {
        q();
        return;
      }
      const D = (N = S.statusCode) !== null && N !== void 0 ? N : 0, F = D >= 300 && D < 400, $ = R(S, "location");
      if (F && $ != null) {
        if (L > this.maxRedirects) {
          U(this.createMaxRedirectError());
          return;
        }
        this.doApiRequest(m.prepareRedirectUrlOptions($, T), E, k, L).then(q).catch(U);
        return;
      }
      S.setEncoding("utf8");
      let J = "";
      S.on("error", U), S.on("data", (W) => J += W), S.on("end", () => {
        try {
          if (S.statusCode != null && S.statusCode >= 400) {
            const W = R(S, "content-type"), ne = W != null && (Array.isArray(W) ? W.find((ce) => ce.includes("json")) != null : W.includes("json"));
            U(s(S, `method: ${T.method || "GET"} url: ${T.protocol || "https:"}//${T.hostname}${T.port ? `:${T.port}` : ""}${T.path}

          Data:
          ${ne ? JSON.stringify(JSON.parse(J)) : J}
          `));
          } else
            q(J.length === 0 ? null : J);
        } catch (W) {
          U(W);
        }
      });
    }
    async downloadToBuffer(S, T) {
      return await T.cancellationToken.createPromise((E, q, U) => {
        const L = [], k = {
          headers: T.headers || void 0,
          // because PrivateGitHubProvider requires HttpExecutor.prepareRedirectUrlOptions logic, so, we need to redirect manually
          redirect: "manual"
        };
        y(S, k), O(k), this.doDownload(k, {
          destination: null,
          options: T,
          onCancel: U,
          callback: (N) => {
            N == null ? E(Buffer.concat(L)) : q(N);
          },
          responseHandler: (N, D) => {
            let F = 0;
            N.on("data", ($) => {
              if (F += $.length, F > 524288e3) {
                D(new Error("Maximum allowed size is 500 MB"));
                return;
              }
              L.push($);
            }), N.on("end", () => {
              D(null);
            });
          }
        }, 0);
      });
    }
    doDownload(S, T, E) {
      const q = this.createRequest(S, (U) => {
        if (U.statusCode >= 400) {
          T.callback(new Error(`Cannot download "${S.protocol || "https:"}//${S.hostname}${S.path}", status ${U.statusCode}: ${U.statusMessage}`));
          return;
        }
        U.on("error", T.callback);
        const L = R(U, "location");
        if (L != null) {
          E < this.maxRedirects ? this.doDownload(m.prepareRedirectUrlOptions(L, S), T, E++) : T.callback(this.createMaxRedirectError());
          return;
        }
        T.responseHandler == null ? P(T, U) : T.responseHandler(U, T.callback);
      });
      this.addErrorAndTimeoutHandlers(q, T.callback, S.timeout), this.addRedirectHandlers(q, S, T.callback, E, (U) => {
        this.doDownload(U, T, E++);
      }), q.end();
    }
    createMaxRedirectError() {
      return new Error(`Too many redirects (> ${this.maxRedirects})`);
    }
    addTimeOutHandler(S, T, E) {
      S.on("socket", (q) => {
        q.setTimeout(E, () => {
          S.abort(), T(new Error("Request timed out"));
        });
      });
    }
    static prepareRedirectUrlOptions(S, T) {
      const E = v(S, { ...T }), q = E.headers;
      if (q?.authorization) {
        const U = new c.URL(S);
        (U.hostname.endsWith(".amazonaws.com") || U.searchParams.has("X-Amz-Credential")) && delete q.authorization;
      }
      return E;
    }
    static retryOnServerError(S, T = 3) {
      for (let E = 0; ; E++)
        try {
          return S();
        } catch (q) {
          if (E < T && (q instanceof o && q.isServerError() || q.code === "EPIPE"))
            continue;
          throw q;
        }
    }
  }
  Be.HttpExecutor = m;
  function v(C, S) {
    const T = O(S);
    return y(new c.URL(C), T), T;
  }
  function y(C, S) {
    S.protocol = C.protocol, S.hostname = C.hostname, C.port ? S.port = C.port : S.port && delete S.port, S.path = C.pathname + C.search;
  }
  class p extends u.Transform {
    // noinspection JSUnusedGlobalSymbols
    get actual() {
      return this._actual;
    }
    constructor(S, T = "sha512", E = "base64") {
      super(), this.expected = S, this.algorithm = T, this.encoding = E, this._actual = null, this.isValidateOnEnd = !0, this.digester = (0, t.createHash)(T);
    }
    // noinspection JSUnusedGlobalSymbols
    _transform(S, T, E) {
      this.digester.update(S), E(null, S);
    }
    // noinspection JSUnusedGlobalSymbols
    _flush(S) {
      if (this._actual = this.digester.digest(this.encoding), this.isValidateOnEnd)
        try {
          this.validate();
        } catch (T) {
          S(T);
          return;
        }
      S(null);
    }
    validate() {
      if (this._actual == null)
        throw (0, a.newError)("Not finished yet", "ERR_STREAM_NOT_FINISHED");
      if (this._actual !== this.expected)
        throw (0, a.newError)(`${this.algorithm} checksum mismatch, expected ${this.expected}, got ${this._actual}`, "ERR_CHECKSUM_MISMATCH");
      return null;
    }
  }
  Be.DigestTransform = p;
  function A(C, S, T) {
    return C != null && S != null && C !== S ? (T(new Error(`checksum mismatch: expected ${S} but got ${C} (X-Checksum-Sha2 header)`)), !1) : !0;
  }
  function R(C, S) {
    const T = C.headers[S];
    return T == null ? null : Array.isArray(T) ? T.length === 0 ? null : T[T.length - 1] : T;
  }
  function P(C, S) {
    if (!A(R(S, "X-Checksum-Sha2"), C.options.sha2, C.callback))
      return;
    const T = [];
    if (C.options.onProgress != null) {
      const L = R(S, "content-length");
      L != null && T.push(new d.ProgressCallbackTransform(parseInt(L, 10), C.options.cancellationToken, C.options.onProgress));
    }
    const E = C.options.sha512;
    E != null ? T.push(new p(E, "sha512", E.length === 128 && !E.includes("+") && !E.includes("Z") && !E.includes("=") ? "hex" : "base64")) : C.options.sha2 != null && T.push(new p(C.options.sha2, "sha256", "hex"));
    const q = (0, h.createWriteStream)(C.destination);
    T.push(q);
    let U = S;
    for (const L of T)
      L.on("error", (k) => {
        q.close(), C.options.cancellationToken.cancelled || C.callback(k);
      }), U = U.pipe(L);
    q.on("finish", () => {
      q.close(C.callback);
    });
  }
  function O(C, S, T) {
    T != null && (C.method = T), C.headers = { ...C.headers };
    const E = C.headers;
    return S != null && (E.authorization = S.startsWith("Basic") || S.startsWith("Bearer") ? S : `token ${S}`), E["User-Agent"] == null && (E["User-Agent"] = "electron-builder"), (T == null || T === "GET" || E["Cache-Control"] == null) && (E["Cache-Control"] = "no-cache"), C.protocol == null && process.versions.electron != null && (C.protocol = "https:"), C;
  }
  function M(C, S) {
    return JSON.stringify(C, (T, E) => T.endsWith("Authorization") || T.endsWith("authorization") || T.endsWith("Password") || T.endsWith("PASSWORD") || T.endsWith("Token") || T.includes("password") || T.includes("token") || S != null && S.has(T) ? "<stripped sensitive data>" : E, 2);
  }
  return Be;
}
var zt = {}, wo;
function Mc() {
  if (wo) return zt;
  wo = 1, Object.defineProperty(zt, "__esModule", { value: !0 }), zt.MemoLazy = void 0;
  let t = class {
    constructor(u, c) {
      this.selector = u, this.creator = c, this.selected = void 0, this._value = void 0;
    }
    get hasValue() {
      return this._value !== void 0;
    }
    get value() {
      const u = this.selector();
      if (this._value !== void 0 && f(this.selected, u))
        return this._value;
      this.selected = u;
      const c = this.creator(u);
      return this.value = c, c;
    }
    set value(u) {
      this._value = u;
    }
  };
  zt.MemoLazy = t;
  function f(h, u) {
    if (typeof h == "object" && h !== null && (typeof u == "object" && u !== null)) {
      const a = Object.keys(h), d = Object.keys(u);
      return a.length === d.length && a.every((i) => f(h[i], u[i]));
    }
    return h === u;
  }
  return zt;
}
var Xt = {}, _o;
function Bc() {
  if (_o) return Xt;
  _o = 1, Object.defineProperty(Xt, "__esModule", { value: !0 }), Xt.githubUrl = t, Xt.getS3LikeProviderBaseUrl = f;
  function t(l, a = "github.com") {
    return `${l.protocol || "https"}://${l.host || a}`;
  }
  function f(l) {
    const a = l.provider;
    if (a === "s3")
      return h(l);
    if (a === "spaces")
      return c(l);
    throw new Error(`Not supported provider: ${a}`);
  }
  function h(l) {
    let a;
    if (l.accelerate == !0)
      a = `https://${l.bucket}.s3-accelerate.amazonaws.com`;
    else if (l.endpoint != null)
      a = `${l.endpoint}/${l.bucket}`;
    else if (l.bucket.includes(".")) {
      if (l.region == null)
        throw new Error(`Bucket name "${l.bucket}" includes a dot, but S3 region is missing`);
      l.region === "us-east-1" ? a = `https://s3.amazonaws.com/${l.bucket}` : a = `https://s3-${l.region}.amazonaws.com/${l.bucket}`;
    } else l.region === "cn-north-1" ? a = `https://${l.bucket}.s3.${l.region}.amazonaws.com.cn` : a = `https://${l.bucket}.s3.amazonaws.com`;
    return u(a, l.path);
  }
  function u(l, a) {
    return a != null && a.length > 0 && (a.startsWith("/") || (l += "/"), l += a), l;
  }
  function c(l) {
    if (l.name == null)
      throw new Error("name is missing");
    if (l.region == null)
      throw new Error("region is missing");
    return u(`https://${l.name}.${l.region}.digitaloceanspaces.com`, l.path);
  }
  return Xt;
}
var xr = {}, So;
function Hc() {
  if (So) return xr;
  So = 1, Object.defineProperty(xr, "__esModule", { value: !0 }), xr.retry = f;
  const t = ia();
  async function f(h, u, c, l = 0, a = 0, d) {
    var i;
    const s = new t.CancellationToken();
    try {
      return await h();
    } catch (r) {
      if ((!((i = d?.(r)) !== null && i !== void 0) || i) && u > 0 && !s.cancelled)
        return await new Promise((o) => setTimeout(o, c + l * a)), await f(h, u - 1, c, l, a + 1, d);
      throw r;
    }
  }
  return xr;
}
var Lr = {}, Ao;
function jc() {
  if (Ao) return Lr;
  Ao = 1, Object.defineProperty(Lr, "__esModule", { value: !0 }), Lr.parseDn = t;
  function t(f) {
    let h = !1, u = null, c = "", l = 0;
    f = f.trim();
    const a = /* @__PURE__ */ new Map();
    for (let d = 0; d <= f.length; d++) {
      if (d === f.length) {
        u !== null && a.set(u, c);
        break;
      }
      const i = f[d];
      if (h) {
        if (i === '"') {
          h = !1;
          continue;
        }
      } else {
        if (i === '"') {
          h = !0;
          continue;
        }
        if (i === "\\") {
          d++;
          const s = parseInt(f.slice(d, d + 2), 16);
          Number.isNaN(s) ? c += f[d] : (d++, c += String.fromCharCode(s));
          continue;
        }
        if (u === null && i === "=") {
          u = c, c = "";
          continue;
        }
        if (i === "," || i === ";" || i === "+") {
          u !== null && a.set(u, c), u = null, c = "";
          continue;
        }
      }
      if (i === " " && !h) {
        if (c.length === 0)
          continue;
        if (d > l) {
          let s = d;
          for (; f[s] === " "; )
            s++;
          l = s;
        }
        if (l >= f.length || f[l] === "," || f[l] === ";" || u === null && f[l] === "=" || u !== null && f[l] === "+") {
          d = l - 1;
          continue;
        }
      }
      c += i;
    }
    return a;
  }
  return Lr;
}
var bt = {}, To;
function Gc() {
  if (To) return bt;
  To = 1, Object.defineProperty(bt, "__esModule", { value: !0 }), bt.nil = bt.UUID = void 0;
  const t = vr, f = Gr(), h = "options.name must be either a string or a Buffer", u = (0, t.randomBytes)(16);
  u[0] = u[0] | 1;
  const c = {}, l = [];
  for (let o = 0; o < 256; o++) {
    const n = (o + 256).toString(16).substr(1);
    c[n] = o, l[o] = n;
  }
  class a {
    constructor(n) {
      this.ascii = null, this.binary = null;
      const m = a.check(n);
      if (!m)
        throw new Error("not a UUID");
      this.version = m.version, m.format === "ascii" ? this.ascii = n : this.binary = n;
    }
    static v5(n, m) {
      return s(n, "sha1", 80, m);
    }
    toString() {
      return this.ascii == null && (this.ascii = r(this.binary)), this.ascii;
    }
    inspect() {
      return `UUID v${this.version} ${this.toString()}`;
    }
    static check(n, m = 0) {
      if (typeof n == "string")
        return n = n.toLowerCase(), /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-([a-f0-9]{12})$/.test(n) ? n === "00000000-0000-0000-0000-000000000000" ? { version: void 0, variant: "nil", format: "ascii" } : {
          version: (c[n[14] + n[15]] & 240) >> 4,
          variant: d((c[n[19] + n[20]] & 224) >> 5),
          format: "ascii"
        } : !1;
      if (Buffer.isBuffer(n)) {
        if (n.length < m + 16)
          return !1;
        let v = 0;
        for (; v < 16 && n[m + v] === 0; v++)
          ;
        return v === 16 ? { version: void 0, variant: "nil", format: "binary" } : {
          version: (n[m + 6] & 240) >> 4,
          variant: d((n[m + 8] & 224) >> 5),
          format: "binary"
        };
      }
      throw (0, f.newError)("Unknown type of uuid", "ERR_UNKNOWN_UUID_TYPE");
    }
    // read stringified uuid into a Buffer
    static parse(n) {
      const m = Buffer.allocUnsafe(16);
      let v = 0;
      for (let y = 0; y < 16; y++)
        m[y] = c[n[v++] + n[v++]], (y === 3 || y === 5 || y === 7 || y === 9) && (v += 1);
      return m;
    }
  }
  bt.UUID = a, a.OID = a.parse("6ba7b812-9dad-11d1-80b4-00c04fd430c8");
  function d(o) {
    switch (o) {
      case 0:
      case 1:
      case 3:
        return "ncs";
      case 4:
      case 5:
        return "rfc4122";
      case 6:
        return "microsoft";
      default:
        return "future";
    }
  }
  var i;
  (function(o) {
    o[o.ASCII = 0] = "ASCII", o[o.BINARY = 1] = "BINARY", o[o.OBJECT = 2] = "OBJECT";
  })(i || (i = {}));
  function s(o, n, m, v, y = i.ASCII) {
    const p = (0, t.createHash)(n);
    if (typeof o != "string" && !Buffer.isBuffer(o))
      throw (0, f.newError)(h, "ERR_INVALID_UUID_NAME");
    p.update(v), p.update(o);
    const R = p.digest();
    let P;
    switch (y) {
      case i.BINARY:
        R[6] = R[6] & 15 | m, R[8] = R[8] & 63 | 128, P = R;
        break;
      case i.OBJECT:
        R[6] = R[6] & 15 | m, R[8] = R[8] & 63 | 128, P = new a(R);
        break;
      default:
        P = l[R[0]] + l[R[1]] + l[R[2]] + l[R[3]] + "-" + l[R[4]] + l[R[5]] + "-" + l[R[6] & 15 | m] + l[R[7]] + "-" + l[R[8] & 63 | 128] + l[R[9]] + "-" + l[R[10]] + l[R[11]] + l[R[12]] + l[R[13]] + l[R[14]] + l[R[15]];
        break;
    }
    return P;
  }
  function r(o) {
    return l[o[0]] + l[o[1]] + l[o[2]] + l[o[3]] + "-" + l[o[4]] + l[o[5]] + "-" + l[o[6]] + l[o[7]] + "-" + l[o[8]] + l[o[9]] + "-" + l[o[10]] + l[o[11]] + l[o[12]] + l[o[13]] + l[o[14]] + l[o[15]];
  }
  return bt.nil = new a("00000000-0000-0000-0000-000000000000"), bt;
}
var Lt = {}, Un = {}, Ro;
function Wc() {
  return Ro || (Ro = 1, (function(t) {
    (function(f) {
      f.parser = function(_, g) {
        return new u(_, g);
      }, f.SAXParser = u, f.SAXStream = r, f.createStream = s, f.MAX_BUFFER_LENGTH = 64 * 1024;
      var h = [
        "comment",
        "sgmlDecl",
        "textNode",
        "tagName",
        "doctype",
        "procInstName",
        "procInstBody",
        "entity",
        "attribName",
        "attribValue",
        "cdata",
        "script"
      ];
      f.EVENTS = [
        "text",
        "processinginstruction",
        "sgmldeclaration",
        "doctype",
        "comment",
        "opentagstart",
        "attribute",
        "opentag",
        "closetag",
        "opencdata",
        "cdata",
        "closecdata",
        "error",
        "end",
        "ready",
        "script",
        "opennamespace",
        "closenamespace"
      ];
      function u(_, g) {
        if (!(this instanceof u))
          return new u(_, g);
        var H = this;
        l(H), H.q = H.c = "", H.bufferCheckPosition = f.MAX_BUFFER_LENGTH, H.opt = g || {}, H.opt.lowercase = H.opt.lowercase || H.opt.lowercasetags, H.looseCase = H.opt.lowercase ? "toLowerCase" : "toUpperCase", H.tags = [], H.closed = H.closedRoot = H.sawRoot = !1, H.tag = H.error = null, H.strict = !!_, H.noscript = !!(_ || H.opt.noscript), H.state = E.BEGIN, H.strictEntities = H.opt.strictEntities, H.ENTITIES = H.strictEntities ? Object.create(f.XML_ENTITIES) : Object.create(f.ENTITIES), H.attribList = [], H.opt.xmlns && (H.ns = Object.create(y)), H.opt.unquotedAttributeValues === void 0 && (H.opt.unquotedAttributeValues = !_), H.trackPosition = H.opt.position !== !1, H.trackPosition && (H.position = H.line = H.column = 0), U(H, "onready");
      }
      Object.create || (Object.create = function(_) {
        function g() {
        }
        g.prototype = _;
        var H = new g();
        return H;
      }), Object.keys || (Object.keys = function(_) {
        var g = [];
        for (var H in _) _.hasOwnProperty(H) && g.push(H);
        return g;
      });
      function c(_) {
        for (var g = Math.max(f.MAX_BUFFER_LENGTH, 10), H = 0, I = 0, le = h.length; I < le; I++) {
          var me = _[h[I]].length;
          if (me > g)
            switch (h[I]) {
              case "textNode":
                k(_);
                break;
              case "cdata":
                L(_, "oncdata", _.cdata), _.cdata = "";
                break;
              case "script":
                L(_, "onscript", _.script), _.script = "";
                break;
              default:
                D(_, "Max buffer length exceeded: " + h[I]);
            }
          H = Math.max(H, me);
        }
        var pe = f.MAX_BUFFER_LENGTH - H;
        _.bufferCheckPosition = pe + _.position;
      }
      function l(_) {
        for (var g = 0, H = h.length; g < H; g++)
          _[h[g]] = "";
      }
      function a(_) {
        k(_), _.cdata !== "" && (L(_, "oncdata", _.cdata), _.cdata = ""), _.script !== "" && (L(_, "onscript", _.script), _.script = "");
      }
      u.prototype = {
        end: function() {
          F(this);
        },
        write: Ee,
        resume: function() {
          return this.error = null, this;
        },
        close: function() {
          return this.write(null);
        },
        flush: function() {
          a(this);
        }
      };
      var d;
      try {
        d = require("stream").Stream;
      } catch {
        d = function() {
        };
      }
      d || (d = function() {
      });
      var i = f.EVENTS.filter(function(_) {
        return _ !== "error" && _ !== "end";
      });
      function s(_, g) {
        return new r(_, g);
      }
      function r(_, g) {
        if (!(this instanceof r))
          return new r(_, g);
        d.apply(this), this._parser = new u(_, g), this.writable = !0, this.readable = !0;
        var H = this;
        this._parser.onend = function() {
          H.emit("end");
        }, this._parser.onerror = function(I) {
          H.emit("error", I), H._parser.error = null;
        }, this._decoder = null, i.forEach(function(I) {
          Object.defineProperty(H, "on" + I, {
            get: function() {
              return H._parser["on" + I];
            },
            set: function(le) {
              if (!le)
                return H.removeAllListeners(I), H._parser["on" + I] = le, le;
              H.on(I, le);
            },
            enumerable: !0,
            configurable: !1
          });
        });
      }
      r.prototype = Object.create(d.prototype, {
        constructor: {
          value: r
        }
      }), r.prototype.write = function(_) {
        if (typeof Buffer == "function" && typeof Buffer.isBuffer == "function" && Buffer.isBuffer(_)) {
          if (!this._decoder) {
            var g = lc.StringDecoder;
            this._decoder = new g("utf8");
          }
          _ = this._decoder.write(_);
        }
        return this._parser.write(_.toString()), this.emit("data", _), !0;
      }, r.prototype.end = function(_) {
        return _ && _.length && this.write(_), this._parser.end(), !0;
      }, r.prototype.on = function(_, g) {
        var H = this;
        return !H._parser["on" + _] && i.indexOf(_) !== -1 && (H._parser["on" + _] = function() {
          var I = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
          I.splice(0, 0, _), H.emit.apply(H, I);
        }), d.prototype.on.call(H, _, g);
      };
      var o = "[CDATA[", n = "DOCTYPE", m = "http://www.w3.org/XML/1998/namespace", v = "http://www.w3.org/2000/xmlns/", y = { xml: m, xmlns: v }, p = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, A = /[:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/, R = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/, P = /[#:_A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u00B7\u0300-\u036F\u203F-\u2040.\d-]/;
      function O(_) {
        return _ === " " || _ === `
` || _ === "\r" || _ === "	";
      }
      function M(_) {
        return _ === '"' || _ === "'";
      }
      function C(_) {
        return _ === ">" || O(_);
      }
      function S(_, g) {
        return _.test(g);
      }
      function T(_, g) {
        return !S(_, g);
      }
      var E = 0;
      f.STATE = {
        BEGIN: E++,
        // leading byte order mark or whitespace
        BEGIN_WHITESPACE: E++,
        // leading whitespace
        TEXT: E++,
        // general stuff
        TEXT_ENTITY: E++,
        // &amp and such.
        OPEN_WAKA: E++,
        // <
        SGML_DECL: E++,
        // <!BLARG
        SGML_DECL_QUOTED: E++,
        // <!BLARG foo "bar
        DOCTYPE: E++,
        // <!DOCTYPE
        DOCTYPE_QUOTED: E++,
        // <!DOCTYPE "//blah
        DOCTYPE_DTD: E++,
        // <!DOCTYPE "//blah" [ ...
        DOCTYPE_DTD_QUOTED: E++,
        // <!DOCTYPE "//blah" [ "foo
        COMMENT_STARTING: E++,
        // <!-
        COMMENT: E++,
        // <!--
        COMMENT_ENDING: E++,
        // <!-- blah -
        COMMENT_ENDED: E++,
        // <!-- blah --
        CDATA: E++,
        // <![CDATA[ something
        CDATA_ENDING: E++,
        // ]
        CDATA_ENDING_2: E++,
        // ]]
        PROC_INST: E++,
        // <?hi
        PROC_INST_BODY: E++,
        // <?hi there
        PROC_INST_ENDING: E++,
        // <?hi "there" ?
        OPEN_TAG: E++,
        // <strong
        OPEN_TAG_SLASH: E++,
        // <strong /
        ATTRIB: E++,
        // <a
        ATTRIB_NAME: E++,
        // <a foo
        ATTRIB_NAME_SAW_WHITE: E++,
        // <a foo _
        ATTRIB_VALUE: E++,
        // <a foo=
        ATTRIB_VALUE_QUOTED: E++,
        // <a foo="bar
        ATTRIB_VALUE_CLOSED: E++,
        // <a foo="bar"
        ATTRIB_VALUE_UNQUOTED: E++,
        // <a foo=bar
        ATTRIB_VALUE_ENTITY_Q: E++,
        // <foo bar="&quot;"
        ATTRIB_VALUE_ENTITY_U: E++,
        // <foo bar=&quot
        CLOSE_TAG: E++,
        // </a
        CLOSE_TAG_SAW_WHITE: E++,
        // </a   >
        SCRIPT: E++,
        // <script> ...
        SCRIPT_ENDING: E++
        // <script> ... <
      }, f.XML_ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'"
      }, f.ENTITIES = {
        amp: "&",
        gt: ">",
        lt: "<",
        quot: '"',
        apos: "'",
        AElig: 198,
        Aacute: 193,
        Acirc: 194,
        Agrave: 192,
        Aring: 197,
        Atilde: 195,
        Auml: 196,
        Ccedil: 199,
        ETH: 208,
        Eacute: 201,
        Ecirc: 202,
        Egrave: 200,
        Euml: 203,
        Iacute: 205,
        Icirc: 206,
        Igrave: 204,
        Iuml: 207,
        Ntilde: 209,
        Oacute: 211,
        Ocirc: 212,
        Ograve: 210,
        Oslash: 216,
        Otilde: 213,
        Ouml: 214,
        THORN: 222,
        Uacute: 218,
        Ucirc: 219,
        Ugrave: 217,
        Uuml: 220,
        Yacute: 221,
        aacute: 225,
        acirc: 226,
        aelig: 230,
        agrave: 224,
        aring: 229,
        atilde: 227,
        auml: 228,
        ccedil: 231,
        eacute: 233,
        ecirc: 234,
        egrave: 232,
        eth: 240,
        euml: 235,
        iacute: 237,
        icirc: 238,
        igrave: 236,
        iuml: 239,
        ntilde: 241,
        oacute: 243,
        ocirc: 244,
        ograve: 242,
        oslash: 248,
        otilde: 245,
        ouml: 246,
        szlig: 223,
        thorn: 254,
        uacute: 250,
        ucirc: 251,
        ugrave: 249,
        uuml: 252,
        yacute: 253,
        yuml: 255,
        copy: 169,
        reg: 174,
        nbsp: 160,
        iexcl: 161,
        cent: 162,
        pound: 163,
        curren: 164,
        yen: 165,
        brvbar: 166,
        sect: 167,
        uml: 168,
        ordf: 170,
        laquo: 171,
        not: 172,
        shy: 173,
        macr: 175,
        deg: 176,
        plusmn: 177,
        sup1: 185,
        sup2: 178,
        sup3: 179,
        acute: 180,
        micro: 181,
        para: 182,
        middot: 183,
        cedil: 184,
        ordm: 186,
        raquo: 187,
        frac14: 188,
        frac12: 189,
        frac34: 190,
        iquest: 191,
        times: 215,
        divide: 247,
        OElig: 338,
        oelig: 339,
        Scaron: 352,
        scaron: 353,
        Yuml: 376,
        fnof: 402,
        circ: 710,
        tilde: 732,
        Alpha: 913,
        Beta: 914,
        Gamma: 915,
        Delta: 916,
        Epsilon: 917,
        Zeta: 918,
        Eta: 919,
        Theta: 920,
        Iota: 921,
        Kappa: 922,
        Lambda: 923,
        Mu: 924,
        Nu: 925,
        Xi: 926,
        Omicron: 927,
        Pi: 928,
        Rho: 929,
        Sigma: 931,
        Tau: 932,
        Upsilon: 933,
        Phi: 934,
        Chi: 935,
        Psi: 936,
        Omega: 937,
        alpha: 945,
        beta: 946,
        gamma: 947,
        delta: 948,
        epsilon: 949,
        zeta: 950,
        eta: 951,
        theta: 952,
        iota: 953,
        kappa: 954,
        lambda: 955,
        mu: 956,
        nu: 957,
        xi: 958,
        omicron: 959,
        pi: 960,
        rho: 961,
        sigmaf: 962,
        sigma: 963,
        tau: 964,
        upsilon: 965,
        phi: 966,
        chi: 967,
        psi: 968,
        omega: 969,
        thetasym: 977,
        upsih: 978,
        piv: 982,
        ensp: 8194,
        emsp: 8195,
        thinsp: 8201,
        zwnj: 8204,
        zwj: 8205,
        lrm: 8206,
        rlm: 8207,
        ndash: 8211,
        mdash: 8212,
        lsquo: 8216,
        rsquo: 8217,
        sbquo: 8218,
        ldquo: 8220,
        rdquo: 8221,
        bdquo: 8222,
        dagger: 8224,
        Dagger: 8225,
        bull: 8226,
        hellip: 8230,
        permil: 8240,
        prime: 8242,
        Prime: 8243,
        lsaquo: 8249,
        rsaquo: 8250,
        oline: 8254,
        frasl: 8260,
        euro: 8364,
        image: 8465,
        weierp: 8472,
        real: 8476,
        trade: 8482,
        alefsym: 8501,
        larr: 8592,
        uarr: 8593,
        rarr: 8594,
        darr: 8595,
        harr: 8596,
        crarr: 8629,
        lArr: 8656,
        uArr: 8657,
        rArr: 8658,
        dArr: 8659,
        hArr: 8660,
        forall: 8704,
        part: 8706,
        exist: 8707,
        empty: 8709,
        nabla: 8711,
        isin: 8712,
        notin: 8713,
        ni: 8715,
        prod: 8719,
        sum: 8721,
        minus: 8722,
        lowast: 8727,
        radic: 8730,
        prop: 8733,
        infin: 8734,
        ang: 8736,
        and: 8743,
        or: 8744,
        cap: 8745,
        cup: 8746,
        int: 8747,
        there4: 8756,
        sim: 8764,
        cong: 8773,
        asymp: 8776,
        ne: 8800,
        equiv: 8801,
        le: 8804,
        ge: 8805,
        sub: 8834,
        sup: 8835,
        nsub: 8836,
        sube: 8838,
        supe: 8839,
        oplus: 8853,
        otimes: 8855,
        perp: 8869,
        sdot: 8901,
        lceil: 8968,
        rceil: 8969,
        lfloor: 8970,
        rfloor: 8971,
        lang: 9001,
        rang: 9002,
        loz: 9674,
        spades: 9824,
        clubs: 9827,
        hearts: 9829,
        diams: 9830
      }, Object.keys(f.ENTITIES).forEach(function(_) {
        var g = f.ENTITIES[_], H = typeof g == "number" ? String.fromCharCode(g) : g;
        f.ENTITIES[_] = H;
      });
      for (var q in f.STATE)
        f.STATE[f.STATE[q]] = q;
      E = f.STATE;
      function U(_, g, H) {
        _[g] && _[g](H);
      }
      function L(_, g, H) {
        _.textNode && k(_), U(_, g, H);
      }
      function k(_) {
        _.textNode = N(_.opt, _.textNode), _.textNode && U(_, "ontext", _.textNode), _.textNode = "";
      }
      function N(_, g) {
        return _.trim && (g = g.trim()), _.normalize && (g = g.replace(/\s+/g, " ")), g;
      }
      function D(_, g) {
        return k(_), _.trackPosition && (g += `
Line: ` + _.line + `
Column: ` + _.column + `
Char: ` + _.c), g = new Error(g), _.error = g, U(_, "onerror", g), _;
      }
      function F(_) {
        return _.sawRoot && !_.closedRoot && $(_, "Unclosed root tag"), _.state !== E.BEGIN && _.state !== E.BEGIN_WHITESPACE && _.state !== E.TEXT && D(_, "Unexpected end"), k(_), _.c = "", _.closed = !0, U(_, "onend"), u.call(_, _.strict, _.opt), _;
      }
      function $(_, g) {
        if (typeof _ != "object" || !(_ instanceof u))
          throw new Error("bad call to strictFail");
        _.strict && D(_, g);
      }
      function J(_) {
        _.strict || (_.tagName = _.tagName[_.looseCase]());
        var g = _.tags[_.tags.length - 1] || _, H = _.tag = { name: _.tagName, attributes: {} };
        _.opt.xmlns && (H.ns = g.ns), _.attribList.length = 0, L(_, "onopentagstart", H);
      }
      function W(_, g) {
        var H = _.indexOf(":"), I = H < 0 ? ["", _] : _.split(":"), le = I[0], me = I[1];
        return g && _ === "xmlns" && (le = "xmlns", me = ""), { prefix: le, local: me };
      }
      function ne(_) {
        if (_.strict || (_.attribName = _.attribName[_.looseCase]()), _.attribList.indexOf(_.attribName) !== -1 || _.tag.attributes.hasOwnProperty(_.attribName)) {
          _.attribName = _.attribValue = "";
          return;
        }
        if (_.opt.xmlns) {
          var g = W(_.attribName, !0), H = g.prefix, I = g.local;
          if (H === "xmlns")
            if (I === "xml" && _.attribValue !== m)
              $(
                _,
                "xml: prefix must be bound to " + m + `
Actual: ` + _.attribValue
              );
            else if (I === "xmlns" && _.attribValue !== v)
              $(
                _,
                "xmlns: prefix must be bound to " + v + `
Actual: ` + _.attribValue
              );
            else {
              var le = _.tag, me = _.tags[_.tags.length - 1] || _;
              le.ns === me.ns && (le.ns = Object.create(me.ns)), le.ns[I] = _.attribValue;
            }
          _.attribList.push([_.attribName, _.attribValue]);
        } else
          _.tag.attributes[_.attribName] = _.attribValue, L(_, "onattribute", {
            name: _.attribName,
            value: _.attribValue
          });
        _.attribName = _.attribValue = "";
      }
      function ce(_, g) {
        if (_.opt.xmlns) {
          var H = _.tag, I = W(_.tagName);
          H.prefix = I.prefix, H.local = I.local, H.uri = H.ns[I.prefix] || "", H.prefix && !H.uri && ($(
            _,
            "Unbound namespace prefix: " + JSON.stringify(_.tagName)
          ), H.uri = I.prefix);
          var le = _.tags[_.tags.length - 1] || _;
          H.ns && le.ns !== H.ns && Object.keys(H.ns).forEach(function(B) {
            L(_, "onopennamespace", {
              prefix: B,
              uri: H.ns[B]
            });
          });
          for (var me = 0, pe = _.attribList.length; me < pe; me++) {
            var _e = _.attribList[me], ye = _e[0], xe = _e[1], be = W(ye, !0), qe = be.prefix, Et = be.local, at = qe === "" ? "" : H.ns[qe] || "", e = {
              name: ye,
              value: xe,
              prefix: qe,
              local: Et,
              uri: at
            };
            qe && qe !== "xmlns" && !at && ($(
              _,
              "Unbound namespace prefix: " + JSON.stringify(qe)
            ), e.uri = qe), _.tag.attributes[ye] = e, L(_, "onattribute", e);
          }
          _.attribList.length = 0;
        }
        _.tag.isSelfClosing = !!g, _.sawRoot = !0, _.tags.push(_.tag), L(_, "onopentag", _.tag), g || (!_.noscript && _.tagName.toLowerCase() === "script" ? _.state = E.SCRIPT : _.state = E.TEXT, _.tag = null, _.tagName = ""), _.attribName = _.attribValue = "", _.attribList.length = 0;
      }
      function ue(_) {
        if (!_.tagName) {
          $(_, "Weird empty close tag."), _.textNode += "</>", _.state = E.TEXT;
          return;
        }
        if (_.script) {
          if (_.tagName !== "script") {
            _.script += "</" + _.tagName + ">", _.tagName = "", _.state = E.SCRIPT;
            return;
          }
          L(_, "onscript", _.script), _.script = "";
        }
        var g = _.tags.length, H = _.tagName;
        _.strict || (H = H[_.looseCase]());
        for (var I = H; g--; ) {
          var le = _.tags[g];
          if (le.name !== I)
            $(_, "Unexpected close tag");
          else
            break;
        }
        if (g < 0) {
          $(_, "Unmatched closing tag: " + _.tagName), _.textNode += "</" + _.tagName + ">", _.state = E.TEXT;
          return;
        }
        _.tagName = H;
        for (var me = _.tags.length; me-- > g; ) {
          var pe = _.tag = _.tags.pop();
          _.tagName = _.tag.name, L(_, "onclosetag", _.tagName);
          var _e = {};
          for (var ye in pe.ns)
            _e[ye] = pe.ns[ye];
          var xe = _.tags[_.tags.length - 1] || _;
          _.opt.xmlns && pe.ns !== xe.ns && Object.keys(pe.ns).forEach(function(be) {
            var qe = pe.ns[be];
            L(_, "onclosenamespace", { prefix: be, uri: qe });
          });
        }
        g === 0 && (_.closedRoot = !0), _.tagName = _.attribValue = _.attribName = "", _.attribList.length = 0, _.state = E.TEXT;
      }
      function ie(_) {
        var g = _.entity, H = g.toLowerCase(), I, le = "";
        return _.ENTITIES[g] ? _.ENTITIES[g] : _.ENTITIES[H] ? _.ENTITIES[H] : (g = H, g.charAt(0) === "#" && (g.charAt(1) === "x" ? (g = g.slice(2), I = parseInt(g, 16), le = I.toString(16)) : (g = g.slice(1), I = parseInt(g, 10), le = I.toString(10))), g = g.replace(/^0+/, ""), isNaN(I) || le.toLowerCase() !== g || I < 0 || I > 1114111 ? ($(_, "Invalid character entity"), "&" + _.entity + ";") : String.fromCodePoint(I));
      }
      function Ae(_, g) {
        g === "<" ? (_.state = E.OPEN_WAKA, _.startTagPosition = _.position) : O(g) || ($(_, "Non-whitespace before first tag."), _.textNode = g, _.state = E.TEXT);
      }
      function K(_, g) {
        var H = "";
        return g < _.length && (H = _.charAt(g)), H;
      }
      function Ee(_) {
        var g = this;
        if (this.error)
          throw this.error;
        if (g.closed)
          return D(
            g,
            "Cannot write after close. Assign an onready handler."
          );
        if (_ === null)
          return F(g);
        typeof _ == "object" && (_ = _.toString());
        for (var H = 0, I = ""; I = K(_, H++), g.c = I, !!I; )
          switch (g.trackPosition && (g.position++, I === `
` ? (g.line++, g.column = 0) : g.column++), g.state) {
            case E.BEGIN:
              if (g.state = E.BEGIN_WHITESPACE, I === "\uFEFF")
                continue;
              Ae(g, I);
              continue;
            case E.BEGIN_WHITESPACE:
              Ae(g, I);
              continue;
            case E.TEXT:
              if (g.sawRoot && !g.closedRoot) {
                for (var me = H - 1; I && I !== "<" && I !== "&"; )
                  I = K(_, H++), I && g.trackPosition && (g.position++, I === `
` ? (g.line++, g.column = 0) : g.column++);
                g.textNode += _.substring(me, H - 1);
              }
              I === "<" && !(g.sawRoot && g.closedRoot && !g.strict) ? (g.state = E.OPEN_WAKA, g.startTagPosition = g.position) : (!O(I) && (!g.sawRoot || g.closedRoot) && $(g, "Text data outside of root node."), I === "&" ? g.state = E.TEXT_ENTITY : g.textNode += I);
              continue;
            case E.SCRIPT:
              I === "<" ? g.state = E.SCRIPT_ENDING : g.script += I;
              continue;
            case E.SCRIPT_ENDING:
              I === "/" ? g.state = E.CLOSE_TAG : (g.script += "<" + I, g.state = E.SCRIPT);
              continue;
            case E.OPEN_WAKA:
              if (I === "!")
                g.state = E.SGML_DECL, g.sgmlDecl = "";
              else if (!O(I)) if (S(p, I))
                g.state = E.OPEN_TAG, g.tagName = I;
              else if (I === "/")
                g.state = E.CLOSE_TAG, g.tagName = "";
              else if (I === "?")
                g.state = E.PROC_INST, g.procInstName = g.procInstBody = "";
              else {
                if ($(g, "Unencoded <"), g.startTagPosition + 1 < g.position) {
                  var le = g.position - g.startTagPosition;
                  I = new Array(le).join(" ") + I;
                }
                g.textNode += "<" + I, g.state = E.TEXT;
              }
              continue;
            case E.SGML_DECL:
              if (g.sgmlDecl + I === "--") {
                g.state = E.COMMENT, g.comment = "", g.sgmlDecl = "";
                continue;
              }
              g.doctype && g.doctype !== !0 && g.sgmlDecl ? (g.state = E.DOCTYPE_DTD, g.doctype += "<!" + g.sgmlDecl + I, g.sgmlDecl = "") : (g.sgmlDecl + I).toUpperCase() === o ? (L(g, "onopencdata"), g.state = E.CDATA, g.sgmlDecl = "", g.cdata = "") : (g.sgmlDecl + I).toUpperCase() === n ? (g.state = E.DOCTYPE, (g.doctype || g.sawRoot) && $(
                g,
                "Inappropriately located doctype declaration"
              ), g.doctype = "", g.sgmlDecl = "") : I === ">" ? (L(g, "onsgmldeclaration", g.sgmlDecl), g.sgmlDecl = "", g.state = E.TEXT) : (M(I) && (g.state = E.SGML_DECL_QUOTED), g.sgmlDecl += I);
              continue;
            case E.SGML_DECL_QUOTED:
              I === g.q && (g.state = E.SGML_DECL, g.q = ""), g.sgmlDecl += I;
              continue;
            case E.DOCTYPE:
              I === ">" ? (g.state = E.TEXT, L(g, "ondoctype", g.doctype), g.doctype = !0) : (g.doctype += I, I === "[" ? g.state = E.DOCTYPE_DTD : M(I) && (g.state = E.DOCTYPE_QUOTED, g.q = I));
              continue;
            case E.DOCTYPE_QUOTED:
              g.doctype += I, I === g.q && (g.q = "", g.state = E.DOCTYPE);
              continue;
            case E.DOCTYPE_DTD:
              I === "]" ? (g.doctype += I, g.state = E.DOCTYPE) : I === "<" ? (g.state = E.OPEN_WAKA, g.startTagPosition = g.position) : M(I) ? (g.doctype += I, g.state = E.DOCTYPE_DTD_QUOTED, g.q = I) : g.doctype += I;
              continue;
            case E.DOCTYPE_DTD_QUOTED:
              g.doctype += I, I === g.q && (g.state = E.DOCTYPE_DTD, g.q = "");
              continue;
            case E.COMMENT:
              I === "-" ? g.state = E.COMMENT_ENDING : g.comment += I;
              continue;
            case E.COMMENT_ENDING:
              I === "-" ? (g.state = E.COMMENT_ENDED, g.comment = N(g.opt, g.comment), g.comment && L(g, "oncomment", g.comment), g.comment = "") : (g.comment += "-" + I, g.state = E.COMMENT);
              continue;
            case E.COMMENT_ENDED:
              I !== ">" ? ($(g, "Malformed comment"), g.comment += "--" + I, g.state = E.COMMENT) : g.doctype && g.doctype !== !0 ? g.state = E.DOCTYPE_DTD : g.state = E.TEXT;
              continue;
            case E.CDATA:
              for (var me = H - 1; I && I !== "]"; )
                I = K(_, H++), I && g.trackPosition && (g.position++, I === `
` ? (g.line++, g.column = 0) : g.column++);
              g.cdata += _.substring(me, H - 1), I === "]" && (g.state = E.CDATA_ENDING);
              continue;
            case E.CDATA_ENDING:
              I === "]" ? g.state = E.CDATA_ENDING_2 : (g.cdata += "]" + I, g.state = E.CDATA);
              continue;
            case E.CDATA_ENDING_2:
              I === ">" ? (g.cdata && L(g, "oncdata", g.cdata), L(g, "onclosecdata"), g.cdata = "", g.state = E.TEXT) : I === "]" ? g.cdata += "]" : (g.cdata += "]]" + I, g.state = E.CDATA);
              continue;
            case E.PROC_INST:
              I === "?" ? g.state = E.PROC_INST_ENDING : O(I) ? g.state = E.PROC_INST_BODY : g.procInstName += I;
              continue;
            case E.PROC_INST_BODY:
              if (!g.procInstBody && O(I))
                continue;
              I === "?" ? g.state = E.PROC_INST_ENDING : g.procInstBody += I;
              continue;
            case E.PROC_INST_ENDING:
              I === ">" ? (L(g, "onprocessinginstruction", {
                name: g.procInstName,
                body: g.procInstBody
              }), g.procInstName = g.procInstBody = "", g.state = E.TEXT) : (g.procInstBody += "?" + I, g.state = E.PROC_INST_BODY);
              continue;
            case E.OPEN_TAG:
              S(A, I) ? g.tagName += I : (J(g), I === ">" ? ce(g) : I === "/" ? g.state = E.OPEN_TAG_SLASH : (O(I) || $(g, "Invalid character in tag name"), g.state = E.ATTRIB));
              continue;
            case E.OPEN_TAG_SLASH:
              I === ">" ? (ce(g, !0), ue(g)) : ($(
                g,
                "Forward-slash in opening tag not followed by >"
              ), g.state = E.ATTRIB);
              continue;
            case E.ATTRIB:
              if (O(I))
                continue;
              I === ">" ? ce(g) : I === "/" ? g.state = E.OPEN_TAG_SLASH : S(p, I) ? (g.attribName = I, g.attribValue = "", g.state = E.ATTRIB_NAME) : $(g, "Invalid attribute name");
              continue;
            case E.ATTRIB_NAME:
              I === "=" ? g.state = E.ATTRIB_VALUE : I === ">" ? ($(g, "Attribute without value"), g.attribValue = g.attribName, ne(g), ce(g)) : O(I) ? g.state = E.ATTRIB_NAME_SAW_WHITE : S(A, I) ? g.attribName += I : $(g, "Invalid attribute name");
              continue;
            case E.ATTRIB_NAME_SAW_WHITE:
              if (I === "=")
                g.state = E.ATTRIB_VALUE;
              else {
                if (O(I))
                  continue;
                $(g, "Attribute without value"), g.tag.attributes[g.attribName] = "", g.attribValue = "", L(g, "onattribute", {
                  name: g.attribName,
                  value: ""
                }), g.attribName = "", I === ">" ? ce(g) : S(p, I) ? (g.attribName = I, g.state = E.ATTRIB_NAME) : ($(g, "Invalid attribute name"), g.state = E.ATTRIB);
              }
              continue;
            case E.ATTRIB_VALUE:
              if (O(I))
                continue;
              M(I) ? (g.q = I, g.state = E.ATTRIB_VALUE_QUOTED) : (g.opt.unquotedAttributeValues || D(g, "Unquoted attribute value"), g.state = E.ATTRIB_VALUE_UNQUOTED, g.attribValue = I);
              continue;
            case E.ATTRIB_VALUE_QUOTED:
              if (I !== g.q) {
                I === "&" ? g.state = E.ATTRIB_VALUE_ENTITY_Q : g.attribValue += I;
                continue;
              }
              ne(g), g.q = "", g.state = E.ATTRIB_VALUE_CLOSED;
              continue;
            case E.ATTRIB_VALUE_CLOSED:
              O(I) ? g.state = E.ATTRIB : I === ">" ? ce(g) : I === "/" ? g.state = E.OPEN_TAG_SLASH : S(p, I) ? ($(g, "No whitespace between attributes"), g.attribName = I, g.attribValue = "", g.state = E.ATTRIB_NAME) : $(g, "Invalid attribute name");
              continue;
            case E.ATTRIB_VALUE_UNQUOTED:
              if (!C(I)) {
                I === "&" ? g.state = E.ATTRIB_VALUE_ENTITY_U : g.attribValue += I;
                continue;
              }
              ne(g), I === ">" ? ce(g) : g.state = E.ATTRIB;
              continue;
            case E.CLOSE_TAG:
              if (g.tagName)
                I === ">" ? ue(g) : S(A, I) ? g.tagName += I : g.script ? (g.script += "</" + g.tagName, g.tagName = "", g.state = E.SCRIPT) : (O(I) || $(g, "Invalid tagname in closing tag"), g.state = E.CLOSE_TAG_SAW_WHITE);
              else {
                if (O(I))
                  continue;
                T(p, I) ? g.script ? (g.script += "</" + I, g.state = E.SCRIPT) : $(g, "Invalid tagname in closing tag.") : g.tagName = I;
              }
              continue;
            case E.CLOSE_TAG_SAW_WHITE:
              if (O(I))
                continue;
              I === ">" ? ue(g) : $(g, "Invalid characters in closing tag");
              continue;
            case E.TEXT_ENTITY:
            case E.ATTRIB_VALUE_ENTITY_Q:
            case E.ATTRIB_VALUE_ENTITY_U:
              var pe, _e;
              switch (g.state) {
                case E.TEXT_ENTITY:
                  pe = E.TEXT, _e = "textNode";
                  break;
                case E.ATTRIB_VALUE_ENTITY_Q:
                  pe = E.ATTRIB_VALUE_QUOTED, _e = "attribValue";
                  break;
                case E.ATTRIB_VALUE_ENTITY_U:
                  pe = E.ATTRIB_VALUE_UNQUOTED, _e = "attribValue";
                  break;
              }
              if (I === ";") {
                var ye = ie(g);
                g.opt.unparsedEntities && !Object.values(f.XML_ENTITIES).includes(ye) ? (g.entity = "", g.state = pe, g.write(ye)) : (g[_e] += ye, g.entity = "", g.state = pe);
              } else S(g.entity.length ? P : R, I) ? g.entity += I : ($(g, "Invalid character in entity name"), g[_e] += "&" + g.entity + I, g.entity = "", g.state = pe);
              continue;
            default:
              throw new Error(g, "Unknown state: " + g.state);
          }
        return g.position >= g.bufferCheckPosition && c(g), g;
      }
      /*! http://mths.be/fromcodepoint v0.1.0 by @mathias */
      String.fromCodePoint || (function() {
        var _ = String.fromCharCode, g = Math.floor, H = function() {
          var I = 16384, le = [], me, pe, _e = -1, ye = arguments.length;
          if (!ye)
            return "";
          for (var xe = ""; ++_e < ye; ) {
            var be = Number(arguments[_e]);
            if (!isFinite(be) || // `NaN`, `+Infinity`, or `-Infinity`
            be < 0 || // not a valid Unicode code point
            be > 1114111 || // not a valid Unicode code point
            g(be) !== be)
              throw RangeError("Invalid code point: " + be);
            be <= 65535 ? le.push(be) : (be -= 65536, me = (be >> 10) + 55296, pe = be % 1024 + 56320, le.push(me, pe)), (_e + 1 === ye || le.length > I) && (xe += _.apply(null, le), le.length = 0);
          }
          return xe;
        };
        Object.defineProperty ? Object.defineProperty(String, "fromCodePoint", {
          value: H,
          configurable: !0,
          writable: !0
        }) : String.fromCodePoint = H;
      })();
    })(t);
  })(Un)), Un;
}
var Co;
function Vc() {
  if (Co) return Lt;
  Co = 1, Object.defineProperty(Lt, "__esModule", { value: !0 }), Lt.XElement = void 0, Lt.parseXml = a;
  const t = Wc(), f = Gr();
  class h {
    constructor(i) {
      if (this.name = i, this.value = "", this.attributes = null, this.isCData = !1, this.elements = null, !i)
        throw (0, f.newError)("Element name cannot be empty", "ERR_XML_ELEMENT_NAME_EMPTY");
      if (!c(i))
        throw (0, f.newError)(`Invalid element name: ${i}`, "ERR_XML_ELEMENT_INVALID_NAME");
    }
    attribute(i) {
      const s = this.attributes === null ? null : this.attributes[i];
      if (s == null)
        throw (0, f.newError)(`No attribute "${i}"`, "ERR_XML_MISSED_ATTRIBUTE");
      return s;
    }
    removeAttribute(i) {
      this.attributes !== null && delete this.attributes[i];
    }
    element(i, s = !1, r = null) {
      const o = this.elementOrNull(i, s);
      if (o === null)
        throw (0, f.newError)(r || `No element "${i}"`, "ERR_XML_MISSED_ELEMENT");
      return o;
    }
    elementOrNull(i, s = !1) {
      if (this.elements === null)
        return null;
      for (const r of this.elements)
        if (l(r, i, s))
          return r;
      return null;
    }
    getElements(i, s = !1) {
      return this.elements === null ? [] : this.elements.filter((r) => l(r, i, s));
    }
    elementValueOrEmpty(i, s = !1) {
      const r = this.elementOrNull(i, s);
      return r === null ? "" : r.value;
    }
  }
  Lt.XElement = h;
  const u = new RegExp(/^[A-Za-z_][:A-Za-z0-9_-]*$/i);
  function c(d) {
    return u.test(d);
  }
  function l(d, i, s) {
    const r = d.name;
    return r === i || s === !0 && r.length === i.length && r.toLowerCase() === i.toLowerCase();
  }
  function a(d) {
    let i = null;
    const s = t.parser(!0, {}), r = [];
    return s.onopentag = (o) => {
      const n = new h(o.name);
      if (n.attributes = o.attributes, i === null)
        i = n;
      else {
        const m = r[r.length - 1];
        m.elements == null && (m.elements = []), m.elements.push(n);
      }
      r.push(n);
    }, s.onclosetag = () => {
      r.pop();
    }, s.ontext = (o) => {
      r.length > 0 && (r[r.length - 1].value = o);
    }, s.oncdata = (o) => {
      const n = r[r.length - 1];
      n.value = o, n.isCData = !0;
    }, s.onerror = (o) => {
      throw o;
    }, s.write(d), i;
  }
  return Lt;
}
var bo;
function ke() {
  return bo || (bo = 1, (function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.CURRENT_APP_PACKAGE_FILE_NAME = t.CURRENT_APP_INSTALLER_FILE_NAME = t.XElement = t.parseXml = t.UUID = t.parseDn = t.retry = t.githubUrl = t.getS3LikeProviderBaseUrl = t.ProgressCallbackTransform = t.MemoLazy = t.safeStringifyJson = t.safeGetHeader = t.parseJson = t.HttpExecutor = t.HttpError = t.DigestTransform = t.createHttpError = t.configureRequestUrl = t.configureRequestOptionsFromUrl = t.configureRequestOptions = t.newError = t.CancellationToken = t.CancellationError = void 0, t.asArray = o;
    var f = ia();
    Object.defineProperty(t, "CancellationError", { enumerable: !0, get: function() {
      return f.CancellationError;
    } }), Object.defineProperty(t, "CancellationToken", { enumerable: !0, get: function() {
      return f.CancellationToken;
    } });
    var h = Gr();
    Object.defineProperty(t, "newError", { enumerable: !0, get: function() {
      return h.newError;
    } });
    var u = qc();
    Object.defineProperty(t, "configureRequestOptions", { enumerable: !0, get: function() {
      return u.configureRequestOptions;
    } }), Object.defineProperty(t, "configureRequestOptionsFromUrl", { enumerable: !0, get: function() {
      return u.configureRequestOptionsFromUrl;
    } }), Object.defineProperty(t, "configureRequestUrl", { enumerable: !0, get: function() {
      return u.configureRequestUrl;
    } }), Object.defineProperty(t, "createHttpError", { enumerable: !0, get: function() {
      return u.createHttpError;
    } }), Object.defineProperty(t, "DigestTransform", { enumerable: !0, get: function() {
      return u.DigestTransform;
    } }), Object.defineProperty(t, "HttpError", { enumerable: !0, get: function() {
      return u.HttpError;
    } }), Object.defineProperty(t, "HttpExecutor", { enumerable: !0, get: function() {
      return u.HttpExecutor;
    } }), Object.defineProperty(t, "parseJson", { enumerable: !0, get: function() {
      return u.parseJson;
    } }), Object.defineProperty(t, "safeGetHeader", { enumerable: !0, get: function() {
      return u.safeGetHeader;
    } }), Object.defineProperty(t, "safeStringifyJson", { enumerable: !0, get: function() {
      return u.safeStringifyJson;
    } });
    var c = Mc();
    Object.defineProperty(t, "MemoLazy", { enumerable: !0, get: function() {
      return c.MemoLazy;
    } });
    var l = Ul();
    Object.defineProperty(t, "ProgressCallbackTransform", { enumerable: !0, get: function() {
      return l.ProgressCallbackTransform;
    } });
    var a = Bc();
    Object.defineProperty(t, "getS3LikeProviderBaseUrl", { enumerable: !0, get: function() {
      return a.getS3LikeProviderBaseUrl;
    } }), Object.defineProperty(t, "githubUrl", { enumerable: !0, get: function() {
      return a.githubUrl;
    } });
    var d = Hc();
    Object.defineProperty(t, "retry", { enumerable: !0, get: function() {
      return d.retry;
    } });
    var i = jc();
    Object.defineProperty(t, "parseDn", { enumerable: !0, get: function() {
      return i.parseDn;
    } });
    var s = Gc();
    Object.defineProperty(t, "UUID", { enumerable: !0, get: function() {
      return s.UUID;
    } });
    var r = Vc();
    Object.defineProperty(t, "parseXml", { enumerable: !0, get: function() {
      return r.parseXml;
    } }), Object.defineProperty(t, "XElement", { enumerable: !0, get: function() {
      return r.XElement;
    } }), t.CURRENT_APP_INSTALLER_FILE_NAME = "installer.exe", t.CURRENT_APP_PACKAGE_FILE_NAME = "package.7z";
    function o(n) {
      return n == null ? [] : Array.isArray(n) ? n : [n];
    }
  })(Dn)), Dn;
}
var He = {}, Ur = {}, ht = {}, Po;
function Er() {
  if (Po) return ht;
  Po = 1;
  function t(a) {
    return typeof a > "u" || a === null;
  }
  function f(a) {
    return typeof a == "object" && a !== null;
  }
  function h(a) {
    return Array.isArray(a) ? a : t(a) ? [] : [a];
  }
  function u(a, d) {
    var i, s, r, o;
    if (d)
      for (o = Object.keys(d), i = 0, s = o.length; i < s; i += 1)
        r = o[i], a[r] = d[r];
    return a;
  }
  function c(a, d) {
    var i = "", s;
    for (s = 0; s < d; s += 1)
      i += a;
    return i;
  }
  function l(a) {
    return a === 0 && Number.NEGATIVE_INFINITY === 1 / a;
  }
  return ht.isNothing = t, ht.isObject = f, ht.toArray = h, ht.repeat = c, ht.isNegativeZero = l, ht.extend = u, ht;
}
var $n, Oo;
function yr() {
  if (Oo) return $n;
  Oo = 1;
  function t(h, u) {
    var c = "", l = h.reason || "(unknown reason)";
    return h.mark ? (h.mark.name && (c += 'in "' + h.mark.name + '" '), c += "(" + (h.mark.line + 1) + ":" + (h.mark.column + 1) + ")", !u && h.mark.snippet && (c += `

` + h.mark.snippet), l + " " + c) : l;
  }
  function f(h, u) {
    Error.call(this), this.name = "YAMLException", this.reason = h, this.mark = u, this.message = t(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = new Error().stack || "";
  }
  return f.prototype = Object.create(Error.prototype), f.prototype.constructor = f, f.prototype.toString = function(u) {
    return this.name + ": " + t(this, u);
  }, $n = f, $n;
}
var kn, Io;
function Yc() {
  if (Io) return kn;
  Io = 1;
  var t = Er();
  function f(c, l, a, d, i) {
    var s = "", r = "", o = Math.floor(i / 2) - 1;
    return d - l > o && (s = " ... ", l = d - o + s.length), a - d > o && (r = " ...", a = d + o - r.length), {
      str: s + c.slice(l, a).replace(/\t/g, "→") + r,
      pos: d - l + s.length
      // relative position
    };
  }
  function h(c, l) {
    return t.repeat(" ", l - c.length) + c;
  }
  function u(c, l) {
    if (l = Object.create(l || null), !c.buffer) return null;
    l.maxLength || (l.maxLength = 79), typeof l.indent != "number" && (l.indent = 1), typeof l.linesBefore != "number" && (l.linesBefore = 3), typeof l.linesAfter != "number" && (l.linesAfter = 2);
    for (var a = /\r?\n|\r|\0/g, d = [0], i = [], s, r = -1; s = a.exec(c.buffer); )
      i.push(s.index), d.push(s.index + s[0].length), c.position <= s.index && r < 0 && (r = d.length - 2);
    r < 0 && (r = d.length - 1);
    var o = "", n, m, v = Math.min(c.line + l.linesAfter, i.length).toString().length, y = l.maxLength - (l.indent + v + 3);
    for (n = 1; n <= l.linesBefore && !(r - n < 0); n++)
      m = f(
        c.buffer,
        d[r - n],
        i[r - n],
        c.position - (d[r] - d[r - n]),
        y
      ), o = t.repeat(" ", l.indent) + h((c.line - n + 1).toString(), v) + " | " + m.str + `
` + o;
    for (m = f(c.buffer, d[r], i[r], c.position, y), o += t.repeat(" ", l.indent) + h((c.line + 1).toString(), v) + " | " + m.str + `
`, o += t.repeat("-", l.indent + v + 3 + m.pos) + `^
`, n = 1; n <= l.linesAfter && !(r + n >= i.length); n++)
      m = f(
        c.buffer,
        d[r + n],
        i[r + n],
        c.position - (d[r] - d[r + n]),
        y
      ), o += t.repeat(" ", l.indent) + h((c.line + n + 1).toString(), v) + " | " + m.str + `
`;
    return o.replace(/\n$/, "");
  }
  return kn = u, kn;
}
var qn, Do;
function je() {
  if (Do) return qn;
  Do = 1;
  var t = yr(), f = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ], h = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function u(l) {
    var a = {};
    return l !== null && Object.keys(l).forEach(function(d) {
      l[d].forEach(function(i) {
        a[String(i)] = d;
      });
    }), a;
  }
  function c(l, a) {
    if (a = a || {}, Object.keys(a).forEach(function(d) {
      if (f.indexOf(d) === -1)
        throw new t('Unknown option "' + d + '" is met in definition of "' + l + '" YAML type.');
    }), this.options = a, this.tag = l, this.kind = a.kind || null, this.resolve = a.resolve || function() {
      return !0;
    }, this.construct = a.construct || function(d) {
      return d;
    }, this.instanceOf = a.instanceOf || null, this.predicate = a.predicate || null, this.represent = a.represent || null, this.representName = a.representName || null, this.defaultStyle = a.defaultStyle || null, this.multi = a.multi || !1, this.styleAliases = u(a.styleAliases || null), h.indexOf(this.kind) === -1)
      throw new t('Unknown kind "' + this.kind + '" is specified for "' + l + '" YAML type.');
  }
  return qn = c, qn;
}
var Mn, No;
function $l() {
  if (No) return Mn;
  No = 1;
  var t = yr(), f = je();
  function h(l, a) {
    var d = [];
    return l[a].forEach(function(i) {
      var s = d.length;
      d.forEach(function(r, o) {
        r.tag === i.tag && r.kind === i.kind && r.multi === i.multi && (s = o);
      }), d[s] = i;
    }), d;
  }
  function u() {
    var l = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    }, a, d;
    function i(s) {
      s.multi ? (l.multi[s.kind].push(s), l.multi.fallback.push(s)) : l[s.kind][s.tag] = l.fallback[s.tag] = s;
    }
    for (a = 0, d = arguments.length; a < d; a += 1)
      arguments[a].forEach(i);
    return l;
  }
  function c(l) {
    return this.extend(l);
  }
  return c.prototype.extend = function(a) {
    var d = [], i = [];
    if (a instanceof f)
      i.push(a);
    else if (Array.isArray(a))
      i = i.concat(a);
    else if (a && (Array.isArray(a.implicit) || Array.isArray(a.explicit)))
      a.implicit && (d = d.concat(a.implicit)), a.explicit && (i = i.concat(a.explicit));
    else
      throw new t("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    d.forEach(function(r) {
      if (!(r instanceof f))
        throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (r.loadKind && r.loadKind !== "scalar")
        throw new t("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (r.multi)
        throw new t("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), i.forEach(function(r) {
      if (!(r instanceof f))
        throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    var s = Object.create(c.prototype);
    return s.implicit = (this.implicit || []).concat(d), s.explicit = (this.explicit || []).concat(i), s.compiledImplicit = h(s, "implicit"), s.compiledExplicit = h(s, "explicit"), s.compiledTypeMap = u(s.compiledImplicit, s.compiledExplicit), s;
  }, Mn = c, Mn;
}
var Bn, Fo;
function kl() {
  if (Fo) return Bn;
  Fo = 1;
  var t = je();
  return Bn = new t("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(f) {
      return f !== null ? f : "";
    }
  }), Bn;
}
var Hn, xo;
function ql() {
  if (xo) return Hn;
  xo = 1;
  var t = je();
  return Hn = new t("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(f) {
      return f !== null ? f : [];
    }
  }), Hn;
}
var jn, Lo;
function Ml() {
  if (Lo) return jn;
  Lo = 1;
  var t = je();
  return jn = new t("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(f) {
      return f !== null ? f : {};
    }
  }), jn;
}
var Gn, Uo;
function Bl() {
  if (Uo) return Gn;
  Uo = 1;
  var t = $l();
  return Gn = new t({
    explicit: [
      kl(),
      ql(),
      Ml()
    ]
  }), Gn;
}
var Wn, $o;
function Hl() {
  if ($o) return Wn;
  $o = 1;
  var t = je();
  function f(c) {
    if (c === null) return !0;
    var l = c.length;
    return l === 1 && c === "~" || l === 4 && (c === "null" || c === "Null" || c === "NULL");
  }
  function h() {
    return null;
  }
  function u(c) {
    return c === null;
  }
  return Wn = new t("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: f,
    construct: h,
    predicate: u,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  }), Wn;
}
var Vn, ko;
function jl() {
  if (ko) return Vn;
  ko = 1;
  var t = je();
  function f(c) {
    if (c === null) return !1;
    var l = c.length;
    return l === 4 && (c === "true" || c === "True" || c === "TRUE") || l === 5 && (c === "false" || c === "False" || c === "FALSE");
  }
  function h(c) {
    return c === "true" || c === "True" || c === "TRUE";
  }
  function u(c) {
    return Object.prototype.toString.call(c) === "[object Boolean]";
  }
  return Vn = new t("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: f,
    construct: h,
    predicate: u,
    represent: {
      lowercase: function(c) {
        return c ? "true" : "false";
      },
      uppercase: function(c) {
        return c ? "TRUE" : "FALSE";
      },
      camelcase: function(c) {
        return c ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  }), Vn;
}
var Yn, qo;
function Gl() {
  if (qo) return Yn;
  qo = 1;
  var t = Er(), f = je();
  function h(i) {
    return 48 <= i && i <= 57 || 65 <= i && i <= 70 || 97 <= i && i <= 102;
  }
  function u(i) {
    return 48 <= i && i <= 55;
  }
  function c(i) {
    return 48 <= i && i <= 57;
  }
  function l(i) {
    if (i === null) return !1;
    var s = i.length, r = 0, o = !1, n;
    if (!s) return !1;
    if (n = i[r], (n === "-" || n === "+") && (n = i[++r]), n === "0") {
      if (r + 1 === s) return !0;
      if (n = i[++r], n === "b") {
        for (r++; r < s; r++)
          if (n = i[r], n !== "_") {
            if (n !== "0" && n !== "1") return !1;
            o = !0;
          }
        return o && n !== "_";
      }
      if (n === "x") {
        for (r++; r < s; r++)
          if (n = i[r], n !== "_") {
            if (!h(i.charCodeAt(r))) return !1;
            o = !0;
          }
        return o && n !== "_";
      }
      if (n === "o") {
        for (r++; r < s; r++)
          if (n = i[r], n !== "_") {
            if (!u(i.charCodeAt(r))) return !1;
            o = !0;
          }
        return o && n !== "_";
      }
    }
    if (n === "_") return !1;
    for (; r < s; r++)
      if (n = i[r], n !== "_") {
        if (!c(i.charCodeAt(r)))
          return !1;
        o = !0;
      }
    return !(!o || n === "_");
  }
  function a(i) {
    var s = i, r = 1, o;
    if (s.indexOf("_") !== -1 && (s = s.replace(/_/g, "")), o = s[0], (o === "-" || o === "+") && (o === "-" && (r = -1), s = s.slice(1), o = s[0]), s === "0") return 0;
    if (o === "0") {
      if (s[1] === "b") return r * parseInt(s.slice(2), 2);
      if (s[1] === "x") return r * parseInt(s.slice(2), 16);
      if (s[1] === "o") return r * parseInt(s.slice(2), 8);
    }
    return r * parseInt(s, 10);
  }
  function d(i) {
    return Object.prototype.toString.call(i) === "[object Number]" && i % 1 === 0 && !t.isNegativeZero(i);
  }
  return Yn = new f("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: l,
    construct: a,
    predicate: d,
    represent: {
      binary: function(i) {
        return i >= 0 ? "0b" + i.toString(2) : "-0b" + i.toString(2).slice(1);
      },
      octal: function(i) {
        return i >= 0 ? "0o" + i.toString(8) : "-0o" + i.toString(8).slice(1);
      },
      decimal: function(i) {
        return i.toString(10);
      },
      /* eslint-disable max-len */
      hexadecimal: function(i) {
        return i >= 0 ? "0x" + i.toString(16).toUpperCase() : "-0x" + i.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  }), Yn;
}
var zn, Mo;
function Wl() {
  if (Mo) return zn;
  Mo = 1;
  var t = Er(), f = je(), h = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function u(i) {
    return !(i === null || !h.test(i) || // Quick hack to not allow integers end with `_`
    // Probably should update regexp & check speed
    i[i.length - 1] === "_");
  }
  function c(i) {
    var s, r;
    return s = i.replace(/_/g, "").toLowerCase(), r = s[0] === "-" ? -1 : 1, "+-".indexOf(s[0]) >= 0 && (s = s.slice(1)), s === ".inf" ? r === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : s === ".nan" ? NaN : r * parseFloat(s, 10);
  }
  var l = /^[-+]?[0-9]+e/;
  function a(i, s) {
    var r;
    if (isNaN(i))
      switch (s) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    else if (Number.POSITIVE_INFINITY === i)
      switch (s) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    else if (Number.NEGATIVE_INFINITY === i)
      switch (s) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    else if (t.isNegativeZero(i))
      return "-0.0";
    return r = i.toString(10), l.test(r) ? r.replace("e", ".e") : r;
  }
  function d(i) {
    return Object.prototype.toString.call(i) === "[object Number]" && (i % 1 !== 0 || t.isNegativeZero(i));
  }
  return zn = new f("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: u,
    construct: c,
    predicate: d,
    represent: a,
    defaultStyle: "lowercase"
  }), zn;
}
var Xn, Bo;
function Vl() {
  return Bo || (Bo = 1, Xn = Bl().extend({
    implicit: [
      Hl(),
      jl(),
      Gl(),
      Wl()
    ]
  })), Xn;
}
var Kn, Ho;
function Yl() {
  return Ho || (Ho = 1, Kn = Vl()), Kn;
}
var Jn, jo;
function zl() {
  if (jo) return Jn;
  jo = 1;
  var t = je(), f = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  ), h = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function u(a) {
    return a === null ? !1 : f.exec(a) !== null || h.exec(a) !== null;
  }
  function c(a) {
    var d, i, s, r, o, n, m, v = 0, y = null, p, A, R;
    if (d = f.exec(a), d === null && (d = h.exec(a)), d === null) throw new Error("Date resolve error");
    if (i = +d[1], s = +d[2] - 1, r = +d[3], !d[4])
      return new Date(Date.UTC(i, s, r));
    if (o = +d[4], n = +d[5], m = +d[6], d[7]) {
      for (v = d[7].slice(0, 3); v.length < 3; )
        v += "0";
      v = +v;
    }
    return d[9] && (p = +d[10], A = +(d[11] || 0), y = (p * 60 + A) * 6e4, d[9] === "-" && (y = -y)), R = new Date(Date.UTC(i, s, r, o, n, m, v)), y && R.setTime(R.getTime() - y), R;
  }
  function l(a) {
    return a.toISOString();
  }
  return Jn = new t("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: u,
    construct: c,
    instanceOf: Date,
    represent: l
  }), Jn;
}
var Qn, Go;
function Xl() {
  if (Go) return Qn;
  Go = 1;
  var t = je();
  function f(h) {
    return h === "<<" || h === null;
  }
  return Qn = new t("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: f
  }), Qn;
}
var Zn, Wo;
function Kl() {
  if (Wo) return Zn;
  Wo = 1;
  var t = je(), f = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function h(a) {
    if (a === null) return !1;
    var d, i, s = 0, r = a.length, o = f;
    for (i = 0; i < r; i++)
      if (d = o.indexOf(a.charAt(i)), !(d > 64)) {
        if (d < 0) return !1;
        s += 6;
      }
    return s % 8 === 0;
  }
  function u(a) {
    var d, i, s = a.replace(/[\r\n=]/g, ""), r = s.length, o = f, n = 0, m = [];
    for (d = 0; d < r; d++)
      d % 4 === 0 && d && (m.push(n >> 16 & 255), m.push(n >> 8 & 255), m.push(n & 255)), n = n << 6 | o.indexOf(s.charAt(d));
    return i = r % 4 * 6, i === 0 ? (m.push(n >> 16 & 255), m.push(n >> 8 & 255), m.push(n & 255)) : i === 18 ? (m.push(n >> 10 & 255), m.push(n >> 2 & 255)) : i === 12 && m.push(n >> 4 & 255), new Uint8Array(m);
  }
  function c(a) {
    var d = "", i = 0, s, r, o = a.length, n = f;
    for (s = 0; s < o; s++)
      s % 3 === 0 && s && (d += n[i >> 18 & 63], d += n[i >> 12 & 63], d += n[i >> 6 & 63], d += n[i & 63]), i = (i << 8) + a[s];
    return r = o % 3, r === 0 ? (d += n[i >> 18 & 63], d += n[i >> 12 & 63], d += n[i >> 6 & 63], d += n[i & 63]) : r === 2 ? (d += n[i >> 10 & 63], d += n[i >> 4 & 63], d += n[i << 2 & 63], d += n[64]) : r === 1 && (d += n[i >> 2 & 63], d += n[i << 4 & 63], d += n[64], d += n[64]), d;
  }
  function l(a) {
    return Object.prototype.toString.call(a) === "[object Uint8Array]";
  }
  return Zn = new t("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: h,
    construct: u,
    predicate: l,
    represent: c
  }), Zn;
}
var ei, Vo;
function Jl() {
  if (Vo) return ei;
  Vo = 1;
  var t = je(), f = Object.prototype.hasOwnProperty, h = Object.prototype.toString;
  function u(l) {
    if (l === null) return !0;
    var a = [], d, i, s, r, o, n = l;
    for (d = 0, i = n.length; d < i; d += 1) {
      if (s = n[d], o = !1, h.call(s) !== "[object Object]") return !1;
      for (r in s)
        if (f.call(s, r))
          if (!o) o = !0;
          else return !1;
      if (!o) return !1;
      if (a.indexOf(r) === -1) a.push(r);
      else return !1;
    }
    return !0;
  }
  function c(l) {
    return l !== null ? l : [];
  }
  return ei = new t("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: u,
    construct: c
  }), ei;
}
var ti, Yo;
function Ql() {
  if (Yo) return ti;
  Yo = 1;
  var t = je(), f = Object.prototype.toString;
  function h(c) {
    if (c === null) return !0;
    var l, a, d, i, s, r = c;
    for (s = new Array(r.length), l = 0, a = r.length; l < a; l += 1) {
      if (d = r[l], f.call(d) !== "[object Object]" || (i = Object.keys(d), i.length !== 1)) return !1;
      s[l] = [i[0], d[i[0]]];
    }
    return !0;
  }
  function u(c) {
    if (c === null) return [];
    var l, a, d, i, s, r = c;
    for (s = new Array(r.length), l = 0, a = r.length; l < a; l += 1)
      d = r[l], i = Object.keys(d), s[l] = [i[0], d[i[0]]];
    return s;
  }
  return ti = new t("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: h,
    construct: u
  }), ti;
}
var ri, zo;
function Zl() {
  if (zo) return ri;
  zo = 1;
  var t = je(), f = Object.prototype.hasOwnProperty;
  function h(c) {
    if (c === null) return !0;
    var l, a = c;
    for (l in a)
      if (f.call(a, l) && a[l] !== null)
        return !1;
    return !0;
  }
  function u(c) {
    return c !== null ? c : {};
  }
  return ri = new t("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: h,
    construct: u
  }), ri;
}
var ni, Xo;
function aa() {
  return Xo || (Xo = 1, ni = Yl().extend({
    implicit: [
      zl(),
      Xl()
    ],
    explicit: [
      Kl(),
      Jl(),
      Ql(),
      Zl()
    ]
  })), ni;
}
var Ko;
function zc() {
  if (Ko) return Ur;
  Ko = 1;
  var t = Er(), f = yr(), h = Yc(), u = aa(), c = Object.prototype.hasOwnProperty, l = 1, a = 2, d = 3, i = 4, s = 1, r = 2, o = 3, n = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, m = /[\x85\u2028\u2029]/, v = /[,\[\]\{\}]/, y = /^(?:!|!!|![a-z\-]+!)$/i, p = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
  function A(e) {
    return Object.prototype.toString.call(e);
  }
  function R(e) {
    return e === 10 || e === 13;
  }
  function P(e) {
    return e === 9 || e === 32;
  }
  function O(e) {
    return e === 9 || e === 32 || e === 10 || e === 13;
  }
  function M(e) {
    return e === 44 || e === 91 || e === 93 || e === 123 || e === 125;
  }
  function C(e) {
    var B;
    return 48 <= e && e <= 57 ? e - 48 : (B = e | 32, 97 <= B && B <= 102 ? B - 97 + 10 : -1);
  }
  function S(e) {
    return e === 120 ? 2 : e === 117 ? 4 : e === 85 ? 8 : 0;
  }
  function T(e) {
    return 48 <= e && e <= 57 ? e - 48 : -1;
  }
  function E(e) {
    return e === 48 ? "\0" : e === 97 ? "\x07" : e === 98 ? "\b" : e === 116 || e === 9 ? "	" : e === 110 ? `
` : e === 118 ? "\v" : e === 102 ? "\f" : e === 114 ? "\r" : e === 101 ? "\x1B" : e === 32 ? " " : e === 34 ? '"' : e === 47 ? "/" : e === 92 ? "\\" : e === 78 ? "" : e === 95 ? " " : e === 76 ? "\u2028" : e === 80 ? "\u2029" : "";
  }
  function q(e) {
    return e <= 65535 ? String.fromCharCode(e) : String.fromCharCode(
      (e - 65536 >> 10) + 55296,
      (e - 65536 & 1023) + 56320
    );
  }
  for (var U = new Array(256), L = new Array(256), k = 0; k < 256; k++)
    U[k] = E(k) ? 1 : 0, L[k] = E(k);
  function N(e, B) {
    this.input = e, this.filename = B.filename || null, this.schema = B.schema || u, this.onWarning = B.onWarning || null, this.legacy = B.legacy || !1, this.json = B.json || !1, this.listener = B.listener || null, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = e.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.firstTabInLine = -1, this.documents = [];
  }
  function D(e, B) {
    var G = {
      name: e.filename,
      buffer: e.input.slice(0, -1),
      // omit trailing \0
      position: e.position,
      line: e.line,
      column: e.position - e.lineStart
    };
    return G.snippet = h(G), new f(B, G);
  }
  function F(e, B) {
    throw D(e, B);
  }
  function $(e, B) {
    e.onWarning && e.onWarning.call(null, D(e, B));
  }
  var J = {
    YAML: function(B, G, re) {
      var V, te, Z;
      B.version !== null && F(B, "duplication of %YAML directive"), re.length !== 1 && F(B, "YAML directive accepts exactly one argument"), V = /^([0-9]+)\.([0-9]+)$/.exec(re[0]), V === null && F(B, "ill-formed argument of the YAML directive"), te = parseInt(V[1], 10), Z = parseInt(V[2], 10), te !== 1 && F(B, "unacceptable YAML version of the document"), B.version = re[0], B.checkLineBreaks = Z < 2, Z !== 1 && Z !== 2 && $(B, "unsupported YAML version of the document");
    },
    TAG: function(B, G, re) {
      var V, te;
      re.length !== 2 && F(B, "TAG directive accepts exactly two arguments"), V = re[0], te = re[1], y.test(V) || F(B, "ill-formed tag handle (first argument) of the TAG directive"), c.call(B.tagMap, V) && F(B, 'there is a previously declared suffix for "' + V + '" tag handle'), p.test(te) || F(B, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        te = decodeURIComponent(te);
      } catch {
        F(B, "tag prefix is malformed: " + te);
      }
      B.tagMap[V] = te;
    }
  };
  function W(e, B, G, re) {
    var V, te, Z, ae;
    if (B < G) {
      if (ae = e.input.slice(B, G), re)
        for (V = 0, te = ae.length; V < te; V += 1)
          Z = ae.charCodeAt(V), Z === 9 || 32 <= Z && Z <= 1114111 || F(e, "expected valid JSON character");
      else n.test(ae) && F(e, "the stream contains non-printable characters");
      e.result += ae;
    }
  }
  function ne(e, B, G, re) {
    var V, te, Z, ae;
    for (t.isObject(G) || F(e, "cannot merge mappings; the provided source object is unacceptable"), V = Object.keys(G), Z = 0, ae = V.length; Z < ae; Z += 1)
      te = V[Z], c.call(B, te) || (B[te] = G[te], re[te] = !0);
  }
  function ce(e, B, G, re, V, te, Z, ae, ge) {
    var ve, Te;
    if (Array.isArray(V))
      for (V = Array.prototype.slice.call(V), ve = 0, Te = V.length; ve < Te; ve += 1)
        Array.isArray(V[ve]) && F(e, "nested arrays are not supported inside keys"), typeof V == "object" && A(V[ve]) === "[object Object]" && (V[ve] = "[object Object]");
    if (typeof V == "object" && A(V) === "[object Object]" && (V = "[object Object]"), V = String(V), B === null && (B = {}), re === "tag:yaml.org,2002:merge")
      if (Array.isArray(te))
        for (ve = 0, Te = te.length; ve < Te; ve += 1)
          ne(e, B, te[ve], G);
      else
        ne(e, B, te, G);
    else
      !e.json && !c.call(G, V) && c.call(B, V) && (e.line = Z || e.line, e.lineStart = ae || e.lineStart, e.position = ge || e.position, F(e, "duplicated mapping key")), V === "__proto__" ? Object.defineProperty(B, V, {
        configurable: !0,
        enumerable: !0,
        writable: !0,
        value: te
      }) : B[V] = te, delete G[V];
    return B;
  }
  function ue(e) {
    var B;
    B = e.input.charCodeAt(e.position), B === 10 ? e.position++ : B === 13 ? (e.position++, e.input.charCodeAt(e.position) === 10 && e.position++) : F(e, "a line break is expected"), e.line += 1, e.lineStart = e.position, e.firstTabInLine = -1;
  }
  function ie(e, B, G) {
    for (var re = 0, V = e.input.charCodeAt(e.position); V !== 0; ) {
      for (; P(V); )
        V === 9 && e.firstTabInLine === -1 && (e.firstTabInLine = e.position), V = e.input.charCodeAt(++e.position);
      if (B && V === 35)
        do
          V = e.input.charCodeAt(++e.position);
        while (V !== 10 && V !== 13 && V !== 0);
      if (R(V))
        for (ue(e), V = e.input.charCodeAt(e.position), re++, e.lineIndent = 0; V === 32; )
          e.lineIndent++, V = e.input.charCodeAt(++e.position);
      else
        break;
    }
    return G !== -1 && re !== 0 && e.lineIndent < G && $(e, "deficient indentation"), re;
  }
  function Ae(e) {
    var B = e.position, G;
    return G = e.input.charCodeAt(B), !!((G === 45 || G === 46) && G === e.input.charCodeAt(B + 1) && G === e.input.charCodeAt(B + 2) && (B += 3, G = e.input.charCodeAt(B), G === 0 || O(G)));
  }
  function K(e, B) {
    B === 1 ? e.result += " " : B > 1 && (e.result += t.repeat(`
`, B - 1));
  }
  function Ee(e, B, G) {
    var re, V, te, Z, ae, ge, ve, Te, de = e.kind, Le = e.result, w;
    if (w = e.input.charCodeAt(e.position), O(w) || M(w) || w === 35 || w === 38 || w === 42 || w === 33 || w === 124 || w === 62 || w === 39 || w === 34 || w === 37 || w === 64 || w === 96 || (w === 63 || w === 45) && (V = e.input.charCodeAt(e.position + 1), O(V) || G && M(V)))
      return !1;
    for (e.kind = "scalar", e.result = "", te = Z = e.position, ae = !1; w !== 0; ) {
      if (w === 58) {
        if (V = e.input.charCodeAt(e.position + 1), O(V) || G && M(V))
          break;
      } else if (w === 35) {
        if (re = e.input.charCodeAt(e.position - 1), O(re))
          break;
      } else {
        if (e.position === e.lineStart && Ae(e) || G && M(w))
          break;
        if (R(w))
          if (ge = e.line, ve = e.lineStart, Te = e.lineIndent, ie(e, !1, -1), e.lineIndent >= B) {
            ae = !0, w = e.input.charCodeAt(e.position);
            continue;
          } else {
            e.position = Z, e.line = ge, e.lineStart = ve, e.lineIndent = Te;
            break;
          }
      }
      ae && (W(e, te, Z, !1), K(e, e.line - ge), te = Z = e.position, ae = !1), P(w) || (Z = e.position + 1), w = e.input.charCodeAt(++e.position);
    }
    return W(e, te, Z, !1), e.result ? !0 : (e.kind = de, e.result = Le, !1);
  }
  function _(e, B) {
    var G, re, V;
    if (G = e.input.charCodeAt(e.position), G !== 39)
      return !1;
    for (e.kind = "scalar", e.result = "", e.position++, re = V = e.position; (G = e.input.charCodeAt(e.position)) !== 0; )
      if (G === 39)
        if (W(e, re, e.position, !0), G = e.input.charCodeAt(++e.position), G === 39)
          re = e.position, e.position++, V = e.position;
        else
          return !0;
      else R(G) ? (W(e, re, V, !0), K(e, ie(e, !1, B)), re = V = e.position) : e.position === e.lineStart && Ae(e) ? F(e, "unexpected end of the document within a single quoted scalar") : (e.position++, V = e.position);
    F(e, "unexpected end of the stream within a single quoted scalar");
  }
  function g(e, B) {
    var G, re, V, te, Z, ae;
    if (ae = e.input.charCodeAt(e.position), ae !== 34)
      return !1;
    for (e.kind = "scalar", e.result = "", e.position++, G = re = e.position; (ae = e.input.charCodeAt(e.position)) !== 0; ) {
      if (ae === 34)
        return W(e, G, e.position, !0), e.position++, !0;
      if (ae === 92) {
        if (W(e, G, e.position, !0), ae = e.input.charCodeAt(++e.position), R(ae))
          ie(e, !1, B);
        else if (ae < 256 && U[ae])
          e.result += L[ae], e.position++;
        else if ((Z = S(ae)) > 0) {
          for (V = Z, te = 0; V > 0; V--)
            ae = e.input.charCodeAt(++e.position), (Z = C(ae)) >= 0 ? te = (te << 4) + Z : F(e, "expected hexadecimal character");
          e.result += q(te), e.position++;
        } else
          F(e, "unknown escape sequence");
        G = re = e.position;
      } else R(ae) ? (W(e, G, re, !0), K(e, ie(e, !1, B)), G = re = e.position) : e.position === e.lineStart && Ae(e) ? F(e, "unexpected end of the document within a double quoted scalar") : (e.position++, re = e.position);
    }
    F(e, "unexpected end of the stream within a double quoted scalar");
  }
  function H(e, B) {
    var G = !0, re, V, te, Z = e.tag, ae, ge = e.anchor, ve, Te, de, Le, w, j = /* @__PURE__ */ Object.create(null), X, Y, Q, ee;
    if (ee = e.input.charCodeAt(e.position), ee === 91)
      Te = 93, w = !1, ae = [];
    else if (ee === 123)
      Te = 125, w = !0, ae = {};
    else
      return !1;
    for (e.anchor !== null && (e.anchorMap[e.anchor] = ae), ee = e.input.charCodeAt(++e.position); ee !== 0; ) {
      if (ie(e, !0, B), ee = e.input.charCodeAt(e.position), ee === Te)
        return e.position++, e.tag = Z, e.anchor = ge, e.kind = w ? "mapping" : "sequence", e.result = ae, !0;
      G ? ee === 44 && F(e, "expected the node content, but found ','") : F(e, "missed comma between flow collection entries"), Y = X = Q = null, de = Le = !1, ee === 63 && (ve = e.input.charCodeAt(e.position + 1), O(ve) && (de = Le = !0, e.position++, ie(e, !0, B))), re = e.line, V = e.lineStart, te = e.position, xe(e, B, l, !1, !0), Y = e.tag, X = e.result, ie(e, !0, B), ee = e.input.charCodeAt(e.position), (Le || e.line === re) && ee === 58 && (de = !0, ee = e.input.charCodeAt(++e.position), ie(e, !0, B), xe(e, B, l, !1, !0), Q = e.result), w ? ce(e, ae, j, Y, X, Q, re, V, te) : de ? ae.push(ce(e, null, j, Y, X, Q, re, V, te)) : ae.push(X), ie(e, !0, B), ee = e.input.charCodeAt(e.position), ee === 44 ? (G = !0, ee = e.input.charCodeAt(++e.position)) : G = !1;
    }
    F(e, "unexpected end of the stream within a flow collection");
  }
  function I(e, B) {
    var G, re, V = s, te = !1, Z = !1, ae = B, ge = 0, ve = !1, Te, de;
    if (de = e.input.charCodeAt(e.position), de === 124)
      re = !1;
    else if (de === 62)
      re = !0;
    else
      return !1;
    for (e.kind = "scalar", e.result = ""; de !== 0; )
      if (de = e.input.charCodeAt(++e.position), de === 43 || de === 45)
        s === V ? V = de === 43 ? o : r : F(e, "repeat of a chomping mode identifier");
      else if ((Te = T(de)) >= 0)
        Te === 0 ? F(e, "bad explicit indentation width of a block scalar; it cannot be less than one") : Z ? F(e, "repeat of an indentation width identifier") : (ae = B + Te - 1, Z = !0);
      else
        break;
    if (P(de)) {
      do
        de = e.input.charCodeAt(++e.position);
      while (P(de));
      if (de === 35)
        do
          de = e.input.charCodeAt(++e.position);
        while (!R(de) && de !== 0);
    }
    for (; de !== 0; ) {
      for (ue(e), e.lineIndent = 0, de = e.input.charCodeAt(e.position); (!Z || e.lineIndent < ae) && de === 32; )
        e.lineIndent++, de = e.input.charCodeAt(++e.position);
      if (!Z && e.lineIndent > ae && (ae = e.lineIndent), R(de)) {
        ge++;
        continue;
      }
      if (e.lineIndent < ae) {
        V === o ? e.result += t.repeat(`
`, te ? 1 + ge : ge) : V === s && te && (e.result += `
`);
        break;
      }
      for (re ? P(de) ? (ve = !0, e.result += t.repeat(`
`, te ? 1 + ge : ge)) : ve ? (ve = !1, e.result += t.repeat(`
`, ge + 1)) : ge === 0 ? te && (e.result += " ") : e.result += t.repeat(`
`, ge) : e.result += t.repeat(`
`, te ? 1 + ge : ge), te = !0, Z = !0, ge = 0, G = e.position; !R(de) && de !== 0; )
        de = e.input.charCodeAt(++e.position);
      W(e, G, e.position, !1);
    }
    return !0;
  }
  function le(e, B) {
    var G, re = e.tag, V = e.anchor, te = [], Z, ae = !1, ge;
    if (e.firstTabInLine !== -1) return !1;
    for (e.anchor !== null && (e.anchorMap[e.anchor] = te), ge = e.input.charCodeAt(e.position); ge !== 0 && (e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, F(e, "tab characters must not be used in indentation")), !(ge !== 45 || (Z = e.input.charCodeAt(e.position + 1), !O(Z)))); ) {
      if (ae = !0, e.position++, ie(e, !0, -1) && e.lineIndent <= B) {
        te.push(null), ge = e.input.charCodeAt(e.position);
        continue;
      }
      if (G = e.line, xe(e, B, d, !1, !0), te.push(e.result), ie(e, !0, -1), ge = e.input.charCodeAt(e.position), (e.line === G || e.lineIndent > B) && ge !== 0)
        F(e, "bad indentation of a sequence entry");
      else if (e.lineIndent < B)
        break;
    }
    return ae ? (e.tag = re, e.anchor = V, e.kind = "sequence", e.result = te, !0) : !1;
  }
  function me(e, B, G) {
    var re, V, te, Z, ae, ge, ve = e.tag, Te = e.anchor, de = {}, Le = /* @__PURE__ */ Object.create(null), w = null, j = null, X = null, Y = !1, Q = !1, ee;
    if (e.firstTabInLine !== -1) return !1;
    for (e.anchor !== null && (e.anchorMap[e.anchor] = de), ee = e.input.charCodeAt(e.position); ee !== 0; ) {
      if (!Y && e.firstTabInLine !== -1 && (e.position = e.firstTabInLine, F(e, "tab characters must not be used in indentation")), re = e.input.charCodeAt(e.position + 1), te = e.line, (ee === 63 || ee === 58) && O(re))
        ee === 63 ? (Y && (ce(e, de, Le, w, j, null, Z, ae, ge), w = j = X = null), Q = !0, Y = !0, V = !0) : Y ? (Y = !1, V = !0) : F(e, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), e.position += 1, ee = re;
      else {
        if (Z = e.line, ae = e.lineStart, ge = e.position, !xe(e, G, a, !1, !0))
          break;
        if (e.line === te) {
          for (ee = e.input.charCodeAt(e.position); P(ee); )
            ee = e.input.charCodeAt(++e.position);
          if (ee === 58)
            ee = e.input.charCodeAt(++e.position), O(ee) || F(e, "a whitespace character is expected after the key-value separator within a block mapping"), Y && (ce(e, de, Le, w, j, null, Z, ae, ge), w = j = X = null), Q = !0, Y = !1, V = !1, w = e.tag, j = e.result;
          else if (Q)
            F(e, "can not read an implicit mapping pair; a colon is missed");
          else
            return e.tag = ve, e.anchor = Te, !0;
        } else if (Q)
          F(e, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return e.tag = ve, e.anchor = Te, !0;
      }
      if ((e.line === te || e.lineIndent > B) && (Y && (Z = e.line, ae = e.lineStart, ge = e.position), xe(e, B, i, !0, V) && (Y ? j = e.result : X = e.result), Y || (ce(e, de, Le, w, j, X, Z, ae, ge), w = j = X = null), ie(e, !0, -1), ee = e.input.charCodeAt(e.position)), (e.line === te || e.lineIndent > B) && ee !== 0)
        F(e, "bad indentation of a mapping entry");
      else if (e.lineIndent < B)
        break;
    }
    return Y && ce(e, de, Le, w, j, null, Z, ae, ge), Q && (e.tag = ve, e.anchor = Te, e.kind = "mapping", e.result = de), Q;
  }
  function pe(e) {
    var B, G = !1, re = !1, V, te, Z;
    if (Z = e.input.charCodeAt(e.position), Z !== 33) return !1;
    if (e.tag !== null && F(e, "duplication of a tag property"), Z = e.input.charCodeAt(++e.position), Z === 60 ? (G = !0, Z = e.input.charCodeAt(++e.position)) : Z === 33 ? (re = !0, V = "!!", Z = e.input.charCodeAt(++e.position)) : V = "!", B = e.position, G) {
      do
        Z = e.input.charCodeAt(++e.position);
      while (Z !== 0 && Z !== 62);
      e.position < e.length ? (te = e.input.slice(B, e.position), Z = e.input.charCodeAt(++e.position)) : F(e, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; Z !== 0 && !O(Z); )
        Z === 33 && (re ? F(e, "tag suffix cannot contain exclamation marks") : (V = e.input.slice(B - 1, e.position + 1), y.test(V) || F(e, "named tag handle cannot contain such characters"), re = !0, B = e.position + 1)), Z = e.input.charCodeAt(++e.position);
      te = e.input.slice(B, e.position), v.test(te) && F(e, "tag suffix cannot contain flow indicator characters");
    }
    te && !p.test(te) && F(e, "tag name cannot contain such characters: " + te);
    try {
      te = decodeURIComponent(te);
    } catch {
      F(e, "tag name is malformed: " + te);
    }
    return G ? e.tag = te : c.call(e.tagMap, V) ? e.tag = e.tagMap[V] + te : V === "!" ? e.tag = "!" + te : V === "!!" ? e.tag = "tag:yaml.org,2002:" + te : F(e, 'undeclared tag handle "' + V + '"'), !0;
  }
  function _e(e) {
    var B, G;
    if (G = e.input.charCodeAt(e.position), G !== 38) return !1;
    for (e.anchor !== null && F(e, "duplication of an anchor property"), G = e.input.charCodeAt(++e.position), B = e.position; G !== 0 && !O(G) && !M(G); )
      G = e.input.charCodeAt(++e.position);
    return e.position === B && F(e, "name of an anchor node must contain at least one character"), e.anchor = e.input.slice(B, e.position), !0;
  }
  function ye(e) {
    var B, G, re;
    if (re = e.input.charCodeAt(e.position), re !== 42) return !1;
    for (re = e.input.charCodeAt(++e.position), B = e.position; re !== 0 && !O(re) && !M(re); )
      re = e.input.charCodeAt(++e.position);
    return e.position === B && F(e, "name of an alias node must contain at least one character"), G = e.input.slice(B, e.position), c.call(e.anchorMap, G) || F(e, 'unidentified alias "' + G + '"'), e.result = e.anchorMap[G], ie(e, !0, -1), !0;
  }
  function xe(e, B, G, re, V) {
    var te, Z, ae, ge = 1, ve = !1, Te = !1, de, Le, w, j, X, Y;
    if (e.listener !== null && e.listener("open", e), e.tag = null, e.anchor = null, e.kind = null, e.result = null, te = Z = ae = i === G || d === G, re && ie(e, !0, -1) && (ve = !0, e.lineIndent > B ? ge = 1 : e.lineIndent === B ? ge = 0 : e.lineIndent < B && (ge = -1)), ge === 1)
      for (; pe(e) || _e(e); )
        ie(e, !0, -1) ? (ve = !0, ae = te, e.lineIndent > B ? ge = 1 : e.lineIndent === B ? ge = 0 : e.lineIndent < B && (ge = -1)) : ae = !1;
    if (ae && (ae = ve || V), (ge === 1 || i === G) && (l === G || a === G ? X = B : X = B + 1, Y = e.position - e.lineStart, ge === 1 ? ae && (le(e, Y) || me(e, Y, X)) || H(e, X) ? Te = !0 : (Z && I(e, X) || _(e, X) || g(e, X) ? Te = !0 : ye(e) ? (Te = !0, (e.tag !== null || e.anchor !== null) && F(e, "alias node should not have any properties")) : Ee(e, X, l === G) && (Te = !0, e.tag === null && (e.tag = "?")), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : ge === 0 && (Te = ae && le(e, Y))), e.tag === null)
      e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
    else if (e.tag === "?") {
      for (e.result !== null && e.kind !== "scalar" && F(e, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + e.kind + '"'), de = 0, Le = e.implicitTypes.length; de < Le; de += 1)
        if (j = e.implicitTypes[de], j.resolve(e.result)) {
          e.result = j.construct(e.result), e.tag = j.tag, e.anchor !== null && (e.anchorMap[e.anchor] = e.result);
          break;
        }
    } else if (e.tag !== "!") {
      if (c.call(e.typeMap[e.kind || "fallback"], e.tag))
        j = e.typeMap[e.kind || "fallback"][e.tag];
      else
        for (j = null, w = e.typeMap.multi[e.kind || "fallback"], de = 0, Le = w.length; de < Le; de += 1)
          if (e.tag.slice(0, w[de].tag.length) === w[de].tag) {
            j = w[de];
            break;
          }
      j || F(e, "unknown tag !<" + e.tag + ">"), e.result !== null && j.kind !== e.kind && F(e, "unacceptable node kind for !<" + e.tag + '> tag; it should be "' + j.kind + '", not "' + e.kind + '"'), j.resolve(e.result, e.tag) ? (e.result = j.construct(e.result, e.tag), e.anchor !== null && (e.anchorMap[e.anchor] = e.result)) : F(e, "cannot resolve a node with !<" + e.tag + "> explicit tag");
    }
    return e.listener !== null && e.listener("close", e), e.tag !== null || e.anchor !== null || Te;
  }
  function be(e) {
    var B = e.position, G, re, V, te = !1, Z;
    for (e.version = null, e.checkLineBreaks = e.legacy, e.tagMap = /* @__PURE__ */ Object.create(null), e.anchorMap = /* @__PURE__ */ Object.create(null); (Z = e.input.charCodeAt(e.position)) !== 0 && (ie(e, !0, -1), Z = e.input.charCodeAt(e.position), !(e.lineIndent > 0 || Z !== 37)); ) {
      for (te = !0, Z = e.input.charCodeAt(++e.position), G = e.position; Z !== 0 && !O(Z); )
        Z = e.input.charCodeAt(++e.position);
      for (re = e.input.slice(G, e.position), V = [], re.length < 1 && F(e, "directive name must not be less than one character in length"); Z !== 0; ) {
        for (; P(Z); )
          Z = e.input.charCodeAt(++e.position);
        if (Z === 35) {
          do
            Z = e.input.charCodeAt(++e.position);
          while (Z !== 0 && !R(Z));
          break;
        }
        if (R(Z)) break;
        for (G = e.position; Z !== 0 && !O(Z); )
          Z = e.input.charCodeAt(++e.position);
        V.push(e.input.slice(G, e.position));
      }
      Z !== 0 && ue(e), c.call(J, re) ? J[re](e, re, V) : $(e, 'unknown document directive "' + re + '"');
    }
    if (ie(e, !0, -1), e.lineIndent === 0 && e.input.charCodeAt(e.position) === 45 && e.input.charCodeAt(e.position + 1) === 45 && e.input.charCodeAt(e.position + 2) === 45 ? (e.position += 3, ie(e, !0, -1)) : te && F(e, "directives end mark is expected"), xe(e, e.lineIndent - 1, i, !1, !0), ie(e, !0, -1), e.checkLineBreaks && m.test(e.input.slice(B, e.position)) && $(e, "non-ASCII line breaks are interpreted as content"), e.documents.push(e.result), e.position === e.lineStart && Ae(e)) {
      e.input.charCodeAt(e.position) === 46 && (e.position += 3, ie(e, !0, -1));
      return;
    }
    if (e.position < e.length - 1)
      F(e, "end of the stream or a document separator is expected");
    else
      return;
  }
  function qe(e, B) {
    e = String(e), B = B || {}, e.length !== 0 && (e.charCodeAt(e.length - 1) !== 10 && e.charCodeAt(e.length - 1) !== 13 && (e += `
`), e.charCodeAt(0) === 65279 && (e = e.slice(1)));
    var G = new N(e, B), re = e.indexOf("\0");
    for (re !== -1 && (G.position = re, F(G, "null byte is not allowed in input")), G.input += "\0"; G.input.charCodeAt(G.position) === 32; )
      G.lineIndent += 1, G.position += 1;
    for (; G.position < G.length - 1; )
      be(G);
    return G.documents;
  }
  function Et(e, B, G) {
    B !== null && typeof B == "object" && typeof G > "u" && (G = B, B = null);
    var re = qe(e, G);
    if (typeof B != "function")
      return re;
    for (var V = 0, te = re.length; V < te; V += 1)
      B(re[V]);
  }
  function at(e, B) {
    var G = qe(e, B);
    if (G.length !== 0) {
      if (G.length === 1)
        return G[0];
      throw new f("expected a single document in the stream, but found more");
    }
  }
  return Ur.loadAll = Et, Ur.load = at, Ur;
}
var ii = {}, Jo;
function Xc() {
  if (Jo) return ii;
  Jo = 1;
  var t = Er(), f = yr(), h = aa(), u = Object.prototype.toString, c = Object.prototype.hasOwnProperty, l = 65279, a = 9, d = 10, i = 13, s = 32, r = 33, o = 34, n = 35, m = 37, v = 38, y = 39, p = 42, A = 44, R = 45, P = 58, O = 61, M = 62, C = 63, S = 64, T = 91, E = 93, q = 96, U = 123, L = 124, k = 125, N = {};
  N[0] = "\\0", N[7] = "\\a", N[8] = "\\b", N[9] = "\\t", N[10] = "\\n", N[11] = "\\v", N[12] = "\\f", N[13] = "\\r", N[27] = "\\e", N[34] = '\\"', N[92] = "\\\\", N[133] = "\\N", N[160] = "\\_", N[8232] = "\\L", N[8233] = "\\P";
  var D = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ], F = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function $(w, j) {
    var X, Y, Q, ee, fe, oe, he;
    if (j === null) return {};
    for (X = {}, Y = Object.keys(j), Q = 0, ee = Y.length; Q < ee; Q += 1)
      fe = Y[Q], oe = String(j[fe]), fe.slice(0, 2) === "!!" && (fe = "tag:yaml.org,2002:" + fe.slice(2)), he = w.compiledTypeMap.fallback[fe], he && c.call(he.styleAliases, oe) && (oe = he.styleAliases[oe]), X[fe] = oe;
    return X;
  }
  function J(w) {
    var j, X, Y;
    if (j = w.toString(16).toUpperCase(), w <= 255)
      X = "x", Y = 2;
    else if (w <= 65535)
      X = "u", Y = 4;
    else if (w <= 4294967295)
      X = "U", Y = 8;
    else
      throw new f("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + X + t.repeat("0", Y - j.length) + j;
  }
  var W = 1, ne = 2;
  function ce(w) {
    this.schema = w.schema || h, this.indent = Math.max(1, w.indent || 2), this.noArrayIndent = w.noArrayIndent || !1, this.skipInvalid = w.skipInvalid || !1, this.flowLevel = t.isNothing(w.flowLevel) ? -1 : w.flowLevel, this.styleMap = $(this.schema, w.styles || null), this.sortKeys = w.sortKeys || !1, this.lineWidth = w.lineWidth || 80, this.noRefs = w.noRefs || !1, this.noCompatMode = w.noCompatMode || !1, this.condenseFlow = w.condenseFlow || !1, this.quotingType = w.quotingType === '"' ? ne : W, this.forceQuotes = w.forceQuotes || !1, this.replacer = typeof w.replacer == "function" ? w.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function ue(w, j) {
    for (var X = t.repeat(" ", j), Y = 0, Q = -1, ee = "", fe, oe = w.length; Y < oe; )
      Q = w.indexOf(`
`, Y), Q === -1 ? (fe = w.slice(Y), Y = oe) : (fe = w.slice(Y, Q + 1), Y = Q + 1), fe.length && fe !== `
` && (ee += X), ee += fe;
    return ee;
  }
  function ie(w, j) {
    return `
` + t.repeat(" ", w.indent * j);
  }
  function Ae(w, j) {
    var X, Y, Q;
    for (X = 0, Y = w.implicitTypes.length; X < Y; X += 1)
      if (Q = w.implicitTypes[X], Q.resolve(j))
        return !0;
    return !1;
  }
  function K(w) {
    return w === s || w === a;
  }
  function Ee(w) {
    return 32 <= w && w <= 126 || 161 <= w && w <= 55295 && w !== 8232 && w !== 8233 || 57344 <= w && w <= 65533 && w !== l || 65536 <= w && w <= 1114111;
  }
  function _(w) {
    return Ee(w) && w !== l && w !== i && w !== d;
  }
  function g(w, j, X) {
    var Y = _(w), Q = Y && !K(w);
    return (
      // ns-plain-safe
      (X ? (
        // c = flow-in
        Y
      ) : Y && w !== A && w !== T && w !== E && w !== U && w !== k) && w !== n && !(j === P && !Q) || _(j) && !K(j) && w === n || j === P && Q
    );
  }
  function H(w) {
    return Ee(w) && w !== l && !K(w) && w !== R && w !== C && w !== P && w !== A && w !== T && w !== E && w !== U && w !== k && w !== n && w !== v && w !== p && w !== r && w !== L && w !== O && w !== M && w !== y && w !== o && w !== m && w !== S && w !== q;
  }
  function I(w) {
    return !K(w) && w !== P;
  }
  function le(w, j) {
    var X = w.charCodeAt(j), Y;
    return X >= 55296 && X <= 56319 && j + 1 < w.length && (Y = w.charCodeAt(j + 1), Y >= 56320 && Y <= 57343) ? (X - 55296) * 1024 + Y - 56320 + 65536 : X;
  }
  function me(w) {
    var j = /^\n* /;
    return j.test(w);
  }
  var pe = 1, _e = 2, ye = 3, xe = 4, be = 5;
  function qe(w, j, X, Y, Q, ee, fe, oe) {
    var he, we = 0, Pe = null, Ne = !1, Ce = !1, Ft = Y !== -1, Je = -1, yt = H(le(w, 0)) && I(le(w, w.length - 1));
    if (j || fe)
      for (he = 0; he < w.length; we >= 65536 ? he += 2 : he++) {
        if (we = le(w, he), !Ee(we))
          return be;
        yt = yt && g(we, Pe, oe), Pe = we;
      }
    else {
      for (he = 0; he < w.length; we >= 65536 ? he += 2 : he++) {
        if (we = le(w, he), we === d)
          Ne = !0, Ft && (Ce = Ce || // Foldable line = too long, and not more-indented.
          he - Je - 1 > Y && w[Je + 1] !== " ", Je = he);
        else if (!Ee(we))
          return be;
        yt = yt && g(we, Pe, oe), Pe = we;
      }
      Ce = Ce || Ft && he - Je - 1 > Y && w[Je + 1] !== " ";
    }
    return !Ne && !Ce ? yt && !fe && !Q(w) ? pe : ee === ne ? be : _e : X > 9 && me(w) ? be : fe ? ee === ne ? be : _e : Ce ? xe : ye;
  }
  function Et(w, j, X, Y, Q) {
    w.dump = (function() {
      if (j.length === 0)
        return w.quotingType === ne ? '""' : "''";
      if (!w.noCompatMode && (D.indexOf(j) !== -1 || F.test(j)))
        return w.quotingType === ne ? '"' + j + '"' : "'" + j + "'";
      var ee = w.indent * Math.max(1, X), fe = w.lineWidth === -1 ? -1 : Math.max(Math.min(w.lineWidth, 40), w.lineWidth - ee), oe = Y || w.flowLevel > -1 && X >= w.flowLevel;
      function he(we) {
        return Ae(w, we);
      }
      switch (qe(
        j,
        oe,
        w.indent,
        fe,
        he,
        w.quotingType,
        w.forceQuotes && !Y,
        Q
      )) {
        case pe:
          return j;
        case _e:
          return "'" + j.replace(/'/g, "''") + "'";
        case ye:
          return "|" + at(j, w.indent) + e(ue(j, ee));
        case xe:
          return ">" + at(j, w.indent) + e(ue(B(j, fe), ee));
        case be:
          return '"' + re(j) + '"';
        default:
          throw new f("impossible error: invalid scalar style");
      }
    })();
  }
  function at(w, j) {
    var X = me(w) ? String(j) : "", Y = w[w.length - 1] === `
`, Q = Y && (w[w.length - 2] === `
` || w === `
`), ee = Q ? "+" : Y ? "" : "-";
    return X + ee + `
`;
  }
  function e(w) {
    return w[w.length - 1] === `
` ? w.slice(0, -1) : w;
  }
  function B(w, j) {
    for (var X = /(\n+)([^\n]*)/g, Y = (function() {
      var we = w.indexOf(`
`);
      return we = we !== -1 ? we : w.length, X.lastIndex = we, G(w.slice(0, we), j);
    })(), Q = w[0] === `
` || w[0] === " ", ee, fe; fe = X.exec(w); ) {
      var oe = fe[1], he = fe[2];
      ee = he[0] === " ", Y += oe + (!Q && !ee && he !== "" ? `
` : "") + G(he, j), Q = ee;
    }
    return Y;
  }
  function G(w, j) {
    if (w === "" || w[0] === " ") return w;
    for (var X = / [^ ]/g, Y, Q = 0, ee, fe = 0, oe = 0, he = ""; Y = X.exec(w); )
      oe = Y.index, oe - Q > j && (ee = fe > Q ? fe : oe, he += `
` + w.slice(Q, ee), Q = ee + 1), fe = oe;
    return he += `
`, w.length - Q > j && fe > Q ? he += w.slice(Q, fe) + `
` + w.slice(fe + 1) : he += w.slice(Q), he.slice(1);
  }
  function re(w) {
    for (var j = "", X = 0, Y, Q = 0; Q < w.length; X >= 65536 ? Q += 2 : Q++)
      X = le(w, Q), Y = N[X], !Y && Ee(X) ? (j += w[Q], X >= 65536 && (j += w[Q + 1])) : j += Y || J(X);
    return j;
  }
  function V(w, j, X) {
    var Y = "", Q = w.tag, ee, fe, oe;
    for (ee = 0, fe = X.length; ee < fe; ee += 1)
      oe = X[ee], w.replacer && (oe = w.replacer.call(X, String(ee), oe)), (ve(w, j, oe, !1, !1) || typeof oe > "u" && ve(w, j, null, !1, !1)) && (Y !== "" && (Y += "," + (w.condenseFlow ? "" : " ")), Y += w.dump);
    w.tag = Q, w.dump = "[" + Y + "]";
  }
  function te(w, j, X, Y) {
    var Q = "", ee = w.tag, fe, oe, he;
    for (fe = 0, oe = X.length; fe < oe; fe += 1)
      he = X[fe], w.replacer && (he = w.replacer.call(X, String(fe), he)), (ve(w, j + 1, he, !0, !0, !1, !0) || typeof he > "u" && ve(w, j + 1, null, !0, !0, !1, !0)) && ((!Y || Q !== "") && (Q += ie(w, j)), w.dump && d === w.dump.charCodeAt(0) ? Q += "-" : Q += "- ", Q += w.dump);
    w.tag = ee, w.dump = Q || "[]";
  }
  function Z(w, j, X) {
    var Y = "", Q = w.tag, ee = Object.keys(X), fe, oe, he, we, Pe;
    for (fe = 0, oe = ee.length; fe < oe; fe += 1)
      Pe = "", Y !== "" && (Pe += ", "), w.condenseFlow && (Pe += '"'), he = ee[fe], we = X[he], w.replacer && (we = w.replacer.call(X, he, we)), ve(w, j, he, !1, !1) && (w.dump.length > 1024 && (Pe += "? "), Pe += w.dump + (w.condenseFlow ? '"' : "") + ":" + (w.condenseFlow ? "" : " "), ve(w, j, we, !1, !1) && (Pe += w.dump, Y += Pe));
    w.tag = Q, w.dump = "{" + Y + "}";
  }
  function ae(w, j, X, Y) {
    var Q = "", ee = w.tag, fe = Object.keys(X), oe, he, we, Pe, Ne, Ce;
    if (w.sortKeys === !0)
      fe.sort();
    else if (typeof w.sortKeys == "function")
      fe.sort(w.sortKeys);
    else if (w.sortKeys)
      throw new f("sortKeys must be a boolean or a function");
    for (oe = 0, he = fe.length; oe < he; oe += 1)
      Ce = "", (!Y || Q !== "") && (Ce += ie(w, j)), we = fe[oe], Pe = X[we], w.replacer && (Pe = w.replacer.call(X, we, Pe)), ve(w, j + 1, we, !0, !0, !0) && (Ne = w.tag !== null && w.tag !== "?" || w.dump && w.dump.length > 1024, Ne && (w.dump && d === w.dump.charCodeAt(0) ? Ce += "?" : Ce += "? "), Ce += w.dump, Ne && (Ce += ie(w, j)), ve(w, j + 1, Pe, !0, Ne) && (w.dump && d === w.dump.charCodeAt(0) ? Ce += ":" : Ce += ": ", Ce += w.dump, Q += Ce));
    w.tag = ee, w.dump = Q || "{}";
  }
  function ge(w, j, X) {
    var Y, Q, ee, fe, oe, he;
    for (Q = X ? w.explicitTypes : w.implicitTypes, ee = 0, fe = Q.length; ee < fe; ee += 1)
      if (oe = Q[ee], (oe.instanceOf || oe.predicate) && (!oe.instanceOf || typeof j == "object" && j instanceof oe.instanceOf) && (!oe.predicate || oe.predicate(j))) {
        if (X ? oe.multi && oe.representName ? w.tag = oe.representName(j) : w.tag = oe.tag : w.tag = "?", oe.represent) {
          if (he = w.styleMap[oe.tag] || oe.defaultStyle, u.call(oe.represent) === "[object Function]")
            Y = oe.represent(j, he);
          else if (c.call(oe.represent, he))
            Y = oe.represent[he](j, he);
          else
            throw new f("!<" + oe.tag + '> tag resolver accepts not "' + he + '" style');
          w.dump = Y;
        }
        return !0;
      }
    return !1;
  }
  function ve(w, j, X, Y, Q, ee, fe) {
    w.tag = null, w.dump = X, ge(w, X, !1) || ge(w, X, !0);
    var oe = u.call(w.dump), he = Y, we;
    Y && (Y = w.flowLevel < 0 || w.flowLevel > j);
    var Pe = oe === "[object Object]" || oe === "[object Array]", Ne, Ce;
    if (Pe && (Ne = w.duplicates.indexOf(X), Ce = Ne !== -1), (w.tag !== null && w.tag !== "?" || Ce || w.indent !== 2 && j > 0) && (Q = !1), Ce && w.usedDuplicates[Ne])
      w.dump = "*ref_" + Ne;
    else {
      if (Pe && Ce && !w.usedDuplicates[Ne] && (w.usedDuplicates[Ne] = !0), oe === "[object Object]")
        Y && Object.keys(w.dump).length !== 0 ? (ae(w, j, w.dump, Q), Ce && (w.dump = "&ref_" + Ne + w.dump)) : (Z(w, j, w.dump), Ce && (w.dump = "&ref_" + Ne + " " + w.dump));
      else if (oe === "[object Array]")
        Y && w.dump.length !== 0 ? (w.noArrayIndent && !fe && j > 0 ? te(w, j - 1, w.dump, Q) : te(w, j, w.dump, Q), Ce && (w.dump = "&ref_" + Ne + w.dump)) : (V(w, j, w.dump), Ce && (w.dump = "&ref_" + Ne + " " + w.dump));
      else if (oe === "[object String]")
        w.tag !== "?" && Et(w, w.dump, j, ee, he);
      else {
        if (oe === "[object Undefined]")
          return !1;
        if (w.skipInvalid) return !1;
        throw new f("unacceptable kind of an object to dump " + oe);
      }
      w.tag !== null && w.tag !== "?" && (we = encodeURI(
        w.tag[0] === "!" ? w.tag.slice(1) : w.tag
      ).replace(/!/g, "%21"), w.tag[0] === "!" ? we = "!" + we : we.slice(0, 18) === "tag:yaml.org,2002:" ? we = "!!" + we.slice(18) : we = "!<" + we + ">", w.dump = we + " " + w.dump);
    }
    return !0;
  }
  function Te(w, j) {
    var X = [], Y = [], Q, ee;
    for (de(w, X, Y), Q = 0, ee = Y.length; Q < ee; Q += 1)
      j.duplicates.push(X[Y[Q]]);
    j.usedDuplicates = new Array(ee);
  }
  function de(w, j, X) {
    var Y, Q, ee;
    if (w !== null && typeof w == "object")
      if (Q = j.indexOf(w), Q !== -1)
        X.indexOf(Q) === -1 && X.push(Q);
      else if (j.push(w), Array.isArray(w))
        for (Q = 0, ee = w.length; Q < ee; Q += 1)
          de(w[Q], j, X);
      else
        for (Y = Object.keys(w), Q = 0, ee = Y.length; Q < ee; Q += 1)
          de(w[Y[Q]], j, X);
  }
  function Le(w, j) {
    j = j || {};
    var X = new ce(j);
    X.noRefs || Te(w, X);
    var Y = w;
    return X.replacer && (Y = X.replacer.call({ "": Y }, "", Y)), ve(X, 0, Y, !0, !0) ? X.dump + `
` : "";
  }
  return ii.dump = Le, ii;
}
var Qo;
function oa() {
  if (Qo) return He;
  Qo = 1;
  var t = zc(), f = Xc();
  function h(u, c) {
    return function() {
      throw new Error("Function yaml." + u + " is removed in js-yaml 4. Use yaml." + c + " instead, which is now safe by default.");
    };
  }
  return He.Type = je(), He.Schema = $l(), He.FAILSAFE_SCHEMA = Bl(), He.JSON_SCHEMA = Vl(), He.CORE_SCHEMA = Yl(), He.DEFAULT_SCHEMA = aa(), He.load = t.load, He.loadAll = t.loadAll, He.dump = f.dump, He.YAMLException = yr(), He.types = {
    binary: Kl(),
    float: Wl(),
    map: Ml(),
    null: Hl(),
    pairs: Ql(),
    set: Zl(),
    timestamp: zl(),
    bool: jl(),
    int: Gl(),
    merge: Xl(),
    omap: Jl(),
    seq: ql(),
    str: kl()
  }, He.safeLoad = h("safeLoad", "load"), He.safeLoadAll = h("safeLoadAll", "loadAll"), He.safeDump = h("safeDump", "dump"), He;
}
var Kt = {}, Zo;
function Kc() {
  if (Zo) return Kt;
  Zo = 1, Object.defineProperty(Kt, "__esModule", { value: !0 }), Kt.Lazy = void 0;
  class t {
    constructor(h) {
      this._value = null, this.creator = h;
    }
    get hasValue() {
      return this.creator == null;
    }
    get value() {
      if (this.creator == null)
        return this._value;
      const h = this.creator();
      return this.value = h, h;
    }
    set value(h) {
      this._value = h, this.creator = null;
    }
  }
  return Kt.Lazy = t, Kt;
}
var $r = { exports: {} }, ai, es;
function Wr() {
  if (es) return ai;
  es = 1;
  const t = "2.0.0", f = 256, h = Number.MAX_SAFE_INTEGER || /* istanbul ignore next */
  9007199254740991, u = 16, c = f - 6;
  return ai = {
    MAX_LENGTH: f,
    MAX_SAFE_COMPONENT_LENGTH: u,
    MAX_SAFE_BUILD_LENGTH: c,
    MAX_SAFE_INTEGER: h,
    RELEASE_TYPES: [
      "major",
      "premajor",
      "minor",
      "preminor",
      "patch",
      "prepatch",
      "prerelease"
    ],
    SEMVER_SPEC_VERSION: t,
    FLAG_INCLUDE_PRERELEASE: 1,
    FLAG_LOOSE: 2
  }, ai;
}
var oi, ts;
function Vr() {
  return ts || (ts = 1, oi = typeof process == "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...f) => console.error("SEMVER", ...f) : () => {
  }), oi;
}
var rs;
function wr() {
  return rs || (rs = 1, (function(t, f) {
    const {
      MAX_SAFE_COMPONENT_LENGTH: h,
      MAX_SAFE_BUILD_LENGTH: u,
      MAX_LENGTH: c
    } = Wr(), l = Vr();
    f = t.exports = {};
    const a = f.re = [], d = f.safeRe = [], i = f.src = [], s = f.safeSrc = [], r = f.t = {};
    let o = 0;
    const n = "[a-zA-Z0-9-]", m = [
      ["\\s", 1],
      ["\\d", c],
      [n, u]
    ], v = (p) => {
      for (const [A, R] of m)
        p = p.split(`${A}*`).join(`${A}{0,${R}}`).split(`${A}+`).join(`${A}{1,${R}}`);
      return p;
    }, y = (p, A, R) => {
      const P = v(A), O = o++;
      l(p, O, A), r[p] = O, i[O] = A, s[O] = P, a[O] = new RegExp(A, R ? "g" : void 0), d[O] = new RegExp(P, R ? "g" : void 0);
    };
    y("NUMERICIDENTIFIER", "0|[1-9]\\d*"), y("NUMERICIDENTIFIERLOOSE", "\\d+"), y("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${n}*`), y("MAINVERSION", `(${i[r.NUMERICIDENTIFIER]})\\.(${i[r.NUMERICIDENTIFIER]})\\.(${i[r.NUMERICIDENTIFIER]})`), y("MAINVERSIONLOOSE", `(${i[r.NUMERICIDENTIFIERLOOSE]})\\.(${i[r.NUMERICIDENTIFIERLOOSE]})\\.(${i[r.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASEIDENTIFIER", `(?:${i[r.NONNUMERICIDENTIFIER]}|${i[r.NUMERICIDENTIFIER]})`), y("PRERELEASEIDENTIFIERLOOSE", `(?:${i[r.NONNUMERICIDENTIFIER]}|${i[r.NUMERICIDENTIFIERLOOSE]})`), y("PRERELEASE", `(?:-(${i[r.PRERELEASEIDENTIFIER]}(?:\\.${i[r.PRERELEASEIDENTIFIER]})*))`), y("PRERELEASELOOSE", `(?:-?(${i[r.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${i[r.PRERELEASEIDENTIFIERLOOSE]})*))`), y("BUILDIDENTIFIER", `${n}+`), y("BUILD", `(?:\\+(${i[r.BUILDIDENTIFIER]}(?:\\.${i[r.BUILDIDENTIFIER]})*))`), y("FULLPLAIN", `v?${i[r.MAINVERSION]}${i[r.PRERELEASE]}?${i[r.BUILD]}?`), y("FULL", `^${i[r.FULLPLAIN]}$`), y("LOOSEPLAIN", `[v=\\s]*${i[r.MAINVERSIONLOOSE]}${i[r.PRERELEASELOOSE]}?${i[r.BUILD]}?`), y("LOOSE", `^${i[r.LOOSEPLAIN]}$`), y("GTLT", "((?:<|>)?=?)"), y("XRANGEIDENTIFIERLOOSE", `${i[r.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`), y("XRANGEIDENTIFIER", `${i[r.NUMERICIDENTIFIER]}|x|X|\\*`), y("XRANGEPLAIN", `[v=\\s]*(${i[r.XRANGEIDENTIFIER]})(?:\\.(${i[r.XRANGEIDENTIFIER]})(?:\\.(${i[r.XRANGEIDENTIFIER]})(?:${i[r.PRERELEASE]})?${i[r.BUILD]}?)?)?`), y("XRANGEPLAINLOOSE", `[v=\\s]*(${i[r.XRANGEIDENTIFIERLOOSE]})(?:\\.(${i[r.XRANGEIDENTIFIERLOOSE]})(?:\\.(${i[r.XRANGEIDENTIFIERLOOSE]})(?:${i[r.PRERELEASELOOSE]})?${i[r.BUILD]}?)?)?`), y("XRANGE", `^${i[r.GTLT]}\\s*${i[r.XRANGEPLAIN]}$`), y("XRANGELOOSE", `^${i[r.GTLT]}\\s*${i[r.XRANGEPLAINLOOSE]}$`), y("COERCEPLAIN", `(^|[^\\d])(\\d{1,${h}})(?:\\.(\\d{1,${h}}))?(?:\\.(\\d{1,${h}}))?`), y("COERCE", `${i[r.COERCEPLAIN]}(?:$|[^\\d])`), y("COERCEFULL", i[r.COERCEPLAIN] + `(?:${i[r.PRERELEASE]})?(?:${i[r.BUILD]})?(?:$|[^\\d])`), y("COERCERTL", i[r.COERCE], !0), y("COERCERTLFULL", i[r.COERCEFULL], !0), y("LONETILDE", "(?:~>?)"), y("TILDETRIM", `(\\s*)${i[r.LONETILDE]}\\s+`, !0), f.tildeTrimReplace = "$1~", y("TILDE", `^${i[r.LONETILDE]}${i[r.XRANGEPLAIN]}$`), y("TILDELOOSE", `^${i[r.LONETILDE]}${i[r.XRANGEPLAINLOOSE]}$`), y("LONECARET", "(?:\\^)"), y("CARETTRIM", `(\\s*)${i[r.LONECARET]}\\s+`, !0), f.caretTrimReplace = "$1^", y("CARET", `^${i[r.LONECARET]}${i[r.XRANGEPLAIN]}$`), y("CARETLOOSE", `^${i[r.LONECARET]}${i[r.XRANGEPLAINLOOSE]}$`), y("COMPARATORLOOSE", `^${i[r.GTLT]}\\s*(${i[r.LOOSEPLAIN]})$|^$`), y("COMPARATOR", `^${i[r.GTLT]}\\s*(${i[r.FULLPLAIN]})$|^$`), y("COMPARATORTRIM", `(\\s*)${i[r.GTLT]}\\s*(${i[r.LOOSEPLAIN]}|${i[r.XRANGEPLAIN]})`, !0), f.comparatorTrimReplace = "$1$2$3", y("HYPHENRANGE", `^\\s*(${i[r.XRANGEPLAIN]})\\s+-\\s+(${i[r.XRANGEPLAIN]})\\s*$`), y("HYPHENRANGELOOSE", `^\\s*(${i[r.XRANGEPLAINLOOSE]})\\s+-\\s+(${i[r.XRANGEPLAINLOOSE]})\\s*$`), y("STAR", "(<|>)?=?\\s*\\*"), y("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$"), y("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
  })($r, $r.exports)), $r.exports;
}
var si, ns;
function sa() {
  if (ns) return si;
  ns = 1;
  const t = Object.freeze({ loose: !0 }), f = Object.freeze({});
  return si = (u) => u ? typeof u != "object" ? t : u : f, si;
}
var li, is;
function eu() {
  if (is) return li;
  is = 1;
  const t = /^[0-9]+$/, f = (u, c) => {
    if (typeof u == "number" && typeof c == "number")
      return u === c ? 0 : u < c ? -1 : 1;
    const l = t.test(u), a = t.test(c);
    return l && a && (u = +u, c = +c), u === c ? 0 : l && !a ? -1 : a && !l ? 1 : u < c ? -1 : 1;
  };
  return li = {
    compareIdentifiers: f,
    rcompareIdentifiers: (u, c) => f(c, u)
  }, li;
}
var ui, as;
function Ge() {
  if (as) return ui;
  as = 1;
  const t = Vr(), { MAX_LENGTH: f, MAX_SAFE_INTEGER: h } = Wr(), { safeRe: u, t: c } = wr(), l = sa(), { compareIdentifiers: a } = eu();
  class d {
    constructor(s, r) {
      if (r = l(r), s instanceof d) {
        if (s.loose === !!r.loose && s.includePrerelease === !!r.includePrerelease)
          return s;
        s = s.version;
      } else if (typeof s != "string")
        throw new TypeError(`Invalid version. Must be a string. Got type "${typeof s}".`);
      if (s.length > f)
        throw new TypeError(
          `version is longer than ${f} characters`
        );
      t("SemVer", s, r), this.options = r, this.loose = !!r.loose, this.includePrerelease = !!r.includePrerelease;
      const o = s.trim().match(r.loose ? u[c.LOOSE] : u[c.FULL]);
      if (!o)
        throw new TypeError(`Invalid Version: ${s}`);
      if (this.raw = s, this.major = +o[1], this.minor = +o[2], this.patch = +o[3], this.major > h || this.major < 0)
        throw new TypeError("Invalid major version");
      if (this.minor > h || this.minor < 0)
        throw new TypeError("Invalid minor version");
      if (this.patch > h || this.patch < 0)
        throw new TypeError("Invalid patch version");
      o[4] ? this.prerelease = o[4].split(".").map((n) => {
        if (/^[0-9]+$/.test(n)) {
          const m = +n;
          if (m >= 0 && m < h)
            return m;
        }
        return n;
      }) : this.prerelease = [], this.build = o[5] ? o[5].split(".") : [], this.format();
    }
    format() {
      return this.version = `${this.major}.${this.minor}.${this.patch}`, this.prerelease.length && (this.version += `-${this.prerelease.join(".")}`), this.version;
    }
    toString() {
      return this.version;
    }
    compare(s) {
      if (t("SemVer.compare", this.version, this.options, s), !(s instanceof d)) {
        if (typeof s == "string" && s === this.version)
          return 0;
        s = new d(s, this.options);
      }
      return s.version === this.version ? 0 : this.compareMain(s) || this.comparePre(s);
    }
    compareMain(s) {
      return s instanceof d || (s = new d(s, this.options)), this.major < s.major ? -1 : this.major > s.major ? 1 : this.minor < s.minor ? -1 : this.minor > s.minor ? 1 : this.patch < s.patch ? -1 : this.patch > s.patch ? 1 : 0;
    }
    comparePre(s) {
      if (s instanceof d || (s = new d(s, this.options)), this.prerelease.length && !s.prerelease.length)
        return -1;
      if (!this.prerelease.length && s.prerelease.length)
        return 1;
      if (!this.prerelease.length && !s.prerelease.length)
        return 0;
      let r = 0;
      do {
        const o = this.prerelease[r], n = s.prerelease[r];
        if (t("prerelease compare", r, o, n), o === void 0 && n === void 0)
          return 0;
        if (n === void 0)
          return 1;
        if (o === void 0)
          return -1;
        if (o === n)
          continue;
        return a(o, n);
      } while (++r);
    }
    compareBuild(s) {
      s instanceof d || (s = new d(s, this.options));
      let r = 0;
      do {
        const o = this.build[r], n = s.build[r];
        if (t("build compare", r, o, n), o === void 0 && n === void 0)
          return 0;
        if (n === void 0)
          return 1;
        if (o === void 0)
          return -1;
        if (o === n)
          continue;
        return a(o, n);
      } while (++r);
    }
    // preminor will bump the version up to the next minor release, and immediately
    // down to pre-release. premajor and prepatch work the same way.
    inc(s, r, o) {
      if (s.startsWith("pre")) {
        if (!r && o === !1)
          throw new Error("invalid increment argument: identifier is empty");
        if (r) {
          const n = `-${r}`.match(this.options.loose ? u[c.PRERELEASELOOSE] : u[c.PRERELEASE]);
          if (!n || n[1] !== r)
            throw new Error(`invalid identifier: ${r}`);
        }
      }
      switch (s) {
        case "premajor":
          this.prerelease.length = 0, this.patch = 0, this.minor = 0, this.major++, this.inc("pre", r, o);
          break;
        case "preminor":
          this.prerelease.length = 0, this.patch = 0, this.minor++, this.inc("pre", r, o);
          break;
        case "prepatch":
          this.prerelease.length = 0, this.inc("patch", r, o), this.inc("pre", r, o);
          break;
        // If the input is a non-prerelease version, this acts the same as
        // prepatch.
        case "prerelease":
          this.prerelease.length === 0 && this.inc("patch", r, o), this.inc("pre", r, o);
          break;
        case "release":
          if (this.prerelease.length === 0)
            throw new Error(`version ${this.raw} is not a prerelease`);
          this.prerelease.length = 0;
          break;
        case "major":
          (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) && this.major++, this.minor = 0, this.patch = 0, this.prerelease = [];
          break;
        case "minor":
          (this.patch !== 0 || this.prerelease.length === 0) && this.minor++, this.patch = 0, this.prerelease = [];
          break;
        case "patch":
          this.prerelease.length === 0 && this.patch++, this.prerelease = [];
          break;
        // This probably shouldn't be used publicly.
        // 1.0.0 'pre' would become 1.0.0-0 which is the wrong direction.
        case "pre": {
          const n = Number(o) ? 1 : 0;
          if (this.prerelease.length === 0)
            this.prerelease = [n];
          else {
            let m = this.prerelease.length;
            for (; --m >= 0; )
              typeof this.prerelease[m] == "number" && (this.prerelease[m]++, m = -2);
            if (m === -1) {
              if (r === this.prerelease.join(".") && o === !1)
                throw new Error("invalid increment argument: identifier already exists");
              this.prerelease.push(n);
            }
          }
          if (r) {
            let m = [r, n];
            o === !1 && (m = [r]), a(this.prerelease[0], r) === 0 ? isNaN(this.prerelease[1]) && (this.prerelease = m) : this.prerelease = m;
          }
          break;
        }
        default:
          throw new Error(`invalid increment argument: ${s}`);
      }
      return this.raw = this.format(), this.build.length && (this.raw += `+${this.build.join(".")}`), this;
    }
  }
  return ui = d, ui;
}
var ci, os;
function Ht() {
  if (os) return ci;
  os = 1;
  const t = Ge();
  return ci = (h, u, c = !1) => {
    if (h instanceof t)
      return h;
    try {
      return new t(h, u);
    } catch (l) {
      if (!c)
        return null;
      throw l;
    }
  }, ci;
}
var fi, ss;
function Jc() {
  if (ss) return fi;
  ss = 1;
  const t = Ht();
  return fi = (h, u) => {
    const c = t(h, u);
    return c ? c.version : null;
  }, fi;
}
var di, ls;
function Qc() {
  if (ls) return di;
  ls = 1;
  const t = Ht();
  return di = (h, u) => {
    const c = t(h.trim().replace(/^[=v]+/, ""), u);
    return c ? c.version : null;
  }, di;
}
var hi, us;
function Zc() {
  if (us) return hi;
  us = 1;
  const t = Ge();
  return hi = (h, u, c, l, a) => {
    typeof c == "string" && (a = l, l = c, c = void 0);
    try {
      return new t(
        h instanceof t ? h.version : h,
        c
      ).inc(u, l, a).version;
    } catch {
      return null;
    }
  }, hi;
}
var pi, cs;
function ef() {
  if (cs) return pi;
  cs = 1;
  const t = Ht();
  return pi = (h, u) => {
    const c = t(h, null, !0), l = t(u, null, !0), a = c.compare(l);
    if (a === 0)
      return null;
    const d = a > 0, i = d ? c : l, s = d ? l : c, r = !!i.prerelease.length;
    if (!!s.prerelease.length && !r) {
      if (!s.patch && !s.minor)
        return "major";
      if (s.compareMain(i) === 0)
        return s.minor && !s.patch ? "minor" : "patch";
    }
    const n = r ? "pre" : "";
    return c.major !== l.major ? n + "major" : c.minor !== l.minor ? n + "minor" : c.patch !== l.patch ? n + "patch" : "prerelease";
  }, pi;
}
var mi, fs;
function tf() {
  if (fs) return mi;
  fs = 1;
  const t = Ge();
  return mi = (h, u) => new t(h, u).major, mi;
}
var gi, ds;
function rf() {
  if (ds) return gi;
  ds = 1;
  const t = Ge();
  return gi = (h, u) => new t(h, u).minor, gi;
}
var vi, hs;
function nf() {
  if (hs) return vi;
  hs = 1;
  const t = Ge();
  return vi = (h, u) => new t(h, u).patch, vi;
}
var Ei, ps;
function af() {
  if (ps) return Ei;
  ps = 1;
  const t = Ht();
  return Ei = (h, u) => {
    const c = t(h, u);
    return c && c.prerelease.length ? c.prerelease : null;
  }, Ei;
}
var yi, ms;
function rt() {
  if (ms) return yi;
  ms = 1;
  const t = Ge();
  return yi = (h, u, c) => new t(h, c).compare(new t(u, c)), yi;
}
var wi, gs;
function of() {
  if (gs) return wi;
  gs = 1;
  const t = rt();
  return wi = (h, u, c) => t(u, h, c), wi;
}
var _i, vs;
function sf() {
  if (vs) return _i;
  vs = 1;
  const t = rt();
  return _i = (h, u) => t(h, u, !0), _i;
}
var Si, Es;
function la() {
  if (Es) return Si;
  Es = 1;
  const t = Ge();
  return Si = (h, u, c) => {
    const l = new t(h, c), a = new t(u, c);
    return l.compare(a) || l.compareBuild(a);
  }, Si;
}
var Ai, ys;
function lf() {
  if (ys) return Ai;
  ys = 1;
  const t = la();
  return Ai = (h, u) => h.sort((c, l) => t(c, l, u)), Ai;
}
var Ti, ws;
function uf() {
  if (ws) return Ti;
  ws = 1;
  const t = la();
  return Ti = (h, u) => h.sort((c, l) => t(l, c, u)), Ti;
}
var Ri, _s;
function Yr() {
  if (_s) return Ri;
  _s = 1;
  const t = rt();
  return Ri = (h, u, c) => t(h, u, c) > 0, Ri;
}
var Ci, Ss;
function ua() {
  if (Ss) return Ci;
  Ss = 1;
  const t = rt();
  return Ci = (h, u, c) => t(h, u, c) < 0, Ci;
}
var bi, As;
function tu() {
  if (As) return bi;
  As = 1;
  const t = rt();
  return bi = (h, u, c) => t(h, u, c) === 0, bi;
}
var Pi, Ts;
function ru() {
  if (Ts) return Pi;
  Ts = 1;
  const t = rt();
  return Pi = (h, u, c) => t(h, u, c) !== 0, Pi;
}
var Oi, Rs;
function ca() {
  if (Rs) return Oi;
  Rs = 1;
  const t = rt();
  return Oi = (h, u, c) => t(h, u, c) >= 0, Oi;
}
var Ii, Cs;
function fa() {
  if (Cs) return Ii;
  Cs = 1;
  const t = rt();
  return Ii = (h, u, c) => t(h, u, c) <= 0, Ii;
}
var Di, bs;
function nu() {
  if (bs) return Di;
  bs = 1;
  const t = tu(), f = ru(), h = Yr(), u = ca(), c = ua(), l = fa();
  return Di = (d, i, s, r) => {
    switch (i) {
      case "===":
        return typeof d == "object" && (d = d.version), typeof s == "object" && (s = s.version), d === s;
      case "!==":
        return typeof d == "object" && (d = d.version), typeof s == "object" && (s = s.version), d !== s;
      case "":
      case "=":
      case "==":
        return t(d, s, r);
      case "!=":
        return f(d, s, r);
      case ">":
        return h(d, s, r);
      case ">=":
        return u(d, s, r);
      case "<":
        return c(d, s, r);
      case "<=":
        return l(d, s, r);
      default:
        throw new TypeError(`Invalid operator: ${i}`);
    }
  }, Di;
}
var Ni, Ps;
function cf() {
  if (Ps) return Ni;
  Ps = 1;
  const t = Ge(), f = Ht(), { safeRe: h, t: u } = wr();
  return Ni = (l, a) => {
    if (l instanceof t)
      return l;
    if (typeof l == "number" && (l = String(l)), typeof l != "string")
      return null;
    a = a || {};
    let d = null;
    if (!a.rtl)
      d = l.match(a.includePrerelease ? h[u.COERCEFULL] : h[u.COERCE]);
    else {
      const m = a.includePrerelease ? h[u.COERCERTLFULL] : h[u.COERCERTL];
      let v;
      for (; (v = m.exec(l)) && (!d || d.index + d[0].length !== l.length); )
        (!d || v.index + v[0].length !== d.index + d[0].length) && (d = v), m.lastIndex = v.index + v[1].length + v[2].length;
      m.lastIndex = -1;
    }
    if (d === null)
      return null;
    const i = d[2], s = d[3] || "0", r = d[4] || "0", o = a.includePrerelease && d[5] ? `-${d[5]}` : "", n = a.includePrerelease && d[6] ? `+${d[6]}` : "";
    return f(`${i}.${s}.${r}${o}${n}`, a);
  }, Ni;
}
var Fi, Os;
function ff() {
  if (Os) return Fi;
  Os = 1;
  class t {
    constructor() {
      this.max = 1e3, this.map = /* @__PURE__ */ new Map();
    }
    get(h) {
      const u = this.map.get(h);
      if (u !== void 0)
        return this.map.delete(h), this.map.set(h, u), u;
    }
    delete(h) {
      return this.map.delete(h);
    }
    set(h, u) {
      if (!this.delete(h) && u !== void 0) {
        if (this.map.size >= this.max) {
          const l = this.map.keys().next().value;
          this.delete(l);
        }
        this.map.set(h, u);
      }
      return this;
    }
  }
  return Fi = t, Fi;
}
var xi, Is;
function nt() {
  if (Is) return xi;
  Is = 1;
  const t = /\s+/g;
  class f {
    constructor(D, F) {
      if (F = c(F), D instanceof f)
        return D.loose === !!F.loose && D.includePrerelease === !!F.includePrerelease ? D : new f(D.raw, F);
      if (D instanceof l)
        return this.raw = D.value, this.set = [[D]], this.formatted = void 0, this;
      if (this.options = F, this.loose = !!F.loose, this.includePrerelease = !!F.includePrerelease, this.raw = D.trim().replace(t, " "), this.set = this.raw.split("||").map(($) => this.parseRange($.trim())).filter(($) => $.length), !this.set.length)
        throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
      if (this.set.length > 1) {
        const $ = this.set[0];
        if (this.set = this.set.filter((J) => !y(J[0])), this.set.length === 0)
          this.set = [$];
        else if (this.set.length > 1) {
          for (const J of this.set)
            if (J.length === 1 && p(J[0])) {
              this.set = [J];
              break;
            }
        }
      }
      this.formatted = void 0;
    }
    get range() {
      if (this.formatted === void 0) {
        this.formatted = "";
        for (let D = 0; D < this.set.length; D++) {
          D > 0 && (this.formatted += "||");
          const F = this.set[D];
          for (let $ = 0; $ < F.length; $++)
            $ > 0 && (this.formatted += " "), this.formatted += F[$].toString().trim();
        }
      }
      return this.formatted;
    }
    format() {
      return this.range;
    }
    toString() {
      return this.range;
    }
    parseRange(D) {
      const $ = ((this.options.includePrerelease && m) | (this.options.loose && v)) + ":" + D, J = u.get($);
      if (J)
        return J;
      const W = this.options.loose, ne = W ? i[s.HYPHENRANGELOOSE] : i[s.HYPHENRANGE];
      D = D.replace(ne, L(this.options.includePrerelease)), a("hyphen replace", D), D = D.replace(i[s.COMPARATORTRIM], r), a("comparator trim", D), D = D.replace(i[s.TILDETRIM], o), a("tilde trim", D), D = D.replace(i[s.CARETTRIM], n), a("caret trim", D);
      let ce = D.split(" ").map((K) => R(K, this.options)).join(" ").split(/\s+/).map((K) => U(K, this.options));
      W && (ce = ce.filter((K) => (a("loose invalid filter", K, this.options), !!K.match(i[s.COMPARATORLOOSE])))), a("range list", ce);
      const ue = /* @__PURE__ */ new Map(), ie = ce.map((K) => new l(K, this.options));
      for (const K of ie) {
        if (y(K))
          return [K];
        ue.set(K.value, K);
      }
      ue.size > 1 && ue.has("") && ue.delete("");
      const Ae = [...ue.values()];
      return u.set($, Ae), Ae;
    }
    intersects(D, F) {
      if (!(D instanceof f))
        throw new TypeError("a Range is required");
      return this.set.some(($) => A($, F) && D.set.some((J) => A(J, F) && $.every((W) => J.every((ne) => W.intersects(ne, F)))));
    }
    // if ANY of the sets match ALL of its comparators, then pass
    test(D) {
      if (!D)
        return !1;
      if (typeof D == "string")
        try {
          D = new d(D, this.options);
        } catch {
          return !1;
        }
      for (let F = 0; F < this.set.length; F++)
        if (k(this.set[F], D, this.options))
          return !0;
      return !1;
    }
  }
  xi = f;
  const h = ff(), u = new h(), c = sa(), l = zr(), a = Vr(), d = Ge(), {
    safeRe: i,
    t: s,
    comparatorTrimReplace: r,
    tildeTrimReplace: o,
    caretTrimReplace: n
  } = wr(), { FLAG_INCLUDE_PRERELEASE: m, FLAG_LOOSE: v } = Wr(), y = (N) => N.value === "<0.0.0-0", p = (N) => N.value === "", A = (N, D) => {
    let F = !0;
    const $ = N.slice();
    let J = $.pop();
    for (; F && $.length; )
      F = $.every((W) => J.intersects(W, D)), J = $.pop();
    return F;
  }, R = (N, D) => (N = N.replace(i[s.BUILD], ""), a("comp", N, D), N = C(N, D), a("caret", N), N = O(N, D), a("tildes", N), N = T(N, D), a("xrange", N), N = q(N, D), a("stars", N), N), P = (N) => !N || N.toLowerCase() === "x" || N === "*", O = (N, D) => N.trim().split(/\s+/).map((F) => M(F, D)).join(" "), M = (N, D) => {
    const F = D.loose ? i[s.TILDELOOSE] : i[s.TILDE];
    return N.replace(F, ($, J, W, ne, ce) => {
      a("tilde", N, $, J, W, ne, ce);
      let ue;
      return P(J) ? ue = "" : P(W) ? ue = `>=${J}.0.0 <${+J + 1}.0.0-0` : P(ne) ? ue = `>=${J}.${W}.0 <${J}.${+W + 1}.0-0` : ce ? (a("replaceTilde pr", ce), ue = `>=${J}.${W}.${ne}-${ce} <${J}.${+W + 1}.0-0`) : ue = `>=${J}.${W}.${ne} <${J}.${+W + 1}.0-0`, a("tilde return", ue), ue;
    });
  }, C = (N, D) => N.trim().split(/\s+/).map((F) => S(F, D)).join(" "), S = (N, D) => {
    a("caret", N, D);
    const F = D.loose ? i[s.CARETLOOSE] : i[s.CARET], $ = D.includePrerelease ? "-0" : "";
    return N.replace(F, (J, W, ne, ce, ue) => {
      a("caret", N, J, W, ne, ce, ue);
      let ie;
      return P(W) ? ie = "" : P(ne) ? ie = `>=${W}.0.0${$} <${+W + 1}.0.0-0` : P(ce) ? W === "0" ? ie = `>=${W}.${ne}.0${$} <${W}.${+ne + 1}.0-0` : ie = `>=${W}.${ne}.0${$} <${+W + 1}.0.0-0` : ue ? (a("replaceCaret pr", ue), W === "0" ? ne === "0" ? ie = `>=${W}.${ne}.${ce}-${ue} <${W}.${ne}.${+ce + 1}-0` : ie = `>=${W}.${ne}.${ce}-${ue} <${W}.${+ne + 1}.0-0` : ie = `>=${W}.${ne}.${ce}-${ue} <${+W + 1}.0.0-0`) : (a("no pr"), W === "0" ? ne === "0" ? ie = `>=${W}.${ne}.${ce}${$} <${W}.${ne}.${+ce + 1}-0` : ie = `>=${W}.${ne}.${ce}${$} <${W}.${+ne + 1}.0-0` : ie = `>=${W}.${ne}.${ce} <${+W + 1}.0.0-0`), a("caret return", ie), ie;
    });
  }, T = (N, D) => (a("replaceXRanges", N, D), N.split(/\s+/).map((F) => E(F, D)).join(" ")), E = (N, D) => {
    N = N.trim();
    const F = D.loose ? i[s.XRANGELOOSE] : i[s.XRANGE];
    return N.replace(F, ($, J, W, ne, ce, ue) => {
      a("xRange", N, $, J, W, ne, ce, ue);
      const ie = P(W), Ae = ie || P(ne), K = Ae || P(ce), Ee = K;
      return J === "=" && Ee && (J = ""), ue = D.includePrerelease ? "-0" : "", ie ? J === ">" || J === "<" ? $ = "<0.0.0-0" : $ = "*" : J && Ee ? (Ae && (ne = 0), ce = 0, J === ">" ? (J = ">=", Ae ? (W = +W + 1, ne = 0, ce = 0) : (ne = +ne + 1, ce = 0)) : J === "<=" && (J = "<", Ae ? W = +W + 1 : ne = +ne + 1), J === "<" && (ue = "-0"), $ = `${J + W}.${ne}.${ce}${ue}`) : Ae ? $ = `>=${W}.0.0${ue} <${+W + 1}.0.0-0` : K && ($ = `>=${W}.${ne}.0${ue} <${W}.${+ne + 1}.0-0`), a("xRange return", $), $;
    });
  }, q = (N, D) => (a("replaceStars", N, D), N.trim().replace(i[s.STAR], "")), U = (N, D) => (a("replaceGTE0", N, D), N.trim().replace(i[D.includePrerelease ? s.GTE0PRE : s.GTE0], "")), L = (N) => (D, F, $, J, W, ne, ce, ue, ie, Ae, K, Ee) => (P($) ? F = "" : P(J) ? F = `>=${$}.0.0${N ? "-0" : ""}` : P(W) ? F = `>=${$}.${J}.0${N ? "-0" : ""}` : ne ? F = `>=${F}` : F = `>=${F}${N ? "-0" : ""}`, P(ie) ? ue = "" : P(Ae) ? ue = `<${+ie + 1}.0.0-0` : P(K) ? ue = `<${ie}.${+Ae + 1}.0-0` : Ee ? ue = `<=${ie}.${Ae}.${K}-${Ee}` : N ? ue = `<${ie}.${Ae}.${+K + 1}-0` : ue = `<=${ue}`, `${F} ${ue}`.trim()), k = (N, D, F) => {
    for (let $ = 0; $ < N.length; $++)
      if (!N[$].test(D))
        return !1;
    if (D.prerelease.length && !F.includePrerelease) {
      for (let $ = 0; $ < N.length; $++)
        if (a(N[$].semver), N[$].semver !== l.ANY && N[$].semver.prerelease.length > 0) {
          const J = N[$].semver;
          if (J.major === D.major && J.minor === D.minor && J.patch === D.patch)
            return !0;
        }
      return !1;
    }
    return !0;
  };
  return xi;
}
var Li, Ds;
function zr() {
  if (Ds) return Li;
  Ds = 1;
  const t = Symbol("SemVer ANY");
  class f {
    static get ANY() {
      return t;
    }
    constructor(r, o) {
      if (o = h(o), r instanceof f) {
        if (r.loose === !!o.loose)
          return r;
        r = r.value;
      }
      r = r.trim().split(/\s+/).join(" "), a("comparator", r, o), this.options = o, this.loose = !!o.loose, this.parse(r), this.semver === t ? this.value = "" : this.value = this.operator + this.semver.version, a("comp", this);
    }
    parse(r) {
      const o = this.options.loose ? u[c.COMPARATORLOOSE] : u[c.COMPARATOR], n = r.match(o);
      if (!n)
        throw new TypeError(`Invalid comparator: ${r}`);
      this.operator = n[1] !== void 0 ? n[1] : "", this.operator === "=" && (this.operator = ""), n[2] ? this.semver = new d(n[2], this.options.loose) : this.semver = t;
    }
    toString() {
      return this.value;
    }
    test(r) {
      if (a("Comparator.test", r, this.options.loose), this.semver === t || r === t)
        return !0;
      if (typeof r == "string")
        try {
          r = new d(r, this.options);
        } catch {
          return !1;
        }
      return l(r, this.operator, this.semver, this.options);
    }
    intersects(r, o) {
      if (!(r instanceof f))
        throw new TypeError("a Comparator is required");
      return this.operator === "" ? this.value === "" ? !0 : new i(r.value, o).test(this.value) : r.operator === "" ? r.value === "" ? !0 : new i(this.value, o).test(r.semver) : (o = h(o), o.includePrerelease && (this.value === "<0.0.0-0" || r.value === "<0.0.0-0") || !o.includePrerelease && (this.value.startsWith("<0.0.0") || r.value.startsWith("<0.0.0")) ? !1 : !!(this.operator.startsWith(">") && r.operator.startsWith(">") || this.operator.startsWith("<") && r.operator.startsWith("<") || this.semver.version === r.semver.version && this.operator.includes("=") && r.operator.includes("=") || l(this.semver, "<", r.semver, o) && this.operator.startsWith(">") && r.operator.startsWith("<") || l(this.semver, ">", r.semver, o) && this.operator.startsWith("<") && r.operator.startsWith(">")));
    }
  }
  Li = f;
  const h = sa(), { safeRe: u, t: c } = wr(), l = nu(), a = Vr(), d = Ge(), i = nt();
  return Li;
}
var Ui, Ns;
function Xr() {
  if (Ns) return Ui;
  Ns = 1;
  const t = nt();
  return Ui = (h, u, c) => {
    try {
      u = new t(u, c);
    } catch {
      return !1;
    }
    return u.test(h);
  }, Ui;
}
var $i, Fs;
function df() {
  if (Fs) return $i;
  Fs = 1;
  const t = nt();
  return $i = (h, u) => new t(h, u).set.map((c) => c.map((l) => l.value).join(" ").trim().split(" ")), $i;
}
var ki, xs;
function hf() {
  if (xs) return ki;
  xs = 1;
  const t = Ge(), f = nt();
  return ki = (u, c, l) => {
    let a = null, d = null, i = null;
    try {
      i = new f(c, l);
    } catch {
      return null;
    }
    return u.forEach((s) => {
      i.test(s) && (!a || d.compare(s) === -1) && (a = s, d = new t(a, l));
    }), a;
  }, ki;
}
var qi, Ls;
function pf() {
  if (Ls) return qi;
  Ls = 1;
  const t = Ge(), f = nt();
  return qi = (u, c, l) => {
    let a = null, d = null, i = null;
    try {
      i = new f(c, l);
    } catch {
      return null;
    }
    return u.forEach((s) => {
      i.test(s) && (!a || d.compare(s) === 1) && (a = s, d = new t(a, l));
    }), a;
  }, qi;
}
var Mi, Us;
function mf() {
  if (Us) return Mi;
  Us = 1;
  const t = Ge(), f = nt(), h = Yr();
  return Mi = (c, l) => {
    c = new f(c, l);
    let a = new t("0.0.0");
    if (c.test(a) || (a = new t("0.0.0-0"), c.test(a)))
      return a;
    a = null;
    for (let d = 0; d < c.set.length; ++d) {
      const i = c.set[d];
      let s = null;
      i.forEach((r) => {
        const o = new t(r.semver.version);
        switch (r.operator) {
          case ">":
            o.prerelease.length === 0 ? o.patch++ : o.prerelease.push(0), o.raw = o.format();
          /* fallthrough */
          case "":
          case ">=":
            (!s || h(o, s)) && (s = o);
            break;
          case "<":
          case "<=":
            break;
          /* istanbul ignore next */
          default:
            throw new Error(`Unexpected operation: ${r.operator}`);
        }
      }), s && (!a || h(a, s)) && (a = s);
    }
    return a && c.test(a) ? a : null;
  }, Mi;
}
var Bi, $s;
function gf() {
  if ($s) return Bi;
  $s = 1;
  const t = nt();
  return Bi = (h, u) => {
    try {
      return new t(h, u).range || "*";
    } catch {
      return null;
    }
  }, Bi;
}
var Hi, ks;
function da() {
  if (ks) return Hi;
  ks = 1;
  const t = Ge(), f = zr(), { ANY: h } = f, u = nt(), c = Xr(), l = Yr(), a = ua(), d = fa(), i = ca();
  return Hi = (r, o, n, m) => {
    r = new t(r, m), o = new u(o, m);
    let v, y, p, A, R;
    switch (n) {
      case ">":
        v = l, y = d, p = a, A = ">", R = ">=";
        break;
      case "<":
        v = a, y = i, p = l, A = "<", R = "<=";
        break;
      default:
        throw new TypeError('Must provide a hilo val of "<" or ">"');
    }
    if (c(r, o, m))
      return !1;
    for (let P = 0; P < o.set.length; ++P) {
      const O = o.set[P];
      let M = null, C = null;
      if (O.forEach((S) => {
        S.semver === h && (S = new f(">=0.0.0")), M = M || S, C = C || S, v(S.semver, M.semver, m) ? M = S : p(S.semver, C.semver, m) && (C = S);
      }), M.operator === A || M.operator === R || (!C.operator || C.operator === A) && y(r, C.semver))
        return !1;
      if (C.operator === R && p(r, C.semver))
        return !1;
    }
    return !0;
  }, Hi;
}
var ji, qs;
function vf() {
  if (qs) return ji;
  qs = 1;
  const t = da();
  return ji = (h, u, c) => t(h, u, ">", c), ji;
}
var Gi, Ms;
function Ef() {
  if (Ms) return Gi;
  Ms = 1;
  const t = da();
  return Gi = (h, u, c) => t(h, u, "<", c), Gi;
}
var Wi, Bs;
function yf() {
  if (Bs) return Wi;
  Bs = 1;
  const t = nt();
  return Wi = (h, u, c) => (h = new t(h, c), u = new t(u, c), h.intersects(u, c)), Wi;
}
var Vi, Hs;
function wf() {
  if (Hs) return Vi;
  Hs = 1;
  const t = Xr(), f = rt();
  return Vi = (h, u, c) => {
    const l = [];
    let a = null, d = null;
    const i = h.sort((n, m) => f(n, m, c));
    for (const n of i)
      t(n, u, c) ? (d = n, a || (a = n)) : (d && l.push([a, d]), d = null, a = null);
    a && l.push([a, null]);
    const s = [];
    for (const [n, m] of l)
      n === m ? s.push(n) : !m && n === i[0] ? s.push("*") : m ? n === i[0] ? s.push(`<=${m}`) : s.push(`${n} - ${m}`) : s.push(`>=${n}`);
    const r = s.join(" || "), o = typeof u.raw == "string" ? u.raw : String(u);
    return r.length < o.length ? r : u;
  }, Vi;
}
var Yi, js;
function _f() {
  if (js) return Yi;
  js = 1;
  const t = nt(), f = zr(), { ANY: h } = f, u = Xr(), c = rt(), l = (o, n, m = {}) => {
    if (o === n)
      return !0;
    o = new t(o, m), n = new t(n, m);
    let v = !1;
    e: for (const y of o.set) {
      for (const p of n.set) {
        const A = i(y, p, m);
        if (v = v || A !== null, A)
          continue e;
      }
      if (v)
        return !1;
    }
    return !0;
  }, a = [new f(">=0.0.0-0")], d = [new f(">=0.0.0")], i = (o, n, m) => {
    if (o === n)
      return !0;
    if (o.length === 1 && o[0].semver === h) {
      if (n.length === 1 && n[0].semver === h)
        return !0;
      m.includePrerelease ? o = a : o = d;
    }
    if (n.length === 1 && n[0].semver === h) {
      if (m.includePrerelease)
        return !0;
      n = d;
    }
    const v = /* @__PURE__ */ new Set();
    let y, p;
    for (const T of o)
      T.operator === ">" || T.operator === ">=" ? y = s(y, T, m) : T.operator === "<" || T.operator === "<=" ? p = r(p, T, m) : v.add(T.semver);
    if (v.size > 1)
      return null;
    let A;
    if (y && p) {
      if (A = c(y.semver, p.semver, m), A > 0)
        return null;
      if (A === 0 && (y.operator !== ">=" || p.operator !== "<="))
        return null;
    }
    for (const T of v) {
      if (y && !u(T, String(y), m) || p && !u(T, String(p), m))
        return null;
      for (const E of n)
        if (!u(T, String(E), m))
          return !1;
      return !0;
    }
    let R, P, O, M, C = p && !m.includePrerelease && p.semver.prerelease.length ? p.semver : !1, S = y && !m.includePrerelease && y.semver.prerelease.length ? y.semver : !1;
    C && C.prerelease.length === 1 && p.operator === "<" && C.prerelease[0] === 0 && (C = !1);
    for (const T of n) {
      if (M = M || T.operator === ">" || T.operator === ">=", O = O || T.operator === "<" || T.operator === "<=", y) {
        if (S && T.semver.prerelease && T.semver.prerelease.length && T.semver.major === S.major && T.semver.minor === S.minor && T.semver.patch === S.patch && (S = !1), T.operator === ">" || T.operator === ">=") {
          if (R = s(y, T, m), R === T && R !== y)
            return !1;
        } else if (y.operator === ">=" && !u(y.semver, String(T), m))
          return !1;
      }
      if (p) {
        if (C && T.semver.prerelease && T.semver.prerelease.length && T.semver.major === C.major && T.semver.minor === C.minor && T.semver.patch === C.patch && (C = !1), T.operator === "<" || T.operator === "<=") {
          if (P = r(p, T, m), P === T && P !== p)
            return !1;
        } else if (p.operator === "<=" && !u(p.semver, String(T), m))
          return !1;
      }
      if (!T.operator && (p || y) && A !== 0)
        return !1;
    }
    return !(y && O && !p && A !== 0 || p && M && !y && A !== 0 || S || C);
  }, s = (o, n, m) => {
    if (!o)
      return n;
    const v = c(o.semver, n.semver, m);
    return v > 0 ? o : v < 0 || n.operator === ">" && o.operator === ">=" ? n : o;
  }, r = (o, n, m) => {
    if (!o)
      return n;
    const v = c(o.semver, n.semver, m);
    return v < 0 ? o : v > 0 || n.operator === "<" && o.operator === "<=" ? n : o;
  };
  return Yi = l, Yi;
}
var zi, Gs;
function iu() {
  if (Gs) return zi;
  Gs = 1;
  const t = wr(), f = Wr(), h = Ge(), u = eu(), c = Ht(), l = Jc(), a = Qc(), d = Zc(), i = ef(), s = tf(), r = rf(), o = nf(), n = af(), m = rt(), v = of(), y = sf(), p = la(), A = lf(), R = uf(), P = Yr(), O = ua(), M = tu(), C = ru(), S = ca(), T = fa(), E = nu(), q = cf(), U = zr(), L = nt(), k = Xr(), N = df(), D = hf(), F = pf(), $ = mf(), J = gf(), W = da(), ne = vf(), ce = Ef(), ue = yf(), ie = wf(), Ae = _f();
  return zi = {
    parse: c,
    valid: l,
    clean: a,
    inc: d,
    diff: i,
    major: s,
    minor: r,
    patch: o,
    prerelease: n,
    compare: m,
    rcompare: v,
    compareLoose: y,
    compareBuild: p,
    sort: A,
    rsort: R,
    gt: P,
    lt: O,
    eq: M,
    neq: C,
    gte: S,
    lte: T,
    cmp: E,
    coerce: q,
    Comparator: U,
    Range: L,
    satisfies: k,
    toComparators: N,
    maxSatisfying: D,
    minSatisfying: F,
    minVersion: $,
    validRange: J,
    outside: W,
    gtr: ne,
    ltr: ce,
    intersects: ue,
    simplifyRange: ie,
    subset: Ae,
    SemVer: h,
    re: t.re,
    src: t.src,
    tokens: t.t,
    SEMVER_SPEC_VERSION: f.SEMVER_SPEC_VERSION,
    RELEASE_TYPES: f.RELEASE_TYPES,
    compareIdentifiers: u.compareIdentifiers,
    rcompareIdentifiers: u.rcompareIdentifiers
  }, zi;
}
var Ut = {}, pr = { exports: {} };
pr.exports;
var Ws;
function Sf() {
  return Ws || (Ws = 1, (function(t, f) {
    var h = 200, u = "__lodash_hash_undefined__", c = 1, l = 2, a = 9007199254740991, d = "[object Arguments]", i = "[object Array]", s = "[object AsyncFunction]", r = "[object Boolean]", o = "[object Date]", n = "[object Error]", m = "[object Function]", v = "[object GeneratorFunction]", y = "[object Map]", p = "[object Number]", A = "[object Null]", R = "[object Object]", P = "[object Promise]", O = "[object Proxy]", M = "[object RegExp]", C = "[object Set]", S = "[object String]", T = "[object Symbol]", E = "[object Undefined]", q = "[object WeakMap]", U = "[object ArrayBuffer]", L = "[object DataView]", k = "[object Float32Array]", N = "[object Float64Array]", D = "[object Int8Array]", F = "[object Int16Array]", $ = "[object Int32Array]", J = "[object Uint8Array]", W = "[object Uint8ClampedArray]", ne = "[object Uint16Array]", ce = "[object Uint32Array]", ue = /[\\^$.*+?()[\]{}|]/g, ie = /^\[object .+?Constructor\]$/, Ae = /^(?:0|[1-9]\d*)$/, K = {};
    K[k] = K[N] = K[D] = K[F] = K[$] = K[J] = K[W] = K[ne] = K[ce] = !0, K[d] = K[i] = K[U] = K[r] = K[L] = K[o] = K[n] = K[m] = K[y] = K[p] = K[R] = K[M] = K[C] = K[S] = K[q] = !1;
    var Ee = typeof et == "object" && et && et.Object === Object && et, _ = typeof self == "object" && self && self.Object === Object && self, g = Ee || _ || Function("return this")(), H = f && !f.nodeType && f, I = H && !0 && t && !t.nodeType && t, le = I && I.exports === H, me = le && Ee.process, pe = (function() {
      try {
        return me && me.binding && me.binding("util");
      } catch {
      }
    })(), _e = pe && pe.isTypedArray;
    function ye(b, x) {
      for (var z = -1, se = b == null ? 0 : b.length, Ie = 0, Se = []; ++z < se; ) {
        var Fe = b[z];
        x(Fe, z, b) && (Se[Ie++] = Fe);
      }
      return Se;
    }
    function xe(b, x) {
      for (var z = -1, se = x.length, Ie = b.length; ++z < se; )
        b[Ie + z] = x[z];
      return b;
    }
    function be(b, x) {
      for (var z = -1, se = b == null ? 0 : b.length; ++z < se; )
        if (x(b[z], z, b))
          return !0;
      return !1;
    }
    function qe(b, x) {
      for (var z = -1, se = Array(b); ++z < b; )
        se[z] = x(z);
      return se;
    }
    function Et(b) {
      return function(x) {
        return b(x);
      };
    }
    function at(b, x) {
      return b.has(x);
    }
    function e(b, x) {
      return b?.[x];
    }
    function B(b) {
      var x = -1, z = Array(b.size);
      return b.forEach(function(se, Ie) {
        z[++x] = [Ie, se];
      }), z;
    }
    function G(b, x) {
      return function(z) {
        return b(x(z));
      };
    }
    function re(b) {
      var x = -1, z = Array(b.size);
      return b.forEach(function(se) {
        z[++x] = se;
      }), z;
    }
    var V = Array.prototype, te = Function.prototype, Z = Object.prototype, ae = g["__core-js_shared__"], ge = te.toString, ve = Z.hasOwnProperty, Te = (function() {
      var b = /[^.]+$/.exec(ae && ae.keys && ae.keys.IE_PROTO || "");
      return b ? "Symbol(src)_1." + b : "";
    })(), de = Z.toString, Le = RegExp(
      "^" + ge.call(ve).replace(ue, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
    ), w = le ? g.Buffer : void 0, j = g.Symbol, X = g.Uint8Array, Y = Z.propertyIsEnumerable, Q = V.splice, ee = j ? j.toStringTag : void 0, fe = Object.getOwnPropertySymbols, oe = w ? w.isBuffer : void 0, he = G(Object.keys, Object), we = xt(g, "DataView"), Pe = xt(g, "Map"), Ne = xt(g, "Promise"), Ce = xt(g, "Set"), Ft = xt(g, "WeakMap"), Je = xt(Object, "create"), yt = St(we), du = St(Pe), hu = St(Ne), pu = St(Ce), mu = St(Ft), ma = j ? j.prototype : void 0, Kr = ma ? ma.valueOf : void 0;
    function wt(b) {
      var x = -1, z = b == null ? 0 : b.length;
      for (this.clear(); ++x < z; ) {
        var se = b[x];
        this.set(se[0], se[1]);
      }
    }
    function gu() {
      this.__data__ = Je ? Je(null) : {}, this.size = 0;
    }
    function vu(b) {
      var x = this.has(b) && delete this.__data__[b];
      return this.size -= x ? 1 : 0, x;
    }
    function Eu(b) {
      var x = this.__data__;
      if (Je) {
        var z = x[b];
        return z === u ? void 0 : z;
      }
      return ve.call(x, b) ? x[b] : void 0;
    }
    function yu(b) {
      var x = this.__data__;
      return Je ? x[b] !== void 0 : ve.call(x, b);
    }
    function wu(b, x) {
      var z = this.__data__;
      return this.size += this.has(b) ? 0 : 1, z[b] = Je && x === void 0 ? u : x, this;
    }
    wt.prototype.clear = gu, wt.prototype.delete = vu, wt.prototype.get = Eu, wt.prototype.has = yu, wt.prototype.set = wu;
    function ot(b) {
      var x = -1, z = b == null ? 0 : b.length;
      for (this.clear(); ++x < z; ) {
        var se = b[x];
        this.set(se[0], se[1]);
      }
    }
    function _u() {
      this.__data__ = [], this.size = 0;
    }
    function Su(b) {
      var x = this.__data__, z = Sr(x, b);
      if (z < 0)
        return !1;
      var se = x.length - 1;
      return z == se ? x.pop() : Q.call(x, z, 1), --this.size, !0;
    }
    function Au(b) {
      var x = this.__data__, z = Sr(x, b);
      return z < 0 ? void 0 : x[z][1];
    }
    function Tu(b) {
      return Sr(this.__data__, b) > -1;
    }
    function Ru(b, x) {
      var z = this.__data__, se = Sr(z, b);
      return se < 0 ? (++this.size, z.push([b, x])) : z[se][1] = x, this;
    }
    ot.prototype.clear = _u, ot.prototype.delete = Su, ot.prototype.get = Au, ot.prototype.has = Tu, ot.prototype.set = Ru;
    function _t(b) {
      var x = -1, z = b == null ? 0 : b.length;
      for (this.clear(); ++x < z; ) {
        var se = b[x];
        this.set(se[0], se[1]);
      }
    }
    function Cu() {
      this.size = 0, this.__data__ = {
        hash: new wt(),
        map: new (Pe || ot)(),
        string: new wt()
      };
    }
    function bu(b) {
      var x = Ar(this, b).delete(b);
      return this.size -= x ? 1 : 0, x;
    }
    function Pu(b) {
      return Ar(this, b).get(b);
    }
    function Ou(b) {
      return Ar(this, b).has(b);
    }
    function Iu(b, x) {
      var z = Ar(this, b), se = z.size;
      return z.set(b, x), this.size += z.size == se ? 0 : 1, this;
    }
    _t.prototype.clear = Cu, _t.prototype.delete = bu, _t.prototype.get = Pu, _t.prototype.has = Ou, _t.prototype.set = Iu;
    function _r(b) {
      var x = -1, z = b == null ? 0 : b.length;
      for (this.__data__ = new _t(); ++x < z; )
        this.add(b[x]);
    }
    function Du(b) {
      return this.__data__.set(b, u), this;
    }
    function Nu(b) {
      return this.__data__.has(b);
    }
    _r.prototype.add = _r.prototype.push = Du, _r.prototype.has = Nu;
    function ct(b) {
      var x = this.__data__ = new ot(b);
      this.size = x.size;
    }
    function Fu() {
      this.__data__ = new ot(), this.size = 0;
    }
    function xu(b) {
      var x = this.__data__, z = x.delete(b);
      return this.size = x.size, z;
    }
    function Lu(b) {
      return this.__data__.get(b);
    }
    function Uu(b) {
      return this.__data__.has(b);
    }
    function $u(b, x) {
      var z = this.__data__;
      if (z instanceof ot) {
        var se = z.__data__;
        if (!Pe || se.length < h - 1)
          return se.push([b, x]), this.size = ++z.size, this;
        z = this.__data__ = new _t(se);
      }
      return z.set(b, x), this.size = z.size, this;
    }
    ct.prototype.clear = Fu, ct.prototype.delete = xu, ct.prototype.get = Lu, ct.prototype.has = Uu, ct.prototype.set = $u;
    function ku(b, x) {
      var z = Tr(b), se = !z && Zu(b), Ie = !z && !se && Jr(b), Se = !z && !se && !Ie && Ta(b), Fe = z || se || Ie || Se, Ue = Fe ? qe(b.length, String) : [], $e = Ue.length;
      for (var De in b)
        ve.call(b, De) && !(Fe && // Safari 9 has enumerable `arguments.length` in strict mode.
        (De == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
        Ie && (De == "offset" || De == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
        Se && (De == "buffer" || De == "byteLength" || De == "byteOffset") || // Skip index properties.
        zu(De, $e))) && Ue.push(De);
      return Ue;
    }
    function Sr(b, x) {
      for (var z = b.length; z--; )
        if (wa(b[z][0], x))
          return z;
      return -1;
    }
    function qu(b, x, z) {
      var se = x(b);
      return Tr(b) ? se : xe(se, z(b));
    }
    function Gt(b) {
      return b == null ? b === void 0 ? E : A : ee && ee in Object(b) ? Vu(b) : Qu(b);
    }
    function ga(b) {
      return Wt(b) && Gt(b) == d;
    }
    function va(b, x, z, se, Ie) {
      return b === x ? !0 : b == null || x == null || !Wt(b) && !Wt(x) ? b !== b && x !== x : Mu(b, x, z, se, va, Ie);
    }
    function Mu(b, x, z, se, Ie, Se) {
      var Fe = Tr(b), Ue = Tr(x), $e = Fe ? i : ft(b), De = Ue ? i : ft(x);
      $e = $e == d ? R : $e, De = De == d ? R : De;
      var Ve = $e == R, Qe = De == R, Me = $e == De;
      if (Me && Jr(b)) {
        if (!Jr(x))
          return !1;
        Fe = !0, Ve = !1;
      }
      if (Me && !Ve)
        return Se || (Se = new ct()), Fe || Ta(b) ? Ea(b, x, z, se, Ie, Se) : Gu(b, x, $e, z, se, Ie, Se);
      if (!(z & c)) {
        var ze = Ve && ve.call(b, "__wrapped__"), Xe = Qe && ve.call(x, "__wrapped__");
        if (ze || Xe) {
          var dt = ze ? b.value() : b, st = Xe ? x.value() : x;
          return Se || (Se = new ct()), Ie(dt, st, z, se, Se);
        }
      }
      return Me ? (Se || (Se = new ct()), Wu(b, x, z, se, Ie, Se)) : !1;
    }
    function Bu(b) {
      if (!Aa(b) || Ku(b))
        return !1;
      var x = _a(b) ? Le : ie;
      return x.test(St(b));
    }
    function Hu(b) {
      return Wt(b) && Sa(b.length) && !!K[Gt(b)];
    }
    function ju(b) {
      if (!Ju(b))
        return he(b);
      var x = [];
      for (var z in Object(b))
        ve.call(b, z) && z != "constructor" && x.push(z);
      return x;
    }
    function Ea(b, x, z, se, Ie, Se) {
      var Fe = z & c, Ue = b.length, $e = x.length;
      if (Ue != $e && !(Fe && $e > Ue))
        return !1;
      var De = Se.get(b);
      if (De && Se.get(x))
        return De == x;
      var Ve = -1, Qe = !0, Me = z & l ? new _r() : void 0;
      for (Se.set(b, x), Se.set(x, b); ++Ve < Ue; ) {
        var ze = b[Ve], Xe = x[Ve];
        if (se)
          var dt = Fe ? se(Xe, ze, Ve, x, b, Se) : se(ze, Xe, Ve, b, x, Se);
        if (dt !== void 0) {
          if (dt)
            continue;
          Qe = !1;
          break;
        }
        if (Me) {
          if (!be(x, function(st, At) {
            if (!at(Me, At) && (ze === st || Ie(ze, st, z, se, Se)))
              return Me.push(At);
          })) {
            Qe = !1;
            break;
          }
        } else if (!(ze === Xe || Ie(ze, Xe, z, se, Se))) {
          Qe = !1;
          break;
        }
      }
      return Se.delete(b), Se.delete(x), Qe;
    }
    function Gu(b, x, z, se, Ie, Se, Fe) {
      switch (z) {
        case L:
          if (b.byteLength != x.byteLength || b.byteOffset != x.byteOffset)
            return !1;
          b = b.buffer, x = x.buffer;
        case U:
          return !(b.byteLength != x.byteLength || !Se(new X(b), new X(x)));
        case r:
        case o:
        case p:
          return wa(+b, +x);
        case n:
          return b.name == x.name && b.message == x.message;
        case M:
        case S:
          return b == x + "";
        case y:
          var Ue = B;
        case C:
          var $e = se & c;
          if (Ue || (Ue = re), b.size != x.size && !$e)
            return !1;
          var De = Fe.get(b);
          if (De)
            return De == x;
          se |= l, Fe.set(b, x);
          var Ve = Ea(Ue(b), Ue(x), se, Ie, Se, Fe);
          return Fe.delete(b), Ve;
        case T:
          if (Kr)
            return Kr.call(b) == Kr.call(x);
      }
      return !1;
    }
    function Wu(b, x, z, se, Ie, Se) {
      var Fe = z & c, Ue = ya(b), $e = Ue.length, De = ya(x), Ve = De.length;
      if ($e != Ve && !Fe)
        return !1;
      for (var Qe = $e; Qe--; ) {
        var Me = Ue[Qe];
        if (!(Fe ? Me in x : ve.call(x, Me)))
          return !1;
      }
      var ze = Se.get(b);
      if (ze && Se.get(x))
        return ze == x;
      var Xe = !0;
      Se.set(b, x), Se.set(x, b);
      for (var dt = Fe; ++Qe < $e; ) {
        Me = Ue[Qe];
        var st = b[Me], At = x[Me];
        if (se)
          var Ra = Fe ? se(At, st, Me, x, b, Se) : se(st, At, Me, b, x, Se);
        if (!(Ra === void 0 ? st === At || Ie(st, At, z, se, Se) : Ra)) {
          Xe = !1;
          break;
        }
        dt || (dt = Me == "constructor");
      }
      if (Xe && !dt) {
        var Rr = b.constructor, Cr = x.constructor;
        Rr != Cr && "constructor" in b && "constructor" in x && !(typeof Rr == "function" && Rr instanceof Rr && typeof Cr == "function" && Cr instanceof Cr) && (Xe = !1);
      }
      return Se.delete(b), Se.delete(x), Xe;
    }
    function ya(b) {
      return qu(b, rc, Yu);
    }
    function Ar(b, x) {
      var z = b.__data__;
      return Xu(x) ? z[typeof x == "string" ? "string" : "hash"] : z.map;
    }
    function xt(b, x) {
      var z = e(b, x);
      return Bu(z) ? z : void 0;
    }
    function Vu(b) {
      var x = ve.call(b, ee), z = b[ee];
      try {
        b[ee] = void 0;
        var se = !0;
      } catch {
      }
      var Ie = de.call(b);
      return se && (x ? b[ee] = z : delete b[ee]), Ie;
    }
    var Yu = fe ? function(b) {
      return b == null ? [] : (b = Object(b), ye(fe(b), function(x) {
        return Y.call(b, x);
      }));
    } : nc, ft = Gt;
    (we && ft(new we(new ArrayBuffer(1))) != L || Pe && ft(new Pe()) != y || Ne && ft(Ne.resolve()) != P || Ce && ft(new Ce()) != C || Ft && ft(new Ft()) != q) && (ft = function(b) {
      var x = Gt(b), z = x == R ? b.constructor : void 0, se = z ? St(z) : "";
      if (se)
        switch (se) {
          case yt:
            return L;
          case du:
            return y;
          case hu:
            return P;
          case pu:
            return C;
          case mu:
            return q;
        }
      return x;
    });
    function zu(b, x) {
      return x = x ?? a, !!x && (typeof b == "number" || Ae.test(b)) && b > -1 && b % 1 == 0 && b < x;
    }
    function Xu(b) {
      var x = typeof b;
      return x == "string" || x == "number" || x == "symbol" || x == "boolean" ? b !== "__proto__" : b === null;
    }
    function Ku(b) {
      return !!Te && Te in b;
    }
    function Ju(b) {
      var x = b && b.constructor, z = typeof x == "function" && x.prototype || Z;
      return b === z;
    }
    function Qu(b) {
      return de.call(b);
    }
    function St(b) {
      if (b != null) {
        try {
          return ge.call(b);
        } catch {
        }
        try {
          return b + "";
        } catch {
        }
      }
      return "";
    }
    function wa(b, x) {
      return b === x || b !== b && x !== x;
    }
    var Zu = ga(/* @__PURE__ */ (function() {
      return arguments;
    })()) ? ga : function(b) {
      return Wt(b) && ve.call(b, "callee") && !Y.call(b, "callee");
    }, Tr = Array.isArray;
    function ec(b) {
      return b != null && Sa(b.length) && !_a(b);
    }
    var Jr = oe || ic;
    function tc(b, x) {
      return va(b, x);
    }
    function _a(b) {
      if (!Aa(b))
        return !1;
      var x = Gt(b);
      return x == m || x == v || x == s || x == O;
    }
    function Sa(b) {
      return typeof b == "number" && b > -1 && b % 1 == 0 && b <= a;
    }
    function Aa(b) {
      var x = typeof b;
      return b != null && (x == "object" || x == "function");
    }
    function Wt(b) {
      return b != null && typeof b == "object";
    }
    var Ta = _e ? Et(_e) : Hu;
    function rc(b) {
      return ec(b) ? ku(b) : ju(b);
    }
    function nc() {
      return [];
    }
    function ic() {
      return !1;
    }
    t.exports = tc;
  })(pr, pr.exports)), pr.exports;
}
var Vs;
function Af() {
  if (Vs) return Ut;
  Vs = 1, Object.defineProperty(Ut, "__esModule", { value: !0 }), Ut.DownloadedUpdateHelper = void 0, Ut.createTempUpdateFile = d;
  const t = vr, f = gt, h = Sf(), u = /* @__PURE__ */ vt(), c = Re;
  let l = class {
    constructor(s) {
      this.cacheDir = s, this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, this._downloadedFileInfo = null;
    }
    get downloadedFileInfo() {
      return this._downloadedFileInfo;
    }
    get file() {
      return this._file;
    }
    get packageFile() {
      return this._packageFile;
    }
    get cacheDirForPendingUpdate() {
      return c.join(this.cacheDir, "pending");
    }
    async validateDownloadedPath(s, r, o, n) {
      if (this.versionInfo != null && this.file === s && this.fileInfo != null)
        return h(this.versionInfo, r) && h(this.fileInfo.info, o.info) && await (0, u.pathExists)(s) ? s : null;
      const m = await this.getValidCachedUpdateFile(o, n);
      return m === null ? null : (n.info(`Update has already been downloaded to ${s}).`), this._file = m, m);
    }
    async setDownloadedFile(s, r, o, n, m, v) {
      this._file = s, this._packageFile = r, this.versionInfo = o, this.fileInfo = n, this._downloadedFileInfo = {
        fileName: m,
        sha512: n.info.sha512,
        isAdminRightsRequired: n.info.isAdminRightsRequired === !0
      }, v && await (0, u.outputJson)(this.getUpdateInfoFile(), this._downloadedFileInfo);
    }
    async clear() {
      this._file = null, this._packageFile = null, this.versionInfo = null, this.fileInfo = null, await this.cleanCacheDirForPendingUpdate();
    }
    async cleanCacheDirForPendingUpdate() {
      try {
        await (0, u.emptyDir)(this.cacheDirForPendingUpdate);
      } catch {
      }
    }
    /**
     * Returns "update-info.json" which is created in the update cache directory's "pending" subfolder after the first update is downloaded.  If the update file does not exist then the cache is cleared and recreated.  If the update file exists then its properties are validated.
     * @param fileInfo
     * @param logger
     */
    async getValidCachedUpdateFile(s, r) {
      const o = this.getUpdateInfoFile();
      if (!await (0, u.pathExists)(o))
        return null;
      let m;
      try {
        m = await (0, u.readJson)(o);
      } catch (A) {
        let R = "No cached update info available";
        return A.code !== "ENOENT" && (await this.cleanCacheDirForPendingUpdate(), R += ` (error on read: ${A.message})`), r.info(R), null;
      }
      if (!(m?.fileName !== null))
        return r.warn("Cached update info is corrupted: no fileName, directory for cached update will be cleaned"), await this.cleanCacheDirForPendingUpdate(), null;
      if (s.info.sha512 !== m.sha512)
        return r.info(`Cached update sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${m.sha512}, expected: ${s.info.sha512}. Directory for cached update will be cleaned`), await this.cleanCacheDirForPendingUpdate(), null;
      const y = c.join(this.cacheDirForPendingUpdate, m.fileName);
      if (!await (0, u.pathExists)(y))
        return r.info("Cached update file doesn't exist"), null;
      const p = await a(y);
      return s.info.sha512 !== p ? (r.warn(`Sha512 checksum doesn't match the latest available update. New update must be downloaded. Cached: ${p}, expected: ${s.info.sha512}`), await this.cleanCacheDirForPendingUpdate(), null) : (this._downloadedFileInfo = m, y);
    }
    getUpdateInfoFile() {
      return c.join(this.cacheDirForPendingUpdate, "update-info.json");
    }
  };
  Ut.DownloadedUpdateHelper = l;
  function a(i, s = "sha512", r = "base64", o) {
    return new Promise((n, m) => {
      const v = (0, t.createHash)(s);
      v.on("error", m).setEncoding(r), (0, f.createReadStream)(i, {
        ...o,
        highWaterMark: 1024 * 1024
        /* better to use more memory but hash faster */
      }).on("error", m).on("end", () => {
        v.end(), n(v.read());
      }).pipe(v, { end: !1 });
    });
  }
  async function d(i, s, r) {
    let o = 0, n = c.join(s, i);
    for (let m = 0; m < 3; m++)
      try {
        return await (0, u.unlink)(n), n;
      } catch (v) {
        if (v.code === "ENOENT")
          return n;
        r.warn(`Error on remove temp update file: ${v}`), n = c.join(s, `${o++}-${i}`);
      }
    return n;
  }
  return Ut;
}
var Jt = {}, kr = {}, Ys;
function Tf() {
  if (Ys) return kr;
  Ys = 1, Object.defineProperty(kr, "__esModule", { value: !0 }), kr.getAppCacheDir = h;
  const t = Re, f = Hr;
  function h() {
    const u = (0, f.homedir)();
    let c;
    return process.platform === "win32" ? c = process.env.LOCALAPPDATA || t.join(u, "AppData", "Local") : process.platform === "darwin" ? c = t.join(u, "Library", "Caches") : c = process.env.XDG_CACHE_HOME || t.join(u, ".cache"), c;
  }
  return kr;
}
var zs;
function Rf() {
  if (zs) return Jt;
  zs = 1, Object.defineProperty(Jt, "__esModule", { value: !0 }), Jt.ElectronAppAdapter = void 0;
  const t = Re, f = Tf();
  let h = class {
    constructor(c = Ot.app) {
      this.app = c;
    }
    whenReady() {
      return this.app.whenReady();
    }
    get version() {
      return this.app.getVersion();
    }
    get name() {
      return this.app.getName();
    }
    get isPackaged() {
      return this.app.isPackaged === !0;
    }
    get appUpdateConfigPath() {
      return this.isPackaged ? t.join(process.resourcesPath, "app-update.yml") : t.join(this.app.getAppPath(), "dev-app-update.yml");
    }
    get userDataPath() {
      return this.app.getPath("userData");
    }
    get baseCachePath() {
      return (0, f.getAppCacheDir)();
    }
    quit() {
      this.app.quit();
    }
    relaunch() {
      this.app.relaunch();
    }
    onQuit(c) {
      this.app.once("quit", (l, a) => c(a));
    }
  };
  return Jt.ElectronAppAdapter = h, Jt;
}
var Xi = {}, Xs;
function Cf() {
  return Xs || (Xs = 1, (function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.ElectronHttpExecutor = t.NET_SESSION_NAME = void 0, t.getNetSession = h;
    const f = ke();
    t.NET_SESSION_NAME = "electron-updater";
    function h() {
      return Ot.session.fromPartition(t.NET_SESSION_NAME, {
        cache: !1
      });
    }
    class u extends f.HttpExecutor {
      constructor(l) {
        super(), this.proxyLoginCallback = l, this.cachedSession = null;
      }
      async download(l, a, d) {
        return await d.cancellationToken.createPromise((i, s, r) => {
          const o = {
            headers: d.headers || void 0,
            redirect: "manual"
          };
          (0, f.configureRequestUrl)(l, o), (0, f.configureRequestOptions)(o), this.doDownload(o, {
            destination: a,
            options: d,
            onCancel: r,
            callback: (n) => {
              n == null ? i(a) : s(n);
            },
            responseHandler: null
          }, 0);
        });
      }
      createRequest(l, a) {
        l.headers && l.headers.Host && (l.host = l.headers.Host, delete l.headers.Host), this.cachedSession == null && (this.cachedSession = h());
        const d = Ot.net.request({
          ...l,
          session: this.cachedSession
        });
        return d.on("response", a), this.proxyLoginCallback != null && d.on("login", this.proxyLoginCallback), d;
      }
      addRedirectHandlers(l, a, d, i, s) {
        l.on("redirect", (r, o, n) => {
          l.abort(), i > this.maxRedirects ? d(this.createMaxRedirectError()) : s(f.HttpExecutor.prepareRedirectUrlOptions(n, a));
        });
      }
    }
    t.ElectronHttpExecutor = u;
  })(Xi)), Xi;
}
var Qt = {}, Pt = {}, Ki, Ks;
function bf() {
  if (Ks) return Ki;
  Ks = 1;
  var t = "[object Symbol]", f = /[\\^$.*+?()[\]{}|]/g, h = RegExp(f.source), u = typeof et == "object" && et && et.Object === Object && et, c = typeof self == "object" && self && self.Object === Object && self, l = u || c || Function("return this")(), a = Object.prototype, d = a.toString, i = l.Symbol, s = i ? i.prototype : void 0, r = s ? s.toString : void 0;
  function o(p) {
    if (typeof p == "string")
      return p;
    if (m(p))
      return r ? r.call(p) : "";
    var A = p + "";
    return A == "0" && 1 / p == -1 / 0 ? "-0" : A;
  }
  function n(p) {
    return !!p && typeof p == "object";
  }
  function m(p) {
    return typeof p == "symbol" || n(p) && d.call(p) == t;
  }
  function v(p) {
    return p == null ? "" : o(p);
  }
  function y(p) {
    return p = v(p), p && h.test(p) ? p.replace(f, "\\$&") : p;
  }
  return Ki = y, Ki;
}
var Js;
function Dt() {
  if (Js) return Pt;
  Js = 1, Object.defineProperty(Pt, "__esModule", { value: !0 }), Pt.newBaseUrl = h, Pt.newUrlFromBase = u, Pt.getChannelFilename = c, Pt.blockmapFiles = l;
  const t = qt, f = bf();
  function h(a) {
    const d = new t.URL(a);
    return d.pathname.endsWith("/") || (d.pathname += "/"), d;
  }
  function u(a, d, i = !1) {
    const s = new t.URL(a, d), r = d.search;
    return r != null && r.length !== 0 ? s.search = r : i && (s.search = `noCache=${Date.now().toString(32)}`), s;
  }
  function c(a) {
    return `${a}.yml`;
  }
  function l(a, d, i) {
    const s = u(`${a.pathname}.blockmap`, a);
    return [u(`${a.pathname.replace(new RegExp(f(i), "g"), d)}.blockmap`, a), s];
  }
  return Pt;
}
var lt = {}, Qs;
function Ke() {
  if (Qs) return lt;
  Qs = 1, Object.defineProperty(lt, "__esModule", { value: !0 }), lt.Provider = void 0, lt.findFile = c, lt.parseUpdateInfo = l, lt.getFileList = a, lt.resolveFiles = d;
  const t = ke(), f = oa(), h = Dt();
  let u = class {
    constructor(s) {
      this.runtimeOptions = s, this.requestHeaders = null, this.executor = s.executor;
    }
    get isUseMultipleRangeRequest() {
      return this.runtimeOptions.isUseMultipleRangeRequest !== !1;
    }
    getChannelFilePrefix() {
      if (this.runtimeOptions.platform === "linux") {
        const s = process.env.TEST_UPDATER_ARCH || process.arch;
        return "-linux" + (s === "x64" ? "" : `-${s}`);
      } else
        return this.runtimeOptions.platform === "darwin" ? "-mac" : "";
    }
    // due to historical reasons for windows we use channel name without platform specifier
    getDefaultChannelName() {
      return this.getCustomChannelName("latest");
    }
    getCustomChannelName(s) {
      return `${s}${this.getChannelFilePrefix()}`;
    }
    get fileExtraDownloadHeaders() {
      return null;
    }
    setRequestHeaders(s) {
      this.requestHeaders = s;
    }
    /**
     * Method to perform API request only to resolve update info, but not to download update.
     */
    httpRequest(s, r, o) {
      return this.executor.request(this.createRequestOptions(s, r), o);
    }
    createRequestOptions(s, r) {
      const o = {};
      return this.requestHeaders == null ? r != null && (o.headers = r) : o.headers = r == null ? this.requestHeaders : { ...this.requestHeaders, ...r }, (0, t.configureRequestUrl)(s, o), o;
    }
  };
  lt.Provider = u;
  function c(i, s, r) {
    if (i.length === 0)
      throw (0, t.newError)("No files provided", "ERR_UPDATER_NO_FILES_PROVIDED");
    const o = i.find((n) => n.url.pathname.toLowerCase().endsWith(`.${s}`));
    return o ?? (r == null ? i[0] : i.find((n) => !r.some((m) => n.url.pathname.toLowerCase().endsWith(`.${m}`))));
  }
  function l(i, s, r) {
    if (i == null)
      throw (0, t.newError)(`Cannot parse update info from ${s} in the latest release artifacts (${r}): rawData: null`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    let o;
    try {
      o = (0, f.load)(i);
    } catch (n) {
      throw (0, t.newError)(`Cannot parse update info from ${s} in the latest release artifacts (${r}): ${n.stack || n.message}, rawData: ${i}`, "ERR_UPDATER_INVALID_UPDATE_INFO");
    }
    return o;
  }
  function a(i) {
    const s = i.files;
    if (s != null && s.length > 0)
      return s;
    if (i.path != null)
      return [
        {
          url: i.path,
          sha2: i.sha2,
          sha512: i.sha512
        }
      ];
    throw (0, t.newError)(`No files provided: ${(0, t.safeStringifyJson)(i)}`, "ERR_UPDATER_NO_FILES_PROVIDED");
  }
  function d(i, s, r = (o) => o) {
    const n = a(i).map((y) => {
      if (y.sha2 == null && y.sha512 == null)
        throw (0, t.newError)(`Update info doesn't contain nor sha256 neither sha512 checksum: ${(0, t.safeStringifyJson)(y)}`, "ERR_UPDATER_NO_CHECKSUM");
      return {
        url: (0, h.newUrlFromBase)(r(y.url), s),
        info: y
      };
    }), m = i.packages, v = m == null ? null : m[process.arch] || m.ia32;
    return v != null && (n[0].packageInfo = {
      ...v,
      path: (0, h.newUrlFromBase)(r(v.path), s).href
    }), n;
  }
  return lt;
}
var Zs;
function au() {
  if (Zs) return Qt;
  Zs = 1, Object.defineProperty(Qt, "__esModule", { value: !0 }), Qt.GenericProvider = void 0;
  const t = ke(), f = Dt(), h = Ke();
  let u = class extends h.Provider {
    constructor(l, a, d) {
      super(d), this.configuration = l, this.updater = a, this.baseUrl = (0, f.newBaseUrl)(this.configuration.url);
    }
    get channel() {
      const l = this.updater.channel || this.configuration.channel;
      return l == null ? this.getDefaultChannelName() : this.getCustomChannelName(l);
    }
    async getLatestVersion() {
      const l = (0, f.getChannelFilename)(this.channel), a = (0, f.newUrlFromBase)(l, this.baseUrl, this.updater.isAddNoCacheQuery);
      for (let d = 0; ; d++)
        try {
          return (0, h.parseUpdateInfo)(await this.httpRequest(a), l, a);
        } catch (i) {
          if (i instanceof t.HttpError && i.statusCode === 404)
            throw (0, t.newError)(`Cannot find channel "${l}" update info: ${i.stack || i.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
          if (i.code === "ECONNREFUSED" && d < 3) {
            await new Promise((s, r) => {
              try {
                setTimeout(s, 1e3 * d);
              } catch (o) {
                r(o);
              }
            });
            continue;
          }
          throw i;
        }
    }
    resolveFiles(l) {
      return (0, h.resolveFiles)(l, this.baseUrl);
    }
  };
  return Qt.GenericProvider = u, Qt;
}
var Zt = {}, er = {}, el;
function Pf() {
  if (el) return er;
  el = 1, Object.defineProperty(er, "__esModule", { value: !0 }), er.BitbucketProvider = void 0;
  const t = ke(), f = Dt(), h = Ke();
  let u = class extends h.Provider {
    constructor(l, a, d) {
      super({
        ...d,
        isUseMultipleRangeRequest: !1
      }), this.configuration = l, this.updater = a;
      const { owner: i, slug: s } = l;
      this.baseUrl = (0, f.newBaseUrl)(`https://api.bitbucket.org/2.0/repositories/${i}/${s}/downloads`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "latest";
    }
    async getLatestVersion() {
      const l = new t.CancellationToken(), a = (0, f.getChannelFilename)(this.getCustomChannelName(this.channel)), d = (0, f.newUrlFromBase)(a, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const i = await this.httpRequest(d, void 0, l);
        return (0, h.parseUpdateInfo)(i, a, d);
      } catch (i) {
        throw (0, t.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(l) {
      return (0, h.resolveFiles)(l, this.baseUrl);
    }
    toString() {
      const { owner: l, slug: a } = this.configuration;
      return `Bitbucket (owner: ${l}, slug: ${a}, channel: ${this.channel})`;
    }
  };
  return er.BitbucketProvider = u, er;
}
var pt = {}, tl;
function ou() {
  if (tl) return pt;
  tl = 1, Object.defineProperty(pt, "__esModule", { value: !0 }), pt.GitHubProvider = pt.BaseGitHubProvider = void 0, pt.computeReleaseNotes = s;
  const t = ke(), f = iu(), h = qt, u = Dt(), c = Ke(), l = /\/tag\/([^/]+)$/;
  class a extends c.Provider {
    constructor(o, n, m) {
      super({
        ...m,
        /* because GitHib uses S3 */
        isUseMultipleRangeRequest: !1
      }), this.options = o, this.baseUrl = (0, u.newBaseUrl)((0, t.githubUrl)(o, n));
      const v = n === "github.com" ? "api.github.com" : n;
      this.baseApiUrl = (0, u.newBaseUrl)((0, t.githubUrl)(o, v));
    }
    computeGithubBasePath(o) {
      const n = this.options.host;
      return n && !["github.com", "api.github.com"].includes(n) ? `/api/v3${o}` : o;
    }
  }
  pt.BaseGitHubProvider = a;
  let d = class extends a {
    constructor(o, n, m) {
      super(o, "github.com", m), this.options = o, this.updater = n;
    }
    get channel() {
      const o = this.updater.channel || this.options.channel;
      return o == null ? this.getDefaultChannelName() : this.getCustomChannelName(o);
    }
    async getLatestVersion() {
      var o, n, m, v, y;
      const p = new t.CancellationToken(), A = await this.httpRequest((0, u.newUrlFromBase)(`${this.basePath}.atom`, this.baseUrl), {
        accept: "application/xml, application/atom+xml, text/xml, */*"
      }, p), R = (0, t.parseXml)(A);
      let P = R.element("entry", !1, "No published versions on GitHub"), O = null;
      try {
        if (this.updater.allowPrerelease) {
          const q = ((o = this.updater) === null || o === void 0 ? void 0 : o.channel) || ((n = f.prerelease(this.updater.currentVersion)) === null || n === void 0 ? void 0 : n[0]) || null;
          if (q === null)
            O = l.exec(P.element("link").attribute("href"))[1];
          else
            for (const U of R.getElements("entry")) {
              const L = l.exec(U.element("link").attribute("href"));
              if (L === null)
                continue;
              const k = L[1], N = ((m = f.prerelease(k)) === null || m === void 0 ? void 0 : m[0]) || null, D = !q || ["alpha", "beta"].includes(q), F = N !== null && !["alpha", "beta"].includes(String(N));
              if (D && !F && !(q === "beta" && N === "alpha")) {
                O = k;
                break;
              }
              if (N && N === q) {
                O = k;
                break;
              }
            }
        } else {
          O = await this.getLatestTagName(p);
          for (const q of R.getElements("entry"))
            if (l.exec(q.element("link").attribute("href"))[1] === O) {
              P = q;
              break;
            }
        }
      } catch (q) {
        throw (0, t.newError)(`Cannot parse releases feed: ${q.stack || q.message},
XML:
${A}`, "ERR_UPDATER_INVALID_RELEASE_FEED");
      }
      if (O == null)
        throw (0, t.newError)("No published versions on GitHub", "ERR_UPDATER_NO_PUBLISHED_VERSIONS");
      let M, C = "", S = "";
      const T = async (q) => {
        C = (0, u.getChannelFilename)(q), S = (0, u.newUrlFromBase)(this.getBaseDownloadPath(String(O), C), this.baseUrl);
        const U = this.createRequestOptions(S);
        try {
          return await this.executor.request(U, p);
        } catch (L) {
          throw L instanceof t.HttpError && L.statusCode === 404 ? (0, t.newError)(`Cannot find ${C} in the latest release artifacts (${S}): ${L.stack || L.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : L;
        }
      };
      try {
        let q = this.channel;
        this.updater.allowPrerelease && (!((v = f.prerelease(O)) === null || v === void 0) && v[0]) && (q = this.getCustomChannelName(String((y = f.prerelease(O)) === null || y === void 0 ? void 0 : y[0]))), M = await T(q);
      } catch (q) {
        if (this.updater.allowPrerelease)
          M = await T(this.getDefaultChannelName());
        else
          throw q;
      }
      const E = (0, c.parseUpdateInfo)(M, C, S);
      return E.releaseName == null && (E.releaseName = P.elementValueOrEmpty("title")), E.releaseNotes == null && (E.releaseNotes = s(this.updater.currentVersion, this.updater.fullChangelog, R, P)), {
        tag: O,
        ...E
      };
    }
    async getLatestTagName(o) {
      const n = this.options, m = n.host == null || n.host === "github.com" ? (0, u.newUrlFromBase)(`${this.basePath}/latest`, this.baseUrl) : new h.URL(`${this.computeGithubBasePath(`/repos/${n.owner}/${n.repo}/releases`)}/latest`, this.baseApiUrl);
      try {
        const v = await this.httpRequest(m, { Accept: "application/json" }, o);
        return v == null ? null : JSON.parse(v).tag_name;
      } catch (v) {
        throw (0, t.newError)(`Unable to find latest version on GitHub (${m}), please ensure a production release exists: ${v.stack || v.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return `/${this.options.owner}/${this.options.repo}/releases`;
    }
    resolveFiles(o) {
      return (0, c.resolveFiles)(o, this.baseUrl, (n) => this.getBaseDownloadPath(o.tag, n.replace(/ /g, "-")));
    }
    getBaseDownloadPath(o, n) {
      return `${this.basePath}/download/${o}/${n}`;
    }
  };
  pt.GitHubProvider = d;
  function i(r) {
    const o = r.elementValueOrEmpty("content");
    return o === "No content." ? "" : o;
  }
  function s(r, o, n, m) {
    if (!o)
      return i(m);
    const v = [];
    for (const y of n.getElements("entry")) {
      const p = /\/tag\/v?([^/]+)$/.exec(y.element("link").attribute("href"))[1];
      f.lt(r, p) && v.push({
        version: p,
        note: i(y)
      });
    }
    return v.sort((y, p) => f.rcompare(y.version, p.version));
  }
  return pt;
}
var tr = {}, rl;
function Of() {
  if (rl) return tr;
  rl = 1, Object.defineProperty(tr, "__esModule", { value: !0 }), tr.KeygenProvider = void 0;
  const t = ke(), f = Dt(), h = Ke();
  let u = class extends h.Provider {
    constructor(l, a, d) {
      super({
        ...d,
        isUseMultipleRangeRequest: !1
      }), this.configuration = l, this.updater = a, this.defaultHostname = "api.keygen.sh";
      const i = this.configuration.host || this.defaultHostname;
      this.baseUrl = (0, f.newBaseUrl)(`https://${i}/v1/accounts/${this.configuration.account}/artifacts?product=${this.configuration.product}`);
    }
    get channel() {
      return this.updater.channel || this.configuration.channel || "stable";
    }
    async getLatestVersion() {
      const l = new t.CancellationToken(), a = (0, f.getChannelFilename)(this.getCustomChannelName(this.channel)), d = (0, f.newUrlFromBase)(a, this.baseUrl, this.updater.isAddNoCacheQuery);
      try {
        const i = await this.httpRequest(d, {
          Accept: "application/vnd.api+json",
          "Keygen-Version": "1.1"
        }, l);
        return (0, h.parseUpdateInfo)(i, a, d);
      } catch (i) {
        throw (0, t.newError)(`Unable to find latest version on ${this.toString()}, please ensure release exists: ${i.stack || i.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    resolveFiles(l) {
      return (0, h.resolveFiles)(l, this.baseUrl);
    }
    toString() {
      const { account: l, product: a, platform: d } = this.configuration;
      return `Keygen (account: ${l}, product: ${a}, platform: ${d}, channel: ${this.channel})`;
    }
  };
  return tr.KeygenProvider = u, tr;
}
var rr = {}, nl;
function If() {
  if (nl) return rr;
  nl = 1, Object.defineProperty(rr, "__esModule", { value: !0 }), rr.PrivateGitHubProvider = void 0;
  const t = ke(), f = oa(), h = Re, u = qt, c = Dt(), l = ou(), a = Ke();
  let d = class extends l.BaseGitHubProvider {
    constructor(s, r, o, n) {
      super(s, "api.github.com", n), this.updater = r, this.token = o;
    }
    createRequestOptions(s, r) {
      const o = super.createRequestOptions(s, r);
      return o.redirect = "manual", o;
    }
    async getLatestVersion() {
      const s = new t.CancellationToken(), r = (0, c.getChannelFilename)(this.getDefaultChannelName()), o = await this.getLatestVersionInfo(s), n = o.assets.find((y) => y.name === r);
      if (n == null)
        throw (0, t.newError)(`Cannot find ${r} in the release ${o.html_url || o.name}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND");
      const m = new u.URL(n.url);
      let v;
      try {
        v = (0, f.load)(await this.httpRequest(m, this.configureHeaders("application/octet-stream"), s));
      } catch (y) {
        throw y instanceof t.HttpError && y.statusCode === 404 ? (0, t.newError)(`Cannot find ${r} in the latest release artifacts (${m}): ${y.stack || y.message}`, "ERR_UPDATER_CHANNEL_FILE_NOT_FOUND") : y;
      }
      return v.assets = o.assets, v;
    }
    get fileExtraDownloadHeaders() {
      return this.configureHeaders("application/octet-stream");
    }
    configureHeaders(s) {
      return {
        accept: s,
        authorization: `token ${this.token}`
      };
    }
    async getLatestVersionInfo(s) {
      const r = this.updater.allowPrerelease;
      let o = this.basePath;
      r || (o = `${o}/latest`);
      const n = (0, c.newUrlFromBase)(o, this.baseUrl);
      try {
        const m = JSON.parse(await this.httpRequest(n, this.configureHeaders("application/vnd.github.v3+json"), s));
        return r ? m.find((v) => v.prerelease) || m[0] : m;
      } catch (m) {
        throw (0, t.newError)(`Unable to find latest version on GitHub (${n}), please ensure a production release exists: ${m.stack || m.message}`, "ERR_UPDATER_LATEST_VERSION_NOT_FOUND");
      }
    }
    get basePath() {
      return this.computeGithubBasePath(`/repos/${this.options.owner}/${this.options.repo}/releases`);
    }
    resolveFiles(s) {
      return (0, a.getFileList)(s).map((r) => {
        const o = h.posix.basename(r.url).replace(/ /g, "-"), n = s.assets.find((m) => m != null && m.name === o);
        if (n == null)
          throw (0, t.newError)(`Cannot find asset "${o}" in: ${JSON.stringify(s.assets, null, 2)}`, "ERR_UPDATER_ASSET_NOT_FOUND");
        return {
          url: new u.URL(n.url),
          info: r
        };
      });
    }
  };
  return rr.PrivateGitHubProvider = d, rr;
}
var il;
function Df() {
  if (il) return Zt;
  il = 1, Object.defineProperty(Zt, "__esModule", { value: !0 }), Zt.isUrlProbablySupportMultiRangeRequests = a, Zt.createClient = d;
  const t = ke(), f = Pf(), h = au(), u = ou(), c = Of(), l = If();
  function a(i) {
    return !i.includes("s3.amazonaws.com");
  }
  function d(i, s, r) {
    if (typeof i == "string")
      throw (0, t.newError)("Please pass PublishConfiguration object", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
    const o = i.provider;
    switch (o) {
      case "github": {
        const n = i, m = (n.private ? process.env.GH_TOKEN || process.env.GITHUB_TOKEN : null) || n.token;
        return m == null ? new u.GitHubProvider(n, s, r) : new l.PrivateGitHubProvider(n, s, m, r);
      }
      case "bitbucket":
        return new f.BitbucketProvider(i, s, r);
      case "keygen":
        return new c.KeygenProvider(i, s, r);
      case "s3":
      case "spaces":
        return new h.GenericProvider({
          provider: "generic",
          url: (0, t.getS3LikeProviderBaseUrl)(i),
          channel: i.channel || null
        }, s, {
          ...r,
          // https://github.com/minio/minio/issues/5285#issuecomment-350428955
          isUseMultipleRangeRequest: !1
        });
      case "generic": {
        const n = i;
        return new h.GenericProvider(n, s, {
          ...r,
          isUseMultipleRangeRequest: n.useMultipleRangeRequest !== !1 && a(n.url)
        });
      }
      case "custom": {
        const n = i, m = n.updateProvider;
        if (!m)
          throw (0, t.newError)("Custom provider not specified", "ERR_UPDATER_INVALID_PROVIDER_CONFIGURATION");
        return new m(n, s, r);
      }
      default:
        throw (0, t.newError)(`Unsupported provider: ${o}`, "ERR_UPDATER_UNSUPPORTED_PROVIDER");
    }
  }
  return Zt;
}
var nr = {}, ir = {}, $t = {}, kt = {}, al;
function ha() {
  if (al) return kt;
  al = 1, Object.defineProperty(kt, "__esModule", { value: !0 }), kt.OperationKind = void 0, kt.computeOperations = f;
  var t;
  (function(a) {
    a[a.COPY = 0] = "COPY", a[a.DOWNLOAD = 1] = "DOWNLOAD";
  })(t || (kt.OperationKind = t = {}));
  function f(a, d, i) {
    const s = l(a.files), r = l(d.files);
    let o = null;
    const n = d.files[0], m = [], v = n.name, y = s.get(v);
    if (y == null)
      throw new Error(`no file ${v} in old blockmap`);
    const p = r.get(v);
    let A = 0;
    const { checksumToOffset: R, checksumToOldSize: P } = c(s.get(v), y.offset, i);
    let O = n.offset;
    for (let M = 0; M < p.checksums.length; O += p.sizes[M], M++) {
      const C = p.sizes[M], S = p.checksums[M];
      let T = R.get(S);
      T != null && P.get(S) !== C && (i.warn(`Checksum ("${S}") matches, but size differs (old: ${P.get(S)}, new: ${C})`), T = void 0), T === void 0 ? (A++, o != null && o.kind === t.DOWNLOAD && o.end === O ? o.end += C : (o = {
        kind: t.DOWNLOAD,
        start: O,
        end: O + C
        // oldBlocks: null,
      }, u(o, m, S, M))) : o != null && o.kind === t.COPY && o.end === T ? o.end += C : (o = {
        kind: t.COPY,
        start: T,
        end: T + C
        // oldBlocks: [checksum]
      }, u(o, m, S, M));
    }
    return A > 0 && i.info(`File${n.name === "file" ? "" : " " + n.name} has ${A} changed blocks`), m;
  }
  const h = process.env.DIFFERENTIAL_DOWNLOAD_PLAN_BUILDER_VALIDATE_RANGES === "true";
  function u(a, d, i, s) {
    if (h && d.length !== 0) {
      const r = d[d.length - 1];
      if (r.kind === a.kind && a.start < r.end && a.start > r.start) {
        const o = [r.start, r.end, a.start, a.end].reduce((n, m) => n < m ? n : m);
        throw new Error(`operation (block index: ${s}, checksum: ${i}, kind: ${t[a.kind]}) overlaps previous operation (checksum: ${i}):
abs: ${r.start} until ${r.end} and ${a.start} until ${a.end}
rel: ${r.start - o} until ${r.end - o} and ${a.start - o} until ${a.end - o}`);
      }
    }
    d.push(a);
  }
  function c(a, d, i) {
    const s = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map();
    let o = d;
    for (let n = 0; n < a.checksums.length; n++) {
      const m = a.checksums[n], v = a.sizes[n], y = r.get(m);
      if (y === void 0)
        s.set(m, o), r.set(m, v);
      else if (i.debug != null) {
        const p = y === v ? "(same size)" : `(size: ${y}, this size: ${v})`;
        i.debug(`${m} duplicated in blockmap ${p}, it doesn't lead to broken differential downloader, just corresponding block will be skipped)`);
      }
      o += v;
    }
    return { checksumToOffset: s, checksumToOldSize: r };
  }
  function l(a) {
    const d = /* @__PURE__ */ new Map();
    for (const i of a)
      d.set(i.name, i);
    return d;
  }
  return kt;
}
var ol;
function su() {
  if (ol) return $t;
  ol = 1, Object.defineProperty($t, "__esModule", { value: !0 }), $t.DataSplitter = void 0, $t.copyData = a;
  const t = ke(), f = gt, h = gr, u = ha(), c = Buffer.from(`\r
\r
`);
  var l;
  (function(i) {
    i[i.INIT = 0] = "INIT", i[i.HEADER = 1] = "HEADER", i[i.BODY = 2] = "BODY";
  })(l || (l = {}));
  function a(i, s, r, o, n) {
    const m = (0, f.createReadStream)("", {
      fd: r,
      autoClose: !1,
      start: i.start,
      // end is inclusive
      end: i.end - 1
    });
    m.on("error", o), m.once("end", n), m.pipe(s, {
      end: !1
    });
  }
  let d = class extends h.Writable {
    constructor(s, r, o, n, m, v) {
      super(), this.out = s, this.options = r, this.partIndexToTaskIndex = o, this.partIndexToLength = m, this.finishHandler = v, this.partIndex = -1, this.headerListBuffer = null, this.readState = l.INIT, this.ignoreByteCount = 0, this.remainingPartDataCount = 0, this.actualPartLength = 0, this.boundaryLength = n.length + 4, this.ignoreByteCount = this.boundaryLength - 2;
    }
    get isFinished() {
      return this.partIndex === this.partIndexToLength.length;
    }
    // noinspection JSUnusedGlobalSymbols
    _write(s, r, o) {
      if (this.isFinished) {
        console.error(`Trailing ignored data: ${s.length} bytes`);
        return;
      }
      this.handleData(s).then(o).catch(o);
    }
    async handleData(s) {
      let r = 0;
      if (this.ignoreByteCount !== 0 && this.remainingPartDataCount !== 0)
        throw (0, t.newError)("Internal error", "ERR_DATA_SPLITTER_BYTE_COUNT_MISMATCH");
      if (this.ignoreByteCount > 0) {
        const o = Math.min(this.ignoreByteCount, s.length);
        this.ignoreByteCount -= o, r = o;
      } else if (this.remainingPartDataCount > 0) {
        const o = Math.min(this.remainingPartDataCount, s.length);
        this.remainingPartDataCount -= o, await this.processPartData(s, 0, o), r = o;
      }
      if (r !== s.length) {
        if (this.readState === l.HEADER) {
          const o = this.searchHeaderListEnd(s, r);
          if (o === -1)
            return;
          r = o, this.readState = l.BODY, this.headerListBuffer = null;
        }
        for (; ; ) {
          if (this.readState === l.BODY)
            this.readState = l.INIT;
          else {
            this.partIndex++;
            let v = this.partIndexToTaskIndex.get(this.partIndex);
            if (v == null)
              if (this.isFinished)
                v = this.options.end;
              else
                throw (0, t.newError)("taskIndex is null", "ERR_DATA_SPLITTER_TASK_INDEX_IS_NULL");
            const y = this.partIndex === 0 ? this.options.start : this.partIndexToTaskIndex.get(this.partIndex - 1) + 1;
            if (y < v)
              await this.copyExistingData(y, v);
            else if (y > v)
              throw (0, t.newError)("prevTaskIndex must be < taskIndex", "ERR_DATA_SPLITTER_TASK_INDEX_ASSERT_FAILED");
            if (this.isFinished) {
              this.onPartEnd(), this.finishHandler();
              return;
            }
            if (r = this.searchHeaderListEnd(s, r), r === -1) {
              this.readState = l.HEADER;
              return;
            }
          }
          const o = this.partIndexToLength[this.partIndex], n = r + o, m = Math.min(n, s.length);
          if (await this.processPartStarted(s, r, m), this.remainingPartDataCount = o - (m - r), this.remainingPartDataCount > 0)
            return;
          if (r = n + this.boundaryLength, r >= s.length) {
            this.ignoreByteCount = this.boundaryLength - (s.length - n);
            return;
          }
        }
      }
    }
    copyExistingData(s, r) {
      return new Promise((o, n) => {
        const m = () => {
          if (s === r) {
            o();
            return;
          }
          const v = this.options.tasks[s];
          if (v.kind !== u.OperationKind.COPY) {
            n(new Error("Task kind must be COPY"));
            return;
          }
          a(v, this.out, this.options.oldFileFd, n, () => {
            s++, m();
          });
        };
        m();
      });
    }
    searchHeaderListEnd(s, r) {
      const o = s.indexOf(c, r);
      if (o !== -1)
        return o + c.length;
      const n = r === 0 ? s : s.slice(r);
      return this.headerListBuffer == null ? this.headerListBuffer = n : this.headerListBuffer = Buffer.concat([this.headerListBuffer, n]), -1;
    }
    onPartEnd() {
      const s = this.partIndexToLength[this.partIndex - 1];
      if (this.actualPartLength !== s)
        throw (0, t.newError)(`Expected length: ${s} differs from actual: ${this.actualPartLength}`, "ERR_DATA_SPLITTER_LENGTH_MISMATCH");
      this.actualPartLength = 0;
    }
    processPartStarted(s, r, o) {
      return this.partIndex !== 0 && this.onPartEnd(), this.processPartData(s, r, o);
    }
    processPartData(s, r, o) {
      this.actualPartLength += o - r;
      const n = this.out;
      return n.write(r === 0 && s.length === o ? s : s.slice(r, o)) ? Promise.resolve() : new Promise((m, v) => {
        n.on("error", v), n.once("drain", () => {
          n.removeListener("error", v), m();
        });
      });
    }
  };
  return $t.DataSplitter = d, $t;
}
var ar = {}, sl;
function Nf() {
  if (sl) return ar;
  sl = 1, Object.defineProperty(ar, "__esModule", { value: !0 }), ar.executeTasksUsingMultipleRangeRequests = u, ar.checkIsRangesSupported = l;
  const t = ke(), f = su(), h = ha();
  function u(a, d, i, s, r) {
    const o = (n) => {
      if (n >= d.length) {
        a.fileMetadataBuffer != null && i.write(a.fileMetadataBuffer), i.end();
        return;
      }
      const m = n + 1e3;
      c(a, {
        tasks: d,
        start: n,
        end: Math.min(d.length, m),
        oldFileFd: s
      }, i, () => o(m), r);
    };
    return o;
  }
  function c(a, d, i, s, r) {
    let o = "bytes=", n = 0;
    const m = /* @__PURE__ */ new Map(), v = [];
    for (let A = d.start; A < d.end; A++) {
      const R = d.tasks[A];
      R.kind === h.OperationKind.DOWNLOAD && (o += `${R.start}-${R.end - 1}, `, m.set(n, A), n++, v.push(R.end - R.start));
    }
    if (n <= 1) {
      const A = (R) => {
        if (R >= d.end) {
          s();
          return;
        }
        const P = d.tasks[R++];
        if (P.kind === h.OperationKind.COPY)
          (0, f.copyData)(P, i, d.oldFileFd, r, () => A(R));
        else {
          const O = a.createRequestOptions();
          O.headers.Range = `bytes=${P.start}-${P.end - 1}`;
          const M = a.httpExecutor.createRequest(O, (C) => {
            l(C, r) && (C.pipe(i, {
              end: !1
            }), C.once("end", () => A(R)));
          });
          a.httpExecutor.addErrorAndTimeoutHandlers(M, r), M.end();
        }
      };
      A(d.start);
      return;
    }
    const y = a.createRequestOptions();
    y.headers.Range = o.substring(0, o.length - 2);
    const p = a.httpExecutor.createRequest(y, (A) => {
      if (!l(A, r))
        return;
      const R = (0, t.safeGetHeader)(A, "content-type"), P = /^multipart\/.+?(?:; boundary=(?:(?:"(.+)")|(?:([^\s]+))))$/i.exec(R);
      if (P == null) {
        r(new Error(`Content-Type "multipart/byteranges" is expected, but got "${R}"`));
        return;
      }
      const O = new f.DataSplitter(i, d, m, P[1] || P[2], v, s);
      O.on("error", r), A.pipe(O), A.on("end", () => {
        setTimeout(() => {
          p.abort(), r(new Error("Response ends without calling any handlers"));
        }, 1e4);
      });
    });
    a.httpExecutor.addErrorAndTimeoutHandlers(p, r), p.end();
  }
  function l(a, d) {
    if (a.statusCode >= 400)
      return d((0, t.createHttpError)(a)), !1;
    if (a.statusCode !== 206) {
      const i = (0, t.safeGetHeader)(a, "accept-ranges");
      if (i == null || i === "none")
        return d(new Error(`Server doesn't support Accept-Ranges (response code ${a.statusCode})`)), !1;
    }
    return !0;
  }
  return ar;
}
var or = {}, ll;
function Ff() {
  if (ll) return or;
  ll = 1, Object.defineProperty(or, "__esModule", { value: !0 }), or.ProgressDifferentialDownloadCallbackTransform = void 0;
  const t = gr;
  var f;
  (function(u) {
    u[u.COPY = 0] = "COPY", u[u.DOWNLOAD = 1] = "DOWNLOAD";
  })(f || (f = {}));
  let h = class extends t.Transform {
    constructor(c, l, a) {
      super(), this.progressDifferentialDownloadInfo = c, this.cancellationToken = l, this.onProgress = a, this.start = Date.now(), this.transferred = 0, this.delta = 0, this.expectedBytes = 0, this.index = 0, this.operationType = f.COPY, this.nextUpdate = this.start + 1e3;
    }
    _transform(c, l, a) {
      if (this.cancellationToken.cancelled) {
        a(new Error("cancelled"), null);
        return;
      }
      if (this.operationType == f.COPY) {
        a(null, c);
        return;
      }
      this.transferred += c.length, this.delta += c.length;
      const d = Date.now();
      d >= this.nextUpdate && this.transferred !== this.expectedBytes && this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && (this.nextUpdate = d + 1e3, this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((d - this.start) / 1e3))
      }), this.delta = 0), a(null, c);
    }
    beginFileCopy() {
      this.operationType = f.COPY;
    }
    beginRangeDownload() {
      this.operationType = f.DOWNLOAD, this.expectedBytes += this.progressDifferentialDownloadInfo.expectedByteCounts[this.index++];
    }
    endRangeDownload() {
      this.transferred !== this.progressDifferentialDownloadInfo.grandTotal && this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: this.transferred / this.progressDifferentialDownloadInfo.grandTotal * 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      });
    }
    // Called when we are 100% done with the connection/download
    _flush(c) {
      if (this.cancellationToken.cancelled) {
        c(new Error("cancelled"));
        return;
      }
      this.onProgress({
        total: this.progressDifferentialDownloadInfo.grandTotal,
        delta: this.delta,
        transferred: this.transferred,
        percent: 100,
        bytesPerSecond: Math.round(this.transferred / ((Date.now() - this.start) / 1e3))
      }), this.delta = 0, this.transferred = 0, c(null);
    }
  };
  return or.ProgressDifferentialDownloadCallbackTransform = h, or;
}
var ul;
function lu() {
  if (ul) return ir;
  ul = 1, Object.defineProperty(ir, "__esModule", { value: !0 }), ir.DifferentialDownloader = void 0;
  const t = ke(), f = /* @__PURE__ */ vt(), h = gt, u = su(), c = qt, l = ha(), a = Nf(), d = Ff();
  let i = class {
    // noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected
    constructor(n, m, v) {
      this.blockAwareFileInfo = n, this.httpExecutor = m, this.options = v, this.fileMetadataBuffer = null, this.logger = v.logger;
    }
    createRequestOptions() {
      const n = {
        headers: {
          ...this.options.requestHeaders,
          accept: "*/*"
        }
      };
      return (0, t.configureRequestUrl)(this.options.newUrl, n), (0, t.configureRequestOptions)(n), n;
    }
    doDownload(n, m) {
      if (n.version !== m.version)
        throw new Error(`version is different (${n.version} - ${m.version}), full download is required`);
      const v = this.logger, y = (0, l.computeOperations)(n, m, v);
      v.debug != null && v.debug(JSON.stringify(y, null, 2));
      let p = 0, A = 0;
      for (const P of y) {
        const O = P.end - P.start;
        P.kind === l.OperationKind.DOWNLOAD ? p += O : A += O;
      }
      const R = this.blockAwareFileInfo.size;
      if (p + A + (this.fileMetadataBuffer == null ? 0 : this.fileMetadataBuffer.length) !== R)
        throw new Error(`Internal error, size mismatch: downloadSize: ${p}, copySize: ${A}, newSize: ${R}`);
      return v.info(`Full: ${s(R)}, To download: ${s(p)} (${Math.round(p / (R / 100))}%)`), this.downloadFile(y);
    }
    downloadFile(n) {
      const m = [], v = () => Promise.all(m.map((y) => (0, f.close)(y.descriptor).catch((p) => {
        this.logger.error(`cannot close file "${y.path}": ${p}`);
      })));
      return this.doDownloadFile(n, m).then(v).catch((y) => v().catch((p) => {
        try {
          this.logger.error(`cannot close files: ${p}`);
        } catch (A) {
          try {
            console.error(A);
          } catch {
          }
        }
        throw y;
      }).then(() => {
        throw y;
      }));
    }
    async doDownloadFile(n, m) {
      const v = await (0, f.open)(this.options.oldFile, "r");
      m.push({ descriptor: v, path: this.options.oldFile });
      const y = await (0, f.open)(this.options.newFile, "w");
      m.push({ descriptor: y, path: this.options.newFile });
      const p = (0, h.createWriteStream)(this.options.newFile, { fd: y });
      await new Promise((A, R) => {
        const P = [];
        let O;
        if (!this.options.isUseMultipleRangeRequest && this.options.onProgress) {
          const L = [];
          let k = 0;
          for (const D of n)
            D.kind === l.OperationKind.DOWNLOAD && (L.push(D.end - D.start), k += D.end - D.start);
          const N = {
            expectedByteCounts: L,
            grandTotal: k
          };
          O = new d.ProgressDifferentialDownloadCallbackTransform(N, this.options.cancellationToken, this.options.onProgress), P.push(O);
        }
        const M = new t.DigestTransform(this.blockAwareFileInfo.sha512);
        M.isValidateOnEnd = !1, P.push(M), p.on("finish", () => {
          p.close(() => {
            m.splice(1, 1);
            try {
              M.validate();
            } catch (L) {
              R(L);
              return;
            }
            A(void 0);
          });
        }), P.push(p);
        let C = null;
        for (const L of P)
          L.on("error", R), C == null ? C = L : C = C.pipe(L);
        const S = P[0];
        let T;
        if (this.options.isUseMultipleRangeRequest) {
          T = (0, a.executeTasksUsingMultipleRangeRequests)(this, n, S, v, R), T(0);
          return;
        }
        let E = 0, q = null;
        this.logger.info(`Differential download: ${this.options.newUrl}`);
        const U = this.createRequestOptions();
        U.redirect = "manual", T = (L) => {
          var k, N;
          if (L >= n.length) {
            this.fileMetadataBuffer != null && S.write(this.fileMetadataBuffer), S.end();
            return;
          }
          const D = n[L++];
          if (D.kind === l.OperationKind.COPY) {
            O && O.beginFileCopy(), (0, u.copyData)(D, S, v, R, () => T(L));
            return;
          }
          const F = `bytes=${D.start}-${D.end - 1}`;
          U.headers.range = F, (N = (k = this.logger) === null || k === void 0 ? void 0 : k.debug) === null || N === void 0 || N.call(k, `download range: ${F}`), O && O.beginRangeDownload();
          const $ = this.httpExecutor.createRequest(U, (J) => {
            J.on("error", R), J.on("aborted", () => {
              R(new Error("response has been aborted by the server"));
            }), J.statusCode >= 400 && R((0, t.createHttpError)(J)), J.pipe(S, {
              end: !1
            }), J.once("end", () => {
              O && O.endRangeDownload(), ++E === 100 ? (E = 0, setTimeout(() => T(L), 1e3)) : T(L);
            });
          });
          $.on("redirect", (J, W, ne) => {
            this.logger.info(`Redirect to ${r(ne)}`), q = ne, (0, t.configureRequestUrl)(new c.URL(q), U), $.followRedirect();
          }), this.httpExecutor.addErrorAndTimeoutHandlers($, R), $.end();
        }, T(0);
      });
    }
    async readRemoteBytes(n, m) {
      const v = Buffer.allocUnsafe(m + 1 - n), y = this.createRequestOptions();
      y.headers.range = `bytes=${n}-${m}`;
      let p = 0;
      if (await this.request(y, (A) => {
        A.copy(v, p), p += A.length;
      }), p !== v.length)
        throw new Error(`Received data length ${p} is not equal to expected ${v.length}`);
      return v;
    }
    request(n, m) {
      return new Promise((v, y) => {
        const p = this.httpExecutor.createRequest(n, (A) => {
          (0, a.checkIsRangesSupported)(A, y) && (A.on("error", y), A.on("aborted", () => {
            y(new Error("response has been aborted by the server"));
          }), A.on("data", m), A.on("end", () => v()));
        });
        this.httpExecutor.addErrorAndTimeoutHandlers(p, y), p.end();
      });
    }
  };
  ir.DifferentialDownloader = i;
  function s(o, n = " KB") {
    return new Intl.NumberFormat("en").format((o / 1024).toFixed(2)) + n;
  }
  function r(o) {
    const n = o.indexOf("?");
    return n < 0 ? o : o.substring(0, n);
  }
  return ir;
}
var cl;
function xf() {
  if (cl) return nr;
  cl = 1, Object.defineProperty(nr, "__esModule", { value: !0 }), nr.GenericDifferentialDownloader = void 0;
  const t = lu();
  let f = class extends t.DifferentialDownloader {
    download(u, c) {
      return this.doDownload(u, c);
    }
  };
  return nr.GenericDifferentialDownloader = f, nr;
}
var Ji = {}, fl;
function Nt() {
  return fl || (fl = 1, (function(t) {
    Object.defineProperty(t, "__esModule", { value: !0 }), t.UpdaterSignal = t.UPDATE_DOWNLOADED = t.DOWNLOAD_PROGRESS = t.CancellationToken = void 0, t.addHandler = u;
    const f = ke();
    Object.defineProperty(t, "CancellationToken", { enumerable: !0, get: function() {
      return f.CancellationToken;
    } }), t.DOWNLOAD_PROGRESS = "download-progress", t.UPDATE_DOWNLOADED = "update-downloaded";
    class h {
      constructor(l) {
        this.emitter = l;
      }
      /**
       * Emitted when an authenticating proxy is [asking for user credentials](https://github.com/electron/electron/blob/master/docs/api/client-request.md#event-login).
       */
      login(l) {
        u(this.emitter, "login", l);
      }
      progress(l) {
        u(this.emitter, t.DOWNLOAD_PROGRESS, l);
      }
      updateDownloaded(l) {
        u(this.emitter, t.UPDATE_DOWNLOADED, l);
      }
      updateCancelled(l) {
        u(this.emitter, "update-cancelled", l);
      }
    }
    t.UpdaterSignal = h;
    function u(c, l, a) {
      c.on(l, a);
    }
  })(Ji)), Ji;
}
var dl;
function pa() {
  if (dl) return Rt;
  dl = 1, Object.defineProperty(Rt, "__esModule", { value: !0 }), Rt.NoOpLogger = Rt.AppUpdater = void 0;
  const t = ke(), f = vr, h = Hr, u = Dl, c = /* @__PURE__ */ vt(), l = oa(), a = Kc(), d = Re, i = iu(), s = Af(), r = Rf(), o = Cf(), n = au(), m = Df(), v = Fl, y = Dt(), p = xf(), A = Nt();
  let R = class uu extends u.EventEmitter {
    /**
     * Get the update channel. Doesn't return `channel` from the update configuration, only if was previously set.
     */
    get channel() {
      return this._channel;
    }
    /**
     * Set the update channel. Overrides `channel` in the update configuration.
     *
     * `allowDowngrade` will be automatically set to `true`. If this behavior is not suitable for you, simple set `allowDowngrade` explicitly after.
     */
    set channel(C) {
      if (this._channel != null) {
        if (typeof C != "string")
          throw (0, t.newError)(`Channel must be a string, but got: ${C}`, "ERR_UPDATER_INVALID_CHANNEL");
        if (C.length === 0)
          throw (0, t.newError)("Channel must be not an empty string", "ERR_UPDATER_INVALID_CHANNEL");
      }
      this._channel = C, this.allowDowngrade = !0;
    }
    /**
     *  Shortcut for explicitly adding auth tokens to request headers
     */
    addAuthHeader(C) {
      this.requestHeaders = Object.assign({}, this.requestHeaders, {
        authorization: C
      });
    }
    // noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    get netSession() {
      return (0, o.getNetSession)();
    }
    /**
     * The logger. You can pass [electron-log](https://github.com/megahertz/electron-log), [winston](https://github.com/winstonjs/winston) or another logger with the following interface: `{ info(), warn(), error() }`.
     * Set it to `null` if you would like to disable a logging feature.
     */
    get logger() {
      return this._logger;
    }
    set logger(C) {
      this._logger = C ?? new O();
    }
    // noinspection JSUnusedGlobalSymbols
    /**
     * test only
     * @private
     */
    set updateConfigPath(C) {
      this.clientPromise = null, this._appUpdateConfigPath = C, this.configOnDisk = new a.Lazy(() => this.loadUpdateConfig());
    }
    /**
     * Allows developer to override default logic for determining if an update is supported.
     * The default logic compares the `UpdateInfo` minimum system version against the `os.release()` with `semver` package
     */
    get isUpdateSupported() {
      return this._isUpdateSupported;
    }
    set isUpdateSupported(C) {
      C && (this._isUpdateSupported = C);
    }
    constructor(C, S) {
      super(), this.autoDownload = !0, this.autoInstallOnAppQuit = !0, this.autoRunAppAfterInstall = !0, this.allowPrerelease = !1, this.fullChangelog = !1, this.allowDowngrade = !1, this.disableWebInstaller = !1, this.disableDifferentialDownload = !1, this.forceDevUpdateConfig = !1, this._channel = null, this.downloadedUpdateHelper = null, this.requestHeaders = null, this._logger = console, this.signals = new A.UpdaterSignal(this), this._appUpdateConfigPath = null, this._isUpdateSupported = (q) => this.checkIfUpdateSupported(q), this.clientPromise = null, this.stagingUserIdPromise = new a.Lazy(() => this.getOrCreateStagingUserId()), this.configOnDisk = new a.Lazy(() => this.loadUpdateConfig()), this.checkForUpdatesPromise = null, this.downloadPromise = null, this.updateInfoAndProvider = null, this._testOnlyOptions = null, this.on("error", (q) => {
        this._logger.error(`Error: ${q.stack || q.message}`);
      }), S == null ? (this.app = new r.ElectronAppAdapter(), this.httpExecutor = new o.ElectronHttpExecutor((q, U) => this.emit("login", q, U))) : (this.app = S, this.httpExecutor = null);
      const T = this.app.version, E = (0, i.parse)(T);
      if (E == null)
        throw (0, t.newError)(`App version is not a valid semver version: "${T}"`, "ERR_UPDATER_INVALID_VERSION");
      this.currentVersion = E, this.allowPrerelease = P(E), C != null && (this.setFeedURL(C), typeof C != "string" && C.requestHeaders && (this.requestHeaders = C.requestHeaders));
    }
    //noinspection JSMethodCanBeStatic,JSUnusedGlobalSymbols
    getFeedURL() {
      return "Deprecated. Do not use it.";
    }
    /**
     * Configure update provider. If value is `string`, [GenericServerOptions](./publish.md#genericserveroptions) will be set with value as `url`.
     * @param options If you want to override configuration in the `app-update.yml`.
     */
    setFeedURL(C) {
      const S = this.createProviderRuntimeOptions();
      let T;
      typeof C == "string" ? T = new n.GenericProvider({ provider: "generic", url: C }, this, {
        ...S,
        isUseMultipleRangeRequest: (0, m.isUrlProbablySupportMultiRangeRequests)(C)
      }) : T = (0, m.createClient)(C, this, S), this.clientPromise = Promise.resolve(T);
    }
    /**
     * Asks the server whether there is an update.
     * @returns null if the updater is disabled, otherwise info about the latest version
     */
    checkForUpdates() {
      if (!this.isUpdaterActive())
        return Promise.resolve(null);
      let C = this.checkForUpdatesPromise;
      if (C != null)
        return this._logger.info("Checking for update (already in progress)"), C;
      const S = () => this.checkForUpdatesPromise = null;
      return this._logger.info("Checking for update"), C = this.doCheckForUpdates().then((T) => (S(), T)).catch((T) => {
        throw S(), this.emit("error", T, `Cannot check for updates: ${(T.stack || T).toString()}`), T;
      }), this.checkForUpdatesPromise = C, C;
    }
    isUpdaterActive() {
      return this.app.isPackaged || this.forceDevUpdateConfig ? !0 : (this._logger.info("Skip checkForUpdates because application is not packed and dev update config is not forced"), !1);
    }
    // noinspection JSUnusedGlobalSymbols
    checkForUpdatesAndNotify(C) {
      return this.checkForUpdates().then((S) => S?.downloadPromise ? (S.downloadPromise.then(() => {
        const T = uu.formatDownloadNotification(S.updateInfo.version, this.app.name, C);
        new Ot.Notification(T).show();
      }), S) : (this._logger.debug != null && this._logger.debug("checkForUpdatesAndNotify called, downloadPromise is null"), S));
    }
    static formatDownloadNotification(C, S, T) {
      return T == null && (T = {
        title: "A new update is ready to install",
        body: "{appName} version {version} has been downloaded and will be automatically installed on exit"
      }), T = {
        title: T.title.replace("{appName}", S).replace("{version}", C),
        body: T.body.replace("{appName}", S).replace("{version}", C)
      }, T;
    }
    async isStagingMatch(C) {
      const S = C.stagingPercentage;
      let T = S;
      if (T == null)
        return !0;
      if (T = parseInt(T, 10), isNaN(T))
        return this._logger.warn(`Staging percentage is NaN: ${S}`), !0;
      T = T / 100;
      const E = await this.stagingUserIdPromise.value, U = t.UUID.parse(E).readUInt32BE(12) / 4294967295;
      return this._logger.info(`Staging percentage: ${T}, percentage: ${U}, user id: ${E}`), U < T;
    }
    computeFinalHeaders(C) {
      return this.requestHeaders != null && Object.assign(C, this.requestHeaders), C;
    }
    async isUpdateAvailable(C) {
      const S = (0, i.parse)(C.version);
      if (S == null)
        throw (0, t.newError)(`This file could not be downloaded, or the latest version (from update server) does not have a valid semver version: "${C.version}"`, "ERR_UPDATER_INVALID_VERSION");
      const T = this.currentVersion;
      if ((0, i.eq)(S, T) || !await Promise.resolve(this.isUpdateSupported(C)) || !await this.isStagingMatch(C))
        return !1;
      const q = (0, i.gt)(S, T), U = (0, i.lt)(S, T);
      return q ? !0 : this.allowDowngrade && U;
    }
    checkIfUpdateSupported(C) {
      const S = C?.minimumSystemVersion, T = (0, h.release)();
      if (S)
        try {
          if ((0, i.lt)(T, S))
            return this._logger.info(`Current OS version ${T} is less than the minimum OS version required ${S} for version ${T}`), !1;
        } catch (E) {
          this._logger.warn(`Failed to compare current OS version(${T}) with minimum OS version(${S}): ${(E.message || E).toString()}`);
        }
      return !0;
    }
    async getUpdateInfoAndProvider() {
      await this.app.whenReady(), this.clientPromise == null && (this.clientPromise = this.configOnDisk.value.then((T) => (0, m.createClient)(T, this, this.createProviderRuntimeOptions())));
      const C = await this.clientPromise, S = await this.stagingUserIdPromise.value;
      return C.setRequestHeaders(this.computeFinalHeaders({ "x-user-staging-id": S })), {
        info: await C.getLatestVersion(),
        provider: C
      };
    }
    createProviderRuntimeOptions() {
      return {
        isUseMultipleRangeRequest: !0,
        platform: this._testOnlyOptions == null ? process.platform : this._testOnlyOptions.platform,
        executor: this.httpExecutor
      };
    }
    async doCheckForUpdates() {
      this.emit("checking-for-update");
      const C = await this.getUpdateInfoAndProvider(), S = C.info;
      if (!await this.isUpdateAvailable(S))
        return this._logger.info(`Update for version ${this.currentVersion.format()} is not available (latest version: ${S.version}, downgrade is ${this.allowDowngrade ? "allowed" : "disallowed"}).`), this.emit("update-not-available", S), {
          isUpdateAvailable: !1,
          versionInfo: S,
          updateInfo: S
        };
      this.updateInfoAndProvider = C, this.onUpdateAvailable(S);
      const T = new t.CancellationToken();
      return {
        isUpdateAvailable: !0,
        versionInfo: S,
        updateInfo: S,
        cancellationToken: T,
        downloadPromise: this.autoDownload ? this.downloadUpdate(T) : null
      };
    }
    onUpdateAvailable(C) {
      this._logger.info(`Found version ${C.version} (url: ${(0, t.asArray)(C.files).map((S) => S.url).join(", ")})`), this.emit("update-available", C);
    }
    /**
     * Start downloading update manually. You can use this method if `autoDownload` option is set to `false`.
     * @returns {Promise<Array<string>>} Paths to downloaded files.
     */
    downloadUpdate(C = new t.CancellationToken()) {
      const S = this.updateInfoAndProvider;
      if (S == null) {
        const E = new Error("Please check update first");
        return this.dispatchError(E), Promise.reject(E);
      }
      if (this.downloadPromise != null)
        return this._logger.info("Downloading update (already in progress)"), this.downloadPromise;
      this._logger.info(`Downloading update from ${(0, t.asArray)(S.info.files).map((E) => E.url).join(", ")}`);
      const T = (E) => {
        if (!(E instanceof t.CancellationError))
          try {
            this.dispatchError(E);
          } catch (q) {
            this._logger.warn(`Cannot dispatch error event: ${q.stack || q}`);
          }
        return E;
      };
      return this.downloadPromise = this.doDownloadUpdate({
        updateInfoAndProvider: S,
        requestHeaders: this.computeRequestHeaders(S.provider),
        cancellationToken: C,
        disableWebInstaller: this.disableWebInstaller,
        disableDifferentialDownload: this.disableDifferentialDownload
      }).catch((E) => {
        throw T(E);
      }).finally(() => {
        this.downloadPromise = null;
      }), this.downloadPromise;
    }
    dispatchError(C) {
      this.emit("error", C, (C.stack || C).toString());
    }
    dispatchUpdateDownloaded(C) {
      this.emit(A.UPDATE_DOWNLOADED, C);
    }
    async loadUpdateConfig() {
      return this._appUpdateConfigPath == null && (this._appUpdateConfigPath = this.app.appUpdateConfigPath), (0, l.load)(await (0, c.readFile)(this._appUpdateConfigPath, "utf-8"));
    }
    computeRequestHeaders(C) {
      const S = C.fileExtraDownloadHeaders;
      if (S != null) {
        const T = this.requestHeaders;
        return T == null ? S : {
          ...S,
          ...T
        };
      }
      return this.computeFinalHeaders({ accept: "*/*" });
    }
    async getOrCreateStagingUserId() {
      const C = d.join(this.app.userDataPath, ".updaterId");
      try {
        const T = await (0, c.readFile)(C, "utf-8");
        if (t.UUID.check(T))
          return T;
        this._logger.warn(`Staging user id file exists, but content was invalid: ${T}`);
      } catch (T) {
        T.code !== "ENOENT" && this._logger.warn(`Couldn't read staging user ID, creating a blank one: ${T}`);
      }
      const S = t.UUID.v5((0, f.randomBytes)(4096), t.UUID.OID);
      this._logger.info(`Generated new staging user ID: ${S}`);
      try {
        await (0, c.outputFile)(C, S);
      } catch (T) {
        this._logger.warn(`Couldn't write out staging user ID: ${T}`);
      }
      return S;
    }
    /** @internal */
    get isAddNoCacheQuery() {
      const C = this.requestHeaders;
      if (C == null)
        return !0;
      for (const S of Object.keys(C)) {
        const T = S.toLowerCase();
        if (T === "authorization" || T === "private-token")
          return !1;
      }
      return !0;
    }
    async getOrCreateDownloadHelper() {
      let C = this.downloadedUpdateHelper;
      if (C == null) {
        const S = (await this.configOnDisk.value).updaterCacheDirName, T = this._logger;
        S == null && T.error("updaterCacheDirName is not specified in app-update.yml Was app build using at least electron-builder 20.34.0?");
        const E = d.join(this.app.baseCachePath, S || this.app.name);
        T.debug != null && T.debug(`updater cache dir: ${E}`), C = new s.DownloadedUpdateHelper(E), this.downloadedUpdateHelper = C;
      }
      return C;
    }
    async executeDownload(C) {
      const S = C.fileInfo, T = {
        headers: C.downloadUpdateOptions.requestHeaders,
        cancellationToken: C.downloadUpdateOptions.cancellationToken,
        sha2: S.info.sha2,
        sha512: S.info.sha512
      };
      this.listenerCount(A.DOWNLOAD_PROGRESS) > 0 && (T.onProgress = (ie) => this.emit(A.DOWNLOAD_PROGRESS, ie));
      const E = C.downloadUpdateOptions.updateInfoAndProvider.info, q = E.version, U = S.packageInfo;
      function L() {
        const ie = decodeURIComponent(C.fileInfo.url.pathname);
        return ie.endsWith(`.${C.fileExtension}`) ? d.basename(ie) : C.fileInfo.info.url;
      }
      const k = await this.getOrCreateDownloadHelper(), N = k.cacheDirForPendingUpdate;
      await (0, c.mkdir)(N, { recursive: !0 });
      const D = L();
      let F = d.join(N, D);
      const $ = U == null ? null : d.join(N, `package-${q}${d.extname(U.path) || ".7z"}`), J = async (ie) => (await k.setDownloadedFile(F, $, E, S, D, ie), await C.done({
        ...E,
        downloadedFile: F
      }), $ == null ? [F] : [F, $]), W = this._logger, ne = await k.validateDownloadedPath(F, E, S, W);
      if (ne != null)
        return F = ne, await J(!1);
      const ce = async () => (await k.clear().catch(() => {
      }), await (0, c.unlink)(F).catch(() => {
      })), ue = await (0, s.createTempUpdateFile)(`temp-${D}`, N, W);
      try {
        await C.task(ue, T, $, ce), await (0, t.retry)(() => (0, c.rename)(ue, F), 60, 500, 0, 0, (ie) => ie instanceof Error && /^EBUSY:/.test(ie.message));
      } catch (ie) {
        throw await ce(), ie instanceof t.CancellationError && (W.info("cancelled"), this.emit("update-cancelled", E)), ie;
      }
      return W.info(`New version ${q} has been downloaded to ${F}`), await J(!0);
    }
    async differentialDownloadInstaller(C, S, T, E, q) {
      try {
        if (this._testOnlyOptions != null && !this._testOnlyOptions.isUseDifferentialDownload)
          return !0;
        const U = (0, y.blockmapFiles)(C.url, this.app.version, S.updateInfoAndProvider.info.version);
        this._logger.info(`Download block maps (old: "${U[0]}", new: ${U[1]})`);
        const L = async (D) => {
          const F = await this.httpExecutor.downloadToBuffer(D, {
            headers: S.requestHeaders,
            cancellationToken: S.cancellationToken
          });
          if (F == null || F.length === 0)
            throw new Error(`Blockmap "${D.href}" is empty`);
          try {
            return JSON.parse((0, v.gunzipSync)(F).toString());
          } catch ($) {
            throw new Error(`Cannot parse blockmap "${D.href}", error: ${$}`);
          }
        }, k = {
          newUrl: C.url,
          oldFile: d.join(this.downloadedUpdateHelper.cacheDir, q),
          logger: this._logger,
          newFile: T,
          isUseMultipleRangeRequest: E.isUseMultipleRangeRequest,
          requestHeaders: S.requestHeaders,
          cancellationToken: S.cancellationToken
        };
        this.listenerCount(A.DOWNLOAD_PROGRESS) > 0 && (k.onProgress = (D) => this.emit(A.DOWNLOAD_PROGRESS, D));
        const N = await Promise.all(U.map((D) => L(D)));
        return await new p.GenericDifferentialDownloader(C.info, this.httpExecutor, k).download(N[0], N[1]), !1;
      } catch (U) {
        if (this._logger.error(`Cannot download differentially, fallback to full download: ${U.stack || U}`), this._testOnlyOptions != null)
          throw U;
        return !0;
      }
    }
  };
  Rt.AppUpdater = R;
  function P(M) {
    const C = (0, i.prerelease)(M);
    return C != null && C.length > 0;
  }
  class O {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    info(C) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    warn(C) {
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    error(C) {
    }
  }
  return Rt.NoOpLogger = O, Rt;
}
var hl;
function jt() {
  if (hl) return Vt;
  hl = 1, Object.defineProperty(Vt, "__esModule", { value: !0 }), Vt.BaseUpdater = void 0;
  const t = Br, f = pa();
  let h = class extends f.AppUpdater {
    constructor(c, l) {
      super(c, l), this.quitAndInstallCalled = !1, this.quitHandlerAdded = !1;
    }
    quitAndInstall(c = !1, l = !1) {
      this._logger.info("Install on explicit quitAndInstall"), this.install(c, c ? l : this.autoRunAppAfterInstall) ? setImmediate(() => {
        Ot.autoUpdater.emit("before-quit-for-update"), this.app.quit();
      }) : this.quitAndInstallCalled = !1;
    }
    executeDownload(c) {
      return super.executeDownload({
        ...c,
        done: (l) => (this.dispatchUpdateDownloaded(l), this.addQuitHandler(), Promise.resolve())
      });
    }
    get installerPath() {
      return this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.file;
    }
    // must be sync (because quit even handler is not async)
    install(c = !1, l = !1) {
      if (this.quitAndInstallCalled)
        return this._logger.warn("install call ignored: quitAndInstallCalled is set to true"), !1;
      const a = this.downloadedUpdateHelper, d = this.installerPath, i = a == null ? null : a.downloadedFileInfo;
      if (d == null || i == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      this.quitAndInstallCalled = !0;
      try {
        return this._logger.info(`Install: isSilent: ${c}, isForceRunAfter: ${l}`), this.doInstall({
          isSilent: c,
          isForceRunAfter: l,
          isAdminRightsRequired: i.isAdminRightsRequired
        });
      } catch (s) {
        return this.dispatchError(s), !1;
      }
    }
    addQuitHandler() {
      this.quitHandlerAdded || !this.autoInstallOnAppQuit || (this.quitHandlerAdded = !0, this.app.onQuit((c) => {
        if (this.quitAndInstallCalled) {
          this._logger.info("Update installer has already been triggered. Quitting application.");
          return;
        }
        if (!this.autoInstallOnAppQuit) {
          this._logger.info("Update will not be installed on quit because autoInstallOnAppQuit is set to false.");
          return;
        }
        if (c !== 0) {
          this._logger.info(`Update will be not installed on quit because application is quitting with exit code ${c}`);
          return;
        }
        this._logger.info("Auto install update on quit"), this.install(!0, !1);
      }));
    }
    wrapSudo() {
      const { name: c } = this.app, l = `"${c} would like to update"`, a = this.spawnSyncLog("which gksudo || which kdesudo || which pkexec || which beesu"), d = [a];
      return /kdesudo/i.test(a) ? (d.push("--comment", l), d.push("-c")) : /gksudo/i.test(a) ? d.push("--message", l) : /pkexec/i.test(a) && d.push("--disable-internal-agent"), d.join(" ");
    }
    spawnSyncLog(c, l = [], a = {}) {
      this._logger.info(`Executing: ${c} with args: ${l}`);
      const d = (0, t.spawnSync)(c, l, {
        env: { ...process.env, ...a },
        encoding: "utf-8",
        shell: !0
      }), { error: i, status: s, stdout: r, stderr: o } = d;
      if (i != null)
        throw this._logger.error(o), i;
      if (s != null && s !== 0)
        throw this._logger.error(o), new Error(`Command ${c} exited with code ${s}`);
      return r.trim();
    }
    /**
     * This handles both node 8 and node 10 way of emitting error when spawning a process
     *   - node 8: Throws the error
     *   - node 10: Emit the error(Need to listen with on)
     */
    // https://github.com/electron-userland/electron-builder/issues/1129
    // Node 8 sends errors: https://nodejs.org/dist/latest-v8.x/docs/api/errors.html#errors_common_system_errors
    async spawnLog(c, l = [], a = void 0, d = "ignore") {
      return this._logger.info(`Executing: ${c} with args: ${l}`), new Promise((i, s) => {
        try {
          const r = { stdio: d, env: a, detached: !0 }, o = (0, t.spawn)(c, l, r);
          o.on("error", (n) => {
            s(n);
          }), o.unref(), o.pid !== void 0 && i(!0);
        } catch (r) {
          s(r);
        }
      });
    }
  };
  return Vt.BaseUpdater = h, Vt;
}
var sr = {}, lr = {}, pl;
function cu() {
  if (pl) return lr;
  pl = 1, Object.defineProperty(lr, "__esModule", { value: !0 }), lr.FileWithEmbeddedBlockMapDifferentialDownloader = void 0;
  const t = /* @__PURE__ */ vt(), f = lu(), h = Fl;
  let u = class extends f.DifferentialDownloader {
    async download() {
      const d = this.blockAwareFileInfo, i = d.size, s = i - (d.blockMapSize + 4);
      this.fileMetadataBuffer = await this.readRemoteBytes(s, i - 1);
      const r = c(this.fileMetadataBuffer.slice(0, this.fileMetadataBuffer.length - 4));
      await this.doDownload(await l(this.options.oldFile), r);
    }
  };
  lr.FileWithEmbeddedBlockMapDifferentialDownloader = u;
  function c(a) {
    return JSON.parse((0, h.inflateRawSync)(a).toString());
  }
  async function l(a) {
    const d = await (0, t.open)(a, "r");
    try {
      const i = (await (0, t.fstat)(d)).size, s = Buffer.allocUnsafe(4);
      await (0, t.read)(d, s, 0, s.length, i - s.length);
      const r = Buffer.allocUnsafe(s.readUInt32BE(0));
      return await (0, t.read)(d, r, 0, r.length, i - s.length - r.length), await (0, t.close)(d), c(r);
    } catch (i) {
      throw await (0, t.close)(d), i;
    }
  }
  return lr;
}
var ml;
function gl() {
  if (ml) return sr;
  ml = 1, Object.defineProperty(sr, "__esModule", { value: !0 }), sr.AppImageUpdater = void 0;
  const t = ke(), f = Br, h = /* @__PURE__ */ vt(), u = gt, c = Re, l = jt(), a = cu(), d = Ke(), i = Nt();
  let s = class extends l.BaseUpdater {
    constructor(o, n) {
      super(o, n);
    }
    isUpdaterActive() {
      return process.env.APPIMAGE == null ? (process.env.SNAP == null ? this._logger.warn("APPIMAGE env is not defined, current application is not an AppImage") : this._logger.info("SNAP env is defined, updater is disabled"), !1) : super.isUpdaterActive();
    }
    /*** @private */
    doDownloadUpdate(o) {
      const n = o.updateInfoAndProvider.provider, m = (0, d.findFile)(n.resolveFiles(o.updateInfoAndProvider.info), "AppImage", ["rpm", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "AppImage",
        fileInfo: m,
        downloadUpdateOptions: o,
        task: async (v, y) => {
          const p = process.env.APPIMAGE;
          if (p == null)
            throw (0, t.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
          (o.disableDifferentialDownload || await this.downloadDifferential(m, p, v, n, o)) && await this.httpExecutor.download(m.url, v, y), await (0, h.chmod)(v, 493);
        }
      });
    }
    async downloadDifferential(o, n, m, v, y) {
      try {
        const p = {
          newUrl: o.url,
          oldFile: n,
          logger: this._logger,
          newFile: m,
          isUseMultipleRangeRequest: v.isUseMultipleRangeRequest,
          requestHeaders: y.requestHeaders,
          cancellationToken: y.cancellationToken
        };
        return this.listenerCount(i.DOWNLOAD_PROGRESS) > 0 && (p.onProgress = (A) => this.emit(i.DOWNLOAD_PROGRESS, A)), await new a.FileWithEmbeddedBlockMapDifferentialDownloader(o.info, this.httpExecutor, p).download(), !1;
      } catch (p) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${p.stack || p}`), process.platform === "linux";
      }
    }
    doInstall(o) {
      const n = process.env.APPIMAGE;
      if (n == null)
        throw (0, t.newError)("APPIMAGE env is not defined", "ERR_UPDATER_OLD_FILE_NOT_FOUND");
      (0, u.unlinkSync)(n);
      let m;
      const v = c.basename(n), y = this.installerPath;
      if (y == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      c.basename(y) === v || !/\d+\.\d+\.\d+/.test(v) ? m = n : m = c.join(c.dirname(n), c.basename(y)), (0, f.execFileSync)("mv", ["-f", y, m]), m !== n && this.emit("appimage-filename-updated", m);
      const p = {
        ...process.env,
        APPIMAGE_SILENT_INSTALL: "true"
      };
      return o.isForceRunAfter ? this.spawnLog(m, [], p) : (p.APPIMAGE_EXIT_AFTER_INSTALL = "true", (0, f.execFileSync)(m, [], { env: p })), !0;
    }
  };
  return sr.AppImageUpdater = s, sr;
}
var ur = {}, vl;
function El() {
  if (vl) return ur;
  vl = 1, Object.defineProperty(ur, "__esModule", { value: !0 }), ur.DebUpdater = void 0;
  const t = jt(), f = Ke(), h = Nt();
  let u = class extends t.BaseUpdater {
    constructor(l, a) {
      super(l, a);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const a = l.updateInfoAndProvider.provider, d = (0, f.findFile)(a.resolveFiles(l.updateInfoAndProvider.info), "deb", ["AppImage", "rpm", "pacman"]);
      return this.executeDownload({
        fileExtension: "deb",
        fileInfo: d,
        downloadUpdateOptions: l,
        task: async (i, s) => {
          this.listenerCount(h.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (r) => this.emit(h.DOWNLOAD_PROGRESS, r)), await this.httpExecutor.download(d.url, i, s);
        }
      });
    }
    get installerPath() {
      var l, a;
      return (a = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && a !== void 0 ? a : null;
    }
    doInstall(l) {
      const a = this.wrapSudo(), d = /pkexec/i.test(a) ? "" : '"', i = this.installerPath;
      if (i == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const s = ["dpkg", "-i", i, "||", "apt-get", "install", "-f", "-y"];
      return this.spawnSyncLog(a, [`${d}/bin/bash`, "-c", `'${s.join(" ")}'${d}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return ur.DebUpdater = u, ur;
}
var cr = {}, yl;
function wl() {
  if (yl) return cr;
  yl = 1, Object.defineProperty(cr, "__esModule", { value: !0 }), cr.PacmanUpdater = void 0;
  const t = jt(), f = Nt(), h = Ke();
  let u = class extends t.BaseUpdater {
    constructor(l, a) {
      super(l, a);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const a = l.updateInfoAndProvider.provider, d = (0, h.findFile)(a.resolveFiles(l.updateInfoAndProvider.info), "pacman", ["AppImage", "deb", "rpm"]);
      return this.executeDownload({
        fileExtension: "pacman",
        fileInfo: d,
        downloadUpdateOptions: l,
        task: async (i, s) => {
          this.listenerCount(f.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (r) => this.emit(f.DOWNLOAD_PROGRESS, r)), await this.httpExecutor.download(d.url, i, s);
        }
      });
    }
    get installerPath() {
      var l, a;
      return (a = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && a !== void 0 ? a : null;
    }
    doInstall(l) {
      const a = this.wrapSudo(), d = /pkexec/i.test(a) ? "" : '"', i = this.installerPath;
      if (i == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const s = ["pacman", "-U", "--noconfirm", i];
      return this.spawnSyncLog(a, [`${d}/bin/bash`, "-c", `'${s.join(" ")}'${d}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return cr.PacmanUpdater = u, cr;
}
var fr = {}, _l;
function Sl() {
  if (_l) return fr;
  _l = 1, Object.defineProperty(fr, "__esModule", { value: !0 }), fr.RpmUpdater = void 0;
  const t = jt(), f = Nt(), h = Ke();
  let u = class extends t.BaseUpdater {
    constructor(l, a) {
      super(l, a);
    }
    /*** @private */
    doDownloadUpdate(l) {
      const a = l.updateInfoAndProvider.provider, d = (0, h.findFile)(a.resolveFiles(l.updateInfoAndProvider.info), "rpm", ["AppImage", "deb", "pacman"]);
      return this.executeDownload({
        fileExtension: "rpm",
        fileInfo: d,
        downloadUpdateOptions: l,
        task: async (i, s) => {
          this.listenerCount(f.DOWNLOAD_PROGRESS) > 0 && (s.onProgress = (r) => this.emit(f.DOWNLOAD_PROGRESS, r)), await this.httpExecutor.download(d.url, i, s);
        }
      });
    }
    get installerPath() {
      var l, a;
      return (a = (l = super.installerPath) === null || l === void 0 ? void 0 : l.replace(/ /g, "\\ ")) !== null && a !== void 0 ? a : null;
    }
    doInstall(l) {
      const a = this.wrapSudo(), d = /pkexec/i.test(a) ? "" : '"', i = this.spawnSyncLog("which zypper"), s = this.installerPath;
      if (s == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      let r;
      return i ? r = [i, "--no-refresh", "install", "--allow-unsigned-rpm", "-y", "-f", s] : r = [this.spawnSyncLog("which dnf || which yum"), "-y", "install", s], this.spawnSyncLog(a, [`${d}/bin/bash`, "-c", `'${r.join(" ")}'${d}`]), l.isForceRunAfter && this.app.relaunch(), !0;
    }
  };
  return fr.RpmUpdater = u, fr;
}
var dr = {}, Al;
function Tl() {
  if (Al) return dr;
  Al = 1, Object.defineProperty(dr, "__esModule", { value: !0 }), dr.MacUpdater = void 0;
  const t = ke(), f = /* @__PURE__ */ vt(), h = gt, u = Re, c = uc, l = pa(), a = Ke(), d = Br, i = vr;
  let s = class extends l.AppUpdater {
    constructor(o, n) {
      super(o, n), this.nativeUpdater = Ot.autoUpdater, this.squirrelDownloadedUpdate = !1, this.nativeUpdater.on("error", (m) => {
        this._logger.warn(m), this.emit("error", m);
      }), this.nativeUpdater.on("update-downloaded", () => {
        this.squirrelDownloadedUpdate = !0, this.debug("nativeUpdater.update-downloaded");
      });
    }
    debug(o) {
      this._logger.debug != null && this._logger.debug(o);
    }
    closeServerIfExists() {
      this.server && (this.debug("Closing proxy server"), this.server.close((o) => {
        o && this.debug("proxy server wasn't already open, probably attempted closing again as a safety check before quit");
      }));
    }
    async doDownloadUpdate(o) {
      let n = o.updateInfoAndProvider.provider.resolveFiles(o.updateInfoAndProvider.info);
      const m = this._logger, v = "sysctl.proc_translated";
      let y = !1;
      try {
        this.debug("Checking for macOS Rosetta environment"), y = (0, d.execFileSync)("sysctl", [v], { encoding: "utf8" }).includes(`${v}: 1`), m.info(`Checked for macOS Rosetta environment (isRosetta=${y})`);
      } catch (M) {
        m.warn(`sysctl shell command to check for macOS Rosetta environment failed: ${M}`);
      }
      let p = !1;
      try {
        this.debug("Checking for arm64 in uname");
        const C = (0, d.execFileSync)("uname", ["-a"], { encoding: "utf8" }).includes("ARM");
        m.info(`Checked 'uname -a': arm64=${C}`), p = p || C;
      } catch (M) {
        m.warn(`uname shell command to check for arm64 failed: ${M}`);
      }
      p = p || process.arch === "arm64" || y;
      const A = (M) => {
        var C;
        return M.url.pathname.includes("arm64") || ((C = M.info.url) === null || C === void 0 ? void 0 : C.includes("arm64"));
      };
      p && n.some(A) ? n = n.filter((M) => p === A(M)) : n = n.filter((M) => !A(M));
      const R = (0, a.findFile)(n, "zip", ["pkg", "dmg"]);
      if (R == null)
        throw (0, t.newError)(`ZIP file not provided: ${(0, t.safeStringifyJson)(n)}`, "ERR_UPDATER_ZIP_FILE_NOT_FOUND");
      const P = o.updateInfoAndProvider.provider, O = "update.zip";
      return this.executeDownload({
        fileExtension: "zip",
        fileInfo: R,
        downloadUpdateOptions: o,
        task: async (M, C) => {
          const S = u.join(this.downloadedUpdateHelper.cacheDir, O), T = () => (0, f.pathExistsSync)(S) ? !o.disableDifferentialDownload : (m.info("Unable to locate previous update.zip for differential download (is this first install?), falling back to full download"), !1);
          let E = !0;
          T() && (E = await this.differentialDownloadInstaller(R, o, M, P, O)), E && await this.httpExecutor.download(R.url, M, C);
        },
        done: async (M) => {
          if (!o.disableDifferentialDownload)
            try {
              const C = u.join(this.downloadedUpdateHelper.cacheDir, O);
              await (0, f.copyFile)(M.downloadedFile, C);
            } catch (C) {
              this._logger.warn(`Unable to copy file for caching for future differential downloads: ${C.message}`);
            }
          return this.updateDownloaded(R, M);
        }
      });
    }
    async updateDownloaded(o, n) {
      var m;
      const v = n.downloadedFile, y = (m = o.info.size) !== null && m !== void 0 ? m : (await (0, f.stat)(v)).size, p = this._logger, A = `fileToProxy=${o.url.href}`;
      this.closeServerIfExists(), this.debug(`Creating proxy server for native Squirrel.Mac (${A})`), this.server = (0, c.createServer)(), this.debug(`Proxy server for native Squirrel.Mac is created (${A})`), this.server.on("close", () => {
        p.info(`Proxy server for native Squirrel.Mac is closed (${A})`);
      });
      const R = (P) => {
        const O = P.address();
        return typeof O == "string" ? O : `http://127.0.0.1:${O?.port}`;
      };
      return await new Promise((P, O) => {
        const M = (0, i.randomBytes)(64).toString("base64").replace(/\//g, "_").replace(/\+/g, "-"), C = Buffer.from(`autoupdater:${M}`, "ascii"), S = `/${(0, i.randomBytes)(64).toString("hex")}.zip`;
        this.server.on("request", (T, E) => {
          const q = T.url;
          if (p.info(`${q} requested`), q === "/") {
            if (!T.headers.authorization || T.headers.authorization.indexOf("Basic ") === -1) {
              E.statusCode = 401, E.statusMessage = "Invalid Authentication Credentials", E.end(), p.warn("No authenthication info");
              return;
            }
            const k = T.headers.authorization.split(" ")[1], N = Buffer.from(k, "base64").toString("ascii"), [D, F] = N.split(":");
            if (D !== "autoupdater" || F !== M) {
              E.statusCode = 401, E.statusMessage = "Invalid Authentication Credentials", E.end(), p.warn("Invalid authenthication credentials");
              return;
            }
            const $ = Buffer.from(`{ "url": "${R(this.server)}${S}" }`);
            E.writeHead(200, { "Content-Type": "application/json", "Content-Length": $.length }), E.end($);
            return;
          }
          if (!q.startsWith(S)) {
            p.warn(`${q} requested, but not supported`), E.writeHead(404), E.end();
            return;
          }
          p.info(`${S} requested by Squirrel.Mac, pipe ${v}`);
          let U = !1;
          E.on("finish", () => {
            U || (this.nativeUpdater.removeListener("error", O), P([]));
          });
          const L = (0, h.createReadStream)(v);
          L.on("error", (k) => {
            try {
              E.end();
            } catch (N) {
              p.warn(`cannot end response: ${N}`);
            }
            U = !0, this.nativeUpdater.removeListener("error", O), O(new Error(`Cannot pipe "${v}": ${k}`));
          }), E.writeHead(200, {
            "Content-Type": "application/zip",
            "Content-Length": y
          }), L.pipe(E);
        }), this.debug(`Proxy server for native Squirrel.Mac is starting to listen (${A})`), this.server.listen(0, "127.0.0.1", () => {
          this.debug(`Proxy server for native Squirrel.Mac is listening (address=${R(this.server)}, ${A})`), this.nativeUpdater.setFeedURL({
            url: R(this.server),
            headers: {
              "Cache-Control": "no-cache",
              Authorization: `Basic ${C.toString("base64")}`
            }
          }), this.dispatchUpdateDownloaded(n), this.autoInstallOnAppQuit ? (this.nativeUpdater.once("error", O), this.nativeUpdater.checkForUpdates()) : P([]);
        });
      });
    }
    handleUpdateDownloaded() {
      this.autoRunAppAfterInstall ? this.nativeUpdater.quitAndInstall() : this.app.quit(), this.closeServerIfExists();
    }
    quitAndInstall() {
      this.squirrelDownloadedUpdate ? this.handleUpdateDownloaded() : (this.nativeUpdater.on("update-downloaded", () => this.handleUpdateDownloaded()), this.autoInstallOnAppQuit || this.nativeUpdater.checkForUpdates());
    }
  };
  return dr.MacUpdater = s, dr;
}
var hr = {}, qr = {}, Rl;
function Lf() {
  if (Rl) return qr;
  Rl = 1, Object.defineProperty(qr, "__esModule", { value: !0 }), qr.verifySignature = c;
  const t = ke(), f = Br, h = Hr, u = Re;
  function c(i, s, r) {
    return new Promise((o, n) => {
      const m = s.replace(/'/g, "''");
      r.info(`Verifying signature ${m}`), (0, f.execFile)('set "PSModulePath=" & chcp 65001 >NUL & powershell.exe', ["-NoProfile", "-NonInteractive", "-InputFormat", "None", "-Command", `"Get-AuthenticodeSignature -LiteralPath '${m}' | ConvertTo-Json -Compress"`], {
        shell: !0,
        timeout: 20 * 1e3
      }, (v, y, p) => {
        var A;
        try {
          if (v != null || p) {
            a(r, v, p, n), o(null);
            return;
          }
          const R = l(y);
          if (R.Status === 0) {
            try {
              const C = u.normalize(R.Path), S = u.normalize(s);
              if (r.info(`LiteralPath: ${C}. Update Path: ${S}`), C !== S) {
                a(r, new Error(`LiteralPath of ${C} is different than ${S}`), p, n), o(null);
                return;
              }
            } catch (C) {
              r.warn(`Unable to verify LiteralPath of update asset due to missing data.Path. Skipping this step of validation. Message: ${(A = C.message) !== null && A !== void 0 ? A : C.stack}`);
            }
            const O = (0, t.parseDn)(R.SignerCertificate.Subject);
            let M = !1;
            for (const C of i) {
              const S = (0, t.parseDn)(C);
              if (S.size ? M = Array.from(S.keys()).every((E) => S.get(E) === O.get(E)) : C === O.get("CN") && (r.warn(`Signature validated using only CN ${C}. Please add your full Distinguished Name (DN) to publisherNames configuration`), M = !0), M) {
                o(null);
                return;
              }
            }
          }
          const P = `publisherNames: ${i.join(" | ")}, raw info: ` + JSON.stringify(R, (O, M) => O === "RawData" ? void 0 : M, 2);
          r.warn(`Sign verification failed, installer signed with incorrect certificate: ${P}`), o(P);
        } catch (R) {
          a(r, R, null, n), o(null);
          return;
        }
      });
    });
  }
  function l(i) {
    const s = JSON.parse(i);
    delete s.PrivateKey, delete s.IsOSBinary, delete s.SignatureType;
    const r = s.SignerCertificate;
    return r != null && (delete r.Archived, delete r.Extensions, delete r.Handle, delete r.HasPrivateKey, delete r.SubjectName), s;
  }
  function a(i, s, r, o) {
    if (d()) {
      i.warn(`Cannot execute Get-AuthenticodeSignature: ${s || r}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    try {
      (0, f.execFileSync)("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "ConvertTo-Json test"], { timeout: 10 * 1e3 });
    } catch (n) {
      i.warn(`Cannot execute ConvertTo-Json: ${n.message}. Ignoring signature validation due to unsupported powershell version. Please upgrade to powershell 3 or higher.`);
      return;
    }
    s != null && o(s), r && o(new Error(`Cannot execute Get-AuthenticodeSignature, stderr: ${r}. Failing signature validation due to unknown stderr.`));
  }
  function d() {
    const i = h.release();
    return i.startsWith("6.") && !i.startsWith("6.3");
  }
  return qr;
}
var Cl;
function bl() {
  if (Cl) return hr;
  Cl = 1, Object.defineProperty(hr, "__esModule", { value: !0 }), hr.NsisUpdater = void 0;
  const t = ke(), f = Re, h = jt(), u = cu(), c = Nt(), l = Ke(), a = /* @__PURE__ */ vt(), d = Lf(), i = qt;
  let s = class extends h.BaseUpdater {
    constructor(o, n) {
      super(o, n), this._verifyUpdateCodeSignature = (m, v) => (0, d.verifySignature)(m, v, this._logger);
    }
    /**
     * The verifyUpdateCodeSignature. You can pass [win-verify-signature](https://github.com/beyondkmp/win-verify-trust) or another custom verify function: ` (publisherName: string[], path: string) => Promise<string | null>`.
     * The default verify function uses [windowsExecutableCodeSignatureVerifier](https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/windowsExecutableCodeSignatureVerifier.ts)
     */
    get verifyUpdateCodeSignature() {
      return this._verifyUpdateCodeSignature;
    }
    set verifyUpdateCodeSignature(o) {
      o && (this._verifyUpdateCodeSignature = o);
    }
    /*** @private */
    doDownloadUpdate(o) {
      const n = o.updateInfoAndProvider.provider, m = (0, l.findFile)(n.resolveFiles(o.updateInfoAndProvider.info), "exe");
      return this.executeDownload({
        fileExtension: "exe",
        downloadUpdateOptions: o,
        fileInfo: m,
        task: async (v, y, p, A) => {
          const R = m.packageInfo, P = R != null && p != null;
          if (P && o.disableWebInstaller)
            throw (0, t.newError)(`Unable to download new version ${o.updateInfoAndProvider.info.version}. Web Installers are disabled`, "ERR_UPDATER_WEB_INSTALLER_DISABLED");
          !P && !o.disableWebInstaller && this._logger.warn("disableWebInstaller is set to false, you should set it to true if you do not plan on using a web installer. This will default to true in a future version."), (P || o.disableDifferentialDownload || await this.differentialDownloadInstaller(m, o, v, n, t.CURRENT_APP_INSTALLER_FILE_NAME)) && await this.httpExecutor.download(m.url, v, y);
          const O = await this.verifySignature(v);
          if (O != null)
            throw await A(), (0, t.newError)(`New version ${o.updateInfoAndProvider.info.version} is not signed by the application owner: ${O}`, "ERR_UPDATER_INVALID_SIGNATURE");
          if (P && await this.differentialDownloadWebPackage(o, R, p, n))
            try {
              await this.httpExecutor.download(new i.URL(R.path), p, {
                headers: o.requestHeaders,
                cancellationToken: o.cancellationToken,
                sha512: R.sha512
              });
            } catch (M) {
              try {
                await (0, a.unlink)(p);
              } catch {
              }
              throw M;
            }
        }
      });
    }
    // $certificateInfo = (Get-AuthenticodeSignature 'xxx\yyy.exe'
    // | where {$_.Status.Equals([System.Management.Automation.SignatureStatus]::Valid) -and $_.SignerCertificate.Subject.Contains("CN=siemens.com")})
    // | Out-String ; if ($certificateInfo) { exit 0 } else { exit 1 }
    async verifySignature(o) {
      let n;
      try {
        if (n = (await this.configOnDisk.value).publisherName, n == null)
          return null;
      } catch (m) {
        if (m.code === "ENOENT")
          return null;
        throw m;
      }
      return await this._verifyUpdateCodeSignature(Array.isArray(n) ? n : [n], o);
    }
    doInstall(o) {
      const n = this.installerPath;
      if (n == null)
        return this.dispatchError(new Error("No valid update available, can't quit and install")), !1;
      const m = ["--updated"];
      o.isSilent && m.push("/S"), o.isForceRunAfter && m.push("--force-run"), this.installDirectory && m.push(`/D=${this.installDirectory}`);
      const v = this.downloadedUpdateHelper == null ? null : this.downloadedUpdateHelper.packageFile;
      v != null && m.push(`--package-file=${v}`);
      const y = () => {
        this.spawnLog(f.join(process.resourcesPath, "elevate.exe"), [n].concat(m)).catch((p) => this.dispatchError(p));
      };
      return o.isAdminRightsRequired ? (this._logger.info("isAdminRightsRequired is set to true, run installer using elevate.exe"), y(), !0) : (this.spawnLog(n, m).catch((p) => {
        const A = p.code;
        this._logger.info(`Cannot run installer: error code: ${A}, error message: "${p.message}", will be executed again using elevate if EACCES, and will try to use electron.shell.openItem if ENOENT`), A === "UNKNOWN" || A === "EACCES" ? y() : A === "ENOENT" ? Ot.shell.openPath(n).catch((R) => this.dispatchError(R)) : this.dispatchError(p);
      }), !0);
    }
    async differentialDownloadWebPackage(o, n, m, v) {
      if (n.blockMapSize == null)
        return !0;
      try {
        const y = {
          newUrl: new i.URL(n.path),
          oldFile: f.join(this.downloadedUpdateHelper.cacheDir, t.CURRENT_APP_PACKAGE_FILE_NAME),
          logger: this._logger,
          newFile: m,
          requestHeaders: this.requestHeaders,
          isUseMultipleRangeRequest: v.isUseMultipleRangeRequest,
          cancellationToken: o.cancellationToken
        };
        this.listenerCount(c.DOWNLOAD_PROGRESS) > 0 && (y.onProgress = (p) => this.emit(c.DOWNLOAD_PROGRESS, p)), await new u.FileWithEmbeddedBlockMapDifferentialDownloader(n, this.httpExecutor, y).download();
      } catch (y) {
        return this._logger.error(`Cannot download differentially, fallback to full download: ${y.stack || y}`), process.platform === "win32";
      }
      return !1;
    }
  };
  return hr.NsisUpdater = s, hr;
}
var Pl;
function Uf() {
  return Pl || (Pl = 1, (function(t) {
    var f = Tt && Tt.__createBinding || (Object.create ? (function(p, A, R, P) {
      P === void 0 && (P = R);
      var O = Object.getOwnPropertyDescriptor(A, R);
      (!O || ("get" in O ? !A.__esModule : O.writable || O.configurable)) && (O = { enumerable: !0, get: function() {
        return A[R];
      } }), Object.defineProperty(p, P, O);
    }) : (function(p, A, R, P) {
      P === void 0 && (P = R), p[P] = A[R];
    })), h = Tt && Tt.__exportStar || function(p, A) {
      for (var R in p) R !== "default" && !Object.prototype.hasOwnProperty.call(A, R) && f(A, p, R);
    };
    Object.defineProperty(t, "__esModule", { value: !0 }), t.NsisUpdater = t.MacUpdater = t.RpmUpdater = t.PacmanUpdater = t.DebUpdater = t.AppImageUpdater = t.Provider = t.NoOpLogger = t.AppUpdater = t.BaseUpdater = void 0;
    const u = /* @__PURE__ */ vt(), c = Re;
    var l = jt();
    Object.defineProperty(t, "BaseUpdater", { enumerable: !0, get: function() {
      return l.BaseUpdater;
    } });
    var a = pa();
    Object.defineProperty(t, "AppUpdater", { enumerable: !0, get: function() {
      return a.AppUpdater;
    } }), Object.defineProperty(t, "NoOpLogger", { enumerable: !0, get: function() {
      return a.NoOpLogger;
    } });
    var d = Ke();
    Object.defineProperty(t, "Provider", { enumerable: !0, get: function() {
      return d.Provider;
    } });
    var i = gl();
    Object.defineProperty(t, "AppImageUpdater", { enumerable: !0, get: function() {
      return i.AppImageUpdater;
    } });
    var s = El();
    Object.defineProperty(t, "DebUpdater", { enumerable: !0, get: function() {
      return s.DebUpdater;
    } });
    var r = wl();
    Object.defineProperty(t, "PacmanUpdater", { enumerable: !0, get: function() {
      return r.PacmanUpdater;
    } });
    var o = Sl();
    Object.defineProperty(t, "RpmUpdater", { enumerable: !0, get: function() {
      return o.RpmUpdater;
    } });
    var n = Tl();
    Object.defineProperty(t, "MacUpdater", { enumerable: !0, get: function() {
      return n.MacUpdater;
    } });
    var m = bl();
    Object.defineProperty(t, "NsisUpdater", { enumerable: !0, get: function() {
      return m.NsisUpdater;
    } }), h(Nt(), t);
    let v;
    function y() {
      if (process.platform === "win32")
        v = new (bl()).NsisUpdater();
      else if (process.platform === "darwin")
        v = new (Tl()).MacUpdater();
      else {
        v = new (gl()).AppImageUpdater();
        try {
          const p = c.join(process.resourcesPath, "package-type");
          if (!(0, u.existsSync)(p))
            return v;
          console.info("Checking for beta autoupdate feature for deb/rpm distributions");
          const A = (0, u.readFileSync)(p).toString().trim();
          switch (console.info("Found package-type:", A), A) {
            case "deb":
              v = new (El()).DebUpdater();
              break;
            case "rpm":
              v = new (Sl()).RpmUpdater();
              break;
            case "pacman":
              v = new (wl()).PacmanUpdater();
              break;
            default:
              break;
          }
        } catch (p) {
          console.warn("Unable to detect 'package-type' for autoUpdater (beta rpm/deb support). If you'd like to expand support, please consider contributing to electron-builder", p.message);
        }
      }
      return v;
    }
    Object.defineProperty(t, "autoUpdater", {
      enumerable: !0,
      get: () => v || y()
    });
  })(Tt)), Tt;
}
var tt = Uf();
const $f = sc(import.meta.url), Mr = Re.dirname($f), Zi = process.env.NODE_ENV === "development";
tt.autoUpdater.autoDownload = !1;
tt.autoUpdater.autoInstallOnAppQuit = !0;
let Oe, Ze = null;
function Qi(t, f, h) {
  if (console.log(`[PROGRESS] ${t}: ${f}% - ${h}`), Oe && Oe.webContents && !Oe.isDestroyed())
    try {
      Oe.webContents.send("backend-progress", { phase: t, progress: f, message: h }), console.log(`[IPC] Sent progress update to renderer: ${t}`);
    } catch (u) {
      console.error("[IPC] Failed to send progress update:", u);
    }
  else
    console.warn("[IPC] Main window not ready, cannot send progress update");
}
function kf() {
  const t = process.env.NODE_ENV === "development", f = ut.isPackaged;
  if (t || !f) {
    const u = Re.join(Mr, "../../backend"), c = Re.join(u, "venv", "Scripts", "python.exe"), l = Re.join(u, "run.py");
    console.log("Starting backend server in DEV mode..."), console.log("Backend path:", u), console.log("Python executable:", c), console.log("Run script:", l), Ze = Ca(c, [l], {
      cwd: u,
      stdio: ["pipe", "pipe", "pipe"],
      shell: !0
    });
  } else {
    const u = Re.join(process.resourcesPath, "resources", "sentra-backend.exe");
    console.log("Starting backend server in PRODUCTION mode..."), console.log("Backend executable:", u), Ze = Ca(u, [], {
      stdio: ["pipe", "pipe", "pipe"],
      shell: !1
    });
  }
  [
    { phase: "initializing", progress: 25, message: "Initializing system...", delay: 0 },
    { phase: "server", progress: 50, message: "Starting backend services...", delay: 2e3 },
    { phase: "database", progress: 75, message: "Setting up database...", delay: 4e3 },
    { phase: "ready", progress: 100, message: "Backend ready!", delay: 6e3 }
  ].forEach(({ phase: u, progress: c, message: l, delay: a }) => {
    setTimeout(() => {
      Qi(u, c, l);
    }, a);
  }), Ze.stdout.on("data", (u) => {
    const c = u.toString();
    console.log("Backend stdout:", c);
  }), Ze.stderr.on("data", (u) => {
    const c = u.toString();
    console.error("Backend stderr:", c);
  }), Ze.on("close", (u) => {
    console.log(`Backend process exited with code ${u}`), u !== 0 && Qi("error", 0, `Backend failed to start (exit code: ${u})`);
  }), Ze.on("error", (u) => {
    console.error("Failed to start backend process:", u), Qi("error", 0, "Failed to start backend process");
  }), setTimeout(() => {
    console.log("Backend server should be running on http://127.0.0.1:5000");
  }, 5e3);
}
function qf() {
  Ze && (console.log("Stopping backend server..."), Ze.kill("SIGTERM"), setTimeout(() => {
    Ze.killed || Ze.kill("SIGKILL");
  }, 5e3), Ze = null);
}
function fu() {
  Oe = new Ol({
    width: 1400,
    height: 900,
    minWidth: 1e3,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      enableRemoteModule: !1,
      preload: Re.join(Mr, "preload.js")
    },
    icon: process.platform === "win32" ? Re.join(Mr, "../build/icon.ico") : void 0,
    show: !1,
    // Don't show until ready
    titleBarStyle: "default",
    autoHideMenuBar: !0
  });
  const t = Zi ? "http://localhost:5173" : `file://${Re.join(Mr, "../dist/index.html")}`;
  Oe.loadURL(t), Oe.once("ready-to-show", () => {
    Oe.show(), Oe.maximize(), Zi && Oe.webContents.openDevTools();
  }), Oe.webContents.setWindowOpenHandler(({ url: f }) => (ac.openExternal(f), { action: "deny" })), Oe.on("closed", () => {
    Oe = null;
  });
}
function Mf() {
  console.log("[UPDATE] Checking for updates..."), tt.autoUpdater.checkForUpdates();
}
tt.autoUpdater.on("checking-for-update", () => {
  console.log("[UPDATE] Checking for updates...");
});
tt.autoUpdater.on("update-available", (t) => {
  console.log("[UPDATE] Update available:", t.version), mr.showMessageBox(Oe, {
    type: "info",
    title: "Update Available",
    message: `A new version ${t.version} is available. Would you like to download it now?`,
    buttons: ["Download", "Later"],
    defaultId: 0,
    cancelId: 1
  }).then((f) => {
    f.response === 0 && tt.autoUpdater.downloadUpdate();
  });
});
tt.autoUpdater.on("update-not-available", (t) => {
  console.log("[UPDATE] No updates available. Current version:", t.version);
});
tt.autoUpdater.on("error", (t) => {
  console.error("[UPDATE] Error checking for updates:", t);
});
tt.autoUpdater.on("download-progress", (t) => {
  let f = `Downloaded ${t.percent.toFixed(2)}%`;
  f = f + ` (${t.transferred}/${t.total})`, console.log("[UPDATE]", f), Oe && Oe.webContents && Oe.webContents.send("update-download-progress", t);
});
tt.autoUpdater.on("update-downloaded", (t) => {
  console.log("[UPDATE] Update downloaded:", t.version), mr.showMessageBox(Oe, {
    type: "info",
    title: "Update Ready",
    message: `Version ${t.version} has been downloaded. The application will restart to install the update.`,
    buttons: ["Restart Now", "Later"],
    defaultId: 0,
    cancelId: 1
  }).then((f) => {
    f.response === 0 && tt.autoUpdater.quitAndInstall();
  });
});
ut.whenReady().then(() => {
  fu(), setTimeout(() => {
    kf();
  }, 2e3), !Zi && ut.isPackaged && setTimeout(() => {
    Mf();
  }, 5e3);
});
ut.on("window-all-closed", () => {
  process.platform !== "darwin" && ut.quit();
});
ut.on("activate", () => {
  Ol.getAllWindows().length === 0 && fu();
});
ut.on("before-quit", () => {
  qf();
});
ut.on("web-contents-created", (t, f) => {
  f.on("will-navigate", (h, u) => {
    const c = new URL(u);
    c.origin !== "http://localhost:5173" && c.origin !== "file://" && h.preventDefault();
  });
});
mt.handle("dialog:openFile", async () => await mr.showOpenDialog(Oe, {
  properties: ["openFile"],
  filters: [
    { name: "All Files", extensions: ["*"] }
  ]
}));
mt.handle("dialog:saveFile", async (t, f) => await mr.showSaveDialog(Oe, f));
mt.handle("dialog:openDirectory", async () => await mr.showOpenDialog(Oe, {
  properties: ["openDirectory"]
}));
mt.handle("app:getVersion", () => ut.getVersion());
mt.handle("app:getPlatform", () => process.platform);
mt.on("window:minimize", () => {
  Oe.minimize();
});
mt.on("window:maximize", () => {
  Oe.isMaximized() ? Oe.unmaximize() : Oe.maximize();
});
mt.on("window:close", () => {
  Oe.close();
});
