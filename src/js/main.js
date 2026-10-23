import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  initMobileNav();
  initHeaderScroll();
  initNavActive();
  initSplitText();
  initSliders();
  initButtonFx();
  initStepsLine();
  initBackToTop();
  initSectorTabs();
  initRfqForm();
});

// Contact page: request-for-quotation form. There is no backend, so a valid form opens the
// visitor's email app with the details filled in (attachments have to be added there).
function initRfqForm() {
  const form = document.querySelector('[data-rfq-form]');
  if (!form) return;

  const status = form.querySelector('[data-rfq-status]');
  const upload = form.querySelector('[data-rfq-upload]');
  const fileInput = upload.querySelector('input[type="file"]');
  const uploadTitle = upload.querySelector('[data-rfq-upload-title]');
  const defaultTitle = uploadTitle.textContent;

  const showFiles = () => {
    const names = [...fileInput.files].map((file) => file.name);
    uploadTitle.textContent = names.length ? names.join(', ') : defaultTitle;
  };
  fileInput.addEventListener('change', showFiles);
  ['dragenter', 'dragover'].forEach((type) => upload.addEventListener(type, (event) => {
    event.preventDefault();
    upload.classList.add('is-dragover');
  }));
  ['dragleave', 'drop'].forEach((type) => upload.addEventListener(type, () => upload.classList.remove('is-dragover')));
  upload.addEventListener('drop', (event) => {
    event.preventDefault();
    fileInput.files = event.dataTransfer.files;
    showFiles();
  });

  form.addEventListener('input', (event) => event.target.classList.remove('is-invalid'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
    if (invalid.length) {
      invalid.forEach((el) => el.classList.add('is-invalid'));
      invalid[0].focus();
      status.textContent = 'Please complete the required fields marked with *.';
      return;
    }

    const lines = [...form.querySelectorAll('.rfq-input')]
      .filter((el) => el.value.trim())
      .map((el) => `${form.querySelector(`label[for="${el.id}"]`).firstChild.textContent.trim()}: ${el.value.trim()}`);
    if (fileInput.files.length) lines.push('', `Documents to attach: ${[...fileInput.files].map((f) => f.name).join(', ')}`);

    const subject = `Request for Quotation - ${form.elements.company.value.trim()}`;
    window.location.href = `mailto:info@relycoltd.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    status.textContent = fileInput.files.length
      ? 'Your email app has opened with your details. Please attach your documents before sending.'
      : 'Your email app has opened with your details. Please review and send the email.';
  });
}

// Industries page: tab list that switches the detail panel (click, or arrow keys / Home / End).
function initSectorTabs() {
  document.querySelectorAll('[data-sector-tabs]').forEach((root) => {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const select = (tab, focus) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        panel.hidden = !on;
        panel.classList.toggle('is-active', on);
      });
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(tab, false));
      tab.addEventListener('keydown', (event) => {
        const keys = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(event.key in keys)) return;
        event.preventDefault();
        select(tabs[(keys[event.key] + tabs.length) % tabs.length], true);
      });
    });
  });
}

// Footer "Back to top": scroll the current page to the top without navigating or changing the URL.
// Uses GSAP's ScrollToPlugin rather than native smooth scrolling, which ScrollTrigger refreshes
// can cancel part-way; refreshes wait (see scheduleRefresh) until the scroll has finished.
let programmaticScroll = false;

function initBackToTop() {
  gsap.registerPlugin(ScrollToPlugin);
  const root = document.documentElement;
  const visitorInput = ['wheel', 'touchstart', 'keydown'];

  document.querySelectorAll('.back-to-top').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let tween;
      const stop = () => tween.kill();
      const done = () => {
        programmaticScroll = false;
        root.style.scrollBehavior = '';
        visitorInput.forEach((type) => window.removeEventListener(type, stop));
      };

      programmaticScroll = true;
      // CSS `scroll-behavior: smooth` would smooth every frame GSAP sets, so pause it meanwhile.
      root.style.scrollBehavior = 'auto';
      tween = gsap.to(window, {
        scrollTo: { y: 0, autoKill: false },
        duration: reduceMotion ? 0 : Math.min(1.4, 0.5 + window.scrollY / 10000),
        ease: 'power2.inOut',
        overwrite: true,
        onComplete: done,
        onInterrupt: done,
      });
      visitorInput.forEach((type) => window.addEventListener(type, stop, { passive: true, once: true }));
    });
  });
}

// Arriving from another page with a #section link: the browser's smooth scroll to the
// section is cancelled by ScrollTrigger's load-time refresh, so jump there once ready.
// Text animations that play on the way can settle the layout a few pixels shorter, so
// re-align after each ScrollTrigger refresh until the visitor starts scrolling.
window.addEventListener('load', () => {
  const target = window.location.hash && document.getElementById(window.location.hash.slice(1));
  if (!target) return;

  const align = () => target.scrollIntoView({ behavior: 'instant', block: 'start' });
  const stop = () => {
    ScrollTrigger.removeEventListener('refresh', align);
    ['wheel', 'touchstart', 'keydown'].forEach((type) => window.removeEventListener(type, stop));
  };

  requestAnimationFrame(align);
  ScrollTrigger.addEventListener('refresh', align);
  ['wheel', 'touchstart', 'keydown'].forEach((type) => window.addEventListener(type, stop, { passive: true }));
  setTimeout(stop, 3000);
});

// "How it works" timeline: draw the line from its start once it scrolls into view.
function initStepsLine() {
  const steps = document.querySelector('.steps');
  if (!steps) return;

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    steps.classList.add('js-draw');
    const trigger = ScrollTrigger.create({
      trigger: steps,
      start: 'clamp(top 75%)',
      once: true,
      onEnter: () => steps.classList.add('is-drawn'),
    });
    return () => {
      trigger.kill();
      steps.classList.remove('js-draw', 'is-drawn');
    };
  });
}

// Hover fill: the icon tile expands across the button, revealing an inverted copy of
// the label while the chevron travels to the end of the centred label + chevron group.
function initButtonFx() {
  const buttons = [...document.querySelectorAll('.btn')].filter((btn) => btn.querySelector('.btn-icon img'));

  buttons.forEach((btn) => {
    const textNodes = [...btn.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    const text = textNodes.map((n) => n.textContent.trim()).join(' ');
    textNodes.forEach((n) => n.remove());

    const label = document.createElement('span');
    label.className = 'btn-label';
    label.textContent = text;

    const fill = document.createElement('span');
    fill.className = 'btn-fill';
    fill.setAttribute('aria-hidden', 'true');
    const fillLabel = document.createElement('span');
    fillLabel.className = 'btn-fill-label';
    fillLabel.textContent = text;
    fill.append(fillLabel);

    btn.append(label, fill);
    btn.classList.add('is-fx');
  });

  const layout = (btn) => {
    const icon = btn.querySelector('.btn-icon');
    const chevron = icon.querySelector('img');
    const label = btn.querySelector('.btn-label');
    const inset = icon.offsetLeft;
    const fullWidth = btn.clientWidth - inset * 2;
    const gap = parseFloat(getComputedStyle(btn).columnGap) || 0;
    const groupStart = Math.max(0, (fullWidth - (label.offsetWidth + gap + chevron.offsetWidth)) / 2);
    const vars = {
      '--fx-l': inset,
      '--fx-t': icon.offsetTop,
      '--fx-h': icon.offsetHeight,
      '--fx-w0': icon.offsetWidth,
      '--fx-w1': fullWidth,
      '--fx-label-x': groupStart,
      '--fx-chev': inset + groupStart + label.offsetWidth + gap - chevron.offsetLeft,
      '--fx-push': fullWidth - icon.offsetWidth,
    };
    // Whole pixels keep the chevron and label on the pixel grid (fractional offsets blur them).
    Object.entries(vars).forEach(([name, value]) => btn.style.setProperty(name, `${Math.round(value)}px`));
    btn.style.setProperty('--fx-r', getComputedStyle(icon).borderRadius);
  };

  const observer = new ResizeObserver((entries) => entries.forEach((entry) => layout(entry.target)));
  buttons.forEach((btn) => {
    layout(btn);
    observer.observe(btn);
  });
  document.fonts?.ready.then(() => buttons.forEach(layout));

  // Touch screens have no hover, and :active only lasts for the instant of a tap, so play the
  // same effect on touch with a press class held for at least one full transition. It is always
  // removed on release, so nothing stays stuck, and the tap/navigation itself is never delayed.
  const minPress = (parseFloat(buttons[0] && getComputedStyle(buttons[0]).getPropertyValue('--fx-dur')) || 0.34) * 1000;
  buttons.forEach((btn) => {
    let pressedAt = 0;
    let releaseTimer;
    const release = () => {
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => btn.classList.remove('is-pressed'), Math.max(0, minPress - (performance.now() - pressedAt)));
    };
    btn.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse') return;
      clearTimeout(releaseTimer);
      pressedAt = performance.now();
      btn.classList.add('is-pressed');
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => btn.addEventListener(type, (event) => {
      if (event.pointerType !== 'mouse' && btn.classList.contains('is-pressed')) release();
    }));
  });
  window.addEventListener('pageshow', () => buttons.forEach((btn) => btn.classList.remove('is-pressed')));
}

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
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Refreshing mid-scroll cancels smooth anchor scrolling, so wait until scrolling settles.
  let refreshTimer;
  const scheduleRefresh = () => {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (programmaticScroll) {
        scheduleRefresh();
        return;
      }
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

// Header: switch to the floating glass bar once the page has been scrolled.
function initHeaderScroll() {
  const header = document.querySelector('[data-header]');
  if (!header) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  update();
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
