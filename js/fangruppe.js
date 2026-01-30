// Fangruppe Bewerbungs-Formular
// TSG 1899 Hoffenheim Fan-Website

document.addEventListener('DOMContentLoaded', () => {
    const fangruppeForm = document.getElementById('fangruppe-form');

    if (fangruppeForm) {
        fangruppeForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('fan-name').value.trim();
            const email = document.getElementById('fan-email').value.trim();
            const message = document.getElementById('fan-message').value.trim();

            if (!name || !email) {
                showNotification('Bitte fülle alle Pflichtfelder aus.', 'warning');
                return;
            }

            // E-Mail-Link öffnen (da kein Backend)
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

            // Versuche E-Mail zu öffnen
            const mailtoLink = `mailto:tsg-fangruppe@example.com?subject=${subject}&body=${body}`;
            window.location.href = mailtoLink;

            // Bewerbung auch lokal speichern
            const bewerbungen = JSON.parse(localStorage.getItem('tsg_bewerbungen') || '[]');
            bewerbungen.push({
                id: Date.now(),
                name: name,
                email: email,
                message: message,
                createdAt: new Date().toISOString()
            });
            localStorage.setItem('tsg_bewerbungen', JSON.stringify(bewerbungen));

            showNotification('Bewerbung wird vorbereitet! E-Mail-Programm öffnet sich...', 'success');
            fangruppeForm.reset();
        });
    }
});
