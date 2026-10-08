document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const ordersModal = document.getElementById('ordersModal');
    const closeOrdersModalBtn = document.getElementById('closeOrdersModal');
    const ordersItemsList = document.getElementById('ordersItemsList');
    const emptyOrdersState = document.getElementById('emptyOrdersState');
    const ordersAlert = document.getElementById('ordersAlert');
    const ordersExploreBtn = document.getElementById('ordersExploreBtn');
    const profileOrdersLink = document.getElementById('profileOrdersLink');

    const client = window.supabaseClient;
    window.userOrders = []; // store orders

    // --- Format Helper ---
    function formatIDR(amount) {
        return 'Rp. ' + Number(amount).toLocaleString('id-ID');
    }

    // --- Show Alert ---
    function showAlert(element, message, type = 'error') {
        if (!element) return;
        element.textContent = message;
        element.className = `auth-alert ${type}`;
        element.style.display = 'block';
    }

    // --- Fetch Orders (CRUD: READ) ---
    async function fetchOrders() {
        if (!window.currentUser) {
            window.userOrders = [];
            renderOrders();
            return;
        }

        try {
            if (client) {
                // Fetch from Supabase
                const { data, error } = await client
                    .from('orders')
                    .select('*')
                    .eq('user_id', window.currentUser.id)
                    .order('created_at', { ascending: false });
                
                if (error) throw error;
                window.userOrders = data || [];
            } else {
                // Fallback to local storage
                const local = localStorage.getItem(`cs_orders_${window.currentUser.id}`);
                if (local) window.userOrders = JSON.parse(local);
            }
        } catch (err) {
            console.error('[CultureSquared] Error fetching orders:', err);
        }

        renderOrders();
    }
    window.fetchOrders = fetchOrders;

    // --- Render Orders ---
    function renderOrders() {
        if (!ordersItemsList || !emptyOrdersState) return;

        ordersItemsList.innerHTML = '';

        if (!window.userOrders || window.userOrders.length === 0) {
            ordersItemsList.style.display = 'none';
            emptyOrdersState.style.display = 'block';
            return;
        }

        ordersItemsList.style.display = 'block';
        emptyOrdersState.style.display = 'none';

        window.userOrders.forEach(order => {
            const row = document.createElement('div');
            row.className = 'item-row';
            row.style.flexDirection = 'column';
            row.style.alignItems = 'flex-start';
            row.style.padding = '1rem';
            row.style.border = '1px solid var(--border-color)';
            row.style.borderRadius = 'var(--radius-md)';
            row.style.marginBottom = '1rem';

            // Determine status badge color
            let badgeClass = 'order-status-badge ';
            const stat = (order.status || 'Pending').toLowerCase();
            if (stat === 'pending') badgeClass += 'pending';
            else if (stat === 'shipped' || stat === 'completed' || stat === 'paid') badgeClass += 'completed';
            else badgeClass += 'cancelled'; // Default for cancelled or others

            // Format date
            const d = new Date(order.created_at);
            const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            row.innerHTML = `
                <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 0.5rem; align-items: center;">
                    <span style="font-weight: 700; font-size: 1rem;">Order #${order.id.split('-')[0]}...</span>
                    <span class="${badgeClass}" style="font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; text-transform: capitalize;">${order.status}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                    <div><strong>Date:</strong> ${dateStr}</div>
                    <div><strong>Total:</strong> ${formatIDR(order.total)}</div>
                    <div><strong>Address:</strong> ${order.shipping_address}</div>
                </div>
                ${stat === 'pending' ? `
                    <div style="margin-top: 0.5rem; width: 100%;">
                        <button type="button" class="btn-item-action remove btn-cancel-order" data-id="${order.id}" style="padding: 6px 12px; border: 1px solid #b91c1c; border-radius: 4px;">Cancel Order</button>
                    </div>
                ` : ''}
            `;
            ordersItemsList.appendChild(row);
        });
    }

    // --- Order Status Workflow (CRUD: UPDATE) ---
    // Simulates changing the status of an order
    async function updateOrderStatus(orderId, newStatus) {
        if (!window.currentUser) return;

        try {
            // Update Supabase
            if (client) {
                const { error } = await client
                    .from('orders')
                    .update({ status: newStatus })
                    .eq('id', orderId)
                    .eq('user_id', window.currentUser.id);

                if (error) throw error;
            }

            // Update Local State
            const orderIndex = window.userOrders.findIndex(o => o.id === orderId);
            if (orderIndex > -1) {
                window.userOrders[orderIndex].status = newStatus;
                
                // Save fallback
                localStorage.setItem(`cs_orders_${window.currentUser.id}`, JSON.stringify(window.userOrders));
            }

            // UI Feedback
            if (newStatus.toLowerCase() === 'cancelled') {
                showAlert(ordersAlert, 'Order cancelled successfully.', 'success');
            } else {
                showAlert(ordersAlert, `Order status updated to ${newStatus}.`, 'success');
            }
            
            // Re-render
            renderOrders();

        } catch (err) {
            console.error('[CultureSquared] Error updating order status:', err);
            showAlert(ordersAlert, 'Failed to update order status.', 'error');
        }
    }
    
    // Attach to window so other scripts or admin tools could trigger workflow (e.g. mark as shipped)
    window.updateOrderStatus = updateOrderStatus;

    // --- Event Listeners ---
    if (ordersItemsList) {
        ordersItemsList.addEventListener('click', (e) => {
            const cancelBtn = e.target.closest('.btn-cancel-order');
            if (cancelBtn) {
                const orderId = cancelBtn.getAttribute('data-id');
                if (confirm('Are you sure you want to cancel this order?')) {
                    updateOrderStatus(orderId, 'Cancelled');
                }
            }
        });
    }

    // Modal Toggles
    function openOrders() {
        if (!window.currentUser) {
            if (window.openLoginModal) window.openLoginModal();
            return;
        }
        
        // Close profile modal if open, since orders is usually linked from profile
        if (window.closeProfileModal) window.closeProfileModal();
        
        fetchOrders();
        
        if (ordersModal) {
            ordersModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (ordersAlert) ordersAlert.style.display = 'none';
        }
    }

    function closeOrders() {
        if (ordersModal) {
            ordersModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    window.openOrdersModal = openOrders;
    window.closeOrdersModal = closeOrders;

    if (closeOrdersModalBtn) closeOrdersModalBtn.addEventListener('click', closeOrders);
    
    if (ordersModal) {
        ordersModal.addEventListener('click', (e) => {
            if (e.target === ordersModal) closeOrders();
        });
    }

    if (ordersExploreBtn) {
        ordersExploreBtn.addEventListener('click', () => {
            closeOrders();
        });
    }

    if (profileOrdersLink) {
        profileOrdersLink.addEventListener('click', (e) => {
            e.preventDefault();
            openOrders();
        });
    }

    // Refresh on auth state change
    if (client) {
        client.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                fetchOrders();
            } else {
                window.userOrders = [];
                renderOrders();
            }
        });
    }
});
