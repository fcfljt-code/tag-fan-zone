// Galerie - Erinnerungen mit Bild-Upload
// TSG 1899 Hoffenheim Fan-Website

const GALERIE_STORAGE_KEY = 'tsg_hoffenheim_galerie';
const MAX_IMAGE_WIDTH = 1200;  // Maximale Bildbreite
const MAX_IMAGE_HEIGHT = 1200; // Maximale Bildhöhe
const IMAGE_QUALITY = 0.8;     // JPEG-Qualität (0-1)
const FIREBASE_RETRY_ATTEMPTS = 3; // Anzahl Versuche bei Firebase-Fehlern
const FIREBASE_RETRY_DELAY = 1000; // Wartezeit zwischen Versuchen (ms)

// Prüfen ob Firebase verfügbar ist
function isFirebaseEnabledGalerie() {
    const enabled = typeof window.FIREBASE_ENABLED !== 'undefined' && window.FIREBASE_ENABLED === true;
    console.log('🔥 Firebase Galerie Status:', enabled ? 'AKTIV' : 'INAKTIV');
    return enabled;
}

// Hilfsfunktion: Warten
function waitGalerie(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Hilfsfunktion: Mit Retry ausführen
async function executeWithRetry(operation, operationName, maxAttempts = FIREBASE_RETRY_ATTEMPTS) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`🔄 ${operationName} - Versuch ${attempt}/${maxAttempts}...`);
            const result = await operation();
            console.log(`✅ ${operationName} - Erfolgreich!`);
            return result;
        } catch (error) {
            lastError = error;
            console.warn(`⚠️ ${operationName} - Versuch ${attempt} fehlgeschlagen:`, error.message);
            if (attempt < maxAttempts) {
                console.log(`⏳ Warte ${FIREBASE_RETRY_DELAY}ms vor nächstem Versuch...`);
                await waitGalerie(FIREBASE_RETRY_DELAY);
            }
        }
    }
    console.error(`❌ ${operationName} - Alle ${maxAttempts} Versuche fehlgeschlagen!`);
    throw lastError;
}

// Bild komprimieren um Firebase 1MB Limit einzuhalten
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Canvas erstellen
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Größe anpassen wenn nötig
                if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
                    const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                canvas.width = width;
                canvas.height = height;

                // Bild auf Canvas zeichnen
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // Als JPEG komprimieren
                const compressedDataUrl = canvas.toDataURL('image/jpeg', IMAGE_QUALITY);

                // Größe in KB berechnen
                const sizeKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
                console.log(`📸 Bild komprimiert: ${img.width}x${img.height} → ${width}x${height}, ${sizeKB}KB`);

                resolve(compressedDataUrl);
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Galerie-Bilder aus Firebase oder localStorage laden (mit Sync-Prüfung)
async function getGalerieItems() {
    console.log('📥 Lade Galerie-Items...');

    if (isFirebaseEnabledGalerie()) {
        try {
            const firebaseItems = await executeWithRetry(
                () => getFirebaseGalerie(),
                'Firebase Galerie laden'
            );

            if (firebaseItems && firebaseItems.length > 0) {
                console.log('🔥 Firebase Galerie geladen:', firebaseItems.length, 'Items');

                // Prüfe auf nicht synchronisierte lokale Items
                const localItems = JSON.parse(localStorage.getItem(GALERIE_STORAGE_KEY) || '[]');
                const unsyncedItems = localItems.filter(item => item.firebaseSynced === false);

                if (unsyncedItems.length > 0) {
                    console.log('⚠️ Gefundene nicht synchronisierte Items:', unsyncedItems.length);
                    // Versuche nicht synchronisierte Items zu Firebase hochzuladen
                    for (const item of unsyncedItems) {
                        try {
                            console.log('🔄 Synchronisiere lokales Item:', item.title);
                            await saveFirebaseGalerieBild(item);
                            console.log('✅ Item synchronisiert:', item.title);
                        } catch (syncError) {
                            console.warn('⚠️ Synchronisation fehlgeschlagen für:', item.title);
                        }
                    }
                    // Neu laden nach Sync-Versuch
                    const updatedItems = await getFirebaseGalerie();
                    return updatedItems;
                }

                return firebaseItems;
            } else {
                console.log('ℹ️ Firebase Galerie leer, prüfe localStorage');
            }
        } catch (error) {
            console.warn('⚠️ Firebase Galerie laden fehlgeschlagen:', error.message);
        }
    }

    // Fallback: localStorage
    const items = localStorage.getItem(GALERIE_STORAGE_KEY);
    const localItems = items ? JSON.parse(items) : [];
    console.log('💾 Lokale Galerie geladen:', localItems.length, 'Items');
    return localItems;
}

