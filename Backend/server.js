require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');
const multer = require('multer');

// — CLOUDINARY —
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// — MIDDLEWARES —
app.use(cors({
  origin: `https://spe-congo-project-static.onrender.com`
}));

// — CONFIGURATION EMAIL —
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// — FICHIERS STATIQUES —
app.use('/videos', express.static(path.join(__dirname, '..', 'videos')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// — UTILITAIRE : Extraire le Public ID Cloudinary depuis une URL —
function getPublicId(url) {
  if (!url || !url.includes('cloudinary')) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  const afterUpload = parts.slice(uploadIndex + 2).join('/');
  return afterUpload.replace(/.[^/.]+$/, '');
}

// ==========================================
// — CONFIGURATION CLOUDINARY STORAGE —
// ==========================================

// 1. Stockage pour les News et Flyers
const storageNews = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'spe_congo/news',
      resource_type: 'auto',
      public_id: Date.now() + '-' + file.originalname.split('.').slice(0, -1).join('.'),
    };
  },
});

const uploadNews = multer({ storage: storageNews }).fields([
  { name: 'image_file', maxCount: 1 },
  { name: 'flyer_file', maxCount: 1 }
]);

// 2. Stockage pour la Galerie
const storageGalerie = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spe_congo/galerie',
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const uploadGalerie = multer({ storage: storageGalerie });

// 3. Stockage unifié pour le Formulaire de Volontariat (Photo de profil + Certificat SPE)
const storageVolontaireForm = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spe_congo/volontaires',
    resource_type: 'auto', // 'auto' gère parfaitement les images ET le PDF du certificat
  },
});

// Cet outil intercepte les deux fichiers distincts envoyés par ton formulaire HTML mis à jour
const uploadVolontaire = multer({ storage: storageVolontaireForm }).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'certificat', maxCount: 1 }
]);

// 4. Stockage unifié pour le Formulaire des Mentees (Photo de profil + Certificat SPE)
const storageMenteeForm = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spe_congo/mentee_docs',
    resource_type: 'auto', // Indispensable pour que Cloudinary conserve l'extension .pdf
  },
});

const uploadMentee = multer({ storage: storageMenteeForm }).fields([
  { name: 'photo', maxCount: 1 }, 
  { name: 'cv', maxCount: 1 },
  { name: 'certificat_spe', maxCount: 1 } 
]);

// 5. Stockage pour les Mentors (Photo de profil + CV)
const storageMentorForm = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'spe_congo/mentor_docs',
    resource_type: 'auto',
  },
});

