

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



// 2. Envoi du formulaire galerie
document.getElementById('form-galerie-upload')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
        const response = await fetch('http://localhost:3000/api/upload-galerie', {
            method: 'POST',
             headers: { 'Content-Type': 'application/json' },
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            alert("Image ajoutée avec succès !");
            e.target.reset();
        } else {
            alert("Erreur lors de l'ajout.");
        }
    } catch (error) {
        console.error("Erreur:", error);
    }
});