// Galerie-Bilder in localStorage speichern (Backup)
function saveGalerieItemsLocal(items) {
    localStorage.setItem(GALERIE_STORAGE_KEY, JSON.stringify(items));
}

// Neues Galerie-Item erstellen (mit robuster Firebase-Speicherung)
async function createGalerieItem(title, imageData, date = null) {
    const newItem = {
        title: title,
        image: imageData,
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    console.log('📸 Erstelle neues Galerie-Item:', title);

    // IMMER zuerst in localStorage speichern als Backup
    const localId = Date.now();
    const localItem = { ...newItem, id: localId };
    const localItems = JSON.parse(localStorage.getItem(GALERIE_STORAGE_KEY) || '[]');
    localItems.unshift(localItem);
    saveGalerieItemsLocal(localItems);
    console.log('💾 Lokales Backup erstellt mit ID:', localId);

    // Dann Firebase mit Retry-Logik
    if (isFirebaseEnabledGalerie()) {
        try {
            const firebaseId = await executeWithRetry(
                () => saveFirebaseGalerieBild(newItem),
                'Firebase Galerie speichern'
            );

            // Aktualisiere lokales Item mit Firebase-ID
            newItem.id = firebaseId;
            const updatedLocalItems = localItems.map(item =>
                item.id === localId ? { ...item, id: firebaseId, firebaseSynced: true } : item
            );
            saveGalerieItemsLocal(updatedLocalItems);

            console.log('🔥 Firebase Galerie-Item gespeichert mit ID:', firebaseId);

            // Verifizieren, dass das Item in Firebase existiert
            try {
                const verifyItems = await getFirebaseGalerie();
                const exists = verifyItems.some(item => item.id === firebaseId);
                if (exists) {
                    console.log('✅ Firebase Verifizierung erfolgreich - Item existiert');
                } else {
                    console.warn('⚠️ Firebase Verifizierung - Item nicht gefunden, prüfe später');
                }
            } catch (verifyError) {
                console.warn('⚠️ Firebase Verifizierung fehlgeschlagen:', verifyError);
            }

            return newItem;
        } catch (error) {
            console.error('❌ Firebase Speicherung endgültig fehlgeschlagen:', error);
            console.log('⚠️ Daten wurden lokal gespeichert und werden beim nächsten Sync versucht');
            // Markiere lokales Item als nicht synchronisiert
            const unsyncedItems = localItems.map(item =>
                item.id === localId ? { ...item, firebaseSynced: false } : item
            );
            saveGalerieItemsLocal(unsyncedItems);
            return localItem;
        }
    }

    console.log('ℹ️ Firebase nicht aktiv - nur lokale Speicherung');
    return localItem;
}

// Galerie-Item löschen (mit Retry-Logik)
async function deleteGalerieItem(id) {
    console.log('🗑️ Lösche Galerie-Item:', id);

    // Zuerst aus localStorage löschen
    const items = JSON.parse(localStorage.getItem(GALERIE_STORAGE_KEY) || '[]');
    const filteredItems = items.filter(item => item.id != id);
    saveGalerieItemsLocal(filteredItems);
    console.log('💾 Aus lokalem Speicher gelöscht');

    // Dann aus Firebase löschen
    if (isFirebaseEnabledGalerie()) {
        try {
            await executeWithRetry(
                () => deleteFirebaseGalerieBild(id),
                'Firebase Galerie löschen'
            );
            console.log('🔥 Aus Firebase gelöscht');
        } catch (error) {
            console.warn('⚠️ Firebase Löschen fehlgeschlagen (lokal bereits entfernt):', error);
        }
    }
}

// Datum formatieren (unterstützt Firebase Timestamps und ISO-Strings)
function formatGalerieDate(dateValue) {
    if (!dateValue) return 'Unbekannt';

    let date;
    // Firebase Timestamp
    if (typeof dateValue === 'object') {
        if (typeof dateValue.toDate === 'function') {
            date = dateValue.toDate();
        } else if (dateValue.seconds) {
            date = new Date(dateValue.seconds * 1000);
        } else {
            date = new Date(dateValue);
        }
    } else {
        date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return 'Unbekannt';
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Galerie rendern
async function renderGalerie() {
    const items = await getGalerieItems();
    renderGalerieWithData(items);
}

// Galerie mit übergebenen Daten rendern (für Realtime Updates)
function renderGalerieWithData(items) {
    const container = document.getElementById('galerie-container');
    if (!container) return;

    const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;

    // Upload-Bereich anzeigen/verstecken
    const uploadContainer = document.getElementById('galerie-upload');
    if (uploadContainer) {
        uploadContainer.style.display = loggedIn ? 'block' : 'none';
    }

    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="galerie-empty">
                <div class="empty-icon">&#128247;</div>
                <h3>Noch keine Erinnerungen</h3>
                <p>Hier werden bald Jean-Pierre's schönste TSG-Momente erscheinen!</p>
                ${loggedIn ? '<p class="hint">Klicke oben auf "Neue Erinnerung hinzufügen" um zu starten.</p>' : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = items.map((item, index) => `
        <div class="galerie-card" data-id="${item.id}" data-index="${index}">
            <div class="galerie-card-image">
                <img src="${item.image}" alt="${escapeHtmlGalerie(item.title)}" loading="lazy">
                <div class="galerie-card-overlay">
                    <button class="galerie-view-btn" onclick="openLightboxGalerie(${index})">&#128269; Ansehen</button>
                </div>
            </div>
            <div class="galerie-card-info">
                <h4>${escapeHtmlGalerie(item.title)}</h4>
                <span class="galerie-date">${formatGalerieDate(item.date)}</span>
                ${loggedIn ? `
                    <button class="galerie-delete-btn" onclick="confirmDeleteGalerie('${item.id}')" title="Löschen">&#128465;</button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// HTML escapen
function escapeHtmlGalerie(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Lightbox für Galerie öffnen
async function openLightboxGalerie(index) {
    const items = await getGalerieItems();
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = lightbox?.querySelector('.lightbox-image');
    const lightboxCaption = lightbox?.querySelector('.lightbox-caption');

    if (lightbox && lightboxImage && items[index]) {
        lightboxImage.src = items[index].image;
        if (lightboxCaption) {
            lightboxCaption.innerHTML = `<strong>${escapeHtmlGalerie(items[index].title)}</strong><br>${formatGalerieDate(items[index].date)}`;
        }
        lightbox.classList.add('active');
        lightbox.dataset.currentIndex = index;
        lightbox.dataset.source = 'galerie';
        document.body.style.overflow = 'hidden';
    }
}

// Lightbox Navigation für Galerie
async function navigateLightboxGalerie(direction) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox?.dataset.source !== 'galerie') return;

    const items = await getGalerieItems();
    let currentIndex = parseInt(lightbox.dataset.currentIndex) || 0;

    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % items.length;
    } else {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
    }

    openLightboxGalerie(currentIndex);
}

// Galerie-Item löschen mit Bestätigung
async function confirmDeleteGalerie(id) {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        showNotification('Bitte melde dich an.', 'warning');
        return;
    }

    if (confirm('Möchtest du diese Erinnerung wirklich löschen?')) {
        await deleteGalerieItem(id);
        renderGalerie();
        showNotification('Erinnerung wurde gelöscht.', 'info');
    }
}

// Bild-Vorschau für Galerie
function updateGaleriePreview(input) {
    const preview = document.getElementById('galerie-preview');
    const previewContainer = document.getElementById('galerie-preview-container');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Galerie-Vorschau entfernen
function removeGaleriePreview() {
    const preview = document.getElementById('galerie-preview');
    const previewContainer = document.getElementById('galerie-preview-container');
    const input = document.getElementById('galerie-image');

    preview.src = '';
    previewContainer.style.display = 'none';
    if (input) input.value = '';
}

// Manuelle Sync-Funktion für Galerie (global verfügbar)
window.syncGalerieToFirebase = async function() {
    console.log('🔄 Manueller Galerie-Sync gestartet...');

    if (!isFirebaseEnabledGalerie()) {
        console.log('❌ Firebase nicht aktiv');
        showNotification('Firebase ist nicht aktiviert.', 'warning');
        return;
    }

    const localItems = JSON.parse(localStorage.getItem(GALERIE_STORAGE_KEY) || '[]');
    const unsyncedItems = localItems.filter(item => item.firebaseSynced === false);

    if (unsyncedItems.length === 0) {
        console.log('✅ Alle Items sind bereits synchronisiert');
        showNotification('Alle Erinnerungen sind bereits synchronisiert.', 'success');
        return;
    }

    showNotification(`Synchronisiere ${unsyncedItems.length} Erinnerungen...`, 'info');

    let syncedCount = 0;
    for (const item of unsyncedItems) {
        try {
            const firebaseId = await saveFirebaseGalerieBild(item);
            // Aktualisiere lokales Item
            const updatedItems = localItems.map(localItem =>
                localItem.id === item.id
                    ? { ...localItem, id: firebaseId, firebaseSynced: true }
                    : localItem
            );
            saveGalerieItemsLocal(updatedItems);
            syncedCount++;
            console.log('✅ Synchronisiert:', item.title);
        } catch (error) {
            console.error('❌ Sync fehlgeschlagen für:', item.title, error);
        }
    }

    showNotification(`${syncedCount}/${unsyncedItems.length} Erinnerungen synchronisiert.`, syncedCount === unsyncedItems.length ? 'success' : 'warning');
    renderGalerie();
};

// Force Refresh der Galerie von Firebase
window.forceRefreshGalerie = async function() {
    console.log('🔄 Force Refresh der Galerie...');
    showNotification('Lade Galerie von Firebase...', 'info');

    try {
        if (isFirebaseEnabledGalerie()) {
            const items = await getFirebaseGalerie();
            console.log('🔥 Firebase Galerie:', items.length, 'Items');
            renderGalerieWithData(items);
            showNotification(`${items.length} Erinnerungen von Firebase geladen.`, 'success');
        } else {
            const localItems = JSON.parse(localStorage.getItem(GALERIE_STORAGE_KEY) || '[]');
            renderGalerieWithData(localItems);
            showNotification('Firebase nicht aktiv - lokale Daten geladen.', 'info');
        }
    } catch (error) {
        console.error('❌ Force Refresh fehlgeschlagen:', error);
        showNotification('Fehler beim Laden: ' + error.message, 'warning');
    }
};

// Event Listener
document.addEventListener('DOMContentLoaded', () => {
    renderGalerie();

    // Realtime Listener aktivieren für automatische Updates
    if (isFirebaseEnabledGalerie() && typeof listenToGalerie === 'function') {
        listenToGalerie((items) => {
            const container = document.getElementById('galerie-container');
            if (container) {
                renderGalerieWithData(items);
            }
        });
    }

    // Galerie-Formular
    const galerieForm = document.getElementById('galerie-form');
    if (galerieForm) {
        galerieForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
                showNotification('Bitte melde dich an.', 'warning');
                return;
            }

            const title = document.getElementById('galerie-title').value.trim();
            const date = document.getElementById('galerie-date').value;
            const imageInput = document.getElementById('galerie-image');

            if (!title) {
                showNotification('Bitte gib einen Titel ein.', 'warning');
                return;
            }

            if (!imageInput.files || !imageInput.files[0]) {
                showNotification('Bitte wähle ein Bild aus.', 'warning');
                return;
            }

            // Bild komprimieren und speichern
            try {
                showNotification('Bild wird komprimiert...', 'info');
                const compressedImage = await compressImage(imageInput.files[0]);

                showNotification('Speichere in Firebase...', 'info');
                const savedItem = await createGalerieItem(title, compressedImage, date);

                galerieForm.reset();
                removeGaleriePreview();

                // Prüfen ob Firebase-Sync erfolgreich war
                if (savedItem.firebaseSynced === false) {
                    showNotification('Lokal gespeichert. Firebase-Sync wird später versucht.', 'warning');
                } else if (isFirebaseEnabledGalerie()) {
                    showNotification('Erinnerung erfolgreich in Firebase gespeichert!', 'success');
                } else {
                    showNotification('Erinnerung lokal gespeichert.', 'success');
                }

                renderGalerie();
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                showNotification('Fehler beim Speichern: ' + error.message, 'warning');
            }
        });
    }

    // Bild-Input Change
    const galerieImageInput = document.getElementById('galerie-image');
    if (galerieImageInput) {
        galerieImageInput.addEventListener('change', function() {
            updateGaleriePreview(this);
        });
    }

    // Lightbox Navigation erweitern
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', () => navigateLightboxGalerie('prev'));
    }
    if (lightboxNext) {
        lightboxNext.addEventListener('click', () => navigateLightboxGalerie('next'));
    }
});
