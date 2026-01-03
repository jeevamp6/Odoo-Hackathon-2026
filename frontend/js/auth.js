// ===================================
// AUTHENTICATION LOGIC
// Travel Planner Application
// ===================================

import { initDB, createUser, getUserByEmail } from './db.js';
import {
    validateEmail,
    validatePassword,
    validateRequired,
    setCurrentUser,
    getCurrentUser,
    hashPassword,
    showToast
} from './utils.js';
import { generateUUID } from './utils.js';

// ===================================
// INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize database
    try {
        await initDB();
        console.log('Database initialized');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        showToast('Failed to initialize application', 'error');
    }

    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Setup event listeners
    setupTabSwitching();
    setupFormHandlers();
    setupPasswordStrength();
    setupForgotPassword();
});

// ===================================
// TAB SWITCHING
// ===================================

function setupTabSwitching() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Update active form
            forms.forEach(form => {
                if (form.id === `${targetTab}Form`) {
                    form.classList.add('active');
                } else {
                    form.classList.remove('active');
                }
            });

            // Clear form errors
            clearFormErrors();
        });
    });
}

// ===================================
// FORM HANDLERS
// ===================================

function setupFormHandlers() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLogin);

    // Signup form
    const signupForm = document.getElementById('signupForm');
    signupForm.addEventListener('submit', handleSignup);

    // Social login buttons (placeholder functionality)
    document.getElementById('googleLogin')?.addEventListener('click', () => {
        showToast('Google login coming soon!', 'info');
    });

    document.getElementById('googleSignup')?.addEventListener('click', () => {
        showToast('Google signup coming soon!', 'info');
    });
}

// ===================================
// LOGIN HANDLER
// ===================================

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Clear previous errors
    clearFormErrors();

    // Validate inputs
    let isValid = true;

    if (!validateEmail(email)) {
        showFieldError('loginEmail', 'Please enter a valid email address');
        isValid = false;
    }

    if (!validateRequired(password)) {
        showFieldError('loginPassword', 'Password is required');
        isValid = false;
    }

    if (!isValid) return;

    try {
        // Get user from database
        const user = await getUserByEmail(email);

        if (!user) {
            showFieldError('loginEmail', 'No account found with this email');
            return;
        }

        // Verify password
        const hashedPassword = await hashPassword(password);
        if (user.password !== hashedPassword) {
            showFieldError('loginPassword', 'Incorrect password');
            return;
        }

        // Login successful
        setCurrentUser({
            id: user.id,
            email: user.email,
            name: user.name
        });

        showToast('Login successful! Redirecting...', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Login error:', error);
        showToast('An error occurred during login', 'error');
    }
}

// ===================================
// SIGNUP HANDLER
// ===================================

async function handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    // Clear previous errors
    clearFormErrors();

    // Validate inputs
    let isValid = true;

    if (!validateRequired(name)) {
        showFieldError('signupName', 'Name is required');
        isValid = false;
    }

    if (!validateEmail(email)) {
        showFieldError('signupEmail', 'Please enter a valid email address');
        isValid = false;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
        showFieldError('signupPassword', 'Password does not meet requirements');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showFieldError('signupConfirmPassword', 'Passwords do not match');
        isValid = false;
    }

    if (!agreeTerms) {
        showToast('Please agree to the Terms of Service', 'warning');
        isValid = false;
    }

    if (!isValid) return;

    try {
        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            showFieldError('signupEmail', 'An account with this email already exists');
            return;
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create new user
        const newUser = {
            id: generateUUID(),
            name: name,
            email: email,
            password: hashedPassword,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await createUser(newUser);

        // Auto-login after signup
        setCurrentUser({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name
        });

        showToast('Account created successfully! Redirecting...', 'success');

        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        console.error('Signup error:', error);
        showToast('An error occurred during signup', 'error');
    }
}

// ===================================
// PASSWORD STRENGTH INDICATOR
// ===================================

function setupPasswordStrength() {
    const passwordInput = document.getElementById('signupPassword');
    const strengthFill = document.getElementById('passwordStrengthFill');
    const requirements = {
        length: document.getElementById('req-length'),
        upper: document.getElementById('req-upper'),
        lower: document.getElementById('req-lower'),
        number: document.getElementById('req-number')
    };

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const validation = validatePassword(password);

        // Update requirements
        requirements.length.classList.toggle('valid', validation.errors.minLength);
        requirements.upper.classList.toggle('valid', validation.errors.hasUpper);
        requirements.lower.classList.toggle('valid', validation.errors.hasLower);
        requirements.number.classList.toggle('valid', validation.errors.hasNumber);

        // Calculate strength
        const validCount = Object.values(validation.errors).filter(v => v).length;

        // Update strength bar
        strengthFill.className = 'password-strength-fill';
        if (validCount === 1 || validCount === 2) {
            strengthFill.classList.add('weak');
        } else if (validCount === 3) {
            strengthFill.classList.add('medium');
        } else if (validCount === 4) {
            strengthFill.classList.add('strong');
        }
    });
}

// ===================================
// FORGOT PASSWORD
// ===================================

function setupForgotPassword() {
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        openForgotPasswordModal();
    });
}

window.openForgotPasswordModal = function () {
    const modal = document.getElementById('forgotPasswordModal');
    modal.classList.add('active');
};

window.closeForgotPasswordModal = function () {
    const modal = document.getElementById('forgotPasswordModal');
    modal.classList.remove('active');
    document.getElementById('resetEmail').value = '';
};

window.handlePasswordReset = async function () {
    const email = document.getElementById('resetEmail').value.trim();

    if (!validateEmail(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }

    try {
        const user = await getUserByEmail(email);

        if (!user) {
            // Don't reveal if email exists for security
            showToast('If an account exists, a reset link has been sent', 'success');
        } else {
            // In a real app, send email here
            showToast('Password reset link sent to your email', 'success');
        }

        closeForgotPasswordModal();
    } catch (error) {
        console.error('Password reset error:', error);
        showToast('An error occurred. Please try again', 'error');
    }
};

// ===================================
// UTILITY FUNCTIONS
// ===================================

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorSpan = document.getElementById(`${fieldId}Error`);

    if (field) {
        field.classList.add('is-invalid');
    }

    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.style.display = 'block';
    }
}

function clearFormErrors() {
    // Remove invalid class from all inputs
    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });

    // Clear all error messages
    document.querySelectorAll('.form-error').forEach(error => {
        error.textContent = '';
        error.style.display = 'none';
    });
}
