// ===== Performance patch =====
// The game rewrites the same text, styles and classes on every frame, even
// when nothing changed. Each write forces the browser to recalculate styles
// and repaint, which is what makes the game lag (especially on phones).
// These versions only touch the DOM when the value actually changes.
(function () {
    const P = Element.prototype

    P.setHTML = function (html) {
        const el = this.el
        if (el.__h !== html) { el.innerHTML = html; el.__h = html }
    }
    P.addHTML = function (html) {
        this.el.innerHTML += html
        this.el.__h = undefined
    }
    P.setTxt = function (txt) {
        const el = this.el
        txt = String(txt)
        if (el.textContent !== txt) { el.textContent = txt; el.__h = undefined }
    }
    P.setDisplay = function (bool) {
        const v = bool ? "" : "none"
        if (this.el.style.display !== v) this.el.style.display = v
    }
    P.setClasses = function (data) {
        let s = ""
        for (const k in data) if (data[k]) s += (s ? " " : "") + k
        if (this.el.className !== s) this.el.className = s
    }
    P.setVisible = function (bool) {
        const s = this.el.style, v = bool ? "visible" : "hidden"
        if (s.visibility !== v) {
            s.visibility = v
            s.opacity = bool ? 1 : 0
            s.pointerEvents = bool ? "all" : "none"
        }
    }
    P.setOpacity = function (value) {
        if (this.el.style.opacity !== String(value)) this.el.style.opacity = value
    }
    P.changeStyle = function (type, input) {
        const st = this.el.style
        if (st[type] !== String(input)) st[type] = input
    }
    P.setAttr = function (name, input) {
        const v = String(input)
        if (this.el.getAttribute(name) !== v) this.el.setAttribute(name, v)
    }
    P.setSize = function (h, w) {
        this.changeStyle("min-height", h + "px")
        this.changeStyle("min-width", w + "px")
    }
})()
