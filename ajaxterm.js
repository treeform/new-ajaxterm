(function() {
  var chr,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  chr = function(code) {
    return String.fromCharCode(code);
  };

  window.Terminal = (function() {

    function Terminal(id, width, height) {
      this.keydown = __bind(this.keydown, this);
      this.keypress = __bind(this.keypress, this);
      this.update = __bind(this.update, this);
      this.error = __bind(this.error, this);      this.ie = 0;
      if (window.ActiveXObject) this.ie = 1;
      this.sid = "" + Math.round(Math.random() * 1000000000);
      this.query = "s=" + this.sid + "&w=" + width + "&h=" + height;
      this.query = this.query + "&c=1&k=";
      this.buf = "";
      this.timeout = void 0;
      this.error_timeout = void 0;
      this.keybuf = [];
      this.sending = 0;
      this.rmax = 1;
      this.div = document.getElementById(id);
      this.dstat = document.createElement("pre");
      this.sled = document.createElement("span");
      this.opt_get = document.createElement("a");
      this.opt_color = document.createElement("a");
      this.opt_paste = document.createElement("a");
      this.sdebug = document.createElement("span");
      this.dterm = document.createElement("div");
      this.init();
    }

    Terminal.prototype.init = function() {
      this.sled.appendChild(document.createTextNode("·"));
      this.sled.className = "off";
      this.dstat.appendChild(this.sled);
      this.dstat.appendChild(document.createTextNode(" "));
      this.opt_add(this.opt_color, "Colors");
      this.opt_color.className = "on";
      this.opt_add(this.opt_get, "GET");
      this.opt_add(this.opt_paste, "Paste");
      this.dstat.appendChild(this.sdebug);
      this.dstat.className = "stat";
      this.div.appendChild(this.dstat);
      this.div.appendChild(this.dterm);
      if (this.opt_color.addEventListener) {
        this.opt_get.addEventListener("click", this.do_get, true);
        this.opt_color.addEventListener("click", this.do_color, true);
        this.opt_paste.addEventListener("click", this.do_paste, true);
      } else {
        this.opt_get.attachEvent("onclick", this.do_get);
        this.opt_color.attachEvent("onclick", this.do_color);
        this.opt_paste.attachEvent("onclick", this.do_paste);
      }
      document.onkeypress = this.keypress;
      document.onkeydown = this.keydown;
      return this.timeout = window.setTimeout(this.update, 100);
    };

    Terminal.prototype.debug = function(s) {
      return this.sdebug.innerHTML = s;
    };

    Terminal.prototype.error = function() {
      this.sled.className = "off";
      return this.debug("Connection lost timeout ts:" + (new Date).getTime());
    };

    Terminal.prototype.opt_add = function(opt, name) {
      opt.className = "off";
      opt.innerHTML = " " + name + " ";
      this.dstat.appendChild(opt);
      return this.dstat.appendChild(document.createTextNode(" "));
    };

    Terminal.prototype.do_get = function(event) {
      this.opt_get.className = (this.opt_get.className === "off" ? "on" : "off");
      return this.debug("GET " + this.opt_get.className);
    };

    Terminal.prototype.do_color = function(event) {
      var o, query1;
      o = this.opt_color.className = (this.opt_color.className === "off" ? "on" : "off");
      if (o === "on") {
        query1 = query0 + "&c=1&k=";
      } else {
        query1 = query0 + "&k=";
      }
      return this.debug("Color " + this.opt_color.className);
    };

    Terminal.prototype.mozilla_clipboard = function() {
      var clip, str, strLength, trans;
      try {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
      } catch (err) {
        debug("Access denied, <a href=\"http://kb.mozillazine.org/Granting_JavaScript_access_to_the_clipboard\" target=\"_blank\">more info</a>");
        return undefined;
      }
      clip = Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard);
      trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable);
      if (!clip || !trans) return undefined;
      trans.addDataFlavor("text/unicode");
      clip.getData(trans, clip.kGlobalClipboard);
      str = new Object();
      strLength = new Object();
      try {
        trans.getTransferData("text/unicode", str, strLength);
      } catch (err) {
        return "";
      }
      if (str) {
        str = str.value.QueryInterface(Components.interfaces.nsISupportsString);
      }
      if (str) {
        return str.data.substring(0, strLength.value / 2);
      } else {
        return "";
      }
    };

    Terminal.prototype.do_paste = function(event) {
      var p;
      p = undefined;
      if (window.clipboardData) {
        p = window.clipboardData.getData("Text");
      } else {
        if (window.netscape) p = mozilla_clipboard();
      }
      if (p) {
        debug("Pasted");
        return this.queue(encodeURIComponent(p));
      } else {

      }
    };

    Terminal.prototype.update = function() {
      var query, r, send,
        _this = this;
      if (this.sending === 0) {
        this.sending = 1;
        this.sled.className = "on";
        r = new XMLHttpRequest();
        send = "";
        while (this.keybuf.length > 0) {
          send += this.keybuf.pop();
        }
        query = this.query + send;
        if (this.opt_get.className === "on") {
          r.open("GET", "u?" + query, true);
          if (this.ie) {
            r.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
          }
        } else {
          r.open("POST", "u", true);
        }
        r.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        r.onreadystatechange = function() {
          var de, rmax;
          if (r.readyState === 4) {
            if (r.status === 200) {
              window.clearTimeout(_this.error_timeout);
              de = r.responseXML.documentElement;
              if (de.tagName === "pre") {
                if (_this.ie) {
                  Sarissa.updateContentFromNode(de, _this.dterm);
                } else {
                  Sarissa.updateContentFromNode(de, _this.dterm);
                }
                rmax = 100;
              } else {
                rmax *= 2;
                if (rmax > 2000) rmax = 2000;
              }
              _this.sending = 0;
              _this.sled.className = "off";
              return _this.timeout = window.setTimeout(_this.update, rmax);
            } else {
              return debug("Connection error status:" + r.status);
            }
          }
        };
        this.error_timeout = window.setTimeout(this.error, 5000);
        if (this.opt_get.className === "on") {
          return r.send(null);
        } else {
          return r.send(query);
        }
      }
    };

    Terminal.prototype.queue = function(s) {
      this.keybuf.unshift(s);
      if (this.sending === 0) {
        window.clearTimeout(this.timeout);
        return this.timeout = window.setTimeout(this.update, 1);
      }
    };

    Terminal.prototype.keypress = function(ev) {
      var k, kc;
      if (!ev) ev = window.event;
      kc = void 0;
      k = "";
      if (ev.keyCode) kc = ev.keyCode;
      if (ev.which) kc = ev.which;
      console.log(kc);
      if (ev.altKey) {
        if (kc >= 65 && kc <= 90) kc += 32;
        if (kc >= 97 && kc <= 122) k = chr(27) + chr(kc);
      } else if (ev.ctrlKey) {
        if (kc >= 65 && kc <= 90) {
          k = chr(kc - 64);
        } else if (kc >= 97 && kc <= 122) {
          k = chr(kc - 96);
        } else if (kc === 54) {
          k = chr(30);
        } else if (kc === 109) {
          k = chr(31);
        } else if (kc === 219) {
          k = chr(27);
        } else if (kc === 220) {
          k = chr(28);
        } else if (kc === 221) {
          k = chr(29);
        } else if (kc === 219) {
          k = chr(29);
        } else if (kc === 219) {
          k = chr(0);
        }
      } else if (ev.which === 0) {
        if (kc === 9) {
          k = chr(9);
        } else if (kc === 8) {
          k = chr(127);
        } else if (kc !== 27) {
          if (kc === 33) {
            k = "[5~";
          } else if (kc === 34) {
            k = "[6~";
          } else if (kc === 35) {
            k = "[4~";
          } else if (kc === 36) {
            k = "[1~";
          } else if (kc === 37) {
            k = "[D";
          } else if (kc === 38) {
            k = "[A";
          } else if (kc === 39) {
            k = "[C";
          } else if (kc === 40) {
            k = "[B";
          } else if (kc === 45) {
            k = "[2~";
          } else if (kc === 46) {
            k = "[3~";
          } else if (kc === 112) {
            k = "[[A";
          } else if (kc === 113) {
            k = "[[B";
          } else if (kc === 114) {
            k = "[[C";
          } else if (kc === 115) {
            k = "[[D";
          } else if (kc === 116) {
            k = "[[E";
          } else if (kc === 117) {
            k = "[17~";
          } else if (kc === 118) {
            k = "[18~";
          } else if (kc === 119) {
            k = "[19~";
          } else if (kc === 120) {
            k = "[20~";
          } else if (kc === 121) {
            k = "[21~";
          } else if (kc === 122) {
            k = "[23~";
          } else if (kc === 123) {
            k = "[24~";
          }
          if (k.length) k = chr(27) + k;
        }
      } else {
        if (kc === 8) {
          k = chr(127);
        } else {
          k = chr(kc);
        }
      }
      if (k.length) {
        if (k === "+") {
          this.queue("%2B");
        } else {
          this.queue(escape(k));
        }
      }
      ev.cancelBubble = true;
      if (ev.stopPropagation) ev.stopPropagation();
      if (ev.preventDefault) ev.preventDefault();
      return false;
    };

    Terminal.prototype.keydown = function(ev) {
      var o;
      if (!ev) ev = window.event;
      if (this.ie) {
        o = {
          9: 1,
          8: 1,
          27: 1,
          33: 1,
          34: 1,
          35: 1,
          36: 1,
          37: 1,
          38: 1,
          39: 1,
          40: 1,
          45: 1,
          46: 1,
          112: 1,
          113: 1,
          114: 1,
          115: 1,
          116: 1,
          117: 1,
          118: 1,
          119: 1,
          120: 1,
          121: 1,
          122: 1,
          123: 1
        };
        if (o[ev.keyCode] || ev.ctrlKey || ev.altKey) {
          ev.which = 0;
          return keypress(ev);
        }
      }
    };

    return Terminal;

  })();

}).call(this);
