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
        const snapshot = await db.collection('blogPosts')
            .doc(postId)
            .collection('comments')
            .orderBy('createdAt', 'asc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Fehler beim Laden der Kommentare:', error);
        return [];
    }
}

async function addFirebaseComment(postId, comment) {
    try {
        const docRef = await db.collection('blogPosts')
            .doc(postId)
            .collection('comments')
            .add({
                ...comment,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        return docRef.id;
    } catch (error) {
        console.error('Fehler beim Kommentar hinzufügen:', error);
        throw error;
    }
}

async function deleteFirebaseComment(postId, commentId) {
    try {
        await db.collection('blogPosts')
            .doc(postId)
            .collection('comments')
            .doc(commentId)
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
