/* Shared app JS for header, popups, product/cart/orders/reviews/admin */
// Utility: safe query
const $ = (sel, el=document) => el.querySelector(sel);
const $$ = (sel, el=document) => Array.from(el.querySelectorAll(sel));

// ---------- header & mobile nav ----------
const menuBtn = $('#menuBtn');
const nav = $('#nav');
if(menuBtn){
  menuBtn.addEventListener('click', ()=>{
    nav.classList.toggle('show');
    const expanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', String(!expanded));
  });
}
document.querySelectorAll('.nav a').forEach(a=>{
  a.addEventListener('click', ()=>{ if(nav.classList.contains('show')) nav.classList.remove('show'); });
});

// login/signup popups
const loginBtn = $('#loginBtn');
const signupBtn = $('#signupBtn');
const loginPopup = $('#loginPopup');
const signupPopup = $('#signupPopup');
if(loginBtn) loginBtn.addEventListener('click', (e)=>{ e.preventDefault(); loginPopup.style.display='flex'; });
if(signupBtn) signupBtn.addEventListener('click', (e)=>{ e.preventDefault(); signupPopup.style.display='flex'; });
function closePopups(){
  if(loginPopup) loginPopup.style.display='none';
  if(signupPopup) signupPopup.style.display='none';
}
window.closePopups = closePopups;

// footer year
const yrEl = $('#year');
if(yrEl) yrEl.textContent = new Date().getFullYear();

/* -------------------------
   Data storage helpers
   -------------------------*/
