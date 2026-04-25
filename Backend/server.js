 require('dotenv').config();
 
 const fs = require('fs'); // Assure-toi d'avoir cette ligne en haut du fichier
 const express = require('express');
const cors = require('cors');
const db = require('./db');
const nodemailer = require('nodemailer');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- MIDDLEWARES ---
app.use(cors({
    origin:'https://spe-congo-project-static.onrender.com'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURATION EMAIL ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ritakngot3@gmail.com',
        pass: 'pewo beuk golk wiwn' // Ton mot de passe d'application
    }
});

// --- FICHIERS STATIQUES ---
app.use('/videos', express.static(path.join(__dirname, '..', 'videos')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/Mentee_docs', express.static(path.join(__dirname, 'Mentee_docs')));

// --- CONFIGURATION MULTER (UPLOADS) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

const storageMentee = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'Mentee_docs/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const uploadMentee = multer({ storage: storageMentee });

const storageNews = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'flyer_file') {
            cb(null, '../images/news/flyers/'); // ✅ dossier séparé pour les flyers
        } else {
            cb(null, '../images/news/');
        }
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const uploadNews = multer({ storage: storageNews }).fields([
    { name: 'image_file', maxCount: 1 },
    { name: 'flyer_file', maxCount: 1 }
]);

// Configuration pour les photos de la galerie

const storageGalerie = multer.diskStorage({
    destination: (req, file, cb) => {
        // On remonte d'un niveau (..) pour atteindre la racine depuis le dossier Backend
        const rootImagesPath = path.join(__dirname, '..', 'images', 'galerie');
        cb(null, rootImagesPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploadGalerie = multer({ storage: storageGalerie });

//Constante pour les mails du site
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

                        <!-- LOGO EN HAUT À GAUCHE -->
                        <tr>
                            <td style="background:white; border-radius:14px 14px 0 0; padding:20px 40px; border-bottom:1px solid #e2e8f0;">
                                <img src="https://i.imgur.com/Uimkn0z.jpeg"
                                     alt="SPE Congo"
                                     width="100"
                                     style="display:block; object-fit:contain;">
                            </td>
                        </tr>

                        <!-- HEADER BLEU -->
                        <tr>
                            <td style="background:#0054a6; padding:30px 40px; text-align:center;">
                                <div style="font-size:2.2rem;">${emoji}</div>
                                <h1 style="color:white; font-size:1.4rem; font-weight:700; margin:10px 0 5px;">${titre}</h1>
                                <p style="color:rgba(255,255,255,0.7); font-size:0.9rem; margin:0;">${sousTitre}</p>
                            </td>
                        </tr>

                        <!-- BODY -->
                        <tr>
                            <td style="background:white; padding:35px 40px;">
                                ${contenu}
                            </td>
                        </tr>

                        <!-- FOOTER -->
                        <tr>
                            <td style="background:#f8fafc; border-radius:0 0 14px 14px; padding:20px 40px; text-align:center; border-top:1px solid #e2e8f0;">
                                <p style="color:#0054a6; font-weight:700; font-size:0.85rem; margin:0 0 5px;">
                                     SPE Congo
                                </p>
                                <p style="color:#94a3b8; font-size:0.78rem; margin:0;">
                                    Merci de ne pas répondre à cet email.
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
}
//fin


// ==========================================
// 1. ROUTES DASHBOARD MENTOR (CORRIGÉES)
// ==========================================

// Récupérer les demandes en attente pour un mentor
app.get('/mes-demandes/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `
        SELECT d.*, me.nom_complet AS mentee_nom
        FROM demandes_mentorat d
        JOIN mentees me ON d.mentee_id = me.id
        JOIN mentors men ON d.mentor_id = men.id
        WHERE men.user_id = ?  -- ✅ on cherche par user_id et non mentor_id
        AND d.statut = 'en_attente'
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Répondre à une demande (Accepter/Refuser) + Mail + Update Mentee
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

        // ✅ Mettre à jour le statut du mentee → EN FORMATION
        db.query("UPDATE mentees SET statut = 'EN FORMATION' WHERE id = ?", 
            [data.mentee_id], (errStatut) => {
                if (errStatut) console.error("Erreur update statut mentee:", errStatut);
                else console.log("✅ Statut mentee mis à jour : EN FORMATION");
        });

                    // ✅ Mail acceptation avec template
                    const mailOptions = {
                        from: '"SPE Congo" <ritakngot3@gmail.com>',
                        to: data.mentee_email,
                        subject: 'Votre demande de mentorat a été acceptée !',
                        html: templateMail({
                            emoji: '',
                            titre: 'Demande acceptée !',
                            sousTitre: 'Programme de Mentorat SPE Congo',
                            contenu: `
                                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">
                                    Bonjour <strong>${data.mentee_nom}</strong>,
                                </p>
                                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                                    Excellente nouvelle ! <strong>${data.mentor_nom}</strong> a accepté 
                                    votre demande de mentorat. Votre parcours commence maintenant !
                                </p>
                                <div style="background:#f0fdf4; border-left:4px solid #10b981; 
                                            padding:15px 20px; border-radius:8px; margin-top:20px;">
                                    <p style="margin:0; color:#065f46; font-size:0.9rem;">
                                         Connectez-vous pour voir vos objectifs.
                                    </p>
                                </div>
                            `
                        })
                    };
                    transporter.sendMail(mailOptions).catch(e => console.error("Erreur Mail:", e));
                });

            } else if (decision === 'refusee') {
                // ✅ Mail refus avec template
                const mailOptions = {
                    from: '" SPE Congo" <ritakngot3@gmail.com>',
                    to: data.mentee_email,
                    subject: 'Mise à jour concernant votre demande de mentorat',
                    html: templateMail({
                        emoji: '',
                        titre: 'Concernant votre demande',
                        sousTitre: 'Programme de Mentorat SPE Congo',
                        contenu: `
                            <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">
                                Bonjour <strong>${data.mentee_nom}</strong>,
                            </p>
                            <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                                Nous vous informons que <strong>${data.mentor_nom}</strong> ne peut 
                                malheureusement pas donner suite à votre demande de mentorat pour le moment.
                            </p>
                            <div style="background:#fef2f2; border-left:4px solid #ef4444; 
                                        padding:15px 20px; border-radius:8px; margin-top:20px;">
                                <p style="margin:0; color:#991b1b; font-size:0.9rem;">
                                     Ne vous découragez pas, d'autres mentors sont disponibles sur la plateforme !
                                </p>
                            </div>
                        `
                    })
                };
                transporter.sendMail(mailOptions).catch(e => console.error("Erreur Mail Refus:", e));
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

    const sql = "SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?";
    
    db.query(sql, [identifiant, identifiant, password], (err, result) => {
        if (err) return res.status(500).json({ error: err });

        if (result && result.length > 0) {
            const user = result[0];

            // Cherche dans mentors d'abord
            db.query("SELECT id FROM mentors WHERE user_id = ?", [user.id], (errM, resMentor) => {
                if (!errM && resMentor.length > 0) {
                    // C'est un mentor
                    return res.json({
                        success: true,
                        user: {
                            id: resMentor[0].id,
                            userId: user.id,
                            username: user.username,
                            role: 'mentor'
                        }
                    });
                }

                // Cherche dans mentees ensuite
                db.query("SELECT id FROM mentees WHERE user_id = ?", [user.id], (errMe, resMentee) => {
                    if (!errMe && resMentee.length > 0) {
                        // C'est un mentee
                        return res.json({
                            success: true,
                            user: {
                                id: resMentee[0].id,
                                userId: user.id,
                                username: user.username,
                                role: 'mentee'
                            }
                        });
                    }

                    // Sinon c'est un simple user/admin
                    return res.json({
                        success: true,
                        user: {
                            id: user.id,
                            userId: user.id,
                            username: user.username,
                            role: user.role
                        }
                    });
                });
            });

        } else {
            res.json({ success: false, message: "Identifiants incorrects" });
        }
    });
});

//route _signup
app.post('/api/signup', (req,res)=>{
    const {username,email,password,confirm}=req.body;

    //vérification du mot de passe
    if(password==! confirm){
        return res.json({success: false,message:"les mots de passe ne correspondent pas"});
    }

    //vérifier si le username ou l'email existe déjà
    const sqlCheck="SELECT id FROM users WHERE username =? OR email=?";
    db.query(sqlCheck,[username,email], (errCheck,results)=>{
        if (errCheck) return res.status(500).json({success: false, message:"Erreur du serveur."});

        if (results.length>0) {
            return res.json({success:false, message:"Nom d'utilisateur ou email déjà utilisé."});
        }
        
// Insérer le nouvel utilisateur
const sql = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
db.query(sql, [username, email, password], (err, result) => {
    if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Erreur lors de la création du profil." });
         res.json({success:true, message:"Compte créé avec succes!"});
    }

    //  ENVOIE DU MAIL DE BIENVENUE ---
    const htmlBienvenue = templateMail({
        emoji: "",
        titre: `Bienvenue à la SPE Congo, ${username} !`,
        sousTitre: "Votre aventure commence ici",
        contenu: `
            <p>Nous sommes ravis de vous compter parmi nous.</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter pour accéder à tous nos contenus exclusifs.</p>
           
        `
    });

    const mailOptions = {
        from: '"SPE Congo" <ritakngot3@gmail.com>',
        to: email, // L'adresse saisie dans le formulaire
        subject: "Confirmation de votre inscription - SPE Congo",
        html: htmlBienvenue
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Erreur lors de l'envoi du mail de bienvenue :", error);
        } else {
            console.log("Mail de bienvenue envoyé avec succès à : " + email);
        }
    });

    // On répond au frontend
    res.json({ success: true, message: "Compte créé avec succès ! Un mail de confirmation vous a été envoyé." });
});
    });

});


