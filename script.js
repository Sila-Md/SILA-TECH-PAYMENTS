// Global variables
let selectedMethod = null;
const developerPhone = '255612491554';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('SILA TECH PAYMENT initialized');
    // Add smooth scrolling for navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Scroll to payment section
function scrollToPayment() {
    document.getElementById('payment').scrollIntoView({ behavior: 'smooth' });
}

// Select payment method
function selectMethod(method) {
    selectedMethod = method;
    
    // Remove selected class from all methods
    document.querySelectorAll('.method-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked method
    event.currentTarget.classList.add('selected');
    
    // Update pay button text
    const payButton = document.getElementById('payButton');
    payButton.textContent = `Pay with ${getMethodName(method)}`;
}

// Get payment method display name
function getMethodName(method) {
    const methods = {
        'mpesa': 'M-Pesa',
        'flutterwave': 'Flutterwave',
        'paypal': 'PayPal'
    };
    return methods[method] || 'Payment Method';
}

// Validate form
function validateForm() {
    const amount = document.getElementById('amount').value;
    const currency = document.getElementById('currency').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return false;
    }
    
    if (!email || !isValidEmail(email)) {
        alert('Please enter a valid email address');
        return false;
    }
    
    if (!phone) {
        alert('Please enter your phone number');
        return false;
    }
    
    if (!selectedMethod) {
        alert('Please select a payment method');
        return false;
    }
    
    return true;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show loading spinner
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Process payment based on selected method
async function processPayment() {
    if (!validateForm()) {
        return;
    }
    
    const paymentData = {
        amount: document.getElementById('amount').value,
        currency: document.getElementById('currency').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        method: selectedMethod
    };
    
    showLoading();
    
    try {
        switch (selectedMethod) {
            case 'mpesa':
                await processMpesaPayment(paymentData);
                break;
            case 'flutterwave':
                await processFlutterwavePayment(paymentData);
                break;
            case 'paypal':
                await processPaypalPayment(paymentData);
                break;
            default:
                throw new Error('Unknown payment method');
        }
    } catch (error) {
        hideLoading();
        alert('Payment failed: ' + error.message);
        console.error('Payment error:', error);
    }
}

// Simulate payment processing (you'll replace these with actual API calls)
async function processMpesaPayment(data) {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real implementation, you would call your backend API
    // which then calls the M-Pesa Daraja API
    console.log('Processing M-Pesa payment:', data);
    
    hideLoading();
    alert('M-Pesa payment initiated! Check your phone to complete the payment.');
    
    // Simulate successful payment
    simulateSuccessfulPayment(data);
}

async function processFlutterwavePayment(data) {
    // This would integrate with Flutterwave's JavaScript SDK
    console.log('Processing Flutterwave payment:', data);
    
    // For demo purposes - in real implementation, use Flutterwave SDK
    hideLoading();
    alert('Redirecting to Flutterwave payment gateway...');
    
    // Simulate successful payment
    simulateSuccessfulPayment(data);
}

async function processPaypalPayment(data) {
    // This would integrate with PayPal's JavaScript SDK
    console.log('Processing PayPal payment:', data);
    
    // For demo purposes - in real implementation, use PayPal SDK
    hideLoading();
    alert('Redirecting to PayPal...');
    
    // Simulate successful payment
    simulateSuccessfulPayment(data);
}

// Simulate successful payment (for demo purposes)
function simulateSuccessfulPayment(data) {
    console.log('Payment completed successfully:', data);
    
    // Show success message
    const successMessage = `
        Payment Successful!
        
        Amount: ${data.amount} ${data.currency}
        Method: ${getMethodName(data.method)}
        Email: ${data.email}
        Phone: ${data.phone}
        
        Thank you for your payment!
        
        Developer Contact: +${developerPhone}
    `;
    
    // In a real application, you might redirect to a success page
    // or show a modal with the success details
    setTimeout(() => {
        if (confirm(successMessage + '\n\nWould you like to make another payment?')) {
            // Reset form
            document.getElementById('amount').value = '';
            document.getElementById('email').value = '';
            document.getElementById('phone').value = '';
            selectedMethod = null;
            document.querySelectorAll('.method-card').forEach(card => {
                card.classList.remove('selected');
            });
            document.getElementById('payButton').textContent = 'Proceed to Payment';
        }
    }, 1000);
}

// Utility function to format currency
function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Add some interactive features
document.addEventListener('DOMContentLoaded', function() {
    // Add input animations
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
    });
    
    // Add scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.service-card, .method-card').forEach(el => {
        observer.observe(el);
    });
});
