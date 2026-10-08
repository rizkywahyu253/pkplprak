/**
 * CultureSquared - Shopping Cart Module (cart.js)
 * Implements Step 9: Shopping Cart (add, size selection, quantity control, subtotal, shipping, total, persistence).
 */

window.userCart = [];

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const openCartBtn = document.getElementById('openCartBtn');
    const cartModal = document.getElementById('cartModal');
    const closeCartModal = document.getElementById('closeCartModal');
    const cartItemsList = document.getElementById('cartItemsList');
    const emptyCartState = document.getElementById('emptyCartState');
    const cartSummarySection = document.getElementById('cartSummarySection');
    const cartSubtotalEl = document.getElementById('cartSubtotal');
    const cartShippingEl = document.getElementById('cartShipping');
    const cartTotalEl = document.getElementById('cartTotal');
    const cartCountBadge = document.getElementById('cartCountBadge');
    const cartAlert = document.getElementById('cartAlert');
    const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
    const cartExploreBtn = document.getElementById('cartExploreBtn');

    // Detail Modal Add to Cart Elements
    const detailAddToCartBtn = document.getElementById('addToCartBtn');
    const detailQtyInput = document.getElementById('detailQuantity');
    const sizeErrorMsg = document.getElementById('sizeErrorMsg');

    const client = window.supabaseClient;

    // Helper: Show Alert
    function showAlert(element, message, type = 'error') {
        if (!element) return;
        element.textContent = message;
        element.className = `auth-alert ${type}`;
        element.style.display = 'block';
    }

    function clearAlert(element) {
        if (!element) return;
        element.textContent = '';
        element.className = 'auth-alert';
        element.style.display = 'none';
    }

    function formatIDR(amount) {
        return 'Rp. ' + Number(amount).toLocaleString('id-ID');
    }

    // --- Badge Updates ---
    function updateCartBadge() {
        if (!cartCountBadge) return;
        const totalItems = window.userCart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
        if (totalItems > 0) {
            cartCountBadge.textContent = totalItems;
            cartCountBadge.style.display = 'inline-flex';
        } else {
            cartCountBadge.style.display = 'none';
        }
    }

    // --- Fetch Cart ---
    async function fetchCart() {
        if (!window.currentUser) {
            window.userCart = [];
            updateCartBadge();
            return;
        }

        if (client) {
            try {
                const { data, error } = await client
                    .from('cart')
                    .select('*')
                    .eq('user_id', window.currentUser.id);

                if (!error && data) {
                    if (data.length === 0) {
                        // Fallback to local storage if DB is empty (handles insert failures)
                        loadLocalCart();
                    } else {
                        window.userCart = data;
                        saveLocalCart();
                    }
                } else {
                    loadLocalCart();
                }
            } catch (err) {
                console.warn('[CultureSquared] Cart DB fetch warning:', err);
                loadLocalCart();
            }
        } else {
            loadLocalCart();
        }

        updateCartBadge();
    }

    function loadLocalCart() {
        if (!window.currentUser) return;
        try {
            const raw = localStorage.getItem(`cs_cart_${window.currentUser.id}`);
            window.userCart = raw ? JSON.parse(raw) : [];
        } catch (e) {
            window.userCart = [];
        }
    }

    function saveLocalCart() {
        if (!window.currentUser) return;
        try {
            localStorage.setItem(`cs_cart_${window.currentUser.id}`, JSON.stringify(window.userCart));
        } catch (e) {}
    }

    window.refreshCart = fetchCart;

    // --- Calculations ---
    function calculateCartTotals() {
        let subtotal = 0;
        window.userCart.forEach(item => {
            const product = (window.appProducts || []).find(p => p.id === item.product_id) || { price: 85000 };
            subtotal += (product.price * (Number(item.quantity) || 1));
        });

        // Free shipping for orders over 500.000 IDR
        const shippingFee = (subtotal >= 500000 || subtotal === 0) ? 0 : 20000;
        const total = subtotal + shippingFee;

        return { subtotal, shippingFee, total };
    }

    window.getCartTotals = calculateCartTotals;

    // --- Render Cart Modal ---
    function renderCart() {
        if (!cartItemsList) return;
        cartItemsList.innerHTML = '';
        clearAlert(cartAlert);

        if (!window.userCart || window.userCart.length === 0) {
            if (emptyCartState) emptyCartState.style.display = 'block';
            if (cartSummarySection) cartSummarySection.style.display = 'none';
            return;
        }

        if (emptyCartState) emptyCartState.style.display = 'none';
        if (cartSummarySection) cartSummarySection.style.display = 'block';

        const { subtotal, shippingFee, total } = calculateCartTotals();
        if (cartSubtotalEl) cartSubtotalEl.textContent = formatIDR(subtotal);
        if (cartShippingEl) cartShippingEl.textContent = shippingFee === 0 ? 'FREE' : formatIDR(shippingFee);
        if (cartTotalEl) cartTotalEl.textContent = formatIDR(total);

        window.userCart.forEach(item => {
            const product = (window.appProducts || []).find(p => p.id === item.product_id) || {
                id: item.product_id,
                name: 'CultureSquared Essential Short',
                price: 85000,
                category: 'Streetwear',
                image: 'assets/shorts_1.png'
            };

            const itemTotal = product.price * (Number(item.quantity) || 1);

            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div class="item-row-media">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="item-row-details">
                    <h4 class="item-row-title">${product.name}</h4>
                    <p class="item-row-meta">Size: <strong>${item.size}</strong></p>
                    <p class="item-row-price">${formatIDR(itemTotal)} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-secondary);">(${formatIDR(product.price)} each)</span></p>
                    <div class="cart-item-qty-row">
                        <button type="button" class="cart-qty-btn" data-action="decrease" data-id="${item.id}">-</button>
                        <span class="cart-qty-value">${item.quantity}</span>
                        <button type="button" class="cart-qty-btn" data-action="increase" data-id="${item.id}">+</button>
                    </div>
                </div>
                <div class="item-row-actions">
                    <button type="button" class="btn-item-action remove" data-action="remove" data-id="${item.id}">Remove</button>
                </div>
            `;
            cartItemsList.appendChild(row);
        });
    }

    // --- Modal Open / Close ---
    function openCart() {
        if (!window.currentUser) {
            if (window.openLoginModal) window.openLoginModal();
            return;
        }

        renderCart();
        if (cartModal) {
            cartModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCart() {
        if (cartModal) {
            cartModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    window.openCartModal = openCart;
    window.closeCartModal = closeCart;

    if (openCartBtn) {
        openCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openCart();
        });
    }

    if (closeCartModal) {
        closeCartModal.addEventListener('click', closeCart);
    }

    if (cartModal) {
        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) closeCart();
        });
    }

    if (cartExploreBtn) {
        cartExploreBtn.addEventListener('click', () => {
            closeCart();
        });
    }

    // --- Add to Cart Action ---
    async function addToCart(productId, size, quantity = 1) {
        if (!window.currentUser) {
            if (window.openLoginModal) window.openLoginModal();
            return;
        }

        let qty = Number(quantity) || 1;
        // EP/BVA Validasi Batas Bawah dan Input Non-Numeric
        if (qty < 1) qty = 1;

        const existingIndex = window.userCart.findIndex(
            item => item.product_id === productId && item.size === size
        );

        if (existingIndex > -1) {
            let newQty = window.userCart[existingIndex].quantity + qty;
            
            // EP/BVA Validasi Batas Atas: Max 5
            if (newQty > 5) {
                newQty = 5;
                showAlert(cartAlert, 'Maximum 5 items allowed per product for limited streetwear pieces.', 'error');
            } else {
                showAlert(cartAlert, 'Item added to your shopping bag!', 'success');
            }

            window.userCart[existingIndex].quantity = newQty;
            saveLocalCart();
            updateCartBadge();

            if (client) {
                try {
                    await client.from('cart').update({
                        quantity: window.userCart[existingIndex].quantity
                    }).eq('id', window.userCart[existingIndex].id);
                } catch (e) {}
            }
        } else {
            // EP/BVA Validasi Batas Atas untuk item baru
            if (qty > 5) {
                qty = 5;
                showAlert(cartAlert, 'Maximum 5 items allowed per product for limited streetwear pieces.', 'error');
            } else {
                showAlert(cartAlert, 'Item added to your shopping bag!', 'success');
            }

            const newItem = {
                id: 'cart-' + Date.now(),
                user_id: window.currentUser.id,
                product_id: productId,
                size: size,
                quantity: qty,
                created_at: new Date().toISOString()
            };

            window.userCart.push(newItem);
            saveLocalCart();
            updateCartBadge();

            if (client) {
                try {
                    await client.from('cart').insert({
                        user_id: window.currentUser.id,
                        product_id: productId,
                        size: size,
                        quantity: qty
                    });
                } catch (e) {}
            }
        }

        // Open cart to show updated state
        openCart();
    }

    window.addToCart = addToCart;

    // --- Update Quantity & Remove Actions ---
    async function updateQuantity(cartItemId, delta) {
        const item = window.userCart.find(i => i.id === cartItemId);
        if (!item) return;

        let newQty = item.quantity + delta;
        if (newQty <= 0) {
            await removeFromCart(cartItemId);
            return;
        }

        // EP/BVA Business Rule Validation: Max 5 per item
        if (newQty > 5) {
            if (window.showAlert && cartAlert) {
                window.showAlert(cartAlert, 'Maximum 5 items allowed per product for limited streetwear pieces.', 'error');
            }
            newQty = 5;
        } else {
            if (cartAlert) cartAlert.style.display = 'none'; // clear previous error
        }

        item.quantity = newQty;
        saveLocalCart();
        updateCartBadge();
        renderCart();

        if (client) {
            try {
                await client.from('cart').update({ quantity: newQty }).eq('id', cartItemId);
            } catch (e) {}
        }
    }

    async function removeFromCart(cartItemId) {
        window.userCart = window.userCart.filter(i => i.id !== cartItemId);
        saveLocalCart();
        updateCartBadge();
        renderCart();

        if (client) {
            try {
                await client.from('cart').delete().eq('id', cartItemId);
            } catch (e) {}
        }
    }

    window.removeFromCart = removeFromCart;

    // Cart Items Click Handler
    if (cartItemsList) {
        cartItemsList.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const cartItemId = btn.getAttribute('data-id');

            if (action === 'increase') {
                updateQuantity(cartItemId, 1);
            } else if (action === 'decrease') {
                updateQuantity(cartItemId, -1);
            } else if (action === 'remove') {
                removeFromCart(cartItemId);
            }
        });
    }

    // Detail Modal Add to Cart Button Listener
    if (detailAddToCartBtn) {
        detailAddToCartBtn.addEventListener('click', () => {
            if (!window.currentUser) {
                if (window.openLoginModal) window.openLoginModal();
                return;
            }

            if (!window.selectedProduct) return;

            if (!window.selectedSize) {
                if (sizeErrorMsg) sizeErrorMsg.style.display = 'block';
                return;
            }

            const qty = parseInt(detailQtyInput.value) || 1;
            if (window.closeProductDetailModal) {
                window.closeProductDetailModal();
            }
            addToCart(window.selectedProduct.id, window.selectedSize, qty);
        });
    }

    // Proceed to Checkout Button Listener
    if (proceedCheckoutBtn) {
        proceedCheckoutBtn.addEventListener('click', () => {
            if (window.userCart.length === 0) return;
            closeCart();
            if (window.openCheckoutModal) {
                window.openCheckoutModal();
            }
        });
    }

    // Refresh Cart on Auth State Changes
    if (client) {
        client.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchCart();
            } else {
                window.userCart = [];
                updateCartBadge();
            }
        });
    }
});
