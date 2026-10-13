(() => {
  'use strict';
  if (!document.body.classList.contains('approved-storefront')) return;
  const styled = {
    'green-white-floral-ring': '/assets/golden-products/green-white-floral-ring.png',
    'stacked-coil-bangle': '/assets/golden-products/stacked-coil-bangle.png',
    'blue-white-pebble-ring': '/assets/golden-products/blue-white-pebble-ring.png',
    'pink-blossom-cluster-ring': '/assets/golden-products/pink-blossom-cluster-ring.png',
    'mint-tile-cluster-ring': '/assets/golden-products/mint-tile-cluster-ring.png',
    'rose-cup-ring': '/assets/golden-products/rose-cup-ring.png',
    'bow-love-earrings': '/assets/golden-products/earrings.png',
    'heart-pendant-edit': '/assets/golden-products/necklace.png'
  };
  const categoryImages = {earrings:styled['bow-love-earrings'],necklaces:styled['heart-pendant-edit'],neckwear:styled['heart-pendant-edit'],rings:styled['pink-blossom-cluster-ring'],bracelets:styled['stacked-coil-bangle'],gifting:styled['rose-cup-ring'],sets:styled['rose-cup-ring'],'jewellery-sets':styled['rose-cup-ring']};
  function applyImages() {
    document.querySelectorAll('.approved-arrivals [data-product-card]').forEach(card => {
      const src = styled[card.dataset.productCard];
      const image = card.querySelector('.stable-card__image--primary');
      if (!src || !image || image.getAttribute('src') === src) return;
      image.src = src;
      image.alt = `${card.querySelector('.stable-card__title')?.textContent || 'Jewellery'} — styled golden background`;
      card.querySelector('.stable-card__image--secondary')?.remove();
    });
    document.querySelectorAll('#commerce-category-grid a').forEach(link => {
      const slug = new URL(link.href).pathname.split('/').pop();
      const image = link.querySelector('img');
      const categoryIds = {earrings:'bow-love-earrings',necklaces:'heart-pendant-edit',neckwear:'heart-pendant-edit',rings:'pink-blossom-cluster-ring',bracelets:'stacked-coil-bangle',gifting:'rose-cup-ring',sets:'rose-cup-ring','jewellery-sets':'rose-cup-ring'};
      const atlas = window.ShivaraGoldenMedia?.[categoryIds[slug]];
      if (atlas && image) {
        image.parentElement.classList.add('golden-frame','golden-view-0');
        if (image.getAttribute('src') !== atlas.atlas) image.src = atlas.atlas;
      } else if (categoryImages[slug] && image && image.getAttribute('src') !== categoryImages[slug]) image.src = categoryImages[slug];
    });
  }
  applyImages();
  for (const selector of ['.approved-arrivals .commerce-product-grid', '#commerce-category-grid']) {
    const mount = document.querySelector(selector);
    if (mount) new MutationObserver(applyImages).observe(mount, {childList:true,subtree:true});
  }
  document.addEventListener('shivara:catalogue-synced', applyImages);
  const hero = document.querySelector('.approved-hero');
  if (!hero) return;
  const slides = [
    {title:'A Love Story<br>in Every Design', description:'Thoughtfully crafted jewellery for<br>your everyday moments and forever ones.', cta:'SHOP NEW ARRIVALS', href:'/collections/new-arrivals'},
    {title:'Everyday<br>Luxury',description:'Statement pieces for<br>your everyday stories.',cta:'SHOP BRACELETS',href:'/collections/bracelets', image:styled['stacked-coil-bangle']},
    {title:'A Little Colour.<br>A Lot of Love.',description:'Explore expressive designs<br>from the Shivara collection.',cta:'EXPLORE RINGS',href:'/collections/rings',image:styled['blue-white-pebble-ring']},
    {title:'The Art of<br>Meaningful Gifting',description:'Thoughtfully selected pieces<br>for your special moments.',cta:'EXPLORE GIFT SETS',href:'/collections/gifting',image:styled['pink-blossom-cluster-ring']}
  ];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, paused = reduced.matches, timer, startX = null;
  const pause = hero.querySelector('[data-hero-pause]');
  function render(next, announce = false) {
    index = (next + slides.length) % slides.length;
    const slide = slides[index];
    hero.dataset.slide = String(index);
    hero.style.setProperty('--campaign-photo', slide.image ? `url("${slide.image}")` : 'none');
    hero.querySelector('h1').innerHTML = slide.title;
    hero.querySelector('.approved-hero__description').innerHTML = slide.description;
    const cta = hero.querySelector('.approved-outline');
    cta.href = slide.href; cta.innerHTML = `${slide.cta} <span aria-hidden="true">→</span>`;
    hero.querySelectorAll('[data-hero-slide]').forEach(button => {
      if (Number(button.dataset.heroSlide) === index) button.setAttribute('aria-current','true');
      else button.removeAttribute('aria-current');
    });
    if (announce) hero.querySelector('[data-hero-status]').textContent = `Campaign ${index + 1} of ${slides.length}: ${slide.title.replace(/<br>/g,' ')}`;
  }
  function schedule() {
    clearInterval(timer);
    if (!paused && !document.hidden && !hero.matches(':hover') && !hero.contains(document.activeElement)) timer = setInterval(() => render(index + 1), 6000);
  }
  function pauseLabel() { pause.setAttribute('aria-label',paused ? 'Play slideshow' : 'Pause slideshow');pause.textContent = paused ? '▷' : 'Ⅱ'; }
  hero.addEventListener('click', event => {
    const dot = event.target.closest('[data-hero-slide]');
    if (dot) {render(Number(dot.dataset.heroSlide),true);schedule();}
    if (event.target.closest('[data-hero-next]')) {render(index+1,true);schedule();}
    if (event.target.closest('[data-hero-pause]')) {paused=!paused;pauseLabel();schedule();}
  });
  hero.addEventListener('keydown',event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();render(event.key==='Home'?0:event.key==='End'?slides.length-1:index+(event.key==='ArrowRight'?1:-1),true);schedule();
  });
  hero.addEventListener('pointerdown',event => {if(event.pointerType==='touch')startX=event.clientX});
  hero.addEventListener('pointerup',event => {if(startX!==null && Math.abs(event.clientX-startX)>45){render(index+(event.clientX<startX?1:-1),true);schedule()}startX=null});
  hero.addEventListener('pointercancel',()=>{startX=null});
  hero.addEventListener('mouseenter',()=>clearInterval(timer));
  hero.addEventListener('mouseleave',schedule);
  hero.addEventListener('focusin',()=>clearInterval(timer));
  hero.addEventListener('focusout',()=>setTimeout(schedule,0));
  document.addEventListener('visibilitychange',schedule);
  reduced.addEventListener('change',()=>{paused=reduced.matches;pauseLabel();schedule()});
  render(0);pauseLabel();schedule();
})();
