/**
 * GAME LOGIC
 * Core game mechanics and challenge management
 */

import { getDailyIndex, showModal, hideModal, showNotification } from './utils.js';
import { fetchTafsir } from './api.js';
import { appState, DIFFICULTIES, BASMALA, MAX_HINTS, saveGameState, updateStats } from './state.js';

// Get daily ayah for specific difficulty (used for Hard mode exclusions)
function getDailyAyahForDifficulty(difficulty) {
    let pool;
    switch(difficulty) {
        case 'Easy': 
            pool = appState.quran.arabic.filter(a => a.juz === 30); 
            break;
        case 'Medium': 
            pool = appState.quran.arabic.filter(a => a.surah.number >= 36); 
            break;
        default: 
            return null;
    }
    
    if (!pool || pool.length === 0) return null;
    const ayahIndex = getDailyIndex(appState.user.date, pool.length, difficulty);
    return pool[ayahIndex];
}

// Setup the daily challenge ayah
export function setupDailyAyah() {
    const { currentDifficulty } = appState.ui;
    const difficultySettings = DIFFICULTIES[currentDifficulty];
    let pool;
    
    if (currentDifficulty === 'Hard') {
        const easyAyah = getDailyAyahForDifficulty('Easy');
        const mediumAyah = getDailyAyahForDifficulty('Medium');
        pool = appState.quran.arabic;
        
        if (easyAyah) {
            pool = pool.filter(a => 
                a.number !== easyAyah.number && 
                a.surah.number !== easyAyah.surah.number && 
                a.juz !== easyAyah.juz
            );
        }
        if (mediumAyah) {
            pool = pool.filter(a => 
                a.number !== mediumAyah.number && 
                a.surah.number !== mediumAyah.surah.number && 
                a.juz !== mediumAyah.juz
            );
        }
    } else {
        switch(difficultySettings.scope) {
            case 'easy': 
                pool = appState.quran.arabic.filter(a => a.juz === 30); 
                break;
            case 'medium': 
                pool = appState.quran.arabic.filter(a => a.surah.number >= 36); 
                break;
            default: 
                pool = appState.quran.arabic;
        }
    }
    
    if (!pool || pool.length === 0) {
        console.error("CRITICAL ERROR: Ayah pool is empty for difficulty: " + currentDifficulty);
        const loadingOverlay = document.getElementById('loading-overlay');
        const spinner = loadingOverlay.querySelector('.spinner');
        if (spinner) spinner.style.display = 'none';
        const loadingMessage = document.getElementById('loading-message');
        loadingMessage.innerHTML = `
            <div class="text-center">
                <p class="text-red-500 font-bold text-lg">Data Error</p>
                <p class="text-sm mt-2 text-slate-400">Could not create a challenge for this difficulty. Please refresh and try again.</p>
            </div>
        `;
        showModal(loadingOverlay);
        return;
    }
    
    const ayahIndex = getDailyIndex(appState.user.date, pool.length, currentDifficulty);
    const currentAyah = pool[ayahIndex];
    
    const progress = appState.user.progress[currentDifficulty];
    let unlockedAyahs = 1;
    
    if (progress && progress.unlockedAyahs && Number.isInteger(progress.unlockedAyahs) && progress.unlockedAyahs > 1) {
        unlockedAyahs = Math.min(progress.unlockedAyahs, MAX_HINTS + 1);
    }
    
    const allChallengeAyahs = [currentAyah];
    let lastAyah = currentAyah;
    
    for (let i = 1; i < unlockedAyahs; i++) {
        const nextAyah = appState.quran.arabic.find(a => 
            a.number === lastAyah.number + 1 && 
            a.surah.number === lastAyah.surah.number
        );
        if (nextAyah) {
            allChallengeAyahs.push(nextAyah);
            lastAyah = nextAyah;
        } else {
            break;
        }
    }
    
    let visiblePaneIndex = 0;
    if (progress && Number.isInteger(progress.lastPaneIndex) && progress.lastPaneIndex < allChallengeAyahs.length) {
        visiblePaneIndex = progress.lastPaneIndex;
    }
    
    appState.challenge = { currentAyah, allChallengeAyahs, visiblePaneIndex };
    
    const ayahSlider = document.getElementById('ayah-slider');
    const translationSlider = document.getElementById('translation-slider');
    ayahSlider.innerHTML = '';
    translationSlider.innerHTML = '';
    
    allChallengeAyahs.forEach(ayah => {
        createPane(ayahSlider, ayah, true);
        createPane(translationSlider, ayah, false);
    });
    
    navigateSlider(visiblePaneIndex, false);
}

