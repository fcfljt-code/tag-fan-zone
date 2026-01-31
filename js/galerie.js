// Galerie - Erinnerungen mit Bild-Upload
// TSG 1899 Hoffenheim Fan-Website

const GALERIE_STORAGE_KEY = 'tsg_hoffenheim_galerie';

// Prüfen ob Firebase verfügbar ist
function isFirebaseEnabledGalerie() {
    return typeof window.FIREBASE_ENABLED !== 'undefined' && window.FIREBASE_ENABLED === true;
}

// Galerie-Bilder aus Firebase oder localStorage laden
async function getGalerieItems() {
    if (isFirebaseEnabledGalerie()) {
        try {
            const items = await getFirebaseGalerie();
            if (items && items.length > 0) return items;
        } catch (error) {
            console.warn('Firebase Fehler, verwende localStorage:', error);
        }
    }
    // Fallback: localStorage
    const items = localStorage.getItem(GALERIE_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
}

// Galerie-Bilder in localStorage speichern (Backup)
function saveGalerieItemsLocal(items) {
    localStorage.setItem(GALERIE_STORAGE_KEY, JSON.stringify(items));
}

// Neues Galerie-Item erstellen
async function createGalerieItem(title, imageData, date = null) {
    const newItem = {
        title: title,
        image: imageData,
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    if (isFirebaseEnabledGalerie()) {
        try {
            const id = await saveFirebaseGalerieBild(newItem);
            newItem.id = id;
            return newItem;
        } catch (error) {
            console.warn('Firebase Fehler, verwende localStorage:', error);
        }
    }

    // Fallback: localStorage
    newItem.id = Date.now();
    const items = JSON.parse(localStorage.getItem(GALERIE_STORAGE_KEY) || '[]');
    items.unshift(newItem);
    saveGalerieItemsLocal(items);

    return newItem;
}

// Galerie-Item löschen
async function deleteGalerieItem(id) {
    if (isFirebaseEnabledGalerie()) {
        try {
            await deleteFirebaseGalerieBild(id);
            return;
        } catch (error) {
            console.warn('Firebase Fehler, verwende localStorage:', error);
        }
    }

    // Fallback: localStorage
    const items = JSON.parse(localStorage.getItem(GALERIE_STORAGE_KEY) || '[]');
    const filteredItems = items.filter(item => item.id != id);
    saveGalerieItemsLocal(filteredItems);
}

// Datum formatieren
function formatGalerieDate(dateString) {
    const date = new Date(dateString);
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

            // Bild zu Base64 konvertieren
            const reader = new FileReader();
            reader.onload = async (event) => {
                await createGalerieItem(title, event.target.result, date);
                galerieForm.reset();
                removeGaleriePreview();
                renderGalerie();
                showNotification('Erinnerung wurde gespeichert!', 'success');
            };
            reader.readAsDataURL(imageInput.files[0]);
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