//function mail_insc_mentor
function envoyerMailBienvenueMentor(emailMentor, nomMentor) {
    const mailOptions = {
        from: '"SPE Congo" <ritakngot3@gmail.com>',
        to: emailMentor,
        subject: ' Merci pour votre engagement - Programme de Mentorat SPE Congo',
        html: templateMail({
            emoji: '',
            titre: 'Bienvenue dans le programme !',
            sousTitre: 'Programme de Mentorat SPE Congo',
            contenu: `
                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">
                    Cher(e) <strong>${nomMentor}</strong>,
                </p>
                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                    Nous vous remercions chaleureusement d'avoir rejoint le programme de mentorat 
                    de la <strong>SPE Congo </strong> en tant que mentor.
                </p>
                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                    Votre expertise et votre expérience sont des atouts précieux pour accompagner 
                    la nouvelle génération de professionnels de l'énergie au Congo.
                </p>

                <div style="background:#f0f9ff; border-left:4px solid #0054a6; 
                            padding:15px 20px; border-radius:8px; margin-top:20px;">
                    <p style="margin:0 0 8px; color:#0054a6; font-weight:600; font-size:0.9rem;">
                        Quelle est la suite ?
                    </p>
                    <p style="margin:0; color:#1e293b; font-size:0.88rem; line-height:1.8;">
                         Notre équipe administrative va valider votre profil.<br>
                         Nous reviendrons vers vous pour vous proposer un ou plusieurs mentees.
                    </p>
                </div>

                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:25px;">
                    Merci de contribuer au développement des compétences locales.
                </p>

                <p style="color:#64748b; font-size:0.85rem; margin-top:25px;">
                    Cordialement,<br>
                    <strong>L'équipe de coordination SPE Congo</strong>
                </p>
            `
        })
    };

    return transporter.sendMail(mailOptions);
}

