import {
    testimonial1ViewToggle,
    testimonial2ViewToggle,
    testimonial3ViewToggle,
    testimonial4ViewToggle,
    testimonial5ViewToggle,
    testimonial1VideoContainer,
    testimonial2VideoContainer,
    testimonial3VideoContainer,
    testimonial4VideoContainer,
    testimonial5VideoContainer,
    testimonial1ViewToggleLabel,
    testimonial2ViewToggleLabel,
    testimonial3ViewToggleLabel,
    testimonial4ViewToggleLabel,
    testimonial5ViewToggleLabel,
    testimonial1Video,
    testimonial2Video,
    testimonial3Video,
    testimonial4Video,
    testimonial5Video
} from './elements.js';
import { preferredScrollBehavior } from './scroll-behavior.js';
import { updateScrollState } from './scroll-state.js';


testimonial1ViewToggle.addEventListener("click", function(event) {

    if (!testimonial1VideoContainer.classList.contains('is-rotated')) {

        testimonial1VideoContainer.classList.remove('is-restored');
        testimonial1VideoContainer.classList.add('is-rotated');

        testimonial1ViewToggleLabel.innerHTML = 'Tela Padrão';
        testimonial1ViewToggle.setAttribute("aria-pressed", "true");

        testimonial1Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    } else {

        testimonial1VideoContainer.classList.remove('is-rotated');
        testimonial1VideoContainer.classList.add('is-restored');

        testimonial1ViewToggleLabel.innerHTML = 'Tela Cheia';
        testimonial1ViewToggle.setAttribute("aria-pressed", "false");

        testimonial1Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    }

})


testimonial2ViewToggle.addEventListener("click", function(event) {

    if (!testimonial2VideoContainer.classList.contains('is-rotated')) {

        testimonial2VideoContainer.classList.remove('is-restored');
        testimonial2VideoContainer.classList.add('is-rotated');

        testimonial2ViewToggleLabel.innerHTML = 'Tela Padrão';
        testimonial2ViewToggle.setAttribute("aria-pressed", "true");

        testimonial2Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    } else {

        testimonial2VideoContainer.classList.remove('is-rotated');
        testimonial2VideoContainer.classList.add('is-restored');

        testimonial2ViewToggleLabel.innerHTML = 'Tela Cheia';
        testimonial2ViewToggle.setAttribute("aria-pressed", "false");

        testimonial2Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    }

})


testimonial3ViewToggle.addEventListener("click", function(event) {

    if (!testimonial3VideoContainer.classList.contains('is-rotated')) {

        testimonial3VideoContainer.classList.remove('is-restored');
        testimonial3VideoContainer.classList.add('is-rotated');

        testimonial3ViewToggleLabel.innerHTML = 'Tela Padrão';
        testimonial3ViewToggle.setAttribute("aria-pressed", "true");

        testimonial3Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    } else {

        testimonial3VideoContainer.classList.remove('is-rotated');
        testimonial3VideoContainer.classList.add('is-restored');

        testimonial3ViewToggleLabel.innerHTML = 'Tela Cheia';
        testimonial3ViewToggle.setAttribute("aria-pressed", "false");

        testimonial3Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    }

})


testimonial4ViewToggle.addEventListener("click", function(event) {

    if (!testimonial4VideoContainer.classList.contains('is-rotated')) {

        testimonial4VideoContainer.classList.remove('is-restored');
        testimonial4VideoContainer.classList.add('is-rotated');

        testimonial4ViewToggleLabel.innerHTML = 'Tela Padrão';
        testimonial4ViewToggle.setAttribute("aria-pressed", "true");

        testimonial4Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    } else {

        testimonial4VideoContainer.classList.remove('is-rotated');
        testimonial4VideoContainer.classList.add('is-restored');

        testimonial4ViewToggleLabel.innerHTML = 'Tela Cheia';
        testimonial4ViewToggle.setAttribute("aria-pressed", "false");

        testimonial4Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    }

})


testimonial5ViewToggle.addEventListener("click", function(event) {

    if (!testimonial5VideoContainer.classList.contains('is-rotated')) {

        testimonial5VideoContainer.classList.remove('is-restored');
        testimonial5VideoContainer.classList.add('is-rotated');

        testimonial5ViewToggleLabel.innerHTML = 'Tela Padrão';
        testimonial5ViewToggle.setAttribute("aria-pressed", "true");

        testimonial5Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    } else {

        testimonial5VideoContainer.classList.remove('is-rotated');
        testimonial5VideoContainer.classList.add('is-restored');

        testimonial5ViewToggleLabel.innerHTML = 'Tela Cheia';
        testimonial5ViewToggle.setAttribute("aria-pressed", "false");

        testimonial5Video.scrollIntoView({behavior: preferredScrollBehavior()});

        updateScrollState();

    }

})
