const mysql = require('mysql2');

const connection = mysql.createPool({
    host: 'mysql-6d72768-ritakngot3.i.aivencloud.com',
    user: 'avnadmin',
    password: 'AVNS_eX0cfvf6ILPvCVN2N2N',
    database: 'defaultdb',
    port: 17316,
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