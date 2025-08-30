/**
 * UTILITY FUNCTIONS
 * Helper functions for common operations
 */

// DOM utilities
export const showModal = (modalElement) => modalElement.classList.remove('hidden');
export const hideModal = (modalElement) => modalElement.classList.add('hidden');

// Date utilities
export const getTodayString = () => new Date().toISOString().split('T')[0];

// Hash function for daily randomization
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

// Deterministic daily index generation
export function getDailyIndex(dateStr, max, salt = '') {
    const seed = simpleHash(dateStr + salt);
    return (seed * 9301 + 49297) % 233280 / 233280 * max | 0;
}

// Theme management functions
export function applyColorScheme(scheme) {
    localStorage.setItem('quranle_color_scheme', scheme);
    if (scheme === 'system') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', systemPrefersDark);
    } else {
        document.documentElement.classList.toggle('dark', scheme === 'dark');
    }
    updateActiveThemeButtons();
}

export function updateActiveThemeButtons() {
    const activeScheme = localStorage.getItem('quranle_color_scheme') || 'system';
    document.querySelectorAll('.theme-mode-btn').forEach(btn => {
        btn.classList.toggle('bg-[var(--primary-color)]', btn.dataset.theme === activeScheme);
        btn.classList.toggle('text-[var(--primary-text)]', btn.dataset.theme === activeScheme);
        btn.classList.toggle('font-bold', btn.dataset.theme === activeScheme);
    });
}

// Notification system
export function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.remove('translate-y-10', 'opacity-0');
    }, 10);
    
    setTimeout(() => {
        notification.classList.add('translate-y-10', 'opacity-0');
    }, 2700);
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}
