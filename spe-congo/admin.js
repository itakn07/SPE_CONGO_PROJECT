// 1. Gérer le changement de vidéo
document.getElementById('form-video').addEventListener('submit', async (e) => {
    e.preventDefault();
    const filename = document.getElementById('video-filename').value;

    const response = await fetch('http://localhost:3000/api/update-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url_fichier: filename })
    });

    const result = await response.json();
    alert(result.message);
});

// 2. Gérer l'ajout d'un événement
document.getElementById('form-event').addEventListener('submit', async (e) => {
    e.preventDefault();
    const eventData = {
        titre: document.getElementById('event-title').value,
        date_evenement: document.getElementById('event-date').value,
        lieu: document.getElementById('event-location').value,
        description: document.getElementById('event-desc').value
    };

    const response = await fetch('http://localhost:3000/api/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
    });

    if (response.ok) {
        alert("Événement ajouté !");
        e.target.reset(); // Vide le formulaire
    }
});

// Fonction de déconnexion
function logout() {
    window.location.href = "login.html";
}