const uploadMentor = multer({ storage: storageMentorForm }).fields([
  { name: 'photo', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]);

// ==========================================
// TEMPLATE EMAIL
// ==========================================
function templateMail({ emoji, titre, sousTitre, contenu }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0; padding:0; background:#f0f4f8; font-family:'Segoe UI', sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8; padding:40px 0;">
<tr>
<td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%;">
                    
                    <tr>
                        <td style="background:white; border-radius:14px 14px 0 0; padding:20px 40px; border-bottom:1px solid #e2e8f0;">
                            <img src="https://i.imgur.com/Uimkn0z.jpeg" alt="SPE Congo" width="100" style="display:block; object-fit:contain;">
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background:#0054a6; padding:30px 40px; text-align:center;">
                            <div style="font-size:2.2rem;">${emoji}</div>
                            <h1 style="color:white; font-size:1.4rem; font-weight:700; margin:10px 0 5px;">${titre}</h1>
                            <p style="color:rgba(255,255,255,0.7); font-size:0.9rem; margin:0;">${sousTitre}</p>
                        </td>
                    </tr>
                    
                    <tr>
                        <td style="background:white; padding:35px 40px;">
                            ${contenu}
                        </td>
                    </tr>
                   
                    <tr>
                        <td style="background:#f8fafc; border-radius:0 0 14px 14px; padding:20px 40px; text-align:center; border-top:1px solid #e2e8f0;">
                            <p style="color:#0054a6; font-weight:700; font-size:0.85rem; margin:0 0 5px;">SPE Congo</p>
                            <p style="color:#94a3b8; font-size:0.78rem; margin:0;">Merci de ne pas répondre à cet email.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// ==========================================
// 1. ROUTES DASHBOARD MENTOR
// ==========================================

app.get('/mes-demandes/:userId', (req, res) => {
  const userId = req.params.userId;
  const sql = `SELECT d.*, me.nom_complet AS mentee_nom FROM demandes_mentorat d JOIN mentees me ON d.mentee_id = me.id JOIN mentors men ON d.mentor_id = men.id WHERE men.user_id = ? AND d.statut = 'en_attente'`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

app.post('/repondre-demande', (req, res) => {
  const { demandeId, decision } = req.body;

  const sqlGetInfos = `
    SELECT d.mentor_id, d.mentee_id, 
           m.email AS mentee_email, m.nom_complet AS mentee_nom,
           men.nom_complet AS mentor_nom
    FROM demandes_mentorat d
    JOIN mentees m ON d.mentee_id = m.id
    JOIN mentors men ON d.mentor_id = men.id
    WHERE d.id = ?
  `;

  db.query(sqlGetInfos, [demandeId], (err, results) => {
    if (err || results.length === 0) {
      console.error("Erreur SQL Infos:", err);
      return res.status(500).json({ success: false, message: "Demande introuvable" });
    }

    const data = results[0];

    const sqlUpdate = "UPDATE demandes_mentorat SET statut = ? WHERE id = ?";
    db.query(sqlUpdate, [decision, demandeId], (updateErr) => {
      if (updateErr) return res.status(500).json({ success: false });

      if (decision === 'acceptee') {
        const sqlInsertRel = "INSERT INTO relationships (mentor_id, mentee_id) VALUES (?, ?)";
        db.query(sqlInsertRel, [data.mentor_id, data.mentee_id], (relErr) => {
          if (relErr) console.error("Erreur insertion binôme:", relErr);

          db.query("UPDATE mentees SET statut = 'EN FORMATION' WHERE id = ?", [data.mentee_id], (errStatut) => {
            if (errStatut) console.error("Erreur update statut mentee:", errStatut);
            else console.log("✅ Statut mentee mis à jour : EN FORMATION");
          });

          resend.emails.send({
  from: 'SPE Congo <onboarding@resend.dev>',
  to: data.mentee_email,
  subject: 'Votre demande de mentorat a été acceptée !',
  html: templateMail({
    emoji: '',
    titre: 'Demande acceptée !',
    sousTitre: 'Programme de Mentorat SPE Congo',
    contenu: `
      <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Bonjour <strong>${data.mentee_nom}</strong>,</p>
      <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
        Excellente nouvelle ! <strong>${data.mentor_nom}</strong> a accepté votre demande de mentorat. Votre parcours commence maintenant !
      </p>
      <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:15px 20px; border-radius:8px; margin-top:20px;">
        <p style="margin:0; color:#065f46; font-size:0.9rem;"> Connectez-vous pour voir vos objectifs.</p>
      </div>
    `
  })
}).catch(e => console.error("Erreur Mail:", e));
        });

      } else if (decision === 'refusee') {

        resend.emails.send({
  from: 'SPE Congo <onboarding@resend.dev>',
  to: data.mentee_email,
  subject: 'Mise à jour concernant votre demande de mentorat',
  html: templateMail({
    emoji: '',
    titre: 'Concernant votre demande',
    sousTitre: 'Programme de Mentorat SPE Congo',
    contenu: `
      <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Bonjour <strong>${data.mentee_nom}</strong>,</p>
      <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
        Nous vous informons que <strong>${data.mentor_nom}</strong> ne peut malheureusement pas donner suite à votre demande de mentorat pour le moment.
      </p>
      <div style="background:#fef2f2; border-left:4px solid #ef4444; padding:15px 20px; border-radius:8px; margin-top:20px;">
        <p style="margin:0; color:#991b1b; font-size:0.9rem;"> Ne vous découragez pas, d'autres mentors sont disponibles sur la plateforme !</p>
      </div>
    `
  })
}).catch(e => console.error("Erreur Mail Refus:", e));
      }

      res.json({ success: true });
    });
  });
});

// ==========================================
// 2. ROUTES INSCRIPTIONS ET AUTHENTIFICATION
// ==========================================


app.post('/api/login', (req, res) => {
  const identifiant = req.body.username || req.body.email;
  const password = req.body.password;

  if (!identifiant || !password) {
    return res.json({ success: false, message: "Identifiants manquants" });
  }

  const sql = "SELECT * FROM users WHERE username = ? OR email = ?";
  db.query(sql, [identifiant, identifiant], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Erreur serveur" });

    if (!result || result.length === 0) {
      return res.json({ success: false, message: "Identifiants incorrects" });
    }

    const user = result[0];

    // Vérification du mot de passe 
if (user.password !== password) {
  return res.json({ success: false, message: "Identifiants incorrects" });
}

      // Admin détecté directement via son rôle
      if (user.role === 'admin') {
        return res.json({
          success: true,
          user: {
            id: user.id,
            userId: user.id,
            username: user.username,
            role: 'admin',
            statut: result[0].statut
          }
        });
      }

      // Vérifier si c'est un mentor
      db.query("SELECT id, statut FROM mentors WHERE user_id = ?", [user.id], (errM, resMentor) => {
        if (errM) return res.status(500).json({ success: false, message: "Erreur vérification mentor" });

        if (resMentor.length > 0) {
          return res.json({
            success: true,
            user: {
              id: resMentor[0].id,
              userId: user.id,
              username: user.username,
              role: 'mentor',
              statut: resMentor[0].statut
            }
          });
        }

        // Vérifier si c'est un mentee
        db.query("SELECT id, statut FROM mentees WHERE user_id = ?", [user.id], (errMe, resMentee) => {
          if (errMe) return res.status(500).json({ success: false, message: "Erreur vérification mentee" });

          if (resMentee.length > 0) {
            return res.json({
              success: true,
              user: {
                id: resMentee[0].id,
                userId: user.id,
                username: user.username,
                role: 'mentee',
                statut: resMentee[0].statut
              }
            });
          }

          // Utilisateur simple (ni mentor, ni mentee, ni admin)
return res.json({
  success: true,
  user: {
    id: user.id,
    userId: user.id,
    username: user.username,
    role: 'user',
    statut: null
  }
});
        });
      });
    });
  });


app.post('/api/signup', (req, res) => {
  const { username, email, password, confirm } = req.body;

  if (password !== confirm) {
    return res.json({ success: false, message: "Les mots de passe ne correspondent pas" });
  }

  const sqlCheck = "SELECT id FROM users WHERE username = ? OR email = ?";
  db.query(sqlCheck, [username, email], (errCheck, results) => {
    if (errCheck) return res.status(500).json({ success: false, message: "Erreur du serveur." });

    if (results.length > 0) {
      return res.json({ success: false, message: "Nom d'utilisateur ou email déjà utilisé." });
    }

    const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
    db.query(sql, [username, email, password], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Erreur lors de la création du profil." });
      }

      const htmlBienvenue = templateMail({
  emoji: "",
  titre: `Bienvenue à la SPE Congo, ${username} !`,
  sousTitre: "Votre aventure commence ici",
  contenu: `
    <p>Nous sommes ravis de vous compter parmi nous.</p>
    <p>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter pour accéder à tous nos contenus exclusifs.</p>
  `
});

resend.emails.send({
  from: 'SPE Congo <onboarding@resend.dev>',
  to: email,
  subject: 'Bienvenue à la SPE Congo !',
  html: htmlBienvenue
}).catch(e => console.error("Erreur mail bienvenue:", e));

res.json({ success: true, message: "Compte créé avec succès !" });

    });
  });
});

// Fonction mail bienvenue mentor
function envoyerMailBienvenueMentor(emailDestinataire, nomMentor) {
  return resend.emails.send({
    from: 'SPE Congo <onboarding@resend.dev>',
    to: emailDestinataire,
    subject: ' Merci pour votre candidature Mentor - SPE Congo',
    html: templateMail({
      emoji: '',
      titre: 'Candidature reçue !',
      sousTitre: 'Programme de Mentorat SPE Congo',
      contenu: `
        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Bonjour <strong>${nomMentor}</strong>,</p>
        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
          Nous avons bien reçu votre candidature en tant que Mentor au programme de mentorat de la <strong>SPE Congo Section 117</strong>.
        </p>
        <div style="background:#f0f9ff; border-left:4px solid #0054a6; padding:15px 20px; border-radius:8px; margin-top:20px;">
          <p style="margin:0; color:#0054a6; font-size:0.9rem;"> Notre équipe examinera votre profil et vous contactera prochainement.</p>
        </div>
      `
    })
  });
}

// Route inscription mentor
app.post('/api/register-mentor', uploadMentor, (req, res) => {
  const { nom_complet, poste_entreprise, domaine_expertise, email_contact, motivations, user_id } = req.body;
  const photo_path = req.files['photo'] ? req.files['photo'][0].path : null;
  const cv_path = req.files['cv'] ? req.files['cv'][0].path : null;

  const sql = "INSERT INTO mentors (nom_complet, poste_entreprise, domaine_expertise, email_contact, motivations, photo_path, cv_path, statut, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'EN ATTENTE', ?)";
  db.query(sql, [nom_complet, poste_entreprise, domaine_expertise, email_contact, motivations, photo_path, cv_path, user_id], (err, result) => {
    if (err) {
      console.error("Erreur SQL Mentor :", err);
      return res.status(500).json({ success: false, error: err });
    }

    envoyerMailBienvenueMentor(email_contact, nom_complet)
      .then(() => console.log(`Mail de remerciement envoyé au Mentor : ${email_contact}`))
      .catch(errMail => console.error("❌ Erreur mail Mentor :", errMail));

    res.json({ success: true, message: "Inscription mentor réussie !" });
  });
});

// Fonction mail bienvenue mentee
function envoyerMailBienvenueMentee(emailDestinataire, nomMentee) {
  return resend.emails.send({
    from: 'SPE Congo <onboarding@resend.dev>',
    to: emailDestinataire,
    subject: ' Bienvenue au Programme de Mentorat - SPE Congo',
    html: templateMail({
      emoji: '',
      titre: 'Bienvenue dans le programme !',
      sousTitre: 'Programme de Mentorat SPE Congo',
      contenu: `
        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Félicitations <strong>${nomMentee}</strong> !</p>
        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
          Nous avons bien reçu ton inscription au programme de mentorat de la <strong>Society of Petroleum Engineers (SPE) Congo</strong>.
        </p>
        <div style="background:#f0f9ff; border-left:4px solid #0054a6; padding:15px 20px; border-radius:8px; margin-top:20px;">
          <p style="margin:0 0 8px; color:#0054a6; font-weight:600; font-size:0.9rem;">📋 Prochaines étapes</p>
          <p style="margin:0; color:#1e293b; font-size:0.88rem; line-height:1.9;">
            1️⃣ Ton profil va être examiné par nos administrateurs.<br>
            2️⃣ Tu peux consulter la liste des mentors disponibles selon ton domaine d'intérêt.<br>
            3️⃣ Tu recevras une notification dès qu'un match sera effectué !
          </p>
        </div>
      `
    })
  });
}

// Route inscription mentee
app.post('/api/register-mentee', uploadMentee, (req, res) => {
  const { nom_complet, email, domaine_interet, motivations, ecole, user_id } = req.body;
  const photoPath = req.files['photo'] ? req.files['photo'][0].path : null;
  const cvPath = req.files['cv'] ? req.files['cv'][0].path : null;
  const certificatSpeUrl = req.files['certificat_spe']?.[0]?.path || '' ; 

  const sql = "INSERT INTO mentees (nom_complet, email, domaine_interet, motivations, photo_path, cv_path, statut, ecole, user_id, certificat_spe_url) VALUES (?, ?, ?, ?, ?, ?, 'EN ATTENTE', ?, ?, ?)";
  db.query(sql, [nom_complet, email, domaine_interet, motivations, photoPath, cvPath, ecole, user_id, certificatSpeUrl], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ success: false, error: err });
    }

    envoyerMailBienvenueMentee(email, nom_complet)
      .then(() => console.log(` Mail de bienvenue envoyé avec succès à : ${email}`))
      .catch(errMail => console.error("❌ Erreur lors de l'envoi du mail :", errMail));

    res.json({ success: true, message: "Inscription réussie et mail envoyé !" });
  });
});

