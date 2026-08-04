import {
    section1OpenButton,
    section2OpenButton,
    section3OpenButton,
    section4OpenButton,
    instagramDirectLink,
    section1Summary,
    section2Summary,
    section3Summary,
    section4Summary,
    section1Details,
    section2Details,
    section3Details,
    section4Details,
    clientStatisticsUpdatedAt,
    section3Subsection1DetailsHeading,
    section3Subsection2DetailsHeading,
    section3Subsection3DetailsHeading,
    section3Subsection4DetailsHeading,
    section3Subsection5DetailsHeading,
    section4Subsection1DetailsHeading,
    section4Subsection2DetailsHeading,
    section4Subsection3DetailsHeading,
    section3Subsection1OpenButton,
    section3Subsection2OpenButton,
    section3Subsection3OpenButton,
    section3Subsection4OpenButton,
    section3Subsection5OpenButton,
    section4Subsection1OpenButton,
    section4Subsection2OpenButton,
    section4Subsection3OpenButton,
    section1CloseButton,
    section2CloseButton,
    section3CloseButton,
    section4CloseButton,
    section3Subsection1CloseButton,
    section3Subsection2CloseButton,
    section3Subsection3CloseButton,
    section3Subsection4CloseButton,
    section3Subsection5CloseButton,
    section4Subsection1CloseButton,
    section4Subsection2CloseButton,
    section4Subsection3CloseButton,
    section3Subsection1Details,
    section3Subsection2Details,
    section3Subsection3Details,
    section3Subsection4Details,
    section3Subsection5Details,
    section4Subsection1Details,
    section4Subsection2Details,
    section4Subsection3Details,
    section3Subsection1Summary,
    section3Subsection2Summary,
    section3Subsection3Summary,
    section3Subsection4Summary,
    section3Subsection5Summary,
    section4Subsection1Summary,
    section4Subsection2Summary,
    section4Subsection3Summary,
    section1DetailsHeading,
    section2DetailsHeading,
    section3DetailsHeading,
    section4DetailsHeading,
    testimonial1Video,
    testimonial2Video,
    testimonial3Video,
    testimonial4Video,
    testimonial5Video
} from './elements.js';
import { preferredScrollBehavior } from './scroll-behavior.js';


section1OpenButton.addEventListener("click", function(event) {
    section1OpenButton.setAttribute("aria-expanded", "true");
    section2OpenButton.setAttribute("aria-expanded", "false");
    section3OpenButton.setAttribute("aria-expanded", "false");
    section4OpenButton.setAttribute("aria-expanded", "false");
    section1Summary.classList.add('is-hidden');
    section1Details.classList.add('is-open');
    section1Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section1DetailsHeading.focus({preventScroll: true});
    section1CloseButton.classList.add('is-fixed-near-bottom');
    section2Summary.classList.remove('is-hidden');
    section2Details.classList.remove('is-open');
    section3Summary.classList.remove('is-hidden');
    section3Details.classList.remove('is-open');
    section4Summary.classList.remove('is-hidden');
    section4Details.classList.remove('is-open');
})



section1CloseButton.addEventListener("click", function(event) {
    section1OpenButton.setAttribute("aria-expanded", "false");
    section1Summary.classList.remove('is-hidden');
    section1Details.classList.remove('is-open');
    section1Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section1OpenButton.focus({preventScroll: true});
})



section2OpenButton.addEventListener("click", function(event) {
    section1OpenButton.setAttribute("aria-expanded", "false");
    section2OpenButton.setAttribute("aria-expanded", "true");
    section3OpenButton.setAttribute("aria-expanded", "false");
    section4OpenButton.setAttribute("aria-expanded", "false");
    section1Summary.classList.remove('is-hidden');
    section1Details.classList.remove('is-open');
    section2Summary.classList.add('is-hidden');
    section2Details.classList.add('is-open');
    section2Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section2DetailsHeading.focus({preventScroll: true});
    section2CloseButton.classList.add('is-fixed-near-bottom');
    section3Summary.classList.remove('is-hidden');
    section3Details.classList.remove('is-open');
    section4Summary.classList.remove('is-hidden');
    section4Details.classList.remove('is-open');
})

section2CloseButton.addEventListener("click", function(event) {
    section2OpenButton.setAttribute("aria-expanded", "false");
    section2Summary.classList.remove('is-hidden');
    section2Details.classList.remove('is-open');
    section2Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section2OpenButton.focus({preventScroll: true});
})


