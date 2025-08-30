/**
 * STATE MANAGEMENT
 * Handles application state and localStorage operations
 */

import { getTodayString } from './utils.js';

// Game configuration constants
export const DIFFICULTIES = { 
    Easy: { attempts: 5, hint: true, scope: 'easy' }, 
    Medium: { attempts: 5, hint: true, scope: 'medium' },
    Hard: { attempts: 3, hint: false, scope: 'hard' }
};

export const SURAHS_PER_PAGE = 6;
export const BASMALA = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ";
export const MAX_HINTS = 2;

// Centralized application state
export let appState = {
    quran: { 
        arabic: [], 
        english: [], 
        audio: [], 
        surahMeta: new Map(), 
        allSurahs: [], 
        juzData: {}, 
        reciters: [] 
    },
    challenge: { 
        currentAyah: null, 
        allChallengeAyahs: [], 
        visiblePaneIndex: 0 
    },
    user: {},
    stats: {},
    ui: { 
        isLoading: true, 
        isAudioLoading: false, 
        currentJuz: 1, 
        currentDifficulty: 'Easy', 
        currentSurahList: [], 
        surahListPage: 0, 
        isReviewMode: false 
    }
};

// User state management
const getInitialUserState = () => ({
    date: getTodayString(),
    progress: {
        Easy: { attempts: [], solved: false, completed: false, statsRecorded: false, hintUsed: false },
        Medium: { attempts: [], solved: false, completed: false, statsRecorded: false, hintUsed: false },
        Hard: { attempts: [], solved: false, completed: false, statsRecorded: false, hintUsed: false }
    }
});

export function loadGameState() {
    try {
        const storedState = localStorage.getItem('quranle_dailyState');
        if (storedState) {
            const parsedState = JSON.parse(storedState);
            if (parsedState.date === getTodayString()) {
                appState.user = parsedState;
                return;
            }
        }
    } catch (e) {
        console.error("Failed to load game state", e);
        localStorage.removeItem('quranle_dailyState');
    }
    appState.user = getInitialUserState();
}

export const saveGameState = () => {
    try {
        localStorage.setItem('quranle_dailyState', JSON.stringify(appState.user));
    } catch (e) {
        console.error("Failed to save game state", e);
    }
};

// Statistics management
const getInitialStats = () => ({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, 'fail': 0 }
});

export function loadStats() {
    try {
        const storedStats = localStorage.getItem('quranle_stats');
        appState.stats = storedStats ? JSON.parse(storedStats) : getInitialStats();
    } catch (e) {
        console.error("Failed to load stats", e);
        appState.stats = getInitialStats();
    }
}

export function saveStats() {
    try {
        localStorage.setItem('quranle_stats', JSON.stringify(appState.stats));
    } catch (e) {
        console.error("Failed to save stats", e);
    }
}

// Update statistics after game completion
export function updateStats(isWin, attemptCount) {
    const stats = appState.stats;
    const dailyProgress = appState.user.progress[appState.ui.currentDifficulty];
    
    if (dailyProgress.statsRecorded) return;
    
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    
    if (isWin) {
        stats.gamesWon = (stats.gamesWon || 0) + 1;
        stats.currentStreak = (stats.currentStreak || 0) + 1;
        stats.maxStreak = Math.max(stats.maxStreak || 0, stats.currentStreak);
        
        if (stats.guessDistribution[attemptCount] !== undefined) {
            stats.guessDistribution[attemptCount] = (stats.guessDistribution[attemptCount] || 0) + 1;
        }
    } else {
        stats.currentStreak = 0;
        stats.guessDistribution.fail = (stats.guessDistribution.fail || 0) + 1;
    }
    
    dailyProgress.statsRecorded = true;
    saveStats();
    saveGameState();
}