// ==========================================
// 3. ROUTES PUBLIQUES (MENTORS, EVENTS, ETC)
// ==========================================

app.get('/api/members', (req, res) => {
  const sql = "SELECT * FROM members";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erreur lors de la récupération des membres :", err);
      return res.status(500).json({ error: "Erreur serveur lors du chargement de l'équipe" });
    }
    res.json(result);
  });
});

app.get('/get-mentors', (req, res) => {
  db.query("SELECT * FROM mentors WHERE statut = 'ACTIF'", (err, results) => {
    if (err) return res.status(500).json([]);
    res.json(results);
  });
});

app.get('/api/events', (req, res) => {
  const sql = "SELECT * FROM events ORDER BY date_evenement ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/nouvelle-demande', (req, res) => {
  const { mentorId, menteeId, message } = req.body;
  console.log("Données reçues :", { mentorId, menteeId, message });

  db.query("SELECT id FROM mentees WHERE user_id = ?", [menteeId], (err, results) => {
    if (err || results.length === 0) {
      console.error("Mentee introuvable pour user_id:", menteeId);
      return res.status(500).json({ success: false, message: "Mentee introuvable" });
    }

    const realMenteeId = results[0].id;
    const sqlInsert = "INSERT INTO demandes_mentorat (mentor_id, mentee_id, message_demande, statut) VALUES (?, ?, ?, 'en_attente')";
    db.query(sqlInsert, [mentorId, realMenteeId, message], (errInsert) => {
      if (errInsert) {
        console.error("ERREUR SQL :", errInsert.message);
        return res.status(500).json({ success: false, message: "Erreur BDD : " + errInsert.message });
      }

      console.log("✅ Demande enregistrée !");

      const sqlInfos = `
        SELECT 
          (SELECT email_contact FROM mentors WHERE id = ?) AS email_mentor,
          (SELECT nom_complet FROM mentors WHERE id = ?) AS nom_mentor,
          (SELECT nom_complet FROM mentees WHERE id = ?) AS nom_mentee
      `;

      db.query(sqlInfos, [mentorId, mentorId, realMenteeId], (errInfo, resInfo) => {
        if (errInfo) {
          console.error("Erreur SQL Infos:", errInfo);
          return res.json({ success: true, message: "Demande enregistrée (mail non envoyé)" });
        }

        const infos = resInfo[0];
        if (!infos || !infos.email_mentor) {
          return res.json({ success: true, message: "Demande enregistrée (mentor non trouvé)" });
        }

        const { email_mentor, nom_mentor, nom_mentee } = infos;

        resend.emails.send({
  from: 'SPE Congo <onboarding@resend.dev>',
  to: email_mentor,
  subject: ` Nouvelle demande de mentorat de ${nom_mentee}`,
  html: templateMail({
    emoji: '',
    titre: 'Nouvelle demande de mentorat',
    sousTitre: 'Programme de Mentorat SPE Congo',
    contenu: `
      <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Bonjour <strong>${nom_mentor}</strong>,</p>
      <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
        Vous avez reçu une nouvelle demande de mentorat de la part de <strong>${nom_mentee}</strong>.
      </p>
      <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px 20px; border-radius:8px; margin-top:20px;">
        <p style="margin:0 0 5px; color:#64748b; font-size:0.82rem;">Message :</p>
        <p style="margin:0; color:#1e293b; font-size:0.9rem; font-style:italic; line-height:1.6;">"${message}"</p>
      </div>
      <div style="background:#f0f9ff; border-left:4px solid #0054a6; padding:15px 20px; border-radius:8px; margin-top:20px;">
        <p style="margin:0; color:#0054a6; font-size:0.9rem;"> Connectez-vous sur la plateforme pour accepter ou refuser la demande.</p>
      </div>
      <p style="color:#64748b; font-size:0.85rem; margin-top:25px;">Cordialement,<br><strong>L'équipe SPE Congo</strong></p>
    `
  })
}).then(() => {
  return res.json({ success: true, message: "Demande envoyée avec succès !" });
}).catch(errMail => {
  console.error("Erreur Mail:", errMail);
  return res.json({ success: true, message: "Demande enregistrée (mail échoué)" });
});
      });
    });
  });
});

