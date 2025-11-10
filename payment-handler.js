// Payment Handler - Actual API integrations would go here

// M-Pesa Daraja API Integration
class MpesaPaymentHandler {
    constructor() {
        // ==================== MPESA API KEYS ====================
        this.baseUrl = 'https://sandbox.safaricom.co.ke'; // For production: https://api.safaricom.co.ke
        this.consumerKey = 'YOUR_MPESA_CONSUMER_KEY_HERE'; // Get from: https://developer.safaricom.co.ke
        this.consumerSecret = 'YOUR_MPESA_CONSUMER_SECRET_HERE'; // Get from: https://developer.safaricom.co.ke
        this.businessShortCode = '174379'; // Sandbox: 174379, Production: Your PayBill number
        this.passkey = 'YOUR_MPESA_PASSKEY_HERE'; // Get from Daraja portal
        this.callbackUrl = 'https://yourdomain.com/api/mpesa-callback'; // Your callback URL
        // ========================================================
    }

    async getAccessToken() {
        try {
            const auth = btoa(`${this.consumerKey}:${this.consumerSecret}`);
            const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Error getting M-Pesa access token:', error);
            throw new Error('Failed to connect to M-Pesa service');
        }
    }

    async initiateSTKPush(phone, amount, reference = 'SILA TECH PAYMENT') {
        try {
            const accessToken = await this.getAccessToken();
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -4);
            const password = btoa(`${this.businessShortCode}${this.passkey}${timestamp}`);
            
            // Format phone number (remove + and ensure 254 format for Kenya)
            let formattedPhone = phone.replace(/\s+/g, '');
            if (formattedPhone.startsWith('+')) {
                formattedPhone = formattedPhone.substring(1);
            }
            if (formattedPhone.startsWith('0')) {
                formattedPhone = '254' + formattedPhone.substring(1);
            }
            if (formattedPhone.startsWith('255')) {
                formattedPhone = '254' + formattedPhone.substring(3); // Convert Tanzania to Kenya for sandbox
            }

            const payload = {
                BusinessShortCode: this.businessShortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: 'CustomerPayBillOnline',
                Amount: amount,
                PartyA: formattedPhone,
                PartyB: this.businessShortCode,
                PhoneNumber: formattedPhone,
                CallBackURL: this.callbackUrl,
                AccountReference: reference,
                TransactionDesc: 'Payment for services - SILA TECH'
            };

            const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.ResponseCode === '0') {
                return {
                    success: true,
                    checkoutRequestID: result.CheckoutRequestID,
                    customerMessage: result.CustomerMessage,
                    responseDescription: result.ResponseDescription
                };
            } else {
                throw new Error(result.ResponseDescription || 'STK push failed');
            }
        } catch (error) {
            console.error('Error initiating M-Pesa payment:', error);
            throw error;
        }
    }

    async checkTransactionStatus(checkoutRequestID) {
        try {
            const accessToken = await this.getAccessToken();
            const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -4);
            const password = btoa(`${this.businessShortCode}${this.passkey}${timestamp}`);

            const payload = {
                BusinessShortCode: this.businessShortCode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestID
            };

            const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error('Error checking transaction status:', error);
            throw error;
        }
    }
}

// Flutterwave API Integration
class FlutterwavePaymentHandler {
    constructor() {
        // ==================== FLUTTERWAVE API KEYS ====================
        this.publicKey = 'YOUR_FLUTTERWAVE_PUBLIC_KEY_HERE'; // Get from: https://dashboard.flutterwave.com
        this.secretKey = 'YOUR_FLUTTERWAVE_SECRET_KEY_HERE'; // Get from: https://dashboard.flutterwave.com
        this.encryptionKey = 'YOUR_FLUTTERWAVE_ENCRYPTION_KEY_HERE'; // Get from Flutterwave dashboard
        // ==============================================================
    }

