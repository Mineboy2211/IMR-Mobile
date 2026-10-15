// ===== IMR Mobile / Tablet UI + anti soft-lock =====
(function () {
    const LS = 'imr_mobile_opts'
    let opts = { mode: 'auto', hold: true }
    try { Object.assign(opts, JSON.parse(localStorage.getItem(LS)) || {}) } catch (e) {}
    const saveOpts = () => { try { localStorage.setItem(LS, JSON.stringify(opts)) } catch (e) {} }

    const $ = id => document.getElementById(id)
    const svg = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
    const ICON = {
        save: svg('<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v6h8V3"/><rect x="8" y="14" width="8" height="5"/>'),
        res: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
        menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>'),
        layout: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15h18"/>'),
        hold: svg('<path d="M12 3v10"/><path d="M8 9l4 4 4-4"/><path d="M5 17h14v4H5z"/>'),
        fix: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>'),
        close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
    }
    const NORMAL_BG = 'hsl(0, 0%, 7%)'

    function toast(t) {
        const el = $('m_toast'); if (!el) return
        el.textContent = t; el.style.display = 'block'
        clearTimeout(toast.t); toast.t = setTimeout(() => el.style.display = 'none', 2500)
    }

    /* ---------- Layout mode ---------- */
    function isMobile() {
        if (opts.mode === 'mobile') return true
        if (opts.mode === 'desktop') return false
        return window.innerWidth < 1200 || (matchMedia('(pointer: coarse)').matches && window.innerWidth < 1400)
    }
    function applyMode() {
        const m = isMobile()
        document.body.classList.toggle('m-ui', m)
        document.body.classList.toggle('m-phone', m && window.innerWidth < 700)
        if (!m) document.body.classList.remove('m-res-open')
        // the game hides its tab list via an option; the bottom bar needs it
        if (m && typeof player !== 'undefined' && player.options && player.options.nav_hide && player.options.nav_hide[0]) {
            player.options.nav_hide[0] = false
            if (typeof updateNavigation === 'function') updateNavigation()
        }
        if (!m && typeof updateNavigation === 'function' && typeof tmp !== 'undefined' && tmp.el && tmp.el.main_app) updateNavigation()
        renderMenu()
    }

    /* ---------- UI elements ---------- */
    function buildUI() {
        const top = document.createElement('div')
        top.id = 'm_top'
        top.innerHTML = `<div class="m_mass"><small class="m_lbl">MASS</small><span id="m_mass">-</span><small id="m_gain"></small></div>
            <button id="m_save_btn" title="Save">${ICON.save}</button>
            <button id="m_res_btn" title="Resources">${ICON.res}</button>`
        document.body.appendChild(top)

        const scrim = document.createElement('div'); scrim.id = 'm_scrim'
        scrim.onclick = () => document.body.classList.remove('m-res-open')
        document.body.appendChild(scrim)

        const mb = document.createElement('button'); mb.id = 'm_menu_btn'; mb.innerHTML = ICON.menu
        mb.onclick = () => $('m_menu').classList.toggle('open')
        document.body.appendChild(mb)

        const menu = document.createElement('div'); menu.id = 'm_menu'
        document.body.appendChild(menu)

        const t = document.createElement('div'); t.id = 'm_toast'
        document.body.appendChild(t)

        $('m_res_btn').onclick = () => document.body.classList.toggle('m-res-open')
        $('m_save_btn').onclick = () => { if (typeof save === 'function') { save(); toast('Game saved') } }

        // swipe right->left on the right edge opens resources, swipe back closes
        let sx = null, sy = null
        document.addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY }, { passive: true })
        document.addEventListener('touchend', e => {
            if (sx === null || !document.body.classList.contains('m-ui')) return
            const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy
            if (Math.abs(dx) > 80 && Math.abs(dy) < 50) {
                if (dx < 0 && sx > window.innerWidth - 40) document.body.classList.add('m-res-open')
                if (dx > 0) document.body.classList.remove('m-res-open')
            }
            sx = null
        }, { passive: true })
    }

    function renderMenu() {
        const menu = $('m_menu'); if (!menu) return
        const modeLbl = { auto: 'Auto', mobile: 'Mobile', desktop: 'Desktop' }[opts.mode]
        menu.innerHTML = `<div class="m_title">Mobile UI</div>
            <button id="m_mode">${ICON.layout}<span>Layout</span><b>${modeLbl}</b></button>
            <button id="m_hold" class="${opts.hold ? 'on' : ''}">${ICON.hold}<span>Hold to buy</span><b>${opts.hold ? 'ON' : 'OFF'}</b></button>
            <button id="m_unstuck" class="warn">${ICON.fix}<span>Unstuck</span><b>fix soft lock</b></button>
            <button id="m_close">${ICON.close}<span>Close</span></button>`
        $('m_mode').onclick = () => {
            opts.mode = { auto: 'mobile', mobile: 'desktop', desktop: 'auto' }[opts.mode]; saveOpts(); applyMode()
        }
        $('m_hold').onclick = () => { opts.hold = !opts.hold; saveOpts(); renderMenu() }
        $('m_unstuck').onclick = () => { unstuck(true); menu.classList.remove('open') }
        $('m_close').onclick = () => menu.classList.remove('open')
    }

    function updateTop() {
        if (typeof player === 'undefined' || !tmp.start) return
        document.body.classList.toggle('m-noapp', !!(tmp.el.app && tmp.el.app.el.style.display === 'none'))
        if (!document.body.classList.contains('m-ui')) return
        try {
            $('m_mass').textContent = formatMass(player.mass)
            $('m_gain').textContent = tmp.massGain ? '+' + formatMass(tmp.massGain.mul(tmp.preQUGlobalSpeed || 1)) + '/s' : ''
        } catch (e) {}
    }

    /* ---------- Hold-to-buy ---------- */
    const SAFE = /buy|Buy|bulk|Bulk|getMatterUpgrade/
    const DANGER = /reset|Reset|goInf|infButton|doReset|enter|exit|start|chal|Chal|wipe|import|export|load|save|switch|choose|toggle|respec|confirm/
    function setupHold() {
        let timer = null, rep = null, target = null
        const stop = () => {
            clearTimeout(timer); clearInterval(rep); timer = rep = null
            if (target) target.classList.remove('m-holding'); target = null
        }
        document.addEventListener('pointerdown', e => {
            if (!opts.hold || e.button > 0) return
            const b = e.target.closest('button, .btn, .elements, .btn_tree')
            if (!b) return
            const oc = b.getAttribute('onclick') || ''
            if (!SAFE.test(oc) || DANGER.test(oc)) return
            target = b
            timer = setTimeout(() => {
                b.classList.add('m-holding')
                rep = setInterval(() => { if (b.isConnected) b.click(); else stop() }, 70)
            }, 380)
        })
        ;['pointerup', 'pointercancel', 'pointerleave', 'blur', 'scroll'].forEach(ev =>
            (ev === 'blur' ? window : document).addEventListener(ev, stop, true))
        document.addEventListener('contextmenu', e => { if (target) e.preventDefault() })
    }

    /* ---------- Anti soft-lock ---------- */
    let infStage = { v: 0, since: Date.now() }
    let hiddenSince = null, snShown = false

    function restoreScreen() {
        document.body.style.animation = ''
        document.body.style.backgroundColor = NORMAL_BG
        if (tmp.el && tmp.el.inf_popup) tmp.el.inf_popup.setDisplay(false)
    }

    // Safer version of the game's infinity button: the original never recovers
    // if the reset throws, or if the mass dropped below the requirement meanwhile.
    function patchInfinity() {
        if (typeof infButton !== 'function') return
        window.infButton = function () {
            if (tmp.inf_time != 2) return
            tmp.inf_time = 3
            try {
                if (player.mass.gte(INF.req)) INF.goInf(true)
                else toast('Mass fell below the requirement – infinity cancelled')
            } catch (e) { console.error(e); toast('Infinity reset error – recovered') }
            document.body.style.animation = 'inf_reset_2 2s 1'
            setTimeout(() => {
                if (tmp.el.inf_popup) tmp.el.inf_popup.setDisplay(false)
                setTimeout(() => { tmp.inf_time = 0; restoreScreen() }, 1000)
            }, 1000)
        }
    }

    function patchSupernova() {
        if (typeof CONFIRMS_FUNCTION === 'undefined') return
        const orig = CONFIRMS_FUNCTION.sn
        CONFIRMS_FUNCTION.sn = function (...a) {
            const first = player.supernova.times.lte(0)
            try { orig.apply(this, a) }
            finally {
                if (first) { tmp.el.supernova_scene.setDisplay(false); restoreScreen(); tmp.supernova.time = 0 }
            }
        }
        // quantum / dark / generic resets: never leave the "pass" counter broken
        const guard = name => {
            if (typeof CONFIRMS_FUNCTION[name] !== 'function') return
            const o = CONFIRMS_FUNCTION[name]
            CONFIRMS_FUNCTION[name] = function (...a) {
                try { return o.apply(this, a) }
                catch (e) { console.error(e); toast(name + ' reset error – recovered'); tmp.pass = 0 }
            }
        }
        ;['qu', 'inf', 'rage', 'bh', 'atom'].forEach(guard)
    }

    function unstuck(manual) {
        if (typeof tmp === 'undefined' || !tmp.start) return
        let fixed = []
        if (!(tmp.pass >= 0 && tmp.pass <= 2)) { tmp.pass = 0; fixed.push('frozen loop') }
        if (manual && tmp.pass > 0) { tmp.pass = 0; fixed.push('frozen loop') }

        if (tmp.inf_time != 0) {
            if (tmp.inf_reached && !tmp.brokenInf && player.mass.gte(INF.req)) {
                tmp.inf_time = 2; document.body.style.animation = ''
                document.body.style.backgroundColor = 'orange'
                tmp.el.inf_popup.setDisplay(true); fixed.push('infinity screen')
            } else { tmp.inf_time = 0; restoreScreen(); fixed.push('infinity animation') }
        }
        if (tmp.supernova.reached && player.supernova.times.lte(0) && !player.supernova.post_10) {
            tmp.supernova.time = Math.max(tmp.supernova.time, 18)
            tmp.el.supernova_scene.setDisplay(true); tmp.el.sns5.setVisible(true); tmp.el.sns5.setOpacity(1)
            fixed.push('supernova button')
        } else if (tmp.el.supernova_scene && tmp.el.supernova_scene.el && tmp.el.supernova_scene.el.style.display !== 'none') {
            tmp.el.supernova_scene.setDisplay(false); restoreScreen(); fixed.push('supernova screen')
        }
        if (manual) {
            // pull every popup back on screen
            document.querySelectorAll('.popup').forEach(p => { p.style.top = '50%'; p.style.left = '50%' })
            if (typeof save === 'function' && !(typeof cannotSave === 'function' && cannotSave())) save()
            toast(fixed.length ? 'Fixed: ' + fixed.join(', ') : 'Nothing stuck found – game saved')
        } else if (fixed.length) toast('Auto-fixed: ' + fixed.join(', '))
    }

    function watchdog() {
        if (typeof tmp === 'undefined' || !tmp.start) return
        const now = Date.now()
        if (tmp.inf_time !== infStage.v) infStage = { v: tmp.inf_time, since: now }
        const age = now - infStage.since

        // stage 1 = 8.5s animation; stage 3 = 2s fade. Timers can be lost on mobile.
        if (tmp.inf_time == 1 && age > 12000) {
            tmp.inf_time = 2; document.body.style.backgroundColor = 'orange'; tmp.el.inf_popup.setDisplay(true)
        }
        if (tmp.inf_time == 2) {
            if (!tmp.inf_reached || player.mass.lt(INF.req)) { tmp.inf_time = 0; restoreScreen(); toast('Infinity cancelled (mass dropped)') }
            else if (tmp.el.inf_popup.el.style.display === 'none') tmp.el.inf_popup.setDisplay(true)
        }
        if (tmp.inf_time >= 3 && age > 4000) { tmp.inf_time = 0; restoreScreen() }

        // first supernova scene: make sure the button eventually appears
        const firstSN = tmp.supernova.reached && player.supernova.times.lte(0) && !player.supernova.post_10
        if (firstSN) { snShown = true; if (tmp.supernova.time > 25) { tmp.el.sns5.setVisible(true); tmp.el.sns5.setOpacity(1) } }
        else if (snShown) { snShown = false; tmp.el.supernova_scene.setDisplay(false); if (tmp.inf_time == 0) restoreScreen() }

        // app hidden with nothing on screen to click = soft lock
        const appHidden = tmp.el.app && tmp.el.app.el.style.display === 'none'
        const sceneVisible = tmp.el.supernova_scene.el.style.display !== 'none' || tmp.el.inf_popup.el.style.display !== 'none'
        if (appHidden && !sceneVisible && tmp.inf_time == 0) {
            if (!hiddenSince) hiddenSince = now
            else if (now - hiddenSince > 6000) { hiddenSince = null; unstuck(false) }
        } else hiddenSince = null

        if (!(tmp.pass >= 0) || tmp.pass > 2) tmp.pass = 0
    }

    /* ---------- Boot ---------- */
    function boot() {
        buildUI(); renderMenu(); setupHold()
        let tries = 0
        const wait = setInterval(() => {
            if (typeof tmp !== 'undefined' && tmp.start && tmp.el && tmp.el.app) {
                clearInterval(wait)
                patchInfinity(); patchSupernova(); applyMode()
                setInterval(watchdog, 1000)
                setInterval(updateTop, 200)
                // after a tab switch, close the drawer and scroll to top
                const oc = TABS.choose
                TABS.choose = function (x, s) {
                    oc.call(this, x, s)
                    if (document.body.classList.contains('m-ui')) {
                        document.body.classList.remove('m-res-open')
                        if (!s && tmp.el.main_app) tmp.el.main_app.el.scrollTop = 0
                    }
                }
            } else if (++tries > 600) clearInterval(wait)
        }, 100)
        window.addEventListener('resize', () => { clearTimeout(boot.r); boot.r = setTimeout(applyMode, 150) })
        document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(watchdog, 300) })
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot)
    else boot()

    window.IMR_MOBILE = { unstuck: () => unstuck(true) }
})()
