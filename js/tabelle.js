// Bundesliga Tabelle - OpenLigaDB API
// TSG 1899 Hoffenheim Fan-Website

const OPENLIGADB_TABELLE_URL = 'https://api.openligadb.de/getbltable/bl1/2025';

async function loadBundesligaTabelle() {
    const tabelleBody = document.getElementById('tabelle-body');

    try {
        const response = await fetch(OPENLIGADB_TABELLE_URL);

        if (!response.ok) {
            throw new Error('API nicht erreichbar');
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            tabelleBody.innerHTML = '<tr><td colspan="9" class="loading">Keine Daten verfügbar</td></tr>';
            return;
        }

        renderTabelle(data);

    } catch (error) {
        console.error('Fehler beim Laden der Tabelle:', error);
        tabelleBody.innerHTML = `
            <tr>
                <td colspan="9" class="loading">
                    Tabelle konnte nicht geladen werden.<br>
                    <small>Bitte später erneut versuchen.</small>
                </td>
            </tr>
        `;
    }
}

function renderTabelle(teams) {
    const tabelleBody = document.getElementById('tabelle-body');

    const rows = teams.map((team, index) => {
        const platz = index + 1;
        const isHoffenheim = team.teamName.toLowerCase().includes('hoffenheim');
        const tordiff = team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff;

        return `
            <tr class="${isHoffenheim ? 'hoffenheim' : ''}">
                <td>${platz}</td>
                <td>
                    <div class="team-cell">
                        <img src="${team.teamIconUrl || ''}" alt="${team.shortName}" class="team-logo" onerror="this.style.display='none'">
                        <span>${team.shortName || team.teamName}</span>
                    </div>
                </td>
                <td>${team.matches}</td>
                <td>${team.won}</td>
                <td>${team.draw}</td>
                <td>${team.lost}</td>
                <td>${team.goals}:${team.opponentGoals}</td>
                <td>${tordiff}</td>
                <td><strong>${team.points}</strong></td>
            </tr>
        `;
    }).join('');

    tabelleBody.innerHTML = rows;
}

// Tabelle beim Laden der Seite abrufen
document.addEventListener('DOMContentLoaded', () => {
    loadBundesligaTabelle();

    // Automatische Aktualisierung alle 5 Minuten
    setInterval(loadBundesligaTabelle, 5 * 60 * 1000);
});
