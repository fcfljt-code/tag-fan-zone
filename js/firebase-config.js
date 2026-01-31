// Firebase Konfiguration für TSG 1899 Hoffenheim Fan-Zone
// WICHTIG: Diese Werte musst du mit deinen eigenen Firebase-Daten ersetzen!

const firebaseConfig = {
    apiKey: "AIzaSyCSFaBam3D0_LWqYpVtJHMzO_c_aASNQ00",
    authDomain: "jean-pierre-hoffenheim.firebaseapp.com",
    projectId: "jean-pierre-hoffenheim",
    storageBucket: "jean-pierre-hoffenheim.firebasestorage.app",
    messagingSenderId: "22684968654",
    appId: "1:22684968654:web:b569212e49dd152e7ad29f",
    measurementId: "G-JG7N1QEKP8"
};

// Firebase initialisieren
firebase.initializeApp(firebaseConfig);

// Firestore Datenbank
const db = firebase.firestore();

// Firebase Storage (für Bilder)
const storage = firebase.storage();

// Prüfen ob Firebase korrekt initialisiert wurde
console.log('Firebase initialisiert:', firebase.app().name);

// =============================================
// DATENBANK-FUNKTIONEN
// =============================================

// --- BLOG POSTS ---
async function getFirebaseBlogPosts() {
    try {
        const snapshot = await db.collection('blogPosts')
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Fehler beim Laden der Blog-Posts:', error);
        return [];
    }
}

