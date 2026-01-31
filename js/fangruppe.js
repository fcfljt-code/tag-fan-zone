// Fangruppe Bewerbungs-Formular
// TSG 1899 Hoffenheim Fan-Website

const BEWERBUNGEN_STORAGE_KEY = 'tsg_bewerbungen';

// Prüfen ob Firebase verfügbar ist
function isFirebaseEnabledFangruppe() {
    return typeof window.FIREBASE_ENABLED !== 'undefined' && window.FIREBASE_ENABLED === true;
}

// Bewerbungen laden (Firebase oder localStorage)
async function getBewerbungen() {
    if (isFirebaseEnabledFangruppe()) {
        try {
            if (typeof getFirebaseBewerbungen === 'function') {
                return await getFirebaseBewerbungen();
            }
        } catch (error) {
            console.warn('Firebase Fehler, verwende localStorage:', error);
        }
    }
    // Fallback: localStorage
    const items = localStorage.getItem(BEWERBUNGEN_STORAGE_KEY);
    return items ? JSON.parse(items) : [];
}

// Bewerbung speichern (Firebase und localStorage)
async function saveBewerbung(bewerbung) {
    // Immer in localStorage speichern als Backup
    const bewerbungen = JSON.parse(localStorage.getItem(BEWERBUNGEN_STORAGE_KEY) || '[]');
    bewerbungen.unshift(bewerbung);
    localStorage.setItem(BEWERBUNGEN_STORAGE_KEY, JSON.stringify(bewerbungen));

    // Auch in Firebase speichern wenn verfügbar
    if (isFirebaseEnabledFangruppe()) {
        try {
            if (typeof saveFirebaseBewerbung === 'function') {
                await saveFirebaseBewerbung(bewerbung);
            }
        } catch (error) {
            console.warn('Firebase Fehler beim Speichern:', error);
        }
    }
}

// Datum formatieren (unterstützt Firebase Timestamps)
function formatBewerbungDate(dateValue) {
    if (!dateValue) return 'Unbekannt';

    let date;
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
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// HTML escapen
function escapeHtmlFangruppe(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Bewerbungen für Admin rendern
async function renderBewerbungen() {
    const container = document.getElementById('bewerbungen-container');
    const adminSection = document.getElementById('bewerbungen-admin');

    if (!container || !adminSection) return;

    // Nur für eingeloggte Admins anzeigen
    const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;
    adminSection.style.display = loggedIn ? 'block' : 'none';

    if (!loggedIn) return;

    const bewerbungen = await getBewerbungen();

    if (!bewerbungen || bewerbungen.length === 0) {
        container.innerHTML = `
            <div class="no-bewerbungen">
                <p>&#128235; Noch keine Bewerbungen eingegangen.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = bewerbungen.map(b => `
        <div class="bewerbung-card" data-id="${b.id}">
            <div class="bewerbung-header">
                <div class="bewerbung-info">
                    <h4 class="bewerbung-name">&#128100; ${escapeHtmlFangruppe(b.name)}</h4>
                    <span class="bewerbung-date">${formatBewerbungDate(b.createdAt)}</span>
                </div>
                <span class="bewerbung-status ${b.status || 'neu'}">${b.status === 'bearbeitet' ? 'Bearbeitet' : 'Neu'}</span>
            </div>
            <div class="bewerbung-contact">
                <a href="mailto:${escapeHtmlFangruppe(b.email)}" class="bewerbung-email" title="E-Mail schreiben">
                    &#9993; ${escapeHtmlFangruppe(b.email)}
                </a>
            </div>
            ${b.message ? `
                <div class="bewerbung-message">
                    <strong>Nachricht:</strong>
                    <p>${escapeHtmlFangruppe(b.message)}</p>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Event Listener
document.addEventListener('DOMContentLoaded', () => {
    const fangruppeForm = document.getElementById('fangruppe-form');

    // Bewerbungen laden (für Admin)
    renderBewerbungen();

    if (fangruppeForm) {
        fangruppeForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('fan-name').value.trim();
            const email = document.getElementById('fan-email').value.trim();
            const message = document.getElementById('fan-message').value.trim();

            if (!name || !email) {
                showNotification('Bitte fülle alle Pflichtfelder aus.', 'warning');
                return;
            }

            const bewerbung = {
                id: Date.now(),
                name: name,
                email: email,
                message: message,
                createdAt: new Date().toISOString(),
                status: 'neu'
            };

            // Bewerbung speichern
            await saveBewerbung(bewerbung);

            // E-Mail aus Einstellungen holen (oder Fallback)
            let targetEmail = 'tsg-fangruppe@example.com';
            if (typeof getSettings === 'function') {
                const settings = getSettings();
                if (settings && settings.email) {
                    targetEmail = settings.email;
                }
            }

            // E-Mail-Link öffnen
            const subject = encodeURIComponent('TSG Fangruppe - Bewerbung von ' + name);
            const body = encodeURIComponent(
                `Hallo Jean-Pierre,\n\n` +
                `ich möchte mich für die TSG Fangruppe bewerben!\n\n` +
                `Name: ${name}\n` +
                `E-Mail: ${email}\n\n` +
                `Warum ich dabei sein möchte:\n${message || '(keine Nachricht)'}\n\n` +
                `Hoffe auf baldige Rückmeldung!\n` +
                `Achtzehn99!`
            );

            const mailtoLink = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
            window.location.href = mailtoLink;

            showNotification('Bewerbung wurde gespeichert! E-Mail-Programm öffnet sich...', 'success');
            fangruppeForm.reset();

            // Liste aktualisieren
            renderBewerbungen();
        });
    }

    // Bei Login-Status-Änderung aktualisieren
    window.addEventListener('storage', (e) => {
        if (e.key === 'tsg_admin_logged_in') {
            renderBewerbungen();
        }
    });
});

// Funktion zum manuellen Aktualisieren nach Login
function refreshBewerbungen() {
    renderBewerbungen();
}
