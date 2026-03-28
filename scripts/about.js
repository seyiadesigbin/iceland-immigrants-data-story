/**
 * about.js
 * Controls the About overlay shown on first page load and reopened from the nav.
 *
 * Behaviour:
 * - The overlay shows automatically when the page is opened for the first time in a tab.
 * - Clicking the top button or CTA button closes it and reveals the story.
 * - Clicking the nav "About" link opens it again.
 * - Pressing Escape also closes it.
 * - sessionStorage prevents it from reappearing on refresh in the same tab.
 */

(function () {

    const overlay = document.getElementById('about-overlay');
    const closeBtn = document.getElementById('about-close-btn');
    const ctaBtn = document.getElementById('about-cta-btn');
    const navLink = document.getElementById('about-nav-link');

    // Guard: do nothing if the overlay markup is not present on the page.
    if (!overlay) return;

    /*
    Hide the overlay and restore page scrolling.
    Store the seen state for the current tab session so the overlay
    does not keep reopening on refresh.
    */
    function closeOverlay() {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
        sessionStorage.setItem('about-seen', '1');
    }

    /*
    Show the overlay again from the navigation.
    Scroll the overlay back to the top so it always opens cleanly.
    */
    function openOverlay(event) {
        if (event) event.preventDefault();

        overlay.classList.remove('hidden');
        overlay.scrollTop = 0;
        document.body.style.overflow = 'hidden';
    }

    // Show the overlay on first load in this tab only.
    if (sessionStorage.getItem('about-seen')) {
        overlay.classList.add('hidden');
    } else {
        document.body.style.overflow = 'hidden';
    }

    // Primary close controls.
    if (closeBtn) {
        closeBtn.addEventListener('click', closeOverlay);
    }

    if (ctaBtn) {
        ctaBtn.addEventListener('click', closeOverlay);
    }

    // Allow the About link in the nav to reopen the panel.
    if (navLink) {
        navLink.addEventListener('click', openOverlay);
    }

    // Escape provides a quick keyboard exit.
    document.addEventListener('keydown', function (event) {
        const overlayIsOpen = !overlay.classList.contains('hidden');

        if (event.key === 'Escape' && overlayIsOpen) {
            closeOverlay();
        }
    });

})();
