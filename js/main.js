const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });

  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open navigation');
    });
  });
}

document.querySelectorAll('[data-slider]').forEach(slider=>{
  const track=slider.querySelector('.slider-track');
  const slides=[...slider.querySelectorAll('.slide')];
  const dots=slider.querySelector('.slider-dots');
  const prev=slider.querySelector('[data-prev]');
  const next=slider.querySelector('[data-next]');
  if(!track||slides.length<2||!dots)return;
  let index=0;
  slides.forEach((_,i)=>{
    const b=document.createElement('button');
    b.className='slider-dot'+(i===0?' active':'');
    b.setAttribute('aria-label',`Go to slide ${i+1}`);
    b.addEventListener('click',()=>go(i));
    dots.appendChild(b);
  });
  const update=()=>{track.style.transform=`translateX(-${index*100}%)`;dots.querySelectorAll('.slider-dot').forEach((d,i)=>d.classList.toggle('active',i===index));};
  const go=i=>{index=(i+slides.length)%slides.length;update();};
  prev?.addEventListener('click',()=>go(index-1));
  next?.addEventListener('click',()=>go(index+1));
});
