// ==========================================
// 0. VARIABLES GLOBALES
// ==========================================
let mentorsData = [];
let allNews = [];
let allEvents = [];
let emailFelicEnvoye = false;
let myChart = null;
let myGauge = null;
let myOfferChart = null;
let myGrowthChart = null;

const urlParams = new URLSearchParams(window.location.search);
const relId = urlParams.get('id') || urlParams.get('relId');

// ==========================================
// 1. INITIALISATION AU CHARGEMENT
// ==========================================
function chargerUtilisateur() {
const userRaw = localStorage.getItem('user');
if (userRaw && userRaw !== "undefined") {
const user = JSON.parse(userRaw);
console.log("Utilisateur chargé, ID :", user.id);
return user;
}
return null;
}

document.addEventListener('DOMContentLoaded', () => {
const user = chargerUtilisateur();
const currentUserId = user ? user.id : null;
const userRole = user ? user.role : null;


checkLoginStatus();

// Dans DOMContentLoaded, si on est sur admin.html
// Au démarrage : juste les compteurs
if (window.location.pathname.includes('admin')) {
    console.log("Page admin détectée!");
    Promise.all([
        fetch('https://spe-congo-project.onrender.com/api/admin/mentors').then(res => res.json()),
        fetch('https://spe-congo-project.onrender.com/api/admin/mentees').then(res => res.json()),
        fetch('https://spe-congo-project.onrender.com/api/admin/relationships').then(res => res.json())
    ]).then(([mentors, mentees, rels]) => {
        const el1 = document.getElementById('total-mentor-count');
        const el2 = document.getElementById('total-mentees-count');
        const el3 = document.getElementById('total-rels-count');
        if (el1) el1.innerText = mentors.length; // ✅ tous les mentors
        if (el2) el2.innerText = mentees.length;
        if (el3) el3.innerText = rels.length;
    }).catch(err => console.error("Erreur stats:", err));
}

// Chargement conditionnel selon la page
if (document.getElementById('events-container')) loadEvents();
if (document.getElementById('news-grid')) loadNews();
if (document.getElementById('members-grid')) loadMembers();
if (document.getElementById('mentors-container')) fetchMentors();

// Page suivi mentorat
if (relId && document.getElementById('liste-objectifs')) {
    chargerInfosBinome();
    chargerObjectifs(relId);
}

// Dashboard mentor
if (window.location.pathname.includes('dashbord-mentor')) {
    const mentorId = localStorage.getItem('userId');
    if (mentorId) {
        chargerDemandesMentor(mentorId);
        chargerMenteesSuivis(mentorId);
    }
}

// Admin
if (window.location.pathname.includes('admin')) {
    if (typeof loadMentors === 'function') loadMentors();
    loadAdminNews();
    loadAdminEvents();
}

// Menu mobile
const menuToggle = document.getElementById('mobile-menu');
const navMenu = document.getElementById('nav-menu');
if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
       
    });
}

// Formulaire login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        if (!usernameInput || !passwordInput) return;

        try {
            const res = await fetch('https://spe-congo-project.onrender.com/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usernameInput.value,
                    password: passwordInput.value
                })
            });
            const data = await res.json();

            console.log("DEBUG - Utilisateur complet:", data.user);
console.log("DEBUG - Statut reçu:", data.user.statut);
if (data.success) {
  // 1. Stockage des infos de session
  localStorage.setItem('user', JSON.stringify(data.user));
  localStorage.setItem('userId', data.user.userId);
  localStorage.setItem('isLoggedIn', 'true');

  // 2. Fermeture du modal de login
  const loginModal = document.getElementById('loginModal');
  if (loginModal) loginModal.style.display = 'none';
  document.body.style.overflow = 'auto';

  // 3. Redirection selon le rôle et le statut
  if (data.user.role === 'admin') {
    window.location.href = 'admin.html';
    return;
  }

  if (data.user.role === 'mentor' && data.user.statut === 'ACTIF') {
    window.location.href = 'dashbord-mentor.html';
    return;
  }

  if (data.user.role === 'mentee' && data.user.statut === 'EN FORMATION') {
    window.location.href = 'dashbord-mentee.html';
    return;
  }

  // Tous les autres cas (en_attente, user simple) → reload
  window.location.reload();

} else {
  const errorEl = document.getElementById('error-msg');
  if (errorEl) {
    errorEl.innerText = data.message || "Identifiants incorrects";
    errorEl.style.color = "red";
  }
}
    } catch (err) {
        console.error("Erreur serveur login :", err);
        alert("Erreur de connexion au serveur.");
    }
    });
}

//Formulaire signup
const signupForm = document.getElementById('signup-form');
if (signupForm){
    signupForm.addEventListener('submit',async(e) => {
        e.preventDefault();
        const errorEl= document.getElementById('signup-error-msg');

        const body ={
            username: document.getElementById('signup-username').value,
            email: document.getElementById('signup-email').value,
            password: document.getElementById('signup-password').value,
            confirm: document.getElementById('signup-confirm').value
        };

        try{
            const res = await fetch(`https://spe-congo-project.onrender.com/api/signup`, {
                method:'POST',
                headers:{'Content-Type': 'application/json'},
                body:JSON.stringify(body)
            });
            const data = await res.json();

            if (data.success){
                alert("Compte créé avec succes! Vous pouvez maintenant vous connecter");
                document.getElementById('signupModal').style.display ='none';
                signupForm.reset();
            } else {
                if (errorEl){
                    errorEl.innerText = data.message;
                    errorEl.style.color = 'red';
                }
            }
        } catch (err){
            console.error("Erreur signup:", err);
            alert("Impossible de contacter le serveur.");
        }
    });
}

// Formulaire inscription mentor
const btnEnregistrer = document.getElementById('btnEnregistrer');
const mentorForm = document.getElementById('mentorForm');
if (btnEnregistrer && mentorForm) {
    btnEnregistrer.addEventListener('click', async () => {
        if (!mentorForm.checkValidity()) { mentorForm.reportValidity(); return; }
        const formData = new FormData(mentorForm);
         const userId=localStorage.getItem('userId');
        if(userId){
            formData.append('user_id', userId);
        }
        try {
            const response = await fetch('https://spe-congo-project.onrender.com/api/register-mentor', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                alert("Demande envoyée avec succès !");
                window.location.href = "students.html";
            } else {
                alert("Erreur : " + result.message);
            }
        } catch (error) {
            alert("Impossible de contacter le serveur.");
        }
    });
}

// Formulaire inscription mentee
const btnEnregistrerMentee = document.getElementById('btnEnregistrerMentee');
const menteeForm = document.getElementById('menteeForm');
if (btnEnregistrerMentee && menteeForm) {
    btnEnregistrerMentee.addEventListener('click', async () => {
        if (!menteeForm.checkValidity()) { menteeForm.reportValidity(); return; }
        const formData = new FormData(menteeForm);
        const userId=localStorage.getItem('userId');
        if(userId){
            formData.append('user_id', userId);
        }
        try {
            const response = await fetch('https://spe-congo-project.onrender.com/api/register-mentee', { method: 'POST', body: formData });
            const result = await response.json();
            if (result.success) {
                alert("Demande envoyée avec succès !");
                window.location.href = "students.html";
            } else {
                alert("Erreur : " + result.message);
            }
        } catch (error) {
            alert("Impossible de contacter le serveur.");
        }
    });
}

