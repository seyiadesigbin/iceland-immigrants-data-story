/*
This script file controls the functionality of the Project Overview overlay.
*/

(function () {

    const overlay = document.getElementById('overview-overlay');
    const closeBtn = document.getElementById('overview-close-btn');
    const ctaBtn = document.getElementById('overview-cta-btn');
    const footerCtaBtn = document.getElementById('overview-cta-btn-footer');
    const navLink = document.getElementById('overview-nav-link');

    // Stop quietly if the Project Overview markup is not present.
    if (!overlay) return;

    /*
    Hide the Project Overview layer and restore background page scrolling.
    Store the seen state so the page does not reopen on refresh
    during the same browser tab session.
    */
    function closeOverlay() {
        overlay.classList.add('hidden');
        overlay.classList.remove('overview-first-open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        sessionStorage.setItem('overview-seen', '1');
    }

    /*
    Show the Project Overview layer again from the navigation bar.
    Scroll back to the top so it always opens in a clean state.
    */
    function openOverlay(event) {
        if (event) event.preventDefault();

        overlay.classList.remove('hidden');
        overlay.classList.remove('overview-first-open');
        overlay.scrollTop = 0;
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    // Show the Project Overview layer once per browser tab session.
    if (sessionStorage.getItem('overview-seen')) {
        overlay.classList.add('hidden');
    } else {
        overlay.classList.add('overview-first-open');
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
    }

    // Top-right X button.
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOverlay);
    }

    // Header CTA button.
    if (ctaBtn) {
        ctaBtn.addEventListener('click', closeOverlay);
    }

    // Footer CTA button.
    if (footerCtaBtn) {
        footerCtaBtn.addEventListener('click', closeOverlay);
    }

    // Navigation link that reopens the Project Overview page.
    if (navLink) {
        navLink.addEventListener('click', openOverlay);
    }

    // Keyboard shortcut for quick dismissal.
    document.addEventListener('keydown', function (event) {
        const overlayIsOpen = !overlay.classList.contains('hidden');

        if (event.key === 'Escape' && overlayIsOpen) {
            closeOverlay();
        }
    });

})();