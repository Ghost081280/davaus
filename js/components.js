/**
 * DAVAUS, Components System
 * Loads reusable nav, footer, chatbot, and UI components on every page.
 * Same mod architecture as the SquidBay reference.
 */

(function() {
    'use strict';

    // Component file paths (relative to site root)
    const COMPONENTS = {
        nav: 'components/nav.html',
        footer: 'components/footer.html',
        chatbot: 'components/chatbot.html'
    };

    const CHATBOT_CSS = 'components/chatbot.css';
    const CHATBOT_JS = 'components/chatbot.js';

    // Detect current page for active-nav highlighting.
    // Uses the page filename (last path segment), so it works on root domain
    // (davaus.com/seedright.html) AND GitHub Pages subpath (user.github.io/davaus/seedright.html).
    const lastSegment = window.location.pathname
        .replace(/\/$/, '')           // strip trailing slash
        .split('/').pop() || '';      // grab final segment
    const currentPage = lastSegment.replace(/\.html$/, '') || 'index';

    /**
     * Load HTML component into a placeholder element
     */
    async function loadComponent(name, targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;

        try {
            const response = await fetch(COMPONENTS[name]);
            if (!response.ok) throw new Error(`Failed to load ${name}: ${response.status}`);
            const html = await response.text();
            target.innerHTML = html;

            if (name === 'nav') {
                initNavigation();
                initMobileMenuLinks();
            }
            if (name === 'footer') {
                initFooter();
            }
        } catch (error) {
            console.warn(`[davaus] Component ${name} not loaded:`, error.message);
        }
    }

    /**
     * Highlight active nav link based on current page
     */
    function initNavigation() {
        document.querySelectorAll('[data-nav]').forEach(link => {
            if (link.dataset.nav === currentPage) {
                link.classList.add('active');
            }
        });
        initScrollProgress();
    }

    function initFooter() {
        initBackToTop();
    }

    /**
     * Mobile menu toggle, explicit open/close, never out of sync
     */
    window.toggleMobileMenu = function() {
        const menu = document.getElementById('mobile-menu');
        const body = document.body;
        if (!menu) return;

        const isOpen = menu.classList.contains('open');
        if (isOpen) {
            menu.classList.remove('open');
            body.classList.remove('menu-open');
        } else {
            menu.classList.add('open');
            body.classList.add('menu-open');
        }
    };

    /**
     * Auto-close mobile menu when a link inside it is clicked
     */
    function initMobileMenuLinks() {
        const menu = document.getElementById('mobile-menu');
        if (!menu) return;

        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (menu.classList.contains('open')) {
                    menu.classList.remove('open');
                    document.body.classList.remove('menu-open');
                }
            });
        });
    }

    // Esc closes mobile menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const menu = document.getElementById('mobile-menu');
            if (menu && menu.classList.contains('open')) {
                menu.classList.remove('open');
                document.body.classList.remove('menu-open');
            }
        }
    });

    /**
     * Horizontal scroll-progress bar (top of page)
     */
    function initScrollProgress() {
        const bar = document.getElementById('scroll-progress');
        if (!bar) return;

        function update() {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
            bar.style.width = progress + '%';
        }

        window.addEventListener('scroll', update, { passive: true });
        update();
    }

    /**
     * Back-to-top button
     */
    function initBackToTop() {
        const btn = document.getElementById('back-to-top');
        if (!btn) return;

        function toggle() {
            if (window.scrollY > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }

        window.addEventListener('scroll', toggle, { passive: true });
        toggle();
    }

    window.scrollToTop = function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /**
     * Ambient field particles, golden kernels drifting upward.
     * Cosmetic-only, runs on every page. Respects prefers-reduced-motion.
     */
    function initFieldParticles() {
        if (document.getElementById('fieldParticles')) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const container = document.createElement('div');
        container.className = 'field-particles';
        container.id = 'fieldParticles';
        document.body.prepend(container);

        function spawn() {
            const p = document.createElement('div');
            p.className = 'field-particle';

            const size = 2 + Math.random() * 3;
            const left = Math.random() * 100;
            const duration = 10 + Math.random() * 14;
            const delay = Math.random() * 0.4;
            const drift = -30 + Math.random() * 60;
            const scaleEnd = 0.6 + Math.random() * 0.5;
            const hueShift = Math.random() > 0.7 ? 'var(--copper)' : 'var(--primary)';

            p.style.width = size + 'px';
            p.style.height = (size * 1.6) + 'px';
            p.style.left = left + '%';
            p.style.background = hueShift;
            p.style.animationDuration = duration + 's';
            p.style.animationDelay = delay + 's';
            p.style.setProperty('--drift', drift + 'px');
            p.style.setProperty('--scale-end', scaleEnd);

            container.appendChild(p);

            setTimeout(() => {
                if (p.parentNode) p.remove();
            }, (duration + delay) * 1000 + 300);
        }

        // Stagger an initial batch
        for (let i = 0; i < 8; i++) {
            setTimeout(spawn, i * 400);
        }

        // Steady spawn rate
        setInterval(spawn, 1200);
    }

    /**
     * Reveal-on-scroll for elements with .reveal class
     */
    function initRevealOnScroll() {
        const els = document.querySelectorAll('.reveal');
        if (!els.length || !('IntersectionObserver' in window)) {
            els.forEach(el => el.classList.add('visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

        els.forEach(el => observer.observe(el));
    }

    /**
     * Load the chatbot (HTML + CSS + JS) at the end of body
     */
    async function loadChatbot() {
        try {
            const linkEl = document.createElement('link');
            linkEl.rel = 'stylesheet';
            linkEl.href = CHATBOT_CSS;
            document.head.appendChild(linkEl);

            const response = await fetch(COMPONENTS.chatbot);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();

            const container = document.createElement('div');
            container.id = 'chatbot-component';
            container.innerHTML = html;
            document.body.appendChild(container);

            const scriptEl = document.createElement('script');
            scriptEl.src = CHATBOT_JS;
            scriptEl.onload = function() {
                document.dispatchEvent(new CustomEvent('davaus:components-loaded'));
                setTimeout(function() {
                    if (typeof showChatbotButton === 'function') {
                        showChatbotButton();
                    }
                }, 400);
            };
            scriptEl.onerror = function() {
                console.error('[davaus] Chatbot JS failed to load');
            };
            document.body.appendChild(scriptEl);
        } catch (error) {
            console.error('[davaus] Chatbot load error:', error.message);
        }
    }

    /**
     * Initialize everything once DOM is ready
     */
    function init() {
        const navPlaceholder = document.getElementById('nav-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (navPlaceholder) {
            loadComponent('nav', 'nav-placeholder');
        } else {
            initNavigation();
            initScrollProgress();
        }

        if (footerPlaceholder) {
            loadComponent('footer', 'footer-placeholder');
        } else {
            initBackToTop();
        }

        // Ensure scroll progress bar exists
        if (!document.getElementById('scroll-progress')) {
            const bar = document.createElement('div');
            bar.className = 'scroll-progress';
            bar.id = 'scroll-progress';
            document.body.prepend(bar);
            initScrollProgress();
        }

        initFieldParticles();
        initRevealOnScroll();

        // Skip chatbot if the page already loads it directly
        const alreadyLoaded = document.getElementById('jarvisBtn') ||
                              document.querySelector('script[src*="chatbot.js"]') ||
                              document.getElementById('chatbot-placeholder');
        if (!alreadyLoaded) {
            loadChatbot();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
