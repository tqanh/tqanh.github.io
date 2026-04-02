// Portal JS
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js?v=3.0.0')
        .then(reg => console.log('Portal SW registered'))
        .catch(err => console.log('SW failed:', err));
}

// Feature card click handlers
document.querySelectorAll('.feature-card:not(.coming-soon)').forEach(card => {
    card.addEventListener('click', (e) => {
        if (!card.classList.contains('coming-soon')) {
            const href = card.getAttribute('href');
            if (href) {
                window.location.href = href;
            }
        }
    });
});

// Version
const version = document.getElementById('version');
if (version) {
    version.textContent = 'v3.0.0';
}