// Create ayah display pane
function createPane(slider, ayah, isArabic) {
    const pane = document.createElement('div');
    pane.className = 'w-full flex-shrink-0 min-h-[5rem] flex flex-col items-center justify-center px-4 md:px-6';
    
    if (isArabic) {
        let ayahText = ayah.text;
        
        // Handle Basmala for first ayah of surah (except Al-Fatiha and At-Tawbah)
        if (ayah.numberInSurah === 1 && ayah.surah.number !== 1 && ayah.surah.number !== 9 && ayah.text.startsWith(BASMALA)) {
            const basmalaP = document.createElement('p');
            basmalaP.className = 'basmala-text font-amiri text-center text-sm text-subtle-text-light dark:text-subtle-text-dark mb-2';
            basmalaP.textContent = BASMALA.trim();
            pane.appendChild(basmalaP);
            ayahText = ayahText.substring(BASMALA.length);
        }
        
        const p = document.createElement('p');
        p.className = 'arabic-text';
        p.innerHTML = ayahText + `<span class="ayah-number">${ayah.numberInSurah}</span>`;
        pane.appendChild(p);
    } else {
        const englishAyah = appState.quran.english.find(a => a.number === ayah.number);
        const p = document.createElement('p');
        p.className = 'text-subtle-text-light dark:text-subtle-text-dark italic text-center max-w-2xl';
        p.textContent = englishAyah ? `"${englishAyah.text}"` : "";
        pane.appendChild(p);
    }
    
    slider.appendChild(pane);
}

// Navigate between ayah panes
export function navigateSlider(targetIndex, animate = true) {
    if (targetIndex < 0 || targetIndex >= appState.challenge.allChallengeAyahs.length) return;
    
    appState.challenge.visiblePaneIndex = targetIndex;
    const { currentDifficulty } = appState.ui;
    
    if (appState.user.progress[currentDifficulty]) {
        appState.user.progress[currentDifficulty].lastPaneIndex = targetIndex;
        saveGameState();
    }
    
    const translateX = `translateX(-${targetIndex * 100}%)`;
    const ayahSlider = document.getElementById('ayah-slider');
    const translationSlider = document.getElementById('translation-slider');
    
    [ayahSlider, translationSlider].forEach(slider => {
        slider.style.transition = animate ? 'transform 0.5s ease-in-out' : 'none';
        slider.style.transform = translateX;
    });
    
    updateContextForVisibleAyah();
    
    const prevAyahBtn = document.getElementById('prev-ayah-btn');
    const nextAyahBtn = document.getElementById('next-ayah-btn');
    prevAyahBtn.classList.toggle('hidden', targetIndex === 0);
    nextAyahBtn.classList.toggle('hidden', targetIndex === appState.challenge.allChallengeAyahs.length - 1);
}

// Update audio context for visible ayah
function updateContextForVisibleAyah() {
    const ayah = appState.challenge.allChallengeAyahs[appState.challenge.visiblePaneIndex];
    if (!ayah) return;
    
    const audioElement = document.getElementById('ayah-audio');
    audioElement.pause();
    audioElement.currentTime = 0;
    
    if (appState.quran.audio.length > 0) {
        const audioAyah = appState.quran.audio.find(a => a.number === ayah.number);
        if (audioAyah) audioElement.src = audioAyah.audio;
    }
}

// Update attempts UI display
export function updateAttemptsUI() {
    const { currentDifficulty, isReviewMode } = appState.ui;
    const progress = appState.user.progress[currentDifficulty];
    const maxAttempts = DIFFICULTIES[currentDifficulty].attempts;
    
    const attemptsDisplay = document.getElementById('attempts-display');
    attemptsDisplay.innerHTML = '';
    
    for (let i = 0; i < maxAttempts; i++) {
        const circle = document.createElement('div');
        circle.className = 'attempt-circle h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600';
        attemptsDisplay.appendChild(circle);
        
        if (i < progress.attempts.length) {
            const attempt = progress.attempts[i];
            setTimeout(() => {
                circle.classList.add('filled');
                circle.style.backgroundColor = attempt.correct ? 'var(--correct-color)' : 'var(--incorrect-color)';
                circle.style.borderColor = attempt.correct ? 'var(--correct-color)' : 'var(--incorrect-color)';
            }, i * 100);
        }
    }
    
    const attemptsSubtitle = document.getElementById('attempts-subtitle');
    if (isReviewMode) {
        attemptsSubtitle.textContent = `(${currentDifficulty}) Review Mode - Your previous attempts`;
    } else {
        const attemptsLeft = maxAttempts - progress.attempts.length;
        attemptsSubtitle.textContent = `(${currentDifficulty}) You have ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`;
        if (progress.completed) {
            attemptsSubtitle.textContent = `(${currentDifficulty}) Challenge complete!`;
        }
    }
}

