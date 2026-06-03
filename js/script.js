// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
    }

    // Hero Slider Functionality
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.getElementById('prevSliderBtn');
    const nextBtn = document.getElementById('nextSliderBtn');
    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(index) {
        // Remove active class from all slides and indicators
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        // Add active class to current slide and indicator
        if (slides[index]) slides[index].classList.add('active');
        if (indicators[index]) indicators[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    function prevSlide() {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        showSlide(currentSlide);
    }

    // If only one slide exists, disable slider controls/auto-play and leave static hero
    if (totalSlides <= 1) {
        // hide slider navigation and indicators if present
        const sliderNav = document.querySelector('.slider-navigation');
        const slideIndicatorsEl = document.querySelector('.slide-indicators');
        if (sliderNav) sliderNav.style.display = 'none';
        if (slideIndicatorsEl) slideIndicatorsEl.style.display = 'none';
        // ensure first slide is active
        if (slides[0]) slides[0].classList.add('active');
    } else {
        // Event listeners for navigation buttons
        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', prevSlide);
            nextBtn.addEventListener('click', nextSlide);
        }

        // Event listeners for indicators
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', function() {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });

        // Auto-play slider
        const sliderInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        });

        function updateHeroSlide() {
            showSlide(currentSlide);
        }
    }

    // Brands Carousel: auto-scroll disabled. Navigation is manual with prev/next buttons.
    const brandsCarousel = document.querySelector('.brands-carousel');
    if (brandsCarousel) {
        // Keep scroll position in sync when user scrolls or window resizes
        brandsCarousel.addEventListener('scroll', function() {
            // nothing to do here for auto-scroll; the manual navigation handles scroll
        });
        window.addEventListener('resize', function() {
            // When window resizes, nothing special required here; prev/next logic will compute maxScroll as needed
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Shopping Cart Functionality
    let cartItems = 0;
    const cartCount = document.querySelector('.cart-count');
    const cartIcon = document.querySelector('.cart-icon');

    function updateCartCount() {
        if (cartCount) {
            cartCount.textContent = cartItems;
            cartCount.style.display = cartItems > 0 ? 'flex' : 'none';
        }
    }

    // Add to cart function (to be used with product buttons)
    // If a global implementation exists (we may have set a robust handler earlier), keep it.
    if(typeof window.addToCart !== 'function'){
        window.addToCart = function(productId, qty=1) {
            // basic fallback which updates a local counter and UI
            cartItems += (qty||1);
            updateCartCount();
            // Show a brief notification
            showNotification('Ürün sepete eklendi!');
        };
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 9999;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Simple Cart Modal
    function ensureCartModal(){
        if(document.getElementById('cart-modal')) return document.getElementById('cart-modal');
        // backdrop
        const backdrop = document.createElement('div'); backdrop.id = 'cart-backdrop'; document.body.appendChild(backdrop);
        // panel
        const modal = document.createElement('div'); modal.id = 'cart-modal';
        modal.innerHTML = `
            <div class="cart-header">
                <h3>Sepetiniz</h3>
                <button class="cart-close" aria-label="Kapat">✕</button>
            </div>
            <div class="cart-contents"><div class="cart-empty">Sepet boş</div></div>
            <div class="cart-footer">
                <div class="summary-row small"><span>Ara Toplam</span><span class="subtotal">0 TL</span></div>
                <div class="summary-row small"><span>Kargo</span><span class="shipping">0 TL</span></div>
                <div class="summary-row"><span>Toplam</span><span class="total">0 TL</span></div>
                <div class="cart-actions">
                    <button class="clear-cart">Sepeti Temizle</button>
                    <button class="checkout-btn">Ödemeye Geç</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // close handlers
        backdrop.addEventListener('click', function(){ modal.classList.remove('open'); backdrop.classList.remove('open'); });
        modal.querySelector('.cart-close').addEventListener('click', function(){ modal.classList.remove('open'); backdrop.classList.remove('open'); });

        // clear cart
        modal.querySelector('.clear-cart').addEventListener('click', function(){
            localStorage.setItem('ts_cart', JSON.stringify([]));
            renderCartModal();
        });

        // proceed to checkout from cart
        modal.querySelector('.checkout-btn').addEventListener('click', async function(){
            const cart = JSON.parse(localStorage.getItem('ts_cart')||'[]');
            if(!cart || cart.length===0){ showNotification('Sepet boş'); return; }
            const payload = { items: cart.map(i=>({ productId: i.productId, qty: i.qty })), total: cart.reduce((s,i)=>s + (Number(i.price||0)*i.qty),0) };
            try{
                const res = await fetch('/api/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
                const data = await res.json();
                if(data && data.redirectUrl){ window.location.href = data.redirectUrl; return; }
                // fallback: create local order under 'ts_orders', clear cart
                const orders = JSON.parse(localStorage.getItem('ts_orders') || '[]');
                const id = 'o-' + Date.now(); orders.push({ id, items: payload.items, date: Date.now(), status:'pending' });
                localStorage.setItem('ts_orders', JSON.stringify(orders));
                localStorage.setItem('ts_cart', JSON.stringify([]));
                renderCartModal();
                showNotification('Sipariş oluşturuldu: ' + id);
            }catch(err){
                const orders = JSON.parse(localStorage.getItem('ts_orders') || '[]');
                const id = 'o-' + Date.now(); orders.push({ id, items: payload.items, date: Date.now(), status:'pending' });
                localStorage.setItem('ts_orders', JSON.stringify(orders));
                localStorage.setItem('ts_cart', JSON.stringify([]));
                renderCartModal();
                showNotification('Ağ hatası; sipariş yerel olarak oluşturuldu: ' + id);
            }
        });

        return modal;
    }

    function renderCartModal(){
        const modal = ensureCartModal();
        const container = modal.querySelector('.cart-contents');
        const cart = JSON.parse(localStorage.getItem('ts_cart')||'[]');
        container.innerHTML='';
        if(!cart || cart.length===0){ container.innerHTML = '<div class="empty">Sepet boş</div>'; modal.querySelector('.total').textContent = 'Toplam: 0 TL'; return; }
        let total = 0;
        cart.forEach(item=>{
            const row = document.createElement('div'); row.className='cart-item';

            const img = document.createElement('img'); img.src = item.img || '/images/Logo.jpeg'; img.alt = item.title || '';

            // meta (title)
            const meta = document.createElement('div'); meta.style.flex='1'; meta.className = 'cart-meta';
            const titleEl = document.createElement('div'); titleEl.style.fontWeight='600'; titleEl.textContent = item.title || item.productId;
            meta.appendChild(titleEl);

            // qty controls
            const qtyWrap = document.createElement('div'); qtyWrap.className = 'qty-controls';
            const minus = document.createElement('button'); minus.className = 'qty-btn minus'; minus.type='button'; minus.textContent = '−';
            const qtySpan = document.createElement('span'); qtySpan.className = 'qty-value'; qtySpan.textContent = item.qty;
            const plus = document.createElement('button'); plus.className = 'qty-btn plus'; plus.type='button'; plus.textContent = '+';
            const removeBtn = document.createElement('button'); removeBtn.className = 'btn'; removeBtn.style.marginLeft='8px'; removeBtn.textContent = 'Sil';
            qtyWrap.appendChild(minus); qtyWrap.appendChild(qtySpan); qtyWrap.appendChild(plus); qtyWrap.appendChild(removeBtn);
            meta.appendChild(qtyWrap);

            const price = document.createElement('div'); price.style.fontWeight='700'; price.className='cart-price'; price.textContent = (Number(item.price||0)*item.qty).toFixed(2) + ' TL';

            row.appendChild(img); row.appendChild(meta); row.appendChild(price);
            container.appendChild(row);

            // event handlers for qty
            minus.addEventListener('click', function(){
                const c = JSON.parse(localStorage.getItem('ts_cart')||'[]');
                const idx = c.findIndex(x=>x.productId===item.productId);
                if(idx===-1) return;
                c[idx].qty = Math.max(1, (c[idx].qty||1) - 1);
                localStorage.setItem('ts_cart', JSON.stringify(c));
                renderCartModal();
            });
            plus.addEventListener('click', function(){
                const c = JSON.parse(localStorage.getItem('ts_cart')||'[]');
                const idx = c.findIndex(x=>x.productId===item.productId);
                if(idx===-1) return;
                c[idx].qty = (c[idx].qty||0) + 1;
                localStorage.setItem('ts_cart', JSON.stringify(c));
                renderCartModal();
            });
            removeBtn.addEventListener('click', function(){
                let c = JSON.parse(localStorage.getItem('ts_cart')||'[]');
                c = c.filter(x=>x.productId!==item.productId);
                localStorage.setItem('ts_cart', JSON.stringify(c));
                renderCartModal();
            });

            total += Number(item.price||0)*item.qty;
        });

        // update total and cart count
        modal.querySelector('.total').textContent = 'Toplam: ' + total.toFixed(2) + ' TL';
        const totalCount = cart.reduce((s,i)=>s + (i.qty||0), 0);
        cartItems = totalCount; updateCartCount();
    }

    // Make cart icon clickable to toggle cart drawer
    if(cartIcon){
        cartIcon.style.cursor = 'pointer';
        cartIcon.addEventListener('click', function(e){
            e.preventDefault();
            const modal = ensureCartModal();
            const backdrop = document.getElementById('cart-backdrop');
            if(!modal.classList.contains('open')){
                renderCartModal();
                modal.classList.add('open');
                if(backdrop) backdrop.classList.add('open');
            } else {
                modal.classList.remove('open');
                if(backdrop) backdrop.classList.remove('open');
            }
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    // Implement search functionality
                    console.log('Searching for:', searchTerm);
                    showNotification('Arama özelliği yakında aktif olacak!');
                }
            }
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-item, .brand-item').forEach(el => {
        observer.observe(el);
    });

    // Initialize cart count
    updateCartCount();

    // Lazy loading for images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));

    // Newsletter subscription (if form exists)
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            if (email) {
                showNotification('E-bülten aboneliğiniz başarıyla oluşturuldu!');
                this.reset();
            }
        });
    }

    // Currency and language selector functionality
    const languageSelector = document.querySelector('.language-selector');
    if (languageSelector) {
        languageSelector.addEventListener('click', function() {
            // Toggle between TR/EN and TL/USD
            const spans = this.querySelectorAll('span');
            spans.forEach(span => {
                if (span.textContent === 'TR') {
                    span.textContent = 'EN';
                } else if (span.textContent === 'EN') {
                    span.textContent = 'TR';
                } else if (span.textContent === 'TL') {
                    span.textContent = 'USD';
                } else if (span.textContent === 'USD') {
                    span.textContent = 'TL';
                }
            });
        });
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .lazy {
        opacity: 0;
        transition: opacity 0.3s;
    }
    
    .nav-menu.active {
        display: flex !important;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 20px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
    
    .mobile-menu-toggle.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }
    
    .mobile-menu-toggle.active span:nth-child(2) {
        opacity: 0;
    }
    
    .mobile-menu-toggle.active span:nth-child(3) {
        transform: rotate(-45deg) translate(7px, -6px);
    }
    .stock-summary { font-size: 0.75rem; color:#555; margin-top:4px; }
`;
document.head.appendChild(style);

// Brands Carousel Functionality
document.addEventListener('DOMContentLoaded', function() {
    const brandsCarousel = document.getElementById('brandsCarousel');
    const prevBtn = document.querySelector('.brands .prev-btn');
    const nextBtn = document.querySelector('.brands .next-btn');

    // Marka tıklama işlevselliği: her logo bir marka sayfasına götürsün
    const brandLinks = document.querySelectorAll('.brand-link');
    brandLinks.forEach(link => {
        // If the anchor already has a proper href, let it behave as a normal link.
        // But to be safe, intercept clicks and navigate using the data-brand if present.
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const brand = this.getAttribute('data-brand');
            if (href && href !== '#') {
                // let default anchor behavior proceed
                return;
            }
            e.preventDefault();
            if (brand) {
                window.location.href = `brands/${brand}.html`;
            }
        });
    });
    
    if (brandsCarousel && prevBtn && nextBtn) {
        let scrollAmount = 0;
        const scrollStep = 250; // Her tıklamada kaydırılacak miktar
        
        // Sonraki butonu tıklama
        nextBtn.addEventListener('click', function() {
            scrollAmount += scrollStep;
            const maxScroll = brandsCarousel.scrollWidth - brandsCarousel.clientWidth;
            
            if (scrollAmount > maxScroll) {
                scrollAmount = maxScroll;
            }
            
            brandsCarousel.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
            
            updateButtons();
        });
        
        // Önceki butonu tıklama
        prevBtn.addEventListener('click', function() {
            scrollAmount -= scrollStep;
            
            if (scrollAmount < 0) {
                scrollAmount = 0;
            }
            
            brandsCarousel.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
            
            updateButtons();
        });
        
        // Buton durumlarını güncelle
        function updateButtons() {
            const maxScroll = brandsCarousel.scrollWidth - brandsCarousel.clientWidth;
            
            prevBtn.disabled = scrollAmount <= 0;
            nextBtn.disabled = scrollAmount >= maxScroll;
        }
        
        // Sayfa yüklendiğinde buton durumlarını ayarla
        updateButtons();
        
        // Pencere boyutu değiştiğinde güncelle
        window.addEventListener('resize', function() {
            const maxScroll = brandsCarousel.scrollWidth - brandsCarousel.clientWidth;
            if (scrollAmount > maxScroll) {
                scrollAmount = maxScroll;
                brandsCarousel.scrollLeft = scrollAmount;
            }
            updateButtons();
        });
    }
});

// Scroll to Products Function
function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/* --------- LocalStore Product & Order loader (admin client-only mode) ---------
   - Products stored under 'ts_products' (array of objects: {id,title,brand,price,images[]})
   - Orders stored under 'ts_orders' (array)
   - This code will render products into any .products-grid on brand pages (filters by brand title)
   - Also provides a buyNow(productId) to create a simple order stored in localStorage
*/
(function(){
    const LS_PRODUCTS = 'ts_products';
    const LS_ORDERS = 'ts_orders';

    function loadProducts(){
        try{ return JSON.parse(localStorage.getItem(LS_PRODUCTS) || '[]'); }catch(e){ return []; }
    }
    function saveOrders(list){ localStorage.setItem(LS_ORDERS, JSON.stringify(list)); }
    function showNotification(message){
        const n = document.createElement('div'); n.className='notification'; n.textContent=message;
        n.style.cssText='position:fixed;right:20px;top:20px;background:#28a745;color:#fff;padding:10px;border-radius:6px;z-index:9999';
        document.body.appendChild(n);
        setTimeout(()=>n.remove(),2400);
    }

    // Render products into .products-grid on brand pages or generic product lists
    // First try to fetch products from server API; if that fails, fall back to localStorage demo products
    async function renderProductsGrid(){
        const grids = document.querySelectorAll('.products-grid');
        if(!grids || grids.length===0) return;

        // Try server first
        let products = [];
        let usedFallback = false;
        try {
            const res = await fetch('/api/products');
            if(res && res.ok) {
                products = await res.json();
                // Defensive: parse stock JSON string if backend ever returns raw text
                products.forEach(p => { if(p && p.stock && typeof p.stock === 'string'){ try { p.stock = JSON.parse(p.stock); } catch(_) {} } });
            } else {
                products = loadProducts();
                usedFallback = true;
            }
        } catch(e) {
            products = loadProducts();
            usedFallback = true;
        }

        grids.forEach(grid => {
            // Determine brand context if available
            const brandTitleEl = document.querySelector('.brand-title');
            const brand = brandTitleEl ? brandTitleEl.textContent.trim().toLowerCase() : null;
            // Filter by brand if brand present (case-insensitive)
            let list = brand ? products.filter(p=> (p.brand || '').toString().toLowerCase() === brand) : products;
            // If this grid requests a random subset (homepage new season), pick that many unique random products
            const randomLimit = parseInt(grid.getAttribute('data-random-count')||'', 10);
                const isWeeklyDeals = grid.hasAttribute('data-weekly-deals');
            if(randomLimit && randomLimit > 0 && list.length > randomLimit){
                // Fisher-Yates shuffle for better randomness than sort comparator misuse
                const shuffled = list.slice();
                for(let i=shuffled.length-1;i>0;i--){
                    const j = Math.floor(Math.random() * (i+1));
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                }
                list = shuffled.slice(0, randomLimit);
            }

                        if(!list || list.length===0){
                                const msg = usedFallback
                                    ? '<p class="small">Bu marka için ürün bulunamadı. Sunucu kapalı olabilir; lütfen <code>node server/server.js</code> ile başlatıp sayfayı yenileyin.</p>'
                                    : '<p class="small">Bu marka için ürün bulunamadı. Admin panelden ürün ekleyin.</p>';
                                grid.innerHTML = msg;
                                return;
                        }

            grid.innerHTML = '';
            list.forEach(p => {
                const card = document.createElement('div'); card.className='product-card';
                card.setAttribute('data-product-id', p.id);
                // Image area: if multiple images, build a mini slider
                let imagesArr = Array.isArray(p.images) ? p.images : [];
                if(!imagesArr || imagesArr.length===0) imagesArr = ['../images/Logo.jpeg'];
                const hasMultiple = imagesArr.length > 1;

                const imgWrap = document.createElement('div');
                imgWrap.className = hasMultiple ? 'product-image-slider' : 'product-image';

                // create image elements
                imagesArr.forEach((src, idx) => {
                    const im = document.createElement('img');
                    im.src = src;
                    im.alt = p.title + ' görsel ' + (idx+1);
                    im.className = 'slide' + (idx===0 ? ' active' : '');
                    imgWrap.appendChild(im);
                });

                if(hasMultiple){
                    const prev = document.createElement('button'); prev.type='button'; prev.className='pimg-nav prev'; prev.setAttribute('aria-label','Önceki görsel'); prev.textContent='‹';
                    const next = document.createElement('button'); next.type='button'; next.className='pimg-nav next'; next.setAttribute('aria-label','Sonraki görsel'); next.textContent='›';
                    imgWrap.appendChild(prev); imgWrap.appendChild(next);
                    const dots = document.createElement('div'); dots.className='pimg-dots';
                    imagesArr.forEach((_,i)=>{ const d = document.createElement('button'); d.type='button'; d.className='pimg-dot' + (i===0?' active':''); d.setAttribute('aria-label','Görsel '+(i+1)); dots.appendChild(d); });
                    imgWrap.appendChild(dots);
                    let current = 0;
                    function show(idx){
                        const imgs = imgWrap.querySelectorAll('img.slide');
                        imgs.forEach(el=> el.classList.remove('active'));
                        if(imgs[idx]) imgs[idx].classList.add('active');
                        imgWrap.querySelectorAll('.pimg-dot').forEach((d,i)=>{ d.classList.toggle('active', i===idx); });
                        current = idx;
                    }
                    prev.addEventListener('click', e=>{ e.stopPropagation(); show( (current - 1 + imagesArr.length) % imagesArr.length ); });
                    next.addEventListener('click', e=>{ e.stopPropagation(); show( (current + 1) % imagesArr.length ); });
                    imgWrap.querySelectorAll('.pimg-dot').forEach((d,i)=>{
                        d.addEventListener('click', e=>{ e.stopPropagation(); show(i); });
                    });
                }

                const info = document.createElement('div'); info.className='product-info';
                // Build stock summary (e.g., S:3 M:0 L:5) if stock data exists
                const stockObj = p.stock || {};
                const stockEntries = Object.entries(stockObj).filter(([k,v]) => v !== undefined && v !== null && v !== '');
                const stockSummary = stockEntries.length ? stockEntries.map(([k,v]) => `${k}:${v}`).join(' ') : null;
                    // base price block
                    let priceHtml = `<p class="price">${p.price} TL</p>`;
                    if(isWeeklyDeals){
                        // sabit indirim oranı %15
                        const discountPct = 15;
                        const oldPrice = Number(p.price || 0);
                        const newPrice = (oldPrice * (1 - discountPct/100)).toFixed(2);
                        priceHtml = `<p class="price"><span class="new-price">${newPrice} TL</span><span class="old-price">${oldPrice.toFixed(2)} TL</span></p>`;
                    }
                    info.innerHTML = `<h3>${p.title}</h3><p class="brand">${p.brand}</p>${priceHtml}${stockSummary ? `<p class="stock-summary">Stok: ${stockSummary}</p>` : ''}`;

                // Size selector based on stock JSON
                // stockObj declared above for summary
                const sizeKeys = ['S','M','L','XL','XXL'].filter(k => stockObj[k] !== undefined);
                let availableSizes = sizeKeys.filter(k => Number(stockObj[k]) > 0);
                let sizeSelectorEl = null;
                if(sizeKeys.length){
                    sizeSelectorEl = document.createElement('div'); sizeSelectorEl.className='size-selector';
                    sizeKeys.forEach(sz => {
                        const btn = document.createElement('button');
                        btn.type='button';
                        btn.className='size-btn';
                        btn.textContent = sz + (stockObj[sz] !== undefined ? ` (${stockObj[sz]})` : '');
                        btn.dataset.size = sz;
                        const disabled = !(Number(stockObj[sz]) > 0);
                        if(disabled){ btn.classList.add('disabled'); btn.disabled = true; }
                        btn.addEventListener('click', e => {
                            e.stopPropagation();
                            if(btn.classList.contains('disabled')) return;
                            card.querySelectorAll('.size-btn').forEach(b=> b.classList.remove('selected'));
                            btn.classList.add('selected');
                            card.dataset.selectedSize = sz;
                        });
                        sizeSelectorEl.appendChild(btn);
                    });
                    // auto-select if only one available
                    if(availableSizes.length === 1){
                        const autoBtn = sizeSelectorEl.querySelector(`.size-btn[data-size="${availableSizes[0]}"]`);
                        if(autoBtn){ autoBtn.classList.add('selected'); card.dataset.selectedSize = availableSizes[0]; }
                    }
                }

                // Actions: Sepete Ekle ve Hemen Satın Al
                const actions = document.createElement('div'); actions.className='product-actions';
                const addBtn = document.createElement('button'); addBtn.className='btn'; addBtn.textContent='Sepete Ekle';
                addBtn.addEventListener('click', ()=>{ 
                    if(sizeSelectorEl && !card.dataset.selectedSize){ showNotification('Lütfen beden seçin'); return; }
                    window.addToCart(p.id,1, card.dataset.selectedSize || null); 
                });
                const buyBtn = document.createElement('button'); buyBtn.className='btn primary'; buyBtn.textContent='Hemen Satın Al';
                buyBtn.addEventListener('click', ()=>{ 
                    if(sizeSelectorEl && !card.dataset.selectedSize){ showNotification('Lütfen beden seçin'); return; }
                    buyNow(p.id,1, card.dataset.selectedSize || null); 
                });
                actions.appendChild(addBtn); actions.appendChild(buyBtn);
                card.appendChild(imgWrap); card.appendChild(info); if(sizeSelectorEl) card.appendChild(sizeSelectorEl); card.appendChild(actions);
                    if(isWeeklyDeals){
                        const badge = document.createElement('span');
                        badge.className = 'deal-badge';
                        badge.textContent = 'FIRSAT';
                        card.appendChild(badge);
                    }
                    card.appendChild(imgWrap); card.appendChild(info); if(sizeSelectorEl) card.appendChild(sizeSelectorEl); card.appendChild(actions);
                grid.appendChild(card);
            });
        });
    }

    // create a checkout modal and open it for the selected product
    function ensureCheckoutModal(){
        if(document.getElementById('checkout-modal')) return document.getElementById('checkout-modal');
        const modal = document.createElement('div'); modal.id = 'checkout-modal';
        modal.innerHTML = `
            <div class="modal-header">
                <strong>Hemen Satın Al</strong>
                <button class="modal-close" aria-label="Kapat">✕</button>
            </div>
            <div class="modal-body">
                <div class="checkout-item">
                    <img src="/images/Logo.jpeg" alt="product">
                    <div style="flex:1">
                        <div class="checkout-title" style="font-weight:700">Ürün</div>
                        <div class="checkout-price" style="color:var(--accent-color); font-weight:700; margin-top:6px">0 TL</div>
                    </div>
                </div>
                <div class="checkout-controls" style="margin-top:12px; display:flex; gap:10px; align-items:center; justify-content:space-between">
                    <div>
                        Adet: <input type="number" min="1" value="1" id="checkout-qty" style="width:70px; padding:6px; border-radius:8px; border:1px solid var(--border-color)">
                    </div>
                    <div class="checkout-summary">Toplam: <strong id="checkout-total">0 TL</strong></div>
                </div>
                <div class="checkout-actions">
                    <button class="btn" id="checkout-cancel">İptal</button>
                    <button class="proceed-btn" id="checkout-proceed">Ödemeye Geç</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        // close handlers
        modal.querySelector('.modal-close').addEventListener('click', ()=> modal.style.display='none');
        modal.querySelector('#checkout-cancel').addEventListener('click', ()=> modal.style.display='none');
        return modal;
    }

    async function openCheckoutModal(productId, qty=1, size=null){
        const modal = ensureCheckoutModal();
        // populate modal using DOM card if available
        let title = productId, price = 0, img = '/images/Logo.jpeg';
        const card = document.querySelector(`[data-product-id="${productId}"]`);
        if(card){
            const t = card.querySelector('h3'); if(t) title = t.textContent.trim();
            const p = card.querySelector('.price'); if(p) price = Number(p.textContent.replace(/[^0-9.,]/g,'').replace(',','.'))||0;
            const im = card.querySelector('img'); if(im) img = im.src;
        }

        modal.querySelector('.checkout-item img').src = img;
        modal.querySelector('.checkout-title').textContent = title;
        modal.querySelector('.checkout-price').textContent = price.toFixed(2) + ' TL';
        const qtyInput = modal.querySelector('#checkout-qty'); qtyInput.value = qty;
        const totalEl = modal.querySelector('#checkout-total');
        function updateTotal(){ const q = Number(qtyInput.value||1); totalEl.textContent = (price*q).toFixed(2) + ' TL'; }
        qtyInput.addEventListener('input', updateTotal);
        updateTotal();

        // proceed handler: send to server checkout endpoint (server may return redirectUrl)
        // Show selected size if provided
        if(size){
            const sizeInfo = document.createElement('div');
            sizeInfo.style.marginTop = '8px';
            sizeInfo.style.fontSize = '0.85rem';
            sizeInfo.style.color = '#555';
            sizeInfo.textContent = 'Seçilen Beden: ' + size;
            modal.querySelector('.modal-body').insertBefore(sizeInfo, modal.querySelector('.checkout-controls'));
        }

        modal.querySelector('#checkout-proceed').onclick = async function(){
            const q = Number(qtyInput.value||1);
            const payload = { items: [{ productId, qty: q, size }], total: (price*q) };
            try{
                const res = await fetch('/api/checkout', {
                    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
                const data = await res.json();
                if(data && data.redirectUrl){
                    window.location.href = data.redirectUrl;
                    return;
                }
                // fallback: create local order and show confirmation
                const orders = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]');
                const id = 'o-' + Date.now();
                orders.push({ id, items: [{productId, qty:q}], date: Date.now(), status: 'pending' });
                saveOrders(orders);
                modal.style.display = 'none';
                showNotification('Sipariş oluşturuldu: ' + id);
            }catch(err){
                // network error fallback
                const orders = JSON.parse(localStorage.getItem(LS_ORDERS) || '[]');
                const id = 'o-' + Date.now();
                orders.push({ id, items: [{productId, qty}], date: Date.now(), status: 'pending' });
                saveOrders(orders);
                modal.style.display = 'none';
                showNotification('Ağ hatası; sipariş yerel olarak oluşturuldu: ' + id);
            }
        };

        modal.style.display = 'block';
    }

    // create a simple order and open checkout modal
    function buyNow(productId, qty, size=null){
        openCheckoutModal(productId, qty, size);
    }

    // Expose buyNow globally so it can be used from markup if needed
    window.buyNow = buyNow;

    // Robust addToCart implementation (self-contained): updates localStorage, cart count DOM and cart modal if open
    window.addToCart = function(productId, qty=1, size=null){
        try{
            let cart = JSON.parse(localStorage.getItem('ts_cart')||'[]');
            const existing = cart.find(i=>i.productId===productId && i.size===size);
            if(existing) {
                existing.qty = (existing.qty||0) + (qty||1);
            } else {
                // Enrich cart item from DOM if possible
                let title = productId; let price = 0; let img = '/images/Logo.jpeg';
                const card = document.querySelector(`[data-product-id="${productId}"]`);
                if(card){
                    const t = card.querySelector('h3'); if(t) title = t.textContent.trim();
                    const p = card.querySelector('.price'); if(p) price = Number(p.textContent.replace(/[^0-9.,]/g,'').replace(',','.'))||0;
                    const im = card.querySelector('img'); if(im) img = im.src;
                }
                cart.push({productId, qty: qty||1, title, price, img, size});
            }
            localStorage.setItem('ts_cart', JSON.stringify(cart));

            // update cart count element
            const cartCountEl = document.querySelector('.cart-count');
            const totalCount = cart.reduce((s,i)=>s + (i.qty||0), 0);
            if(cartCountEl){ cartCountEl.textContent = totalCount; cartCountEl.style.display = totalCount>0 ? 'flex' : 'none'; }

            // if cart modal exists, update its contents
            const modal = document.getElementById('cart-modal');
            if(modal){
                const container = modal.querySelector('.cart-contents');
                if(container){
                    container.innerHTML = '';
                    if(!cart || cart.length === 0){
                        container.innerHTML = '<div class="empty">Sepet boş</div>';
                        const totalEl = modal.querySelector('.total'); if(totalEl) totalEl.textContent = 'Toplam: 0 TL';
                    } else {
                        let total = 0;
                        cart.forEach(item=>{
                            const row = document.createElement('div'); row.className='cart-item';
                            const imgEl = document.createElement('img'); imgEl.src = item.img || '/images/Logo.jpeg';
                            const sizeLine = item.size ? `<div class="muted">Beden: ${item.size}</div>` : '';
                            const meta = document.createElement('div'); meta.style.flex='1'; meta.innerHTML = `<div style="font-weight:600">${item.title||item.productId}</div>${sizeLine}<div class="muted">Adet: ${item.qty}</div>`;
                            const price = document.createElement('div'); price.style.fontWeight='700'; price.textContent = (Number(item.price||0)*item.qty).toFixed(2) + ' TL';
                            row.appendChild(imgEl); row.appendChild(meta); row.appendChild(price);
                            container.appendChild(row);
                            total += Number(item.price||0)*item.qty;
                        });
                        const totalEl = modal.querySelector('.total'); if(totalEl) totalEl.textContent = 'Toplam: ' + total.toFixed(2) + ' TL';
                    }
                }
            }

            // show toast
            if(typeof showNotification === 'function') showNotification((qty||1) + ' adet sepete eklendi');
        }catch(err){
            console.error('addToCart error', err);
            if(typeof showNotification === 'function') showNotification('Sepete eklenemedi');
        }
    };

    // Run on DOM ready
    document.addEventListener('DOMContentLoaded', function(){ renderProductsGrid(); });

    // Ana sayfada boş markaları gizle
    async function hideEmptyBrands(){
        try{
            // yalnızca index / ana sayfa için çalıştır
            const isHome = location.pathname.endsWith('/') || /index\.html?$/.test(location.pathname);
            if(!isHome) return;
            const res = await fetch('/api/products');
            const products = await res.json();
            const haveBrands = new Set(products.filter(p=>p.brand).map(p=> p.brand.trim().toLowerCase()));
            // carouseldeki öğeleri kontrol et
            document.querySelectorAll('.brands-carousel .brand-item').forEach(item => {
                const b = (item.getAttribute('data-brand')||'').trim().toLowerCase();
                if(!b) return;
                if(!haveBrands.has(b)){
                    // kaldır
                    item.remove();
                }
            });
        }catch(e){ console.warn('Boş marka gizleme başarısız', e); }
    }
    hideEmptyBrands();

})();