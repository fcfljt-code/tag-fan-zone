// Main JavaScript - TSG 1899 Hoffenheim Fan-Website
// Navigation, Lightbox, Sprüche, Spieler

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSprueche();
    initSpieler();
    initGalerie();
    initLightbox();
});

// Mobile Navigation
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        // Menü schließen bei Klick auf Link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // Smooth Scroll für Anker-Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Fan-Sprüche Carousel mit localStorage
const SPRUECHE_KEY = 'tsg_fan_sprueche';

// Standard-Sprüche
const DEFAULT_SPRUECHE = [
    { id: 1, text: "Hoffenheim, Hoffenheim, du bist mein Verein!", autor: "TSG Fans" },
    { id: 2, text: "Achtzehn99 - Mehr als nur ein Verein!", autor: "TSG Fans" },
    { id: 3, text: "Von der Kreisliga in die Bundesliga - das ist unsere Geschichte!", autor: "TSG Fans" },
    { id: 4, text: "Blau und Weiß ein Leben lang, TSG Hoffenheim!", autor: "TSG Fans" },
    { id: 5, text: "Wir sind Hoffenheim, wir sind stark, wir geben niemals auf!", autor: "TSG Fans" },
    { id: 6, text: "PreZero Arena - Unser Zuhause, unsere Festung!", autor: "TSG Fans" },
    { id: 7, text: "Egal ob Sieg oder Niederlage - wir stehen hinter dir, TSG!", autor: "TSG Fans" },
    { id: 8, text: "Kraichgau-Power - Hoffenheim für immer!", autor: "TSG Fans" }
];

// Sprüche aus localStorage laden
function getSprueche() {
    const saved = localStorage.getItem(SPRUECHE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_SPRUECHE;
}

// Sprüche speichern
function saveSprueche(sprueche) {
    localStorage.setItem(SPRUECHE_KEY, JSON.stringify(sprueche));
}

// Neuen Spruch hinzufügen
function addSpruch(text, autor) {
    const sprueche = getSprueche();
    const newSpruch = {
        id: Date.now(),
        text: text,
        autor: autor || 'TSG Fan'
    };
    sprueche.push(newSpruch);
    saveSprueche(sprueche);
    return newSpruch;
}

// Spruch löschen
function deleteSpruch(id) {
    let sprueche = getSprueche();
    sprueche = sprueche.filter(s => s.id !== id);
    saveSprueche(sprueche);
}

function initSprueche() {
    const container = document.getElementById('sprueche-container');
    const prevBtn = document.getElementById('prev-spruch');
    const nextBtn = document.getElementById('next-spruch');
    const counter = document.getElementById('spruch-counter');

    // Sprüche laden
    const sprueche = getSprueche();

    let currentIndex = 0;

    function renderSprueche() {
        container.innerHTML = sprueche.map((spruch, index) => `
            <div class="spruch-card ${index === currentIndex ? 'active' : ''}">
                <blockquote>
                    <p>"${spruch.text}"</p>
                    <cite>- ${spruch.autor}</cite>
                </blockquote>
            </div>
        `).join('');

        updateCounter();
    }

    function updateCounter() {
        if (counter) {
            counter.textContent = `${currentIndex + 1} / ${sprueche.length}`;
        }
    }

    function showSpruch(index) {
        const cards = container.querySelectorAll('.spruch-card');
        cards.forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });
        updateCounter();
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + sprueche.length) % sprueche.length;
            showSpruch(currentIndex);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % sprueche.length;
            showSpruch(currentIndex);
        });
    }

    renderSprueche();

    // Auto-Rotation alle 8 Sekunden
    setInterval(() => {
        currentIndex = (currentIndex + 1) % sprueche.length;
        showSpruch(currentIndex);
    }, 8000);

    // Sprüche-Editor initialisieren (nur für Admin)
    initSprucheEditor();
}

