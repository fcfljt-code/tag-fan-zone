// Galerie - Erinnerungen mit Bild-Upload
// TSG 1899 Hoffenheim Fan-Website

const GALERIE_STORAGE_KEY = 'tsg_hoffenheim_galerie';

// Galerie-Bilder aus localStorage laden
function getGalerieItems() {
    const items = localStorage.getItem(GALERIE_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
}

// Galerie-Bilder speichern
function saveGalerieItems(items) {
    localStorage.setItem(GALERIE_STORAGE_KEY, JSON.stringify(items));
}

// Neues Galerie-Item erstellen
function createGalerieItem(title, imageData, date = null) {
    const items = getGalerieItems();

    const newItem = {
        id: Date.now(),
        title: title,
        image: imageData,
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
    };

    items.unshift(newItem);
    saveGalerieItems(items);

    return newItem;
}

// Galerie-Item löschen
function deleteGalerieItem(id) {
    const items = getGalerieItems();
    const filteredItems = items.filter(item => item.id !== id);
    saveGalerieItems(filteredItems);
}

// Datum formatieren
function formatGalerieDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Galerie rendern
function renderGalerie() {
    const container = document.getElementById('galerie-container');
    const items = getGalerieItems();
    const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;

    // Upload-Bereich anzeigen/verstecken
    const uploadContainer = document.getElementById('galerie-upload');
    if (uploadContainer) {
        uploadContainer.style.display = loggedIn ? 'block' : 'none';
    }

    if (items.length === 0) {
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
                    <button class="galerie-delete-btn" onclick="confirmDeleteGalerie(${item.id})" title="Löschen">&#128465;</button>
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
function openLightboxGalerie(index) {
    const items = getGalerieItems();
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
function navigateLightboxGalerie(direction) {
    const lightbox = document.getElementById('lightbox');
    if (lightbox?.dataset.source !== 'galerie') return;

    const items = getGalerieItems();
    let currentIndex = parseInt(lightbox.dataset.currentIndex) || 0;

    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % items.length;
    } else {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
    }

    openLightboxGalerie(currentIndex);
}

// Galerie-Item löschen mit Bestätigung
function confirmDeleteGalerie(id) {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        showNotification('Bitte melde dich an.', 'warning');
        return;
    }

    if (confirm('Möchtest du diese Erinnerung wirklich löschen?')) {
        deleteGalerieItem(id);
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
            reader.onload = (event) => {
                createGalerieItem(title, event.target.result, date);
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