section3OpenButton.addEventListener("click", function(event) {
    section1OpenButton.setAttribute("aria-expanded", "false");
    section2OpenButton.setAttribute("aria-expanded", "false");
    section3OpenButton.setAttribute("aria-expanded", "true");
    section4OpenButton.setAttribute("aria-expanded", "false");
    section1Summary.classList.remove('is-hidden');
    section1Details.classList.remove('is-open');
    section2Summary.classList.remove('is-hidden');
    section2Details.classList.remove('is-open');
    section3Summary.classList.add('is-hidden');
    section3Details.classList.add('is-open');
    section3Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section3DetailsHeading.focus({preventScroll: true});
    section3CloseButton.classList.add('is-fixed-near-bottom');
    section4Summary.classList.remove('is-hidden');
    section4Details.classList.remove('is-open');
})

section3CloseButton.addEventListener("click", function(event) {
    section3OpenButton.setAttribute("aria-expanded", "false");

    section3Summary.classList.remove('is-hidden');
    section3Details.classList.remove('is-open');
    section3Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section3OpenButton.focus({preventScroll: true});

    section3Subsection1Summary.classList.remove('is-hidden');
    section3Subsection1Details.classList.remove('is-open');
    section3Subsection1OpenButton.setAttribute("aria-expanded", "false");

    section3Subsection2Summary.classList.remove('is-hidden');
    section3Subsection2Details.classList.remove('is-open');
    section3Subsection2OpenButton.setAttribute("aria-expanded", "false");

    section3Subsection3Summary.classList.remove('is-hidden');
    section3Subsection3Details.classList.remove('is-open');
    section3Subsection3OpenButton.setAttribute("aria-expanded", "false");

    section3Subsection4Summary.classList.remove('is-hidden');
    section3Subsection4Details.classList.remove('is-open');
    section3Subsection4OpenButton.setAttribute("aria-expanded", "false");

    section3Subsection5Summary.classList.remove('is-hidden');
    section3Subsection5Details.classList.remove('is-open');
    section3Subsection5OpenButton.setAttribute("aria-expanded", "false");
})


section3Subsection1OpenButton.addEventListener("click", function(event) {
    section3Subsection1OpenButton.setAttribute("aria-expanded", "true");
    section3Subsection2OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection3OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection4OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection5OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection1Summary.classList.add('is-hidden');
    section3Subsection1Details.classList.add('is-open');
    section3Subsection1Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection1DetailsHeading.focus({preventScroll: true});

    section3Subsection2Summary.classList.remove('is-hidden');
    section3Subsection2Details.classList.remove('is-open');

    section3Subsection3Summary.classList.remove('is-hidden');
    section3Subsection3Details.classList.remove('is-open');

    section3Subsection4Summary.classList.remove('is-hidden');
    section3Subsection4Details.classList.remove('is-open');

    section3Subsection5Summary.classList.remove('is-hidden');
    section3Subsection5Details.classList.remove('is-open');

})

section3Subsection1CloseButton.addEventListener("click", function(event) {
    section3Subsection1OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection1Summary.classList.remove('is-hidden');
    section3Subsection1Details.classList.remove('is-open');
    section3Subsection1Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection1OpenButton.focus({preventScroll: true});
})


section3Subsection2OpenButton.addEventListener("click", function(event) {
    section3Subsection1OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection2OpenButton.setAttribute("aria-expanded", "true");
    section3Subsection3OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection4OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection5OpenButton.setAttribute("aria-expanded", "false");

    section3Subsection1Summary.classList.remove('is-hidden');
    section3Subsection1Details.classList.remove('is-open');

    section3Subsection2Summary.classList.add('is-hidden');
    section3Subsection2Details.classList.add('is-open');
    section3Subsection2Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection2DetailsHeading.focus({preventScroll: true});

    section3Subsection3Summary.classList.remove('is-hidden');
    section3Subsection3Details.classList.remove('is-open');

    section3Subsection4Summary.classList.remove('is-hidden');
    section3Subsection4Details.classList.remove('is-open');

    section3Subsection5Summary.classList.remove('is-hidden');
    section3Subsection5Details.classList.remove('is-open');

})

section3Subsection2CloseButton.addEventListener("click", function(event) {
    section3Subsection2OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection2Summary.classList.remove('is-hidden');
    section3Subsection2Details.classList.remove('is-open');
    section3Subsection2Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection2OpenButton.focus({preventScroll: true});
})