const storage = {
  get(key, fallback){
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch(e){ return fallback; }
  },
  set(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// keys
const KEYS = {
  PRODUCTS: 'cs_products',
  CART: 'cs_cart',
  ORDERS: 'cs_orders',
  REVIEWS: 'cs_reviews',
  COUPONS: 'cs_coupons'
};

// seed default products (only if none exist)
function seedProducts(){
  const existing = storage.get(KEYS.PRODUCTS, null);
  if(existing) return;
  const defaultProducts = [
    {id:'strawberry', name:'Strawberry Coffee', desc:'Freshly brewed strawberry infused coffee.', price:39.99, img:'images/cup2-removebg-preview.png'},
    {id:'green', name:'Green Tea Coffee', desc:'Smooth matcha green tea latte.', price:29.99, img:'images/cup3-removebg-preview.png'},
    {id:'choco', name:'Chocolate Coffee', desc:'Velvety cocoa blended coffee.', price:34.99, img:'images/cup4-removebg-preview.png'},
    {id:'caramel_sauce', name:'Caramel Sauce & Vanilla Cream', desc:'Caramel sauce with vanilla cream.', price:42.99, img:'images/caramel-sauce-and-vanilla-cream.png'},
    {id:'mint_cookie', name:'Iced Mint Cookie Latte', desc:'Refreshing iced mint cookie latte.', price:36.99, img:'images/icedmintcookielatte.png'},
    {id:'caramel_mocha', name:'Iced Caramel Mocha', desc:'Chilled caramel mocha.', price:44.99, img:'images/iced-caramel-mocha.png'}
  ];
  storage.set(KEYS.PRODUCTS, defaultProducts);
}
seedProducts();

/* -------------------------
   Cart functions (menu)
   -------------------------*/
function getCart(){ return storage.get(KEYS.CART, []); }
function saveCart(cart){ storage.set(KEYS.CART, cart); renderCartWidget(); }

function addToCart(productId, qty=1){
  const products = storage.get(KEYS.PRODUCTS, []);
  const p = products.find(x=>x.id===productId);
  if(!p) return;
  const cart = getCart();
  const existing = cart.find(i=>i.id===productId);
  if(existing) existing.qty += qty;
  else cart.push({id:p.id, name:p.name, price:p.price, qty});
  saveCart(cart);
}

function removeCartIndex(index){
  const cart = getCart();
  cart.splice(index,1);
  saveCart(cart);
}
window.removeCartIndex = removeCartIndex;

function changeQty(index, delta){
  const cart = getCart();
  if(!cart[index]) return;
  cart[index].qty = Math.max(1, cart[index].qty + delta);
  saveCart(cart);
}
window.changeQty = changeQty;

function clearCart(){
  storage.set(KEYS.CART, []);
  renderCartWidget();
}

/* checkout -> create order */
function checkoutCart(appliedCoupon=null){
  const cart = getCart();
  if(cart.length===0) return alert('Cart is empty');
  const orders = storage.get(KEYS.ORDERS, []);
  let total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  let couponObj = null;
  if(appliedCoupon){
    const coupons = storage.get(KEYS.COUPONS, []);
    couponObj = coupons.find(c=>c.code === appliedCoupon);
    if(couponObj){
      total = total - (total * (couponObj.discount/100));
    }
  }
  const order = {
    id: 'ORD' + Date.now(),
    createdAt: new Date().toISOString(),
    items: cart,
    total: Number(total.toFixed(2)),
    coupon: couponObj ? couponObj.code : null,
    status: 'pending'
  };
  orders.unshift(order);
  storage.set(KEYS.ORDERS, orders);
  clearCart();
  alert('Order placed! Order ID: ' + order.id);
  return order;
}
window.checkoutCart = checkoutCart;

/* -------------------------
   Renderers
   -------------------------*/
function renderCartWidget(){
  const el = $('#cartWidget');
  if(!el) return;
  const cart = getCart();
  el.innerHTML = '';
  const h = document.createElement('h4'); h.textContent = 'Cart';
  el.appendChild(h);
  const itemsWrap = document.createElement('div'); itemsWrap.className = 'cart-items';
  let total = 0;
  cart.forEach((it, idx)=>{
    total += it.qty * it.price;
    const div = document.createElement('div'); div.className='cart-item';
    div.innerHTML = `<div>
        <div style="font-weight:600">${it.name}</div>
        <div class="small">$${it.price.toFixed(2)} x ${it.qty}</div>
      </div>
      <div class="kv">
        <div class="qty">
          <button onclick="changeQty(${idx},-1)">-</button>
          <div style="padding:0 8px">${it.qty}</div>
          <button onclick="changeQty(${idx},1)">+</button>
        </div>
        <button class="remove-btn" onclick="removeCartIndex(${idx})">Remove</button>
      </div>`;
    itemsWrap.appendChild(div);
  });
  el.appendChild(itemsWrap);
  const foot = document.createElement('div');
  foot.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
      <strong>Total: </strong><strong>$${total.toFixed(2)}</strong>
    </div>
    <div style="margin-top:8px;display:flex;gap:8px">
      <button class="btn-primary" onclick="document.location='orders.html'">Checkout</button>
      <button class="btn-ghost" onclick="clearCart()">Clear</button>
    </div>`;
  el.appendChild(foot);
}

// menu render + search/filter
function renderMenuProducts(filterText='', maxPrice=9999){
  const products = storage.get(KEYS.PRODUCTS, []);
  const grid = $('#menuGrid');
  if(!grid) return;
  grid.innerHTML = '';
  const filtered = products.filter(p=>{
    const matchText = (p.name + ' ' + p.desc).toLowerCase().includes(filterText.toLowerCase());
    const matchPrice = p.price <= maxPrice;
    return matchText && matchPrice;
  });
  filtered.forEach(p=>{
    const div = document.createElement('div'); div.className='product card';
    div.innerHTML = `<img src="${p.img}" alt="${p.name}">
      <div class="product-info">
        <h4>${p.name}</h4>
        <p class="small">${p.desc}</p>
        <div class="product-meta">
          <div style="font-weight:700;color:var(--accent-2)">$${p.price.toFixed(2)}</div>
          <div style="margin-left:auto"">
            <input type="number" min="1" value="1" id="qty_${p.id}" style="width:64px;padding:6px;border-radius:8px;background:#222;border:none;color:#fff">
            <button class="btn btn-primary" onclick="addFromMenu('${p.id}')">Add</button>
          </div>
        </div>
      </div>`;
    grid.appendChild(div);
  });
}

// helper used from markup
window.addFromMenu = (id) => {
  const qEl = $('#qty_' + id);
  const qty = qEl && Number(qEl.value) ? parseInt(qEl.value) : 1;
  addToCart(id, qty);
  renderCartWidget();
};

/* orders page renderer */
function renderOrdersTable(){
  const list = storage.get(KEYS.ORDERS, []);
  const el = $('#ordersList');
  if(!el) return;
  el.innerHTML = '';
  if(list.length===0){ el.innerHTML = '<div class="card small">No orders yet.</div>'; return; }
  list.forEach(o=>{
    const d = document.createElement('div'); d.className='card';
    d.style.marginBottom='12px';
    d.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
      <div><strong>Order ${o.id}</strong><div class="small">${new Date(o.createdAt).toLocaleString()}</div></div>
      <div style="text-align:right"><div style="font-weight:700;color:var(--accent-2)">$${o.total.toFixed(2)}</div><div class="small">Status: ${o.status}</div></div>
    </div>
    <div style="margin-top:8px">
      ${o.items.map(it=>`<div style="padding:4px 0">${it.name} x ${it.qty} — $${(it.price*it.qty).toFixed(2)}</div>`).join('')}
    </div>`;
    el.appendChild(d);
  });
}