//rote_insc_mentor
// Route inscription mentor avec envoi de mail
app.post('/api/register-mentor', upload.fields([{ name: 'photo' }, { name: 'cv' }]), (req, res) => {
    const { nom_complet, poste_entreprise, domaine_expertise, email_contact, motivations, user_id } = req.body;
    const photo_path = req.files['photo'] ? req.files['photo'][0].path : null;
    const cv_path = req.files['cv'] ? req.files['cv'][0].path : null;

    const sql = "INSERT INTO mentors (nom_complet, poste_entreprise, domaine_expertise, email_contact, motivations, photo_path, cv_path, statut, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, 'EN ATTENTE', ?)";

    db.query(sql, [nom_complet, poste_entreprise, domaine_expertise, email_contact, motivations, photo_path, cv_path, user_id], (err, result) => {
        if (err) {
            console.error("Erreur SQL Mentor :", err);
            return res.status(500).json({ success: false, error: err });
        }

        // --- ENVOI DU MAIL AU MENTOR ---
        envoyerMailBienvenueMentor(email_contact, nom_complet)
            .then(() => console.log(`Mail de remerciement envoyé au Mentor : ${email_contact}`))
            .catch(errMail => console.error("❌ Erreur mail Mentor :", errMail));
        // -------------------------------

        res.json({ success: true, message: "Inscription mentor réussie !" });
    });
});

//fonction_mail_insc_mentee
function envoyerMailBienvenueMentee(emailDestinataire, nomMentee) {
    const mailOptions = {
        from: '"SikaHub - SPE Congo" <ritakngot3@gmail.com>',
        to: emailDestinataire,
        subject: ' Bienvenue au Programme de Mentorat - SPE Congo',
        html: templateMail({
            emoji: '',
            titre: 'Bienvenue dans le programme !',
            sousTitre: 'Programme de Mentorat SPE Congo',
            contenu: `
                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">
                    Félicitations <strong>${nomMentee}</strong> !
                </p>
                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                    Nous avons bien reçu ton inscription au programme de mentorat de la 
                    <strong>Society of Petroleum Engineers (SPE) Congo</strong>.
                </p>

                <div style="background:#f0f9ff; border-left:4px solid #0054a6; 
                            padding:15px 20px; border-radius:8px; margin-top:20px;">
                    <p style="margin:0 0 8px; color:#0054a6; font-weight:600; font-size:0.9rem;">
                         Prochaines étapes
                    </p>
                    <p style="margin:0; color:#1e293b; font-size:0.88rem; line-height:1.9;">
                        1️⃣ Ton profil va être examiné par nos administrateurs.<br>
                        2️⃣ Tu peux consulter la liste des mentors disponibles selon ton domaine d'interêt<br>
                        3️⃣ Tu recevras une notification dès qu'un match sera effectué !
                    </p>
                </div>

                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:25px;">
                    En attendant, n'hésite pas à consulter les dernières actualités sur notre plateforme.
                </p>

               

                <p style="color:#64748b; font-size:0.85rem; margin-top:25px;">
                    Cordialement,<br>
                    <strong>L'équipe SPE Congo</strong>
                </p>
            `
        })
    };

    return transporter.sendMail(mailOptions);
}

