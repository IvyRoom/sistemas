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


function handleIntersection(entries, observer) {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            primaryVideoPlayer.setAttribute("data-shaka-player-container", "");
            primaryVideo.setAttribute("data-shaka-player", "");
            primaryVideo.setAttribute("poster", "./landing-page/img/CAPA_VÍDEO_PRINCIPAL.jpg");
            primaryVideo.setAttribute("src", "https://videospreparatoriosv2.blob.core.windows.net/videosv3/LandingPagePJ/video-principal/master.m3u8");

            const player = new shaka.Player(primaryVideo);
            const ui = new shaka.ui.Overlay(player, primaryVideoPlayer, primaryVideo);

            ui.configure({
                overflowMenuButtons: ['quality', 'playback_rate']
            });

            player.load(primaryVideo.getAttribute('src'));

            observer.unobserve(entry.target);
        }

    });
}

const observer = new IntersectionObserver(handleIntersection);
observer.observe(primaryVideoFrame);
