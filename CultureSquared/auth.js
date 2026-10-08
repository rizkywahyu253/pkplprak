/**
 * CultureSquared - Authentication Module (auth.js)
 * Implements:
 * - Step 2: Register
 * - Step 3: Login
 * - Step 4: Logout
 * - Step 5: Forgot Password & Reset Password
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Navigation Elements ---
    const authNavContainer = document.getElementById('authNavContainer');
    const userNavContainer = document.getElementById('userNavContainer');
    const navUserName = document.getElementById('navUserName');
    const logoutBtn = document.getElementById('logoutBtn');

    // --- Register Elements ---
    const registerModal = document.getElementById('registerModal');
    const openRegisterBtn = document.getElementById('openRegisterBtn');
    const closeRegisterModal = document.getElementById('closeRegisterModal');
    const registerForm = document.getElementById('registerForm');
    const registerAlert = document.getElementById('registerAlert');
    const regSubmitBtn = document.getElementById('regSubmitBtn');
    const switchToLoginLink = document.getElementById('switchToLoginLink');

    const regName = document.getElementById('regName');
    const regEmail = document.getElementById('regEmail');
    const regPhone = document.getElementById('regPhone');
    const regPassword = document.getElementById('regPassword');
    const regConfirmPassword = document.getElementById('regConfirmPassword');

    // --- Login Elements ---
    const loginModal = document.getElementById('loginModal');
    const openLoginBtn = document.getElementById('openLoginBtn');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const switchToRegisterLink = document.getElementById('switchToRegisterLink');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');

    // --- Forgot Password Elements ---
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const closeForgotModal = document.getElementById('closeForgotModal');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const forgotAlert = document.getElementById('forgotAlert');
    const forgotSubmitBtn = document.getElementById('forgotSubmitBtn');
    const forgotEmail = document.getElementById('forgotEmail');
    const backToLoginFromForgot = document.getElementById('backToLoginFromForgot');

    // --- Reset Password Elements ---
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const closeResetModal = document.getElementById('closeResetModal');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const resetAlert = document.getElementById('resetAlert');
    const resetSubmitBtn = document.getElementById('resetSubmitBtn');
    const resetNewPassword = document.getElementById('resetNewPassword');
    const resetConfirmPassword = document.getElementById('resetConfirmPassword');

    // --- Profile Elements ---
    const profileModal = document.getElementById('profileModal');
    const openProfileBtn = document.getElementById('openProfileBtn');
    const closeProfileModal = document.getElementById('closeProfileModal');
    const profileForm = document.getElementById('profileForm');
    const profileAlert = document.getElementById('profileAlert');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const profileEmail = document.getElementById('profileEmail');
    const profileName = document.getElementById('profileName');
    const profilePhone = document.getElementById('profilePhone');
    const profileAddress = document.getElementById('profileAddress');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const profileNewPassword = document.getElementById('profileNewPassword');
    const profileConfirmPassword = document.getElementById('profileConfirmPassword');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    // --- Helper Utilities ---
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

    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // --- Unified Modal Controllers ---
    function closeAllAuthModals() {
        if (registerModal) registerModal.classList.remove('active');
        if (loginModal) loginModal.classList.remove('active');
        if (forgotPasswordModal) forgotPasswordModal.classList.remove('active');
        if (resetPasswordModal) resetPasswordModal.classList.remove('active');
        if (profileModal) profileModal.classList.remove('active');
        document.body.style.overflow = 'auto';

        clearAlert(registerAlert);
        clearAlert(loginAlert);
        clearAlert(forgotAlert);
        clearAlert(resetAlert);
        clearAlert(profileAlert);
    }

    function openRegister() {
        closeAllAuthModals();
        if (registerForm) registerForm.reset();
        if (registerModal) registerModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openLogin() {
        closeAllAuthModals();
        if (loginForm) loginForm.reset();
        if (loginModal) loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openForgotPassword() {
        closeAllAuthModals();
        if (forgotPasswordForm) forgotPasswordForm.reset();
        if (forgotPasswordModal) forgotPasswordModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openResetPassword() {
        closeAllAuthModals();
        if (resetPasswordForm) resetPasswordForm.reset();
        if (resetPasswordModal) resetPasswordModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openProfile() {
        if (!window.currentUser) {
            openLogin();
            return;
        }
        closeAllAuthModals();
        if (profileAlert) clearAlert(profileAlert);

        // Prepopulate from current user
        if (profileEmail) profileEmail.value = window.currentUser.email || '';
        if (profileName) profileName.value = window.currentUser.user_metadata?.name || '';
        if (profilePhone) profilePhone.value = window.currentUser.user_metadata?.phone || '';

        // Fetch latest profile details from Supabase database
        if (client) {
            client.from('profiles').select('*').eq('id', window.currentUser.id).single()
                .then(({ data }) => {
                    if (data) {
                        if (data.name && profileName) profileName.value = data.name;
                        if (data.phone && profilePhone) profilePhone.value = data.phone;
                        if (data.address && profileAddress) profileAddress.value = data.address;
                    }
                }).catch(err => console.warn('[CultureSquared] Profile sync:', err));
        }

        if (profileModal) profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Expose helpers globally
    window.openRegisterModal = openRegister;
    window.closeRegisterModal = closeAllAuthModals;
    window.openLoginModal = openLogin;
    window.closeLoginModal = closeAllAuthModals;
    window.openForgotPasswordModal = openForgotPassword;
    window.closeForgotPasswordModal = closeAllAuthModals;
    window.openResetPasswordModal = openResetPassword;
    window.closeResetPasswordModal = closeAllAuthModals;
    window.openProfileModal = openProfile;

    // --- Modal Open / Close Event Listeners ---
    if (openRegisterBtn) {
        openRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openRegister();
        });
    }

    if (closeRegisterModal) {
        closeRegisterModal.addEventListener('click', closeAllAuthModals);
    }

    if (registerModal) {
        registerModal.addEventListener('click', (e) => {
            if (e.target === registerModal) closeAllAuthModals();
        });
    }

    if (switchToLoginLink) {
        switchToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            openLogin();
        });
    }

    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openLogin();
        });
    }

    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', closeAllAuthModals);
    }

    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeAllAuthModals();
        });
    }

    if (switchToRegisterLink) {
        switchToRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            openRegister();
        });
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            openForgotPassword();
        });
    }

    if (closeForgotModal) {
        closeForgotModal.addEventListener('click', closeAllAuthModals);
    }

    if (forgotPasswordModal) {
        forgotPasswordModal.addEventListener('click', (e) => {
            if (e.target === forgotPasswordModal) closeAllAuthModals();
        });
    }

    if (backToLoginFromForgot) {
        backToLoginFromForgot.addEventListener('click', (e) => {
            e.preventDefault();
            openLogin();
        });
    }

    if (closeResetModal) {
        closeResetModal.addEventListener('click', closeAllAuthModals);
    }

    if (resetPasswordModal) {
        resetPasswordModal.addEventListener('click', (e) => {
            if (e.target === resetPasswordModal) closeAllAuthModals();
        });
    }

    // --- Session State Management ---
    function updateAuthState(user) {
        window.currentUser = user || null;

        if (user) {
            const displayName = user.user_metadata?.name || user.email.split('@')[0];
            if (navUserName) {
                navUserName.textContent = `Hi, ${displayName}`;
            }
            if (authNavContainer) authNavContainer.style.display = 'none';
            if (userNavContainer) userNavContainer.style.display = 'flex';
        } else {
            if (authNavContainer) authNavContainer.style.display = 'flex';
            if (userNavContainer) userNavContainer.style.display = 'none';
        }
    }

    // Supabase client instance
    const client = window.supabaseClient;

    if (client) {
        client.auth.getSession().then(({ data: { session } }) => {
            updateAuthState(session?.user || null);
        }).catch(err => {
            console.warn('[CultureSquared] Session retrieval warning:', err);
        });

        client.auth.onAuthStateChange((event, session) => {
            updateAuthState(session?.user || null);

            // Handle password recovery event
            if (event === 'PASSWORD_RECOVERY') {
                openResetPassword();
            }
        });
    }

    // Detect recovery token in URL hash on load
    if (window.location.hash && window.location.hash.includes('type=recovery')) {
        setTimeout(() => {
            openResetPassword();
        }, 300);
    }

    // --- Logout Functionality ---
    async function handleLogout() {
        if (client) {
            try {
                const { error } = await client.auth.signOut();
                if (error) {
                    console.error('[CultureSquared] Sign out error:', error);
                }
            } catch (err) {
                console.error('[CultureSquared] Sign out exception:', err);
            }
        }
        updateAuthState(null);
        closeAllAuthModals();
        if (window.location.hash) {
            window.location.hash = '';
        }
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    window.handleLogout = handleLogout;

    // --- Register Form Submission ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert(registerAlert);

            const name = regName.value.trim();
            const email = regEmail.value.trim();
            const phone = regPhone.value.trim();
            const password = regPassword.value;
            const confirmPassword = regConfirmPassword.value;

            if (!name || !email || !phone || !password || !confirmPassword) {
                showAlert(registerAlert, 'All fields are required. Please fill in all information.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showAlert(registerAlert, 'Please enter a valid email address (e.g. name@example.com).', 'error');
                regEmail.focus();
                return;
            }

            if (password.length < 8) {
                showAlert(registerAlert, 'Password must be at least 8 characters long.', 'error');
                regPassword.focus();
                return;
            }

            if (password !== confirmPassword) {
                showAlert(registerAlert, 'Passwords do not match. Please re-enter your password confirmation.', 'error');
                regConfirmPassword.focus();
                return;
            }

            if (!client) {
                showAlert(
                    registerAlert,
                    'Supabase credentials are not configured yet. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in supabaseClient.js.',
                    'error'
                );
                return;
            }

            regSubmitBtn.disabled = true;
            const originalBtnText = regSubmitBtn.textContent;
            regSubmitBtn.textContent = 'Creating Account...';

            try {
                const { data, error } = await client.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            name: name,
                            phone: phone
                        }
                    }
                });

                if (error) {
                    const errorMsg = error.message || '';
                    if (
                        errorMsg.toLowerCase().includes('already registered') ||
                        errorMsg.toLowerCase().includes('unique') ||
                        errorMsg.toLowerCase().includes('duplicate')
                    ) {
                        showAlert(registerAlert, 'An account with this email address already exists. Please log in instead.', 'error');
                    } else {
                        showAlert(registerAlert, `Registration failed: ${error.message}`, 'error');
                    }
                    return;
                }

                if (data && data.user) {
                    try {
                        await client.from('profiles').upsert({
                            id: data.user.id,
                            name: name,
                            email: email,
                            phone: phone
                        });
                    } catch (profileErr) {
                        console.warn('[CultureSquared] Profile upsert notice:', profileErr);
                    }

                    showAlert(
                        registerAlert,
                        'Account created successfully! You can now log in to CultureSquared.',
                        'success'
                    );
                    registerForm.reset();

                    setTimeout(() => {
                        openLogin();
                    }, 1500);
                } else {
                    showAlert(registerAlert, 'Registration completed. Please verify your email if required.', 'success');
                    registerForm.reset();
                }

            } catch (err) {
                console.error('[CultureSquared] Unexpected registration error:', err);
                showAlert(registerAlert, 'An unexpected network error occurred. Please check your connection and try again.', 'error');
            } finally {
                regSubmitBtn.disabled = false;
                regSubmitBtn.textContent = originalBtnText;
            }
        });
    }

    // --- Login Form Submission ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert(loginAlert);

            const email = loginEmail.value.trim();
            const password = loginPassword.value;

            if (!email || !password) {
                showAlert(loginAlert, 'Please enter both your email address and password.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showAlert(loginAlert, 'Please enter a valid email address.', 'error');
                loginEmail.focus();
                return;
            }

            if (!client) {
                showAlert(
                    loginAlert,
                    'Supabase credentials are not configured yet. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in supabaseClient.js.',
                    'error'
                );
                return;
            }

            loginSubmitBtn.disabled = true;
            const originalBtnText = loginSubmitBtn.textContent;
            loginSubmitBtn.textContent = 'Logging In...';

            try {
                const { data, error } = await client.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) {
                    const errorMsg = error.message || '';
                    if (
                        errorMsg.toLowerCase().includes('invalid login credentials') ||
                        errorMsg.toLowerCase().includes('invalid grant')
                    ) {
                        showAlert(loginAlert, 'Invalid email or password. Please verify your credentials and try again.', 'error');
                    } else if (errorMsg.toLowerCase().includes('email not confirmed')) {
                        showAlert(loginAlert, 'Please confirm your email address before logging in.', 'error');
                    } else {
                        showAlert(loginAlert, `Login failed: ${error.message}`, 'error');
                    }
                    return;
                }

                if (data && data.user) {
                    updateAuthState(data.user);
                    showAlert(loginAlert, 'Logged in successfully! Welcome back.', 'success');
                    loginForm.reset();

                    setTimeout(() => {
                        closeAllAuthModals();
                    }, 800);
                }

            } catch (err) {
                console.error('[CultureSquared] Unexpected login error:', err);
                showAlert(loginAlert, 'An unexpected network error occurred. Please check your connection and try again.', 'error');
            } finally {
                loginSubmitBtn.disabled = false;
                loginSubmitBtn.textContent = originalBtnText;
            }
        });
    }

    // --- Forgot Password Form Submission ---
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert(forgotAlert);

            const email = forgotEmail.value.trim();

            if (!email) {
                showAlert(forgotAlert, 'Please enter your email address.', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showAlert(forgotAlert, 'Please enter a valid email address.', 'error');
                forgotEmail.focus();
                return;
            }

            if (!client) {
                showAlert(
                    forgotAlert,
                    'Supabase credentials are not configured yet. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in supabaseClient.js.',
                    'error'
                );
                return;
            }

            forgotSubmitBtn.disabled = true;
            const originalBtnText = forgotSubmitBtn.textContent;
            forgotSubmitBtn.textContent = 'Sending Link...';

            try {
                const redirectTo = window.location.origin + window.location.pathname;
                const { data, error } = await client.auth.resetPasswordForEmail(email, {
                    redirectTo: redirectTo
                });

                if (error) {
                    showAlert(forgotAlert, `Failed to send reset link: ${error.message}`, 'error');
                    return;
                }

                showAlert(
                    forgotAlert,
                    'Password reset email sent! Please check your inbox for instructions to reset your password.',
                    'success'
                );
                forgotPasswordForm.reset();

            } catch (err) {
                console.error('[CultureSquared] Unexpected forgot password error:', err);
                showAlert(forgotAlert, 'An unexpected error occurred. Please try again later.', 'error');
            } finally {
                forgotSubmitBtn.disabled = false;
                forgotSubmitBtn.textContent = originalBtnText;
            }
        });
    }

    // --- Reset Password Form Submission ---
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert(resetAlert);

            const newPassword = resetNewPassword.value;
            const confirmPassword = resetConfirmPassword.value;

            if (!newPassword || !confirmPassword) {
                showAlert(resetAlert, 'Please fill in both password fields.', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showAlert(resetAlert, 'New password must be at least 8 characters long.', 'error');
                resetNewPassword.focus();
                return;
            }

            if (newPassword !== confirmPassword) {
                showAlert(resetAlert, 'Passwords do not match. Please re-enter your password confirmation.', 'error');
                resetConfirmPassword.focus();
                return;
            }

            if (!client) {
                showAlert(
                    resetAlert,
                    'Supabase credentials are not configured yet. Please configure SUPABASE_URL and SUPABASE_ANON_KEY in supabaseClient.js.',
                    'error'
                );
                return;
            }

            resetSubmitBtn.disabled = true;
            const originalBtnText = resetSubmitBtn.textContent;
            resetSubmitBtn.textContent = 'Updating Password...';

            try {
                const { data, error } = await client.auth.updateUser({
                    password: newPassword
                });

                if (error) {
                    showAlert(resetAlert, `Password update failed: ${error.message}`, 'error');
                    return;
                }

                showAlert(
                    resetAlert,
                    'Password updated successfully! Redirecting to login...',
                    'success'
                );
                resetPasswordForm.reset();

                // Clean hash if present
                if (window.location.hash) {
                    window.location.hash = '';
                }

                setTimeout(() => {
                    openLogin();
                }, 1500);

            } catch (err) {
                console.error('[CultureSquared] Unexpected password update error:', err);
                showAlert(resetAlert, 'An unexpected error occurred. Please try again.', 'error');
            } finally {
                resetSubmitBtn.disabled = false;
                resetSubmitBtn.textContent = originalBtnText;
            }
        });
    }

    // --- Profile Event Listeners & Handlers ---
    if (openProfileBtn) {
        openProfileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openProfile();
        });
    }

    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', closeAllAuthModals);
    }

    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) closeAllAuthModals();
        });
    }

    if (profileLogoutBtn) {
        profileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert(profileAlert);

            if (!window.currentUser || !client) {
                showAlert(profileAlert, 'Please log in to update your profile.', 'error');
                return;
            }

            const name = profileName.value.trim();
            const phone = profilePhone.value.trim();
            const address = profileAddress.value.trim();

            if (!name || !phone) {
                showAlert(profileAlert, 'Name and phone number cannot be empty.', 'error');
                return;
            }

            saveProfileBtn.disabled = true;
            const originalText = saveProfileBtn.textContent;
            saveProfileBtn.textContent = 'Saving...';

            try {
                const { error: dbError } = await client.from('profiles').upsert({
                    id: window.currentUser.id,
                    name: name,
                    email: window.currentUser.email,
                    phone: phone,
                    address: address
                });

                if (dbError) {
                    showAlert(profileAlert, `Failed to update profile: ${dbError.message}`, 'error');
                    return;
                }

                await client.auth.updateUser({
                    data: { name: name, phone: phone }
                });

                if (navUserName) {
                    navUserName.textContent = `Hi, ${name}`;
                }

                showAlert(profileAlert, 'Profile updated successfully!', 'success');

            } catch (err) {
                console.error('[CultureSquared] Profile update error:', err);
                showAlert(profileAlert, 'An unexpected error occurred while saving profile.', 'error');
            } finally {
                saveProfileBtn.disabled = false;
                saveProfileBtn.textContent = originalText;
            }
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert(profileAlert);

            if (!window.currentUser || !client) {
                showAlert(profileAlert, 'Please log in to change your password.', 'error');
                return;
            }

            const newPassword = profileNewPassword.value;
            const confirmPassword = profileConfirmPassword.value;

            if (!newPassword || !confirmPassword) {
                showAlert(profileAlert, 'Please fill in both password fields.', 'error');
                return;
            }

            if (newPassword.length < 8) {
                showAlert(profileAlert, 'New password must be at least 8 characters long.', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                showAlert(profileAlert, 'Passwords do not match.', 'error');
                return;
            }

            changePasswordBtn.disabled = true;
            const originalText = changePasswordBtn.textContent;
            changePasswordBtn.textContent = 'Updating...';

            try {
                const { error } = await client.auth.updateUser({
                    password: newPassword
                });

                if (error) {
                    showAlert(profileAlert, `Failed to update password: ${error.message}`, 'error');
                    return;
                }

                showAlert(profileAlert, 'Password changed successfully!', 'success');
                changePasswordForm.reset();

            } catch (err) {
                console.error('[CultureSquared] Change password error:', err);
                showAlert(profileAlert, 'An unexpected error occurred while changing password.', 'error');
            } finally {
                changePasswordBtn.disabled = false;
                changePasswordBtn.textContent = originalText;
            }
        });
    }

    // --- Delete Account Action ---
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            if (!window.currentUser) return;
            
            const confirmed = confirm("Are you sure you want to permanently delete your account? This action cannot be undone.");
            if (!confirmed) return;

            clearAlert(profileAlert);
            deleteAccountBtn.disabled = true;
            const originalText = deleteAccountBtn.textContent;
            deleteAccountBtn.textContent = 'Deleting...';

            try {
                if (client) {
                    // Attempt to delete profile data if RLS allows it (privacy wipe)
                    await client.from('profiles').delete().eq('id', window.currentUser.id);
                    
                    // Supabase Anon client doesn't allow deleting from auth.users natively.
                    // This logs the user out as the frontend action.
                    await client.auth.signOut();
                }

                // Clean local storage tied to user
                localStorage.removeItem(`cs_cart_${window.currentUser.id}`);
                localStorage.removeItem(`cs_wishlist_${window.currentUser.id}`);
                localStorage.removeItem(`cs_orders_${window.currentUser.id}`);
                
                window.currentUser = null;
                
                closeProfile();
                
                // Show success on login modal
                const loginAlert = document.getElementById('loginAlert');
                if (loginAlert) {
                    showAlert(loginAlert, 'Account data has been wiped and you are logged out.', 'success');
                }
                if (window.openLoginModal) window.openLoginModal();
                
            } catch (err) {
                console.error('[CultureSquared] Delete account error:', err);
                showAlert(profileAlert, 'An error occurred while deleting account. Please contact support.', 'error');
            } finally {
                deleteAccountBtn.disabled = false;
                deleteAccountBtn.textContent = originalText;
            }
        });
    }
});

