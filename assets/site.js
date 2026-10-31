/* ════════════════════════════════════════════════════════════
   PAYSTACK SETUP — put your own public key here.
   Get it from: Paystack Dashboard → Settings → API Keys & Webhooks
   It starts with pk_test_... (testing) or pk_live_... (real money).
   The PUBLIC key is safe to put in this file. NEVER put the
   secret key (sk_...) anywhere in a webpage.
   ════════════════════════════════════════════════════════════ */
const PAYSTACK_PUBLIC_KEY = 'pk_live_a66cd6d3039aa7334ef9fd9c4665393a9e4100b2';

const ADMIN_EMAIL = 'sznbams@gmail.com';

// Your logo, used in the header of every customer-facing email.
// This MUST be a full public URL — email clients can't load a local
// file path or a relative link like "logo.png". Upload bzn-logo.png
// (comes with this download) to your live site — e.g. its root, right
// next to index.html — then put its live address here, for example:
// 'https://yourdomain.com/bzn-logo.png' or, if using a Netlify
// preview address, 'https://your-site-name.netlify.app/bzn-logo.png'.
const LOGO_URL = 'https://www.bamszn.xyz/bzn-logo.png';
const EMAIL_LOGO_HEADER = `<div style="background:#000000;padding:28px 20px;text-align:center;">
  <img src="${LOGO_URL}" alt="Bam.szn" width="150" style="display:inline-block;border:0;">
</div>`;

/* ════════════════════════════════════════════════════════════
   EMAILS — two Netlify pieces work together here, both using
   Resend (https://resend.com) to actually deliver mail:

   • ORDER INVOICES (this file → send-email.js): when a Paystack
     payment succeeds, this page calls send-email.js directly to
     email you an invoice and the customer a receipt.
   • CONTACT FORM ("Let's Talk"): that form is a real Netlify Form
     now (see the `data-netlify="true"` attribute on it below in
     the page). Netlify stores every submission in your dashboard
     for you automatically — no code needed for that part. The
     "welcome to the team" reply to whoever fills it out is sent
     by netlify/functions/submission-created.js, which Netlify
     calls on its own right after storing the submission.

   Setup (shared by both):
   1. Deploy this site to Netlify with the netlify/functions folder
      kept in place right next to this index.html (Netlify
      auto-detects it — no config needed for most sites).
   2. Create a free account at https://resend.com.
   3. Resend dashboard → API Keys → create one, then in Netlify:
      Site settings → Environment variables → add RESEND_API_KEY
      with that value. This key never touches this HTML file or
      the browser — it lives only on Netlify's servers.
   4. For quick testing you can leave the default sender
      (onboarding@resend.dev) — but Resend will only let that test
      address deliver to YOUR OWN Resend account email. To actually
      email customers, verify your own domain under Resend →
      Domains (a few DNS records, takes minutes), then add a second
      Netlify environment variable, FROM_EMAIL, like
      "Bam.szn <orders@bamszn.xyz>".
   5. Redeploy the site after adding the environment variables
      (Netlify only picks them up on a fresh deploy).
   6. (Optional, zero code) To also get notified in your own inbox
      every time someone submits the contact form — separate from
      the customer's welcome reply — turn that on under Site
      settings → Forms → Form notifications → Email notification.

   Note: invoice emails fire when the bag checkout (Paystack
   inline popup) succeeds. The whole bag is paid in one go, so
   per-product Paystack Payment Page links (payLink) aren't used.
   ════════════════════════════════════════════════════════════ */
function sendEmail(to, subject, html) {
  return fetch('/.netlify/functions/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html })
  }).then(res => {
    if (!res.ok) return res.json().then(err => Promise.reject(err));
    return res.json();
  });
}

function escHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function sendInvoiceEmails(order) {
  const ref = order.reference || order.orderRef;
  const row = (label, val) => `<tr><td style="padding:4px 12px 4px 0;color:#888;">${label}</td><td style="padding:4px 0;font-weight:600;">${val}</td></tr>`;
  const itemRows = order.items.map(it =>
    row(`${it.qty} × ${escHtml(it.p.name.trim())} — ${it.size}`, '₦' + (it.p.amountNGN * it.qty).toLocaleString())
  ).join('');
  const bodyRows = row('Order Ref', ref) +
    itemRows +
    row('Subtotal', '₦' + order.subtotal.toLocaleString()) +
    row('Delivery State', escHtml(order.state)) +
    row('Shipping', '₦' + order.shippingFee.toLocaleString()) +
    row('VAT (1.5%)', '₦' + order.vatFee.toLocaleString()) +
    row('Total', '₦' + order.totalNGN.toLocaleString()) +
    row('Customer', escHtml(order.name)) +
    row('Email', escHtml(order.email)) +
    row('Phone', escHtml(order.phone)) +
    row('Address', escHtml(order.addr));
  const itemCount = order.items.reduce((n, it) => n + it.qty, 0);
  const html = `<div style="font-family:sans-serif;font-size:14px;color:#222;">
    ${EMAIL_LOGO_HEADER}
    <div style="padding:24px 20px;">
      <h2 style="font-family:sans-serif;">New Bam.szn Order</h2>
      <table>${bodyRows}</table>
    </div>
  </div>`;

  // Invoice to the shop owner
  sendEmail(ADMIN_EMAIL, `New Order — ${itemCount} item${itemCount===1?'':'s'} (${ref})`, html)
    .catch(err => console.error('Admin invoice email failed:', err));

  // Receipt to the customer
  const customerHtml = `<div style="font-family:sans-serif;font-size:14px;color:#222;">
    ${EMAIL_LOGO_HEADER}
    <div style="padding:24px 20px;">
      <h2 style="font-family:sans-serif;">Thanks for your order, ${escHtml(order.name)}!</h2>
      <p>Here's your receipt for the ${itemCount} item${itemCount===1?'':'s'} in your bag.</p>
      <table>${bodyRows}</table>
      <p style="margin-top:16px;color:#888;">We'll reach out on ${escHtml(order.phone)} with delivery updates. — Bam.szn</p>
    </div>
  </div>`;
  sendEmail(order.email, `Your Bam.szn Receipt — ${ref}`, customerHtml)
    .catch(err => console.error('Customer invoice email failed:', err));
}

