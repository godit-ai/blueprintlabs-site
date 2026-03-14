// Blueprint Labs - Google Analytics 4 Tracking
// Initialize dataLayer
dataLayer = window.dataLayer || [];

// Google Analytics 4 Configuration
window.gtag = function() {
    dataLayer.push(arguments);
};
gtag('js', new Date());

// Replace GA_MEASUREMENT_ID with your actual Google Analytics 4 ID
// Example: gtag('config', 'G-XXXXXXXXXX');
gtag('config', 'GA_MEASUREMENT_ID');

// Event Tracking Helper
function trackEvent(eventName, params = {}) {
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, params);
    }
}

// Track button clicks
document.addEventListener('DOMContentLoaded', function() {
    // Track all buttons with data-product attribute
    document.querySelectorAll('[data-product]').forEach(button => {
        button.addEventListener('click', function() {
            const product = this.dataset.product;
            const price = this.dataset.price;
            
            trackEvent('begin_checkout', {
                'event_category': 'ecommerce',
                'event_label': product,
                'value': parseFloat(price),
                'currency': 'USD',
                'items': [{
                    'item_name': product,
                    'price': parseFloat(price),
                    'quantity': 1
                }]
            });
        });
    });
    
    // Track CTA button clicks
    document.querySelectorAll('.btn-primary').forEach(button => {
        button.addEventListener('click', function() {
            const text = this.textContent.trim();
            const href = this.getAttribute('href') || '';
            
            if (href.includes('stripe')) {
                trackEvent('cta_click', {
                    'event_category': 'conversion',
                    'event_label': text,
                    'destination': 'checkout'
                });
            }
        });
    });
    
    // Track FAQ interactions
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const faqText = this.textContent.trim().substring(0, 50);
            trackEvent('faq_expand', {
                'event_category': 'engagement',
                'event_label': faqText
            });
        });
    });
    
    // Track navigation clicks
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            const text = this.textContent.trim();
            trackEvent('nav_click', {
                'event_category': 'navigation',
                'event_label': text
            });
        });
    });
});

// Track page view on load
trackEvent('page_view', {
    'page_title': document.title,
    'page_location': window.location.href,
    'page_path': window.location.pathname
});