// ==========================================
// 4. SUIVI OBJECTIFS
// ==========================================

app.get('/api/liste-etudiants-suivis/:mentorUserId', (req, res) => {
  const mentorUserId = req.params.mentorUserId;
  const sql = `SELECT me.*, r.id AS relation_id FROM relationships r JOIN mentees me ON r.mentee_id = me.id JOIN mentors men ON r.mentor_id = men.id WHERE men.user_id = ? AND r.statut = 'actif'`;
  db.query(sql, [mentorUserId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/details-binome/:relId', (req, res) => {
  const relId = req.params.relId;
  const sql = `SELECT me.nom_complet AS mentee_nom, me.photo_path AS mentee_photo, men.nom_complet AS mentor_nom, men.photo_path AS mentor_photo, r.id AS relation_id FROM relationships r JOIN mentees me ON r.mentee_id = me.id JOIN mentors men ON r.mentor_id = men.id WHERE r.id = ?`;
  db.query(sql, [relId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) res.json(results[0]);
    else res.status(404).json({ message: "Binôme non trouvé" });
  });
});

app.get('/get-objectifs', (req, res) => {
  const { relId } = req.query;
  db.query("SELECT * FROM objectifs WHERE relationship_id = ? ORDER BY date_creation DESC", [relId], (err, results) => {
    if (err) return res.status(500).json([]);
    res.json(results);
  });
});

app.post('/ajouter-objectif', (req, res) => {
  const { relId, titre } = req.body;
  db.query("INSERT INTO objectifs (relationship_id, titre, statut) VALUES (?, ?, 'a_faire')", [relId, titre], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.post('/update-objectif', (req, res) => {
  const { objId, statut } = req.body;
  db.query("UPDATE objectifs SET statut = ? WHERE id = ?", [statut, objId], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.get('/api/mentors', (req, res) => {
  const sql = "SELECT * FROM mentors";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erreur SQL mentors:", err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

app.get('/api/news', (req, res) => {
  const sql = "SELECT * FROM news ORDER BY date_publication DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post('/api/update-status', (req, res) => {
  const { id, statut } = req.body;
  console.log(`Validation admin pour le mentor ID: ${id} -> Nouveau statut: ${statut}`);
  const sql = "UPDATE mentors SET statut = ? WHERE id = ?";
  db.query(sql, [statut, id], (err, result) => {
    if (err) {
      console.error("Erreur SQL lors de la validation du mentor:", err.sqlMessage);
      return res.status(500).json({ success: false, error: err.sqlMessage });
    }
    res.json({ success: true });
  });
});

app.post('/api/add-event', (req, res) => {
  const { titre, date, lieu, description } = req.body;

  const aujourdhui = new Date();
  const dateEvent = new Date(date);
  aujourdhui.setHours(0, 0, 0, 0);
  dateEvent.setHours(0, 0, 0, 0);

  let statutAuto = 'À venir';
  if (dateEvent < aujourdhui) statutAuto = 'Passé';
  else if (dateEvent.getTime() === aujourdhui.getTime()) statutAuto = "Aujourd'hui";

  const sql = "INSERT INTO events (titre, description, date_evenement, lieu, statut) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [titre, description, date, lieu, statutAuto], (err, result) => {
    if (err) {
      console.error("Erreur SQL:", err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true });
  });
});

app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM events WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true });
  });
});

// ==========================================
// 5. ROUTES ADMINISTRATION (MENTEES & MENTORS)
// ==========================================

app.get('/api/admin/mentees', (req, res) => {
  const sql = "SELECT id, photo_path, nom_complet, email, domaine_interet, ecole, cv_path, statut, date_inscription FROM mentees ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.delete('/api/admin/mentees/:id', (req, res) => {
  db.query("DELETE FROM mentees WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.get('/api/admin/mentors', (req, res) => {
  const sql = "SELECT id, nom_complet, poste_entreprise, domaine_expertise, email_contact, motivations, photo_path, cv_path, statut, date_inscription FROM mentors WHERE statut IN ('Actif', 'EN ATTENTE') ORDER BY id DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.delete('/api/admin/mentors/:id', (req, res) => {
  const mentorId = req.params.id;
  const sql = "UPDATE mentors SET statut = 'archivé' WHERE id = ?";
  db.query(sql, [mentorId], (err, result) => {
    if (err) return res.status(500).json({ error: "Erreur lors de l'archivage" });
    res.json({ message: "Le mentor a été archivé avec succès !" });
  });
});

function envoyerMailDecisionMentor(email_contact, nom_complet, nouveauStatut) {
  const estValide = nouveauStatut === 'ACTIF' || nouveauStatut === 'VALIDER' || nouveauStatut === 'APPROUVER';

  return resend.emails.send({
    from: 'SPE Congo <onboarding@resend.dev>',
    to: email_contact,
    subject: estValide
      ? ' Votre candidature de Mentor a été approuvée - SPE Congo'
      : ' Information concernant votre candidature - SPE Congo',
    html: templateMail({
      emoji: estValide ? '' : '',
      titre: estValide ? 'Candidature approuvée !' : 'Concernant votre candidature',
      sousTitre: 'Programme de Mentorat SPE Congo',
      contenu: `
        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Bonjour <strong>${nom_complet}</strong>,</p>
        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
          Nous vous contactons suite à l'examen de votre candidature au programme de mentorat de la <strong>SPE Congo Section 117</strong>.
        </p>
        ${estValide ? `
        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
          Nous avons le plaisir de vous annoncer que votre profil a été <strong>validé</strong> par notre équipe !
        </p>
        <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:15px 20px; border-radius:8px; margin-top:20px;">
          <p style="margin:0; color:#065f46; font-size:0.9rem; line-height:1.7;">
             Vous avez désormais accès à la plateforme en tant que Mentor officiel.<br>
             Nous reviendrons vers vous pour vous présenter votre premier mentee.
          </p>
        </div>
        ` : `
        <div style="background:#fef2f2; border-left:4px solid #ef4444; padding:15px 20px; border-radius:8px; margin-top:20px;">
          <p style="margin:0; color:#991b1b; font-size:0.9rem;"> Votre candidature n'a pas été retenue à ce stade. Nous vous encourageons à repostuler ultérieurement.</p>
        </div>
        `}
        <p style="color:#64748b; font-size:0.85rem; margin-top:25px;">Cordialement,<br><strong>L'équipe SPE Congo</strong></p>
      `
    })
  });
}

app.put('/api/admin/mentors/:id/status', (req, res) => {
  const { id } = req.params;
  const { statut } = req.body;

  const sqlGet = "SELECT nom_complet, email_contact FROM mentors WHERE id = ?";
  db.query(sqlGet, [id], (err, results) => {
    if (err || !results || results.length === 0) {
      return res.status(500).json({ success: false, error: "Mentor introuvable" });
    }

    const mentor = results[0];
    console.log("Données récupérées pour le mail :", mentor);
    const destinataire = mentor.email_contact;
    const nom = mentor.nom_complet;

    const sqlUpdate = "UPDATE mentors SET statut = ? WHERE id = ?";
    db.query(sqlUpdate, [statut, id], (errUpdate) => {
      if (errUpdate) return res.status(500).json({ success: false });

      if (destinataire) {
        envoyerMailDecisionMentor(destinataire, nom, statut)
          .then(() => console.log(`Mail envoyé à ${destinataire}`))
          .catch(errMail => console.error("❌ Erreur Nodemailer:", errMail));
      } else {
        console.error("❌ Impossible d'envoyer le mail : l'adresse est vide en BDD.");
      }

      res.json({ success: true });
    });
  });
});

app.put('/api/admin/mentees/:id/statut', (req, res) => {
  const { statut } = req.body;
  db.query("UPDATE mentees SET statut = ? WHERE id = ?", [statut, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.get('/api/admin/relationships', (req, res) => {
  const sql = `SELECT r.id AS relation_id, r.date_debut, m.nom_complet AS mentor_nom, m.photo_path AS mentor_photo, mt.nom_complet AS mentee_nom, mt.photo_path AS mentee_photo, (SELECT COUNT(*) FROM objectifs WHERE relationship_id = r.id) AS total_obj, (SELECT COUNT(*) FROM objectifs WHERE relationship_id = r.id AND statut = 'termine') AS obj_faits FROM relationships r JOIN mentors m ON r.mentor_id = m.id JOIN mentees mt ON r.mentee_id = mt.id ORDER BY r.date_debut DESC`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erreur SQL binômes:", err);
      return res.status(500).json([]);
    }
    res.json(results);
  });
});

app.delete('/api/admin/relationships/:id', (req, res) => {
  const relId = req.params.id;
  console.log("Demande de rupture du binôme ID :", relId);
  const sql = "DELETE FROM relationships WHERE id = ?";
  db.query(sql, [relId], (err, result) => {
    if (err) {
      console.error("❌ Erreur SQL suppression binôme :", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    console.log("Binôme supprimé ! Lignes affectées :", result.affectedRows);
    res.json({ success: true });
  });
});

// ==========================================
// 6. ROUTES NEWS (POST / PUT / DELETE)
// ==========================================

app.post('/api/news', uploadNews, (req, res) => {
  const { titre, contenu, categorie } = req.body;
  const image_url = req.files['image_file'] ? req.files['image_file'][0].path : `https://res.cloudinary.com/votre_cloud/image/upload/v12345/default_news.jpg`;
  const flyer_url = req.files['flyer_file'] ? req.files['flyer_file'][0].path : null;

  const sql = "INSERT INTO news (titre, contenu, image_path, categorie, flyer_path) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [titre, contenu, image_url, categorie || 'News', flyer_url], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.status(200).json({ message: "News publiée !", id: result.insertId });
  });
});

app.delete('/api/news/:id', (req, res) => {
  const id = req.params.id;

  db.query("SELECT image_path, flyer_path FROM news WHERE id = ?", [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).send("News introuvable");

    const { image_path, flyer_path } = results[0];

    db.query("DELETE FROM news WHERE id = ?", [id], (err) => {
      if (err) return res.status(500).send("Erreur serveur");

      if (image_path && image_path.includes('cloudinary')) cloudinary.uploader.destroy(getPublicId(image_path));
      if (flyer_path && flyer_path.includes('cloudinary')) cloudinary.uploader.destroy(getPublicId(flyer_path), { resource_type: 'auto' });

      res.send("News supprimée de la BDD et de Cloudinary !");
    });
  });
});

app.put('/api/news/:id', uploadNews, (req, res) => {
  const id = req.params.id;
  const { titre, contenu, categorie } = req.body;

  const image_url = req.files['image_file'] ? req.files['image_file'][0].path : null;
  const flyer_url = req.files['flyer_file'] ? req.files['flyer_file'][0].path : null;

  let setClauses = ['titre = ?', 'contenu = ?', 'categorie = ?'];
  let params = [titre, contenu, categorie];

  if (image_url) { setClauses.push('image_path = ?'); params.push(image_url); }
  if (flyer_url) { setClauses.push('flyer_path = ?'); params.push(flyer_url); }

  params.push(id);
  const sql = `UPDATE news SET ${setClauses.join(', ')} WHERE id = ?`;

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Mise à jour réussie sur Cloudinary et BDD" });
  });
});

