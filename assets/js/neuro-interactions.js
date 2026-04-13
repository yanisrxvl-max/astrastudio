// ASTRA STUDIO v2.0 - NEURO INTERACTIONS 2026

document.addEventListener('DOMContentLoaded', () => {
  
  // --- CUSTOM CURSOR SYSTEM ---
  const cursorDot = document.createElement('div');
  cursorDot.className = 'cursor-dot';
  document.body.appendChild(cursorDot);
  
  const cursorRing = document.createElement('div');
  cursorRing.className = 'cursor-ring';
  document.body.appendChild(cursorRing);
  
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    cursorDot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
  });
  
  function animateCursor() {
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    
    cursorRing.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;
    requestAnimationFrame(animateCursor);
  }
  animateCursor();
  
  // Hover effect on interactive elements
  const interactiveElements = document.querySelectorAll('a, button, .glass-card, input, select, textarea');
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => cursorRing.classList.add('hovered'));
    el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovered'));
  });
  
  // --- SCROLL ANIMATIONS (Intersection Observer) ---
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.reveal-on-scroll').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
  
  // Add reveal-active class styles dynamically
  const style = document.createElement('style');
  style.textContent = `
    .reveal-active {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
  
  // --- SMOOTH SCROLL FOR ANCHOR LINKS ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  // --- PARALLAX EFFECT FOR HERO ELEMENTS ---
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.parallax');
    
    parallaxElements.forEach(el => {
      const speed = el.dataset.speed || 0.5;
      el.style.transform = `translateY(${scrolled * speed}px)`;
    });
  });
  
  // --- TEXT REVEAL ANIMATION FOR HEADLINES ---
  const headlines = document.querySelectorAll('h1, h2');
  headlines.forEach(headline => {
    headline.style.opacity = '0';
    headline.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      headline.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      headline.style.opacity = '1';
      headline.style.transform = 'translateY(0)';
    }, 200);
  });
  
  // --- NAVBAR BLUR ON SCROLL ---
  const navbar = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(3, 3, 3, 0.95)';
      navbar.style.padding = '15px 5%';
    } else {
      navbar.style.background = 'rgba(3, 3, 3, 0.85)';
      navbar.style.padding = '25px 5%';
    }
  });
  
  console.log('🚀 Astra Studio v2.0 - Neuro Design System Activated');
});
