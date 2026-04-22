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
-- Table structure for table `mentees`
--

DROP TABLE IF EXISTS `mentees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom_complet` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `domaine_interet` varchar(255) NOT NULL,
  `motivations` text,
  `photo_path` varchar(255) DEFAULT NULL,
  `cv_path` varchar(255) DEFAULT NULL,
  `date_inscription` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `statut` varchar(255) DEFAULT 'en_attente',
  `ecole` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mentees`
--

LOCK TABLES `mentees` WRITE;
/*!40000 ALTER TABLE `mentees` DISABLE KEYS */;
INSERT INTO `mentees` VALUES (1,'Rita KN','ritakngot07@gmail.com','azertyu','azert','Mentee_docs\\1773244229047-Capture d\'Ã©cran 2026-03-04 131619.png','Mentee_docs\\1773244229050-CV_Rita_KNGOT.pdf','2026-03-11 15:50:29','EN ATTENTE','azertyu'),(2,'Rita KN','ritakngot07@gmail.com','azertyu','',NULL,NULL,'2026-03-11 15:50:59','EN ATTENTE','azertyu'),(3,'Rita KN','ritakngot07@gmail.com','azertyu','',NULL,NULL,'2026-03-11 15:51:01','EN ATTENTE','azertyu'),(4,'Rita KN','ritakngot07@gmail.com','azertyu','azertyu','Mentee_docs\\1773244303282-Capture d\'Ã©cran 2026-03-04 131619.png','Mentee_docs\\1773244303283-CV_Rita_KNGOT.pdf','2026-03-11 15:51:43','EN ATTENTE','azertyu'),(5,'Rita KN','ritakngot07@gmail.com','azertyu','aerzy',NULL,NULL,'2026-03-11 15:52:14','EN ATTENTE','azertyu'),(6,'Rita KN','ritakngot07@gmail.com','azertyu','azerty','Mentee_docs\\1773244384266-Capture d\'Ã©cran 2026-03-04 115022.png',NULL,'2026-03-11 15:53:04','EN ATTENTE','azertyu'),(7,'Rita KN','ritakngot07@gmail.com','azertyu','',NULL,'Mentee_docs\\1773244399827-CV_Rita_KNGOT.pdf','2026-03-11 15:53:19','EN ATTENTE','azertyu'),(8,'Rita KN','ritakngot07@gmail.com','azertyu','','Mentee_docs\\1773244627365-Capture d\'Ã©cran 2026-03-04 131619.png','Mentee_docs\\1773244627366-CV_Rita_KNGOT.pdf','2026-03-11 15:57:07','EN ATTENTE','azertyu'),(9,'Rita KN','ritakngot07@gmail.com','azertyu','','Mentee_docs\\1773244893457-Capture d\'Ã©cran 2026-03-04 131619.png','Mentee_docs\\1773244893460-CV_Rita_KNGOT.pdf','2026-03-11 16:01:33','EN ATTENTE','azertyu'),(10,'Rita KN','ritakngot07@gmail.com','azertyu','azertyuiop','Mentee_docs\\1773245888910-Capture d\'Ã©cran 2026-03-04 115022.png','Mentee_docs\\1773245888926-CV_Rita_KNGOT.pdf','2026-03-11 16:18:08','EN ATTENTE','ucac'),(11,'Rita KN','ritakngot07@gmail.com','azertyu','',NULL,NULL,'2026-03-11 16:26:05','EN ATTENTE','ucac'),(12,'Rita KN','ritakngot07@gmail.com','azertyu','',NULL,NULL,'2026-03-11 17:13:39','EN ATTENTE','ucac');
/*!40000 ALTER TABLE `mentees` ENABLE KEYS */;
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
