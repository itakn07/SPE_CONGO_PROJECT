require('dotenv').config({ path: 'C:\\Users\\LOUNDA\\Desktop\\Rita\'s_project\\SPE_CONGO\\Backend\\.env' });

const cloudinary = require('cloudinary').v2;
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Config MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

const PHOTOS_DIR = 'C:\\Users\\LOUNDA\\Desktop\\Rita\'s_project\\SPE_CONGO\\images\\members';

async function uploadAll() {
  const files = fs.readdirSync(PHOTOS_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  for (const file of files) {
    const filePath = path.join(PHOTOS_DIR, file);
    const fileName = file; // ex: Bovarin.jpg

    try {
      // Upload sur Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'spe_congo/members'
      });

      console.log(`✅ ${fileName} → ${result.secure_url}`);

      // Mise à jour DB
      db.query(
        "UPDATE members SET photo_name = ? WHERE photo_name = ?",
        [result.secure_url, fileName],
        (err) => {
          if (err) console.error(`❌ DB error pour ${fileName}:`, err.message);
          else console.log(`✅ DB mis à jour pour ${fileName}`);
        }
      );

    } catch (err) {
      console.error(`❌ Upload échoué pour ${fileName}:`, err.message);
    }
  }

  setTimeout(() => db.end(), 5000);
}

uploadAll();