// Route inscription mentee avec envoi de mail
app.post('/api/register-mentee', uploadMentee.fields([{ name: 'photo' }, { name: 'cv' }]), (req, res) => {
    const { nom_complet, email, domaine_interet, motivations, ecole, user_id } = req.body;
    const photoPath = req.files['photo'] ? req.files['photo'][0].path : null;
    const cvPath = req.files['cv'] ? req.files['cv'][0].path : null;

    const sql = "INSERT INTO mentees (nom_complet, email, domaine_interet, motivations, photo_path, cv_path, statut, ecole, user_id) VALUES (?, ?, ?, ?, ?, ?, 'EN ATTENTE', ?, ?)";

    db.query(sql, [nom_complet, email, domaine_interet, motivations, photoPath, cvPath, ecole, user_id], (err, result) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).json({ success: false, error: err });
        }

        // --- ENVOI DU MAIL AUTOMATIQUE ICI ---
        // On utilise l'email et le nom récupérés dans req.body
        envoyerMailBienvenueMentee(email, nom_complet)
            .then(() => console.log(` Mail de bienvenue envoyé avec succès à : ${email}`))
            .catch(errMail => console.error("❌ Erreur lors de l'envoi du mail :", errMail));
        // -------------------------------------

        res.json({ success: true, message: "Inscription réussie et mail envoyé !" });
    });
});

// ==========================================
// 3. ROUTES PUBLIQUES (MENTORS, EVENTS, ETC)
// ==========================================

// Route pour récupérer les membres de l'équipe SPE Congo ORDER BY poste ASC
// Route pour récupérer les membres de l'équipe SPE Congo
app.get('/api/members', (req, res) => {
    // Remplace 'membres' par le nom exact de ta table dans ta base MySQL
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
    // On récupère tout pour l'affichage
    const sql = "SELECT * FROM events ORDER BY date_evenement ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

//route mentee_demande_mentor+envoi des mails
app.post('/api/nouvelle-demande', (req, res) => {
    const { mentorId, menteeId, message } = req.body;
    console.log("Données reçues :", { mentorId, menteeId, message });

    // Étape 1 : trouver le vrai ID mentee
    db.query("SELECT id FROM mentees WHERE user_id = ?", [menteeId], (err, results) => {
        if (err || results.length === 0) {
            console.error("Mentee introuvable pour user_id:", menteeId);
            return res.status(500).json({ success: false, message: "Mentee introuvable" });
        }

        const realMenteeId = results[0].id; // ✅

        // Étape 2 : insérer la demande
        const sqlInsert = "INSERT INTO demandes_mentorat (mentor_id, mentee_id, message_demande, statut) VALUES (?, ?, ?, 'en_attente')";
        db.query(sqlInsert, [mentorId, realMenteeId, message], (errInsert) => {
            if (errInsert) {
                console.error("ERREUR SQL :", errInsert.message);
                return res.status(500).json({ success: false, message: "Erreur BDD : " + errInsert.message });
            }

            console.log("✅ Demande enregistrée !");

            // Étape 3 : récupérer infos pour le mail
            const sqlInfos = `
                SELECT 
                    (SELECT email_contact FROM mentors WHERE id = ?) AS email_mentor,
                    (SELECT nom_complet FROM mentors WHERE id = ?) AS nom_mentor,
                    (SELECT nom_complet FROM mentees WHERE id = ?) AS nom_mentee
            `;

            // ✅ realMenteeId ici, pas menteeId
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

                const mailOptions = {
                    from: '"SikaHub - SPE Congo" <ritakngot3@gmail.com>',
                    to: email_mentor,
                    subject: `📩 Nouvelle demande de mentorat de ${nom_mentee}`,
                    html: templateMail({
                        emoji: '📩',
                        titre: 'Nouvelle demande de mentorat',
                        sousTitre: 'Programme de Mentorat SPE Congo',
                        contenu: `
                            <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">
                                Bonjour <strong>${nom_mentor}</strong>,
                            </p>
                            <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                                Vous avez reçu une nouvelle demande de mentorat de la part de 
                                <strong>${nom_mentee}</strong>.
                            </p>
                            <div style="background:#f8fafc; border:1px solid #e2e8f0; 
                                        padding:15px 20px; border-radius:8px; margin-top:20px;">
                                <p style="margin:0 0 5px; color:#64748b; font-size:0.82rem;">Message :</p>
                                <p style="margin:0; color:#1e293b; font-size:0.9rem; font-style:italic; line-height:1.6;">
                                    "${message}"
                                </p>
                            </div>
                            <div style="background:#f0f9ff; border-left:4px solid #0054a6;
                                        padding:15px 20px; border-radius:8px; margin-top:20px;">
                                <p style="margin:0; color:#0054a6; font-size:0.9rem;">
                                     Connectez-vous sur la plateforme pour accepter ou refuser la demande.
                                </p>
                            </div>
                            <p style="color:#64748b; font-size:0.85rem; margin-top:25px;">
                                Cordialement,<br>
                                <strong>L'équipe SikaHub · SPE Congo</strong>
                            </p>
                        `
                    })
                };

                transporter.sendMail(mailOptions, (errMail) => {
                    if (errMail) {
                        console.error("Erreur Mail:", errMail);
                        return res.json({ success: true, message: "Demande enregistrée (mail échoué)" });
                    }
                    return res.json({ success: true, message: "Demande envoyée avec succès !" });
                });
            });
        });
    });
});
// ==========================================
// 4. SUIVI OBJECTIFS  
// ==========================================
//route pour récupérer les mentees suivis par le mentor
// Route pour récupérer les noms du binôme via l'ID de la relation
// --- ROUTE A : Pour le Dashboard (Liste des étudiants) ---
// On utilise l'ID du mentor pour trouver tous ses étudiants
app.get('/api/liste-etudiants-suivis/:mentorUserId', (req, res) => {
    const mentorUserId = req.params.mentorUserId;
    const sql = `
        SELECT me.*, r.id AS relation_id
        FROM relationships r
        JOIN mentees me ON r.mentee_id = me.id
        JOIN mentors men ON r.mentor_id = men.id
        WHERE men.user_id = ? AND r.statut = 'actif'
    `;

    db.query(sql, [mentorUserId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Ici, on renvoie TOUT le tableau pour que le .forEach() fonctionne
        res.json(results); 
    });
});