function submitContactForm(event) {
  event.preventDefault();
  const name    = (document.getElementById('contactName')    || {}).value?.trim() || '';
  const email   = (document.getElementById('contactEmail')   || {}).value?.trim() || '';
  const subject = (document.getElementById('contactSubject') || {}).value || 'General Inquiry';
  const message = (document.getElementById('contactMessage') || {}).value?.trim() || '';

  if (!name)  { showToast('Enter your name.','Missing details'); return false; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showToast('Enter a valid email so we can reply.','Missing details'); return false; }
  if (!message) { showToast('Add a quick message so we know what this is about.','Missing details'); return false; }

  // Hand the submission to Netlify Forms — it stores it in your Netlify
  // dashboard and (once turned on in Site settings → Forms → Notifications)
  // can email YOU automatically, with zero extra code. The customer's
  // "welcome" reply is sent separately by the submission-created function
  // (see netlify/functions/submission-created.js) as soon as Netlify
  // finishes storing this submission.
  const body = new URLSearchParams({ 'form-name': 'contact', name, email, subject, message }).toString();
  fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
    .then(() => {
      document.getElementById('contactName').value = '';
      document.getElementById('contactEmail').value = '';
      document.getElementById('contactMessage').value = '';
      showToast("Message sent! Check your inbox — welcome to the team.", '✓ Sent');
    })
    .catch(err => {
      console.error('Contact form submission failed:', err);
      showToast("Something went wrong sending that. Try again in a moment.", 'Not sent');
    });

  return false;
}

// CURSOR
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
let rx = 0, ry = 0;
if (!isTouch) {
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
  rx += (e.clientX - rx) * 0.12;
  ry += (e.clientY - ry) * 0.12;
});
(function tick() { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(tick); })();
}

// PRODUCTS DATA
const products = [
 {
    id:1, category:'polo', badge:'new',
    name:' Bamszn OG green Polo', edition:'Stay Fly Edition',
    price:'$36.15', ngn:'₦48,000', amountNGN:48000, payLink:'',
    desc:'The one that started it all. The green OG Polo is cut from heavyweight piqué cotton with our signature embroidered "bamszn" badge on the collar when raised. Clean, structured, and built to last beyond one season.',
    sizes:['XS','S','M','L','XL','XXL'], oos:['XS'], available:false,
    material:'100% Premium Cotton Piqué', fit:'Regular / Fit',
    imgSrc:'https://i.postimg.cc/FsKmD4rD/IMG-1831.png',
    imgSrc2:'', swatch:'#111'
  },
  {
    id:2, category:'polo', badge:'ltd',
    name:'Bamszn Nigeria-themed blue TEE', edition:'Signature Edition',
    price:'$20.21', ngn:'₦32,000', amountNGN:32000, payLink:'',
    desc:"Soft on the eye, tough in the game. Limited run — once it's gone, it's gone.",
    sizes:['S','M','L','XL'], oos:[], available:false,
    material:'100% Premium Cotton Piqué', fit:'Slim / Tapered',
    imgSrc:'https://i.postimg.cc/CL692rXK/Nigeria-themed-blue-TEE.png',
    imgSrc2:'', swatch:'#d4a0a0'
  },
  {
    id:3, category:'polo', badge:'ltd',
    name:'Burgundy Bamszn Polo', edition:'ltd Edition',
    price:'$36.15', ngn:'₦48,000', amountNGN:48000, payLink:'',
    desc:'Clean burgundy base, a combination built for the big moments. The Gold Edition is the centrepiece of The 001 Drop. Wear it like a trophy.',
    sizes:['XS','S','M','L','XL','XXL'], oos:['XXL'], available:false,
    material:'100% Premium Cotton Piqué', fit:'Regular / Fit',
    imgSrc:'https://i.postimg.cc/26p8KXck/IMG-1832.png',
    imgSrc2:'', swatch:'#f0ede8'
  },
  {
    id:4, category:'polo', badge:'ltd',
    name:'Pink bam.szn Polo', edition:'New Edition',
    price:'$36.15', ngn:'₦48,000', amountNGN:48000, payLink:'',
    desc:'The everyday essential. cut in pink. Wear it alone, layer it — this one works every time.',
    sizes:['S','M','L','XL','XXL'], oos:[], available:false,
    material:'250gsm Heavyweight Cotton', fit:'Regular / Fit',
    imgSrc:'https://i.postimg.cc/W1C2dHPk/IMG-1833.png',
    imgSrc2:'', swatch:'#111'
  },
  {
    id:5, category:'tee', badge:null,
    name:'No Off Szn Tee', edition:'Graphic Edition',
    price:'$18.00', ngn:'₦28000', amountNGN:28000, payLink:'',
    desc:'Full-chest graphic tee with the Bam.szn manifesto printed in pink glitter . This is the statement piece — bold, loud, and impossible to ignore.',
    sizes:['S','M','L','XL'], oos:['S'], available:true,
    material:'180gsm Cotton', fit:'Regular / Relaxed',
    imgSrc:'https://i.postimg.cc/yxDkyr2Q/bamszn-glitter-tee.png',
    imgSrc2:'', swatch:'#777'
  },
  {
    id:6, category:'set', badge:'SOON',
    name:'Bamszn Red waffle Tee', edition:'Matching Set — Red',
    price:'$80', ngn:'₦128,000', amountNGN:128000, payLink:'',
    desc:'The full Bams experience. Red polo and straight-leg shorts in matching cotton. An entire vibe — co-ord ready.',
    sizes:['S','M','L','XL'], oos:[], available:false,
    material:'100% waffle cotton — Co-ord Set', fit:'Matching / Relaxed',
    imgSrc:'https://i.postimg.cc/7YsbWDxv/freepik-bamsszn-project-20260918151747g4TM-removebg-preview.png',
    imgSrc2:'', swatch:'#C00000'
  },
];