// Formulaire news admin
const newsForm = document.getElementById('add-news-form');
if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('news-image-file');
        if (fileInput.files.length === 0) {
            alert("Veuillez sélectionner une image !");
            return;
        }
        const formData = new FormData();
        formData.append('titre', document.getElementById('news-title').value);
        formData.append('contenu', document.getElementById('news-content').value);
        formData.append('categorie', document.getElementById('news-category').value);
        formData.append('image_file', fileInput.files[0]);

        const flyerInput = document.getElementById('news-flyer-file');
        if (flyerInput && flyerInput.files.length > 0) {
            formData.append('flyer_file', flyerInput.files[0]);
        }

        try {
            const response = await fetch('https://spe-congo-project.onrender.com/api/news', { method: 'POST', body: formData });
            if (response.ok) {
                alert("News publiée avec succès !");
                newsForm.reset();
                loadAdminNews();
            } else {
                alert("Erreur serveur.");
            }
        } catch (err) {
            alert("Impossible de joindre le serveur.");
        }
    });
}

// Formulaire événement admin
const formEvent = document.getElementById('form-event');
if (formEvent) {
    formEvent.addEventListener('submit', function(e) {
        e.preventDefault();
        const eventData = {
            titre: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            lieu: document.getElementById('event-location').value,
            description: document.getElementById('event-desc').value
        };
        fetch('https://spe-congo-project.onrender.com/api/add-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Événement publié !");
                location.reload();
            } else {
                alert("Erreur: " + data.error);
            }
        })
        .catch(err => console.error("Erreur fetch:", err));
    });
}

// Formulaire modifier événement
const editEventForm = document.getElementById('editEventForm');
if (editEventForm) {
    editEventForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-event-id').value;
        const updatedEvent = {
            titre: document.getElementById('edit-event-title').value,
            date_evenement: document.getElementById('edit-event-date').value,
            lieu: document.getElementById('edit-event-location').value,
            description: document.getElementById('edit-event-desc').value
        };
        const res = await fetch(`https://spe-congo-project.onrender.com/api/events/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEvent)
        });
        if (res.ok) {
            alert("Événement mis à jour !");
            closeEventModal();
            loadAdminEvents();
        }
    };
}

// Formulaire modifier news
const editForm = document.getElementById('editForm');
if (editForm) {
    editForm.onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const formData = new FormData();
        formData.append('titre', document.getElementById('edit-title').value);
        formData.append('contenu', document.getElementById('edit-content').value);
        formData.append('categorie', document.getElementById('edit-category').value);

        const fileInput = document.getElementById('edit-image');
        if (fileInput && fileInput.files.length > 0) {
            formData.append('image_file', fileInput.files[0]);
        }

        const flyerInput = document.getElementById('edit-flyer');
        if (flyerInput && flyerInput.files.length > 0) {
            formData.append('flyer_file', flyerInput.files[0]);
        }

        try {
            const res = await fetch(`https://spe-congo-project.onrender.com/api/news/${id}`, {
                method: 'PUT',
                body: formData
            });
            if (res.ok) {
                alert("Actualité mise à jour !");
                closeEditModal();
                loadAdminNews();
            } else {
                alert("Erreur lors de la mise à jour.");
            }
        } catch (err) {
            console.error("Erreur:", err);
        }
    };
}

// Filtres news
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelector('.filter-btn.active')?.classList.remove('active');
        e.target.classList.add('active');
        const category = e.target.getAttribute('data-cat');
        renderNews(category === 'all' ? allNews : allNews.filter(item => item.categorie === category));
    });
});

// Fermer modales au clic extérieur
window.onclick = function(event) {
    const modals = ['signupModal', 'loginModal', 'mentorshipModal', 'ContactModal', 'motivationModal', 'editModal', 'editEventModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && event.target == modal) modal.style.display = 'none';
    });
};


});

// ==========================================
// 2. CONNEXION / DÉCONNEXION
// ==========================================
function checkLoginStatus() {
const isLoggedIn = localStorage.getItem('isLoggedIn');
const authOverlay = document.getElementById('auth-overlay');
if (isLoggedIn === 'true' && authOverlay) {
authOverlay.style.display = 'none';
document.body.style.overflow = 'auto';
}
}

function logout() {
localStorage.clear();
window.location.href = 'index.html';
}

// ==========================================
// 3. MODALES
// ==========================================
function openModal() {
const modal = document.getElementById('loginModal');
if (modal) modal.style.display = 'block';
}

function closeModal() {
const modal = document.getElementById('loginModal');
if (modal) modal.style.display = 'none';
}

function openSignupModal() {
const modal = document.getElementById('signupModal');
if (modal) modal.style.display = 'block';
}

function closeSignupModal() {
    const modal = document.getElementById('signupModal');
if (modal) modal.style.display = 'none';
}

function openMentorshipModal() {
const modal = document.getElementById('mentorshipModal');
if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
}

function closeMentorshipModal() {
const modal = document.getElementById('mentorshipModal');
if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
}

function closeEditModal() {
const modal = document.getElementById('editModal');
if (modal) modal.style.display = 'none';
}

function closeEventModal() {
const modal = document.getElementById('editEventModal');
if (modal) modal.style.display = 'none';
}

// ==========================================
// 4. ADMIN - SHOW SECTION
// ==========================================
window.showSection = function(sectionId) {
document.querySelectorAll('.admin-section').forEach(section => {
section.classList.add('hidden');
});
const sectionToShow = document.getElementById(sectionId);
if (sectionToShow) sectionToShow.classList.remove('hidden');


// Chargement conditionnel selon la section
if (sectionId === 'mentors-section') loadMentors();
if (sectionId === 'events-section') loadAdminEvents();
if (sectionId === 'mentees-section') loadMentees();
if (sectionId === 'relationships-section') loadRelationships();
if (sectionId === 'stats-section') loadrefreshGlobalStats();
if (sectionId === 'admin-news') loadAdminNews();
if (sectionId === 'admin-galerie') chargerPhotosAdmin();
if (sectionId === 'messagerie-section') chargerMembresMessagerie();


};