async function saveFirebaseBlogPost(post) {
    try {
        if (post.id) {
            // Update
            await db.collection('blogPosts').doc(post.id).update(post);
            return post.id;
        } else {
            // Neu erstellen
            const docRef = await db.collection('blogPosts').add({
                ...post,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return docRef.id;
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

async function deleteFirebaseBlogPost(postId) {
    try {
        await db.collection('blogPosts').doc(postId).delete();
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        throw error;
    }
}

// --- KOMMENTARE ---
async function getFirebaseComments(postId) {
    try {
        console.log('📥 Lade Kommentare für Post:', postId);
        const snapshot = await db.collection('blogPosts')
            .doc(String(postId))
            .collection('comments')
            .orderBy('createdAt', 'asc')
            .get();
        const comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('✅ Kommentare geladen:', comments.length);
        return comments;
    } catch (error) {
        console.error('❌ Fehler beim Laden der Kommentare:', error);
        // Bei Index-Fehler: Ohne Sortierung laden
        if (error.code === 'failed-precondition') {
            console.log('⚠️ Versuche ohne Sortierung...');
            try {
                const snapshot = await db.collection('blogPosts')
                    .doc(String(postId))
                    .collection('comments')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (fallbackError) {
                console.error('❌ Fallback fehlgeschlagen:', fallbackError);
            }
        }
        return [];
    }
}

async function addFirebaseComment(postId, comment) {
    try {
        console.log('💬 Füge Kommentar hinzu für Post:', String(postId));
        const docRef = await db.collection('blogPosts')
            .doc(String(postId))
            .collection('comments')
            .add({
                ...comment,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        console.log('✅ Kommentar hinzugefügt mit ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('❌ Fehler beim Kommentar hinzufügen:', error);
        console.error('Post ID war:', postId, 'Typ:', typeof postId);
        throw error;
    }
}

async function deleteFirebaseComment(postId, commentId) {
    try {
        await db.collection('blogPosts')
            .doc(String(postId))
            .collection('comments')
            .doc(String(commentId))
            .delete();
    } catch (error) {
        console.error('Fehler beim Löschen des Kommentars:', error);
        throw error;
    }
}

// --- GALERIE ---
async function getFirebaseGalerie() {
    try {
        const snapshot = await db.collection('galerie')
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Fehler beim Laden der Galerie:', error);
        return [];
    }
}

async function saveFirebaseGalerieBild(bild) {
    try {
        const docRef = await db.collection('galerie').add({
            ...bild,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

async function deleteFirebaseGalerieBild(bildId) {
    try {
        await db.collection('galerie').doc(bildId).delete();
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        throw error;
    }
}

// --- TOP 11 ---
async function getFirebaseTop11() {
    try {
        const doc = await db.collection('settings').doc('top11').get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error('Fehler beim Laden der Top 11:', error);
        return null;
    }
}

async function saveFirebaseTop11(data) {
    try {
        await db.collection('settings').doc('top11').set({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

// --- FAN-SPRÜCHE ---
async function getFirebaseSprueche() {
    try {
        const snapshot = await db.collection('sprueche')
            .orderBy('createdAt', 'asc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Fehler beim Laden der Sprüche:', error);
        return [];
    }
}

async function addFirebaseSpruch(spruch) {
    try {
        const docRef = await db.collection('sprueche').add({
            ...spruch,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Fehler beim Hinzufügen:', error);
        throw error;
    }
}

async function deleteFirebaseSpruch(spruchId) {
    try {
        await db.collection('sprueche').doc(spruchId).delete();
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        throw error;
    }
}

// --- SPIELERBILDER ---
async function getFirebaseSpielerBilder() {
    try {
        const doc = await db.collection('settings').doc('spielerBilder').get();
        return doc.exists ? doc.data() : {};
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        return {};
    }
}

async function saveFirebaseSpielerBild(nummer, imageData) {
    try {
        await db.collection('settings').doc('spielerBilder').set({
            [nummer]: imageData
        }, { merge: true });
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

async function deleteFirebaseSpielerBild(nummer) {
    try {
        await db.collection('settings').doc('spielerBilder').update({
            [nummer]: firebase.firestore.FieldValue.delete()
        });
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        throw error;
    }
}

// --- EINSTELLUNGEN ---
async function getFirebaseSettings() {
    try {
        const doc = await db.collection('settings').doc('general').get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        return null;
    }
}

async function saveFirebaseSettings(settings) {
    try {
        await db.collection('settings').doc('general').set(settings, { merge: true });
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

// --- BEWERBUNGEN ---
async function saveFirebaseBewerbung(bewerbung) {
    try {
        const docRef = await db.collection('bewerbungen').add({
            ...bewerbung,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'neu'
        });
        return docRef.id;
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

async function getFirebaseBewerbungen() {
    try {
        const snapshot = await db.collection('bewerbungen')
            .orderBy('createdAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        return [];
    }
}

// Globale Variable um zu prüfen ob Firebase aktiv ist
window.FIREBASE_ENABLED = true;

// =============================================
// REALTIME LISTENER - Automatische Updates
// =============================================

// Aktive Listener speichern (für Cleanup)
window.firebaseListeners = {};

// Status der Listener (für Debugging)
window.firebaseListenerStatus = {
    blogPosts: false,
    galerie: false,
    sprueche: false,
    top11: false,
    spielerBilder: false
};

// Blog Posts Realtime Listener
function listenToBlogPosts(callback) {
    console.log('🔌 Blog Listener wird aktiviert...');

    if (window.firebaseListeners.blogPosts) {
        window.firebaseListeners.blogPosts(); // Alten Listener entfernen
    }

    try {
        window.firebaseListeners.blogPosts = db.collection('blogPosts')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log('📝 Blog-Posts Realtime Update:', posts.length, 'Posts');
                window.firebaseListenerStatus.blogPosts = true;
                callback(posts);
            }, (error) => {
                console.error('❌ Realtime Fehler Blog:', error);
                window.firebaseListenerStatus.blogPosts = false;
            });
        console.log('✅ Blog Listener aktiv');
    } catch (error) {
        console.error('❌ Blog Listener konnte nicht aktiviert werden:', error);
    }
}

// Galerie Realtime Listener
function listenToGalerie(callback) {
    console.log('🔌 Galerie Listener wird aktiviert...');

    if (window.firebaseListeners.galerie) {
        window.firebaseListeners.galerie();
    }

    try {
        window.firebaseListeners.galerie = db.collection('galerie')
            .orderBy('createdAt', 'desc')
            .onSnapshot((snapshot) => {
                const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log('🖼️ Galerie Realtime Update:', items.length, 'Bilder');
                window.firebaseListenerStatus.galerie = true;
                callback(items);
            }, (error) => {
                console.error('❌ Realtime Fehler Galerie:', error);
                window.firebaseListenerStatus.galerie = false;
            });
        console.log('✅ Galerie Listener aktiv');
    } catch (error) {
        console.error('❌ Galerie Listener konnte nicht aktiviert werden:', error);
    }
}

// Sprüche Realtime Listener
function listenToSprueche(callback) {
    console.log('🔌 Sprüche Listener wird aktiviert...');

    if (window.firebaseListeners.sprueche) {
        window.firebaseListeners.sprueche();
    }

    try {
        window.firebaseListeners.sprueche = db.collection('sprueche')
            .orderBy('createdAt', 'asc')
            .onSnapshot((snapshot) => {
                const sprueche = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log('💬 Sprüche Realtime Update:', sprueche.length, 'Sprüche');
                window.firebaseListenerStatus.sprueche = true;
                callback(sprueche);
            }, (error) => {
                console.error('❌ Realtime Fehler Sprüche:', error);
                window.firebaseListenerStatus.sprueche = false;
            });
        console.log('✅ Sprüche Listener aktiv');
    } catch (error) {
        console.error('❌ Sprüche Listener konnte nicht aktiviert werden:', error);
    }
}

// Top 11 Realtime Listener
function listenToTop11(callback) {
    console.log('🔌 Top 11 Listener wird aktiviert...');

    if (window.firebaseListeners.top11) {
        window.firebaseListeners.top11();
    }

    try {
        window.firebaseListeners.top11 = db.collection('settings').doc('top11')
            .onSnapshot((doc) => {
                const data = doc.exists ? doc.data() : null;
                console.log('⭐ Top 11 Realtime Update:', data ? 'Daten vorhanden' : 'Keine Daten');
                window.firebaseListenerStatus.top11 = true;
                callback(data);
            }, (error) => {
                console.error('❌ Realtime Fehler Top 11:', error);
                window.firebaseListenerStatus.top11 = false;
            });
        console.log('✅ Top 11 Listener aktiv');
    } catch (error) {
        console.error('❌ Top 11 Listener konnte nicht aktiviert werden:', error);
    }
}

// Spielerbilder Realtime Listener
function listenToSpielerBilder(callback) {
    console.log('🔌 Spielerbilder Listener wird aktiviert...');

    if (window.firebaseListeners.spielerBilder) {
        window.firebaseListeners.spielerBilder();
    }

    try {
        window.firebaseListeners.spielerBilder = db.collection('settings').doc('spielerBilder')
            .onSnapshot((doc) => {
                const data = doc.exists ? doc.data() : {};
                console.log('👤 Spielerbilder Realtime Update:', Object.keys(data).length, 'Bilder');
                window.firebaseListenerStatus.spielerBilder = true;
                callback(data);
            }, (error) => {
                console.error('❌ Realtime Fehler Spielerbilder:', error);
                window.firebaseListenerStatus.spielerBilder = false;
            });
        console.log('✅ Spielerbilder Listener aktiv');
    } catch (error) {
        console.error('❌ Spielerbilder Listener konnte nicht aktiviert werden:', error);
    }
}

// Debug-Funktion um Listener-Status zu prüfen
window.checkFirebaseListeners = function() {
    console.log('=== Firebase Listener Status ===');
    console.log('Blog:', window.firebaseListenerStatus.blogPosts ? '✅' : '❌');
    console.log('Galerie:', window.firebaseListenerStatus.galerie ? '✅' : '❌');
    console.log('Sprüche:', window.firebaseListenerStatus.sprueche ? '✅' : '❌');
    console.log('Top 11:', window.firebaseListenerStatus.top11 ? '✅' : '❌');
    console.log('Spielerbilder:', window.firebaseListenerStatus.spielerBilder ? '✅' : '❌');
    console.log('================================');
    return window.firebaseListenerStatus;
};