section3Subsection3OpenButton.addEventListener("click", function(event) {
    section3Subsection1OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection2OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection3OpenButton.setAttribute("aria-expanded", "true");
    section3Subsection4OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection5OpenButton.setAttribute("aria-expanded", "false");

    section3Subsection1Summary.classList.remove('is-hidden');
    section3Subsection1Details.classList.remove('is-open');

    section3Subsection2Summary.classList.remove('is-hidden');
    section3Subsection2Details.classList.remove('is-open');

    section3Subsection3Summary.classList.add('is-hidden');
    section3Subsection3Details.classList.add('is-open');
    section3Subsection3Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection3DetailsHeading.focus({preventScroll: true});

    section3Subsection4Summary.classList.remove('is-hidden');
    section3Subsection4Details.classList.remove('is-open');

    section3Subsection5Summary.classList.remove('is-hidden');
    section3Subsection5Details.classList.remove('is-open');

})

section3Subsection3CloseButton.addEventListener("click", function(event) {
    section3Subsection3OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection3Summary.classList.remove('is-hidden');
    section3Subsection3Details.classList.remove('is-open');
    section3Subsection3Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection3OpenButton.focus({preventScroll: true});
})


section3Subsection4OpenButton.addEventListener("click", function(event) {
    section3Subsection1OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection2OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection3OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection4OpenButton.setAttribute("aria-expanded", "true");
    section3Subsection5OpenButton.setAttribute("aria-expanded", "false");

    section3Subsection1Summary.classList.remove('is-hidden');
    section3Subsection1Details.classList.remove('is-open');

    section3Subsection2Summary.classList.remove('is-hidden');
    section3Subsection2Details.classList.remove('is-open');

    section3Subsection3Summary.classList.remove('is-hidden');
    section3Subsection3Details.classList.remove('is-open');

    section3Subsection4Summary.classList.add('is-hidden');
    section3Subsection4Details.classList.add('is-open');
    section3Subsection4Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection4DetailsHeading.focus({preventScroll: true});

    section3Subsection5Summary.classList.remove('is-hidden');
    section3Subsection5Details.classList.remove('is-open');

})

section3Subsection4CloseButton.addEventListener("click", function(event) {
    section3Subsection4OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection4Summary.classList.remove('is-hidden');
    section3Subsection4Details.classList.remove('is-open');
    section3Subsection4Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection4OpenButton.focus({preventScroll: true});
})


section3Subsection5OpenButton.addEventListener("click", function(event) {
    section3Subsection1OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection2OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection3OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection4OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection5OpenButton.setAttribute("aria-expanded", "true");

    section3Subsection1Summary.classList.remove('is-hidden');
    section3Subsection1Details.classList.remove('is-open');

    section3Subsection2Summary.classList.remove('is-hidden');
    section3Subsection2Details.classList.remove('is-open');

    section3Subsection3Summary.classList.remove('is-hidden');
    section3Subsection3Details.classList.remove('is-open');

    section3Subsection4Summary.classList.remove('is-hidden');
    section3Subsection4Details.classList.remove('is-open');

    section3Subsection5Summary.classList.add('is-hidden');
    section3Subsection5Details.classList.add('is-open');
    section3Subsection5Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection5DetailsHeading.focus({preventScroll: true});

})

section3Subsection5CloseButton.addEventListener("click", function(event) {
    section3Subsection5OpenButton.setAttribute("aria-expanded", "false");
    section3Subsection5Summary.classList.remove('is-hidden');
    section3Subsection5Details.classList.remove('is-open');
    section3Subsection5Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section3Subsection5OpenButton.focus({preventScroll: true});
})


section4OpenButton.addEventListener("click", function(event) {
    section1OpenButton.setAttribute("aria-expanded", "false");
    section2OpenButton.setAttribute("aria-expanded", "false");
    section3OpenButton.setAttribute("aria-expanded", "false");
    section4OpenButton.setAttribute("aria-expanded", "true");
    section1Summary.classList.remove('is-hidden');
    section1Details.classList.remove('is-open');
    section2Summary.classList.remove('is-hidden');
    section2Details.classList.remove('is-open');
    section3Summary.classList.remove('is-hidden');
    section3Details.classList.remove('is-open');
    section4Summary.classList.add('is-hidden');
    section4Details.classList.add('is-open');
    section4Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section4DetailsHeading.focus({preventScroll: true});
    section4CloseButton.classList.add('is-fixed-near-bottom');
    instagramDirectLink.classList.add('has-fixed-position');
})