// ==========================================
// 5. SUIVI BINÔME ET OBJECTIFS
// ==========================================
async function chargerInfosBinome() {
    try {
        const response = await fetch(`https://spe-congo-project.onrender.com/api/details-binome/${relId}`);
        if (!response.ok) throw new Error("Erreur serveur");
        const data = await response.json();

        if (document.getElementById('mentor-name')) document.getElementById('mentor-name').innerText = data.mentor_nom;
        if (document.getElementById('mentee-name')) document.getElementById('mentee-name').innerText = data.mentee_nom;

        // Correction pour le Mentor
        if (data.mentor_photo && document.querySelector('#mentor-avatar')) {
            // Si l'image commence par http, on prend l'URL directe, sinon on ajoute le préfixe Render
            const mentorSrc = data.mentor_photo.startsWith('http') 
                ? data.mentor_photo 
                : `https://spe-congo-project.onrender.com/${data.mentor_photo}`;
            
            document.querySelector('#mentor-avatar').innerHTML = `<img src="${mentorSrc}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }

        // Correction pour le Mentee
        if (data.mentee_photo && document.querySelector('#mentee-avatar')) {
            // Même logique ici
            const menteeSrc = data.mentee_photo.startsWith('http') 
                ? data.mentee_photo 
                : `https://spe-congo-project.onrender.com/${data.mentee_photo}`;
            
            document.querySelector('#mentee-avatar').innerHTML = `<img src="${menteeSrc}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
        }
        
    } catch (err) { 
        console.error("Erreur binôme :", err.message); 
    }
}

async function chargerObjectifs(idRelation) {
try {
const response = await fetch(`https://spe-congo-project.onrender.com/get-objectifs?relId=${idRelation}`);
const objectifs = await response.json();
const listeContainer = document.getElementById('liste-objectifs');
if (!listeContainer) return;


    listeContainer.innerHTML = objectifs.length === 0
        ? "<p class='empty-msg'>Aucun objectif défini.</p>"
        : objectifs.map(obj => {
            const titreSecurise = obj.titre.replace(/'/g, "&#39;");
            return `
                <div class="goal-card">
                    <input type="checkbox"
                        ${obj.statut === 'termine' ? 'checked' : ''}
                        onchange="toggleObjectif(${obj.id}, this.checked, '${titreSecurise}')">
                    <div class="goal-details">
                        <strong class="${obj.statut}">${obj.titre}</strong>
                    </div>
                </div>`;
        }).join('');

    mettreAJourProgression(objectifs);
} catch (err) { console.error("Erreur objectifs:", err); }


}

function mettreAJourProgression(objectifs) {
const total = objectifs.length;
const termines = objectifs.filter(o => o.statut === 'termine').length;
const pourcentage = total > 0 ? Math.round((termines / total) * 100) : 0;


const bar = document.getElementById('progress-fill');
const texte = document.getElementById('progress-percentage');
if (bar) bar.style.width = pourcentage + "%";
if (texte) texte.innerText = pourcentage + "%";

if (pourcentage === 100 && total > 0) {
    if (!document.getElementById('msg-felicitations')) afficherFelicitations();
    if (!emailFelicEnvoye) {
        emailFelicEnvoye = true;
        declencherEmail(relId, 100);
    }
} else {
    emailFelicEnvoye = false;
    const msg = document.getElementById('msg-felicitations');
    if (msg) msg.remove();
}

}

async function toggleObjectif(objId, isChecked, titre) {
try {
const res = await fetch(`https://spe-congo-project.onrender.com/update-objectif`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ objId, statut: isChecked ? 'termine' : 'a_faire' })
});
if (res.ok) {
await chargerObjectifs(relId);
if (isChecked) declencherEmail(relId, 50, titre);
}
} catch (err) { console.error("Erreur update statut :", err); }
}

async function ajouterNouvelObjectif() {
const titre = prompt("Entrez le nom de l'objectif :");
if (!titre || !relId) return;
await fetch(`https://spe-congo-project.onrender.com/ajouter-objectif`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ relId, titre })
});
chargerObjectifs(relId);
}

function afficherFelicitations() {
const container = document.getElementById('liste-objectifs');
if (container) {
container.insertAdjacentHTML('beforeend', ` <div id="msg-felicitations" style="text-align:center; padding:20px; background:#d4edda; border-radius:10px; margin-top:20px; color:#155724; border:1px solid #c3e6cb;"> <h3>Bravo au binôme ! 🎊</h3> <p>Tous les objectifs ont été atteints ! 🎉</p> </div>`);
}
}

async function declencherEmail(idRel, progression, titre = '') {
try {
const response = await fetch(`https://spe-congo-project.onrender.com/envoyer-felicitations`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
relId: idRel,
type: progression === 100 ? 'tous_objectifs' : 'un_objectif',
titre: titre
})
});
const data = await response.json();
if (data.success) console.log("Notification envoyée !");
else console.error("Erreur:", data.message);
} catch (err) { console.error("Erreur réseau mail:", err); }
}

// ==========================================
// 6. DASHBOARD MENTOR
// ==========================================
async function chargerDemandesMentor(mentorId) {
console.log("Démarrage du chargement pour le mentor :", mentorId);
const container = document.getElementById('liste-demandes');
if (!container) return;


try {
    const response = await fetch(`https://spe-congo-project.onrender.com/mes-demandes/${mentorId}`);
    if (!response.ok) throw new Error(`Erreur serveur : ${response.status}`);
    const demandes = await response.json();
    console.log("Demandes reçues :", demandes);

    container.innerHTML = "";
    if (!demandes || demandes.length === 0) {
        container.innerHTML = "<p>Aucune demande trouvée.</p>";
        return;
    }

    demandes.forEach(d => {
        const card = document.createElement('div');
        card.className = 'card-demande';
        card.innerHTML = `
            <h3>${d.mentee_nom}</h3>
            <p>"${d.message_demande || 'Pas de message'}"</p>
            <div class="card-actions">
                <button class="btn-accepter" onclick="repondreDemande(${d.id}, 'acceptee')">✅ Accepter</button>
                <button class="btn-refuser" onclick="repondreDemande(${d.id}, 'refusee')">❌ Refuser</button>
            </div>`;
        container.appendChild(card);
    });
} catch (err) {
    console.error("Erreur chargerDemandesMentor :", err);
    container.innerHTML = `<p style="color:red;">Erreur : ${err.message}</p>`;
}


}

async function chargerMenteesSuivis(userId) {
const container = document.getElementById('liste-mentees-actifs');
if (!container) return;


try {
    const response = await fetch(`https://spe-congo-project.onrender.com/api/liste-etudiants-suivis/${userId}`);
    const mentees = await response.json();
    container.innerHTML = "";

    if (mentees.length === 0) {
        container.innerHTML = "<p class='no-data'>Aucun étudiant en suivi actif.</p>";
        return;
    }

    mentees.forEach(m => {
        const card = document.createElement('div');
        card.className = 'card-mentee';
        card.innerHTML = `
            <h3>${m.nom_complet}</h3>
            <p><strong>Domaine :</strong> ${m.domaine_interet}</p>
            <p><strong>Email :</strong> ${m.email}</p>
            <button class="btn-gerer" onclick="window.location.href='suivi_mentorat.html?id=${m.relation_id}'">
                <i class="fas fa-tasks"></i> Gérer les objectifs
            </button>`;
        container.appendChild(card);
    });
} catch (err) {
    console.error("Erreur chargerMenteesSuivis :", err);
    container.innerHTML = "<p style='color:red;'>Erreur lors du chargement.</p>";
}


}

async function repondreDemande(demandeId, decision) {
if (!confirm(`Voulez-vous vraiment ${decision === 'acceptee' ? 'accepter' : 'refuser'} cette demande ?`)) return;


try {
    const response = await fetch(`https://spe-congo-project.onrender.com/repondre-demande`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandeId, decision })
    });
    const data = await response.json();
    if (data.success) {
        alert("Réponse enregistrée !");
        window.location.reload();
    }
} catch (err) {
    console.error("Erreur :", err);
    alert("Erreur lors de l'enregistrement.");
}


}

// ==========================================
// 7. EVENTS, NEWS, MEMBERS (PUBLIC)
// ==========================================
async function loadEvents() {
try {
const response = await fetch(`https://spe-congo-project.onrender.com/api/events`);
const events = await response.json();
const container = document.getElementById('events-container');
if (!container) return;
container.innerHTML = events.map(e => ` <div class="event-card"> <div class="event-header"><span>${e.statut}</span><span>${new Date(e.date_evenement).toLocaleDateString()}</span></div> <div class="event-content"><h3>${e.titre}</h3><p>📍 ${e.lieu}</p></div> </div>`).join('');
} catch (err) { console.error("Erreur événements :", err); }
}