    async initiatePayment(paymentData) {
        return new Promise((resolve, reject) => {
            // Validate Flutterwave configuration
            if (!this.publicKey || this.publicKey.includes('YOUR_')) {
                reject(new Error('Flutterwave public key not configured'));
                return;
            }

            if (typeof FlutterwaveCheckout === 'undefined') {
                reject(new Error('Flutterwave SDK not loaded'));
                return;
            }

            const transactionRef = `SILA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            FlutterwaveCheckout({
                public_key: this.publicKey,
                tx_ref: transactionRef,
                amount: paymentData.amount,
                currency: paymentData.currency,
                payment_options: 'card, mobilemoney, banktransfer, ussd',
                customer: {
                    email: paymentData.email,
                    phone_number: paymentData.phone,
                    name: 'Customer'
                },
                customizations: {
                    title: 'SILA TECH PAYMENT',
                    description: `Payment for services - ${transactionRef}`,
                    logo: 'https://files.catbox.moe/jwmx1j.jpg'
                },
                callback: function(response) {
                    if (response.status === 'successful') {
                        resolve({
                            success: true,
                            transactionId: response.transaction_id,
                            transactionRef: response.tx_ref,
                            amount: response.amount,
                            currency: response.currency,
                            customer: response.customer
                        });
                    } else {
                        reject(new Error(`Payment ${response.status}: ${response.message}`));
                    }
                },
                onclose: function() {
                    reject(new Error('Payment cancelled by user'));
                }
            });
        });
    }

    async verifyTransaction(transactionId) {
        try {
            const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.secretKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
                return {
                    success: true,
                    data: result.data
                };
            } else {
                throw new Error(result.message || 'Transaction verification failed');
            }
        } catch (error) {
            console.error('Error verifying Flutterwave transaction:', error);
            throw error;
        }
    }
}

// PayPal API Integration
class PayPalPaymentHandler {
    constructor() {
        // ==================== PAYPAL API KEYS ====================
        this.clientId = 'Aas2sjGi565STFHuB8Yik4o7wbu9swzzwa8TKAka8s4LvOnfiVwQpTVrmSgC5-2JS-f8CXfiG8ygo46g
'; // Get from: https://developer.paypal.com
        this.clientSecret = 'EGlHcMkk5uFwKgnnTjWsIbUC04yc3UwifWWbBe6jvZokimi03r9zg36QrUXRrAdMhVb4Q27kJNjw46zd'; // Get from: https://developer.paypal.com
        this.mode = 'sandbox'; // Change to 'live' for production
        // =========================================================
    }

    async initiatePayment(paymentData) {
        return new Promise((resolve, reject) => {
            // Validate PayPal configuration
            if (!this.clientId || this.clientId.includes('YOUR_')) {
                reject(new Error('PayPal client ID not configured'));
                return;
            }

            if (typeof window.paypal === 'undefined') {
                reject(new Error('PayPal SDK not loaded'));
                return;
            }

            // Re-initialize PayPal SDK with current credentials
            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: paymentData.amount,
                                currency_code: paymentData.currency
                            },
                            description: `Payment to SILA TECH - ${paymentData.email}`,
                            custom_id: `SILA-${Date.now()}`,
                            soft_descriptor: 'SILA TECH PAYMENT'
                        }],
                        application_context: {
                            shipping_preference: 'NO_SHIPPING',
                            user_action: 'PAY_NOW',
                            return_url: 'https://yourdomain.com/payment/success',
                            cancel_url: 'https://yourdomain.com/payment/cancel'
                        }
                    });
                },
                onApprove: async (data, actions) => {
                    try {
                        const details = await actions.order.capture();
                        resolve({
                            success: true,
                            orderID: data.orderID,
                            payerID: data.payerID,
                            paymentSource: details.payment_source,
                            purchaseUnits: details.purchase_units,
                            status: details.status,
                            createTime: details.create_time,
                            updateTime: details.update_time
                        });
                    } catch (error) {
                        reject(new Error(`Payment capture failed: ${error.message}`));
                    }
                },
                onError: (err) => {
                    console.error('PayPal error:', err);
                    reject(new Error(`PayPal payment error: ${err.message}`));
                },
                onCancel: (data) => {
                    reject(new Error('Payment cancelled by user'));
                }
            }).render('#paypal-button-container').catch(reject);
        });
    }

    async verifyPayment(orderID) {
        try {
            const response = await fetch(`https://api.${this.mode === 'sandbox' ? 'sandbox.' : ''}paypal.com/v2/checkout/orders/${orderID}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${btoa(`${this.clientId}:${this.clientSecret}`)}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const orderDetails = await response.json();
            return orderDetails;
        } catch (error) {
            console.error('Error verifying PayPal payment:', error);
            throw error;
        }
    }
}

// Export payment handlers
window.paymentHandlers = {
    mpesa: new MpesaPaymentHandler(),
    flutterwave: new FlutterwavePaymentHandler(),
    paypal: new PayPalPaymentHandler()
};

// Utility function for API calls
async function makeApiCall(url, options) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Error handling utility
function handlePaymentError(error, method) {
    console.error(`${method} payment error:`, error);
    
    const errorMessages = {
        mpesa: 'M-Pesa payment failed. Please try again.',
        flutterwave: 'Flutterwave payment failed. Please try again.',
        paypal: 'PayPal payment failed. Please try again.',
        network: 'Network error. Please check your connection and try again.'
    };
    
    const message = errorMessages[method] || errorMessages.network;
    
    // Show notification instead of alert
    if (typeof showNotification === 'function') {
        showNotification('error', 'Payment Failed', message);
    } else {
        alert(message);
    }
    
    return {
        success: false,
        error: error.message,
        method: method
    };
}

// Success handler
function handlePaymentSuccess(response, method, data) {
    console.log(`${method} payment success:`, response);
    
    // Show success notification
    if (typeof showNotification === 'function') {
        showNotification('success', 'Payment Successful', `Your ${method.toUpperCase()} payment was completed successfully!`);
    }
    
    return {
        success: true,
        data: response,
        method: method,
        paymentData: data,
        timestamp: new Date().toISOString()
    };
}

// Enhanced payment processing function
async function processPaymentWithHandler(paymentData) {
    const { method, amount, currency, email, phone } = paymentData;
    
    try {
        let result;
        
        switch (method) {
            case 'mpesa':
                result = await window.paymentHandlers.mpesa.initiateSTKPush(phone, amount, `SILA-${Date.now()}`);
                break;
                
            case 'flutterwave':
                result = await window.paymentHandlers.flutterwave.initiatePayment({
                    amount: amount,
                    currency: currency,
                    email: email,
                    phone: phone
                });
                break;
                
            case 'paypal':
                result = await window.paymentHandlers.paypal.initiatePayment({
                    amount: amount,
                    currency: currency,
                    email: email
                });
                break;
                
            default:
                throw new Error(`Unsupported payment method: ${method}`);
        }
        
        return handlePaymentSuccess(result, method, paymentData);
        
    } catch (error) {
        return handlePaymentError(error, method);
    }
}

// Initialize payment handlers with configuration
function initializePaymentHandlers(config = {}) {
    // M-Pesa Configuration
    if (config.mpesa) {
        window.paymentHandlers.mpesa = new MpesaPaymentHandler();
        Object.assign(window.paymentHandlers.mpesa, config.mpesa);
    }
    
    // Flutterwave Configuration
    if (config.flutterwave) {
        window.paymentHandlers.flutterwave = new FlutterwavePaymentHandler();
        Object.assign(window.paymentHandlers.flutterwave, config.flutterwave);
    }
    
    // PayPal Configuration
    if (config.paypal) {
        window.paymentHandlers.paypal = new PayPalPaymentHandler();
        Object.assign(window.paymentHandlers.paypal, config.paypal);
    }
    
    console.log('Payment handlers initialized with configuration');
}

// Make functions globally available
window.processPaymentWithHandler = processPaymentWithHandler;
window.initializePaymentHandlers = initializePaymentHandlers;
window.handlePaymentError = handlePaymentError;
window.handlePaymentSuccess = handlePaymentSuccess;

console.log('SILA TECH PAYMENT HANDLERS LOADED SUCCESSFULLY');
