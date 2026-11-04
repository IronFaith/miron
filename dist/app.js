(() => {
  'use strict';
  const config = window.MIRON_CONFIG || {};
  const phone = String(config.phone || '').trim();
  const hasPhone = /^\+[1-9]\d{7,14}$/.test(phone);
  const dialog = document.querySelector('#contact-dialog');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };

  document.querySelectorAll('[data-call]').forEach(link => {
    if (hasPhone) {
      link.href = `tel:${phone}`;
      link.setAttribute('aria-label', `${link.textContent.trim()} at ${config.phoneDisplay || phone}`);
    } else {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        event.preventDefault();
        closeMenu();
        dialog.showModal();
      });
    }
  });

  if (hasPhone) {
    document.querySelector('[data-preview-note]').hidden = true;
    document.querySelector('[data-preview-footer]').hidden = true;
    document.querySelector('[data-contact-caption]').textContent = config.phoneDisplay || phone;
  }
  if (config.serviceArea) {
    const area = document.querySelector('[data-service-area]');
    area.textContent = `Serving ${config.serviceArea}`;
    area.hidden = false;
  }
  if (config.buyerName) {
    const buyer = document.querySelector('[data-buyer-detail]');
    buyer.textContent = `Your contact: ${config.buyerName}`;
    buyer.hidden = false;
  }

  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });
  dialog.querySelectorAll('button').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.querySelector('#year').textContent = String(new Date().getFullYear());
})();