// --- ROUTE B : Pour la page Suivi (Le binôme spécifique) ---
// On utilise l'ID de la relation (ex: 25) pour les détails
app.get('/api/details-binome/:relId', (req, res) => {
    const relId = req.params.relId;
    const sql = `
        SELECT 
            me.nom_complet AS mentee_nom, me.photo_path AS mentee_photo, 
            men.nom_complet AS mentor_nom, men.photo_path AS mentor_photo, 
            r.id AS relation_id
        FROM relationships r
        JOIN mentees me ON r.mentee_id = me.id
        JOIN mentors men ON r.mentor_id = men.id
        WHERE r.id = ?
    `;

    db.query(sql, [relId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        if (results.length > 0) {
            // Ici, on renvoie uniquement l'OBJET (results)
            res.json(results[0]);
        } else {
            res.status(404).json({ message: "Binôme non trouvé" });
        }
    });
});



//route pou récupérer les objectifs de mentorat
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

//route pour update les objectifs du mentortat
app.post('/update-objectif', (req, res) => {
    const { objId, statut } = req.body;
    db.query("UPDATE objectifs SET statut = ? WHERE id = ?", [statut, objId], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// Récupérer la liste des mentees suivis par un mentor précis 
app.get('/mes-demandes/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `
        SELECT d.*, me.nom_complet AS mentee_nom
        FROM demandes_mentorat d
        JOIN mentees me ON d.mentee_id = me.id
        JOIN mentors men ON d.mentor_id = men.id
        WHERE men.user_id = ?  -- ✅ on cherche par user_id et non mentor_id
        AND d.statut = 'en_attente'
    `;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Route pour récupérer les mentors
app.get('/api/mentors', (req, res) => {
    const sql = "SELECT * FROM mentors";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erreur SQL mentors:", err);
            return res.status(500).send(err);
        }
        res.json(results); // C'est ce JSON que le front attend
    });
});



// Route pour recupérer les news et  les afficher 
app.get('/api/news', (req, res) => {
    const sql = "SELECT * FROM news ORDER BY date_publication DESC"; // Adapte selon ta table
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results[0]);
    });
});

app.post('/api/update-status', (req, res) => {
    const { id, statut } = req.body; // L'ID du professionnel et le nouveau statut ('ACTIF' ou 'REFUSÉ')
    
    console.log(`Validation admin pour le mentor ID: ${id} -> Nouveau statut: ${statut}`);

    // CIBLE LA TABLE MENTORS
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
    
    // 1. Calcul automatique du statut
    const aujourdhui = new Date();
    const dateEvent = new Date(date);
    
    // On compare les dates sans les heures
    aujourdhui.setHours(0,0,0,0);
    dateEvent.setHours(0,0,0,0);

    let statutAuto = 'À venir';
    if (dateEvent < aujourdhui) {
        statutAuto = 'Passé';
    } else if (dateEvent.getTime() === aujourdhui.getTime()) {
        statutAuto = 'Aujourd\'hui';
    }

    // 2. Insertion dans la table 'events' (vu sur ta photo n°35)
    const sql = "INSERT INTO events (titre, description, date_evenement, lieu, statut) VALUES (?, ?, ?, ?, ?)";
    
    db.query(sql, [titre, description, date, lieu, statutAuto], (err, result) => {
        if (err) {
            console.error("Erreur SQL:", err.message);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true });
    });
});

//Supprimer les événement depuis le bord de l'admin
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

// --- MENTEES ---
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

// --- MENTORS ---
// 1. Récupérer tous les mentors
app.get('/api/admin/mentors', (req, res) => {
    const sql = "SELECT id, nom_complet, poste_entreprise, domaine_expertise, email_contact, motivations, photo_path, cv_path, statut, date_inscription FROM mentors Where statut In ('Actif', 'EN ATTENTE') ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. SUPPRIMER un mentor ()
app.delete('/api/admin/mentors/:id', (req, res) => {
    const mentorId = req.params.id;
    
    // Au lieu de supprimer, on désactive
    const sql = "UPDATE mentors SET statut = 'archivé' WHERE id = ?";

    db.query(sql, [mentorId], (err, result) => {
        if (err) return res.status(500).json({ error: "Erreur lors de l'archivage" });
        res.json({ message: "Le mentor a été archivé avec succès !" });
    });
});

//function pour envoyer le mail au mentor apres décision sur sa candidature
function envoyerMailDecisionMentor(email_contact, nom_complet, nouveauStatut) {
    const estValide = nouveauStatut === 'ACTIF' || nouveauStatut === 'VALIDER' || nouveauStatut === 'APPROUVER';

    return transporter.sendMail({
        from: '"SPE Congo" <ritakngot3@gmail.com>',
        to: email_contact,
        subject: estValide
            ? ' Votre candidature de Mentor a été approuvée - SPE Congo'
            : ' Information concernant votre candidature - SPE Congo',
        html: templateMail({
            emoji: estValide ? '' : '',
            titre: estValide ? 'Candidature approuvée !' : 'Concernant votre candidature',
            sousTitre: 'SikaHub · Programme de Mentorat SPE Congo',
            contenu: `
                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">
                    Bonjour <strong>${nom_complet}</strong>,
                </p>
                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                    Nous vous contactons suite à l'examen de votre candidature au programme 
                    de mentorat de la <strong>SPE Congo Section 117</strong>.
                </p>

                ${estValide ? `
                <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                    Nous avons le plaisir de vous annoncer que votre profil a été 
                    <strong>validé</strong> par notre équipe !
                </p>
                <div style="background:#f0fdf4; border-left:4px solid #10b981;
                            padding:15px 20px; border-radius:8px; margin-top:20px;">
                    <p style="margin:0; color:#065f46; font-size:0.9rem; line-height:1.7;">
                         Vous avez désormais accès à la plateforme en tant que Mentor officiel.<br>
                         Nous reviendrons vers vous pour vous présenter votre premier mentee.
                    </p>
                </div>
                <div style="text-align:center; margin-top:25px;">
                    <a href="https://spe-congo-project.onrender.com/index.html"
                       style="display:inline-block; background:#0054a6; color:white;
                              padding:12px 30px; text-decoration:none; border-radius:8px;
                              font-weight:600; font-size:0.9rem;">
                         Accéder à mon compte
                    </a>
                </div>
                ` : `
                <div style="background:#fef2f2; border-left:4px solid #ef4444;
                            padding:15px 20px; border-radius:8px; margin-top:20px;">
                    <p style="margin:0; color:#991b1b; font-size:0.9rem; line-height:1.7;">
                        Après étude de votre dossier, nous ne pouvons malheureusement pas 
                        donner suite à votre demande pour le moment.<br><br>
                         N'hésitez pas à rester actif au sein de la section pour d'autres 
                        opportunités futures.
                    </p>
                </div>
                `}

                <p style="color:#64748b; font-size:0.85rem; margin-top:25px;">
                    Cordialement,<br>
                    <strong>L'équipe SPE Congo</strong>
                </p>
            `
        })
    });
}
//  METTRE À JOUR le statut du mentor apres validation(ou refus) de sa condidature (admin) et envoyer un mail de décision
app.put('/api/admin/mentors/:id/status', (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;

    // 1. Récupération des infos
    const sqlGet = "SELECT nom_complet, email_contact FROM mentors WHERE id = ?";
    
    db.query(sqlGet, [id], (err, results) => {
        // Vérification si le mentor existe et a un mail
        if (err || !results || results.length === 0) {
            return res.status(500).json({ success: false, error: "Mentor introuvable" });
        }

        const mentor = results[0];
        console.log("Données récupérées pour le mail :", mentor);// appercu des données recues
        // --- LA CORRECTION EST ICI ---
        // On vérifie que email_contact n'est pas nul
        const destinataire = mentor.email_contact; 
        const nom = mentor.nom_complet;

        // 2. Mise à jour du statut
        const sqlUpdate = "UPDATE mentors SET statut = ? WHERE id = ?";
        db.query(sqlUpdate, [statut, id], (errUpdate) => {
            if (errUpdate) return res.status(500).json({ success: false });

            // 3. Envoi du mail seulement si on a une adresse
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


//mettre à jour le statut du mentee quand il a terminer sa formation
app.put('/api/admin/mentees/:id/statut', (req, res) => {
    const { statut } = req.body;
    db.query("UPDATE mentees SET statut = ? WHERE id = ?", [statut, req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

app.get('/api/admin/relationships', (req, res) => {
    // Cette requête récupère les noms ET les chemins des photos
    const sql = `
        SELECT 
            r.id AS relation_id,
            r.date_debut,
            m.nom_complet AS mentor_nom,
            m.photo_path AS mentor_photo,
            mt.nom_complet AS mentee_nom,
            mt.photo_path AS mentee_photo,
            (SELECT COUNT(*) FROM objectifs WHERE relationship_id = r.id) AS total_obj,
            (SELECT COUNT(*) FROM objectifs WHERE relationship_id = r.id AND statut = 'termine') AS obj_faits
        FROM relationships r
        JOIN mentors m ON r.mentor_id = m.id
        JOIN mentees mt ON r.mentee_id = mt.id
        ORDER BY r.date_debut DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erreur SQL binômes:", err);
            return res.status(500).json([]);
        }
        res.json(results);
    });
});

