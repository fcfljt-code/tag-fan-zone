// Jean-Pierre's Hoffenheim-Blog - mit Bild-Upload und Firebase
// TSG 1899 Hoffenheim Fan-Website

const BLOG_STORAGE_KEY = 'tsg_hoffenheim_blog_posts';

// Prüfen ob Firebase verfügbar ist
function isFirebaseEnabled() {
    return typeof window.FIREBASE_ENABLED !== 'undefined' && window.FIREBASE_ENABLED === true;
}

// Blog-Posts laden (Firebase oder localStorage)
async function getBlogPosts() {
    if (isFirebaseEnabled()) {
        try {
            return await getFirebaseBlogPosts();
        } catch (error) {
            console.warn('Firebase Fehler, verwende localStorage:', error);
        }
    }
    // Fallback: localStorage
    const posts = localStorage.getItem(BLOG_STORAGE_KEY);
    return posts ? JSON.parse(posts) : [];
}

// Blog-Posts speichern (localStorage Fallback)
function saveBlogPostsLocal(posts) {
    localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(posts));
}

// Bild zu Base64 konvertieren
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Neuen Post erstellen (Firebase oder localStorage)
async function createPost(title, content, headerImage = null, category = 'allgemein') {
    const newPost = {
        title: title,
        content: content,
        headerImage: headerImage,
        category: category,
        author: 'Jean-Pierre Fürderer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        comments: []
    };

    if (isFirebaseEnabled()) {
        try {
            const id = await saveFirebaseBlogPost(newPost);
            return { ...newPost, id };
        } catch (error) {
            console.warn('Firebase Fehler, verwende localStorage:', error);
        }
    }

    // Fallback: localStorage
    newPost.id = Date.now();
    const posts = JSON.parse(localStorage.getItem(BLOG_STORAGE_KEY) || '[]');
    posts.unshift(newPost);
    saveBlogPostsLocal(posts);
    return newPost;
}

// Post aktualisieren (Firebase oder localStorage)
async function updatePost(id, title, content, headerImage = null, category = 'allgemein') {
    if (isFirebaseEnabled()) {
        try {
            const post = {
                id: id,
                title: title,
                content: content,
                category: category,
                updatedAt: new Date().toISOString()
            };
            if (headerImage) post.headerImage = headerImage;
            await saveFirebaseBlogPost(post);
            return post;
        } catch (error) {
            console.warn('Firebase Fehler, verwende localStorage:', error);
        }
    }

    // Fallback: localStorage
    const posts = JSON.parse(localStorage.getItem(BLOG_STORAGE_KEY) || '[]');
    const index = posts.findIndex(p => p.id === id);

    if (index !== -1) {
        posts[index].title = title;
        posts[index].content = content;
        posts[index].category = category;
        if (headerImage) {
            posts[index].headerImage = headerImage;
        }
        posts[index].updatedAt = new Date().toISOString();
        saveBlogPostsLocal(posts);
        return posts[index];
    }

    return null;
}

// Post löschen (Firebase oder localStorage)
async function deletePost(id) {
    if (isFirebaseEnabled()) {
        try {
            await deleteFirebaseBlogPost(id);
            return;
        } catch (error) {
            console.warn('Firebase Fehler, verwende localStorage:', error);
        }
    }

    // Fallback: localStorage
    const posts = JSON.parse(localStorage.getItem(BLOG_STORAGE_KEY) || '[]');
    const filteredPosts = posts.filter(p => p.id !== id);
    saveBlogPostsLocal(filteredPosts);
}

// Datum formatieren
function formatBlogDate(dateString) {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('de-DE', options);
}

// Kurzes Datum für Karten
function formatShortDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Kategorie-Badge Farbe
function getCategoryColor(category) {
    const colors = {
        'spielbericht': '#28a745',
        'meinung': '#ffc107',
        'transfer': '#17a2b8',
        'stadion': '#6f42c1',
        'allgemein': '#1a55ab'
    };
    return colors[category] || colors['allgemein'];
}