app.get('/api/news/:id', (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM news WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération de la news:", err);
      return res.status(500).json({ error: "Erreur serveur" });
    }
    if (results.length === 0) return res.status(404).json({ message: "News introuvable" });
    res.json(results[0]);
  });
});

app.put('/api/events/:id', (req, res) => {
  const id = req.params.id;
  const { titre, date_evenement, lieu, description } = req.body;
  const sql = "UPDATE events SET titre = ?, date_evenement = ?, lieu = ?, description = ? WHERE id = ?";
  db.query(sql, [titre, date_evenement, lieu, description, id], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).json({ error: "Erreur lors de la modification de l'événement" });
    }
    if (result.affectedRows === 0) return res.status(404).json({ message: "Événement non trouvé" });
    res.status(200).json({ message: "Événement mis à jour avec succès !" });
  });
});

// ==========================================
// 7. GALERIE
// ==========================================

app.post('/api/upload-galerie', uploadGalerie.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier reçu" });

  const { titre, description } = req.body;
  const imagePath = req.file.path;

  const sql = "INSERT INTO galerie (titre, description, image_path) VALUES (?, ?, ?)";
  db.query(sql, [titre, description, imagePath], (err, result) => {
    if (err) {
      console.error("Erreur SQL :", err);
      return res.status(500).send(err.message);
    }
    res.json({ success: true });
  });
});