async function loadNews() {
    try {
        const response = await fetch(`https://spe-congo-project.onrender.com/api/news`);
        const data = await response.json();
        allNews = Array.isArray(data) ? data : [];
        renderNews(allNews);
    } catch (error) {
        console.error("Erreur chargement news:", error);
    }
}
function renderNews(newsArray) {

  //  const resume= art.contenu.length>100? art.contenu.substring(0,100)+"...": art.contenu;
const container = document.getElementById('news-grid');
if (!container) return;


if (newsArray.length === 0) {
    container.innerHTML = "<p>Aucune actualité dans cette catégorie.</p>";
    return;
}

container.innerHTML = newsArray.map(art => `
    <div class="news-card">
        <img src="https://spe-congo-project.onrender.com/images/news/${art.image_path}" alt="">
        <div class="news-content">
            <span class="news-category">${art.categorie || 'NEWS'}</span>
            <h3>${art.titre}</h3>
            <p>${art.contenu.substring(0,10)}
           

                <a href="news-detail.html?id=${art.id}" class="Voir-plus" style="color:#0054a6; text-decoration:none; font-weight:bold; cursor:pointer;"> Voir plus...</a>

                  </p>
 ${art.flyer_path ? `
                

                <button onclick="ouvrirFlyer('${art.flyer_path}')"
                        style="background:#0054a6; color:white; border:none; padding:8px 15px;
                               border-radius:6px; cursor:pointer; font-size:0.85rem; margin-top:8px;">
                 Ouvrir le flyer
                </button>` : ''}

              
        </div>
    </div>`).join('');


}

async function loadMembers() {
const grid = document.getElementById('members-grid');
if (!grid) return;
try {
const response = await fetch(`https://spe-congo-project.onrender.com/api/members`);
const members = await response.json();
grid.innerHTML = members.map(m => ` <div class="officer-card"> <div class="officer-image"> <img src="https://spe-congo-project.onrender.com/images/members/${m.photo_name}" alt="${m.nom}"> </div> <div class="officer-info"> <h3>${m.nom}</h3><p class="role">${m.poste}</p> <div class="officer-contact"> <a href="mailto:${m.email}"><i class="fas fa-envelope"></i></a> <a href="${m.linkedin_url || '#'}" target="_blank"><i class="fab fa-linkedin"></i></a> </div> </div> </div>`).join('');
} catch (err) { console.error("Erreur membres :", err); }
}

// ==========================================
// 8. MENTORS PUBLIC (Liste & Contact)
// ==========================================
async function fetchMentors() {
const container = document.getElementById('mentors-container');
if (!container) return;
try {
const response = await fetch(`https://spe-congo-project.onrender.com/get-mentors`);
const mentors = await response.json();
container.innerHTML = mentors.map(m => ` <div class="mentor-card"> <img src="https://spe-congo-project.onrender.com/${m.photo_path}" style="width:100px; height:100px; border-radius:50%; object-fit:cover;"> <h3>${m.nom_complet}</h3> <p><strong>Domaine :</strong> ${m.domaine_expertise || 'Expertise'}</p> <button class="btn-contact" onclick="ouvrirContactModal(${m.id}, '${m.nom_complet.replace(/'/g, "\\'")}')"> Contacter ce mentor </button> </div>`).join('');
} catch (err) { console.error("Erreur chargement mentors publique :", err); }
}

window.ouvrirContactModal = function(mentorId, mentorNom) {
const user = JSON.parse(localStorage.getItem('user'));
if (!user) { alert("Connecte-toi d'abord !"); return; }


const modal = document.getElementById('ContactModal');
if (!modal) return;

document.getElementById('modalMentorName').innerText = mentorNom;
document.getElementById('modalMentorId').value = mentorId;
document.getElementById('modalMenteeId').value = user.id;
modal.style.display = 'block';

const btn = document.getElementById('btnEnvoyerDemande');
if (btn) {
    btn.onclick = async function() {
        const message = document.getElementById('modalMessage').value;
        if (!message.trim()) { alert("Écris un message avant d'envoyer !"); return; }
        try {
            const res = await fetch(`https://spe-congo-project.onrender.com/api/nouvelle-demande`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mentorId, menteeId: user.userId, message })
            });
            const data = await res.json();
            if (data.success) {
                alert("Ta demande a été envoyée !");
                modal.style.display = 'none';
                document.getElementById('modalMessage').value = "";
            } else {
                alert("Erreur : " + data.message);
            }
        } catch (err) {
            alert("Le serveur ne répond pas !");
        }
    };
}


};



// ==========================================
// 9. ADMIN - MENTORS
// ==========================================
function loadMentors() {
fetch(`https://spe-congo-project.onrender.com/api/admin/mentors`)
.then(res => res.json())
.then(mentors => {
mentorsData = mentors;
const tbody = document.getElementById('mentors-list-body');
if (!tbody) return;
let rows = '';


        mentors.forEach(m => {
            const photoUrl = m.photo_path ? `https://spe-congo-project.onrender.com/${m.photo_path.replace(/\\/g, '/')}` : null;
            const photoHtml = photoUrl
                ? `<img src="${photoUrl}" class="admin-photo-thumbnail">`
                : `<div class="photo-placeholder">${m.nom_complet.charAt(0)}</div>`;

            const statusClean = m.statut.toLowerCase().trim();
            let actionsHtml = '';
            if (['en attente', 'en_attente', 'attente'].includes(statusClean)) {
                actionsHtml = `
                    <div class="actions-group">
                        <button onclick="updateMentorStatus(${m.id}, 'ACTIF')" class="btn-approve">Accepter</button>
                        <button onclick="updateMentorStatus(${m.id}, 'REFUSE')" class="btn-reject">Refuser</button>
                    </div>`;
            } else {
                actionsHtml = `<button onclick="deleteMentor(${m.id})" class="btn-delete-small">Supprimer</button>`;
            }

            rows += `
                <tr>
                    <td>${photoHtml}</td>
                    <td><strong>${m.nom_complet}</strong><br><small>${m.poste_entreprise}</small></td>
                    <td><span class="expertise-tag">${m.domaine_expertise}</span></td>
                    <td><a href="mailto:${m.email_contact}">${m.email_contact}</a></td>
                    <td><button onclick="openMentorModal(${m.id})" class="btn-info">Lire</button></td>
                    <td><span class="status-badge status-${statusClean.replace(' ', '-')}">${m.statut}</span></td>
                    <td>${actionsHtml}</td>
                </tr>`;
        });
        tbody.innerHTML = rows;

         const totalEl = document.getElementById('total-mentors-count');
        if (totalEl) totalEl.innerText = `${mentors.length} inscrits`;
    })
    .catch(err => console.error("Erreur chargement mentors :", err));


}

window.updateMentorStatus = function(id, nouveauStatut) {
fetch(`https://spe-congo-project.onrender.com/api/admin/mentors/${id}/status`, {
method: 'PUT',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ statut: nouveauStatut })
})
.then(res => res.json())
.then(data => {
if (data.success) {
alert("Statut mis à jour !");
loadMentors();
}
});
};

