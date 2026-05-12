/**
 * DAVAUS, Site-wide utilities
 * Small helpers used across pages: smooth in-page anchor scrolling,
 * lazy-loaded YouTube iframes, contact form handling.
 */

(function() {
    'use strict';

    /**
     * Smooth scroll for in-page anchor links, accounting for sticky nav height
     */
    function initAnchorSmoothScroll() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            const nav = document.getElementById('main-nav');
            const navOffset = nav ? nav.offsetHeight + 16 : 0;
            const top = target.getBoundingClientRect().top + window.pageYOffset - navOffset;

            window.scrollTo({ top: top, behavior: 'smooth' });
        });
    }

    /**
     * Lazy-load YouTube iframes, set the real src only when the
     * embed scrolls near the viewport. Keeps initial pageload light.
     *
     * Markup expected:
     *   <div class="video-embed" data-youtube-id="VIDEO_ID" data-title="..."></div>
     */
    function initLazyYouTube() {
        const embeds = document.querySelectorAll('.video-embed[data-youtube-id]');
        if (!embeds.length) return;

        function loadEmbed(el) {
            if (el.dataset.loaded === 'true') return;
            const id = el.dataset.youtubeId;
            const title = el.dataset.title || 'DAVAUS video';
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', `https://www.youtube.com/embed/${id}?rel=0`);
            iframe.setAttribute('title', title);
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('loading', 'lazy');
            el.appendChild(iframe);
            el.dataset.loaded = 'true';
        }

        if (!('IntersectionObserver' in window)) {
            embeds.forEach(loadEmbed);
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadEmbed(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '200px 0px' });

        embeds.forEach(el => observer.observe(el));
    }

    /**
     * Contact form, opens user's mail client pre-filled.
     * No server required for this preview. Replace with API POST when ready.
     */
    function initContactForm() {
        const form = document.getElementById('contact-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const name = (form.querySelector('[name="name"]') || {}).value || '';
            const email = (form.querySelector('[name="email"]') || {}).value || '';
            const subject = (form.querySelector('[name="subject"]') || {}).value || 'Website inquiry';
            const message = (form.querySelector('[name="message"]') || {}).value || '';

            const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
            const mailto = `mailto:${window.DAVAUS_CONFIG.contactEmail}` +
                `?subject=${encodeURIComponent(subject)}` +
                `&body=${encodeURIComponent(body)}`;

            window.location.href = mailto;
        });
    }

    function init() {
        initAnchorSmoothScroll();
        initLazyYouTube();
        initContactForm();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
