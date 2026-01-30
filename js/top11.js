// Top 11 des Spieltages
// TSG 1899 Hoffenheim Fan-Website

const TOP11_STORAGE_KEY = 'tsg_hoffenheim_top11';

// Top 11 aus localStorage laden
function getTop11() {
    const data = localStorage.getItem(TOP11_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
}

// Top 11 speichern
function saveTop11(data) {
    localStorage.setItem(TOP11_STORAGE_KEY, JSON.stringify(data));
}

// Top 11 anzeigen
function renderTop11() {
    const data = getTop11();
    const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;

    // Editor anzeigen/verstecken
    const editor = document.getElementById('top11-editor');
    if (editor) {
        editor.style.display = loggedIn ? 'block' : 'none';
    }

    // Spieltag und Datum anzeigen
    const spieltagEl = document.getElementById('top11-spieltag');
    const dateEl = document.getElementById('top11-date');

    if (data) {
        if (spieltagEl) spieltagEl.textContent = `Spieltag: ${data.spieltag || '-'}`;
        if (dateEl) dateEl.textContent = `Erstellt: ${formatTop11Date(data.createdAt)}`;

        // Spieler in die Slots einfügen
        Object.keys(data.players || {}).forEach(position => {
            const slot = document.querySelector(`.top11-slot[data-position="${position}"]`);
            if (slot && data.players[position]) {
                slot.innerHTML = `
                    <div class="top11-player">
                        <div class="player-circle">${getInitials(data.players[position])}</div>
                        <span class="player-name">${data.players[position]}</span>
                    </div>
                `;
                slot.classList.add('filled');
            }
        });

        // Editor mit aktuellen Daten füllen
        if (loggedIn && data.spieltag) {
            const spieltagInput = document.getElementById('top11-spieltag-input');
            if (spieltagInput) spieltagInput.value = data.spieltag;

            Object.keys(data.players || {}).forEach(position => {
                const input = document.querySelector(`#top11-form input[data-position="${position}"]`);
                if (input) input.value = data.players[position] || '';
            });
        }
    } else {
        // Keine Top 11 vorhanden
        if (spieltagEl) spieltagEl.textContent = 'Spieltag: -';
        if (dateEl) dateEl.textContent = 'Noch nicht erstellt';

        // Leere Slots anzeigen
        document.querySelectorAll('.top11-slot').forEach(slot => {
            const pos = slot.dataset.position;
            slot.innerHTML = `<div class="slot-placeholder">${getPositionLabel(pos)}</div>`;
            slot.classList.remove('filled');
        });
    }
}

// Initialen aus Namen generieren
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Positions-Label
function getPositionLabel(pos) {
    const labels = {
        'TW': 'TW',
        'LV': 'LV',
        'IV1': 'IV',
        'IV2': 'IV',
        'RV': 'RV',
        'LM': 'LM',
        'ZM1': 'ZM',
        'ZM2': 'ZM',
        'RM': 'RM',
        'ST1': 'ST',
        'ST2': 'ST'
    };
    return labels[pos] || pos;
}

// Datum formatieren
function formatTop11Date(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Event Listener
document.addEventListener('DOMContentLoaded', () => {
    renderTop11();

    // Top 11 Formular
    const top11Form = document.getElementById('top11-form');
    if (top11Form) {
        top11Form.addEventListener('submit', (e) => {
            e.preventDefault();

            if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
                showNotification('Bitte melde dich an.', 'warning');
                return;
            }

            const spieltag = document.getElementById('top11-spieltag-input').value;
            const players = {};

            // Alle Spieler-Inputs sammeln
            document.querySelectorAll('#top11-form input[data-position]').forEach(input => {
                const position = input.dataset.position;
                const value = input.value.trim();
                if (value) {
                    players[position] = value;
                }
            });

            // Prüfen ob mindestens ein Spieler eingetragen ist
            if (Object.keys(players).length === 0) {
                showNotification('Bitte trage mindestens einen Spieler ein.', 'warning');
                return;
            }

            const data = {
                spieltag: spieltag,
                players: players,
                createdAt: new Date().toISOString()
            };

            saveTop11(data);
            renderTop11();
            showNotification('Top 11 wurde gespeichert!', 'success');
        });
    }
});