// --- ROUTE POUR SUPPRIMER UN BINÔME (ADMIN) ---
app.delete('/api/admin/relationships/:id', (req, res) => {
    const relId = req.params.id;
    console.log(" Demande de rupture du binôme ID :", relId);

    // SQL pour supprimer la relation
    const sql = "DELETE FROM relationships WHERE id = ?";
    
    db.query(sql, [relId], (err, result) => {
        if (err) {
            console.error("❌ Erreur SQL suppression binôme :", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        console.log("✅ Binôme supprimé ! Lignes affectées :", result.affectedRows);
        res.json({ success: true });
    });
});

// Route POST pour les News
app.post('/api/news', uploadNews, (req, res) => {
    const { titre, contenu, categorie } = req.body;
    const image_name = req.files['image_file'] ? req.files['image_file'][0].filename : 'default_news.jpg';
    const flyer_path = req.files['flyer_file'] ? req.files['flyer_file'][0].filename : null;

    const sql = "INSERT INTO news (titre, contenu, image_path, categorie, flyer_path) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [titre, contenu, image_name, categorie || 'News', flyer_path], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(200).json({ message: "News publiée !", id: result.insertId });
    });
});

// Route pour supprimer une news 
app.delete('/api/news/:id', (req, res) => {
    const id = req.params.id;
    const sql = "DELETE FROM news WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Erreur serveur");
        }
        res.send("News supprimée !");
    });
});