// Flat shipping fee added at checkout (Naira) — only applied once a delivery address is entered
// Shipping fee per Nigerian state (delivery destination) — replaces the old flat fee
const SHIPPING_RATES = [
  { state: 'Abuja (FCT)', fee: 5000 },
  { state: 'Adamawa — Yola', fee: 5000 },
  { state: 'Akwa Ibom — Uyo', fee: 6000 },
  { state: 'Anambra — Awka', fee: 6000 },
  { state: 'Bauchi — Bauchi', fee: 4000 },
  { state: 'Bayelsa — Yenagoa', fee: 7000 },
  { state: 'Benue — Makurdi', fee: 5000 },
  { state: 'Borno — Maiduguri', fee: 5000 },
  { state: 'Cross River — Calabar', fee: 7000 },
  { state: 'Delta — Asaba', fee: 6000 },
  { state: 'Ebonyi — Abakaliki', fee: 6000 },
  { state: 'Edo — Benin City', fee: 6000 },
  { state: 'Ekiti — Ado-Ekiti', fee: 6000 },
  { state: 'Enugu — Enugu', fee: 6000 },
  { state: 'Gombe — Gombe', fee: 5000 },
  { state: 'Imo — Owerri', fee: 6000 },
  { state: 'Jigawa — Dutse', fee: 4000 },
  { state: 'Kaduna — Kaduna', fee: 5500 },
  { state: 'Kano — Kano', fee: 5000 },
  { state: 'Katsina — Katsina', fee: 4000 },
  { state: 'Kebbi — Birnin Kebbi', fee: 5000 },
  { state: 'Kogi — Lokoja', fee: 6000 },
  { state: 'Kwara — Ilorin', fee: 5000 },
  { state: 'Lagos — Ikeja', fee: 6000 },
  { state: 'Nasarawa — Lafia', fee: 5000 },
  { state: 'Niger — Minna', fee: 4000 },
  { state: 'Ogun — Abeokuta', fee: 6000 },
  { state: 'Ondo — Akure', fee: 6000 },
  { state: 'Osun — Osogbo', fee: 6000 },
  { state: 'Oyo — Ibadan', fee: 6000 },
  { state: 'Plateau — Jos', fee: 4000 },
  { state: 'Rivers — Port Harcourt', fee: 6000 },
  { state: 'Sokoto — Sokoto', fee: 5000 },
  { state: 'Taraba — Jalingo', fee: 5000 },
  { state: 'Yobe — Damaturu', fee: 5000 },
  { state: 'Zamfara — Gusau', fee: 4000 }
];
function shippingFeeFor(stateName) {
  const match = SHIPPING_RATES.find(r => r.state === stateName);
  return match ? match.fee : 0;
}

// Flat VAT fee (Naira) added to every order at checkout
const VAT_FEE = 550;

let selectedSizes = {};
let selectedQty = {};
let currentFilter = 'all';

// If a product image fails to load, drop in the placeholder instead of a blank box
function imgFail(img) {
  const wrap = img.parentNode;
  img.remove();
  if (wrap && wrap.dataset.fallback && !wrap.querySelector('.product-placeholder')) {
    wrap.insertAdjacentHTML('afterbegin', wrap.dataset.fallback);
  }
}