// Kategorie-Label
function getCategoryLabel(category) {
    const labels = {
        'spielbericht': 'Spielbericht',
        'meinung': 'Meine Meinung',
        'transfer': 'Transfer-News',
        'stadion': 'Stadion & Fans',
        'allgemein': 'Allgemein'
    };
    return labels[category] || 'Allgemein';
}

// Posts rendern - Modernes Card-Layout (async für Firebase)
async function renderBlogPosts() {
    const container = document.getElementById('blog-posts-container');

    // Lade-Animation
    container.innerHTML = '<div class="loading">Beiträge werden geladen...</div>';

    const posts = await getBlogPosts();
    const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;

    if (posts.length === 0) {
        container.innerHTML = `
            <div class="no-posts-container">
                <div class="no-posts-icon">&#128221;</div>
                <h3>Noch keine Beiträge</h3>
                <p>Hier erscheinen bald Jean-Pierre's Gedanken zur TSG!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = posts.map(post => `
        <article class="blog-card" data-id="${post.id}">
            ${post.headerImage ? `
                <div class="blog-card-image">
                    <img src="${post.headerImage}" alt="${escapeHtml(post.title)}">
                    <span class="blog-card-category" style="background: ${getCategoryColor(post.category)}">${getCategoryLabel(post.category)}</span>
                </div>
            ` : `
                <div class="blog-card-image blog-card-image-placeholder">
                    <div class="placeholder-icon">&#9917;</div>
                    <span class="blog-card-category" style="background: ${getCategoryColor(post.category)}">${getCategoryLabel(post.category)}</span>
                </div>
            `}
            <div class="blog-card-content">
                <div class="blog-card-meta">
                    <span class="blog-card-author">
                        <span class="author-avatar">JP</span>
                        ${post.author || 'Jean-Pierre'}
                    </span>
                    <span class="blog-card-date">${formatShortDate(post.createdAt)}</span>
                </div>
                <h3 class="blog-card-title">${escapeHtml(post.title)}</h3>
                <p class="blog-card-excerpt">${escapeHtml(post.content).substring(0, 150)}${post.content.length > 150 ? '...' : ''}</p>
                <div class="blog-card-footer">
                    <button class="btn-read-more" onclick="showFullPost(${post.id})">Weiterlesen</button>
                    ${loggedIn ? `
                        <div class="blog-card-actions">
                            <button class="btn-icon" onclick="editPost(${post.id})" title="Bearbeiten">&#9998;</button>
                            <button class="btn-icon btn-icon-danger" onclick="confirmDeletePost(${post.id})" title="Löschen">&#128465;</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </article>
    `).join('');
}

// Vollständigen Post anzeigen (Modal) mit Kommentaren
function showFullPost(id) {
    const posts = getBlogPosts();
    const post = posts.find(p => p.id === id);

    if (!post) return;

    const modal = document.getElementById('post-modal');
    const modalContent = document.getElementById('post-modal-content');
    const comments = post.comments || [];

    if (modal && modalContent) {
        modalContent.innerHTML = `
            ${post.headerImage ? `<img src="${post.headerImage}" alt="${escapeHtml(post.title)}" class="post-modal-image">` : ''}
            <span class="post-modal-category" style="background: ${getCategoryColor(post.category)}">${getCategoryLabel(post.category)}</span>
            <h2 class="post-modal-title">${escapeHtml(post.title)}</h2>
            <div class="post-modal-meta">
                <span class="author-avatar">JP</span>
                <div>
                    <strong>${post.author || 'Jean-Pierre Fürderer'}</strong>
                    <span>${formatBlogDate(post.createdAt)}</span>
                </div>
            </div>
            <div class="post-modal-body">${escapeHtml(post.content).replace(/\n/g, '<br>')}</div>

            <!-- Kommentare -->
            <div class="comments-section">
                <h3 class="comments-title">&#128172; Kommentare (${comments.length})</h3>

                <!-- Kommentar-Formular -->
                <form class="comment-form" onsubmit="addComment(event, ${post.id})">
                    <div class="comment-form-row">
                        <input type="text" id="comment-name-${post.id}" placeholder="Dein Name" required>
                        <input type="email" id="comment-email-${post.id}" placeholder="E-Mail (optional)">
                    </div>
                    <textarea id="comment-text-${post.id}" placeholder="Schreibe einen Kommentar..." required></textarea>
                    <button type="submit" class="btn btn-primary">Kommentar abschicken</button>
                </form>

                <!-- Kommentar-Liste -->
                <div class="comments-list" id="comments-list-${post.id}">
                    ${comments.length === 0 ? '<p class="no-comments">Noch keine Kommentare. Sei der Erste!</p>' :
                    comments.map(comment => `
                        <div class="comment" data-id="${comment.id}">
                            <div class="comment-header">
                                <span class="comment-avatar">${getCommentInitials(comment.name)}</span>
                                <div class="comment-meta">
                                    <strong>${escapeHtml(comment.name)}</strong>
                                    <span>${formatCommentDate(comment.createdAt)}</span>
                                </div>
                                ${typeof isLoggedIn === 'function' && isLoggedIn() ? `
                                    <button class="comment-delete" onclick="deleteComment(${post.id}, ${comment.id})" title="Löschen">&#128465;</button>
                                ` : ''}
                            </div>
                            <p class="comment-text">${escapeHtml(comment.text)}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Kommentar hinzufügen
function addComment(event, postId) {
    event.preventDefault();

    const nameInput = document.getElementById(`comment-name-${postId}`);
    const emailInput = document.getElementById(`comment-email-${postId}`);
    const textInput = document.getElementById(`comment-text-${postId}`);

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const text = textInput.value.trim();

    if (!name || !text) {
        showNotification('Bitte Name und Kommentar ausfüllen.', 'warning');
        return;
    }

    const posts = getBlogPosts();
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) return;

    if (!posts[postIndex].comments) {
        posts[postIndex].comments = [];
    }

    const newComment = {
        id: Date.now(),
        name: name,
        email: email,
        text: text,
        createdAt: new Date().toISOString()
    };

    posts[postIndex].comments.push(newComment);
    saveBlogPosts(posts);

    // Modal neu laden
    showFullPost(postId);
    showNotification('Kommentar wurde hinzugefügt!', 'success');
}

// Kommentar löschen
function deleteComment(postId, commentId) {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        showNotification('Nur der Admin kann Kommentare löschen.', 'warning');
        return;
    }

    if (!confirm('Kommentar wirklich löschen?')) return;

    const posts = getBlogPosts();
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) return;

    posts[postIndex].comments = (posts[postIndex].comments || []).filter(c => c.id !== commentId);
    saveBlogPosts(posts);

    showFullPost(postId);
    showNotification('Kommentar wurde gelöscht.', 'info');
}

