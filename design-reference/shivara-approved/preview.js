(() => {
 const drawer = document.querySelector('#drawer');
 const overlay = document.querySelector('#overlay');
 const title = document.querySelector('#drawer-title');
 const content = document.querySelector('#drawer-body');
 const menu = `<a href="#categories">Jewellery →</a><a href="#categories">Cord Sets →</a><a href="#categories">Sarees →</a><a href="#categories">Anarkali →</a><a href="#categories">Lehengas →</a><a href="#categories">Gifts →</a>`;
 let items = [];
 function openDrawer(heading, markup) {title.textContent=heading;content.innerHTML=markup; drawer.classList.add('open');overlay.hidden=false;drawer.setAttribute('aria-hidden','false');document.querySelector('#drawer-close').focus();}
 function closeDrawer() {drawer.classList.remove('open');overlay.hidden=true;drawer.setAttribute('aria-hidden','true');}
 document.querySelector('#drawer-close').addEventListener('click',closeDrawer);overlay.addEventListener('click',closeDrawer);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
 document.querySelector('#menu-toggle').addEventListener('click',()=>openDrawer('THE EDIT',menu));
 content.addEventListener('click',e=>{if(e.target.closest('a')) closeDrawer()});
 function search(){openDrawer('DISCOVER',`<label for="demo-search">Search the live store</label><input id="demo-search" class="drawer-input" type="search" placeholder="Jewellery, earrings, collections"><p>This is a visual prototype. <a href="https://the-shivara-group-86c9c.web.app/collections/all">Search the actual catalogue →</a></p>`)}
 function bag(){const html=items.length ? items.map(x=>`<p>${x}</p>`).join('')+'<p>Demo only. No actual order has been placed.</p>':'<p>Your preview bag is empty. No orders are possible in this reference.</p>';openDrawer('YOUR BAG',html)}
 function wishlist(){openDrawer('WISHLIST','<p>Visual reference only. Connect this UI to the existing production wishlist state.</p>')}
 document.querySelector('#search-toggle').addEventListener('click',search);document.querySelector('#bottom-search').addEventListener('click',search);
 document.querySelector('#bag-toggle').addEventListener('click',bag);document.querySelector('#bottom-bag').addEventListener('click',bag);
 document.querySelector('#wishlist-toggle').addEventListener('click',wishlist);document.querySelector('#bottom-wishlist').addEventListener('click',wishlist);
 document.querySelectorAll('.add-bag').forEach(button=>button.addEventListener('click',()=>{items.push(button.dataset.product);document.querySelector('#bag-count').textContent=items.length;document.querySelector('#bottom-count').textContent=items.length;bag()}));
 document.querySelectorAll('.product-heart').forEach(button=>button.addEventListener('click',()=>{button.textContent=button.textContent==='♡'?'♥':'♡';button.setAttribute('aria-pressed',button.textContent==='♥'?'true':'false')}));
})();