//route pour modifier les news
app.put('/api/news/:id', uploadNews, (req, res) => {
    const id = req.params.id;
    const { titre, contenu, categorie } = req.body;

    const image_name = req.files['image_file'] ? req.files['image_file'][0].filename : null;
    const flyer_path = req.files['flyer_file'] ? req.files['flyer_file'][0].filename : null;

    let setClauses = ['titre = ?', 'contenu = ?', 'categorie = ?'];
    let params = [titre, contenu, categorie];

    if (image_name) { setClauses.push('image_path = ?'); params.push(image_name); }
    if (flyer_path) { setClauses.push('flyer_path = ?'); params.push(flyer_path); }

    params.push(id);
    const sql = `UPDATE news SET ${setClauses.join(', ')} WHERE id = ?`;

    db.query(sql, params, (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Mise à jour réussie" });
    });
});

// Route pour modifier un événement existant (admin)
app.put('/api/events/:id', (req, res) => {
    const id = req.params.id;
    const { titre, date_evenement, lieu, description } = req.body;

    // On met à jour toutes les colonnes de l'événement correspondant à l'ID
    const sql = "UPDATE events SET titre = ?, date_evenement = ?, lieu = ?, description = ? WHERE id = ?";
    
   db.query(sql, [titre, date_evenement, lieu, description, id], (err, result) => {
     if (err) {
        console.error("Erreur SQL :", err);
        return res.status(500).json({ error: "Erreur lors de la modification de l'événement" });
     }

     if (result.affectedRows === 0) { 
        return res.status(404).json({ message: "Événement non trouvé" });
     }

     res.status(200).json({ message: "Événement mis à jour avec succès !" });
    });

});

