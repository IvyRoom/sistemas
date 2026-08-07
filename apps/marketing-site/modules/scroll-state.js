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


const closeButtonPositionClasses = [
    'is-contained',
    'is-fixed-above-quote',
    'is-fixed-near-bottom',
    'is-hidden'
];
const quotePromptPositionClasses = [
    'has-contained-close-button',
    'has-fixed-close-button'
];
const instagramDirectPositionClasses = [
    'has-fixed-position',
    'is-contained',
    'is-fixed',
    'is-hidden'
];


quoteCta.classList.add('is-hidden', 'is-fixed');


export function updateQuoteCtaPosition() {
    const section1Top = section1.offsetTop;
    const viewportBottom = window.scrollY + window.innerHeight;

    if (viewportBottom < section1Top) {
        quoteCta.classList.remove('is-anchored');
        quoteCta.classList.add('is-hidden', 'is-fixed');
        return quoteCta.offsetHeight;
    }

    quoteCta.classList.remove('is-hidden');
    const quoteCtaHeight = quoteCta.offsetHeight;
    quoteCtaSpacer.style.setProperty('--quote-cta-height', quoteCtaHeight + 'px');

    if (viewportBottom < section1Top + quoteCtaHeight) {
        quoteCta.classList.remove('is-fixed');
        quoteCta.classList.add('is-anchored');
        quoteCta.style.setProperty('--quote-cta-top', section1Top + 'px');
    } else {
        quoteCta.classList.remove('is-anchored');
        quoteCta.classList.add('is-fixed');
    }

    return quoteCtaHeight;
}


function setSectionCloseState(closeButton, quotePrompt, state, quoteCtaHeight) {
    closeButton.classList.remove(...closeButtonPositionClasses);
    quotePrompt.classList.remove(...quotePromptPositionClasses);

    if (state === 'hidden') {
        closeButton.classList.add('is-hidden');
        return;
    }

    if (state === 'fixed') {
        quotePrompt.classList.add('has-fixed-close-button');
        closeButton.classList.add('is-fixed-above-quote');
        closeButton.style.setProperty('--section-close-bottom', quoteCtaHeight + 15 + 'px');
        return;
    }

    quotePrompt.classList.add('has-contained-close-button');
    closeButton.classList.add('is-contained');
}


function updateSectionCloseState(
    closeButton,
    quotePrompt,
    sectionTop,
    nextSectionTop,
    quoteCtaHeight,
    scrollTop
) {
    if (scrollTop < sectionTop) {
        setSectionCloseState(closeButton, quotePrompt, 'hidden', quoteCtaHeight);
    } else if (scrollTop <= nextSectionTop - window.innerHeight + quoteCtaHeight) {
        setSectionCloseState(closeButton, quotePrompt, 'fixed', quoteCtaHeight);
    } else {
        setSectionCloseState(closeButton, quotePrompt, 'contained', quoteCtaHeight);
    }
}


function updateInstagramDirectState(section3Top, section4Top, quoteCtaHeight, scrollTop) {
    instagramDirectLink.classList.remove(...instagramDirectPositionClasses);

    if (
        userAgent.indexOf('Instagram') !== -1 ||
        scrollTop < section3Top
    ) {
        instagramDirectLink.classList.add('is-hidden');
    } else if (scrollTop <= section4Top - window.innerHeight + quoteCtaHeight) {
        instagramDirectLink.classList.add('is-fixed');
    } else {
        instagramDirectLink.classList.add('is-contained');
    }
}


function pausePrimaryVideoOutsideViewport() {
    if (primaryVideo === null || primaryVideo.paused) return;

    const primaryVideoFrameBounds = primaryVideoFrame.getBoundingClientRect();
    if (
        primaryVideoFrameBounds.bottom <= 0 ||
        primaryVideoFrameBounds.top >= window.innerHeight
    ) {
        primaryVideo.pause();
    }
}


export function updateScrollState() {
    const quoteCtaHeight = updateQuoteCtaPosition();
    const scrollTop = Math.ceil(window.scrollY);
    const section1Top = section1.offsetTop;
    const section2Top = section2.offsetTop;
    const section3Top = section3.offsetTop;
    const section4Top = section4.offsetTop;
    const quoteCtaSpacerTop = quoteCtaSpacer.offsetTop;

    pausePrimaryVideoOutsideViewport();
    updateSectionCloseState(
        section1CloseButton,
        section1QuotePrompt,
        section1Top,
        section2Top,
        quoteCtaHeight,
        scrollTop
    );
    updateSectionCloseState(
        section2CloseButton,
        section2QuotePrompt,
        section2Top,
        section3Top,
        quoteCtaHeight,
        scrollTop
    );
    updateSectionCloseState(
        section3CloseButton,
        section3QuotePrompt,
        section3Top,
        section4Top,
        quoteCtaHeight,
        scrollTop
    );
    updateSectionCloseState(
        section4CloseButton,
        section4QuotePrompt,
        section4Top,
        quoteCtaSpacerTop,
        quoteCtaHeight,
        scrollTop
    );
    updateInstagramDirectState(section3Top, section4Top, quoteCtaHeight, scrollTop);
}


window.addEventListener('scroll', updateScrollState, { passive: true });
window.addEventListener('resize', updateScrollState);
window.addEventListener('load', updateScrollState);
window.addEventListener('pageshow', updateScrollState);
updateScrollState();
