CREATE DATABASE  IF NOT EXISTS "defaultdb" /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `defaultdb`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: mysql-6d72768-ritakngot3.i.aivencloud.com    Database: defaultdb
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '7f1eedab-40aa-11f1-babe-7a56ef41bfe7:1-85,
fa98a687-3f30-11f1-98e5-d608561d8da0:1-55';

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `news` (
  `id` int NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `contenu` text NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `date_publication` datetime DEFAULT CURRENT_TIMESTAMP,
  `statut` enum('BROUILLON','PUBLIE') DEFAULT 'PUBLIE',
  `categorie` varchar(50) DEFAULT 'News',
  `flyer_path` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
INSERT INTO `news` VALUES (1,'Retour sur l\'Atelier Technique \"Transition Énergétique et Optimisation de la Production au Congo','Un carrefour d\'innovation pour l\'industrie pétrolière congolaise\r\nLa section SPE Congo a tenu avec succès son atelier technique mensuel ce jeudi, réunissant plus de 120 professionnels, ingénieurs et étudiants au cœur de la capitale économique. Au programme : comment concilier l’exploitation des ressources matures avec les nouveaux impératifs de décarbonation.\r\n\r\nLes points forts de la rencontre\r\n\r\nL\'événement a été marqué par trois interventions majeures qui ont suscité des débats passionnés :\r\n• L\'Intelligence Artificielle en amont (Upstream) : Présentation des nouveaux algorithmes de maintenance prédictive pour réduire les temps d\'arrêt sur les plateformes offshore.\r\n• Valorisation du Gaz : Un focus sur les projets de réduction du torchage (Zero Flaring) et la transformation locale du gaz pour l\'électricité.\r\n• Développement des Jeunes Professionnels (YP) : Un panel dédié au transfert de compétences entre les vétérans de l\'industrie et la nouvelle génération d\'ingénieurs congolais.\r\n\r\nL\'innovation est notre moteur\r\n\r\nLe bassin du Congo possède un potentiel immense, mais notre défi est d\'extraire de manière plus propre et plus intelligente. La SPE Congo est là pour garantir que nos membres disposent des outils technologiques les plus récents pour relever ce défi. \r\n\r\n— Le Président de la Section SPE Congo.','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777662437/spe_congo/news/1777662435949-IMG_4438.png','2026-05-01 19:07:18','PUBLIE','News','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777662437/spe_congo/news/1777662436945-IMG_4439.png'),(2,'Transformation Numérique et Contenu Local : L\'avenir de l\'Industrie Pétrolière au Congo','Dans un marché énergétique en pleine mutation, l\'optimisation des ressources du bassin congolais repose désormais sur deux piliers : l\'adoption de technologies de pointe et la montée en compétence des cadres locaux. Cette conférence, organisée par la SPE Congo, explore comment le \"Digital Oilfield\" et le renforcement du contenu local transforment notre industrie.\r\n\r\n Programme de la conférence \r\n\r\n• Session 1 : Digitalisation & Efficacité Opérationnelle\r\n\r\n• L’apport de l’Internet des Objets (IoT) et de la Data Science dans l\'exploitation des champs matures.\r\n• Étude de cas : Maintenance prédictive sur les installations offshore du Terminal de Djeno.\r\n\r\n• Session 2 : Le Contenu Local comme moteur de croissance\r\n\r\n• Nouvelles réglementations et opportunités pour les entreprises de services congolaises.\r\n• Partenariat public-privé : Accélérer le transfert de technologie entre les majors et les PME locales.\r\n\r\n• Session 3 : Table Ronde des Leaders de Demain\r\n\r\n• Discussion interactive entre les mentors de l\'industrie et les étudiants en ingénierie sur les métiers de demain.\r\nIntervenants Confirmés\r\n• Représentants du Ministère des Hydrocarbures.\r\n• Directeurs Techniques des principaux opérateurs (TotalEnergies, Eni, Perenco).\r\n• Experts en Data Analysis et Cybersécurité industrielle.\r\n\r\nModalités d\'Inscription\r\n\r\n• Membres SPE : Accès gratuit sur présentation de la carte de membre.\r\n• Étudiants : Tarif réduit (Inscription obligatoire via le portail universitaire).\r\n• Professionnels non-membres : Inscription disponible en ligne jusqu\'au 20 mai.','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777663446/spe_congo/news/1777663444766-IMG_4440.png','2026-05-01 19:24:07','PUBLIE','Conference','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777663447/spe_congo/news/1777663446498-IMG_4441.png');
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-14 14:32:32
