const mysql = require('mysql2');

const connection = mysql.createPool({
   host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    connectTimeout: 20000,
    ssl: {
        rejectUnauthorized: false
    }
});


connection.getConnection((err, conn) => {
    if (err) {
        console.error('Erreur de connexion à la base de données : ' + err.message);
        return;
    }
    console.log('Connecté à la base de données MySQL !');
    conn.release(); 
});

module.exports = connection;