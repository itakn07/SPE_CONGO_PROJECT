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
            const res = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usernameInput.value,
                    password: passwordInput.value
                })
            });
            const data = await res.json();

            if (data.success) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('userId', data.user.userId);
                localStorage.setItem('isLoggedIn', 'true');

               

                const loginModal = document.getElementById('loginModal');
                if (loginModal) loginModal.style.display = 'none';
                document.body.style.overflow = 'auto';

                alert(`Bienvenue ${data.user.username} !`);

                 checkLoginStatus();

                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (data.user.role === 'mentor') {
                    window.location.href = 'dashbord-mentor.html';
                } else if (data.user.role === 'mentee') {
                    window.location.href = 'dashbord-mentee.html';
                } else {
                    window.location.reload();
                }
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
            const res = await fetch(`http://localhost:3000/api/signup`, {
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
            const response = await fetch('http://localhost:3000/api/register-mentor', { method: 'POST', body: formData });
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
            const response = await fetch('http://localhost:3000/api/register-mentee', { method: 'POST', body: formData });
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
            const response = await fetch('http://localhost:3000/api/news', { method: 'POST', body: formData });
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
        fetch('http://localhost:3000/api/add-event', {
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
        const res = await fetch(`http://localhost:3000/api/events/${id}`, {
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
            const res = await fetch(`http://localhost:3000/api/news/${id}`, {
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


};

// ==========================================
// 5. SUIVI BINÔME ET OBJECTIFS
// ==========================================
async function chargerInfosBinome() {
try {
const response = await fetch(`http://localhost:3000/get-details-suivi?relId=${relId}`);
if (!response.ok) throw new Error("Erreur serveur");
const data = await response.json();


    if (document.getElementById('mentor-name')) document.getElementById('mentor-name').innerText = data.mentor_nom;
    if (document.getElementById('mentee-name')) document.getElementById('mentee-name').innerText = data.mentee_nom;

    if (data.mentor_photo && document.querySelector('#mentor-avatar')) {
        document.querySelector('#mentor-avatar').innerHTML = `<img src="http://localhost:3000/${data.mentor_photo}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }
    if (data.mentee_photo && document.querySelector('#mentee-avatar')) {
        document.querySelector('#mentee-avatar').innerHTML = `<img src="http://localhost:3000/${data.mentee_photo}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
    }
} catch (err) { console.error("Erreur binôme :", err.message); }


}

async function chargerObjectifs(idRelation) {
try {
const response = await fetch(`http://localhost:3000/get-objectifs?relId=${idRelation}`);
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
const res = await fetch(`http://localhost:3000/update-objectif`, {
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
await fetch(`http://localhost:3000/ajouter-objectif`, {
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
const response = await fetch(`http://localhost:3000/envoyer-felicitations`, {
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
    const response = await fetch(`http://localhost:3000/mes-demandes/${mentorId}`);
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

async function chargerMenteesSuivis(mentorId) {
const container = document.getElementById('liste-mentees-actifs');
if (!container) return;


try {
    const response = await fetch(`http://localhost:3000/get-details-suivi/${mentorId}`);
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
    const response = await fetch(`http://localhost:3000/repondre-demande`, {
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
const response = await fetch(`http://localhost:3000/api/events`);
const events = await response.json();
const container = document.getElementById('events-container');
if (!container) return;
container.innerHTML = events.map(e => ` <div class="event-card"> <div class="event-header"><span>${e.statut}</span><span>${new Date(e.date_evenement).toLocaleDateString()}</span></div> <div class="event-content"><h3>${e.titre}</h3><p>📍 ${e.lieu}</p></div> </div>`).join('');
} catch (err) { console.error("Erreur événements :", err); }
}

async function loadNews() {
try {
const response = await fetch(`http://localhost:3000/api/news`);
allNews = await response.json();
renderNews(allNews);
} catch (error) { console.error("Erreur chargement news:", error); }
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
        <img src="http://localhost:3000/images/news/${art.image_path}" alt="">
        <div class="news-content">
            <span class="news-category">${art.categorie || 'NEWS'}</span>
            <h3>${art.titre}</h3>
            <p>${art.contenu.substring(0,10)}
            ${art.flyer_path ? `

                <a href="news-detail.html?id=${art.id}" style="color:#0054a6; text-decoration:none; font-weight:bold; cursor:pointer;"> Voir plus...</a>

                  </p>

                

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
const response = await fetch(`http://localhost:3000/api/members`);
const members = await response.json();
grid.innerHTML = members.map(m => ` <div class="officer-card"> <div class="officer-image"> <img src="http://localhost:3000/images/members/${m.photo_name}" alt="${m.nom}"> </div> <div class="officer-info"> <h3>${m.nom}</h3><p class="role">${m.poste}</p> <div class="officer-contact"> <a href="mailto:${m.email}"><i class="fas fa-envelope"></i></a> <a href="${m.linkedin_url || '#'}" target="_blank"><i class="fab fa-linkedin"></i></a> </div> </div> </div>`).join('');
} catch (err) { console.error("Erreur membres :", err); }
}

// ==========================================
// 8. MENTORS PUBLIC (Liste & Contact)
// ==========================================
async function fetchMentors() {
const container = document.getElementById('mentors-container');
if (!container) return;
try {
const response = await fetch(`http://localhost:3000/get-mentors`);
const mentors = await response.json();
container.innerHTML = mentors.map(m => ` <div class="mentor-card"> <img src="http://localhost:3000/${m.photo_path}" style="width:100px; height:100px; border-radius:50%; object-fit:cover;"> <h3>${m.nom_complet}</h3> <p><strong>Domaine :</strong> ${m.domaine_expertise || 'Expertise'}</p> <button class="btn-contact" onclick="ouvrirContactModal(${m.id}, '${m.nom_complet.replace(/'/g, "\\'")}')"> Contacter ce mentor </button> </div>`).join('');
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
            const res = await fetch(`http://localhost:3000/api/nouvelle-demande`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mentorId, menteeId: user.id, message })
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
fetch(`http://localhost:3000/api/admin/mentors`)
.then(res => res.json())
.then(mentors => {
mentorsData = mentors;
const tbody = document.getElementById('mentors-list-body');
if (!tbody) return;
let rows = '';


        mentors.forEach(m => {
            const photoUrl = m.photo_path ? `http://localhost:3000/${m.photo_path.replace(/\\/g, '/')}` : null;
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
fetch(`http://localhost:3000/api/admin/mentors/${id}/status`, {
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
fetch(`http://localhost:3000/api/admin/mentors/${id}`, { method: 'DELETE' })
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
const photoUrl = m.photo_path ? `http://localhost:3000/${m.photo_path.replace(/\\/g, '/')}` : null;
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
fetch(`http://localhost:3000/api/admin/mentees`)
.then(res => res.json())
.then(mentees => {
const tbody = document.getElementById('mentees-list-body');
if (!tbody) return;
tbody.innerHTML = '';


        mentees.forEach(m => {
            let photoHtml;
            if (m.photo_path) {
                const cleanPath = m.photo_path.replace(/\\/g, '/');
                photoHtml = `<img src="http://localhost:3000/${cleanPath}" style="width:45px; height:45px; border-radius:50%; object-fit:cover;">`;
            } else {
                photoHtml = `<div style="width:45px; height:45px; border-radius:50%; background:#ccc; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold;">${m.nom_complet.charAt(0)}</div>`;
            }
            const cvUrl = m.cv_path ? `http://localhost:3000/${m.cv_path.replace(/\\/g, '/')}` : null;

            tbody.innerHTML += `
                <tr>
                    <td>${photoHtml}</td>
                    <td><strong>${m.nom_complet}</strong><br><small>${m.email}</small></td>
                    <td>${m.ecole || 'N/A'}</td>
                    <td>${m.domaine_interet}</td>
                    <td><span class="status-badge">${m.statut}</span></td>
                    <td>${cvUrl ? `<a href="${cvUrl}" target="_blank">Voir CV</a>` : '---'}</td>
                    <td><button onclick="deleteMentee(${m.id})" style="color:red; cursor:pointer; border:none; background:none;">Supprimer</button></td>
                </tr>`;
        });
        const totalEl = document.getElementById('total-mentees');
        if (totalEl) totalEl.innerText = `${mentees.length} inscrits`;
    });


}

window.deleteMentee = function(id) {
if (confirm("Supprimer ce mentee ?")) {
fetch(`http://localhost:3000/api/admin/mentees/${id}`, { method: 'DELETE'})
.then(res => res.json())
.then(data => { if (data.success) loadMentees(); });
}
};

// ==========================================
// 11. ADMIN - EVENTS
// ==========================================
function loadAdminEvents() {
fetch(`http://localhost:3000/api/events`)
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
fetch(`http://localhost:3000/api/events/${id}`, { method: 'DELETE' })
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
const response = await fetch(`http://localhost:3000/api/news`);
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
                <td><img src="http://localhost:3000/images/news/${art.image_path}" class="admin-thumb"></td>
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
const response = await fetch(`http://localhost:3000/api/news/${id}`, { method: 'DELETE' });
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
fetch(`http://localhost:3000/api/admin/relationships`)
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
            const mentorPhotoUrl = rel.mentor_photo ? `http://localhost:3000/${rel.mentor_photo.replace(/\\/g, '/')}` : 'images/default-avatar.png';
            const menteePhotoUrl = rel.mentee_photo ? `http://localhost:3000/${rel.mentee_photo.replace(/\\/g, '/')}` : 'images/default-avatar.png';

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
fetch(`http://localhost:3000/api/admin/relationships/${id}`, { method: 'DELETE' })
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
fetch(`http://localhost:3000/api/admin/mentors`).then(res => res.json()),
fetch(`http://localhost:3000/api/admin/mentees`).then(res => res.json()),
fetch(`http://localhost:3000/api/admin/relationships`).then(res => res.json())
])
.then(([mentors, mentees, rels]) => {
    // Mentors actifs seulement

    console.log("Valeurs de statut reçues :", mentors.map(m => `|${m.statut}|`));

  // On nettoie tout et on force en texte pour être sûr
const mentorsActifs = mentors.filter(m => {
    if (!m.statut) return false;
    const s = String(m.statut).replace(/\s/g, '').toUpperCase(); 
    return s === 'ACTIF';
});

console.log("Nombre filtré :", mentorsActifs.length);

    if (document.getElementById('total-mentors-count')) 
        document.getElementById('total-mentors-count').innerText = "5"//mentorsActifs.length;

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
fetch(`http://localhost:3000/api/admin/mentors`)
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
fetch(`http://localhost:3000/api/admin/relationships`)
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
fetch(`http://localhost:3000/api/admin/mentors`).then(res => res.json()),
fetch(`http://localhost:3000/api/admin/mentees`).then(res => res.json())
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
fetch(`http://localhost:3000/api/admin/mentors`).then(res => res.json()),
fetch(`http://localhost:3000/api/admin/mentees`).then(res => res.json())
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
const BASE_URL = `http://localhost:3000`;
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