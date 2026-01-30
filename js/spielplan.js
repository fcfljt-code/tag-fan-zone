// Spielplan & Ergebnisse - OpenLigaDB API
// TSG 1899 Hoffenheim Fan-Website

const SAISON = '2025';
const TEAM_ID = 175; // TSG 1899 Hoffenheim Team ID bei OpenLigaDB
const OPENLIGADB_MATCHES_URL = `https://api.openligadb.de/getmatchdata/bl1/${SAISON}`;

async function loadSpielplan() {
    try {
        const response = await fetch(OPENLIGADB_MATCHES_URL);

        if (!response.ok) {
            throw new Error('API nicht erreichbar');
        }

        const allMatches = await response.json();

        // Nur Hoffenheim-Spiele filtern
        const hoffenheimMatches = allMatches.filter(match =>
            match.team1.teamId === TEAM_ID || match.team2.teamId === TEAM_ID
        );

        // Sortieren nach Datum
        hoffenheimMatches.sort((a, b) => new Date(a.matchDateTime) - new Date(b.matchDateTime));

        const now = new Date();

        // Vergangene und zukünftige Spiele trennen
        const vergangeneSpiele = hoffenheimMatches.filter(match => {
            const matchDate = new Date(match.matchDateTime);
            return matchDate < now && match.matchIsFinished;
        });

        const naechsteSpiele = hoffenheimMatches.filter(match => {
            const matchDate = new Date(match.matchDateTime);
            return matchDate >= now || !match.matchIsFinished;
        });

        renderNaechsteSpiele(naechsteSpiele.slice(0, 3));
        renderLetzteErgebnisse(vergangeneSpiele.slice(-3).reverse());

    } catch (error) {
        console.error('Fehler beim Laden des Spielplans:', error);
        document.getElementById('naechste-spiele').innerHTML = '<div class="loading">Spiele konnten nicht geladen werden</div>';
        document.getElementById('letzte-ergebnisse').innerHTML = '<div class="loading">Ergebnisse konnten nicht geladen werden</div>';
    }
}

function renderNaechsteSpiele(spiele) {
    const container = document.getElementById('naechste-spiele');

    if (!spiele || spiele.length === 0) {
        container.innerHTML = '<div class="loading">Keine kommenden Spiele gefunden</div>';
        return;
    }

    container.innerHTML = spiele.map(spiel => {
        const datum = formatDatum(spiel.matchDateTime);
        const zeit = formatZeit(spiel.matchDateTime);
        const isHome = spiel.team1.teamId === TEAM_ID;

        return `
            <div class="spiel-card">
                <div class="spiel-date">${datum} - ${zeit} Uhr</div>
                <div class="spiel-teams">
                    <span class="spiel-team home ${isHome ? 'tsg' : ''}">${spiel.team1.shortName || spiel.team1.teamName}</span>
                    <span class="spiel-vs">vs</span>
                    <span class="spiel-team away ${!isHome ? 'tsg' : ''}">${spiel.team2.shortName || spiel.team2.teamName}</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderLetzteErgebnisse(spiele) {
    const container = document.getElementById('letzte-ergebnisse');

    if (!spiele || spiele.length === 0) {
        container.innerHTML = '<div class="loading">Keine Ergebnisse gefunden</div>';
        return;
    }

    container.innerHTML = spiele.map(spiel => {
        const datum = formatDatum(spiel.matchDateTime);
        const isHome = spiel.team1.teamId === TEAM_ID;

        // Endergebnis finden
        const endResult = spiel.matchResults?.find(r => r.resultTypeID === 2) ||
                         spiel.matchResults?.[spiel.matchResults.length - 1];

        let tore1 = '-';
        let tore2 = '-';
        let resultClass = '';

        if (endResult) {
            tore1 = endResult.pointsTeam1;
            tore2 = endResult.pointsTeam2;

            // Ergebnis aus TSG-Sicht
            const tsgTore = isHome ? tore1 : tore2;
            const gegnerTore = isHome ? tore2 : tore1;

            if (tsgTore > gegnerTore) {
                resultClass = 'win';
            } else if (tsgTore < gegnerTore) {
                resultClass = 'loss';
            } else {
                resultClass = 'draw';
            }
        }

        return `
            <div class="spiel-card">
                <div class="spiel-date">${datum}</div>
                <div class="spiel-teams">
                    <span class="spiel-team home ${isHome ? 'tsg' : ''}">${spiel.team1.shortName || spiel.team1.teamName}</span>
                    <span class="spiel-result ${resultClass}">${tore1} : ${tore2}</span>
                    <span class="spiel-team away ${!isHome ? 'tsg' : ''}">${spiel.team2.shortName || spiel.team2.teamName}</span>
                </div>
            </div>
        `;
    }).join('');
}

function formatDatum(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('de-DE', options);
}

function formatZeit(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

// Spielplan beim Laden der Seite abrufen
document.addEventListener('DOMContentLoaded', () => {
    loadSpielplan();

    // Automatische Aktualisierung alle 10 Minuten
    setInterval(loadSpielplan, 10 * 60 * 1000);
});