function deleteMentor(id) {
if (!confirm("Supprimer ce mentor ?")) return;
fetch(`https://spe-congo-project.onrender.com/api/admin/mentors/${id}`, { method: 'DELETE' })
.then(res => res.json())
.then(data => {
if (data.error) { alert(data.error); }
else { loadMentors(); renderGrowthChart(); renderSectorChart(); }
})
.catch(err => console.error("Erreur suppression :", err));
}

function openMentorModal(id) {
const m = mentorsData.find(mentor => mentor.id === id);
if (!m) return;
document.getElementById('modalNom').innerText = m.nom_complet;
document.getElementById('motivationText').innerText = m.motivations;
document.getElementById('modalExpertise').innerText = m.domaine_expertise;


const photoContainer = document.getElementById('modalPhotoContainer');
const photoUrl = m.photo_path ? `https://spe-congo-project.onrender.com/${m.photo_path.replace(/\\/g, '/')}` : null;
photoContainer.innerHTML = photoUrl
    ? `<img src="${photoUrl}" class="admin-photo-thumbnail">`
    : `<div class="photo-placeholder">${m.nom_complet.charAt(0)}</div>`;

document.getElementById('motivationModal').style.display = "block";


}

function closeMentorModal() {
const modal = document.getElementById('motivationModal');
if (modal) modal.style.display = 'none';
}

// ==========================================
// 10. ADMIN - MENTEES
// ==========================================
function loadMentees() {
fetch(`https://spe-congo-project.onrender.com/api/admin/mentees`)
.then(res => res.json())
.then(mentees => {
const tbody = document.getElementById('mentees-list-body');
if (!tbody) return;
tbody.innerHTML = '';


        mentees.forEach(m => {
            let photoHtml;
            if (m.photo_path) {
                const cleanPath = m.photo_path.replace(/\\/g, '/');
                photoHtml = `<img src="https://spe-congo-project.onrender.com/${cleanPath}" style="width:45px; height:45px; border-radius:50%; object-fit:cover;">`;
            } else {
                photoHtml = `<div style="width:45px; height:45px; border-radius:50%; background:#ccc; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">${m.nom_complet.charAt(0)}</div>`;
            }
            const cvUrl = m.cv_path ? `https://spe-congo-project.onrender.com/${m.cv_path.replace(/\\/g, '/')}` : null;

            tbody.innerHTML += `
                <tr>
                    <td>${photoHtml}</td>
                    <td><strong>${m.nom_complet}</strong><br><small>${m.email}</small></td>
                    <td>${m.ecole || 'N/A'}</td>
                    <td>${m.domaine_interet}</td>
                    <td><span class="status-badge">${m.statut}</span></td>
                    <td>${cvUrl ? `<a href="${cvUrl}" target="_blank">Voir CV</a>` : '---'}</td>
                    <td><button onclick="deleteMentee(${m.id})" style="color:red; cursor:pointer; border:none; background:none;">Supprimer</button></td>
                    <td>
                           ${m.statut !== 'TERMINE' ? `<button onclick="terminerMentee(${m.id})" 
                    style="color:green; cursor:pointer; border:none; background:none; margin-left:8px;">
                ✅ Terminer
            </button>` : ''}
        </td>
    
                </tr>`;
        });
        const totalEl = document.getElementById('total-mentees');
        if (totalEl) totalEl.innerText = `${mentees.length} inscrits`;
    });


}

window.deleteMentee = function(id) {
if (confirm("Supprimer ce mentee ?")) {
fetch(`https://spe-congo-project.onrender.com/api/admin/mentees/${id}`, { method: 'DELETE'})
.then(res => res.json())
.then(data => { if (data.success) loadMentees(); });
}
};

//fonction pour clore le parcous de mentorat d'un mentee
async function terminerMentee(id) {
    if (!confirm("Marquer ce mentee comme terminé ?")) return;
    await fetch(`https://spe-congo-project.onrender.com/api/admin/mentees/${id}/statut`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: 'TERMINE' })
    });
    loadMentees();
}

// ==========================================
// 11. ADMIN - EVENTS
// ==========================================
function loadAdminEvents() {
fetch(`https://spe-congo-project.onrender.com/api/events`)
.then(res => res.json())
.then(events => {
allEvents = events;
const list = document.getElementById('admin-event-list');
if (!list) return;
list.innerHTML = '';
events.forEach(event => {
const dateFmt = new Date(event.date_evenement).toLocaleDateString('fr-FR');
list.innerHTML += ` <tr> <td>${event.titre}</td> <td>${dateFmt}</td> <td>${event.lieu}</td> <td><span class="badge">${event.statut}</span></td> <td> <button class="btn-edit" onclick="editEvent(${event.id})">Modifier</button> <button class="btn-delete" onclick="deleteEvent(${event.id})">Supprimer</button> </td> </tr>`;
});
});
}

window.deleteEvent = function(id) {
if (confirm("Supprimer cet événement ?")) {
fetch(`https://spe-congo-project.onrender.com/api/events/${id}`, { method: 'DELETE' })
.then(res => res.json())
.then(data => { if (data.success) loadAdminEvents(); });
}
};

function editEvent(id) {
const event = allEvents.find(e => e.id === id);
if (!event) return;
document.getElementById('edit-event-id').value = event.id;
document.getElementById('edit-event-title').value = event.titre;
document.getElementById('edit-event-location').value = event.lieu;
document.getElementById('edit-event-desc').value = event.description || "";
if (event.date_evenement) {
const date = new Date(event.date_evenement);
date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
document.getElementById('edit-event-date').value = date.toISOString().slice(0, 16);
}
document.getElementById('editEventModal').style.display = "block";
}

// ==========================================
// 12. ADMIN - NEWS
// ==========================================
async function loadAdminNews() {
try {
const response = await fetch(`https://spe-congo-project.onrender.com/api/news`);
const news = await response.json();
allNews = news
const listContainer = document.getElementById('admin-news-list');
if (!listContainer) return;


    listContainer.innerHTML = news.map(art => {
        const dateAffiche = art.date_publication
            ? new Date(art.date_publication).toLocaleDateString('fr-FR')
            : "Date inconnue";
        return `
            <tr>
                <td><img src="https://spe-congo-project.onrender.com/images/news/${art.image_path}" class="admin-thumb"></td>
                <td><strong>${art.titre}</strong></td>
                <td><span class="badge">${art.categorie || 'News'}</span></td>
                <td>${dateAffiche}</td>
                <td>
                    <button class="btn-edit" onclick="editNews(${art.id})">Modifier</button>
                    <button class="btn-delete" onclick="deleteNews(${art.id})">Supprimer</button>
                </td>
            </tr>`;
    }).join('');
} catch (error) { console.error("Erreur admin list:", error); }


}

async function deleteNews(id) {
if (confirm("Supprimer cette actualité ?")) {
try {
const response = await fetch(`https://spe-congo-project.onrender.com/api/news/${id}`, { method: 'DELETE' });
if (response.ok) { alert("News supprimée !"); loadAdminNews(); }
} catch (error) { console.error("Erreur:", error); }
}
}

function editNews(id) {
    const art = allNews.find(item => item.id === id);
    if (!art) return;

    document.getElementById('edit-id').value = art.id;
    document.getElementById('edit-title').value = art.titre;
    document.getElementById('edit-content').value = art.contenu;
    document.getElementById('edit-category').value = art.categorie || 'News';
    document.getElementById('editModal').style.display = "block";
}


