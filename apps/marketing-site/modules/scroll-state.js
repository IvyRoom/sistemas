import {
    instagramDirectLink,
    quoteCta,
    primaryVideoFrame,
    quoteCtaSpacer,
    section1,
    section2,
    section3,
    section4,
    section1CloseButton,
    section2CloseButton,
    section3CloseButton,
    section4CloseButton,
    section1QuotePrompt,
    section2QuotePrompt,
    section3QuotePrompt,
    section4QuotePrompt,
    primaryVideo
} from './elements.js';
import { userAgent } from './media.js';



quoteCta.classList.add('is-hidden', 'is-fixed');

export function updateQuoteCtaPosition(){

    if (window.scrollY + window.innerHeight >= section1.offsetTop) {

        quoteCta.classList.remove('is-hidden');
        quoteCtaSpacer.style.setProperty('--quote-cta-height', quoteCta.offsetHeight + 'px');

        if (window.scrollY + window.innerHeight < section1.offsetTop + quoteCta.offsetHeight){

            quoteCta.classList.remove('is-fixed');
            quoteCta.classList.add('is-anchored');
            quoteCta.style.setProperty('--quote-cta-top', section1.offsetTop + 'px');

        } else {

            quoteCta.classList.remove('is-anchored');
            quoteCta.classList.add('is-fixed');

        }

    }

}

window.onscroll = function() {

    updateQuoteCtaPosition();


    var primaryVideoFrameTop = primaryVideoFrame.offsetTop;
    var primaryVideoFrameHeight = primaryVideoFrame.offsetHeight;

    if (primaryVideo !== null) {

        if (window.scrollY + window.innerHeight <= primaryVideoFrameTop) {

            if (!primaryVideo.paused) primaryVideo.pause();

        }


        if (window.scrollY >= primaryVideoFrameTop + primaryVideoFrameHeight) {

            if (!primaryVideo.paused) primaryVideo.pause();

        }

    }


    var section1Top = section1.offsetTop;
    var section2Top = section2.offsetTop;
    var section3Top = section3.offsetTop;
    var section4Top = section4.offsetTop;
    var quoteCtaSpacerTop = quoteCtaSpacer.offsetTop;


    if (window.scrollY <= section1Top) {

        section1CloseButton.classList.add('is-hidden');

    } else if (window.scrollY > section1Top && window.scrollY <= (section2Top - window.innerHeight + quoteCta.offsetHeight)) {

        section1QuotePrompt.classList.remove('has-contained-close-button');
        section1QuotePrompt.classList.add('has-fixed-close-button');

        section1CloseButton.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-contained');
        section1CloseButton.classList.add('is-fixed-above-quote');
        section1CloseButton.style.setProperty('--section-close-bottom', quoteCta.offsetHeight + 15 + 'px');

    } else if (window.scrollY > (section2Top - window.innerHeight + quoteCta.offsetHeight)) {

        section1QuotePrompt.classList.remove('has-fixed-close-button');
        section1QuotePrompt.classList.add('has-contained-close-button');

        section1CloseButton.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-fixed-above-quote');
        section1CloseButton.classList.add('is-contained');

    }


    if (window.scrollY <= section2Top) {

        section2CloseButton.classList.add('is-hidden');

    } else if (window.scrollY > section2Top && window.scrollY <= (section3Top - window.innerHeight + quoteCta.offsetHeight)) {

        section2QuotePrompt.classList.remove('has-contained-close-button');
        section2QuotePrompt.classList.add('has-fixed-close-button');

        section2CloseButton.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-contained');
        section2CloseButton.classList.add('is-fixed-above-quote');
        section2CloseButton.style.setProperty('--section-close-bottom', quoteCta.offsetHeight + 15 + 'px');

    } else if (window.scrollY > (section3Top - window.innerHeight + quoteCta.offsetHeight)) {

        section2QuotePrompt.classList.remove('has-fixed-close-button');
        section2QuotePrompt.classList.add('has-contained-close-button');

        section2CloseButton.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-fixed-above-quote');
        section2CloseButton.classList.add('is-contained');

    }


    if (window.scrollY <= section3Top) {

        section3CloseButton.classList.add('is-hidden');
        instagramDirectLink.classList.add('is-hidden');

    } else if (window.scrollY > section3Top && window.scrollY <= (section4Top - window.innerHeight + quoteCta.offsetHeight)) {

        section3QuotePrompt.classList.remove('has-contained-close-button');
        section3QuotePrompt.classList.add('has-fixed-close-button');

        section3CloseButton.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-contained');
        section3CloseButton.classList.add('is-fixed-above-quote');
        section3CloseButton.style.setProperty('--section-close-bottom', quoteCta.offsetHeight + 15 + 'px');

        if (userAgent.indexOf('Instagram') === -1) {

            instagramDirectLink.classList.remove('is-hidden', 'is-contained', 'has-fixed-position');
            instagramDirectLink.classList.add('is-fixed');

        }

    } else if (window.scrollY > (section4Top - window.innerHeight + quoteCta.offsetHeight)) {

        section3QuotePrompt.classList.remove('has-fixed-close-button');
        section3QuotePrompt.classList.add('has-contained-close-button');

        section3CloseButton.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-fixed-above-quote');
        section3CloseButton.classList.add('is-contained');

        if (userAgent.indexOf('Instagram') === -1) {

            instagramDirectLink.classList.remove('is-hidden', 'is-fixed', 'has-fixed-position');
            instagramDirectLink.classList.add('is-contained');

        }

    }


    if (window.scrollY <= section4Top) {

        section4CloseButton.classList.add('is-hidden');

    } else if (window.scrollY > section4Top && window.scrollY <= (quoteCtaSpacerTop - window.innerHeight + quoteCta.offsetHeight)) {

        section4QuotePrompt.classList.remove('has-contained-close-button');
        section4QuotePrompt.classList.add('has-fixed-close-button');

        section4CloseButton.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-contained');
        section4CloseButton.classList.add('is-fixed-above-quote');
        section4CloseButton.style.setProperty('--section-close-bottom', quoteCta.offsetHeight + 15 + 'px');

    } else if (window.scrollY > (quoteCtaSpacerTop - window.innerHeight + quoteCta.offsetHeight)) {

        section4QuotePrompt.classList.remove('has-fixed-close-button');
        section4QuotePrompt.classList.add('has-contained-close-button');

        section4CloseButton.classList.remove('is-hidden', 'is-fixed-near-bottom', 'is-fixed-above-quote');
        section4CloseButton.classList.add('is-contained');

    }

}
