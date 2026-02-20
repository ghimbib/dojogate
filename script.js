// ============================================================
// DojoGate Landing Page — JavaScript
// ============================================================

// Enable animation class on body (graceful degradation)
document.documentElement.classList.add('js-anim');

// Scroll animations (IntersectionObserver)
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('[data-anim]').forEach((el) => observer.observe(el));

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = navToggle.querySelectorAll('span');
  if (navLinks.classList.contains('open')) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans[0].style.transform = '';
    spans[1].style.opacity = '';
    spans[2].style.transform = '';
  }
});

// Close nav on link click (mobile)
navLinks.querySelectorAll('a').forEach((a) => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.querySelectorAll('span').forEach((s) => {
      s.style.transform = '';
      s.style.opacity = '';
    });
  });
});

// Billing toggle (monthly/annual)
const billingToggle = document.getElementById('billingToggle');
const monthlyLabel = document.getElementById('monthlyLabel');
const annualLabel = document.getElementById('annualLabel');
const priceNums = document.querySelectorAll('.price-num[data-monthly]');
const priceStrikes = document.querySelectorAll('.price-strike[data-monthly]');

function updatePricing() {
  const isAnnual = billingToggle.checked;
  monthlyLabel.classList.toggle('active', !isAnnual);
  annualLabel.classList.toggle('active', isAnnual);

  // Update promo prices
  priceNums.forEach((el) => {
    const target = isAnnual ? el.dataset.annual : el.dataset.monthly;
    animatePrice(el, parseFloat(el.textContent), parseFloat(target));
  });

  // Update strike-through prices
  priceStrikes.forEach((el) => {
    const target = isAnnual ? el.dataset.annual : el.dataset.monthly;
    el.textContent = '$' + target;
  });

  // Update promo notes (for first 2 months text)
  document.querySelectorAll('.price-promo-note').forEach((el) => {
    const card = el.closest('.price-card');
    const strike = card.querySelector('.price-strike');
    if (strike) {
      const regularPrice = isAnnual ? strike.dataset.annual : strike.dataset.monthly;
      el.textContent = `for first 2 months, then $${regularPrice}/mo`;
    }
  });
}

function animatePrice(el, from, to) {
  const duration = 300;
  const start = performance.now();
  const isDecimal = to % 1 !== 0;

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * eased;
    el.textContent = isDecimal ? current.toFixed(2) : Math.round(current);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

billingToggle.addEventListener('change', updatePricing);

// Count-up animation for stats bar
const statObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target.querySelector('.stat-value[data-count]');
        if (el) {
          const target = parseInt(el.dataset.count);
          animateNumber(el, 0, target);
        }
        entry.target.classList.add('visible');
        statObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll('.stat[data-anim]').forEach((el) => statObserver.observe(el));

// Contact form submission
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  // Collect form data
  const formData = new FormData(contactForm);
  const data = Object.fromEntries(formData.entries());

  try {
    // Get reCAPTCHA v3 token (invisible — no user interaction)
    let recaptchaToken = null;
    if (typeof grecaptcha !== 'undefined') {
      recaptchaToken = await grecaptcha.execute('6LegbXAsAAAAAOWyBz8xoGeeY6yMRpcm06nUKelG', { action: 'contact_form' });
    }

    const res = await fetch('https://app.dojogate.ai/api/v1/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, recaptcha_token: recaptchaToken }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || 'Server error');
    }

    // Track conversion in GA4
    if (typeof gtag !== 'undefined') {
      gtag('event', 'generate_lead', {
        event_category: 'contact_form',
        event_label: data.industry || 'not_specified',
        value: 1,
      });
    }

    // Show success state
    contactForm.style.display = 'none';
    formSuccess.style.display = 'block';
    formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    console.error('Form submission failed:', err);
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    alert(err.message || 'Something went wrong. Please try again or email us directly.');
  }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