// Process user's surah guess
export function checkGuess(surahNumber) {
    const { currentDifficulty, isReviewMode } = appState.ui;
    const progress = appState.user.progress[currentDifficulty];
    
    if (isReviewMode || progress.completed) return;
    
    const isCorrect = surahNumber === appState.challenge.currentAyah.surah.number;
    progress.attempts.push({ surahNumber, correct: isCorrect });
    
    updateAttemptsUI();
    
    // Re-render surah list to show guess status
    if (window.renderSurahListPage) {
        window.renderSurahListPage();
    }
    
    if (isCorrect) {
        progress.solved = true;
        endDailyGame(true);
    } else {
        const guessedButton = document.querySelector(`.surah-card[data-surah-number='${surahNumber}']`);
        if (guessedButton) guessedButton.disabled = true;
        
        if (progress.attempts.length === 1 && !progress.completed && !progress.hintUsed) {
            if (DIFFICULTIES[currentDifficulty].hint) {
                const hintButton = document.getElementById('hint-button');
                hintButton.classList.remove('hidden');
            }
        }
        
        if (progress.attempts.length >= 1) {
            const giveUpButton = document.getElementById('give-up-button');
            giveUpButton.classList.remove('hidden');
        }
        
        if (progress.attempts.length >= DIFFICULTIES[currentDifficulty].attempts) {
            endDailyGame(false);
        }
    }
    
    saveGameState();
}

// Show hint (next ayah)
export function showHint() {
    const { allChallengeAyahs, currentAyah } = appState.challenge;
    if (allChallengeAyahs.length > MAX_HINTS) {
        showNotification("No more hints available.");
        return;
    }
    
    const nextAyah = appState.quran.arabic.find(a => 
        a.number === currentAyah.number + allChallengeAyahs.length
    );
    
    if (!nextAyah || nextAyah.surah.number !== currentAyah.surah.number) {
        showNotification("This is the last ayah of the Surah!");
        const hintButton = document.getElementById('hint-button');
        hintButton.disabled = true;
        return;
    }
    
    allChallengeAyahs.push(nextAyah);
    
    const ayahSlider = document.getElementById('ayah-slider');
    const translationSlider = document.getElementById('translation-slider');
    createPane(ayahSlider, nextAyah, true);
    createPane(translationSlider, nextAyah, false);
    
    navigateSlider(allChallengeAyahs.length - 1);
    
    const { currentDifficulty } = appState.ui;
    appState.user.progress[currentDifficulty].hintUsed = true;
    appState.user.progress[currentDifficulty].unlockedAyahs = allChallengeAyahs.length;
    appState.user.progress[currentDifficulty].lastPaneIndex = allChallengeAyahs.length - 1;
    
    const hintButton = document.getElementById('hint-button');
    hintButton.classList.add('hidden');
    saveGameState();
}

// End the daily game
export function endDailyGame(isWin, isGiveUp = false) {
    const { currentDifficulty } = appState.ui;
    const progress = appState.user.progress[currentDifficulty];
    
    if (progress.completed) return;
    
    progress.completed = true;
    document.querySelectorAll('.surah-card, .juz-btn, #hint-button, #surah-search-input, #give-up-button')
        .forEach(el => el.disabled = true);
    
    const hintButton = document.getElementById('hint-button');
    const giveUpButton = document.getElementById('give-up-button');
    const prevAyahBtn = document.getElementById('prev-ayah-btn');
    const nextAyahBtn = document.getElementById('next-ayah-btn');
    
    hintButton.classList.add('hidden');
    giveUpButton.classList.add('hidden');
    prevAyahBtn.classList.add('hidden');
    nextAyahBtn.classList.add('hidden');
    
    const message = isWin 
        ? `<p class="text-green-400">MashAllah, correct!</p>` 
        : (isGiveUp 
            ? `<p class="text-slate-400">Challenge ended.</p>` 
            : `<p class="text-red-400">Better luck next time!</p>`);
    
    const { surah } = appState.challenge.currentAyah;
    const feedbackMessage = document.getElementById('feedback-message');
    feedbackMessage.innerHTML = `${message}<p class="text-base text-subtle-text-light dark:text-subtle-text-dark">The Ayah is from Surah ${surah.englishName} (${surah.name}).</p>`;
    
    fetchAndDisplayTafsir(surah.number);
    updateStats(isWin, progress.attempts.length);
    saveGameState();
    showPostGameOptions();
}

