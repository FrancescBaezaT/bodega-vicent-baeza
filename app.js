/* ==========================================
   BODEGA VICENT BAEZA - MULTI-PAGE SCRIPT
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. Active Navigation Link Detection --- */
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    /* --- 2. Mobile Nav Toggle --- */
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            const icon = mobileToggle.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.className = 'ri-close-line';
            } else {
                icon.className = 'ri-menu-3-line';
            }
        });
    }

    /* --- 3. E-COMMERCE CART STATE & DRAWERS --- */
    const FREE_SHIPPING_THRESHOLD = 60.00;
    const STANDARD_SHIPPING_COST = 4.95;

    let cart = JSON.parse(localStorage.getItem('vicent_baeza_cart')) || [];

    const cartTriggerBtn = document.getElementById('cartTriggerBtn');
    const cartBadgeCount = document.getElementById('cartBadgeCount');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartSubtotalElem = document.getElementById('cartSubtotal');
    const cartShippingCostElem = document.getElementById('cartShippingCost');
    const cartGrandTotalElem = document.getElementById('cartGrandTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const freeShippingText = document.getElementById('freeShippingText');
    const shippingProgressFill = document.getElementById('shippingProgressFill');

    function saveCart() {
        localStorage.setItem('vicent_baeza_cart', JSON.stringify(cart));
        updateCartUI();
    }

    function updateCartUI() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (cartBadgeCount) {
            cartBadgeCount.textContent = totalCount;
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartSubtotalElem) {
            cartSubtotalElem.textContent = `${subtotal.toFixed(2).replace('.', ',')} €`;
        }

        if (freeShippingText && shippingProgressFill) {
            if (subtotal >= FREE_SHIPPING_THRESHOLD) {
                freeShippingText.innerHTML = `🎉 ¡Enhorabuena! Tienes <strong>ENVÍO GRATUITO</strong> a toda España`;
                shippingProgressFill.style.width = '100%';
            } else {
                const diff = FREE_SHIPPING_THRESHOLD - subtotal;
                const percentage = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
                freeShippingText.innerHTML = `Añade <strong>${diff.toFixed(2).replace('.', ',')} €</strong> más para <strong>ENVÍO GRATUITO</strong>`;
                shippingProgressFill.style.width = `${percentage}%`;
            }
        }

        let shippingCost = 0;
        if (subtotal > 0) {
            shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
        }

        if (cartShippingCostElem) {
            cartShippingCostElem.textContent = shippingCost === 0 && subtotal > 0 ? 'GRATIS' : `${shippingCost.toFixed(2).replace('.', ',')} €`;
        }

        const grandTotal = subtotal + shippingCost;
        if (cartGrandTotalElem) {
            cartGrandTotalElem.textContent = `${grandTotal.toFixed(2).replace('.', ',')} €`;
        }

        if (checkoutBtn) {
            checkoutBtn.disabled = cart.length === 0;
        }

        if (!cartItemsList) return;

        if (cart.length === 0) {
            cartItemsList.innerHTML = `
                <div class="empty-cart-msg">
                    <i class="ri-shopping-bag-line"></i>
                    <p>Tu carrito está vacío.</p>
                </div>
            `;
            return;
        }

        cartItemsList.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price.toFixed(2).replace('.', ',')} €</div>
                    <div class="cart-item-qty-controls">
                        <button class="btn-cart-qty" onclick="changeItemQty('${item.id}', -1)">-</button>
                        <span style="font-size: 0.85rem; font-weight: bold; padding: 0 4px;">${item.quantity}</span>
                        <button class="btn-cart-qty" onclick="changeItemQty('${item.id}', 1)">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeCartItem('${item.id}')" aria-label="Eliminar">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `).join('');
    }

    // Add to cart click handler
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const name = btn.getAttribute('data-name');
            const price = parseFloat(btn.getAttribute('data-price'));
            const img = btn.getAttribute('data-img');

            const existingIndex = cart.findIndex(item => item.id === id);
            if (existingIndex > -1) {
                cart[existingIndex].quantity += 1;
            } else {
                cart.push({ id, name, price, img, quantity: 1 });
            }

            saveCart();
            openCartDrawer();
            showToast('¡Añadido al Carrito!', `${name} se ha añadido a tu pedido.`);
        });
    });

    window.changeItemQty = function (id, change) {
        const item = cart.find(i => i.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== id);
            }
            saveCart();
        }
    };

    window.removeCartItem = function (id) {
        cart = cart.filter(i => i.id !== id);
        saveCart();
    };

    function openCartDrawer() {
        if (cartOverlay) cartOverlay.classList.add('active');
    }

    function closeCartDrawer() {
        if (cartOverlay) cartOverlay.classList.remove('active');
    }

    if (cartTriggerBtn) cartTriggerBtn.addEventListener('click', openCartDrawer);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) closeCartDrawer();
        });
    }

    updateCartUI();

    /* --- 4. SEARCH & SORT FOR TIENDA.HTML --- */
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productGrid = document.getElementById('productGrid');
    const productCards = Array.from(document.querySelectorAll('.product-card'));

    let activeCategory = 'all';

    function filterAndSortProducts() {
        if (!productGrid || productCards.length === 0) return;

        const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
        const sortValue = sortSelect ? sortSelect.value : 'featured';

        // Filter
        let visibleCards = productCards.filter(card => {
            const cardCat = card.getAttribute('data-category') || '';
            const cardName = (card.getAttribute('data-name') || card.querySelector('.product-title').textContent).toLowerCase();

            const matchesCategory = activeCategory === 'all' || cardCat.includes(activeCategory);
            const matchesSearch = cardName.includes(searchTerm);

            return matchesCategory && matchesSearch;
        });

        // Sort
        if (sortValue === 'price-asc') {
            visibleCards.sort((a, b) => parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price')));
        } else if (sortValue === 'price-desc') {
            visibleCards.sort((a, b) => parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price')));
        } else if (sortValue === 'name-asc') {
            visibleCards.sort((a, b) => a.getAttribute('data-name').localeCompare(b.getAttribute('data-name')));
        }

        // Hide all, then re-append visible ones
        productCards.forEach(card => card.style.display = 'none');
        visibleCards.forEach(card => {
            productGrid.appendChild(card);
            card.style.display = 'flex';
            card.style.opacity = '1';
        });
    }

    if (searchInput) searchInput.addEventListener('input', filterAndSortProducts);
    if (sortSelect) sortSelect.addEventListener('change', filterAndSortProducts);

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeCategory = btn.getAttribute('data-category');
            filterAndSortProducts();
        });
    });

    /* --- 5. CHECKOUT FORM --- */
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutModalClose = document.getElementById('checkoutModalClose');
    const checkoutForm = document.getElementById('checkoutForm');
    const modalFinalTotal = document.getElementById('modalFinalTotal');

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            closeCartDrawer();
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;
            const finalTotal = subtotal + shipping;

            if (modalFinalTotal) {
                modalFinalTotal.textContent = `${finalTotal.toFixed(2).replace('.', ',')} €`;
            }

            if (checkoutModal) {
                checkoutModal.classList.add('active');
            }
        });
    }

    if (checkoutModalClose) {
        checkoutModalClose.addEventListener('click', () => {
            checkoutModal.classList.remove('active');
        });
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('shipName').value;
            const email = document.getElementById('shipEmail').value;
            const orderNum = 'VB-ALC-' + Math.floor(10000 + Math.random() * 90000);

            showToast(
                '¡Pedido Confirmado!',
                `Gracias ${name}. Tu pedido #${orderNum} se está preparando en El Campello. Confirmación enviada a ${email}.`
            );

            cart = [];
            saveCart();
            checkoutModal.classList.remove('active');
            checkoutForm.reset();
        });
    }

    /* --- 6. FORMS HANDLER (WAITLIST & CONTACT) --- */
    const waitlistForm = document.getElementById('waitlistForm');
    if (waitlistForm) {
        waitlistForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast(
                '¡Inscrito en la Lista VIP!',
                'Te notificaremos por correo y WhatsApp con 48h de antelación para la próxima cata.'
            );
            waitlistForm.reset();
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showToast(
                '¡Mensaje Enviado!',
                'Gracias por contactar con Bodega Vicent Baeza. Te responderemos en breve.'
            );
            contactForm.reset();
        });
    }

    /* --- 7. TOAST NOTIFICATION --- */
    const toast = document.getElementById('toastNotification');
    const toastTitle = document.getElementById('toastTitle');
    const toastMsg = document.getElementById('toastMsg');

    function showToast(title, message) {
        if (!toast) return;
        toastTitle.textContent = title;
        toastMsg.textContent = message;
        toast.classList.add('active');

        setTimeout(() => {
            toast.classList.remove('active');
        }, 5500);
    }

    /* --- 8. GLOBAL LIGHTBOX MODAL FOR FULLSCREEN IMAGES --- */
    let lightboxModal = document.querySelector('.lightbox-modal');
    if (!lightboxModal) {
        lightboxModal = document.createElement('div');
        lightboxModal.className = 'lightbox-modal';
        lightboxModal.innerHTML = `
            <button class="lightbox-close" aria-label="Cerrar">&times;</button>
            <button class="lightbox-nav lightbox-prev" aria-label="Anterior"><i class="ri-arrow-left-s-line"></i></button>
            <button class="lightbox-nav lightbox-next" aria-label="Siguiente"><i class="ri-arrow-right-s-line"></i></button>
            <div class="lightbox-wrapper">
                <img src="" alt="" class="lightbox-img">
                <div class="lightbox-caption"></div>
            </div>
        `;
        document.body.appendChild(lightboxModal);
    }

    const lightboxImg = lightboxModal.querySelector('.lightbox-img');
    const lightboxCaption = lightboxModal.querySelector('.lightbox-caption');
    const lightboxClose = lightboxModal.querySelector('.lightbox-close');
    const lightboxPrev = lightboxModal.querySelector('.lightbox-prev');
    const lightboxNext = lightboxModal.querySelector('.lightbox-next');

    let currentGallery = [];
    let currentIndex = 0;

    function updateLightboxImage(index) {
        if (!currentGallery.length) return;
        if (index < 0) index = currentGallery.length - 1;
        if (index >= currentGallery.length) index = 0;
        currentIndex = index;

        const item = currentGallery[currentIndex];
        lightboxImg.src = item.src;
        lightboxCaption.textContent = item.caption || item.alt || 'Bodega Vicent Baeza (El Campello)';
    }

    function openLightbox(imagesList, index) {
        currentGallery = imagesList;
        updateLightboxImage(index);
        lightboxModal.classList.add('active');
    }

    function closeLightbox() {
        lightboxModal.classList.remove('active');
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); updateLightboxImage(currentIndex - 1); });
    if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); updateLightboxImage(currentIndex + 1); });

    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal || e.target.classList.contains('lightbox-wrapper')) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!lightboxModal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') updateLightboxImage(currentIndex - 1);
        if (e.key === 'ArrowRight') updateLightboxImage(currentIndex + 1);
    });

    // Event Delegation for All Content Images
    document.body.addEventListener('click', (e) => {
        const targetImg = e.target.closest('.product-img-box img, .gallery-item img, .history-image-card img, .event-image img, img.lightboxable');
        if (!targetImg) return;

        const allPageImgs = Array.from(document.querySelectorAll('.product-img-box img, .gallery-item img, .history-image-card img, .event-image img, img.lightboxable'));

        const imagesList = allPageImgs.map(img => {
            let caption = img.alt || '';
            const card = img.closest('.product-card');
            if (card) {
                const title = card.querySelector('.product-title');
                const price = card.querySelector('.product-price');
                if (title && price) {
                    caption = `${title.textContent} — ${price.textContent}`;
                }
            }
            return { src: img.src, caption: caption, alt: img.alt };
        });

        const clickIndex = allPageImgs.indexOf(targetImg);
        openLightbox(imagesList, clickIndex >= 0 ? clickIndex : 0);
    });

});

