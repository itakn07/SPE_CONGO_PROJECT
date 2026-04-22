CREATE DATABASE  IF NOT EXISTS `spe_congo_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `spe_congo_db`;
-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: spe_congo_db
-- ------------------------------------------------------
-- Server version	9.6.0

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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '3fad1f67-041c-11f1-b373-2c58b9118e64:1-182';

--
-- Table structure for table `mentors`
--

DROP TABLE IF EXISTS `mentors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom_complet` varchar(100) NOT NULL,
  `poste_entreprise` varchar(255) NOT NULL,
  `domaine_expertise` varchar(255) NOT NULL,
  `email_contact` varchar(150) NOT NULL,
  `motivations` text,
  `photo_path` varchar(255) DEFAULT NULL,
  `cv_path` varchar(255) DEFAULT NULL,
  `date_inscription` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` varchar(255) DEFAULT 'en_attente',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentors`
--

LOCK TABLES `mentors` WRITE;
/*!40000 ALTER TABLE `mentors` DISABLE KEYS */;
INSERT INTO `mentors` VALUES (1,'Rita KN','Ingénieure informatique','Informatique','ritakngot3@gmail.com','j\'aime partager mes connaissances','uploads\\1773147715858-Capture d\'Ã©cran 2026-03-04 115022.png','uploads\\1773147715863-CV_Rita_KNGOT.pdf','2026-03-10 13:01:55','actif'),(3,'Ita KN','Ingénieure informatique','Informatique','ritakngot3@gmail.com','azerty','uploads\\1773153050871-Capture d\'Ã©cran 2026-03-04 115325.png','uploads\\1773153050875-CV_Rita_KNGOT.pdf','2026-03-10 14:30:50','ACTIF'),(4,'Ita KN','Ingénieure informatique','Informatique','ritakngot07@gmail.com','azertyu',NULL,NULL,'2026-03-10 14:55:01','ACTIF'),(5,'Ita KN','Ingénieure informatique','Informatique','ritakngot07@gmail.com','azer',NULL,NULL,'2026-03-10 15:01:31','ACTIF'),(6,'Céleste KN','Ingénieure informatique','Informatique','ritakngot07@gmail.com','Envie de partager le savoir','uploads\\1773227351313-Capture d\'Ã©cran 2026-03-04 131619.png','uploads\\1773227351315-CV_Rita_KNGOT.pdf','2026-03-11 11:09:11','ACTIF'),(7,'Céleste ','Ingénieure informatique','Informatique','ritakngot07@gmail.com','azertyu','uploads\\1773239916637-Capture d\'Ã©cran 2026-03-04 131619.png','uploads\\1773239916641-CV_Rita_KNGOT.pdf','2026-03-11 14:38:36','ACTIF'),(8,'Céleste RK','Ingénieure informatique','Informatique','ritakngot07@gmail.com','azertyu','uploads\\1773240729150-plateforme.jpg','uploads\\1773240729151-CV_Rita_KNGOT.pdf','2026-03-11 14:52:09','ACTIF'),(9,'Céleste RK','Ingénieure informatique','Informatique','ritakngot07@gmail.com','azerty','uploads\\1773240851256-Capture d\'Ã©cran 2026-03-04 131619.png','uploads\\1773240851257-CV_Rita_KNGOT.pdf','2026-03-11 14:54:11','REFUSE'),(10,'Céleste RK','Ingénieure informatique','Informatique','ritakngot07@gmail.com','',NULL,NULL,'2026-03-11 17:14:08','ACTIF');
/*!40000 ALTER TABLE `mentors` ENABLE KEYS */;
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

-- Dump completed on 2026-03-11 18:20:37
