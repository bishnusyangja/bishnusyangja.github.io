document.addEventListener('DOMContentLoaded', function () {
    var root = document.documentElement;
    var navbar = document.querySelector('.navbar');
    var header = document.querySelector('.site-header') || navbar;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ----- navbar height for sticky offsets ----- */
    function syncNavbarHeight() {
        root.style.setProperty('--navbar-height', header.offsetHeight + 'px');
    }
    syncNavbarHeight();
    window.addEventListener('resize', syncNavbarHeight);

    /* ----- smooth in-page navigation ----- */
    function scrollToSection(section, smooth) {
        if (!section) return;
        var top = section.getBoundingClientRect().top + window.scrollY - header.offsetHeight - 16;
        if (section.id === 'About') top = 0;
        window.scrollTo({ top: top, behavior: smooth === false || reduceMotion ? 'auto' : 'smooth' });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            var id = link.getAttribute('href').slice(1);
            var target = document.getElementById(id);
            if (!target) return;
            event.preventDefault();
            scrollToSection(target);
            history.replaceState(null, '', '#' + id);
        });
    });

    if (location.hash && location.hash.toLowerCase() !== '#about') {
        var initial = document.getElementById(location.hash.slice(1));
        if (initial) requestAnimationFrame(function () { scrollToSection(initial, false); });
    }

    /* ----- active nav link ----- */
    var pairs = Array.from(document.querySelectorAll('.nav-links a'))
        .map(function (a) { return [a, document.getElementById(a.getAttribute('href').slice(1))]; })
        .filter(function (p) { return p[1]; });

    function updateActive() {
        var line = header.offsetHeight + window.innerHeight * 0.3;
        var current = pairs[0];
        pairs.forEach(function (p) { if (p[1].getBoundingClientRect().top <= line) current = p; });
        if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) current = pairs[pairs.length - 1];
        pairs.forEach(function (p) { p[0].classList.toggle('active', p === current); });
    }
    updateActive();
    window.addEventListener('scroll', updateActive, { passive: true });

    /* ----- theme toggle ----- */
    var toggle = document.querySelector('.theme-toggle');
    function isDark() {
        var set = root.getAttribute('data-theme');
        if (set) return set === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    if (toggle) {
        toggle.addEventListener('click', function () {
            var next = isDark() ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) {}
        });
    }

    /* ----- name letter animation ----- */
    var nameEl = document.querySelector('.animated-text');
    if (nameEl && !reduceMotion) {
        var text = nameEl.textContent;
        nameEl.setAttribute('aria-label', text);
        nameEl.textContent = '';
        Array.from(text).forEach(function (ch, i) {
            var span = document.createElement('span');
            span.setAttribute('aria-hidden', 'true');
            span.textContent = ch === ' ' ? ' ' : ch;
            span.style.animationDelay = (i * 0.04) + 's';
            nameEl.appendChild(span);
        });
    }

    /* ----- scroll reveal with stagger ----- */
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var groups = new Map();
        reveals.forEach(function (el) {
            var parent = el.parentElement;
            var i = groups.get(parent) || 0;
            el.style.setProperty('--delay', Math.min(i * 0.08, 0.4) + 's');
            groups.set(parent, i + 1);
        });
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('in');
                io.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
        reveals.forEach(function (el) {
            /* anything already on screen at load shows right away */
            if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
            else io.observe(el);
        });
    } else {
        reveals.forEach(function (el) { el.classList.add('in'); });
    }

    /* ----- count-up hero stats ----- */
    if (!reduceMotion) {
        document.querySelectorAll('[data-count]').forEach(function (el) {
            var end = parseInt(el.getAttribute('data-count'), 10);
            var suffix = el.getAttribute('data-suffix') || '';
            var start = null;
            var duration = 1200;
            el.textContent = '0' + suffix;
            function step(ts) {
                if (start === null) start = ts;
                var t = Math.min((ts - start) / duration, 1);
                var eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(end * eased) + suffix;
                if (t < 1) requestAnimationFrame(step);
            }
            setTimeout(function () { requestAnimationFrame(step); }, 400);
            /* safety net: always land on the real number */
            setTimeout(function () { el.textContent = end + suffix; }, 400 + duration + 300);
        });
    }

    /* ----- scroll progress bar ----- */
    var progress = document.querySelector('.scroll-progress');
    function updateProgress() {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? window.scrollY / max : 0;
        progress.style.transform = 'scaleX(' + p + ')';
    }
    if (progress) {
        updateProgress();
        window.addEventListener('scroll', updateProgress, { passive: true });
        window.addEventListener('resize', updateProgress);
    }
});
