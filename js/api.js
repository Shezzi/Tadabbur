/**
 * API & DATA FETCHING
 * Handles all external API calls and data management
 */

export const API_BASE_URL = 'https://api.alquran.cloud/v1';

// Generic fetch wrapper with error handling
export async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} for URL: ${url}`);
    }
    return response.json();
}

// Load core Quran data (surahs, translations, reciters)
export async function loadCoreData() {
    const [surahListJson, englishJson, reciterJson] = await Promise.all([
        fetchJSON(`${API_BASE_URL}/surah`),
        fetchJSON(`${API_BASE_URL}/quran/en.sahih`),
        fetchJSON(`${API_BASE_URL}/edition?format=audio&language=ar`)
    ]);
    
    return {
        surahs: surahListJson.data,
        english: englishJson.data.surahs.flatMap(s => s.ayahs),
        reciters: reciterJson.data.sort((a, b) => a.englishName.localeCompare(b.englishName))
    };
}

// Fetch specific Quran edition (Arabic text, audio, etc.)
export async function fetchEdition(edition) {
    if (!edition) throw new Error("Fetch edition called with no identifier.");
    const json = await fetchJSON(`${API_BASE_URL}/quran/${edition}`);
    return json.data.surahs.flatMap(s => 
        s.ayahs.map(a => ({ 
            ...a, 
            surah: { number: s.number, ...s }
        }))
    );
}

// Fetch Tafsir (commentary) for specific ayah
export async function fetchTafsir(surahNumber, ayahNumber) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    try {
        const response = await fetchJSON(
            `https://quranapi.pages.dev/api/tafsir/${surahNumber}_${ayahNumber}.json`, 
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}
