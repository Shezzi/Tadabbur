/**
 * UI MANAGEMENT
 * Handles all UI updates and interactions
 */

import { appState, DIFFICULTIES, SURAHS_PER_PAGE, saveGameState } from './state.js';
import { showModal, hideModal } from './utils.js';
import { setupDailyAyah, updateAttemptsUI, checkGuess } from './game.js';

// Populate reciter dropdown
export function populateReciterDropdown() {
    const reciterSelect = document.getElementById('reciter-select');
    reciterSelect.innerHTML = '';
    
    appState.quran.reciters.forEach(reciter => {
        reciterSelect.add(new Option(reciter.englishName, reciter.identifier));
    });
    
    const preferredReciter = 'ar.alafasy';
    reciterSelect.value = appState.quran.reciters.some(r => r.identifier === preferredReciter) 
        ? preferredReciter 
        : reciterSelect.options[0].value;
}

// Group surahs by Juz
export function groupSurahsByJuz() {
    appState.quran.juzData = {};
    for (let i = 1; i <= 30; i++) appState.quran.juzData[i] = [];
    
    appState.quran.allSurahs.forEach(surah => {
        const ayahsInSurah = appState.quran.arabic.filter(a => a.surah.number === surah.number);
        const juzesInSurah = new Set(ayahsInSurah.map(a => a.juz));
        juzesInSurah.forEach(juz => {
            if (juz && appState.quran.juzData[juz]) {
                appState.quran.juzData[juz].push(surah);
            }
        });
    });
    
    for (let i = 1; i <= 30; i++) {
        if (appState.quran.juzData[i]) {
            appState.quran.juzData[i] = [...new Map(appState.quran.juzData[i].map(item => [item['number'], item])).values()];
            appState.quran.juzData[i].sort((a, b) => a.number - b.number);
        }
    }
}

// Populate Juz grid
export function populateJuzGrid() {
    const juzGridContainer = document.getElementById('juz-grid-container');
    juzGridContainer.innerHTML = '';
    
    for (let i = 1; i <= 30; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.dataset.juz = i;
        btn.className = 'juz-btn p-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-emerald-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-card-dark focus:ring-[var(--primary-hover)]';
        btn.onclick = () => handleJuzSelection(i);
        juzGridContainer.appendChild(btn);
    }
}

// Handle Juz selection
export function handleJuzSelection(juzNumber) {
    const surahSearchInput = document.getElementById('surah-search-input');
    surahSearchInput.value = '';
    appState.ui.currentJuz = juzNumber;
    
    document.querySelectorAll('.juz-btn.active').forEach(btn =>
        btn.classList.remove('active', 'bg-[var(--primary-color)]', 'text-[var(--primary-text)]')
    );
    
    const activeJuzBtn = document.querySelector(`.juz-btn[data-juz='${juzNumber}']`);
    if (activeJuzBtn) {
        activeJuzBtn.classList.add('active', 'bg-[var(--primary-color)]', 'text-[var(--primary-text)]');
    }
    
    setSurahList(appState.quran.juzData[juzNumber] || []);
}

// Set surah list and reset pagination
function setSurahList(surahArray) {
    appState.ui.currentSurahList = surahArray;
    appState.ui.surahListPage = 0;
    renderSurahListPage();
}