// ==========================================
// 13. ADMIN - BINÔMES
// ==========================================
function loadRelationships() {
fetch(`https://spe-congo-project.onrender.com/api/admin/relationships`)
.then(res => res.json())
.then(data => {
const container = document.getElementById('relationships-container');
if (!container) return;
container.innerHTML = '';


        if (data.length === 0) {
            container.innerHTML = '<p class="no-data">Aucun binôme formé.</p>';
            return;
        }

        data.forEach(rel => {
            const percent = rel.total_obj > 0 ? Math.round((rel.obj_faits / rel.total_obj) * 100) : 0;
            const mentorPhotoUrl = rel.mentor_photo ? `https://spe-congo-project.onrender.com/${rel.mentor_photo.replace(/\\/g, '/')}` : 'images/default-avatar.png';
            const menteePhotoUrl = rel.mentee_photo ? `https://spe-congo-project.onrender.com/${rel.mentee_photo.replace(/\\/g, '/')}` : 'images/default-avatar.png';

            container.innerHTML += `
                <div class="relationship-card">
                    <div class="rel-header-photos">
                        <div class="photo-group">
                            <img src="${mentorPhotoUrl}" class="rel-avatar">
                            <div><small>Mentor</small><br><strong>${rel.mentor_nom}</strong></div>
                        </div>
                        <div class="vs-divider"><i class="fas fa-link"></i></div>
                        <div class="photo-group">
                            <img src="${menteePhotoUrl}" class="rel-avatar">
                            <div><small>Mentee</small><br><strong>${rel.mentee_nom}</strong></div>
                        </div>
                    </div>
                    <div class="progress-wrapper">
                        <div class="progress-label">
                            <span>Évolution</span><strong>${percent}%</strong>
                        </div>
                        <div class="progress-container">
                            <div class="progress-bar" style="width:${percent}%"></div>
                        </div>
                    </div>
                    <div class="rel-footer">
                        <small>${rel.obj_faits} / ${rel.total_obj} objectifs</small>
                        <button onclick="deleteRelationship(${rel.relation_id})" class="btn-delete-small">🗑️</button>
                    </div>
                </div>`;
        });
    })
    .catch(err => console.error("Erreur binômes:", err));


}

window.deleteRelationship = function(id) {
if (confirm("Rompre ce binôme ? Action irréversible.")) {
fetch(`https://spe-congo-project.onrender.com/api/admin/relationships/${id}`, { method: 'DELETE' })
.then(res => res.json())
.then(data => {
if (data.success) loadRelationships();
else alert("Erreur : " + data.error);
})
.catch(err => console.error("Erreur suppression:", err));
}
};

// ==========================================
// 14. ADMIN - STATISTIQUES
// ==========================================
function loadrefreshGlobalStats() {
Promise.all([
fetch(`https://spe-congo-project.onrender.com/api/admin/mentors`).then(res => res.json()),
fetch(`https://spe-congo-project.onrender.com/api/admin/mentees`).then(res => res.json()),
fetch(`https://spe-congo-project.onrender.com/api/admin/relationships`).then(res => res.json())
])
.then(([mentors, mentees, rels]) => {
    console.log("Stats - Mentors:", mentors.length, "Mentees:", mentees.length, "Rels:", rels.length);
    
    if (document.getElementById('total-mentor-count')) 
        document.getElementById('total-mentors-count').innerText = mentors.length; // ✅

    if (document.getElementById('total-mentees-count')) 
        document.getElementById('total-mentees-count').innerText = mentees.length;

    if (document.getElementById('total-rels-count')) 
        document.getElementById('total-rels-count').innerText = rels.length;
})
.catch(err => console.error("Erreur stats:", err));

renderSectorChart();
renderGaugeChart();
renderOfferDemandChart();
renderGrowthChart();
}

function renderSectorChart() {
if (myChart !== null) myChart.destroy();
fetch(`https://spe-congo-project.onrender.com/api/admin/mentors`)
.then(res => res.json())
.then(mentors => {
const counts = {};
mentors.forEach(m => {
const domaine = m.domaine_expertise || "Non spécifié";
counts[domaine] = (counts[domaine] || 0) + 1;
});
const labels = Object.keys(counts);
const dataValues = Object.values(counts);
const palette = ['#004a99', '#28a745', '#ffc107', '#17a2b8', '#6610f2', '#e83e8c'];
const colors = labels.map((_, i) => palette[i % palette.length]);
const ctx = document.getElementById('sectorChart');
if (!ctx) return;
myChart = new Chart(ctx.getContext('2d'), {
type: 'pie',
data: { labels, datasets: [{ data: dataValues, backgroundColor: colors, borderColor: '#ffffff', borderWidth: 2 }] },
options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
});
});
}

function renderGaugeChart() {
if (myGauge !== null) myGauge.destroy();
fetch(`https://spe-congo-project.onrender.com/api/admin/relationships`)
.then(res => res.json())
.then(rels => {
let totalFaits = 0, totalObjectifs = 0;
rels.forEach(r => { totalFaits += r.obj_faits || 0; totalObjectifs += r.total_obj || 0; });
const pourcentage = totalObjectifs > 0 ? Math.round((totalFaits / totalObjectifs) * 100) : 0;
let gaugeColor = pourcentage >= 70 ? '#28a745' : pourcentage >= 40 ? '#ffc107' : '#dc3545';
const gaugeText = document.getElementById('gauge-text');
if (gaugeText) gaugeText.innerText = `${pourcentage}% d'objectifs atteints`;
const ctx = document.getElementById('gaugeChart');
if (!ctx) return;
myGauge = new Chart(ctx.getContext('2d'), {
type: 'doughnut',
data: { datasets: [{ data: [pourcentage, 100 - pourcentage], backgroundColor: [gaugeColor, '#e9ecef'], borderWidth: 0, circumference: 180, rotation: 270, cutout: '80%' }] },
options: { responsive: true, maintainAspectRatio: false }
});
});
}

function renderOfferDemandChart() {
if (myOfferChart !== null) myOfferChart.destroy();
Promise.all([
fetch(`https://spe-congo-project.onrender.com/api/admin/mentors`).then(res => res.json()),
fetch(`https://spe-congo-project.onrender.com/api/admin/mentees`).then(res => res.json())
])
.then(([mentors, mentees]) => {
const stats = {};
mentors.forEach(m => { const d = m.domaine_expertise || "Non spécifié"; if (!stats[d]) stats[d] = { offre: 0, demande: 0 }; stats[d].offre++; });
mentees.forEach(m => { const d = m.domaine_interet || "Non spécifié"; if (!stats[d]) stats[d] = { offre: 0, demande: 0 }; stats[d].demande++; });
const labels = Object.keys(stats);
const ctx = document.getElementById('offerDemandChart');
if (!ctx) return;
myOfferChart=new Chart(ctx.getContext('2d'),{
type: 'bar',
data: {
labels,
datasets: [
{ label: 'Offre (Mentors)', data: labels.map(l => stats[l].offre), backgroundColor: '#004a99', borderRadius: 4 },
{ label: 'Demande (Mentees)', data: labels.map(l => stats[l].demande), backgroundColor: '#ffc107', borderRadius: 4 }
]
},
options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
});
});
}

