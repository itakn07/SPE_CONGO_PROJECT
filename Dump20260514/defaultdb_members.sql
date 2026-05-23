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
-- Table structure for table `members`
--

DROP TABLE IF EXISTS `members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(255) NOT NULL,
  `poste` varchar(255) NOT NULL,
  `photo_name` varchar(255) DEFAULT 'default.jpg',
  `email` varchar(255) DEFAULT NULL,
  `linkedin_url` varchar(255) DEFAULT NULL,
  `priorite` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `members`
--

LOCK TABLES `members` WRITE;
/*!40000 ALTER TABLE `members` DISABLE KEYS */;
INSERT INTO `members` VALUES (1,'Yannick MOUAMBA','Section Chair','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730797/spe_congo/members/igds4mmwohmv9ni98yw4.jpg',' https://www.linkedin.com/in/yannickmouamba?utm_source=share_via&utm_content=profile&utm_medium=member_android\n','https://www.linkedin.com/in/yannickmouamba?utm_source=share_via&utm_content=profile&utm_medium=member_android\n',1),(2,'Jamilla MASSAMBA','Program chair','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730794/spe_congo/members/lvnrdcrxwespryu6ilx4.jpg',' https://www.linkedin.com/in/jamilla-massamba-a0498a77?utm_source=share_via&utm_content=profile&utm_medium=member_android\n',' https://www.linkedin.com/in/jamilla-massamba-a0498a77?utm_source=share_via&utm_content=profile&utm_medium=member_android\n',2),(3,' Dorine TECKMASSI','Secretary','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730792/spe_congo/members/jwpj9cxfysbagrl8smjx.jpg',NULL,' https://www.linkedin.com/in/dorine-lowe-teck-massy-0b4a841a7?utm_source=share_via&utm_content=profile&utm_medium=member_android\n',3),(4,'Larissa OMAMBI','Secretary','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730795/spe_congo/members/itpud0egebqyd75x7ysf.jpg',NULL,'https://www.linkedin.com/in/larissa-florène-omambi-5654b0123?utm_source=share_via&utm_content=profile&utm_medium=member_android',4),(5,'Maryse TCHITEMBO','Treasurer','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730796/spe_congo/members/gdyk3mv8lnjhutdzqtzt.jpg',NULL,' https://www.linkedin.com/in/aubaine-maryse-tania-tchitembo-215a46a6?utm_source=share_via&utm_content=profile&utm_medium=member_android\n',5),(6,'Bovarin BOUKEDY','Communication and Young professional chair ','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730789/spe_congo/members/r1g9wi4v7vm3b3vpmqx9.jpg',NULL,'https://www.linkedin.com/in/bovarin-boukedy-3077a95a?utm_source=share_via&utm_content=profile&utm_medium=member_android',6),(7,'Dieuveil GNAMONIKA BOKOLO','Assistant communication and Design officier','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730791/spe_congo/members/tlucz7klf4ds295be064.jpg','Dieuveilgnamonika@gmail.com','https://www.linkedin.com/in/dieuveil-gnamonika-bokolo-pmp®-684686210',7),(8,'Brice PAMBOU','Student\'s chapters responsible ','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730790/spe_congo/members/l2irassczlxlujdmvq6u.jpg',NULL,NULL,8),(9,'Edwin NKENDA','Student\'s chapters Responsible assistant','default.jpg',NULL,NULL,9),(10,'Gil Prince KOMBO','Membership chair','https://res.cloudinary.com/dkzkye7zw/image/upload/v1777730793/spe_congo/members/smfrquv3taaymgi1oylb.jpg',NULL,NULL,10);
/*!40000 ALTER TABLE `members` ENABLE KEYS */;
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

-- Dump completed on 2026-05-14 14:33:21
