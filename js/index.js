/**
 * DAVAUS, Homepage JS
 * Hero stat counter animations and homepage-specific interactions.
 */

(function() {
    'use strict';

    /**
     * Count-up animation on hero stats once they're in view
     */
    function initStatCounters() {
        const stats = document.querySelectorAll('[data-count-to]');
        if (!stats.length || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                if (el.dataset.counted === 'true') return;
                el.dataset.counted = 'true';

                const target = parseFloat(el.dataset.countTo);
                const suffix = el.dataset.suffix || '';
                const prefix = el.dataset.prefix || '';
                const decimals = parseInt(el.dataset.decimals || '0', 10);
                const duration = 1400;
                const startTime = performance.now();

                function step(now) {
                    const elapsed = now - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease-out cubic
                    const eased = 1 - Math.pow(1 - progress, 3);
                    const value = target * eased;
                    el.textContent = prefix + value.toFixed(decimals) + suffix;
                    if (progress < 1) requestAnimationFrame(step);
                    else el.textContent = prefix + target.toFixed(decimals) + suffix;
                }
                requestAnimationFrame(step);
            });
        }, { threshold: 0.4 });

        stats.forEach(s => observer.observe(s));
    }

    function init() {
        initStatCounters();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
