// Authentifizierung für Jean-Pierre's TSG Fan-Zone
// Einfaches Login-System mit localStorage

const AUTH_KEY = 'tsg_fan_zone_auth';
const AUTH_USER = 'tsg_fan_zone_user';
const SETTINGS_KEY = 'tsg_fan_zone_settings';

// Standard-Zugangsdaten
// Benutzername: jean-pierre | Passwort: hoffe1899
const DEFAULT_CREDENTIALS = {
    username: 'jean-pierre',
    password: 'hoffe1899'
};

// Standard-Einstellungen
const DEFAULT_SETTINGS = {
    email: 'tsg-fangruppe@example.com',
    displayName: 'Jean-Pierre Fürderer',
    showEmail: true
};

// Login prüfen (vereinfacht ohne Hash für lokale Demo)
function login(username, password) {
    const storedCredentials = getStoredCredentials();

    if (username.toLowerCase() === storedCredentials.username.toLowerCase() &&
        password === storedCredentials.password) {
        // Login erfolgreich
        const session = {
            loggedIn: true,
            username: username,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(session));
        return { success: true, message: 'Willkommen zurück, Jean-Pierre!' };
    }

    return { success: false, message: 'Falscher Benutzername oder Passwort!' };
}

// Logout
function logout() {
    localStorage.removeItem(AUTH_KEY);
    updateUIForAuth();
    showNotification('Du wurdest abgemeldet.', 'info');
    // Seite neu laden um alle UI-Elemente zu aktualisieren
    setTimeout(() => location.reload(), 500);
}

// Prüfen ob eingeloggt
function isLoggedIn() {
    const session = localStorage.getItem(AUTH_KEY);
    if (session) {
        try {
            const parsed = JSON.parse(session);
            return parsed.loggedIn === true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

// Gespeicherte Zugangsdaten holen (oder Standard)
function getStoredCredentials() {
    const stored = localStorage.getItem(AUTH_USER);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            return DEFAULT_CREDENTIALS;
        }
    }
    return DEFAULT_CREDENTIALS;
}

// Einstellungen holen
function getSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        } catch (e) {
            return DEFAULT_SETTINGS;
        }
    }
    return DEFAULT_SETTINGS;
}

// Einstellungen speichern
function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Passwort ändern
function changePassword(oldPassword, newPassword) {
    const storedCredentials = getStoredCredentials();

    if (oldPassword !== storedCredentials.password) {
        return { success: false, message: 'Altes Passwort ist falsch!' };
    }

    const newCredentials = {
        username: storedCredentials.username,
        password: newPassword
    };

    localStorage.setItem(AUTH_USER, JSON.stringify(newCredentials));
    return { success: true, message: 'Passwort wurde geändert!' };
}

// UI aktualisieren basierend auf Login-Status
function updateUIForAuth() {
    const loggedIn = isLoggedIn();

    // Login/Logout Button im Header
    const authBtn = document.getElementById('auth-btn');
    if (authBtn) {
        if (loggedIn) {
            authBtn.innerHTML = '<span class="auth-icon">&#128100;</span> Abmelden';
            authBtn.onclick = logout;
            authBtn.classList.add('logged-in');
        } else {
            authBtn.innerHTML = '<span class="auth-icon">&#128274;</span> Anmelden';
            authBtn.onclick = showLoginModal;
            authBtn.classList.remove('logged-in');
        }
    }

    // Blog-Form anzeigen/verstecken
    const blogFormContainer = document.querySelector('.blog-form-container');
    if (blogFormContainer) {
        blogFormContainer.style.display = loggedIn ? 'block' : 'none';
    }

    // Bearbeiten/Löschen Buttons in Posts
    document.querySelectorAll('.blog-post-actions').forEach(actions => {
        actions.style.display = loggedIn ? 'flex' : 'none';
    });

    // Login-Hinweis anzeigen wenn nicht eingeloggt
    const loginHint = document.getElementById('login-hint');
    if (loginHint) {
        loginHint.style.display = loggedIn ? 'none' : 'block';
    }

    // Galerie-Upload anzeigen/verstecken
    const galerieUpload = document.getElementById('galerie-upload');
    if (galerieUpload) {
        galerieUpload.style.display = loggedIn ? 'block' : 'none';
    }

    // Top 11 Editor anzeigen/verstecken
    const top11Editor = document.getElementById('top11-editor');
    if (top11Editor) {
        top11Editor.style.display = loggedIn ? 'block' : 'none';
    }

    // Settings-Button anzeigen/verstecken
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.style.display = loggedIn ? 'inline-flex' : 'none';
    }

    // Sprüche-Editor anzeigen/verstecken
    const sprucheEditor = document.getElementById('sprueche-editor');
    if (sprucheEditor) {
        sprucheEditor.style.display = loggedIn ? 'block' : 'none';
    }

    // Spieler-Kader neu rendern (für Upload-Buttons)
    if (typeof initSpieler === 'function') {
        initSpieler();
    }

    // E-Mail in Fangruppe aktualisieren
    updateFangruppeEmail();

    // Bewerbungen-Admin anzeigen/verstecken
    const bewerbungenAdmin = document.getElementById('bewerbungen-admin');
    if (bewerbungenAdmin) {
        bewerbungenAdmin.style.display = loggedIn ? 'block' : 'none';
    }

    // Bewerbungsliste aktualisieren
    if (typeof renderBewerbungen === 'function') {
        renderBewerbungen();
    }
}