// Render current page of surah list
export function renderSurahListPage() {
    const { currentSurahList, surahListPage, isReviewMode, currentDifficulty } = appState.ui;
    const start = surahListPage * SURAHS_PER_PAGE;
    const end = start + SURAHS_PER_PAGE;
    const pageSurahs = currentSurahList.slice(start, end);
    
    const surahListContainer = document.getElementById('surah-list-container');
    surahListContainer.innerHTML = '';
    
    const progress = appState.user.progress[currentDifficulty];
    const guessedSurahNumbers = new Set(progress.attempts.map(a => a.surahNumber));
    
    pageSurahs.forEach(surah => {
        const btn = document.createElement('button');
        btn.dataset.surahNumber = surah.number;
        btn.className = 'surah-card block w-full text-left p-3 rounded-lg bg-card-light dark:bg-card-dark hover:bg-slate-200 dark:hover:bg-slate-800 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:bg-slate-100 dark:disabled:bg-slate-800/50 border border-border-light dark:border-border-dark';
        
        if (!isReviewMode) {
            btn.onclick = () => checkGuess(surah.number);
        }
        
        let statusIndicator = '';
        if (guessedSurahNumbers.has(surah.number)) {
            const attempt = progress.attempts.find(a => a.surahNumber === surah.number);
            if (attempt && attempt.correct) {
                statusIndicator = `<span class="text-green-400 ml-2 font-bold">✓</span>`;
            } else {
                statusIndicator = `<span class="text-red-400 ml-2 font-bold">✗</span>`;
            }
        }
        
        btn.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <span class="mr-4 text-sm font-bold text-emerald-600 dark:text-[var(--primary-color)] w-6 text-center">${surah.number}.</span>
                    <div>
                        <p class="font-semibold text-text-light dark:text-text-dark">${surah.englishName}</p>
                        <p class="text-sm text-subtle-text-light dark:text-subtle-text-dark">${surah.name}</p>
                    </div>
                </div>
                <div class="flex items-center">
                    <span class="text-xs text-subtle-text-light dark:text-subtle-text-dark font-medium uppercase">${surah.revelationType}</span>
                    ${statusIndicator}
                </div>
            </div>
        `;
        
        if (progress.completed || guessedSurahNumbers.has(surah.number) || isReviewMode) {
            btn.disabled = true;
        }
        surahListContainer.appendChild(btn);
    });
    
    if (pageSurahs.length === 0 && currentSurahList.length === 0) {
        const surahSearchInput = document.getElementById('surah-search-input');
        surahListContainer.innerHTML = `<p class="text-center text-subtle-text-light dark:text-subtle-text-dark p-4">${surahSearchInput.value ? 'No Surahs found.' : 'Select a Juz'}</p>`;
    }
    
    const totalPages = Math.ceil(currentSurahList.length / SURAHS_PER_PAGE);
    const surahPageIndicator = document.getElementById('surah-page-indicator');
    surahPageIndicator.textContent = `${surahListPage + 1} / ${totalPages || 1}`;
    
    const prevSurahPage = document.getElementById('prev-surah-page');
    const nextSurahPage = document.getElementById('next-surah-page');
    prevSurahPage.disabled = surahListPage === 0;
    nextSurahPage.disabled = surahListPage >= totalPages - 1;
}

// Make renderSurahListPage globally available
window.renderSurahListPage = renderSurahListPage;

// Render statistics modal
export function renderStatsModal() {
    const stats = appState.stats;
    const statsPlayed = document.getElementById('stats-played');
    const statsWinPct = document.getElementById('stats-win-pct');
    const statsCurrentStreak = document.getElementById('stats-current-streak');
    const statsMaxStreak = document.getElementById('stats-max-streak');
    
    statsPlayed.textContent = stats.gamesPlayed || 0;
    statsWinPct.textContent = (stats.gamesPlayed || 0) > 0 
        ? Math.round(((stats.gamesWon || 0) / stats.gamesPlayed) * 100) 
        : 0;
    statsCurrentStreak.textContent = stats.currentStreak || 0;
    statsMaxStreak.textContent = stats.maxStreak || 0;
    
    const distContainer = document.getElementById('guess-distribution-chart');
    distContainer.innerHTML = '';
    const distribution = stats.guessDistribution || {};
    const maxDistribution = Math.max(1, ...Object.values(distribution));
    
    for (let i = 1; i <= DIFFICULTIES['Easy'].attempts; i++) {
        const count = distribution[i] || 0;
        if (count === undefined && i > DIFFICULTIES['Hard'].attempts) continue;
        const percentage = (count / maxDistribution) * 100;
        distContainer.innerHTML += `
            <div class="flex items-center gap-4 text-sm">
                <div class="font-mono text-slate-400 w-4">${i}</div>
                <div class="flex-grow h-5 bg-slate-700 rounded-sm">
                    <div class="h-full stat-bar rounded-sm" style="width: ${percentage}%"></div>
                </div>
                <div class="font-bold w-8 text-right">${count}</div>
            </div>
        `;
    }
    
    const failCount = distribution.fail || 0;
    const failPercentage = (failCount / maxDistribution) * 100;
    distContainer.innerHTML += `
        <div class="flex items-center gap-4 text-sm">
            <div class="font-mono text-slate-400 w-4">X</div>
            <div class="flex-grow h-5 bg-slate-700 rounded-sm">
                <div class="h-full rounded-sm" style="width: ${failPercentage}%; background-color: var(--incorrect-color);"></div>
            </div>
            <div class="font-bold w-8 text-right">${failCount}</div>
        </div>
    `;
}

// Start new challenge
export function startNewChallenge(newDifficulty) {
    const difficultyModal = document.getElementById('difficulty-modal');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const gameContainer = document.getElementById('game-container');
    
    hideModal(difficultyModal);
    showModal(loadingOverlay);
    loadingMessage.textContent = `Loading ${newDifficulty} challenge...`;
    
    appState.ui.currentDifficulty = newDifficulty;
    appState.ui.isReviewMode = false;
    
    // Reset UI states
    const feedbackMessage = document.getElementById('feedback-message');
    const postGameOptions = document.getElementById('post-game-options');
    const hintButton = document.getElementById('hint-button');
    const giveUpButton = document.getElementById('give-up-button');
    const shareButton = document.getElementById('share-button');
    const prevAyahBtn = document.getElementById('prev-ayah-btn');
    const nextAyahBtn = document.getElementById('next-ayah-btn');
    
    feedbackMessage.innerHTML = '';
    postGameOptions.classList.add('hidden');
    hintButton.classList.add('hidden');
    giveUpButton.classList.add('hidden');
    shareButton.classList.add('hidden');
    hintButton.disabled = false;
    giveUpButton.disabled = false;
    prevAyahBtn.classList.add('hidden');
    nextAyahBtn.classList.add('hidden');
    
    const surahSelectionTitle = document.getElementById('surah-selection-title');
    const surahSearchInput = document.getElementById('surah-search-input');
    surahSelectionTitle.textContent = 'Select a Surah';
    surahSearchInput.placeholder = 'Search Surah...';
    surahSearchInput.disabled = false;
    
    document.querySelectorAll('.surah-card, .juz-btn').forEach(el => el.disabled = false);
    
    const difficultyScope = DIFFICULTIES[newDifficulty].scope;
    const juzGridContainer = document.getElementById('juz-grid-container');
    juzGridContainer.querySelectorAll('.juz-btn').forEach(btn => {
        btn.style.display = 'flex';
        if (difficultyScope === 'easy' && btn.dataset.juz !== '30') {
            btn.style.display = 'none';
        }
    });
    
    setupDailyAyah();
    updateAttemptsUI();
    
    const initialJuz = difficultyScope === 'easy' ? 30 : 1;
    handleJuzSelection(initialJuz);
    
    hideModal(loadingOverlay);
    showModal(gameContainer);
    gameContainer.classList.add('opacity-100');
}

// Start review mode
export function startReviewMode(difficulty) {
    const difficultyModal = document.getElementById('difficulty-modal');
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    const gameContainer = document.getElementById('game-container');
    
    hideModal(difficultyModal);
    showModal(loadingOverlay);
    loadingMessage.textContent = `Loading ${difficulty} review...`;
    
    appState.ui.currentDifficulty = difficulty;
    appState.ui.isReviewMode = true;
    
    // Reset UI states
    const feedbackMessage = document.getElementById('feedback-message');
    const postGameOptions = document.getElementById('post-game-options');
    const hintButton = document.getElementById('hint-button');
    const giveUpButton = document.getElementById('give-up-button');
    const shareButton = document.getElementById('share-button');
    const prevAyahBtn = document.getElementById('prev-ayah-btn');
    const nextAyahBtn = document.getElementById('next-ayah-btn');
    
    feedbackMessage.innerHTML = '';
    postGameOptions.classList.add('hidden');
    hintButton.classList.add('hidden');
    giveUpButton.classList.add('hidden');
    shareButton.classList.add('hidden');
    prevAyahBtn.classList.add('hidden');
    nextAyahBtn.classList.add('hidden');
    
    const surahSelectionTitle = document.getElementById('surah-selection-title');
    const surahSearchInput = document.getElementById('surah-search-input');
    surahSelectionTitle.textContent = 'Your Previous Guesses';
    surahSearchInput.placeholder = 'Search disabled in review mode';
    surahSearchInput.disabled = true;
    
    document.querySelectorAll('.surah-card, .juz-btn').forEach(el => el.disabled = true);
    
    const difficultyScope = DIFFICULTIES[difficulty].scope;
    const juzGridContainer = document.getElementById('juz-grid-container');
    juzGridContainer.querySelectorAll('.juz-btn').forEach(btn => {
        btn.style.display = 'flex';
        if (difficultyScope === 'easy' && btn.dataset.juz !== '30') {
            btn.style.display = 'none';
        }
    });
    
    setupDailyAyah();
    updateAttemptsUI();
    showReviewResults();
    
    const initialJuz = difficultyScope === 'easy' ? 30 : 1;
    handleJuzSelection(initialJuz);
    
    hideModal(loadingOverlay);
    showModal(gameContainer);
    gameContainer.classList.add('opacity-100');
}

// Show review results
function showReviewResults() {
    const { currentDifficulty } = appState.ui;
    const progress = appState.user.progress[currentDifficulty];
    const { surah } = appState.challenge.currentAyah;
    
    const message = progress.solved
        ? `<p class="text-green-400">Correct! You solved this challenge.</p>`
        : `<p class="text-red-400">Challenge completed. Here's the correct answer:</p>`;
    
    const feedbackMessage = document.getElementById('feedback-message');
    feedbackMessage.innerHTML = `${message}<p class="text-base text-subtle-text-light dark:text-subtle-text-dark">The Ayah is from Surah ${surah.englishName} (${surah.name}).</p>`;
    
    // Fetch tafsir would be called here
    
    const shareButton = document.getElementById('share-button');
    const postGameOptions = document.getElementById('post-game-options');
    shareButton.classList.remove('hidden');
    postGameOptions.classList.remove('hidden', 'fade-in');
    void postGameOptions.offsetWidth;
    postGameOptions.classList.add('fade-in');
}

// Show difficulty selection
export function showDifficultySelection() {
    const { progress } = appState.user;
    let allChallengesAreCompleted = true;
    
    const difficultyButtons = document.getElementById('difficulty-buttons');
    difficultyButtons.querySelectorAll('.difficulty-btn').forEach(btn => {
        const difficulty = btn.dataset.difficulty;
        const difficultyProgress = progress[difficulty];
        const difficultyText = btn.querySelector('.difficulty-text');
        const difficultySubtitle = btn.querySelector('.difficulty-subtitle');
        
        if (difficultyProgress && difficultyProgress.completed) {
            btn.disabled = false;
            btn.classList.add('completed-challenge');
            difficultyText.textContent = 'Review';
            difficultySubtitle.textContent = difficulty;
        } else {
            allChallengesAreCompleted = false;
            btn.disabled = false;
            btn.classList.remove('completed-challenge');
            difficultyText.textContent = difficulty;
            // Reset subtitle text in case it was changed to 'Review'
            if (difficulty === 'Easy') difficultySubtitle.textContent = 'Juz Amma (30)';
            if (difficulty === 'Medium') difficultySubtitle.textContent = 'Surah 36-114';
            if (difficulty === 'Hard') difficultySubtitle.textContent = 'Full Qur\'an';
        }
    });
    
    const allChallengesDoneMessage = document.getElementById('all-challenges-done-message');
    allChallengesDoneMessage.classList.toggle('hidden', !allChallengesAreCompleted);
    
    const gameContainer = document.getElementById('game-container');
    const loadingOverlay = document.getElementById('loading-overlay');
    const difficultyModal = document.getElementById('difficulty-modal');
    
    hideModal(gameContainer);
    hideModal(loadingOverlay);
    showModal(difficultyModal);
}

// Handle surah search
export function handleSurahSearch() {
    if (appState.ui.isReviewMode) return;
    
    const surahSearchInput = document.getElementById('surah-search-input');
    const query = surahSearchInput.value.toLowerCase().trim();
    const difficultyScope = DIFFICULTIES[appState.ui.currentDifficulty].scope;
    
    let searchPool = appState.quran.allSurahs;
    if (difficultyScope === 'easy') {
        searchPool = appState.quran.juzData[30] || [];
    } else if (difficultyScope === 'medium') {
        searchPool = appState.quran.allSurahs.filter(s => s.number >= 36);
    }
    
    if (!query) {
        handleJuzSelection(appState.ui.currentJuz);
        return;
    }
    
    document.querySelectorAll('.juz-btn.active').forEach(btn =>
        btn.classList.remove('active', 'bg-[var(--primary-color)]', 'text-[var(--primary-text)]')
    );
    
    const results = searchPool.filter(s =>
        s.englishName.toLowerCase().includes(query) ||
        s.name.includes(query) ||
        String(s.number).includes(query)
    );
    
    setSurahList(results);
}