function renderProducts() {
  const list = currentFilter === 'all' ? products : products.filter(p => p.category === currentFilter);
  document.getElementById('productsGrid').innerHTML = list.map(p => `
    <div class="product-card ${p.available===false?'locked':''}" onclick="openProduct(${p.id})">
      <div class="product-img-wrap ${p.available===false?'unavailable':''}" data-fallback="&lt;div class=&quot;product-placeholder&quot;&gt;&lt;div class=&quot;placeholder-icon&quot;&gt;👕&lt;/div&gt;&lt;div class=&quot;placeholder-color-swatch&quot; style=&quot;background:${p.swatch}&quot;&gt;&lt;/div&gt;&lt;div class=&quot;placeholder-label&quot;&gt;${p.name.trim().split(' ').slice(0,2).join(' ').toUpperCase()}&lt;/div&gt;&lt;/div&gt;">
        ${p.imgSrc
          ? `<img src="${p.imgSrc}" alt="${p.name}" loading="lazy" decoding="async" referrerpolicy="no-referrer"
                 onerror="imgFail(this)">`
          : `<div class="product-placeholder">
               <div class="placeholder-icon">👕</div>
               <div class="placeholder-color-swatch" style="background:${p.swatch}"></div>
               <div class="placeholder-label">${p.name.split(' ').slice(0,2).join(' ').toUpperCase()}</div>
             </div>`}
        ${p.available===false ? `<div class="coming-soon-badge"><span>Coming Soon</span></div>` : ''}
        ${p.badge && p.available!==false ? `<span class="product-badge badge-${p.badge}">${p.badge==='new'?'New':p.badge==='ltd'?'Limited':'Sold Out'}</span>` : ''}
        <div class="quick-preview">${p.available===false ? 'Coming Soon' : 'Tap to Preview →'}</div>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-edition">${p.edition}</div>
        <div class="product-footer">
          <div class="product-price">${p.price}<small>${p.ngn}</small></div>
          <div class="product-sizes">
            ${p.sizes.slice(0,3).map(s=>`<div class="size-dot">${s}</div>`).join('')}
            ${p.sizes.length>3?`<div class="size-dot">+${p.sizes.length-3}</div>`:''}
          </div>
        </div>
      </div>
    </div>`).join('');
}

function filterProducts(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderProducts();
}

let modalImgIndex = {}; // tracks which of the (up to) 2 images is showing, per product id

function modalImages(p) {
  return [p.imgSrc, p.imgSrc2].filter(Boolean);
}

function renderModalImage(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const imgs = modalImages(p);
  const panel = document.getElementById('modalImgPanel');
  const placeholder = document.getElementById('modalPlaceholder');
  const oldImg = panel.querySelector('img');
  if (oldImg) oldImg.remove();
  panel.querySelectorAll('.img-nav-btn, .img-dots').forEach(el => el.remove());

  const src = imgs[modalImgIndex[id] || 0];
  if (src) {
    placeholder.style.display = 'none';
    const img = document.createElement('img');
    img.referrerPolicy = 'no-referrer';
    img.decoding = 'async';
    img.src = src;
    img.alt = p.name;
    if (p.available === false) img.style.filter = 'blur(9px) brightness(0.6)';
    img.onerror = () => { img.remove(); placeholder.style.display = ''; };
    panel.appendChild(img);
  } else {
    placeholder.style.display = '';
    document.getElementById('modalPlaceholderName').textContent = p.name.toUpperCase();
  }

  // Only show swap controls (prev/next + dots) when a rear view exists
  if (imgs.length > 1) {
    const prev = document.createElement('div');
    prev.className = 'img-nav-btn img-nav-prev';
    prev.innerHTML = '‹';
    prev.onclick = (e) => { e.stopPropagation(); swapModalImage(id, -1); };
    const next = document.createElement('div');
    next.className = 'img-nav-btn img-nav-next';
    next.innerHTML = '›';
    next.onclick = (e) => { e.stopPropagation(); swapModalImage(id, 1); };
    const dots = document.createElement('div');
    dots.className = 'img-dots';
    dots.innerHTML = imgs.map((_, i) =>
      `<div class="img-dot ${i===(modalImgIndex[id]||0)?'active':''}" onclick="event.stopPropagation();setModalImage(${id},${i})"></div>`
    ).join('');
    panel.appendChild(prev);
    panel.appendChild(next);
    panel.appendChild(dots);
  }
}

