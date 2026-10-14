document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  initMobileNav();
  initNavActive();
  initSplitText();
  initSliders();
});

function initSliders() {
  document.querySelectorAll('[data-slider]').forEach((slider) => {
    const track = slider.querySelector('[data-slider-track]');
    const section = slider.closest('section') || document;
    const prev = section.querySelector('[data-slider-prev]');
    const next = section.querySelector('[data-slider-next]');
    if (!track || !prev || !next) return;

    const step = () => {
      const card = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth;
    };

    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 1;
      prev.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= max;
    };

    prev.addEventListener('click', () => track.scrollBy({ left: -step() }));
    next.addEventListener('click', () => track.scrollBy({ left: step() }));
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    window.addEventListener('resize', update);
    update();
  });
}

const SPLIT_STAGGER = { chars: 0.015, words: 0.05, lines: 0.1 };

function initSplitText() {
  const { gsap, ScrollTrigger, SplitText } = window;
  if (!gsap || !ScrollTrigger || !SplitText) return;

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Refreshing mid-scroll cancels smooth anchor scrolling, so wait until scrolling settles.
  let refreshTimer;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      ScrollTrigger.refresh();
    }, 250);
  };
  window.addEventListener('scroll', () => {
    if (refreshTimer) scheduleRefresh();
  }, { passive: true });

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    document.querySelectorAll('[data-split]').forEach((el) => {
      const type = SPLIT_STAGGER[el.dataset.split] ? el.dataset.split : 'lines';
      let played = false;

      SplitText.create(el, {
        type: type === 'lines' ? 'lines' : `lines, ${type}`,
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          if (played) return undefined;

          return gsap.from(self[type], {
            yPercent: 110,
            duration: 0.9,
            ease: 'power3.out',
            stagger: SPLIT_STAGGER[type],
            onComplete: () => {
              self.revert();
              scheduleRefresh();
            },
            scrollTrigger: {
              trigger: el,
              start: 'clamp(top 85%)',
              once: true,
              onEnter: () => { played = true; },
            },
          });
        },
      });
    });
  });
}

function setCurrentYear() {
  document.querySelectorAll('[data-year]').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

function initNavActive() {
  const links = document.querySelectorAll('.nav-list a');

  links.forEach((link) => {
    link.addEventListener('click', () => {
      links.forEach((other) => {
        other.classList.toggle('is-active', other === link);
        if (other === link) {
          other.setAttribute('aria-current', 'location');
        } else {
          other.removeAttribute('aria-current');
        }
      });
    });
  });
}

function initMobileNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('nav-open'));
  });

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setOpen(false);
  });

  window.matchMedia('(min-width: 1025px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
