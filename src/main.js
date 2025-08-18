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