section4CloseButton.addEventListener("click", function(event) {
    section4OpenButton.setAttribute("aria-expanded", "false");

    section4Summary.classList.remove('is-hidden');
    section4Details.classList.remove('is-open');
    section4Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section4OpenButton.focus({preventScroll: true});

    if (!testimonial1Video.paused) testimonial1Video.pause();
    if (!testimonial2Video.paused) testimonial2Video.pause();
    if (!testimonial3Video.paused) testimonial3Video.pause();
    if (!testimonial4Video.paused) testimonial4Video.pause();
    if (!testimonial5Video.paused) testimonial5Video.pause();

    section4Subsection1Summary.classList.remove('is-hidden');
    section4Subsection1Details.classList.remove('is-open');
    section4Subsection1OpenButton.setAttribute("aria-expanded", "false");

    section4Subsection2Summary.classList.remove('is-hidden');
    section4Subsection2Details.classList.remove('is-open');
    section4Subsection2OpenButton.setAttribute("aria-expanded", "false");

    section4Subsection3Summary.classList.remove('is-hidden');
    section4Subsection3Details.classList.remove('is-open');
    section4Subsection3OpenButton.setAttribute("aria-expanded", "false");

})


section4Subsection1OpenButton.addEventListener("click", function(event) {
    section4Subsection1OpenButton.setAttribute("aria-expanded", "true");
    section4Subsection2OpenButton.setAttribute("aria-expanded", "false");
    section4Subsection3OpenButton.setAttribute("aria-expanded", "false");

    section4Subsection1Summary.classList.add('is-hidden');
    section4Subsection1Details.classList.add('is-open');
    section4Subsection1Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section4Subsection1DetailsHeading.focus({preventScroll: true});

    section4Subsection2Summary.classList.remove('is-hidden');
    section4Subsection2Details.classList.remove('is-open');

    section4Subsection3Summary.classList.remove('is-hidden');
    section4Subsection3Details.classList.remove('is-open');

})

section4Subsection1CloseButton.addEventListener("click", function(event) {
    section4Subsection1OpenButton.setAttribute("aria-expanded", "false");

    section4Subsection1Summary.classList.remove('is-hidden');
    section4Subsection1Details.classList.remove('is-open');
    section4Subsection1Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section4Subsection1OpenButton.focus({preventScroll: true});

})


section4Subsection2OpenButton.addEventListener("click", function(event) {
    section4Subsection1OpenButton.setAttribute("aria-expanded", "false");
    section4Subsection2OpenButton.setAttribute("aria-expanded", "true");
    section4Subsection3OpenButton.setAttribute("aria-expanded", "false");

    section4Subsection1Summary.classList.remove('is-hidden');
    section4Subsection1Details.classList.remove('is-open');

    section4Subsection2Summary.classList.add('is-hidden');
    section4Subsection2Details.classList.add('is-open');
    section4Subsection2Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section4Subsection2DetailsHeading.focus({preventScroll: true});

    section4Subsection3Summary.classList.remove('is-hidden');
    section4Subsection3Details.classList.remove('is-open');

    clientStatisticsUpdatedAt.innerHTML = "Data e hora de atualização: " + new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

})

section4Subsection2CloseButton.addEventListener("click", function(event) {
    section4Subsection2OpenButton.setAttribute("aria-expanded", "false");

    section4Subsection2Summary.classList.remove('is-hidden');
    section4Subsection2Details.classList.remove('is-open');
    section4Subsection2Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section4Subsection2OpenButton.focus({preventScroll: true});

})


section4Subsection3OpenButton.addEventListener("click", function(event) {
    section4Subsection1OpenButton.setAttribute("aria-expanded", "false");
    section4Subsection2OpenButton.setAttribute("aria-expanded", "false");
    section4Subsection3OpenButton.setAttribute("aria-expanded", "true");

    section4Subsection1Summary.classList.remove('is-hidden');
    section4Subsection1Details.classList.remove('is-open');

    section4Subsection2Summary.classList.remove('is-hidden');
    section4Subsection2Details.classList.remove('is-open');

    section4Subsection3Summary.classList.add('is-hidden');
    section4Subsection3Details.classList.add('is-open');
    section4Subsection3Details.scrollIntoView({behavior: preferredScrollBehavior()});
    section4Subsection3DetailsHeading.focus({preventScroll: true});

})

section4Subsection3CloseButton.addEventListener("click", function(event) {
    section4Subsection3OpenButton.setAttribute("aria-expanded", "false");

    section4Subsection3Summary.classList.remove('is-hidden');
    section4Subsection3Details.classList.remove('is-open');
    section4Subsection3Summary.scrollIntoView({behavior: preferredScrollBehavior()});
    section4Subsection3OpenButton.focus({preventScroll: true});

    if (!testimonial1Video.paused) testimonial1Video.pause();
    if (!testimonial2Video.paused) testimonial2Video.pause();
    if (!testimonial3Video.paused) testimonial3Video.pause();
    if (!testimonial4Video.paused) testimonial4Video.pause();
    if (!testimonial5Video.paused) testimonial5Video.pause();

})