/* reviews */
function renderReviews(){
  const reviews = storage.get(KEYS.REVIEWS, []);
  const el = $('#reviewsList');
  if(!el) return;
  el.innerHTML = '';
  if(reviews.length===0) el.innerHTML = '<div class="card small">No reviews yet. Be the first!</div>';
  reviews.forEach(r=>{
    const c = document.createElement('div'); c.className='card'; c.style.marginBottom='10px';
    c.innerHTML = `<div style="display:flex;justify-content:space-between"><div><strong>${r.name}</strong><div class="small">${new Date(r.createdAt).toLocaleDateString()}</div></div><div style="font-weight:700;color:var(--accent-2)">${'★'.repeat(r.rating)}</div></div><div style="margin-top:8px" class="small">${r.text}</div>`;
    el.appendChild(c);
  });
}

function submitReview(name, rating, text){
  if(!name || !text) return alert('Please provide name and message');
  const reviews = storage.get(KEYS.REVIEWS, []);
  reviews.unshift({id:'R'+Date.now(), name, rating: Number(rating), text, createdAt:new Date().toISOString()});
  storage.set(KEYS.REVIEWS, reviews);
  renderReviews();
}

/* admin: products CRUD */
function renderAdminProducts(){
  const products = storage.get(KEYS.PRODUCTS, []);
  const tbody = $('#adminProductsTbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  products.forEach((p, i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${p.id}</td><td>${p.name}</td><td>$${p.price.toFixed(2)}</td><td><button onclick="adminEditProduct('${p.id}')">Edit</button> <button onclick="adminDeleteProduct('${p.id}')">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}
function adminAddProduct(obj){
  const products = storage.get(KEYS.PRODUCTS, []);
  if(products.find(x=>x.id===obj.id)) return alert('Product id exists');
  products.push(obj);
  storage.set(KEYS.PRODUCTS, products);
  renderAdminProducts();
}
window.adminAddProduct = adminAddProduct;

function adminDeleteProduct(id){
  if(!confirm('Delete product '+id+'?')) return;
  let products = storage.get(KEYS.PRODUCTS, []);
  products = products.filter(p=>p.id!==id);
  storage.set(KEYS.PRODUCTS, products);
  renderAdminProducts();
  renderMenuProducts('',9999);
}

function adminEditProduct(id){
  const products = storage.get(KEYS.PRODUCTS, []);
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const name = prompt('Name', p.name);
  if(!name) return;
  const price = prompt('Price', String(p.price));
  if(!price) return;
  p.name = name; p.price = Number(price);
  storage.set(KEYS.PRODUCTS, products);
  renderAdminProducts();
  renderMenuProducts('',9999);
}
window.adminEditProduct = adminEditProduct;

/* admin coupons */
function renderAdminCoupons(){
  const coupons = storage.get(KEYS.COUPONS, []);
  const tbody = $('#couponsTbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  coupons.forEach(c=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${c.code}</td><td>${c.discount}%</td><td><button onclick="adminDeleteCoupon('${c.code}')">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}
function adminAddCoupon(code, discount){
  const coupons = storage.get(KEYS.COUPONS, []);
  if(coupons.find(c=>c.code===code)) return alert('Coupon exists');
  coupons.push({code, discount: Number(discount)});
  storage.set(KEYS.COUPONS, coupons);
  renderAdminCoupons();
}
window.adminAddCoupon = adminAddCoupon;

function adminDeleteCoupon(code){
  if(!confirm('Delete coupon '+code+'?')) return;
  let coupons = storage.get(KEYS.COUPONS, []);
  coupons = coupons.filter(c=>c.code!==code);
  storage.set(KEYS.COUPONS, coupons);
  renderAdminCoupons();
}
window.adminDeleteCoupon = adminDeleteCoupon;

/* admin dashboard stats */
function renderAdminDashboard(){
  const products = storage.get(KEYS.PRODUCTS, []);
  const orders = storage.get(KEYS.ORDERS, []);
  const reviews = storage.get(KEYS.REVIEWS, []);
  const coupons = storage.get(KEYS.COUPONS, []);
  const top = $('#dashStats');
  if(!top) return;
  top.innerHTML = `<div class="card"><strong>Products</strong><div class="small">${products.length}</div></div>
    <div class="card"><strong>Orders</strong><div class="small">${orders.length}</div></div>
    <div class="card"><strong>Reviews</strong><div class="small">${reviews.length}</div></div>
    <div class="card"><strong>Coupons</strong><div class="small">${coupons.length}</div></div>`;
}

/* on DOM ready: wire up things per page */
document.addEventListener('DOMContentLoaded', ()=>{
  // cart widget render
  renderCartWidget();

  // menu page
  if($('#menuGrid')){
    const search = $('#menuSearch');
    const maxprice = $('#menuMaxPrice');
    const form = $('#menuFilterForm');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      renderMenuProducts(search.value, Number(maxprice.value) || 9999);
    });
    renderMenuProducts('',9999);
  }

  // orders page
  if($('#ordersList')) renderOrdersTable();

  // reviews page
  if($('#reviewsList')){
    renderReviews();
    $('#reviewForm').addEventListener('submit',(e)=>{
      e.preventDefault();
      const name = $('#reviewName').value.trim();
      const rating = Number($('#reviewRating').value) || 5;
      const text = $('#reviewText').value.trim();
      submitReview(name, rating, text);
      $('#reviewName').value=''; $('#reviewText').value=''; $('#reviewRating').value='5';
    });
  }

  // admin products page
  if($('#adminProductsTbody')){
    renderAdminProducts();
    $('#productAddForm').addEventListener('submit',(e)=>{
      e.preventDefault();
      const id = $('#productId').value.trim();
      const name = $('#productName').value.trim();
      const price = Number($('#productPrice').value);
      const img = $('#productImg').value.trim() || 'images/cup2-removebg-preview.png';
      const desc = $('#productDesc').value.trim() || '';
      if(!id||!name||!price) return alert('fill fields');
      adminAddProduct({id,name,price,img,desc});
      e.target.reset();
    });
  }

  // admin coupons
  if($('#couponsTbody')){
    renderAdminCoupons();
    $('#couponAddForm').addEventListener('submit',(e)=>{
      e.preventDefault();
      const code = $('#couponCode').value.trim();
      const disc = Number($('#couponDiscount').value);
      if(!code||!disc) return alert('fill fields');
      adminAddCoupon(code, disc);
      e.target.reset();
    });
  }

  // admin dashboard
  if($('#dashStats')) renderAdminDashboard();
});
