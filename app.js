/* ==========================================
   BODEGA VICENT BAEZA - MULTI-PAGE SCRIPT
   ========================================== */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const PRODUCT_KEYS = {
        p1: { name: 'product_1_title', format: 'product_1_sub' },
        p2: { name: 'product_2_title', format: 'product_2_sub' },
        p3: { name: 'product_3_title', format: 'product_3_sub' },
        p4: { name: 'product_4_title', format: 'product_4_sub' },
        p5: { name: 'product_5_title', format: 'product_5_sub' },
        p6: { name: 'product_6_title', format: 'product_6_sub' },
        p7: { name: 'product_7_title', format: 'product_7_sub' },
        p8: { name: 'product_8_title', format: 'product_8_sub' }
    };

    const FREE_SHIPPING_THRESHOLD = 60;
    const STANDARD_SHIPPING_COST = 4.95;
    const CART_STORAGE_KEY = 'vicent_baeza_cart';

    const translate = (key, variables = {}) => (
        typeof window.t === 'function' ? window.t(key, variables) : key
    );
    const money = (value) => (
        typeof window.formatCurrency === 'function'
            ? window.formatCurrency(value)
            : `${Number(value || 0).toFixed(2)} €`
    );

    /* --- 1. Active navigation link --- */
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach((link) => {
        const linkPath = link.getAttribute('href');
        link.classList.toggle('active', linkPath === currentPath || (currentPath === '' && linkPath === 'index.html'));
    });

    /* --- 2. Mobile navigation --- */
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const mobileNavMedia = window.matchMedia('(max-width: 992px)');

    function updateMobileMenuAccessibility() {
        if (!mobileToggle || !navMenu) return;
        const open = navMenu.classList.contains('active');
        const hiddenOnMobile = mobileNavMedia.matches && !open;
        const label = translate(open ? 'menu_close_label' : 'menu_open_label');
        mobileToggle.setAttribute('aria-expanded', String(open));
        mobileToggle.setAttribute('aria-label', label);
        mobileToggle.setAttribute('title', label);
        navMenu.inert = hiddenOnMobile;
        if (hiddenOnMobile) {
            navMenu.setAttribute('inert', '');
            navMenu.setAttribute('aria-hidden', 'true');
        } else {
            navMenu.removeAttribute('inert');
            navMenu.removeAttribute('aria-hidden');
        }
        const icon = mobileToggle.querySelector('i');
        if (icon) icon.className = open ? 'ri-close-line' : 'ri-menu-3-line';
    }

    if (mobileToggle && navMenu) {
        mobileToggle.setAttribute('aria-controls', 'navMenu');
        updateMobileMenuAccessibility();
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            updateMobileMenuAccessibility();
        });
        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                updateMobileMenuAccessibility();
            });
        });
        if (typeof mobileNavMedia.addEventListener === 'function') {
            mobileNavMedia.addEventListener('change', updateMobileMenuAccessibility);
        } else {
            mobileNavMedia.addListener(updateMobileMenuAccessibility);
        }
    }

    const FOCUSABLE_SELECTOR = [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    function trapFocus(event, container) {
        if (event.key !== 'Tab' || !container) return;
        const focusable = Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
            .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
        if (!focusable.length) {
            event.preventDefault();
            container.focus();
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        } else if (!container.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        }
    }

    /* --- 3. Cart state and drawer --- */
    function loadCart() {
        try {
            const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
            if (!Array.isArray(stored)) return [];
            return stored
                .filter((item) => item && item.id && Number.isFinite(Number(item.price)))
                .map((item) => ({
                    id: String(item.id),
                    nameKey: item.nameKey || PRODUCT_KEYS[item.id]?.name || '',
                    formatKey: item.formatKey || PRODUCT_KEYS[item.id]?.format || '',
                    price: Number(item.price),
                    img: item.img || '',
                    quantity: Math.max(1, Number.parseInt(item.quantity, 10) || 1)
                }));
        } catch (error) {
            console.warn(translate('cart_storage_error'), error);
            return [];
        }
    }

    let cart = loadCart();

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

    function getItemName(item) {
        return item.nameKey ? translate(item.nameKey) : translate('product_unknown');
    }

    function getItemFormat(item) {
        return item.formatKey ? translate(item.formatKey) : '';
    }

    function saveCart() {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        updateCartUI();
    }

    function renderCartItems() {
        if (!cartItemsList) return;
        cartItemsList.replaceChildren();

        if (cart.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-cart-msg';
            empty.innerHTML = '<i class="ri-shopping-bag-line" aria-hidden="true"></i>';
            const text = document.createElement('p');
            text.textContent = translate('cart_empty');
            empty.appendChild(text);
            cartItemsList.appendChild(empty);
            return;
        }

        cart.forEach((item) => {
            const name = getItemName(item);
            const format = getItemFormat(item);
            const row = document.createElement('div');
            row.className = 'cart-item';
            row.dataset.id = item.id;

            const image = document.createElement('img');
            image.src = item.img;
            image.alt = name;
            image.className = 'cart-item-img';

            const info = document.createElement('div');
            info.className = 'cart-item-info';

            const nameElement = document.createElement('div');
            nameElement.className = 'cart-item-name';
            nameElement.textContent = name;

            const formatElement = document.createElement('div');
            formatElement.className = 'cart-item-format';
            formatElement.textContent = format;

            const priceElement = document.createElement('div');
            priceElement.className = 'cart-item-price';
            priceElement.textContent = money(item.price);

            const controls = document.createElement('div');
            controls.className = 'cart-item-qty-controls';

            const decrease = document.createElement('button');
            decrease.type = 'button';
            decrease.className = 'btn-cart-qty';
            decrease.dataset.action = 'decrease';
            decrease.textContent = '−';
            decrease.setAttribute('aria-label', translate('quantity_decrease', { product: name }));
            decrease.setAttribute('title', translate('quantity_decrease', { product: name }));

            const quantity = document.createElement('span');
            quantity.className = 'cart-item-quantity';
            quantity.textContent = String(item.quantity);
            quantity.setAttribute('aria-label', translate('quantity_value', {
                product: name,
                quantity: item.quantity
            }));

            const increase = document.createElement('button');
            increase.type = 'button';
            increase.className = 'btn-cart-qty';
            increase.dataset.action = 'increase';
            increase.textContent = '+';
            increase.setAttribute('aria-label', translate('quantity_increase', { product: name }));
            increase.setAttribute('title', translate('quantity_increase', { product: name }));

            controls.append(decrease, quantity, increase);
            info.append(nameElement);
            if (format) info.append(formatElement);
            info.append(priceElement, controls);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'cart-item-remove';
            remove.dataset.action = 'remove';
            remove.setAttribute('aria-label', translate('remove_item'));
            remove.setAttribute('title', translate('remove_item'));
            remove.innerHTML = '<i class="ri-delete-bin-line" aria-hidden="true"></i>';

            row.append(image, info, remove);
            cartItemsList.appendChild(row);
        });
    }

    function updateCartUI() {
        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shippingCost = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? STANDARD_SHIPPING_COST : 0;
        const grandTotal = subtotal + shippingCost;

        if (cartBadgeCount) cartBadgeCount.textContent = String(totalCount);
        if (cartSubtotalElem) cartSubtotalElem.textContent = money(subtotal);
        if (cartShippingCostElem) {
            cartShippingCostElem.textContent = subtotal > 0 && shippingCost === 0
                ? translate('cart_free_shipping')
                : money(shippingCost);
        }
        if (cartGrandTotalElem) cartGrandTotalElem.textContent = money(grandTotal);
        if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;

        if (freeShippingText && shippingProgressFill) {
            if (subtotal >= FREE_SHIPPING_THRESHOLD) {
                freeShippingText.innerHTML = translate('cart_free_shipping_msg');
                shippingProgressFill.style.width = '100%';
            } else {
                const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
                const percentage = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
                freeShippingText.innerHTML = translate('cart_shipping_remaining', { amount: money(remaining) });
                shippingProgressFill.style.width = `${percentage}%`;
            }
        }

        renderCartItems();
        updateCheckoutTotal();
    }

    function changeItemQuantity(id, change) {
        const item = cart.find((entry) => entry.id === id);
        if (!item) return;
        item.quantity += change;
        if (item.quantity <= 0) cart = cart.filter((entry) => entry.id !== id);
        saveCart();
    }

    if (cartItemsList) {
        cartItemsList.addEventListener('click', (event) => {
            const button = event.target.closest('button[data-action]');
            const row = event.target.closest('.cart-item[data-id]');
            if (!button || !row) return;
            const id = row.dataset.id;
            if (button.dataset.action === 'increase') changeItemQuantity(id, 1);
            if (button.dataset.action === 'decrease') changeItemQuantity(id, -1);
            if (button.dataset.action === 'remove') {
                cart = cart.filter((entry) => entry.id !== id);
                saveCart();
            }
        });
    }

    function openCartDrawer() {
        if (!cartOverlay) return;
        cartOverlay.classList.add('active');
        cartOverlay.setAttribute('aria-hidden', 'false');
        cartCloseBtn?.focus();
    }

    function closeCartDrawer(restoreFocus = true) {
        if (!cartOverlay) return;
        const wasOpen = cartOverlay.classList.contains('active');
        cartOverlay.classList.remove('active');
        cartOverlay.setAttribute('aria-hidden', 'true');
        if (wasOpen && restoreFocus) cartTriggerBtn?.focus();
    }

    cartTriggerBtn?.addEventListener('click', openCartDrawer);
    cartCloseBtn?.addEventListener('click', closeCartDrawer);
    cartOverlay?.addEventListener('click', (event) => {
        if (event.target === cartOverlay) closeCartDrawer();
    });

    document.querySelectorAll('.add-to-cart-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const id = button.dataset.id;
            const price = Number.parseFloat(button.dataset.price);
            const img = button.dataset.img || '';
            const nameKey = button.dataset.nameKey || PRODUCT_KEYS[id]?.name || '';
            const formatKey = PRODUCT_KEYS[id]?.format || '';
            if (!id || !Number.isFinite(price)) return;

            const existing = cart.find((item) => item.id === id);
            if (existing) {
                existing.quantity += 1;
                existing.nameKey = nameKey || existing.nameKey;
                existing.formatKey = formatKey || existing.formatKey;
            } else {
                cart.push({ id, nameKey, formatKey, price, img, quantity: 1 });
            }

            saveCart();
            openCartDrawer();
            showToast('toast_added_title', 'toast_added_msg', {}, { product: nameKey });
        });
    });

    /* --- 4. Store search, filtering and sorting --- */
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productGrid = document.getElementById('productGrid');
    const productCards = Array.from(document.querySelectorAll('#productGrid .product-card'));
    let noResultsMessage = document.getElementById('shopNoResults');
    let activeCategory = 'all';

    if (productGrid && !noResultsMessage) {
        noResultsMessage = document.createElement('p');
        noResultsMessage.id = 'shopNoResults';
        noResultsMessage.className = 'shop-no-results';
        noResultsMessage.setAttribute('role', 'status');
        noResultsMessage.hidden = true;
        productGrid.insertAdjacentElement('afterend', noResultsMessage);
    }

    function filterAndSortProducts() {
        if (!productGrid || productCards.length === 0) return;
        const searchTerm = (searchInput?.value || '').toLocaleLowerCase().trim();
        const sortValue = sortSelect?.value || 'featured';
        const language = typeof window.getCurrentLang === 'function' ? window.getCurrentLang() : 'es';

        const visibleCards = productCards.filter((card) => {
            const category = card.dataset.category || '';
            const searchable = [
                card.querySelector('.product-title')?.textContent,
                card.querySelector('.product-sub')?.textContent,
                card.querySelector('.product-desc')?.textContent
            ].filter(Boolean).join(' ').toLocaleLowerCase();
            return (activeCategory === 'all' || category.split(/\s+/).includes(activeCategory))
                && searchable.includes(searchTerm);
        });

        if (sortValue === 'price-asc') {
            visibleCards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
        } else if (sortValue === 'price-desc') {
            visibleCards.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
        } else if (sortValue === 'name-asc') {
            visibleCards.sort((a, b) => (
                (a.querySelector('.product-title')?.textContent || '')
                    .localeCompare(b.querySelector('.product-title')?.textContent || '', language)
            ));
        } else {
            visibleCards.sort((a, b) => productCards.indexOf(a) - productCards.indexOf(b));
        }

        productCards.forEach((card) => { card.style.display = 'none'; });
        visibleCards.forEach((card) => {
            productGrid.appendChild(card);
            card.style.display = 'flex';
            card.style.opacity = '1';
        });

        if (noResultsMessage) {
            noResultsMessage.textContent = translate('shop_no_results');
            noResultsMessage.hidden = visibleCards.length > 0;
        }
    }

    searchInput?.addEventListener('input', filterAndSortProducts);
    sortSelect?.addEventListener('change', filterAndSortProducts);
    filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
            filterButtons.forEach((item) => item.classList.remove('active'));
            button.classList.add('active');
            activeCategory = button.dataset.category || 'all';
            filterAndSortProducts();
        });
    });

    /* --- 5. Checkout modal (demonstration only) --- */
    const checkoutModal = document.getElementById('checkoutModal');
    const checkoutModalClose = document.getElementById('checkoutModalClose');
    const checkoutForm = document.getElementById('checkoutForm');
    const modalFinalTotal = document.getElementById('modalFinalTotal');

    function updateCheckoutTotal() {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? STANDARD_SHIPPING_COST : 0;
        if (modalFinalTotal) modalFinalTotal.textContent = money(subtotal + shipping);
    }

    function closeCheckoutModal(restoreFocus = true) {
        if (!checkoutModal) return;
        const wasOpen = checkoutModal.classList.contains('active');
        checkoutModal.classList.remove('active');
        checkoutModal.setAttribute('aria-hidden', 'true');
        if (wasOpen && restoreFocus) cartTriggerBtn?.focus();
    }

    checkoutBtn?.addEventListener('click', () => {
        closeCartDrawer(false);
        updateCheckoutTotal();
        if (checkoutModal) {
            checkoutModal.classList.add('active');
            checkoutModal.setAttribute('aria-hidden', 'false');
            checkoutModalClose?.focus();
        }
    });

    checkoutModalClose?.addEventListener('click', closeCheckoutModal);
    checkoutModal?.addEventListener('click', (event) => {
        if (event.target === checkoutModal) closeCheckoutModal();
    });

    checkoutForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const name = document.getElementById('shipName')?.value || '';
        const email = document.getElementById('shipEmail')?.value || '';
        const order = `VB-ALC-${Math.floor(10000 + Math.random() * 90000)}`;

        showToast('toast_order_title', 'toast_order_msg', { name, order, email });

        cart = [];
        saveCart();
        closeCheckoutModal();
        checkoutForm.reset();
    });

    /* --- 6. Demonstration forms --- */
    const waitlistForm = document.getElementById('waitlistForm');
    waitlistForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        showToast('toast_waitlist_title', 'toast_waitlist_msg');
        waitlistForm.reset();
    });

    const contactForm = document.getElementById('contactForm');
    contactForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        showToast('toast_contact_title', 'toast_contact_msg');
        contactForm.reset();
    });

    /* --- 7. Localized form validation --- */
    function setLocalizedValidationMessage(field) {
        if (!(field instanceof HTMLInputElement
            || field instanceof HTMLTextAreaElement
            || field instanceof HTMLSelectElement)) return;

        field.setCustomValidity('');
        if (field.validity.valid) {
            field.removeAttribute('aria-invalid');
            return;
        }

        let key = 'validation_invalid';
        if (field.validity.valueMissing) key = 'validation_required';
        else if (field.validity.typeMismatch && field.type === 'email') key = 'validation_email';
        field.setCustomValidity(translate(key));
        field.setAttribute('aria-invalid', 'true');
    }

    document.addEventListener('invalid', (event) => {
        setLocalizedValidationMessage(event.target);
    }, true);

    document.addEventListener('input', (event) => {
        if (typeof event.target.setCustomValidity !== 'function') return;
        event.target.setCustomValidity('');
        event.target.removeAttribute('aria-invalid');
    });

    document.addEventListener('change', (event) => {
        if (typeof event.target.setCustomValidity !== 'function') return;
        event.target.setCustomValidity('');
        event.target.removeAttribute('aria-invalid');
    });

    /* --- 8. Toast notification --- */
    const toast = document.getElementById('toastNotification');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMsg');
    let toastTimer;
    let activeToast = null;

    function renderActiveToast() {
        if (!activeToast || !toastTitle || !toastMessage) return;
        const translatedVariables = Object.fromEntries(
            Object.entries(activeToast.variableKeys)
                .map(([name, key]) => [name, translate(key)])
        );
        const variables = { ...translatedVariables, ...activeToast.variables };
        toastTitle.textContent = translate(activeToast.titleKey, variables);
        toastMessage.textContent = translate(activeToast.messageKey, variables);
    }

    function showToast(titleKey, messageKey, variables = {}, variableKeys = {}) {
        if (!toast || !toastTitle || !toastMessage) return;
        window.clearTimeout(toastTimer);
        activeToast = { titleKey, messageKey, variables, variableKeys };
        renderActiveToast();
        toast.setAttribute('aria-hidden', 'false');
        toast.classList.add('active');
        toastTimer = window.setTimeout(() => {
            toast.classList.remove('active');
            toast.setAttribute('aria-hidden', 'true');
            activeToast = null;
            toastTitle.textContent = '';
            toastMessage.textContent = '';
        }, 5500);
    }

    /* --- 9. Global image lightbox --- */
    let lightboxModal = document.querySelector('.lightbox-modal');
    if (!lightboxModal) {
        lightboxModal = document.createElement('div');
        lightboxModal.className = 'lightbox-modal';
        lightboxModal.setAttribute('role', 'dialog');
        lightboxModal.setAttribute('aria-modal', 'true');
        lightboxModal.setAttribute('aria-hidden', 'true');
        lightboxModal.innerHTML = `
            <button type="button" class="lightbox-close">&times;</button>
            <button type="button" class="lightbox-nav lightbox-prev"><i class="ri-arrow-left-s-line" aria-hidden="true"></i></button>
            <button type="button" class="lightbox-nav lightbox-next"><i class="ri-arrow-right-s-line" aria-hidden="true"></i></button>
            <div class="lightbox-wrapper">
                <img src="" alt="" class="lightbox-img">
                <div class="lightbox-caption" aria-live="polite"></div>
                <div class="lightbox-counter"></div>
            </div>`;
        document.body.appendChild(lightboxModal);
    }

    const LIGHTBOX_TRIGGER_SELECTOR = '.product-img-box img, .gallery-item img, .history-image-card img, .event-image img, img.lightboxable';
    const lightboxImg = lightboxModal.querySelector('.lightbox-img');
    const lightboxCaption = lightboxModal.querySelector('.lightbox-caption');
    const lightboxCounter = lightboxModal.querySelector('.lightbox-counter');
    const lightboxClose = lightboxModal.querySelector('.lightbox-close');
    const lightboxPrev = lightboxModal.querySelector('.lightbox-prev');
    const lightboxNext = lightboxModal.querySelector('.lightbox-next');
    let currentGallery = [];
    let currentIndex = 0;
    let lastLightboxTrigger = null;

    function getLightboxCaption(image) {
        let caption = image?.alt || translate('lightbox_default_caption');
        const card = image?.closest('.product-card');
        if (card) {
            const title = card.querySelector('.product-title')?.textContent;
            const price = card.querySelector('.product-price')?.textContent;
            if (title && price) caption = `${title} — ${price}`;
        }
        return caption;
    }

    function updateLightboxLabels() {
        const dialogLabel = translate('lightbox_dialog_label');
        lightboxModal.setAttribute('aria-label', dialogLabel);
        [
            [lightboxClose, 'lightbox_close_label'],
            [lightboxPrev, 'lightbox_prev_label'],
            [lightboxNext, 'lightbox_next_label']
        ].forEach(([control, key]) => {
            const label = translate(key);
            control?.setAttribute('aria-label', label);
            control?.setAttribute('title', label);
        });

        document.querySelectorAll(LIGHTBOX_TRIGGER_SELECTOR).forEach((image) => {
            const label = translate('lightbox_open_label', {
                description: getLightboxCaption(image)
            });
            image.setAttribute('role', 'button');
            image.setAttribute('tabindex', '0');
            image.setAttribute('aria-label', label);
            image.setAttribute('title', label);
        });
    }

    function updateLightboxImage(index) {
        if (!currentGallery.length || !lightboxImg || !lightboxCaption) return;
        currentIndex = (index + currentGallery.length) % currentGallery.length;
        const sourceImage = currentGallery[currentIndex];
        const caption = getLightboxCaption(sourceImage);
        lightboxImg.src = sourceImage.currentSrc || sourceImage.src;
        lightboxImg.alt = sourceImage.alt || translate('lightbox_default_caption');
        lightboxCaption.textContent = caption;
        if (lightboxCounter) {
            lightboxCounter.textContent = translate('lightbox_counter', {
                current: currentIndex + 1,
                total: currentGallery.length
            });
        }
    }

    function closeLightbox(restoreFocus = true) {
        if (!lightboxModal.classList.contains('active')) return;
        lightboxModal.classList.remove('active');
        lightboxModal.setAttribute('aria-hidden', 'true');
        if (restoreFocus) lastLightboxTrigger?.focus();
    }

    function openLightbox(images, index) {
        currentGallery = images;
        lastLightboxTrigger = images[index] || null;
        updateLightboxImage(index);
        lightboxModal.classList.add('active');
        lightboxModal.setAttribute('aria-hidden', 'false');
        lightboxClose?.focus();
    }

    function openLightboxFromImage(targetImage) {
        const allImages = Array.from(document.querySelectorAll(LIGHTBOX_TRIGGER_SELECTOR));
        openLightbox(allImages, Math.max(0, allImages.indexOf(targetImage)));
    }

    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', (event) => {
        event.stopPropagation();
        updateLightboxImage(currentIndex - 1);
    });
    lightboxNext?.addEventListener('click', (event) => {
        event.stopPropagation();
        updateLightboxImage(currentIndex + 1);
    });
    lightboxModal.addEventListener('click', (event) => {
        if (event.target === lightboxModal || event.target.classList.contains('lightbox-wrapper')) closeLightbox();
    });

    document.body.addEventListener('click', (event) => {
        const targetImage = event.target.closest(LIGHTBOX_TRIGGER_SELECTOR);
        if (!targetImage) return;
        openLightboxFromImage(targetImage);
    });

    document.addEventListener('keydown', (event) => {
        const targetImage = event.target.matches?.(LIGHTBOX_TRIGGER_SELECTOR) ? event.target : null;
        if (targetImage && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openLightboxFromImage(targetImage);
            return;
        }

        if (event.key === 'Escape') {
            if (lightboxModal.classList.contains('active')) {
                closeLightbox();
            } else if (checkoutModal?.classList.contains('active')) {
                closeCheckoutModal();
            } else if (cartOverlay?.classList.contains('active')) {
                closeCartDrawer();
            } else if (navMenu?.classList.contains('active')) {
                navMenu.classList.remove('active');
                updateMobileMenuAccessibility();
                mobileToggle?.focus();
            }
            return;
        }

        const activeDialog = lightboxModal.classList.contains('active')
            ? lightboxModal
            : checkoutModal?.classList.contains('active')
                ? checkoutModal
                : cartOverlay?.classList.contains('active')
                    ? cartOverlay
                    : null;
        trapFocus(event, activeDialog);

        if (!lightboxModal.classList.contains('active')) return;
        if (event.key === 'ArrowLeft') updateLightboxImage(currentIndex - 1);
        if (event.key === 'ArrowRight') updateLightboxImage(currentIndex + 1);
    });

    /* --- 10. Refresh dynamic interface after changing language --- */
    window.addEventListener('languageChanged', () => {
        document.querySelectorAll('input, textarea, select').forEach((field) => {
            field.setCustomValidity('');
            field.removeAttribute('aria-invalid');
        });
        updateMobileMenuAccessibility();
        updateCartUI();
        filterAndSortProducts();
        renderActiveToast();
        updateLightboxLabels();
        if (lightboxModal.classList.contains('active')) updateLightboxImage(currentIndex);
    });

    updateCartUI();
    filterAndSortProducts();
    updateLightboxLabels();
});
