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

// signup -> POST to gameprizes.net/api/register
const form = document.getElementById('signup');
if (form) {
  const submitBtn = form.querySelector('button[type="submit"]');

  async function handleSignup(e) {
    e.preventDefault();
    const fd = new FormData(form);
    const email = (fd.get('email') || '').toString();
    const password = (fd.get('password') || '').toString();
    const confirm = (fd.get('confirm') || '').toString();

    // basic client-side checks
    if (!email || !password || !confirm) {
      alert('Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      alert('Passwords do not match.');
      return;
    }

    // derive a simple name if none provided
    const name = (fd.get('name') || email.split('@')[0]).toString();

    const payload = {
      name,
      email,
      password,
      password_confirmation: confirm
    };

    try {
      if (submitBtn) {
        submitBtn.setAttribute('disabled', 'true');
        submitBtn.dataset.origText = submitBtn.textContent || '';
        submitBtn.textContent = 'Signing up...';
      }

      const resp = await fetch('https://www.gameprizes.net/api/register', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = resp.headers.get('content-type') || '';

      if (resp.ok) {
        // If the API redirected to login, follow it in the browser
        if (resp.redirected) {
          window.location.href = resp.url;
          return;
        }

        // If JSON returned with errors, show them
        if (contentType.includes('application/json')) {
          const data = await resp.json();
          if (data.error || data.errors) {
            const msg = data.error || (typeof data.errors === 'object' ? Object.values(data.errors).flat().join(' ') : JSON.stringify(data.errors));
            alert(msg);
            return;
          }
        }

        // fallback: navigate to known login page
        window.location.href = 'https://www.gameprizes.net/login';
      } else {
        // non-OK response
        let msg = `Sign up failed (${resp.status})`;
        if (contentType.includes('application/json')) {
          try {
            const data = await resp.json();
            msg = data.error || data.message || JSON.stringify(data);
          } catch (e) {}
        }
        alert(msg);
      }
    } catch (err) {
      console.error('Signup error', err);
      alert('Network error. Please try again.');
    } finally {
      if (submitBtn) {
        submitBtn.removeAttribute('disabled');
        submitBtn.textContent = submitBtn.dataset.origText || 'Start Earning Prizes';
        delete submitBtn.dataset.origText;
      }
    }
  }

  form.addEventListener('submit', handleSignup);
}

// Google Sign-up popup flow
const googleBtn = document.getElementById('googleSignupBtn');
if (googleBtn) {
  googleBtn.addEventListener('click', (e)=>{
    const clientId = googleBtn.dataset.clientId;
    if(!clientId){
      alert('Google client ID not configured. Set data-client-id on the button.');
      return;
    }

    // build OAuth2 implicit flow URL (id_token via response_type=token id_token)
    const redirectUri = window.location.origin + '/google_oauth_callback.html';
    const scope = encodeURIComponent('openid email profile');
    const nonce = Math.random().toString(36).slice(2);
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=${scope}&prompt=select_account&nonce=${nonce}`;

    const w = 600, h = 700;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;
    const popup = window.open(url, 'gp_google_signin', `width=${w},height=${h},left=${left},top=${top}`);
    if(!popup) { alert('Popup blocked. Please allow popups for this site.'); return; }

    // listen for message from popup
    function onMessage(ev){
      if(!ev.data || ev.data.source !== 'gameprizes_google_oauth') return;
      const id_token = ev.data.id_token;
      if(id_token){
        // send id_token to API endpoint (backend will verify and register)
        fetch('https://www.gameprizes.net/api/register', {
          method: 'POST',
          mode: 'cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token })
        }).then(async (resp)=>{
          if(resp.ok){
            if(resp.redirected) window.location.href = resp.url; else window.location.href = '/';
            return;
          }
          let msg = `Sign up failed (${resp.status})`;
          const ct = resp.headers.get('content-type') || '';
          if(ct.includes('application/json')){
            try{ const data = await resp.json(); msg = data.error || data.message || JSON.stringify(data); }catch(e){}
          }
          alert(msg);
        }).catch(()=>alert('Network error during Google signup'));
      }
      window.removeEventListener('message', onMessage);
      try{ popup.close(); }catch(e){}
    }
    window.addEventListener('message', onMessage);
  });
}

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
  '/src/assets/Quests/riseofkingdons.png',
  '/src/assets/Quests/paramount.png',
  '/src/assets/Quests/gameofthrones.png',
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

    // Typing rotator for hero subtitle
    (function(){
      const el = document.getElementById('typed');
      if(!el) return;
      const phrases = ['by playing games','by watching videos','by answer questions'];
      let p = 0, ch = 0, typing = true;
      const typeSpeed = 70, deleteSpeed = 40, pause = 1400;

      function tick(){
        const cur = phrases[p];
        if(typing){
          ch = Math.min(cur.length, ch + 1);
          el.textContent = cur.slice(0, ch);
          if(ch === cur.length){
            typing = false;
            setTimeout(tick, pause);
          } else {
            setTimeout(tick, typeSpeed + Math.random()*40);
          }
        } else {
          ch = Math.max(0, ch - 1);
          el.textContent = cur.slice(0, ch);
          if(ch === 0){
            typing = true;
            p = (p + 1) % phrases.length;
            setTimeout(tick, 220);
          } else {
            setTimeout(tick, deleteSpeed);
          }
        }
      }

      // small accessibility hint: ensure aria-live region is empty until we start
      el.textContent = '';
      setTimeout(tick, 700);
    })();

// Header anchor dropdown toggle
const menuToggle = document.getElementById('menuToggle');
const menuDropdown = document.getElementById('menuDropdown');
if(menuToggle && menuDropdown){
  function closeMenu(){
    menuDropdown.classList.remove('open');
    menuToggle.setAttribute('aria-expanded','false');
  }
  function openMenu(){
    menuDropdown.classList.add('open');
    menuToggle.setAttribute('aria-expanded','true');
  }
  menuToggle.addEventListener('click',()=>{
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    expanded ? closeMenu() : openMenu();
  });
  // ensure lucide icons render for menu items when opened
  function ensureIcons(){
    try{ if(window.lucide && typeof lucide.createIcons === 'function') lucide.createIcons(); }catch(e){}
  }
  const origOpen = openMenu; openMenu = function(){ origOpen(); ensureIcons(); };
  document.addEventListener('click',(e)=>{
    if(!menuDropdown.contains(e.target) && !menuToggle.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape') closeMenu();
  });
  menuDropdown.querySelectorAll('a.anchor').forEach(a=>{
    a.addEventListener('click',()=>closeMenu());
  });
}
// Parallax & reveal for reward sections
const rewardSections = document.querySelectorAll('.reward-section');
if(rewardSections.length){
  const ioReward = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        const bgDiv = entry.target.querySelector('.reward-bg');
        const src = entry.target.getAttribute('data-bg');
        if(src && bgDiv && !bgDiv.dataset.loaded){
          const img = new Image();
          img.src = src;
          img.onload = ()=>{
            bgDiv.style.backgroundImage = `url('${src}')`;
            bgDiv.dataset.loaded = '1';
          };
        }
      }
    })
  },{threshold:0.25});
  rewardSections.forEach(sec=>ioReward.observe(sec));

  function onScroll(){
    const wh = window.innerHeight;
    rewardSections.forEach(sec=>{
      const rect = sec.getBoundingClientRect();
      const center = rect.top + rect.height/2 - wh/2; // distance from center viewport
      const norm = Math.max(-1, Math.min(1, center / (wh*0.75)));
      sec.style.setProperty('--parallax', norm.toString());
    });
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();
}

// Trustpilot client-side fallback: fetch from local proxy /api/trustpilot/reviews
(function(){
  const container = document.getElementById('trustpilot-widget');
  if(!container) return;

  // If Trustpilot widget loaded, it will replace inner content. Wait a moment then try fallback.
  let tried = false;
  function renderFallback(reviews){
    if(!reviews || !reviews.length){
      container.innerHTML = '<div class="text-sm text-gray-400">No reviews available. <a href="https://www.trustpilot.com/review/gameprizes.net" target="_blank" rel="noopener" class="underline text-[#85e2d9]">Read on Trustpilot</a></div>';
      return;
    }
    const list = document.createElement('div');
    list.className = 'space-y-4';
    reviews.slice(0,3).forEach(r=>{
      const el = document.createElement('blockquote');
      el.className = 'p-4 bg-[#0b0b0b] rounded';
      el.innerHTML = `<div class=\"flex items-center gap-3\"><strong class=\"text-white\">${escapeHtml(r.author || 'Anonymous')}</strong><span class=\"text-xs text-gray-400\">${escapeHtml(r.date || '')}</span></div><p class=\"mt-2 text-sm text-gray-300\">${escapeHtml(r.text || '')}</p><div class=\"mt-2 text-yellow-400\">${'★'.repeat(Math.max(0,Math.min(5,Math.round(r.rating||0))))}</div>`;
      list.appendChild(el);
    });
    container.innerHTML = '';
    container.appendChild(list);
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]; });
  }

  setTimeout(async ()=>{
    // If the Trustpilot widget script already injected content, skip fallback
    if(container.querySelector('.trustpilot-widget') || container.querySelector('iframe')) return;
    if(tried) return; tried = true;
    try{
      const resp = await fetch('/api/trustpilot/reviews');
      if(!resp.ok) throw new Error('no');
      const data = await resp.json();
      renderFallback(data.reviews || data);
    }catch(e){
      // keep the small link to Trustpilot
      container.innerHTML = '<div class="text-sm text-gray-400">Reviews unavailable. <a href="https://www.trustpilot.com/review/gameprizes.net" target="_blank" rel="noopener" class="underline text-[#85e2d9]">Read on Trustpilot</a></div>';
    }
  }, 1200);
})();

