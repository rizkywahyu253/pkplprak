/**
 * CultureSquared - Wishlist Module (wishlist.js)
 * Implements Step 8: Wishlist functionality (view, add, remove, move to cart, persistent per user).
 */

window.userWishlist = [];

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const openWishlistBtn = document.getElementById('openWishlistBtn');
    const wishlistModal = document.getElementById('wishlistModal');
    const closeWishlistModal = document.getElementById('closeWishlistModal');
    const wishlistItemsList = document.getElementById('wishlistItemsList');
    const emptyWishlistState = document.getElementById('emptyWishlistState');
    const wishlistAlert = document.getElementById('wishlistAlert');
    const wishlistCountBadge = document.getElementById('wishlistCountBadge');
    const detailWishlistBtn = document.getElementById('addToWishlistBtn');
    const detailWishlistIcon = document.getElementById('wishlistIcon');
    const wishlistExploreBtn = document.getElementById('wishlistExploreBtn');

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

    // --- Badge & Button State Updates ---
    function updateWishlistBadge() {
        if (!wishlistCountBadge) return;
        const count = window.userWishlist.length;
        if (count > 0) {
            wishlistCountBadge.textContent = count;
            wishlistCountBadge.style.display = 'inline-flex';
        } else {
            wishlistCountBadge.style.display = 'none';
        }
    }

    function updateDetailWishlistBtn(productId) {
        if (!detailWishlistBtn || !detailWishlistIcon) return;
        const isWishlisted = window.userWishlist.some(item => item.product_id === productId);
        if (isWishlisted) {
            detailWishlistBtn.classList.add('active');
            detailWishlistIcon.textContent = '♥';
        } else {
            detailWishlistBtn.classList.remove('active');
            detailWishlistIcon.textContent = '♡';
        }
    }

    window.updateWishlistBtnState = updateDetailWishlistBtn;

    // --- Fetch Wishlist ---
    async function fetchWishlist() {
        if (!window.currentUser) {
            window.userWishlist = [];
            updateWishlistBadge();
            return;
        }

        if (client) {
            try {
                const { data, error } = await client
                    .from('wishlist')
                    .select('*')
                    .eq('user_id', window.currentUser.id);

                if (!error && data) {
                    window.userWishlist = data;
                } else {
                    // Fallback to local storage for persistence
                    loadLocalWishlist();
                }
            } catch (err) {
                console.warn('[CultureSquared] Wishlist DB fetch warning:', err);
                loadLocalWishlist();
            }
        } else {
            loadLocalWishlist();
        }

        updateWishlistBadge();
        if (window.selectedProduct) {
            updateDetailWishlistBtn(window.selectedProduct.id);
        }
    }

    function loadLocalWishlist() {
        if (!window.currentUser) return;
        try {
            const raw = localStorage.getItem(`cs_wishlist_${window.currentUser.id}`);
            window.userWishlist = raw ? JSON.parse(raw) : [];
        } catch (e) {
            window.userWishlist = [];
        }
    }

    function saveLocalWishlist() {
        if (!window.currentUser) return;
        try {
            localStorage.setItem(`cs_wishlist_${window.currentUser.id}`, JSON.stringify(window.userWishlist));
        } catch (e) {}
    }

    window.refreshWishlist = fetchWishlist;

    // --- Render Wishlist Modal ---
    function renderWishlist() {
        if (!wishlistItemsList) return;
        wishlistItemsList.innerHTML = '';
        clearAlert(wishlistAlert);

        if (!window.userWishlist || window.userWishlist.length === 0) {
            if (emptyWishlistState) emptyWishlistState.style.display = 'block';
            return;
        }

        if (emptyWishlistState) emptyWishlistState.style.display = 'none';

        window.userWishlist.forEach(item => {
            const product = (window.appProducts || []).find(p => p.id === item.product_id) || {
                id: item.product_id,
                name: 'CultureSquared Essential Short',
                price: 85000,
                category: 'Streetwear',
                image: 'assets/shorts_1.png'
            };

            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div class="item-row-media">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="item-row-details">
                    <h4 class="item-row-title">${product.name}</h4>
                    <p class="item-row-meta">${product.category}</p>
                    <p class="item-row-price">${formatIDR(product.price)}</p>
                </div>
                <div class="item-row-actions">
                    <button type="button" class="btn-item-action move" data-action="move" data-id="${product.id}">Move to Cart</button>
                    <button type="button" class="btn-item-action remove" data-action="remove" data-id="${product.id}">Remove</button>
                </div>
            `;
            wishlistItemsList.appendChild(row);
        });
    }

    // Open / Close Wishlist Modal
    function openWishlist() {
        if (!window.currentUser) {
            if (window.openLoginModal) {
                window.openLoginModal();
            }
            return;
        }

        renderWishlist();
        if (wishlistModal) {
            wishlistModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeWishlist() {
        if (wishlistModal) {
            wishlistModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    window.openWishlistModal = openWishlist;
    window.closeWishlistModal = closeWishlist;

    if (openWishlistBtn) {
        openWishlistBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openWishlist();
        });
    }

    if (closeWishlistModal) {
        closeWishlistModal.addEventListener('click', closeWishlist);
    }

    if (wishlistModal) {
        wishlistModal.addEventListener('click', (e) => {
            if (e.target === wishlistModal) closeWishlist();
        });
    }

    if (wishlistExploreBtn) {
        wishlistExploreBtn.addEventListener('click', () => {
            closeWishlist();
        });
    }

    // --- Add / Remove Wishlist Actions ---
    async function addToWishlist(productId) {
        if (!window.currentUser) {
            if (window.openLoginModal) window.openLoginModal();
            return;
        }

        // Prevent duplicates
        if (window.userWishlist.some(item => item.product_id === productId)) {
            return;
        }

        const newItem = {
            id: 'wl-' + Date.now(),
            user_id: window.currentUser.id,
            product_id: productId,
            created_at: new Date().toISOString()
        };

        window.userWishlist.push(newItem);
        saveLocalWishlist();
        updateWishlistBadge();
        updateDetailWishlistBtn(productId);

        if (client) {
            try {
                await client.from('wishlist').insert({
                    user_id: window.currentUser.id,
                    product_id: productId
                });
            } catch (err) {
                console.warn('[CultureSquared] Wishlist DB insert warning:', err);
            }
        }
    }

    async function removeFromWishlist(productId) {
        if (!window.currentUser) return;

        window.userWishlist = window.userWishlist.filter(item => item.product_id !== productId);
        saveLocalWishlist();
        updateWishlistBadge();
        updateDetailWishlistBtn(productId);
        renderWishlist();

        if (client) {
            try {
                await client.from('wishlist').delete()
                    .eq('user_id', window.currentUser.id)
                    .eq('product_id', productId);
            } catch (err) {
                console.warn('[CultureSquared] Wishlist DB delete warning:', err);
            }
        }
    }

    window.addToWishlist = addToWishlist;
    window.removeFromWishlist = removeFromWishlist;

    // Toggle Wishlist on Product Detail Button
    if (detailWishlistBtn) {
        detailWishlistBtn.addEventListener('click', () => {
            if (!window.currentUser) {
                if (window.openLoginModal) window.openLoginModal();
                return;
            }

            if (!window.selectedProduct) return;
            const productId = window.selectedProduct.id;
            const isWishlisted = window.userWishlist.some(item => item.product_id === productId);

            if (isWishlisted) {
                removeFromWishlist(productId);
            } else {
                addToWishlist(productId);
            }
        });
    }

    // Item Row Actions (Remove or Move to Cart)
    if (wishlistItemsList) {
        wishlistItemsList.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-item-action');
            if (!btn) return;

            const action = btn.getAttribute('data-action');
            const productId = btn.getAttribute('data-id');

            if (action === 'remove') {
                removeFromWishlist(productId);
            } else if (action === 'move') {
                // Move product to cart (defaults size to 'M' or triggers cart add)
                if (window.addToCart) {
                    window.addToCart(productId, 'M', 1);
                    removeFromWishlist(productId);
                    showAlert(wishlistAlert, 'Item moved to your shopping bag!', 'success');
                }
            }
        });
    }

    // Listen to Auth State changes to refresh wishlist
    if (client) {
        client.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchWishlist();
            } else {
                window.userWishlist = [];
                updateWishlistBadge();
            }
        });
    }
});