// E-Mail in Fangruppe-Sektion aktualisieren
function updateFangruppeEmail() {
    const settings = getSettings();
    const emailLink = document.querySelector('.contact-email');
    if (emailLink && settings.email) {
        emailLink.href = `mailto:${settings.email}`;
        emailLink.textContent = `✉ ${settings.email}`;
    }
}

// Login Modal anzeigen
function showLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('login-username')?.focus();
    }
}

// Login Modal schließen
function hideLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('login-form')?.reset();
        const errorEl = document.getElementById('login-error');
        if (errorEl) errorEl.textContent = '';
    }
}

// Settings Modal anzeigen
function showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        const settings = getSettings();
        const credentials = getStoredCredentials();

        // Felder füllen
        document.getElementById('settings-email').value = settings.email || '';
        document.getElementById('settings-name').value = settings.displayName || '';
        document.getElementById('settings-username').value = credentials.username || '';

        modal.classList.add('active');
    }
}

// Settings Modal schließen
function hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('settings-form')?.reset();
        document.getElementById('password-form')?.reset();
    }
}

// Benachrichtigung anzeigen
function showNotification(message, type = 'success') {
    // Bestehende Benachrichtigungen entfernen
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Event Listener initialisieren
document.addEventListener('DOMContentLoaded', () => {
    // Login-Formular
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');

            const result = login(username, password);

            if (result.success) {
                hideLoginModal();
                updateUIForAuth();
                showNotification(result.message, 'success');

                // Alle Bereiche neu rendern
                if (typeof renderBlogPosts === 'function') renderBlogPosts();
                if (typeof renderGalerie === 'function') renderGalerie();
                if (typeof renderTop11 === 'function') renderTop11();
            } else {
                if (errorEl) errorEl.textContent = result.message;
            }
        });
    }

    // Settings-Formular
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = document.getElementById('settings-email').value.trim();
            const displayName = document.getElementById('settings-name').value.trim();

            const settings = getSettings();
            settings.email = email;
            settings.displayName = displayName;
            saveSettings(settings);

            updateFangruppeEmail();
            showNotification('Einstellungen wurden gespeichert!', 'success');
        });
    }

    // Passwort-Formular
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const oldPw = document.getElementById('old-password').value;
            const newPw = document.getElementById('new-password').value;
            const confirmPw = document.getElementById('confirm-password').value;

            if (newPw !== confirmPw) {
                showNotification('Passwörter stimmen nicht überein!', 'warning');
                return;
            }

            if (newPw.length < 4) {
                showNotification('Passwort muss mindestens 4 Zeichen haben!', 'warning');
                return;
            }

            const result = changePassword(oldPw, newPw);
            if (result.success) {
                showNotification(result.message, 'success');
                passwordForm.reset();
            } else {
                showNotification(result.message, 'warning');
            }
        });
    }

    // Modal schließen bei Klick außerhalb
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // ESC zum Schließen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideLoginModal();
            hideSettingsModal();
        }
    });

    // UI beim Laden aktualisieren
    updateUIForAuth();
});
