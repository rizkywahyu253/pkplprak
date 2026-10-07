/**
 * CultureSquared - Checkout Module (checkout.js)
 * Implements Step 10: Checkout order creation flow (orders & order_items creation, cart clearance, confirmation).
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const checkoutModal = document.getElementById('checkoutModal');
    const closeCheckoutModal = document.getElementById('closeCheckoutModal');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutAlert = document.getElementById('checkoutAlert');
    const placeOrderBtn = document.getElementById('placeOrderBtn');

    // Inputs
    const recipientNameInput = document.getElementById('checkoutRecipientName');
    const phoneInput = document.getElementById('checkoutPhone');
    const addressInput = document.getElementById('checkoutAddress');
    const cityInput = document.getElementById('checkoutCity');
    const postalCodeInput = document.getElementById('checkoutPostalCode');

    // Review Summary Elements
    const checkoutItemsList = document.getElementById('checkoutItemsList');
    const checkoutSubtotalEl = document.getElementById('checkoutSubtotal');
    const checkoutShippingEl = document.getElementById('checkoutShipping');
    const checkoutTotalEl = document.getElementById('checkoutTotal');

    // Confirmation Elements
    const confirmationModal = document.getElementById('orderConfirmationModal');
    const closeConfirmationModal = document.getElementById('closeConfirmationModal');
    const confirmedOrderIdEl = document.getElementById('confirmedOrderId');
    const confirmedOrderStatusEl = document.getElementById('confirmedOrderStatus');
    const confirmedOrderTotalEl = document.getElementById('confirmedOrderTotal');
    const confirmedOrderAddressEl = document.getElementById('confirmedOrderAddress');
    const confirmationOrdersBtn = document.getElementById('confirmationOrdersBtn');
    const confirmationContinueBtn = document.getElementById('confirmationContinueBtn');

    const client = window.supabaseClient;

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

    // --- Open Checkout ---
    function openCheckout() {
        if (!window.currentUser) {
            if (window.openLoginModal) window.openLoginModal();
            return;
        }

        if (!window.userCart || window.userCart.length === 0) {
            if (window.openCartModal) window.openCartModal();
            return;
        }

        clearAlert(checkoutAlert);

        // Prepopulate with user profile details
        if (recipientNameInput && !recipientNameInput.value) {
            recipientNameInput.value = window.currentUser.user_metadata?.name || '';
        }
        if (phoneInput && !phoneInput.value) {
            phoneInput.value = window.currentUser.user_metadata?.phone || '';
        }

        // Fetch saved address from profiles if available
        if (client) {
            client.from('profiles').select('*').eq('id', window.currentUser.id).single()
                .then(({ data }) => {
                    if (data) {
                        if (data.name && recipientNameInput && !recipientNameInput.value) recipientNameInput.value = data.name;
                        if (data.phone && phoneInput && !phoneInput.value) phoneInput.value = data.phone;
                        if (data.address && addressInput && !addressInput.value) addressInput.value = data.address;
                    }
                }).catch(e => {});
        }

        // Render checkout items review
        if (checkoutItemsList) {
            checkoutItemsList.innerHTML = '';
            window.userCart.forEach(item => {
                const product = (window.appProducts || []).find(p => p.id === item.product_id) || {
                    name: 'CultureSquared Product',
                    price: 85000,
                    image: 'assets/shorts_1.png'
                };

                const itemRow = document.createElement('div');
                itemRow.className = 'item-row';
                itemRow.style.paddingBottom = '0.75rem';
                itemRow.innerHTML = `
                    <div class="item-row-media" style="width: 50px; height: 60px;">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="item-row-details">
                        <h4 class="item-row-title" style="font-size: 0.85rem;">${product.name}</h4>
                        <p class="item-row-meta" style="font-size: 0.8rem;">Size: ${item.size} &times; ${item.quantity}</p>
                    </div>
                    <div class="item-row-price" style="font-size: 0.9rem;">
                        ${formatIDR(product.price * item.quantity)}
                    </div>
                `;
                checkoutItemsList.appendChild(itemRow);
            });
        }

        // Update totals
        if (window.getCartTotals) {
            const { subtotal, shippingFee, total } = window.getCartTotals();
            if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = formatIDR(subtotal);
            if (checkoutShippingEl) checkoutShippingEl.textContent = shippingFee === 0 ? 'FREE' : formatIDR(shippingFee);
            if (checkoutTotalEl) checkoutTotalEl.textContent = formatIDR(total);
        }

        if (checkoutModal) {
            checkoutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCheckout() {
        if (checkoutModal) {
            checkoutModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    window.openCheckoutModal = openCheckout;
    window.closeCheckoutModal = closeCheckout;

    if (closeCheckoutModal) {
        closeCheckoutModal.addEventListener('click', closeCheckout);
    }

    if (checkoutModal) {
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) closeCheckout();
        });
    }

    // --- Place Order Submit Handler ---
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert(checkoutAlert);

            if (!window.currentUser) {
                showAlert(checkoutAlert, 'Please log in to complete your checkout.', 'error');
                return;
            }

            const recipient = recipientNameInput.value.trim();
            const phone = phoneInput.value.trim();
            const address = addressInput.value.trim();
            const city = cityInput.value.trim();
            const postalCode = postalCodeInput.value.trim();

            if (!recipient || !phone || !address || !city || !postalCode) {
                showAlert(checkoutAlert, 'Please fill in all delivery details completely.', 'error');
                return;
            }

            if (!window.userCart || window.userCart.length === 0) {
                showAlert(checkoutAlert, 'Your cart is empty. Please add items to order.', 'error');
                return;
            }

            const { total } = window.getCartTotals ? window.getCartTotals() : { total: 85000 };
            const fullAddress = `${recipient} (${phone}) - ${address}, ${city}, ${postalCode}`;

            placeOrderBtn.disabled = true;
            const originalText = placeOrderBtn.textContent;
            placeOrderBtn.textContent = 'Placing Order...';

            const generatedOrderId = 'cs-' + Math.random().toString(36).substring(2, 9).toUpperCase();
            let newOrder = {
                id: generatedOrderId,
                user_id: window.currentUser.id,
                total: total,
                status: 'Pending',
                shipping_address: fullAddress,
                created_at: new Date().toISOString()
            };

            const orderItemsData = window.userCart.map(item => {
                const prod = (window.appProducts || []).find(p => p.id === item.product_id) || { price: 85000 };
                return {
                    id: 'item-' + Math.random().toString(36).substring(2, 9),
                    order_id: generatedOrderId,
                    product_id: item.product_id,
                    size: item.size,
                    quantity: item.quantity,
                    price: prod.price
                };
            });

            try {
                // Attempt Supabase Insert
                if (client) {
                    try {
                        const { data: dbOrder, error: orderErr } = await client
                            .from('orders')
                            .insert({
                                user_id: window.currentUser.id,
                                total: total,
                                status: 'Pending',
                                shipping_address: fullAddress
                            })
                            .select()
                            .single();

                        if (!orderErr && dbOrder) {
                            newOrder.id = dbOrder.id;
                            const itemsToInsert = window.userCart.map(item => {
                                const prod = (window.appProducts || []).find(p => p.id === item.product_id) || { price: 85000 };
                                return {
                                    order_id: dbOrder.id,
                                    product_id: item.product_id,
                                    size: item.size,
                                    quantity: item.quantity,
                                    price: prod.price
                                };
                            });
                            await client.from('order_items').insert(itemsToInsert);

                            // Clear DB Cart
                            await client.from('cart').delete().eq('user_id', window.currentUser.id);
                        }
                    } catch (dbErr) {
                        console.warn('[CultureSquared] Supabase order insert notice:', dbErr);
                    }
                }

                // Fallback / Local Orders store
                if (!window.userOrders) window.userOrders = [];
                newOrder.items = orderItemsData;
                window.userOrders.unshift(newOrder);

                try {
                    localStorage.setItem(`cs_orders_${window.currentUser.id}`, JSON.stringify(window.userOrders));
                } catch (e) {}

                // Clear Local Cart
                window.userCart = [];
                try {
                    localStorage.removeItem(`cs_cart_${window.currentUser.id}`);
                } catch (e) {}

                // Update Badges
                const cartBadge = document.getElementById('cartCountBadge');
                if (cartBadge) cartBadge.style.display = 'none';

                // Close Checkout and Show Confirmation
                closeCheckout();
                checkoutForm.reset();

                if (confirmedOrderIdEl) confirmedOrderIdEl.textContent = '#' + (newOrder.id.length > 8 ? newOrder.id.substring(0, 8) : newOrder.id);
                if (confirmedOrderStatusEl) confirmedOrderStatusEl.textContent = newOrder.status;
                if (confirmedOrderTotalEl) confirmedOrderTotalEl.textContent = formatIDR(newOrder.total);
                if (confirmedOrderAddressEl) confirmedOrderAddressEl.textContent = fullAddress;

                if (confirmationModal) {
                    confirmationModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }

                if (window.fetchOrders) {
                    window.fetchOrders();
                }

            } catch (err) {
                console.error('[CultureSquared] Checkout error:', err);
                showAlert(checkoutAlert, 'An unexpected error occurred while placing order.', 'error');
            } finally {
                placeOrderBtn.disabled = false;
                placeOrderBtn.textContent = originalText;
            }
        });
    }

    // Confirmation Modal Actions
    function closeConfirmation() {
        if (confirmationModal) {
            confirmationModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    if (closeConfirmationModal) {
        closeConfirmationModal.addEventListener('click', closeConfirmation);
    }

    if (confirmationContinueBtn) {
        confirmationContinueBtn.addEventListener('click', closeConfirmation);
    }

    if (confirmationOrdersBtn) {
        confirmationOrdersBtn.addEventListener('click', () => {
            closeConfirmation();
            if (window.openOrdersModal) {
                window.openOrdersModal();
            }
        });
    }
});
