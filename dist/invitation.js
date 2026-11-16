const guest = new URLSearchParams(window.location.search).get('guest')?.trim();
if (guest) {
  document.querySelectorAll('.guest-name').forEach(element => {
    element.textContent = guest.slice(0, 120);
  });
}

const modal = document.querySelector('.opening-modal');
const openButton = modal.querySelector('.opening-button');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealGroups = [
  '.cover-content', '.invitation-heading', '.reception .card-inner',
  '.ceremony .card-inner', '.families > div', 'footer',
];
const revealElements = revealGroups.flatMap(selector =>
  [...document.querySelectorAll(selector)].flatMap(group => [...group.children])
);

function prepareText() {
  if (reduceMotion.matches || !('IntersectionObserver' in window)) return;
  revealElements.forEach(element => element.classList.add('reveal-text'));
}

function revealText() {
  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealElements.forEach(element => element.classList.add('is-visible'));
    return;
  }
  // Observe after the doors close so the first screen animates on entry too.
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const siblings = [...entry.target.parentElement.children];
      entry.target.style.setProperty('--reveal-delay', `${Math.min(siblings.indexOf(entry.target), 5) * 90}ms`);
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -35px 0px' });
  revealElements.forEach(element => observer.observe(element));
  reduceMotion.addEventListener('change', event => {
    if (!event.matches) return;
    revealElements.forEach(element => element.classList.add('is-visible'));
    observer.disconnect();
  });
}

function startAutoScroll() {
  if (reduceMotion.matches || document.hidden) return;

  const controller = new AbortController();
  const { signal } = controller;
  let frame = 0;
  let previousTime;
  let position = window.scrollY;
  const stop = () => {
    window.clearTimeout(delay);
    window.cancelAnimationFrame(frame);
    document.documentElement.classList.remove('auto-scrolling');
    controller.abort();
  };
  const step = time => {
    const bottom = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (position >= bottom) {
      stop();
      return;
    }
    if (previousTime !== undefined) {
      // Keep a steady reading pace without jumping after a delayed frame.
      position = Math.min(bottom, position + Math.min(time - previousTime, 100) * 0.028);
      window.scrollTo(0, position);
    }
    previousTime = time;
    frame = window.requestAnimationFrame(step);
  };
  const delay = window.setTimeout(() => {
    position = window.scrollY;
    document.documentElement.classList.add('auto-scrolling');
    frame = window.requestAnimationFrame(step);
  }, 2500);

  ['pointerdown', 'touchstart', 'wheel'].forEach(type => {
    window.addEventListener(type, stop, { passive: true, signal });
  });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Tab', 'Escape'].includes(event.key)) stop();
  }, { signal });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  }, { signal });
  reduceMotion.addEventListener('change', event => {
    if (event.matches) stop();
  }, { signal });
}

let opening = false;
function openInvitation() {
  if (opening) return;
  opening = true;
  openButton.disabled = true;
  modal.classList.add('is-opening');
  const finishOpening = () => {
    if (!modal.open) return;
    modal.close();
    document.body.classList.remove('invitation-locked');
    revealText();
    document.querySelector('.open-invitation').focus({ preventScroll: true });
    startAutoScroll();
  };
  if (reduceMotion.matches) {
    finishOpening();
    return;
  }
  modal.querySelector('.opening-door-right').addEventListener('transitionend', event => {
    if (event.propertyName === 'transform') finishOpening();
  }, { once: true });
  // Also finish if the browser interrupts the transition (for example tab switching).
  window.setTimeout(finishOpening, 2100);
}

if (typeof modal.showModal === 'function') {
  try {
    modal.showModal();
    document.body.classList.add('invitation-locked');
    prepareText();
    openButton.addEventListener('click', openInvitation);
    modal.addEventListener('cancel', event => {
      event.preventDefault();
      openInvitation();
    });
  } catch {
    revealText();
  }
} else {
  revealText();
}
