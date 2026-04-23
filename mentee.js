const BASE_URL = 'https://spe-congo-project.onrender.com/';
let currentRelId = null;
let emailFelicEnvoye = false;

// ── INIT ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) { window.location.href = 'index.html'; return; }
    chargerProfil(userId);
    chargerRelations(userId);
});

// ── PROFIL ─────────────────────────────────────────
async function chargerProfil(userId) {
    try {
        const res = await fetch(`${BASE_URL}/api/mentee/profil?userId=${userId}`);
        const data = await res.json();
        if (!data) return;

        document.getElementById('mentee-nom').textContent = 'Bienvenue, ' + data.nom_complet;
        document.getElementById('mentee-email').textContent = data.email;

        const av = document.getElementById('mentee-avatar');
        if (data.photo_path) {
            av.innerHTML = `<img src="${BASE_URL}/${data.photo_path}" alt="photo">`;
        } else {
            av.textContent = data.nom_complet[0].toUpperCase();
        }
    } catch (e) { console.error('Erreur profil:', e); }
}

// ── RELATIONS ──────────────────────────────────────
async function chargerRelations(userId) {
    try {
        const res = await fetch(`${BASE_URL}/api/mentee/relations?userId=${userId}`);
        const relations = await res.json();
        const container = document.getElementById('liste-relations');

        if (!relations.length) {
            container.innerHTML = '<p class="empty">Aucun binôme trouvé.</p>';
            return;
        }

        container.innerHTML = relations.map(r => {
            const poste = r.mentor_poste || r.mentor_expertise || '';
            const photoHtml = r.mentor_photo
                ? `<img src="${BASE_URL}/${r.mentor_photo}" alt="">`
                : r.mentor_nom[0].toUpperCase();

            return `
                <div class="relation-card" onclick="ouvrirRelation(
                    ${r.id},
                    '${r.mentor_nom.replace(/'/g, "&#39;")}',
                    '${poste.replace(/'/g, "&#39;")}',
                    '${r.mentor_email}',
                    '${r.mentor_photo || ''}'
                )">
                    <div class="rel-avatar">${photoHtml}</div>
                    <div class="rel-info">
                        <strong>${r.mentor_nom}</strong>
                        <span>${poste}</span>
                    </div>
                    <span class="rel-badge ${r.statut === 'actif' ? 'badge-actif' : 'badge-termine'}">
                        ${r.statut === 'actif' ? '✅ Actif' : '🏁 Terminé'}
                    </span>
                </div>`;
        }).join('');
    } catch (e) { console.error('Erreur relations:', e); }
}

// ── OUVRIR DÉTAIL ──────────────────────────────────
function ouvrirRelation(relId, mentorNom, mentorPoste, mentorEmail, mentorPhoto) {
    currentRelId = relId;
    emailFelicEnvoye = false;

    document.getElementById('vue-relations').style.display = 'none';
    document.getElementById('detail-panel').style.display = 'block';

    document.getElementById('detail-mentor-nom').textContent = mentorNom;
    document.getElementById('detail-mentor-poste').textContent = mentorPoste;
    document.getElementById('detail-mentor-email').textContent = mentorEmail;
    document.getElementById('detail-mentor-email').href = 'mailto:' + mentorEmail;

    const av = document.getElementById('detail-mentor-avatar');
    av.innerHTML = mentorPhoto
        ? `<img src="${BASE_URL}/${mentorPhoto}" alt="">`
        : mentorNom[0].toUpperCase();

    chargerObjectifs(relId);
}

// ── RETOUR LISTE ───────────────────────────────────
function retourListe() {
    document.getElementById('vue-relations').style.display = 'block';
    document.getElementById('detail-panel').style.display = 'none';
    currentRelId = null;
}

// ── OBJECTIFS ──────────────────────────────────────
async function chargerObjectifs(relId) {
    try {
        const res = await fetch(`${BASE_URL}/get-objectifs?relId=${relId}`);
        const objectifs = await res.json();
        const container = document.getElementById('liste-objectifs');

        if (!objectifs.length) {
            container.innerHTML = '<p class="empty">Aucun objectif défini.</p>';
            mettreAJourProgression([]);
            return;
        }

        container.innerHTML = objectifs.map(obj => {
            const titre = obj.titre.replace(/'/g, "&#39;");
            return `
                <div class="goal-item ${obj.statut === 'termine' ? 'termine' : ''}" id="goal-${obj.id}">
                    <input type="checkbox"
                        ${obj.statut === 'termine' ? 'checked' : ''}
                        onchange="toggleObjectif(${obj.id}, this.checked, '${titre}')">
                    <span class="goal-titre">${obj.titre}</span>
                </div>`;
        }).join('');

        mettreAJourProgression(objectifs);
    } catch (e) { console.error('Erreur objectifs:', e); }
}

// ── TOGGLE OBJECTIF ────────────────────────────────
async function toggleObjectif(objId, isChecked, titre) {
    try {
        const res = await fetch(`${BASE_URL}/update-objectif`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ objId, statut: isChecked ? 'termine' : 'a_faire' })
        });
        if (res.ok) {
            await chargerObjectifs(currentRelId);
            if (isChecked) {
                declencherEmail(currentRelId, 50, titre);
                showToast('🎯 Objectif atteint !', 'ok');
            }
        }
    } catch (e) { console.error('Erreur toggle:', e); }
}

// ── PROGRESSION ────────────────────────────────────
function mettreAJourProgression(objectifs) {
    const total = objectifs.length;
    const termines = objectifs.filter(o => o.statut === 'termine').length;
    const pct = total > 0 ? Math.round((termines / total) * 100) : 0;

    document.getElementById('detail-pct').textContent = pct;
    document.getElementById('detail-progress-fill').style.width = pct + '%';
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-termines').textContent = termines;
    document.getElementById('stat-restants').textContent = total - termines;

    const box = document.getElementById('felicitations-box');
    if (pct === 100 && total > 0) {
        if (!document.getElementById('msg-felicitations')) {
            box.innerHTML = `
                <div class="felicitations" id="msg-felicitations">
                    <span>🏆</span>
                    <div><strong>Mission accomplie !</strong><br>
                    Vous avez atteint tous vos objectifs !</div>
                </div>`;
        }
        if (!emailFelicEnvoye) {
            emailFelicEnvoye = true;
            declencherEmail(currentRelId, 100, '');
        }
    } else {
        emailFelicEnvoye = false;
        box.innerHTML = '';
    }
}

// ── EMAIL ──────────────────────────────────────────
async function declencherEmail(relId, progression, titre) {
    try {
        await fetch(`${BASE_URL}/envoyer-felicitations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                relId, titre,
                type: progression === 100 ? 'tous_objectifs' : 'un_objectif'
            })
        });
    } catch (e) { console.error('Erreur email:', e); }
}

// ── TOAST ──────────────────────────────────────────
function showToast(msg, type = 'ok') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type} show`;
    setTimeout(() => t.classList.remove('show'), 3000);
}

// ── LOGOUT ─────────────────────────────────────────
function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}