function swapModalImage(id, dir) {
  const p = products.find(x => x.id === id);
  const imgs = modalImages(p);
  modalImgIndex[id] = ((modalImgIndex[id] || 0) + dir + imgs.length) % imgs.length;
  renderModalImage(id);
}
function setModalImage(id, i) {
  modalImgIndex[id] = i;
  renderModalImage(id);
}

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (!selectedSizes[id]) selectedSizes[id] = null;
  selectedQty[id] = 1;
  modalImgIndex[id] = 0;

  renderModalImage(id);

  const sizeHtml = p.sizes.map(s => {
    const oos = p.oos.includes(s);
    return `<button class="size-btn ${oos?'oos':''} ${selectedSizes[id]===s?'selected':''}"
      ${oos ? 'disabled' : `onclick="selectSize(${id},'${s}',this)"`}>${s}</button>`;
  }).join('');

  const unavailable = p.available === false;

  const checkoutHtml = unavailable
    ? `<div class="coming-soon-lock">
         <div class="csl-title">Coming Soon</div>
         <div class="csl-sub">This piece isn't available to buy just yet. Check back soon, or follow @bam.szn for the drop.</div>
       </div>`
    : `<div class="modal-section-label">Select Size</div>
      <div class="size-grid" id="sizeGrid-${id}">${sizeHtml}</div>
      <div class="modal-section-label">Quantity</div>
      <div class="qty-stepper modal-qty">
        <button onclick="stepModalQty(${id},-1)" aria-label="Decrease quantity">−</button>
        <span id="modalQty-${id}">1</span>
        <button onclick="stepModalQty(${id},1)" aria-label="Increase quantity">+</button>
      </div>
      <button class="modal-add-btn add-bag-btn" id="addBtn-${id}" onclick="addToBag(${id},this)">
        <span class="abb-label">Add to Bag — ${p.ngn}</span>
        <span class="abb-done"><svg viewBox="0 0 24 24" width="16" height="16"><path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Added to Bag</span>
      </button>
      <button class="modal-secondary-btn" onclick="closeModalDirect();openBag()">View Bag &amp; Checkout</button>`;

  document.getElementById('modalContent').innerHTML = `
    <div>
      ${p.badge ? `<span class="product-badge badge-${p.badge}" style="position:static;display:inline-block;margin-bottom:12px;">${p.badge==='new'?'New':p.badge==='ltd'?'Limited Drop':unavailable?'Coming Soon':'Sold Out'}</span>` : ''}
      <div class="modal-tag">${p.category.toUpperCase()} — BAM.SZN</div>
      <div class="modal-title">${p.name}</div>
      <div class="modal-edition">${p.edition}</div>
      <div class="modal-price">${p.price}</div>
      <div class="modal-price-ngn">${p.ngn}</div>
      <p class="modal-desc">${p.desc}</p>
      ${checkoutHtml}
      <button class="modal-secondary-btn" style="margin-top:12px;" onclick="closeModalDirect()">Keep browsing</button>
      <div class="modal-meta">
        <div class="meta-row"><span>Material</span><span>${p.material}</span></div>
        <div class="meta-row"><span>Fit</span><span>${p.fit}</span></div>
        <div class="meta-row"><span>Ships from</span><span>Abuja, Nigeria 🇳🇬</span></div>
        <div class="meta-row"><span>Delivery</span><span>3–7 Business Days</span></div>
      </div>
    </div>`;

  document.getElementById('modalBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) { if (e.target===document.getElementById('modalBackdrop')) closeModalDirect(); }
function closeModalDirect() { document.getElementById('modalBackdrop').classList.remove('open'); if (!bagIsOpen()) document.body.style.overflow=''; }
function selectSize(id, size, btn) {
  selectedSizes[id] = size;
  document.querySelectorAll(`#sizeGrid-${id} .size-btn`).forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}
function stepModalQty(id, dir) {
  selectedQty[id] = Math.min(10, Math.max(1, (selectedQty[id] || 1) + dir));
  const el = document.getElementById(`modalQty-${id}`);
  if (el) { el.textContent = selectedQty[id]; popEl(el); }
}
function showToast(msg, title) {
  const t = document.getElementById('toast');
  document.getElementById('toastTitle').textContent = title || 'Done';
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ════════════════════════════════════════════════════════════
   BAG — customers can add several items (any size / quantity)
   and pay for everything in one Paystack checkout. The bag is
   kept in this browser's localStorage so it survives reloads
   and moving between the home page and the shop page.
   ════════════════════════════════════════════════════════════ */
const BAG_KEY = 'bamszn_bag_v1';
const BAG_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 10V6.5a3 3 0 0 1 6 0V10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;

let bag = loadBag();

function loadBag() {
  try {
    const raw = JSON.parse(localStorage.getItem(BAG_KEY) || '[]');
    // drop anything that no longer exists or can't be bought
    return raw.filter(it => {
      const p = products.find(x => x.id === it.id);
      return p && p.available !== false && p.sizes.includes(it.size) && !p.oos.includes(it.size) && it.qty > 0;
    });
  } catch (e) { return []; }
}
function saveBag() {
  try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch (e) {}
}
function bagCount() { return bag.reduce((n, it) => n + it.qty, 0); }
function bagSubtotal() {
  return bag.reduce((sum, it) => sum + products.find(x => x.id === it.id).amountNGN * it.qty, 0);
}
function bagIsOpen() { return document.body.classList.contains('bag-open'); }

function popEl(el) {
  el.classList.remove('pop');
  void el.offsetWidth; // restart the animation
  el.classList.add('pop');
}

function mountBag() {
  const nav = document.querySelector('header nav');
  if (nav && !document.getElementById('bagBtn')) {
    nav.insertAdjacentHTML('beforeend',
      `<button class="bag-btn" id="bagBtn" onclick="openBag()" aria-label="Open bag">${BAG_ICON}<span class="bag-count" id="bagCount">0</span></button>`);
  }
  document.body.insertAdjacentHTML('beforeend', `
    <div class="bag-backdrop" id="bagBackdrop" onclick="closeBag()"></div>
    <aside class="bag-drawer" id="bagDrawer" aria-label="Your bag">
      <div class="bag-head">
        <div>
          <div class="bag-eyebrow">Your</div>
          <div class="bag-title">Bag <span id="bagTitleCount"></span></div>
        </div>
        <button class="modal-close bag-close" onclick="closeBag()" aria-label="Close bag">✕</button>
      </div>
      <div class="bag-body" id="bagBody"></div>
    </aside>`);
  updateBagBadge(false);
}

function updateBagBadge(animate) {
  const n = bagCount();
  const c = document.getElementById('bagCount');
  if (c) {
    c.textContent = n;
    c.classList.toggle('has-items', n > 0);
    if (animate) popEl(c);
  }
  const t = document.getElementById('bagTitleCount');
  if (t) t.textContent = n ? `(${n})` : '';
}

function addToBag(id, btn) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  if (p.available === false) { showToast('This item is coming soon and can\'t be purchased yet.','Not available'); return; }
  const size = selectedSizes[id];
  if (!size) {
    showToast('Pick a size to continue.','Size needed');
    const grid = document.getElementById(`sizeGrid-${id}`);
    if (grid) { grid.classList.remove('shake'); void grid.offsetWidth; grid.classList.add('shake'); }
    return;
  }
  const qty = selectedQty[id] || 1;
  const existing = bag.find(it => it.id === id && it.size === size);
  if (existing) existing.qty = Math.min(10, existing.qty + qty);
  else bag.push({ id, size, qty });
  saveBag();

  if (btn) {
    btn.classList.remove('added'); void btn.offsetWidth; btn.classList.add('added');
    burstFrom(btn, 14);
    clearTimeout(btn._t);
    btn._t = setTimeout(() => btn.classList.remove('added'), 1600);
  }
  flyToBag(document.querySelector('#modalImgPanel img') || document.getElementById('modalImgPanel'), () => {
    updateBagBadge(true);
    const b = document.getElementById('bagBtn');
    if (b) popEl(b);
  });
  if (bagIsOpen()) renderBag();
  showToast(`${qty} × ${p.name.trim()} (${size}) added.`, 'Added to bag');
}

// A copy of the product image arcs from the modal into the header bag icon
function flyToBag(srcEl, done) {
  const target = document.getElementById('bagBtn');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!srcEl || !target || reduce || !Element.prototype.animate) { done && done(); return; }
  const s = srcEl.getBoundingClientRect();
  const t = target.getBoundingClientRect();
  const size = Math.min(s.width, s.height, 220);
  const fly = document.createElement('div');
  fly.className = 'bag-fly';
  fly.style.cssText = `width:${size}px;height:${size}px;left:${s.left + s.width/2 - size/2}px;top:${s.top + s.height/2 - size/2}px;`;
  if (srcEl.tagName === 'IMG') fly.style.backgroundImage = `url("${srcEl.src}")`;
  document.body.appendChild(fly);

  const dx = (t.left + t.width/2) - (s.left + s.width/2);
  const dy = (t.top + t.height/2) - (s.top + s.height/2);
  const anim = fly.animate([
    { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1, borderRadius: '6px' },
    { transform: `translate(${dx*0.45}px,${dy*0.45 - 160}px) scale(0.55) rotate(-14deg)`, opacity: 1, borderRadius: '30%', offset: 0.45 },
    { transform: `translate(${dx}px,${dy}px) scale(0.08) rotate(20deg)`, opacity: 0.4, borderRadius: '50%' }
  ], { duration: 850, easing: 'cubic-bezier(0.5,0,0.3,1)' });
  anim.onfinish = () => {
    fly.remove();
    ringPulse(target);
    done && done();
  };
}

