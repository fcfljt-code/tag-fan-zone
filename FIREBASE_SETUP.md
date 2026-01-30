# Firebase Setup Anleitung

## Schritt 1: Firebase-Projekt erstellen

1. Gehe zu **https://console.firebase.google.com/**
2. Melde dich mit einem Google-Konto an
3. Klicke auf **"Projekt erstellen"**
4. Projektname: z.B. `tsg-fan-zone`
5. Google Analytics: Kannst du deaktivieren (nicht nötig)
6. Klicke auf **"Projekt erstellen"**

## Schritt 2: Web-App hinzufügen

1. Im Firebase-Dashboard, klicke auf das **Web-Symbol** (`</>`)
2. App-Name: `TSG Fan-Zone`
3. **Firebase Hosting nicht aktivieren** (wir nutzen GitHub Pages)
4. Klicke auf **"App registrieren"**
5. Du siehst jetzt die **Konfigurationsdaten** - kopiere diese!

Die Daten sehen so aus:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tsg-fan-zone.firebaseapp.com",
  projectId: "tsg-fan-zone",
  storageBucket: "tsg-fan-zone.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

## Schritt 3: Konfiguration eintragen

1. Öffne die Datei `js/firebase-config.js`
2. Ersetze die Platzhalter mit deinen echten Daten:

```javascript
const firebaseConfig = {
    apiKey: "DEINE_API_KEY",           // <- Ersetzen
    authDomain: "DEIN_PROJEKT.firebaseapp.com",  // <- Ersetzen
    projectId: "DEIN_PROJEKT_ID",      // <- Ersetzen
    storageBucket: "DEIN_PROJEKT.appspot.com",   // <- Ersetzen
    messagingSenderId: "DEINE_SENDER_ID",        // <- Ersetzen
    appId: "DEINE_APP_ID"              // <- Ersetzen
};
```

## Schritt 4: Firestore-Datenbank aktivieren

1. Im Firebase-Dashboard, klicke links auf **"Firestore Database"**
2. Klicke auf **"Datenbank erstellen"**
3. Wähle **"Im Produktionsmodus starten"**
4. Wähle einen Standort: `europe-west3 (Frankfurt)` (empfohlen)
5. Klicke auf **"Aktivieren"**

## Schritt 5: Sicherheitsregeln einstellen

1. Gehe zu **Firestore Database** → **Regeln**
2. Ersetze die Regeln mit:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Jeder kann lesen
    match /{document=**} {
      allow read: if true;
    }

    // Nur authentifizierte Benutzer können schreiben
    // (Für einfache Lösung: Schreiben für alle erlauben)
    match /blogPosts/{postId} {
      allow read: if true;
      allow write: if true;  // Später einschränken!
    }

    match /galerie/{bildId} {
      allow read: if true;
      allow write: if true;
    }

    match /sprueche/{spruchId} {
      allow read: if true;
      allow write: if true;
    }

    match /settings/{docId} {
      allow read: if true;
      allow write: if true;
    }

    match /bewerbungen/{bewerbungId} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

3. Klicke auf **"Veröffentlichen"**

## Schritt 6: Testen

1. Öffne deine Website lokal (mit dem Server)
2. Öffne die Browser-Konsole (F12)
3. Du solltest sehen: `Firebase initialisiert: [DEFAULT]`
4. Erstelle einen Test-Blogbeitrag
5. Öffne die Website in einem anderen Browser/Gerät
6. Der Beitrag sollte dort auch sichtbar sein!

## Fertig!

Deine Website speichert jetzt alle Daten in Firebase:
- Blog-Beiträge
- Galerie-Bilder
- Top 11
- Fan-Sprüche
- Spielerbilder
- Einstellungen
- Fangruppe-Bewerbungen

**Alle Besucher sehen dieselben Inhalte!**

---

## Kosten

Firebase ist **kostenlos** für kleine Projekte:
- 50.000 Lese-Vorgänge pro Tag
- 20.000 Schreib-Vorgänge pro Tag
- 1 GB Speicher

Das reicht für eine Fan-Website locker aus!

---

## Tipps

### Sicherheit verbessern

Später kannst du die Sicherheitsregeln verbessern:
1. Firebase Authentication aktivieren
2. Nur authentifizierte Benutzer können schreiben
3. Jean-Pierre meldet sich mit Google/E-Mail an

### Backup

Firebase erstellt automatisch tägliche Backups (im Blaze-Plan).
Für kostenlose Projekte: Exportiere die Daten regelmäßig manuell.

### Monitoring

Im Firebase-Dashboard siehst du:
- Wie viele Zugriffe es gibt
- Speicherverbrauch
- Fehler