function renderGrowthChart() {
if (myGrowthChart !== null) myGrowthChart.destroy();
Promise.all([
fetch(`https://spe-congo-project.onrender.com/api/admin/mentors`).then(res => res.json()),
fetch(`https://spe-congo-project.onrender.com/api/admin/mentees`).then(res => res.json())
])
.then(([mentors, mentees]) => {
const growthMentors = {}, growthMentees = {};
const allMonths = new Set();


    mentors.forEach(m => {
        if (m.date_inscription) {
            const mois = new Date(m.date_inscription).toISOString().slice(0, 7);
            allMonths.add(mois);
            growthMentors[mois] = (growthMentors[mois] || 0) + 1;
        }
    });
    mentees.forEach(m => {
        if (m.date_inscription) {
             const mois = new Date(m.date_inscription).toISOString().slice(0, 7);
            allMonths.add(mois);
            growthMentees[mois] = (growthMentees[mois] || 0) + 1;
        }
    });

    const sortedMonths = Array.from(allMonths).sort();
    let rMentor = 0, rMentee = 0;
    const dataMentors = sortedMonths.map(m => { rMentor += (growthMentors[m] || 0); return rMentor; });
    const dataMentees = sortedMonths.map(m => { rMentee += (growthMentees[m] || 0); return rMentee; });

    const ctx = document.getElementById('growthChart');
    if (!ctx) return;
    myGrowthChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [
                { label: 'Mentors', data: dataMentors, borderColor: '#004a99', backgroundColor: 'rgba(0,74,153,0.1)', fill: true, tension: 0.3, borderWidth: 3 },
                { label: 'Mentees', data: dataMentees, borderColor: '#ffc107', backgroundColor: 'rgba(255,193,7,0.1)', fill: true, tension: 0.3, borderWidth: 3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
});


}

// ==========================================
// 15. FLYER
// ==========================================
function ouvrirFlyer(flyerPath) {
const BASE_URL = `https://spe-congo-project.onrender.com`;
const url = `${BASE_URL}/images/news/flyers/${flyerPath}`;
const contenu = document.getElementById('flyer-contenu');
const download = document.getElementById('flyer-download');
if (!contenu || !download) return;


contenu.innerHTML = flyerPath.endsWith('.pdf')
    ? `<iframe src="${url}" width="600" height="500" style="border:none; border-radius:8px;"></iframe>`
    : `<img src="${url}" style="max-width:100%; border-radius:8px;">`;

download.href = url;
download.download = flyerPath;
document.getElementById('flyer-popup').style.display = 'flex';


}

function fermerFlyer() {
document.getElementById('flyer-popup').style.display = 'none';
document.getElementById('flyer-contenu').innerHTML = '';
}





// Chargement de la news detail
if (window.location.pathname.includes('news-detail')) {
    const newsId = new URLSearchParams(window.location.search).get('id');
    if (newsId) {
        fetch(`https://spe-congo-project.onrender.com/api/news/${newsId}`)
            .then(res => res.json())
            .then(art => {
                document.getElementById('detail-categorie').textContent = art.categorie || 'NEWS';
                document.getElementById('detail-titre').textContent = art.titre;
                document.getElementById('detail-contenu').textContent = art.contenu;
                document.getElementById('detail-image').src = `https://spe-congo-project.onrender.com/images/news/${art.image_path}`;
                document.getElementById('detail-date').textContent = art.date_publication
                    ? new Date(art.date_publication).toLocaleDateString('fr-FR')
                    : '';
                if (art.flyer_path) {
                    window._flyerPath = art.flyer_path;
                    document.getElementById('detail-flyer-container').style.display = 'block';
                }
            })
            .catch(err => console.error('Erreur news detail:', err));
    }
}

//partager les détails de la news sur les réseaux
function partager(reseau) {
    const url = encodeURIComponent(window.location.href);
    const titre = encodeURIComponent(document.getElementById('detail-titre').textContent);
    const liens = {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        whatsapp: `https://wa.me/?text=${titre}%20${url}`
    };
    window.open(liens[reseau], '_blank');
}


/**
 * Copier le lien dans le presse-papier
 */
function copierLien() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        alert('Lien copié dans le presse-papier !');
    }).catch(err => {
        console.error('Erreur lors de la copie :', err);
    });
}

//faire fonctionner les petits points du caroussel quand les images de la galerie défilent
let currentGallerySlide = 0;
let slidesData = [];