app.get('/api/galerie', (req, res) => {
  const sql = "SELECT * FROM galerie ORDER BY date_ajout DESC LIMIT 10";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.get('/api/admin/galerie', (req, res) => {
  const sql = "SELECT * FROM galerie ORDER BY date_ajout DESC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erreur SQL galerie:", err);
      return res.status(500).json({ error: "Erreur récupération galerie" });
    }
    res.json(results);
  });
});

app.delete('/api/galerie/:id', (req, res) => {
  const photoId = req.params.id;

  db.query("SELECT image_path FROM galerie WHERE id = ?", [photoId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: "Photo introuvable" });

    const fullUrl = results[0].image_path;

    db.query("DELETE FROM galerie WHERE id = ?", [photoId], (err) => {
      if (err) return res.status(500).json({ success: false });

      if (fullUrl && fullUrl.includes('cloudinary')) {
        const publicId = getPublicId(fullUrl);
        if (publicId) {
          cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) console.log("❌ Erreur suppression Cloudinary :", error);
            else console.log("✅ Image supprimée de Cloudinary :", result);
          });
        }
      }

      res.json({ success: true });
    });
  });
});

// ==========================================
// 8. PARTIE DASHBOARD MENTEE
// ==========================================

app.get('/api/mentee/profil', (req, res) => {
  const { userId } = req.query;
  db.query("SELECT * FROM mentees WHERE user_id = ?", [userId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json(null);
    res.json(results[0]);
  });
});

app.get('/api/mentee/relations', (req, res) => {
  const { userId } = req.query;
  const sql = `SELECT r.id, r.statut, men.nom_complet AS mentor_nom, men.poste_entreprise AS mentor_poste, men.domaine_expertise AS mentor_expertise, men.email_contact AS mentor_email, men.photo_path AS mentor_photo FROM relationships r JOIN mentees me ON r.mentee_id = me.id JOIN mentors men ON r.mentor_id = men.id WHERE me.user_id = ?`;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json([]);

    results = results.map(r => ({
      ...r,
      mentor_photo: r.mentor_photo ? r.mentor_photo.replace(/\\/g, '/') : null
    }));

    res.json(results);
  });
});

