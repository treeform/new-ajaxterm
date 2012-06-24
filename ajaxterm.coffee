chr = (code) -> String.fromCharCode(code)


class window.Terminal 
    
    constructor: (id, width, height) ->
        @ie = 0
        @ie = 1    if window.ActiveXObject
        @sid = "" + Math.round(Math.random() * 1000000000)
        @query = "s=" + @sid + "&w=" + width + "&h=" + height
        @query = @query + "&c=1&k="
        @buf = ""
        @timeout = undefined
        @error_timeout = undefined
        @keybuf = []
        @sending = 0
        @rmax = 1
        @div = document.getElementById(id)
        @dstat = document.createElement("pre")
        @sled = document.createElement("span")
        @opt_get = document.createElement("a")
        @opt_color = document.createElement("a")
        @opt_paste = document.createElement("a")
        @sdebug = document.createElement("span")
        @dterm = document.createElement("div")
        @init()

    init: ->
        @sled.appendChild document.createTextNode("·")
        @sled.className = "off"
        @dstat.appendChild @sled
        @dstat.appendChild document.createTextNode(" ")
        @opt_add @opt_color, "Colors"
        @opt_color.className = "on"
        @opt_add @opt_get, "GET"
        @opt_add @opt_paste, "Paste"
        @dstat.appendChild @sdebug
        @dstat.className = "stat"
        @div.appendChild @dstat
        @div.appendChild @dterm
        if @opt_color.addEventListener
            @opt_get.addEventListener "click", @do_get, true
            @opt_color.addEventListener "click", @do_color, true
            @opt_paste.addEventListener "click", @do_paste, true
        else
            @opt_get.attachEvent "onclick", @do_get
            @opt_color.attachEvent "onclick", @do_color
            @opt_paste.attachEvent "onclick", @do_paste
        document.onkeypress = @keypress
        document.onkeydown = @keydown
        @timeout = window.setTimeout(@update, 100)
        
    debug: (s) ->
        @sdebug.innerHTML = s
        
    error: =>
        @sled.className = "off"
        @debug "Connection lost timeout ts:" + (new Date).getTime()
        
    opt_add: (opt, name) ->
        opt.className = "off"
        opt.innerHTML = " " + name + " "
        @dstat.appendChild opt
        @dstat.appendChild document.createTextNode(" ")
        
    do_get: (event) ->
        @opt_get.className = (if (@opt_get.className is "off") then "on" else "off")
        @debug "GET " + @opt_get.className
        
    do_color: (event) ->
        o = @opt_color.className = (if (@opt_color.className is "off") then "on" else "off")
        if o is "on"
            query1 = query0 + "&c=1&k="
        else
            query1 = query0 + "&k="
        @debug "Color " + @opt_color.className
        
    mozilla_clipboard: ->
        try
            netscape.security.PrivilegeManager.enablePrivilege "UniversalXPConnect"
        catch err
            debug "Access denied, <a href=\"http://kb.mozillazine.org/Granting_JavaScript_access_to_the_clipboard\" target=\"_blank\">more info</a>"
            return `undefined`
        clip = Components.classes["@mozilla.org/widget/clipboard;1"].createInstance(Components.interfaces.nsIClipboard)
        trans = Components.classes["@mozilla.org/widget/transferable;1"].createInstance(Components.interfaces.nsITransferable)
        return `undefined`    if not clip or not trans
        trans.addDataFlavor "text/unicode"
        clip.getData trans, clip.kGlobalClipboard
        str = new Object()
        strLength = new Object()
        try
            trans.getTransferData "text/unicode", str, strLength
        catch err
            return ""
        str = str.value.QueryInterface(Components.interfaces.nsISupportsString)    if str
        if str
            str.data.substring 0, strLength.value / 2
        else
            ""
            
    do_paste: (event) ->
        p = `undefined`
        if window.clipboardData
            p = window.clipboardData.getData("Text")
        else p = mozilla_clipboard()    if window.netscape
        if p
            debug "Pasted"
            @queue encodeURIComponent(p)
        else
        
    update: =>
        if @sending is 0
            @sending = 1
            @sled.className = "on"
            r = new XMLHttpRequest()
            send = ""
            send += @keybuf.pop() while @keybuf.length > 0
            query = @query + send
            if @opt_get.className is "on"
                r.open "GET", "u?" + query, true
                r.setRequestHeader "If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT"    if @ie
            else
                r.open "POST", "u", true
            r.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
            r.onreadystatechange = =>
                if r.readyState is 4
                    if r.status is 200
                        window.clearTimeout @error_timeout
                        de = r.responseXML.documentElement
                        if de.tagName is "pre"
                            if @ie
                                Sarissa.updateContentFromNode de, @dterm
                            else
                                Sarissa.updateContentFromNode de, @dterm
                            rmax = 100
                        else
                            rmax *= 2
                            rmax = 2000 if rmax > 2000
                        @sending = 0
                        @sled.className = "off"
                        @timeout = window.setTimeout(@update, rmax)
                    else
                        debug "Connection error status:" + r.status

            @error_timeout = window.setTimeout(@error, 5000)
            if @opt_get.className is "on"
                r.send null
            else
                r.send query
    queue: (s) ->
        @keybuf.unshift s
        if @sending is 0
            window.clearTimeout @timeout
            @timeout = window.setTimeout(@update, 1)
            
    keypress: (ev) =>
        ev = window.event    unless ev
        kc = undefined
        k = ""
        kc = ev.keyCode    if ev.keyCode
        kc = ev.which    if ev.which
        console.log kc
        if ev.altKey
            if kc >= 65 and kc <= 90
                kc += 32 
            if kc >= 97 and kc <= 122
                k = chr(27) + chr(kc)    
        else if ev.ctrlKey
            if kc >= 65 and kc <= 90
                k = chr(kc - 64)
            else if kc >= 97 and kc <= 122
                k = chr(kc - 96)
            else if kc is 54
                k = chr(30)
            else if kc is 109
                k = chr(31)
            else if kc is 219
                k = chr(27)
            else if kc is 220
                k = chr(28)
            else if kc is 221
                k = chr(29)
            else if kc is 219
                k = chr(29)
            else if kc is 219
                k = chr(0)    
        else if ev.which is 0
            if kc is 9
                k = chr(9)
            else if kc is 8
                k = chr(127)
            else unless kc is 27
                if kc is 33
                    k = "[5~"
                else if kc is 34
                    k = "[6~"
                else if kc is 35
                    k = "[4~"
                else if kc is 36
                    k = "[1~"
                else if kc is 37
                    k = "[D"
                else if kc is 38
                    k = "[A"
                else if kc is 39
                    k = "[C"
                else if kc is 40
                    k = "[B"
                else if kc is 45
                    k = "[2~"
                else if kc is 46
                    k = "[3~"
                else if kc is 112
                    k = "[[A"
                else if kc is 113
                    k = "[[B"
                else if kc is 114
                    k = "[[C"
                else if kc is 115
                    k = "[[D"
                else if kc is 116
                    k = "[[E"
                else if kc is 117
                    k = "[17~"
                else if kc is 118
                    k = "[18~"
                else if kc is 119
                    k = "[19~"
                else if kc is 120
                    k = "[20~"
                else if kc is 121
                    k = "[21~"
                else if kc is 122
                    k = "[23~"
                else if kc is 123
                    k = "[24~"   
                if k.length
                    k = chr(27) + k    
        else
            if kc is 8
                k = chr(127)
            else
                k = chr(kc)
        if k.length
            if k is "+"
                @queue "%2B"
            else
                @queue escape(k)
                
        ev.cancelBubble = true
        ev.stopPropagation()    if ev.stopPropagation
        ev.preventDefault()    if ev.preventDefault
        return false
        
    keydown: (ev) =>
        ev = window.event unless ev
        if @ie
            o =
                9: 1
                8: 1
                27: 1
                33: 1
                34: 1
                35: 1
                36: 1
                37: 1
                38: 1
                39: 1
                40: 1
                45: 1
                46: 1
                112: 1
                113: 1
                114: 1
                115: 1
                116: 1
                117: 1
                118: 1
                119: 1
                120: 1
                121: 1
                122: 1
                123: 1

            if o[ev.keyCode] or ev.ctrlKey or ev.altKey
                ev.which = 0
                keypress ev
                