// Initialen für Kommentar-Avatar
function getCommentInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Kommentar-Datum formatieren
function formatCommentDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Min.`;
    if (diffHours < 24) return `vor ${diffHours} Std.`;
    if (diffDays < 7) return `vor ${diffDays} Tagen`;

    return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Post-Modal schließen
function closePostModal() {
    const modal = document.getElementById('post-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// HTML escapen für Sicherheit
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Bild-Vorschau aktualisieren
function updateImagePreview(input) {
    const preview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');

    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Bild-Vorschau entfernen
function removeImagePreview() {
    const preview = document.getElementById('image-preview');
    const previewContainer = document.getElementById('image-preview-container');
    const input = document.getElementById('blog-image');

    preview.src = '';
    previewContainer.style.display = 'none';
    if (input) input.value = '';
}

// Post zum Bearbeiten laden
function editPost(id) {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        showNotification('Bitte melde dich an um Posts zu bearbeiten.', 'warning');
        return;
    }

    const posts = getBlogPosts();
    const post = posts.find(p => p.id === id);

    if (post) {
        document.getElementById('blog-edit-id').value = post.id;
        document.getElementById('blog-title').value = post.title;
        document.getElementById('blog-content').value = post.content;
        document.getElementById('blog-category').value = post.category || 'allgemein';

        // Bild-Vorschau wenn vorhanden
        if (post.headerImage) {
            const preview = document.getElementById('image-preview');
            const previewContainer = document.getElementById('image-preview-container');
            preview.src = post.headerImage;
            previewContainer.style.display = 'block';
        }

        document.getElementById('blog-cancel').style.display = 'inline-block';
        document.getElementById('blog-submit-btn').textContent = 'Aktualisieren';

        // Zum Formular scrollen
        document.getElementById('blog-form').scrollIntoView({ behavior: 'smooth' });
    }
}

// Bearbeitung abbrechen
function cancelEdit() {
    document.getElementById('blog-edit-id').value = '';
    document.getElementById('blog-title').value = '';
    document.getElementById('blog-content').value = '';
    document.getElementById('blog-category').value = 'allgemein';
    document.getElementById('blog-cancel').style.display = 'none';
    document.getElementById('blog-submit-btn').textContent = 'Veröffentlichen';
    removeImagePreview();
}

// Post löschen mit Bestätigung
function confirmDeletePost(id) {
    if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
        showNotification('Bitte melde dich an um Posts zu löschen.', 'warning');
        return;
    }

    if (confirm('Möchtest du diesen Beitrag wirklich löschen?')) {
        deletePost(id);
        renderBlogPosts();
        showNotification('Beitrag wurde gelöscht.', 'info');
    }
}

// Event Listener
document.addEventListener('DOMContentLoaded', () => {
    renderBlogPosts();

    // Formular Submit
    const blogForm = document.getElementById('blog-form');
    if (blogForm) {
        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (typeof isLoggedIn === 'function' && !isLoggedIn()) {
                showNotification('Bitte melde dich an um Posts zu erstellen.', 'warning');
                return;
            }

            const editId = document.getElementById('blog-edit-id').value;
            const title = document.getElementById('blog-title').value.trim();
            const content = document.getElementById('blog-content').value.trim();
            const category = document.getElementById('blog-category').value;
            const imageInput = document.getElementById('blog-image');

            if (!title || !content) {
                showNotification('Bitte fülle alle Pflichtfelder aus.', 'warning');
                return;
            }

            let headerImage = null;

            // Neues Bild hochladen
            if (imageInput && imageInput.files && imageInput.files[0]) {
                try {
                    headerImage = await imageToBase64(imageInput.files[0]);
                } catch (err) {
                    console.error('Fehler beim Bildupload:', err);
                }
            }

            // Bei Bearbeitung: bestehendes Bild behalten wenn kein neues hochgeladen
            if (editId && !headerImage) {
                const posts = getBlogPosts();
                const existingPost = posts.find(p => p.id === parseInt(editId));
                if (existingPost) {
                    headerImage = existingPost.headerImage;
                }
            }

            if (editId) {
                updatePost(parseInt(editId), title, content, headerImage, category);
                showNotification('Beitrag wurde aktualisiert!', 'success');
            } else {
                createPost(title, content, headerImage, category);
                showNotification('Beitrag wurde veröffentlicht!', 'success');
            }

            cancelEdit();
            renderBlogPosts();
        });
    }

    // Abbrechen Button
    const cancelBtn = document.getElementById('blog-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }

    // Bild-Input Change
    const imageInput = document.getElementById('blog-image');
    if (imageInput) {
        imageInput.addEventListener('change', function() {
            updateImagePreview(this);
        });
    }

    // Post-Modal schließen
    const postModal = document.getElementById('post-modal');
    if (postModal) {
        postModal.addEventListener('click', (e) => {
            if (e.target === postModal || e.target.classList.contains('post-modal-close')) {
                closePostModal();
            }
        });
    }

    // ESC zum Schließen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePostModal();
        }
    });
});