// ==========================================
// 9. MESSAGERIE / BROADCAST
// ==========================================

app.get('/api/utilisateurs', (req, res) => {
  const sql = "SELECT id, username, email FROM users ORDER BY username ASC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      return res.status(500).json({ error: "Erreur base de données" });
    }
    res.json(results);
  });
});

app.post('/api/broadcast', (req, res) => {
  const { sujet, message, emails } = req.body;

  if (!emails || emails.length === 0) {
    return res.status(400).json({ success: false, message: "Aucun destinataire" });
  }

  const messageHtml = message.replace(/\n/g, '<br>');
  const finalHtml = templateMail({
    emoji: "",
    titre: sujet,
    sousTitre: "Annonce officielle de la Section 117",
    contenu: `<div style="color:#334155; line-height:1.6; font-size:1rem;">${messageHtml}</div>`
  });

  resend.emails.send({
  from: 'SPE Congo <onboarding@resend.dev>',
  to: emails,
  subject: sujet,
  html: finalHtml
}).then(() => {
  res.json({ success: true });
}).catch(error => {
  console.error("Erreur envoi:", error);
  res.status(500).json({ success: false });
});
});

// ==========================================
// 10. ROUTE FÉLICITATIONS OBJECTIFS
// ==========================================

app.post('/envoyer-felicitations', (req, res) => {
  const { relId, type, titre } = req.body;

  const sqlRel = "SELECT mentee_id, mentor_id FROM relationships WHERE id = ?";
  db.query(sqlRel, [relId], (errRel, resRel) => {
    if (errRel || resRel.length === 0)
      return res.status(500).json({ success: false, message: "Relation introuvable" });

    const menteeId = resRel[0].mentee_id;
    const mentorId = resRel[0].mentor_id;

    db.query("SELECT email, nom_complet FROM mentees WHERE id = ?", [menteeId], (errM, resMentee) => {
      if (errM || resMentee.length === 0)
        return res.status(500).json({ success: false, message: "Mentee introuvable" });

      db.query("SELECT email_contact, nom_complet FROM mentors WHERE id = ?", [mentorId], (errMen, resMentor) => {
        if (errMen || resMentor.length === 0)
          return res.status(500).json({ success: false, message: "Mentor introuvable" });

        const infoMentee = resMentee[0];
        const infoMentor = resMentor[0];

        console.log("Envoi mail à:", infoMentee.email, "et", infoMentor.email_contact);

        const estTous = type === 'tous_objectifs';

        const htmlMail = templateMail({
          emoji: estTous ? '' : '',
          titre: estTous ? 'Mission accomplie !' : 'Objectif atteint !',
          sousTitre: 'Programme de Mentorat SPE Congo',
          contenu: `
            <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Bonjour <strong>${infoMentee.nom_complet}</strong>,</p>
            <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
              ${estTous
                ? `Félicitations ! Vous avez atteint <strong>100% de vos objectifs</strong> de mentorat. Toute l'équipe SPE Congo vous félicite pour ce parcours !`
                : `L'objectif <strong>"${titre}"</strong> a été validé avec succès dans votre parcours de mentorat !`
              }
            </p>
            <div style="background:${estTous ? '#f0fdf4' : '#f0f9ff'}; border-left:4px solid ${estTous ? '#10b981' : '#0054a6'}; padding:15px 20px; border-radius:8px; margin-top:20px;">
              <p style="margin:0; color:${estTous ? '#065f46' : '#0054a6'}; font-size:0.9rem;">
                ${estTous ? ' Bravo au binôme !' : ' Continuez sur cette lancée !'}
              </p>
            </div>
            <p style="color:#94a3b8; font-size:0.82rem; margin-top:25px;">Votre Mentor : <strong>${infoMentor.nom_complet}</strong></p>
          `
        });

       resend.emails.send({
  from: 'SPE Congo <onboarding@resend.dev>',
  to: infoMentee.email,
  cc: infoMentor.email_contact,
  subject: estTous ? 'Tous vos objectifs sont atteints !' : `Objectif atteint : ${titre}`,
  html: htmlMail
}).then(() => {
  res.json({ success: true, message: "Email envoyé avec succès !" });
}).catch(error => {
  console.error("Erreur Resend:", error);
  res.status(500).json({ success: false });
});
      });
    });
  });
});

// ==========================================
// 11. ROUTES VOLONTAIRES
// ==========================================

// POST — Soumettre une candidature volontaire
app.post('/api/volontaires', uploadVolontaire, (req, res) => {
  const { prenom, nom, email, tel, domaine, experience, dispo, motivation, source } = req.body;

  // ── RÉCUPÉRATION SÉCURISÉE DES URLs CLOUDINARY ──
  const photo = req.files && req.files['photo'] ? req.files['photo'][0].path : null;
  const certificat_url = req.files && req.files['certificat'] ? req.files['certificat'][0].path : null;

  // Sécurité : le certificat est obligatoire selon les consignes 
  if (!certificat_url) {
    return res.status(400).json({ success: false, message: "Le certificat d'adhésion SPE est obligatoire." });
  }

  // ── REQUÊTE SQL MODIFIÉE (Mise à jour avec certificat_url) ──
  const sql = `
    INSERT INTO volontaires 
    (prenom, nom, email, telephone, certificat_url, domaine, experience, disponibilite, motivation, source, photo, statut)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_attente')
  `;

  db.query(sql, [prenom, nom, email, tel, certificat_url, domaine, experience, dispo, motivation, source, photo], (err) => {
    if (err) {
      console.error("Erreur insertion volontaire:", err);
      return res.status(500).json({ success: false, message: "Erreur base de données" });
    }

    // ── EMAIL ADMIN (Destinataire: Rita/Thierry/Peter) ──
    resend.emails.send({
      from: 'SPE Congo <onboarding@resend.dev>',
      to: 'ritakngot3@gmail.com',
      subject: `⚠️ Nouvelle candidature volontaire — ${prenom} ${nom}`,
      html: templateMail({
        emoji: '📋',
        titre: 'Nouvelle candidature volontaire',
        sousTitre: 'SPE Congo Section 117 — Volontariat',
        contenu: `
          <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Une nouvelle candidature vient d'être soumise sur la plateforme.</p>
          <table style="width:100%; border-collapse:collapse; margin-top:16px; font-size:0.9rem;">
            <tr style="background:#f1f5f9;"><td style="padding:10px 14px; font-weight:600; color:#475569; width:40%;">Nom complet</td><td style="padding:10px 14px; color:#1e293b;">${prenom} ${nom}</td></tr>
            <tr><td style="padding:10px 14px; font-weight:600; color:#475569;">Email</td><td style="padding:10px 14px; color:#1e293b;">${email}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:10px 14px; font-weight:600; color:#475569;">Téléphone</td><td style="padding:10px 14px; color:#1e293b;">${telephone || '—'}</td></tr>
            <tr><td style="padding:10px 14px; font-weight:600; color:#475569;">Domaine choisi</td><td style="padding:10px 14px; color:#1e293b; font-weight:600;">${domaine}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:10px 14px; font-weight:600; color:#475569;">Expérience</td><td style="padding:10px 14px; color:#1e293b;">${experience}</td></tr>
            <tr><td style="padding:10px 14px; font-weight:600; color:#475569;">Disponibilité</td><td style="padding:10px 14px; color:#1e293b;">${disponibilite}</td></tr>
            <tr style="background:#f1f5f9;"><td style="padding:10px 14px; font-weight:600; color:#475569;">Motivations</td><td style="padding:10px 14px; color:#1e293b; line-height:1.5;">${motivation}</td></tr>
            <tr>
              <td style="padding:10px 14px; font-weight:600; color:#475569;">Pièces jointes</td>
              <td style="padding:10px 14px; color:#1e293b;">
                ${photo ? `<a href="${photo}" target="_blank" style="color:#0054a6; font-weight:600; text-decoration:none; display:block; margin-bottom:5px;">📸 Voir la Photo de profil</a>` : 'Aucune photo'}
                <a href="${certificat_url}" target="_blank" style="color:#0054a6; font-weight:600; text-decoration:none; display:block;">📄 Ouvrir le Certificat d'adhésion</a>
              </td>
            </tr>
          </table>
          <div style="background:#eff6ff; border-left:4px solid #3b82f6; padding:14px 18px; border-radius:8px; margin-top:20px;">
            <p style="margin:0; color:#1e40af; font-size:0.88rem;">💡 Les fichiers sont hébergés de manière sécurisée sur Cloudinary. Cliquez sur les liens ci-dessus pour les valider directement.</p>
          </div>
        `
      })
    }).catch(e => console.error("Erreur mail admin volontaire:", e));

    // ── EMAIL CANDIDAT (Destinataire: Le Volontaire) ──
    resend.emails.send({
      from: 'SPE Congo <onboarding@resend.dev>',
      to: email,
      subject: 'Candidature volontaire reçue — SPE Congo Section 117',
      html: templateMail({
        emoji: '🎉',
        titre: 'Candidature reçue !',
        sousTitre: 'SPE Congo Section 117 — Volontariat',
        contenu: `
          <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">Bonjour <strong>${prenom}</strong>,</p>
          <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
            Nous avons bien reçu votre dossier complet pour rejoindre l'équipe de volontaires de la <strong>SPE Congo Section 117</strong>. Merci pour votre intérêt et votre engagement !
          </p>
          <div style="background:#f0f9ff; border-left:4px solid #0054a6; padding:15px 20px; border-radius:8px; margin-top:20px;">
            <p style="margin:0 0 6px; color:#0054a6; font-weight:600; font-size:0.9rem;">Récapitulatif de votre soumission :</p>
            <p style="margin:0; color:#334155; font-size:0.88rem; line-height:1.7;">
              📌 Domaine d'intérêt : <strong>${domaine}</strong><br>
              🎓 Niveau d'expérience : <strong>${experience}</strong><br>
              📄 Statut document : <strong>Certificat d'adhésion transmis (En cours de validation)</strong>
            </p>
          </div>
          <p style="color:#475569; font-size:0.9rem; line-height:1.7; margin-top:20px;">
            Le comité de direction de la section examinera votre certificat. Vous recevrez une réponse <strong>dans les 72 heures</strong> concernant la validation définitive de votre rôle.
          </p>
          <p style="color:#475569; font-size:0.9rem; line-height:1.7;">
            Pour toute modification de dossier : <a href="mailto:congosection@spemail.org" style="color:#0054a6;">congosection@spemail.org</a>
          </p>
          <p style="color:#94a3b8; font-size:0.85rem; margin-top:24px;">À bientôt,<br><strong style="color:#0054a6;">L'équipe SPE Congo Section 117</strong></p>
        `
      })
    }).catch(e => console.error("Erreur mail candidat volontaire:", e));

    // Réponse positive renvoyée au frontend
    res.json({ success: true, message: "Candidature et pièces jointes soumises avec succès !" });
  });
});

// GET — Récupérer tous les volontaires (admin)
app.get('/api/admin/volontaires', (req, res) => {
  const sql = "SELECT * FROM volontaires ORDER BY created_at DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "Erreur base de données" });
    res.json(results);
  });
});

// PATCH — Mettre à jour le statut et le poste d'un volontaire (admin)
app.patch('/api/admin/volontaires/:id', (req, res) => {
  const { statut, poste } = req.body;
  const { id } = req.params;

  db.query("UPDATE volontaires SET statut = ?, poste = ? WHERE id = ?", [statut, poste, id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// ==========================================
// LANCEMENT DU SERVEUR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});