function ringPulse(el) {
  const r = el.getBoundingClientRect();
  const ring = document.createElement('div');
  ring.className = 'bag-ring';
  ring.style.left = (r.left + r.width/2) + 'px';
  ring.style.top  = (r.top + r.height/2) + 'px';
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 700);
}

// Little sparks that shoot out of an element (used on add-to-bag)
function burstFrom(el, count) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !Element.prototype.animate) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    spark.style.left = cx + 'px';
    spark.style.top = cy + 'px';
    if (i % 3 === 0) spark.style.background = '#fff';
    document.body.appendChild(spark);
    const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 50 + Math.random() * 70;
    spark.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang)*dist}px), calc(-50% + ${Math.sin(ang)*dist}px)) scale(0)`, opacity: 0 }
    ], { duration: 600 + Math.random()*300, easing: 'cubic-bezier(0.16,1,0.3,1)' }).onfinish = () => spark.remove();
  }
}

function openBag() {
  renderBag(true);
  document.body.classList.add('bag-open');
  document.body.style.overflow = 'hidden';
}
function closeBag() {
  if (!bagIsOpen()) return;
  document.body.classList.remove('bag-open');
  if (!document.getElementById('modalBackdrop').classList.contains('open')) document.body.style.overflow = '';
}

function renderBag(stagger) {
  const body = document.getElementById('bagBody');
  if (!body) return;
  updateBagBadge(false);

  if (!bag.length) {
    body.innerHTML = `
      <div class="bag-empty">
        <div class="bag-empty-icon">${BAG_ICON}</div>
        <div class="bag-empty-title">Your bag is empty.</div>
        <p>No off szn — go pick something out.</p>
        <a href="/shop" class="btn-primary" data-shop-link onclick="closeBag()">Shop with Bamszn</a>
      </div>`;
    return;
  }

  // keep whatever the customer already typed in the delivery form
  const keep = {};
  ['bagName','bagEmail','bagPhone','bagState','bagAddr'].forEach(k => { const el = document.getElementById(k); if (el) keep[k] = el.value; });

  const items = bag.map((it, i) => {
    const p = products.find(x => x.id === it.id);
    return `
      <div class="bag-item ${stagger?'stagger':''}" style="--i:${i}" id="bagItem-${i}">
        <div class="bag-item-img">${p.imgSrc ? `<img src="${p.imgSrc}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</div>
        <div class="bag-item-info">
          <div class="bag-item-name">${p.name.trim()}</div>
          <div class="bag-item-meta">Size ${it.size} · ${p.ngn}</div>
          <div class="bag-item-row">
            <div class="qty-stepper">
              <button onclick="changeBagQty(${i},-1)" aria-label="Decrease quantity">−</button>
              <span>${it.qty}</span>
              <button onclick="changeBagQty(${i},1)" aria-label="Increase quantity">+</button>
            </div>
            <div class="bag-item-total">₦${(p.amountNGN * it.qty).toLocaleString()}</div>
          </div>
        </div>
        <button class="bag-item-remove" onclick="removeBagItem(${i})" aria-label="Remove item">✕</button>
      </div>`;
  }).join('');

  body.innerHTML = `
    <div class="bag-items">${items}</div>
    <div class="bag-checkout ${stagger?'stagger':''}" style="--i:${bag.length}">
      <div class="modal-section-label">Delivery Details</div>
      <input class="checkout-input" id="bagName" placeholder="Full name">
      <input class="checkout-input" id="bagEmail" type="email" inputmode="email" placeholder="Email address">
      <input class="checkout-input" id="bagPhone" type="tel" inputmode="tel" placeholder="Phone number">
      <select class="checkout-input" id="bagState" onchange="updateBagTotals()">
        <option value="">Select delivery location (state)</option>
        ${SHIPPING_RATES.map(r => `<option value="${r.state}">${r.state} — ₦${r.fee.toLocaleString()}</option>`).join('')}
      </select>
      <input class="checkout-input" id="bagAddr" placeholder="Delivery address">
      <div class="price-breakdown">
        <div class="price-row"><span>Subtotal (${bagCount()} item${bagCount()===1?'':'s'})</span><span id="bagSubtotal"></span></div>
        <div class="price-row"><span>Shipping</span><span id="bagShipping">Select location</span></div>
        <div class="price-row"><span>VAT (1.5%)</span><span id="bagVat">₦${VAT_FEE.toLocaleString()}</span></div>
        <div class="price-row total"><span>Total</span><span id="bagTotal"></span></div>
      </div>
      <button class="modal-add-btn" id="bagPayBtn" onclick="checkoutBag()">Pay with Paystack</button>
      <button class="modal-secondary-btn" onclick="closeBag()">Keep shopping</button>
    </div>`;

  Object.keys(keep).forEach(k => { const el = document.getElementById(k); if (el) el.value = keep[k]; });
  updateBagTotals();
}

