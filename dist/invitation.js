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