// Sprüche-Editor initialisieren
function initSprucheEditor() {
    const editor = document.getElementById('sprueche-editor');
    const form = document.getElementById('spruch-form');
    const listContainer = document.getElementById('sprueche-list');

    // Editor nur anzeigen wenn eingeloggt
    function updateEditorVisibility() {
        const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;
        if (editor) {
            editor.style.display = loggedIn ? 'block' : 'none';
        }
    }

    // Sprüche-Liste rendern
    function renderSprucheListe() {
        if (!listContainer) return;

        const sprueche = getSprueche();
        listContainer.innerHTML = `
            <h4>Aktuelle Sprüche (${sprueche.length})</h4>
            <div class="sprueche-items">
                ${sprueche.map(s => `
                    <div class="spruch-item" data-id="${s.id}">
                        <div class="spruch-item-content">
                            <span class="spruch-item-text">"${s.text}"</span>
                            <span class="spruch-item-autor">- ${s.autor}</span>
                        </div>
                        <button class="btn-icon btn-icon-danger" onclick="handleDeleteSpruch(${s.id})" title="Löschen">
                            &#128465;
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Formular-Submit Handler
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const textInput = document.getElementById('spruch-text');
            const autorInput = document.getElementById('spruch-autor');

            const text = textInput.value.trim();
            const autor = autorInput.value.trim() || 'TSG Fans';

            if (text) {
                addSpruch(text, autor);
                textInput.value = '';
                autorInput.value = 'TSG Fans';

                // Carousel und Liste neu rendern
                initSprueche();
                renderSprucheListe();

                if (typeof showNotification === 'function') {
                    showNotification('Spruch wurde hinzugefügt!', 'success');
                }
            }
        });
    }

    updateEditorVisibility();
    renderSprucheListe();

    // Global verfügbar machen
    window.updateSprucheEditor = () => {
        updateEditorVisibility();
        renderSprucheListe();
    };
}

// Spruch löschen Handler (global)
function handleDeleteSpruch(id) {
    if (confirm('Diesen Spruch wirklich löschen?')) {
        deleteSpruch(id);
        initSprueche();

        if (typeof showNotification === 'function') {
            showNotification('Spruch wurde gelöscht!', 'success');
        }
    }
}

// Spieler-Kader laden - Saison 2025/26
const SPIELER_BILDER_KEY = 'tsg_spieler_bilder';