async function chargerGalerie() {
    const container = document.getElementById('slider-container');
    const dotsContainer = document.getElementById('slider-dots');
    if (!container) return;

    try {
        const response = await fetch('https://spe-congo-project.onrender.com/api/galerie');
        slidesData = await response.json();

        if (slidesData.length === 0) {
            container.innerHTML = "<div class='slider-item'><img src='images/default-spe.jpg'><div class='slider-caption'><h2>Bienvenue à la SPE Congo</h2></div></div>";
            return;
        }

        // 1. Générer les images
        container.innerHTML = slidesData.map(img => `
            <div class="slider-item">
             <img src="${img.image_path.startsWith('http') ? img.image_path : `https://spe-congo-project.onrender.com/images/galerie/${img.image_path}`}" alt="${img.titre}">
                <div class="slider-caption">
                    <h2>${img.titre}</h2>
                    <p>${img.description || ''}</p>
                </div>
            </div>
        `).join('');

        // 2. Générer les points (dots)
        dotsContainer.innerHTML = slidesData.map((_, index) => `
            <span class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>
        `).join('');

        // 3. Lancer le défilement automatique
        startAutoSlide();

    } catch (error) {
        console.error("Erreur galerie :", error);
    }
}

function moveSlider(direction) {
    const container = document.getElementById('slider-container');
    const dots = document.querySelectorAll('.dot');
    
    currentGallerySlide = (currentGallerySlide + direction + slidesData.length) % slidesData.length;
    
    // Déplacement fluide
    container.style.transform = `translateX(-${currentGallerySlide * 100}%)`;
    
    // Mise à jour des points
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentGallerySlide);
    });
}

function goToSlide(index) {
    currentGallerySlide = index;
    moveSlider(0); // On appelle moveSlider avec 0 pour juste rafraîchir la position
}

function startAutoSlide() {
    setInterval(() => {
        moveSlider(1);
    }, 5000); // Change toutes les 5 secondes
}


// 2. Envoi du formulaire galerie
document.getElementById('form-galerie-upload')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.textContent = "Chargement...";

    try {
        const response = await fetch('https://spe-congo-project.onrender.com/api/upload-galerie', {
            method: 'POST',
            body: formData
        });

        // On vérifie d'abord si la réponse est OK (Code 200)
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        if (data.success) {
            alert("Image publiée avec succès !");
            e.target.reset();
            // Optionnel : recharger la liste des photos
        }
    } catch (error) {
        console.error("Détails de l'erreur :", error);
        alert("Problème : " + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Publier";
    }
});

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', chargerGalerie); 

// Fonction pour charger et afficher les photos dans l'admin
async function chargerPhotosAdmin() {
    const grille = document.getElementById('liste-photos-admin');
    
    // 1. On vérifie que la zone d'affichage existe
    if (!grille) return;

    try {
        // 2. On appelle le serveur
        const response = await fetch('https://spe-congo-project.onrender.com/api/admin/galerie');
        const photos = await response.json();

        // 3. Si la base est vide
        if (photos.length === 0) {
            grille.innerHTML = "<p>Aucune photo publiée pour le moment.</p>";
            return;
        }

        // 4. On crée le HTML pour chaque image
        grille.innerHTML = photos.map(p => `
            <div class="photo-item"  id= "photo-${p.id}" style="border: 1px solid #ddd; padding: 10px; border-radius: 8px; width: 150px; text-align: center;">
                  <img src="${p.image_path.startsWith('http') ? p.image_path : `https://spe-congo-project.onrender.com/images/galerie/${p.image_path}`}" 
                           style="width: 100%; height: 100px; object-fit: cover; border-radius: 4px;">
                <p style="font-size: 12px; margin: 5px 0;">${p.titre}</p>
                <button onclick="supprimerPhoto(${p.id})" style="background: red; color: white; border: none; cursor: pointer; padding: 4px 8px; border-radius: 4px;">
                    Supprimer
                </button>
            </div>
        `).join('');

    } catch (error) {
        console.error("Erreur de chargement :", error);
        grille.innerHTML = "<p>Erreur lors de la connexion au serveur.</p>";
    }
}
// Fonction pour supprimer une photo
async function supprimerPhoto(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette photo de la galerie ?")) return;

    try {
        const response = await fetch(`https://spe-congo-project.onrender.com/api/galerie/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            // 1. On cible l'élément HTML de la photo
            const photoCard = document.getElementById(`photo-${id}`);
            
            if (photoCard) {
                // 2. On ajoute une transition CSS pour l'élégance
                photoCard.style.transition = "all 0.5s ease";
                photoCard.style.opacity = "0";
                photoCard.style.transform = "scale(0.8)"; // Petit effet de rétrécissement

                // 3. On retire l'élément du DOM après l'animation
                setTimeout(() => {
                    photoCard.remove();
                    
                    // Optionnel : Si c'était la dernière photo, afficher un message
                    const grille = document.getElementById('liste-photos-admin');
                    if (grille && grille.children.length === 0) {
                        grille.innerHTML = "<p>Toutes les photos ont été supprimées.</p>";
                    }
                }, 500);
            }
        } else {
            alert("Erreur lors de la suppression sur le serveur.");
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Impossible de joindre le serveur.");
    }
}

// On écoute les clics sur toute la page
document.addEventListener('click', (e) => {
    // Si l'élément cliqué est ton lien "Gallerie"
    if (e.target.closest('a[href="#gallerie"]') || e.target.textContent.includes("Gallerie")) {
        console.log("Déclenchement du chargement des photos...");
        // On attend un tout petit peu que l'onglet s'affiche
        setTimeout(chargerPhotosAdmin, 200);
    }
});

//Gestion de la Galerie du site

document.addEventListener('DOMContentLoaded', () => {
    chargerPhotos();
});

async function chargerPhotos() {
    const container = document.getElementById('affichage-galerie');

    try {
        const response = await fetch('https://spe-congo-project.onrender.com/api/galerie');
        const photos = await response.json();

        if (photos.length === 0) {
            container.innerHTML = "<p>Aucune photo dans la galerie pour le moment.</p>";
            return;
        }

        
        //  onclick="ouvrirModal(...)" sur chaque image générée
        container.innerHTML = photos.map(p => {
          // Remplacez la ligne const fullImgPath = ... par :
const fullImgPath = p.image_path.startsWith('http') 
    ? p.image_path 
    : `https://spe-congo-project.onrender.com/images/galerie/${p.image_path}`;
            return `
                <div class="galerie-item">
                    <img src="${fullImgPath}" 
                         alt="${p.titre}" 
                         onclick="ouvrirModal('${fullImgPath}', '${p.titre}')"
                         style="cursor: zoom-in;">
                    <div class="galerie-info">
                        <h3>${p.titre}</h3>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error("Erreur de chargement :", error);
        container.innerHTML = "<p>Erreur lors de la récupération des photos.</p>";
    }
}

// --- FONCTIONS MODAL ---

function ouvrirModal(scrPath, titre) {
    const modal = document.getElementById('galerie-modal');
    const modalImg = document.getElementById('img-agrandie');
    const captionText = document.getElementById('caption-modal');

    modal.style.display = "block";
    modalImg.src = scrPath;
    captionText.innerHTML = titre;
}

function fermerModal() {
    const modal = document.getElementById('galerie-modal');
    modal.style.display = "none";
}


// Fonction pour afficher les membres dans la messagerie
async function chargerMembresMessagerie() {
    const listeContainer = document.getElementById('liste-membres-envoi');
    
    try {
        const response = await fetch('https://spe-congo-project.onrender.com/api/utilisateurs');
        const membres = await response.json();

        if (membres.length === 0) {
            listeContainer.innerHTML = "<p>Aucun membre inscrit.</p>";
            return;
        }


listeContainer.innerHTML = membres.map(m => `
    <div class="membre-item">
        <input type="checkbox" class="membre-check" value="${m.email}">
        <div class="membre-info">
            <span class="membre-name">${m.username}</span>
            <span class="membre-email">${m.email}</span>
        </div>
    </div>
`).join('');

        // Logique pour "Tout sélectionner"
        const selectAllBtn = document.getElementById('select-all-members');
        selectAllBtn.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.membre-check');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });

    } catch (error) {
        console.error("Erreur fetch membres:", error);
        listeContainer.innerHTML = "<p>Erreur de chargement des membres.</p>";
    }
}
//capturer les mails des membres sélectionner
document.getElementById('form-diffusion').addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. On récupère tous les emails cochés
    const checkboxes = document.querySelectorAll('.membre-check:checked');
    const destinataires = Array.from(checkboxes).map(cb => cb.value);

    if (destinataires.length === 0) {
        alert("Veuillez sélectionner au moins un destinataire.");
        return;
    }

    // 2. On prépare les données
    const data = {
        sujet: document.getElementById('sujet-mail').value,
        message: document.getElementById('contenu-mail').value,
        emails: destinataires
    };

    // 3. On envoie au serveur
    try {
        const response = await fetch('https://spe-congo-project.onrender.com/api/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (result.success) {
            alert("✅ Message envoyé avec succès aux membres sélectionnés !");
            e.target.reset(); // Vide le formulaire
        } else {
            alert("❌ Erreur lors de l'envoi.");
        }
    } catch (error) {
        console.error("Erreur:", error);
        alert("Impossible de contacter le serveur.");
    }
});

 // Formulaire de vonlontariat
    const textarea = document.getElementById('motivation');
    const counter  = document.getElementById('charCount');
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      counter.textContent = `${len} / 500`;
      if (len > 500) textarea.value = textarea.value.slice(0, 500);
    });

    // Radio pills highlight
    document.querySelectorAll('.radio-pill input').forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
        radio.closest('.radio-pill').classList.add('active');
      });
    });

    // Form submit (remplacer par votre appel API)
    document.getElementById('volontariatForm').addEventListener('submit', e => {
      e.preventDefault();
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
      e.target.reset();
      document.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
      counter.textContent = '0 / 500';
    });

    document.getElementById('photo').addEventListener('change', function() {
  const label = document.getElementById('fileLabel');
  label.textContent = this.files[0] ? this.files[0].name : 'Choisir une photo';
});