/**
 * CultureSquared - Products & Search Module (products.js)
 * Implements Step 7: Product Search & Product Detail Modal
 */

const DEFAULT_PRODUCTS = [
    {
        id: 'prod-1',
        name: 'CultureSquared Basic Black',
        price: 85000,
        category: "Men's BoardShorts",
        image: 'assets/shorts_1.png',
        description: 'Lightweight everyday streetwear boardshorts engineered for maximum comfort and durability.',
        stock: 50
    },
    {
        id: 'prod-2',
        name: 'CultureSquared Fatigue Short Black',
        price: 85000,
        category: "Men's Streetwear Shorts",
        image: 'assets/shorts_2.png',
        description: 'Signature streetwear fatigue shorts crafted from premium durable cotton with utilitarian aesthetic.',
        stock: 50
    }
];

window.appProducts = [...DEFAULT_PRODUCTS];
window.selectedProduct = null;
window.selectedSize = '';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const searchInput = document.getElementById('productSearchInput');
    const categoryPills = document.querySelectorAll('.filter-pill');
    const productGrid = document.getElementById('productGrid');
    const noProductsFound = document.getElementById('noProductsFound');
    const navSearchBtn = document.querySelector('.search-icon');

    // Detail Modal Elements
    const detailModal = document.getElementById('productDetailModal');
    const closeDetailModal = document.getElementById('closeProductDetailModal');
    const detailImage = document.getElementById('detailProductImage');
    const detailCategory = document.getElementById('detailProductCategory');
    const detailTitle = document.getElementById('detailProductName');
    const detailPrice = document.getElementById('detailProductPrice');
    const detailDesc = document.getElementById('detailProductDesc');
    const detailSizePills = document.querySelectorAll('#detailSizeOptions .size-pill');
    const sizeErrorMsg = document.getElementById('sizeErrorMsg');
    const qtyInput = document.getElementById('detailQuantity');
    const qtyMinusBtn = document.getElementById('qtyMinusBtn');
    const qtyPlusBtn = document.getElementById('qtyPlusBtn');
    const detailAlert = document.getElementById('detailAlert');
    const detailBuyWaBtn = document.getElementById('detailBuyWaBtn');

    let currentCategory = 'all';
    let currentSearchTerm = '';

    // Format IDR Currency
    function formatIDR(amount) {
        return 'Rp. ' + Number(amount).toLocaleString('id-ID');
    }

    // --- Search & Filter Logic ---
    function filterProducts() {
        const cards = productGrid.querySelectorAll('.product-card');
        let visibleCount = 0;

        cards.forEach(card => {
            const name = (card.getAttribute('data-name') || '').toLowerCase();
            const category = card.getAttribute('data-category') || '';

            const matchesCategory = (currentCategory === 'all' || category === currentCategory);
            const matchesSearch = name.includes(currentSearchTerm) || category.toLowerCase().includes(currentSearchTerm);

            if (matchesCategory && matchesSearch) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (noProductsFound) {
            noProductsFound.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    }

    // Search Input Listener
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.trim().toLowerCase();
            filterProducts();
        });
    }

    // Category Pills Listener
    categoryPills.forEach(pill => {
        pill.addEventListener('click', () => {
            categoryPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentCategory = pill.getAttribute('data-category');
            filterProducts();
        });
    });

    // Navbar Search Icon Scroll & Focus
    if (navSearchBtn) {
        navSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const shopSection = document.getElementById('shop');
            if (shopSection) {
                shopSection.scrollIntoView({ behavior: 'smooth' });
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 600);
                }
            }
        });
    }

    // --- Product Detail Modal Logic ---
    function openProductDetail(productId) {
        const product = window.appProducts.find(p => p.id === productId) || DEFAULT_PRODUCTS[0];
        window.selectedProduct = product;
        window.selectedSize = '';

        if (detailImage) detailImage.src = product.image;
        if (detailCategory) detailCategory.textContent = product.category;
        if (detailTitle) detailTitle.textContent = product.name;
        if (detailPrice) detailPrice.textContent = formatIDR(product.price);
        if (detailDesc) detailDesc.textContent = product.description;

        // Reset Size Selection
        detailSizePills.forEach(p => p.classList.remove('selected'));
        if (sizeErrorMsg) sizeErrorMsg.style.display = 'none';

        // Reset Quantity
        if (qtyInput) qtyInput.value = 1;

        // Clear Alerts
        if (detailAlert) {
            detailAlert.textContent = '';
            detailAlert.style.display = 'none';
        }

        // Update Wishlist button visual state if wishlist exists
        if (window.updateWishlistBtnState) {
            window.updateWishlistBtnState(product.id);
        }

        if (detailModal) {
            detailModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeProductDetail() {
        if (detailModal) {
            detailModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    window.openProductDetailModal = openProductDetail;
    window.closeProductDetailModal = closeProductDetail;

    // Attach Click Handlers to Product Cards (image & View Details button)
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('.btn-view-trigger');
        if (trigger) {
            e.preventDefault();
            const productId = trigger.getAttribute('data-id');
            openProductDetail(productId);
        }
    });

    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', closeProductDetail);
    }

    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) closeProductDetail();
        });
    }

    // Size Pills Selection
    detailSizePills.forEach(pill => {
        pill.addEventListener('click', () => {
            detailSizePills.forEach(p => p.classList.remove('selected'));
            pill.classList.add('selected');
            window.selectedSize = pill.getAttribute('data-size');
            if (sizeErrorMsg) sizeErrorMsg.style.display = 'none';
        });
    });

    // Quantity Increment / Decrement
    if (qtyMinusBtn && qtyInput) {
        qtyMinusBtn.addEventListener('click', () => {
            let current = parseInt(qtyInput.value) || 1;
            if (current > 1) {
                qtyInput.value = current - 1;
            }
        });
    }

    if (qtyPlusBtn && qtyInput) {
        qtyPlusBtn.addEventListener('click', () => {
            let current = parseInt(qtyInput.value) || 1;
            const max = window.selectedProduct?.stock || 50;
            if (current < max) {
                qtyInput.value = current + 1;
            }
        });
    }

    // WhatsApp Order from Detail Modal
    if (detailBuyWaBtn) {
        detailBuyWaBtn.addEventListener('click', () => {
            if (!window.selectedProduct) return;

            if (!window.selectedSize) {
                if (sizeErrorMsg) sizeErrorMsg.style.display = 'block';
                return;
            }

            const qty = parseInt(qtyInput.value) || 1;
            const waNumber = '62895322547470';
            let message = `Halo CultureSquared, saya tertarik untuk memesan:\n\n`;
            message += `*PRODUK*\n`;
            message += `- Item: ${window.selectedProduct.name}\n`;
            message += `- Size: ${window.selectedSize}\n`;
            message += `- Jumlah: ${qty} pcs\n`;
            message += `- Harga: ${formatIDR(window.selectedProduct.price * qty)}\n\n`;
            message += `Apakah stok masih tersedia?`;

            const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
        });
    }
});
