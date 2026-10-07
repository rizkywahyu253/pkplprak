document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');

    // Sticky Navbar shadow on scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // --- WhatsApp Modal Logic ---
    const waModal = document.getElementById('waModal');
    const orderButtons = document.querySelectorAll('.btn-order');
    const closeModal = document.querySelector('.close-modal');
    const orderForm = document.getElementById('orderForm');

    // Modal Text Elements
    const modalProductName = document.getElementById('modalProductName');
    const modalProductPrice = document.getElementById('modalProductPrice');

    let currentProduct = '';
    let currentPrice = '';

    // Open Modal
    orderButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            currentProduct = button.getAttribute('data-product');
            currentPrice = button.getAttribute('data-price');

            modalProductName.textContent = currentProduct;
            modalProductPrice.textContent = currentPrice;

            waModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        });
    });

    // Close Modal
    closeModal.addEventListener('click', () => {
        waModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Close on clicking outside
    waModal.addEventListener('click', (e) => {
        if (e.target === waModal) {
            waModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Handle Form Submission -> Generate WA Link
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const size = document.getElementById('size').value;
        const name = document.getElementById('customerName').value;
        const address = document.getElementById('address').value;

        // Target WhatsApp Number (Format: 628...)
        const waNumber = '62895322547470';

        // Build the message
        let message = `Halo CultureSquared, saya ingin melakukan pemesanan:\n\n`;
        message += `*PRODUK*\n`;
        message += `- Item: ${currentProduct}\n`;
        message += `- Size: ${size}\n`;
        message += `- Harga: IDR ${currentPrice}\n\n`;
        message += `*DATA PEMESAN*\n`;
        message += `- Nama: ${name}\n`;
        message += `- Alamat:\n  ${address}\n\n`;
        message += `Apakah stok masih tersedia?`;

        // Encode URL and redirect
        const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
        window.open(waUrl, '_blank');

        // Close modal and reset form
        waModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        orderForm.reset();
    });

});
