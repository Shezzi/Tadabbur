/**
 * MAIN APPLICATION
 * Entry point and initialization
 */

import { applyColorScheme, showModal, hideModal, showNotification } from './utils.js';
import { loadCoreData, fetchEdition } from './api.js';
import { appState, loadGameState, loadStats } from './state.js';
import { setupDailyAyah, navigateSlider, showHint, endDailyGame, handleShareClick } from './game.js';
import { populateReciterDropdown, groupSurahsByJuz, populateJuzGrid, handleJuzSelection, renderSurahListPage, renderStatsModal, startNewChallenge, startReviewMode, showDifficultySelection, handleSurahSearch } from './ui.js';

// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize theme
        applyColorScheme(localStorage.getItem('quranle_color_scheme') || 'system');
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (localStorage.getItem('quranle_color_scheme') === 'system') {
                applyColorScheme('system');
            }
        });
        
        // Load saved state
        loadStats();
        loadGameState();
        
        // Load core data
        const coreData = await loadCoreData();
        appState.quran.allSurahs = coreData.surahs;
        coreData.surahs.forEach(s => appState.quran.surahMeta.set(s.number, s));
        appState.quran.english = coreData.english;
        appState.quran.reciters = coreData.reciters;
        
        // Populate UI
        populateReciterDropdown();
        
        // Load Arabic and audio data
        const scriptStyleSelect = document.getElementById('script-style-select');
        const reciterSelect = document.getElementById('reciter-select');
        const [arabicData, audioData] = await Promise.all([
            fetchEdition(scriptStyleSelect.value),
            fetchEdition(reciterSelect.value)
        ]);
        
        appState.quran.arabic = arabicData;
        appState.quran.audio = audioData;
        
        // Setup UI components
        groupSurahsByJuz();
        populateJuzGrid();
        
        // Show appropriate screen
        if (!localStorage.getItem('quranle_help_seen')) {
            hideModal(document.getElementById('loading-overlay'));
            showModal(document.getElementById('how-to-play-modal'));
        } else {
            showDifficultySelection();
        }
        
    } catch (err) {
        console.error("Initialization failed:", err);
        const loadingOverlay = document.getElementById('loading-overlay');
        const spinner = loadingOverlay.querySelector('.spinner');
        if (spinner) spinner.style.display = 'none';
        const loadingMessage = document.getElementById('loading-message');
        loadingMessage.innerHTML = `
            <div class="text-center">
                <p class="text-red-500 font-bold text-lg">Oops! Something went wrong.</p>
                <p class="text-sm mt-2 text-slate-400">Could not load the challenge. Please check your internet connection and refresh the page.</p>
            </div>
        `;
    }
});