function updateBagTotals() {
  const stateVal = (document.getElementById('bagState') || {}).value || '';
  const fee = stateVal ? shippingFeeFor(stateVal) : 0;
  const sub = bagSubtotal();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('bagSubtotal', '₦' + sub.toLocaleString());
  set('bagShipping', stateVal ? '₦' + fee.toLocaleString() : 'Select location');
  set('bagTotal', '₦' + (sub + fee + VAT_FEE).toLocaleString());
  set('bagPayBtn', 'Pay ₦' + (sub + fee + VAT_FEE).toLocaleString() + ' with Paystack');
  const total = document.getElementById('bagTotal');
  if (total) popEl(total);
}

function changeBagQty(i, dir) {
  if (!bag[i]) return;
  const next = bag[i].qty + dir;
  if (next < 1) { removeBagItem(i); return; }
  bag[i].qty = Math.min(10, next);
  saveBag();
  renderBag();
  updateBagBadge(true);
}

function removeBagItem(i) {
  const el = document.getElementById(`bagItem-${i}`);
  const finish = () => { bag.splice(i, 1); saveBag(); renderBag(); updateBagBadge(true); };
  if (!el) { finish(); return; }
  el.style.height = el.offsetHeight + 'px';
  void el.offsetWidth;
  el.classList.add('removing');
  setTimeout(finish, 380);
}

function checkoutBag() {
  if (!bag.length) { showToast('Your bag is empty.','Nothing to pay for'); return; }

  const name  = (document.getElementById('bagName')  || {}).value?.trim() || '';
  const email = (document.getElementById('bagEmail') || {}).value?.trim() || '';
  const phone = (document.getElementById('bagPhone') || {}).value?.trim() || '';
  const state = (document.getElementById('bagState') || {}).value || '';
  const addr  = (document.getElementById('bagAddr')  || {}).value?.trim() || '';

  if (!name)  { showToast('Enter your full name.','Missing details'); return; }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showToast('Enter a valid email so we can send your receipt.','Missing details'); return; }
  if (!phone) { showToast('Enter a phone number for delivery.','Missing details'); return; }
  if (!state) { showToast('Select your delivery location to calculate shipping.','Missing details'); return; }
  if (!addr)  { showToast('Enter your delivery address.','Missing details'); return; }

  const items = bag.map(it => ({ p: products.find(x => x.id === it.id), size: it.size, qty: it.qty }));
  const subtotal = bagSubtotal();
  const shippingFee = shippingFeeFor(state);
  const vatFee = VAT_FEE;
  const totalNGN = subtotal + shippingFee + vatFee;
  const orderRef = 'BAMS-' + Date.now();
  const order = { items, name, email, phone, state, addr, subtotal, shippingFee, vatFee, totalNGN, orderRef };
  const itemsSummary = items.map(it => `${it.qty} × ${it.p.name.trim()} — ${it.size}`).join(', ');

  if (typeof PaystackPop === 'undefined') {
    showToast('Payment could not load. Check your connection and try again.','Checkout unavailable');
    return;
  }
  if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY.indexOf('REPLACE_ME') !== -1) {
    showToast('Paystack key not set yet. Add your public key in the code.','Setup needed');
    return;
  }

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: email,
    amount: totalNGN * 100,          // Paystack charges in kobo — bag subtotal + shipping + VAT
    currency: 'NGN',
    ref: orderRef,
    metadata: {
      custom_fields: [
        { display_name: 'Items',    variable_name: 'items',    value: itemsSummary },
        { display_name: 'Subtotal', variable_name: 'subtotal', value: '₦' + subtotal.toLocaleString() },
        { display_name: 'Delivery State', variable_name: 'delivery_state', value: state },
        { display_name: 'Shipping', variable_name: 'shipping', value: '₦' + shippingFee.toLocaleString() },
        { display_name: 'VAT (1.5%)', variable_name: 'vat', value: '₦' + vatFee.toLocaleString() },
        { display_name: 'Total',    variable_name: 'total',    value: '₦' + totalNGN.toLocaleString() },
        { display_name: 'Customer', variable_name: 'customer', value: name },
        { display_name: 'Phone',    variable_name: 'phone',    value: phone },
        { display_name: 'Address',  variable_name: 'address',  value: addr }
      ]
    },
    callback: function (response) {
      order.reference = response.reference;
      sendInvoiceEmails(order); // fires the admin + customer invoice emails via the Netlify Function, see setup notes above
      bag = []; saveBag(); renderBag(); updateBagBadge(true);
      closeBag();
      showToast('Order confirmed. Reference ' + response.reference + ' — we will reach out on ' + phone + '.', 'Payment received');
    },
    onClose: function () {
      showToast('Checkout closed. Your bag is still saved.','Payment cancelled');
    }
  });
  handler.openIframe();
}

