const amountEl = document.getElementById('amount');
const yearEl = document.getElementById('year');

// Incrementing counter animation
let value = 25000; // start value for demo
function animateAmount(){
  const target = 25000 + Math.floor(Math.random()*10000);
  const start = value;
  const duration = 2000;
  const startTime = performance.now();
  function tick(now){
    const t = Math.min((now-startTime)/duration,1);
    const v = Math.floor(start + (target-start)*t);
    amountEl.textContent = v.toLocaleString();
    if(t<1) requestAnimationFrame(tick); else value = target;
  }
  requestAnimationFrame(tick);
}

// Page background parallax on scroll
(() => {
  const layers = Array.from(document.querySelectorAll('#page-bg .bg-layer'));
  if(!layers.length) return;
  let lastScroll = window.scrollY;
  let rafId = null;
  const state = layers.map(()=>({y:0,target:0}));

  function onScroll(){
    lastScroll = window.scrollY;
    layers.forEach((layer,i)=>{
      const speed = parseFloat(layer.getAttribute('data-speed')||'0.05');
      state[i].target = lastScroll * speed;
    });
    if(!rafId) rafId = requestAnimationFrame(loop);
  }

  function loop(){
    let running = false;
    layers.forEach((layer,i)=>{
      const s = state[i];
      s.y += (s.target - s.y) * 0.12;
      layer.style.transform = `translate3d(0, ${-s.y}px, 0)`;
      if(Math.abs(s.target - s.y) > 0.5) running = true;
    });
    if(running){
      rafId = requestAnimationFrame(loop);
    } else {
      rafId = null;
    }
  }

  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();
setTimeout(animateAmount,600);
setInterval(animateAmount,8000);

// signup demo
const form = document.getElementById('signup');
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  const email = fd.get('email');
  // simple feedback
  alert(`Thanks ${email}. Demo signup complete.`);
  form.reset();
});

// anchors smooth scroll
document.querySelectorAll('a.anchor').forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    document.querySelector(a.getAttribute('href')).scrollIntoView({behavior:'smooth'});
  })
});

// set year
yearEl.textContent = new Date().getFullYear();

// Reveal on scroll (IntersectionObserver)
const reveals = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
    }
  });
},{threshold:0.15});
reveals.forEach(r=>io.observe(r));

// marquee subtle movement on mouse move for depth
const marquee = document.querySelector('.logos');
if(marquee){
  document.addEventListener('mousemove', (e)=>{
    const x = (e.clientX / window.innerWidth - 0.5) * 8;
    marquee.style.transform = `translateX(${x}px)`;
  });
}

// swap some placeholders for public game art placeholders (demo)
const placeholderImages = [
  'https://i.imgur.com/8Km9tLL.jpg',
  'https://i.imgur.com/5b3oQ6J.jpg',
  'https://i.imgur.com/7bKQKk7.jpg'
];
document.querySelectorAll('.card').forEach((c,i)=>{
  const img = document.createElement('img');
  img.src = placeholderImages[i % placeholderImages.length];
  img.alt = 'Game placeholder';
  img.className = 'w-full h-36 object-cover rounded-md mb-3';
  c.insertBefore(img, c.firstChild);
});

// Hero parallax layers
const hero = document.querySelector('.hero');
if(hero){
  const layers = hero.querySelectorAll('.hero-layer');
  hero.addEventListener('mousemove', (e)=>{
    const cx = e.clientX / window.innerWidth - 0.5;
    const cy = e.clientY / window.innerHeight - 0.5;
    layers.forEach(layer=>{
      const depth = parseFloat(layer.getAttribute('data-depth') || '0.2');
      const tx = cx * depth * 40;
      const ty = cy * depth * 30;
      layer.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${cx*3}deg)`;
    });
  });

  // simple particle generation
  const particleContainer = hero.querySelector('.particles');
  if(particleContainer){
    for(let i=0;i<10;i++){
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.position = 'absolute';
      p.style.width = p.style.height = `${4+Math.random()*10}px`;
      p.style.left = `${Math.random()*100}%`;
      p.style.top = `${Math.random()*100}%`;
      p.style.background = 'radial-gradient(circle, rgba(133,226,217,1), rgba(122,227,255,.6))';
      p.style.filter = 'blur(6px)';
      p.style.opacity = Math.random()*0.8;
      p.style.transform = `translate3d(0,0,0)`;
      particleContainer.appendChild(p);
    }
  }
}