// Event listeners
const eventListeners = {
    '#difficulty-buttons': {
        'click': (e) => {
            if (e.target.closest('.difficulty-btn')) {
                const btn = e.target.closest('.difficulty-btn');
                const difficulty = btn.dataset.difficulty;
                const progress = appState.user.progress[difficulty];
                
                if (progress && progress.completed) {
                    startReviewMode(difficulty);
                } else {
                    startNewChallenge(difficulty);
                }
            }
        }
    },
    '#return-to-difficulty-btn': { 'click': showDifficultySelection },
    '#back-to-difficulty-btn': { 'click': showDifficultySelection },
    '#close-modal-btn': {
        'click': () => {
            hideModal(document.getElementById('how-to-play-modal'));
            localStorage.setItem('quranle_help_seen', 'true');
            showDifficultySelection();
        }
    },
    '#help-btn': { 'click': () => showModal(document.getElementById('how-to-play-modal')) },
    '#surah-search-input': { 'input': handleSurahSearch },
    '#reciter-select': {
        'change': async () => {
            const playButton = document.getElementById('play-button');
            const pauseButton = document.getElementById('pause-button');
            const audioLoadingSpinner = document.getElementById('audio-loading-spinner');
            
            playButton.classList.add('hidden');
            pauseButton.classList.add('hidden');
            audioLoadingSpinner.classList.remove('hidden');
            
            try {
                const reciterSelect = document.getElementById('reciter-select');
                appState.quran.audio = await fetchEdition(reciterSelect.value);
                // Update audio context would be called here
            } catch (e) {
                console.error("Reciter change failed", e);
            } finally {
                audioLoadingSpinner.classList.add('hidden');
                playButton.classList.remove('hidden');
            }
        }
    },
    '#script-style-select': {
        'change': async () => {
            const loadingOverlay = document.getElementById('loading-overlay');
            const loadingMessage = document.getElementById('loading-message');
            
            showModal(loadingOverlay);
            loadingMessage.textContent = 'Changing script style...';
            
            try {
                const scriptStyleSelect = document.getElementById('script-style-select');
                appState.quran.arabic = await fetchEdition(scriptStyleSelect.value);
                setupDailyAyah();
                // Update hint button UI would be called here
            } catch (e) {
                console.error("Script change failed", e);
            } finally {
                hideModal(loadingOverlay);
            }
        }
    },
    '#hint-button': { 'click': showHint },
    '#next-ayah-btn': { 'click': () => navigateSlider(appState.challenge.visiblePaneIndex + 1) },
    '#prev-ayah-btn': { 'click': () => navigateSlider(appState.challenge.visiblePaneIndex - 1) },
    '#play-button': { 'click': () => document.getElementById('ayah-audio').play() },
    '#pause-button': { 'click': () => document.getElementById('ayah-audio').pause() },
    '#prev-surah-page': {
        'click': () => {
            if (appState.ui.surahListPage > 0) {
                appState.ui.surahListPage--;
                renderSurahListPage();
            }
        }
    },
    '#next-surah-page': {
        'click': () => {
            const totalPages = Math.ceil(appState.ui.currentSurahList.length / 6);
            if (appState.ui.surahListPage < totalPages - 1) {
                appState.ui.surahListPage++;
                renderSurahListPage();
            }
        }
    },
    '#theme-btn': { 'click': () => showModal(document.getElementById('theme-modal')) },
    '#close-theme-btn': { 'click': () => hideModal(document.getElementById('theme-modal')) },
    '#theme-light-btn': { 'click': () => applyColorScheme('light') },
    '#theme-dark-btn': { 'click': () => applyColorScheme('dark') },
    '#theme-system-btn': { 'click': () => applyColorScheme('system') },
    '#stats-btn': {
        'click': () => {
            renderStatsModal();
            showModal(document.getElementById('stats-modal'));
        }
    },
    '#close-stats-btn': { 'click': () => hideModal(document.getElementById('stats-modal')) },
    '#give-up-button': { 'click': () => endDailyGame(false, true) },
    '#share-button': { 'click': handleShareClick }
};

// Initialize event listeners
for (const selector in eventListeners) {
    const element = document.querySelector(selector);
    if (element) {
        for (const event in eventListeners[selector]) {
            element.addEventListener(event, eventListeners[selector][event]);
        }
    }
}

// Audio element event listeners
const audioElement = document.getElementById('ayah-audio');
if (audioElement) {
    audioElement.addEventListener('play', () => {
        const playButton = document.getElementById('play-button');
        const pauseButton = document.getElementById('pause-button');
        playButton.classList.add('hidden');
        pauseButton.classList.remove('hidden');
    });
    
    audioElement.addEventListener('pause', () => {
        const playButton = document.getElementById('play-button');
        const pauseButton = document.getElementById('pause-button');
        pauseButton.classList.add('hidden');
        playButton.classList.remove('hidden');
    });
    
    audioElement.addEventListener('ended', () => {
        const playButton = document.getElementById('play-button');
        const pauseButton = document.getElementById('pause-button');
        pauseButton.classList.add('hidden');
        playButton.classList.remove('hidden');
    });
}