//route pour les mails des objectifs atteinds par les binômes
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

                // ── Contenu selon le type ──
                const estTous = type === 'tous_objectifs';

                const htmlMail = templateMail({
                    emoji: estTous ? '' : '',
                    titre: estTous ? 'Mission accomplie !' : 'Objectif atteint !',
                    sousTitre: 'Programme de Mentorat SPE Congo',
                    contenu: `
                        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7;">
                            Bonjour <strong>${infoMentee.nom_complet}</strong>,
                        </p>
                        <p style="color:#1e293b; font-size:0.95rem; line-height:1.7; margin-top:10px;">
                            ${estTous
                                ? `Félicitations ! Vous avez atteint <strong>100% de vos objectifs</strong> de mentorat. Toute l'équique SPE Congo vous félicite pour ce parcours !.`
                                : `L'objectif <strong>"${titre}"</strong> a été validé avec succès dans votre parcours de mentorat !`
                            }
                        </p>
                        <div style="background:${estTous ? '#f0fdf4' : '#f0f9ff'}; 
                                    border-left:4px solid ${estTous ? '#10b981' : '#0054a6'}; 
                                    padding:15px 20px; border-radius:8px; margin-top:20px;">
                            <p style="margin:0; color:${estTous ? '#065f46' : '#0054a6'}; font-size:0.9rem;">
                                ${estTous ? ' Bravo au binôme !' : 'Continuez sur cette lancée !'}
                            </p>
                        </div>
                        <p style="color:#94a3b8; font-size:0.82rem; margin-top:25px;">
                           Votre Mentor : <strong>${infoMentor.nom_complet}</strong>
                        </p>
                    `
                });

                const mailOptions = {
                    from: '"SPE Congo" <ritakngot3@gmail.com>',
                    to: infoMentee.email,
                    cc: infoMentor.email_contact,
                    subject: estTous ? 'Tous vos objectifs sont atteints !' : `Objectif atteint : ${titre}`,
                    html: htmlMail
                };

                transporter.sendMail(mailOptions, (error) => {
                    if (error) {
                        console.error("Erreur Nodemailer:", error);
                        return res.status(500).json({ success: false });
                    }
                    res.json({ success: true, message: "Email envoyé avec succès !" });
                });
            });
        });
    });
});

//===Partie du bord du mentee===//
// Route 1 : Récupérer le profil du mentee
 app.get('/api/mentee/profil', (req, res) => {
    const { userId } = req.query;
    db.query("SELECT * FROM mentees WHERE user_id = ?", [userId], (err, results) => {
        if (err || results.length === 0) return res.status(404).json(null);
        res.json(results[0]);
    });
});

//route de la relation du mentee avec son mentor
 app.get('/api/mentee/relations', (req, res) => {
    const { userId } = req.query;
    const sql = `
        SELECT 
            r.id, r.statut,
            men.nom_complet AS mentor_nom,
            men.poste_entreprise AS mentor_poste,
            men.domaine_expertise AS mentor_expertise,
            men.email_contact AS mentor_email,
            men.photo_path AS mentor_photo
        FROM relationships r
        JOIN mentees me ON r.mentee_id = me.id
        JOIN mentors men ON r.mentor_id = men.id
        WHERE me.user_id = ?`;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json([]);

results = results.map(r => ({
    ...r,
    mentor_photo: r.mentor_photo 
        ? r.mentor_photo.replace(/\\/g, '/') 
        : null
}));

        res.json(results);
    });
});


//recuperer les détails des news publiées
 app.get('/api/news/:id', (req, res) => {
    const { id } = req.params;
    db.query("SELECT * FROM news WHERE id = ?", [id], (err, results) => {
        if (err || results.length === 0) return res.status(404).json(null);
        res.json(results);
    });
});

//route pour poster une image de la galere depuis le board de l'admin
app.post('/api/upload-galerie', uploadGalerie.single('photo'), (req, res) => {
    // Vérifie si le fichier est bien arrivé
    if (!req.file) {
        return res.status(400).json({ success: false, message: "Aucun fichier reçu" });
    }

    const { titre, description } = req.body;
    const imagePath = req.file.filename;

    const sql = "INSERT INTO galerie (titre, description, image_path) VALUES (?, ?, ?)";
    db.query(sql, [titre, description, imagePath], (err, result) => {
        if (err) {
            console.error("Erreur SQL :", err);
            return res.status(500).send(err.message); // En cas d'erreur SQL
        }
        res.json({ success: true });
    });
});

//route pour afficher les images sur le site public
// Route publique (page galerie visiteurs)
app.get('/api/galerie', (req, res) => {
    const sql = "SELECT * FROM galerie ORDER BY date_ajout DESC LIMIT 10";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// Route admin (toutes les photos sans limite)
app.get('/api/admin/galerie', (req, res) => {
    const sql = "SELECT * FROM galerie ORDER BY date_ajout DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erreur SQL galerie:", err);
            return res.status(500).json({ error: "Erreur récupération galerie" });
        }
        console.log("Photos galerie admin:", results.length);
        res.json(results);
    });
});

// Route pour SUPPRIMER une photo
app.delete('/api/galerie/:id', (req, res) => {
    const photoId = req.params.id;
    console.log("--- TENTATIVE DE SUPPRESSION ---");
    console.log("ID cible :", photoId);

    // 1. On récupère d'abord les infos
    db.query("SELECT * FROM galerie WHERE id = ?", [photoId], (err, results) => {
        if (err || results.length === 0) {
            console.log("❌ Photo introuvable dans la base.");
            return res.status(404).json({ success: false });
        }

        // On récupère le nom exact
        const fileName = results.image_path;
        console.log("Nom du fichier à supprimer :", fileName);

        // 2. On supprime d'abord de la base de données
        db.query("DELETE FROM galerie WHERE id = ?", [photoId], (err) => {
            if (err) return res.status(500).json({ success: false });

            // 3. On tente la suppression du fichier si le nom existe
            if (fileName) {
                const filePath = path.join(__dirname, '..', 'images', 'galerie', fileName);
                
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                        console.log("✅ Fichier supprimé du dossier avec succès !");
                    } catch (e) {
                        console.log("❌ Erreur lors de l'effacement physique :", e.message);
                    }
                } else {
                    console.log("⚠️ Le fichier n'existe pas dans le dossier galerie.");
                }
            }

            res.json({ success: true });
        });
    });
});

// Route pour récupérer la liste des membres (pour la messagerie)
app.get('/api/utilisateurs', (req, res) => {
    // On sélectionne l'id, le nom et l'email
    const sql = "SELECT id, username, email FROM users ORDER BY username ASC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erreur lors de la récupération des utilisateurs:", err);
            return res.status(500).json({ error: "Erreur base de données" });
        }
        res.json(results); // Envoie la liste au format JSON
    });
});

//envoyer les mails aux membres
app.post('/api/broadcast', (req, res) => {
    const { sujet, message, emails } = req.body;

    if (!emails || emails.length === 0) {
        return res.status(400).json({ success: false, message: "Aucun destinataire" });
    }

    // On prépare le contenu HTML en insérant le message de l'admin
    // On transforme les sauts de ligne en balises <br> pour le HTML
    const messageHtml = message.replace(/\n/g, '<br>');

    // On génère le HTML final en appelant ta fonction
    const finalHtml = templateMail({
        emoji: "", 
        titre: sujet, 
        sousTitre: "Annonce officielle de la Section 117",
        contenu: `<div style="color:#334155; line-height:1.6; font-size:1rem;">${messageHtml}</div>`
    });

    const mailOptions = {
        from: '"SPE Congo Section" <ton-email@gmail.com>',
        to: emails.join(', '),
        subject: sujet,
        html: finalHtml
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Erreur envoi:", error);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

//===fin===//

// Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});