// Display tafsir information
async function fetchAndDisplayTafsir(surahNumber) {
    const tafsirContainer = document.createElement('div');
    tafsirContainer.className = "mt-4 p-4 bg-slate-100 dark:bg-slate-800/60 rounded-lg w-full max-w-2xl text-left";
    
    const currentAyah = appState.challenge.currentAyah;
    const ayahNumber = currentAyah ? currentAyah.numberInSurah : 1;
    
    tafsirContainer.innerHTML = `
        <h4 class="font-bold text-base text-[var(--primary-hover)] dark:text-[var(--primary-color)] mb-2">Surah Insight</h4>
        <p class="text-sm text-subtle-text-light dark:text-subtle-text-dark italic">Loading tafsir information...</p>
    `;
    
    const feedbackMessage = document.getElementById('feedback-message');
    feedbackMessage.appendChild(tafsirContainer);
    
    try {
        const response = await fetchTafsir(surahNumber, ayahNumber);
        
        if (!response) throw new Error("Invalid response from tafsir API");
        
        let tafsirContent = '';
        const surahInfo = appState.quran.surahMeta.get(surahNumber);
        const surahName = surahInfo ? surahInfo.englishName : `Surah ${surahNumber}`;
        
        tafsirContent += `<h4 class="font-bold text-base text-[var(--primary-hover)] dark:text-[var(--primary-color)] mb-2">${surahName} (${surahNumber}:${ayahNumber}) - Tafsir</h4>`;
        
        if (response && response.tafsirs && response.tafsirs.length > 0) {
            const firstTafsir = response.tafsirs[0];
            if (firstTafsir && firstTafsir.content && firstTafsir.content.length > 0) {
                const maxLength = 800;
                let displayText = firstTafsir.content;
                if (displayText.length > maxLength) {
                    displayText = displayText.substring(0, maxLength) + '...';
                }
                const formattedText = displayText.replace(/\n\n/g, '</p><p class="mb-2">').replace(/\n/g, '<br>');
                tafsirContent += `<div class="text-sm text-subtle-text-light dark:text-subtle-text-dark leading-relaxed space-y-2"><p>${formattedText}</p></div>`;
                tafsirContent += `<p class="text-xs text-slate-400 dark:text-slate-500 mt-3">Source: ${firstTafsir.author}</p>`;
                const quranComUrl = `https://quran.com/${surahNumber}:${ayahNumber}/tafsirs/en-tafisr-ibn-kathir`;
                tafsirContent += `<div class="mt-3 pt-3 border-t border-border-light dark:border-border-dark"><a href="${quranComUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center text-xs text-[var(--primary-hover)] dark:text-[var(--primary-color)] hover:underline transition-colors">Continue reading on Quran.com<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a></div>`;
            } else {
                tafsirContent += `<p class="text-sm text-subtle-text-light dark:text-subtle-text-dark italic">Tafsir information not available for this ayah.</p>`;
            }
        } else {
            tafsirContent += `<p class="text-sm text-subtle-text-light dark:text-subtle-text-dark italic">Tafsir information not available for this ayah.</p>`;
        }
        tafsirContainer.innerHTML = tafsirContent;
    } catch (error) {
        console.error("Failed to fetch Tafsir:", error);
        let errorMessage = "Could not load tafsir information at this time.";
        if (error.name === 'AbortError') errorMessage = "Tafsir request timed out.";
        tafsirContainer.innerHTML = `
            <h4 class="font-bold text-base text-[var(--primary-hover)] dark:text-[var(--primary-color)] mb-2">Surah Insight</h4>
            <p class="text-sm text-subtle-text-light dark:text-subtle-text-dark italic">${errorMessage}</p>
        `;
    }
}

// Show post-game options
function showPostGameOptions() {
    const shareButton = document.getElementById('share-button');
    const postGameOptions = document.getElementById('post-game-options');
    shareButton.classList.remove('hidden');
    postGameOptions.classList.remove('hidden', 'fade-in');
    void postGameOptions.offsetWidth;
    postGameOptions.classList.add('fade-in');
}

// Handle share functionality
export function handleShareClick() {
    const { user, ui } = appState;
    const result = user.progress[ui.currentDifficulty];
    const attemptsStr = result.attempts.map(a => a.correct ? '🟩' : '🟥').join('');
    const attemptCount = result.solved ? result.attempts.length : 'X';
    const text = `Tadabbur ${new Date().toLocaleDateString('en-GB')}\nDifficulty: ${ui.currentDifficulty}\n${attemptCount}/${DIFFICULTIES[ui.currentDifficulty].attempts} Guesses\n${attemptsStr}`;
    
    if (navigator.share) {
        navigator.share({ title: 'Tadabbur Results', text: text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Results copied to clipboard!');
        }, () => {
            showNotification('Failed to copy results.');
        });
    }
}
