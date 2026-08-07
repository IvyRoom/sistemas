import {
    testimonial1ViewToggle,
    testimonial2ViewToggle,
    testimonial3ViewToggle,
    testimonial4ViewToggle,
    testimonial5ViewToggle,
    primaryVideoFrame,
    primaryVideoPlayer,
    testimonial1Video,
    testimonial2Video,
    testimonial3Video,
    testimonial4Video,
    testimonial5Video,
    primaryVideo
} from './elements.js';


export var userAgent = navigator.userAgent;


const testimonialVideos = [
    testimonial1Video,
    testimonial2Video,
    testimonial3Video,
    testimonial4Video,
    testimonial5Video
];
const primaryVideoPoster = './landing-page/img/CAPA_VÍDEO_PRINCIPAL.jpg';
const primaryVideoSource = "https://videospreparatoriosv2.blob.core.windows.net/videosv3/LandingPagePJ/video-principal/master.m3u8";
let primaryVideoInitialization = null;


// Rotation controls are only needed in Instagram's in-app browser.
if (userAgent.indexOf('Instagram') === -1) {

    testimonial1ViewToggle.classList.add('is-hidden');
    testimonial1Video.classList.add('has-hidden-rotation-control');

    testimonial2ViewToggle.classList.add('is-hidden');
    testimonial2Video.classList.add('has-hidden-rotation-control');

    testimonial3ViewToggle.classList.add('is-hidden');
    testimonial3Video.classList.add('has-hidden-rotation-control');

    testimonial4ViewToggle.classList.add('is-hidden');
    testimonial4Video.classList.add('has-hidden-rotation-control');

    testimonial5ViewToggle.classList.add('is-hidden');
    testimonial5Video.classList.add('has-hidden-rotation-control');

}


export function pausePlayingTestimonials() {
    testimonialVideos.forEach(video => {
        if (!video.paused) video.pause();
    });
}


export function pausePlayingTestimonialsOutsideViewport() {
    testimonialVideos.forEach(video => {
        if (video.paused) return;

        const videoBounds = video.getBoundingClientRect();
        if (
            videoBounds.bottom <= 0 ||
            videoBounds.top >= window.innerHeight
        ) {
            video.pause();
        }
    });
}


async function enableNativePrimaryVideo(player = null, ui = null) {
    if (ui !== null && typeof ui.destroy === 'function') {
        try {
            await ui.destroy();
        } catch (error) {
            console.error(error);
        }
    } else if (player !== null && typeof player.destroy === 'function') {
        try {
            await player.destroy();
        } catch (error) {
            console.error(error);
        }
    }

    primaryVideoPlayer.removeAttribute('data-shaka-player-container');
    primaryVideo.removeAttribute('data-shaka-player');
    primaryVideo.setAttribute('poster', primaryVideoPoster);
    primaryVideo.setAttribute('src', primaryVideoSource);
    primaryVideo.setAttribute('controls', '');
    if (typeof primaryVideo.load === 'function') primaryVideo.load();
}


export function initializePrimaryVideo() {
    if (primaryVideoInitialization !== null) return primaryVideoInitialization;

    primaryVideo.removeAttribute('controls');
    primaryVideoPlayer.setAttribute('data-shaka-player-container', '');
    primaryVideo.setAttribute('data-shaka-player', '');
    primaryVideo.setAttribute('poster', primaryVideoPoster);
    primaryVideo.setAttribute('src', primaryVideoSource);

    const initialization = (async function() {
        const shakaApi = globalThis.shaka;

        if (
            shakaApi === null ||
            typeof shakaApi !== 'object' ||
            typeof shakaApi.Player !== 'function' ||
            typeof shakaApi.ui?.Overlay !== 'function'
        ) {
            await enableNativePrimaryVideo();
            return true;
        }

        let player = null;
        let ui = null;

        try {
            if (typeof shakaApi.polyfill?.installAll === 'function') {
                shakaApi.polyfill.installAll();
            }

            if (
                typeof shakaApi.Player.isBrowserSupported === 'function' &&
                !shakaApi.Player.isBrowserSupported()
            ) {
                await enableNativePrimaryVideo();
                return true;
            }

            player = new shakaApi.Player(primaryVideo);
            ui = new shakaApi.ui.Overlay(player, primaryVideoPlayer, primaryVideo);

            ui.configure({
                overflowMenuButtons: ['quality', 'playback_rate']
            });

            await player.load(primaryVideo.getAttribute('src'));
            return true;
        } catch (error) {
            console.error(error);
            await enableNativePrimaryVideo(player, ui);
            return false;
        }
    })();

    primaryVideoInitialization = initialization;
    void initialization.then(initialized => {
        if (!initialized && primaryVideoInitialization === initialization) {
            primaryVideoInitialization = null;
        }
    });

    return primaryVideoInitialization;
}


async function handleIntersection(entries, observer) {
    for (const entry of entries) {
        if (!entry.isIntersecting || primaryVideoInitialization !== null) continue;

        const initialized = await initializePrimaryVideo();
        if (initialized) observer.unobserve(entry.target);
    }
}


if (typeof IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(handleIntersection);
    observer.observe(primaryVideoFrame);
} else {
    void initializePrimaryVideo();
}