/* ════════════════════════════════════════════════════════════
   "SHOP WITH BAMSZN" — any link with data-shop-link plays a
   full-screen transition (red shockwave, sparks, slicing bars,
   glitching logo) and then opens the shop page, which finishes
   the animation as it reveals the products.
   ════════════════════════════════════════════════════════════ */
const SHOP_INTRO_KEY = 'bamszn_shop_intro';

document.addEventListener('click', e => {
  const link = e.target.closest('a[data-shop-link]');
  if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  playShopTransition(link.getAttribute('href') || '/shop', e.clientX, e.clientY);
});

function playShopTransition(href, x, y) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { window.location.href = href; return; }
  if (document.getElementById('shopWarp')) return;
  if (!x && !y) { x = window.innerWidth / 2; y = window.innerHeight / 2; }

  const bars = Array.from({ length: 7 }, (_, i) => `<div class="warp-bar" style="--i:${i}"></div>`).join('');
  const word = 'BAM.SZN'.split('').map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join('');
  document.body.insertAdjacentHTML('beforeend', `
    <div class="shop-warp" id="shopWarp" style="--x:${x}px;--y:${y}px">
      <div class="warp-shock"></div>
      <div class="warp-bars">${bars}</div>
      <div class="warp-word" data-text="BAM.SZN">${word}</div>
      <div class="warp-tag">Entering the shop</div>
      <div class="warp-streaks"></div>
    </div>`);
  document.body.classList.add('warp-shake');
  burstAt(x, y, 36);

  try { sessionStorage.setItem(SHOP_INTRO_KEY, '1'); } catch (err) {}
  setTimeout(() => { window.location.href = href; }, 1350);
}

function burstAt(x, y, count) {
  if (!Element.prototype.animate) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('div');
    s.className = 'spark warp-spark';
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    if (i % 4 === 0) s.style.background = '#fff';
    document.body.appendChild(s);
    const ang = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * Math.max(window.innerWidth, window.innerHeight) * 0.5;
    s.animate([
      { transform: 'translate(-50%,-50%) scale(1.4) rotate(0deg)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(ang)*dist}px), calc(-50% + ${Math.sin(ang)*dist}px)) scale(0) rotate(${Math.random()*720}deg)`, opacity: 0 }
    ], { duration: 700 + Math.random()*500, easing: 'cubic-bezier(0.12,0.9,0.3,1)' }).onfinish = () => s.remove();
  }
}

// Coming back with the browser's back button can restore the page mid-animation
window.addEventListener('pageshow', () => {
  const w = document.getElementById('shopWarp');
  if (w) w.remove();
  document.body.classList.remove('warp-shake');
});

// On the shop page: finish the transition by tearing the bars away
(function shopIntro() {
  if (!document.body.classList.contains('shop-page')) return;
  let fromWarp = false;
  try { fromWarp = sessionStorage.getItem(SHOP_INTRO_KEY) === '1'; sessionStorage.removeItem(SHOP_INTRO_KEY); } catch (err) {}
  const intro = document.getElementById('shopIntro');
  if (!intro) return;
  if (fromWarp) intro.classList.add('from-warp');
  requestAnimationFrame(() => requestAnimationFrame(() => intro.classList.add('go')));
  setTimeout(() => intro.remove(), 1800);
})();

// SCROLL REVEAL — with a fail-safe so content can never stay invisible
function revealAll() {
  document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
}
if ('IntersectionObserver' in window) {
  document.querySelectorAll('.fade-up').forEach(el =>
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }).observe(el)
  );
  // if anything goes wrong, show everything after 2.5s rather than leave a blank page
  setTimeout(revealAll, 2500);
} else {
  revealAll();
}

document.addEventListener('keydown', e => { if (e.key==='Escape') { closeModalDirect(); closeBag(); } });
if (document.getElementById('productsGrid')) renderProducts();
mountBag();