function initSpieler() {
    const container = document.getElementById('spieler-container');

    // Aktueller Kader TSG 1899 Hoffenheim - Saison 2025/26
    // Stand: 30.01.2026 - Quelle: TSG-Hoffenheim.de
    const spieler = [
        // Torwart
        { name: "Oliver Baumann", position: "Torwart", nummer: 1 },
        { name: "Lúkas Petersson", position: "Torwart", nummer: 36 },
        { name: "Luca Philipp", position: "Torwart", nummer: 37 },
        // Abwehr
        { name: "Robin Hranáč", position: "Abwehr", nummer: 2 },
        { name: "Ozan Kabak", position: "Abwehr", nummer: 5 },
        { name: "Bernardo", position: "Abwehr", nummer: 13 },
        { name: "Valentin Gendrey", position: "Abwehr", nummer: 15 },
        { name: "Albian Hajdari", position: "Abwehr", nummer: 21 },
        { name: "Kevin Akpoguma", position: "Abwehr", nummer: 25 },
        { name: "Koki Machida", position: "Abwehr", nummer: 28 },
        { name: "Vladimír Coufal", position: "Abwehr", nummer: 34 },
        { name: "Kelven Frees", position: "Abwehr", nummer: 45 },
        // Mittelfeld
        { name: "Grischa Prömel", position: "Mittelfeld", nummer: 6 },
        { name: "Leon Avdullahu", position: "Mittelfeld", nummer: 7 },
        { name: "Dennis Geiger", position: "Mittelfeld", nummer: 8 },
        { name: "Muhammed Damar", position: "Mittelfeld", nummer: 10 },
        { name: "Wouter Burger", position: "Mittelfeld", nummer: 18 },
        { name: "Cole Campbell", position: "Mittelfeld", nummer: 20 },
        { name: "Alexander Prass", position: "Mittelfeld", nummer: 22 },
        { name: "Luka Đurić", position: "Mittelfeld", nummer: 48 },
        // Angriff
        { name: "Ihlas Bebou", position: "Angriff", nummer: 9 },
        { name: "Fisnik Asllani", position: "Angriff", nummer: 11 },
        { name: "Tim Lemperle", position: "Angriff", nummer: 19 },
        { name: "Adam Hložek", position: "Angriff", nummer: 23 },
        { name: "Andrej Kramarić", position: "Angriff", nummer: 27 },
        { name: "Bazoumana Touré", position: "Angriff", nummer: 29 },
        { name: "Mergim Berisha", position: "Angriff", nummer: 32 },
        { name: "Max Moerstedt", position: "Angriff", nummer: 33 },
        { name: "Deniz Zeitler", position: "Angriff", nummer: 38 }
    ];

    // Gespeicherte Spielerbilder laden
    function getSavedImages() {
        const saved = localStorage.getItem(SPIELER_BILDER_KEY);
        return saved ? JSON.parse(saved) : {};
    }

    // Spielerbild speichern
    window.saveSpielerBild = function(nummer, imageData) {
        const images = getSavedImages();
        images[nummer] = imageData;
        localStorage.setItem(SPIELER_BILDER_KEY, JSON.stringify(images));
    };

    // Generiere Avatar-URL basierend auf Namen
    function getAvatarUrl(name) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1a55ab&color=fff&size=180&font-size=0.4&bold=true`;
    }

    // Prüfen ob eingeloggt (für Edit-Button)
    const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;
    const savedImages = getSavedImages();

    if (container) {
        container.innerHTML = spieler.map(s => {
            const hasImage = savedImages[s.nummer];
            const imageUrl = hasImage || getAvatarUrl(s.name);

            return `
            <div class="spieler-card" data-nummer="${s.nummer}">
                <div class="spieler-image">
                    <img src="${imageUrl}"
                         alt="${s.name}"
                         onerror="this.onerror=null; this.src='${getAvatarUrl(s.name)}'"
                         loading="lazy">
                    <span class="spieler-number">${s.nummer}</span>
                    ${loggedIn ? `
                    <div class="spieler-btn-group">
                        <button class="spieler-upload-btn" onclick="uploadSpielerBild(${s.nummer}, '${s.name}')" title="Bild ändern">
                            📷
                        </button>
                        ${hasImage ? `<button class="spieler-delete-btn" onclick="deleteSpielerBild(${s.nummer}, '${s.name}')" title="Bild löschen">
                            🗑️
                        </button>` : ''}
                    </div>` : ''}
                </div>
                <div class="spieler-info">
                    <div class="spieler-name">${s.name}</div>
                    <div class="spieler-position">${s.position}</div>
                </div>
            </div>
        `}).join('');
    }
}

// Spielerbild Upload-Dialog
function uploadSpielerBild(nummer, name) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                saveSpielerBild(nummer, imageData);

                // Spieler-Kader neu rendern
                initSpieler();

                if (typeof showNotification === 'function') {
                    showNotification(`Bild für ${name} wurde hinzugefügt!`, 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    };

    input.click();
}

// Spielerbild löschen
function deleteSpielerBild(nummer, name) {
    if (confirm(`Bild für ${name} wirklich löschen?`)) {
        const images = JSON.parse(localStorage.getItem(SPIELER_BILDER_KEY) || '{}');
        delete images[nummer];
        localStorage.setItem(SPIELER_BILDER_KEY, JSON.stringify(images));

        // Spieler-Kader neu rendern
        initSpieler();

        if (typeof showNotification === 'function') {
            showNotification(`Bild für ${name} wurde gelöscht!`, 'success');
        }
    }
}

// Galerie initialisieren
function initGalerie() {
    const container = document.getElementById('galerie-container');

    // Beispielbilder (in der Praxis würden diese aus dem Ordner geladen)
    // Der Benutzer legt seine Bilder in images/erinnerungen/ ab
    const beispielBilder = [];

    if (container && beispielBilder.length > 0) {
        container.innerHTML = beispielBilder.map((bild, index) => `
            <div class="galerie-item" data-index="${index}">
                <img src="${bild.src}" alt="${bild.alt || 'Erinnerung'}">
            </div>
        `).join('');
    }
    // Wenn keine Bilder da sind, bleibt der Placeholder
}

// Lightbox für Galerie
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = lightbox?.querySelector('.lightbox-image');
    const closeBtn = lightbox?.querySelector('.lightbox-close');
    const prevBtn = lightbox?.querySelector('.lightbox-prev');
    const nextBtn = lightbox?.querySelector('.lightbox-next');

    let currentImages = [];
    let currentIndex = 0;

    // Klick auf Galerie-Items
    document.addEventListener('click', (e) => {
        const galerieItem = e.target.closest('.galerie-item');
        if (galerieItem && lightbox) {
            const img = galerieItem.querySelector('img');
            if (img) {
                // Alle Bilder sammeln
                currentImages = Array.from(document.querySelectorAll('.galerie-item img')).map(i => i.src);
                currentIndex = parseInt(galerieItem.dataset.index) || 0;

                lightboxImage.src = img.src;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    });

    // Lightbox schließen
    function closeLightbox() {
        if (lightbox) {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }

    // Navigation
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
            lightboxImage.src = currentImages[currentIndex];
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % currentImages.length;
            lightboxImage.src = currentImages[currentIndex];
        });
    }

    // ESC zum Schließen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft' && prevBtn) {
            prevBtn.click();
        } else if (e.key === 'ArrowRight' && nextBtn) {
            nextBtn.click();
        }
    });

    // Klick außerhalb schließt Lightbox
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                closeLightbox();
            }
        });
    }
}
