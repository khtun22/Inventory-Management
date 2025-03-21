-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: inventory_management
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `adjustment`
--
use inventory_management;

DROP TABLE IF EXISTS `adjustment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adjustment` (
  `adjustmentid` int NOT NULL AUTO_INCREMENT,
  `reason` varchar(225) NOT NULL,
  `adjustdate` datetime NOT NULL,
  `description` varchar(225) DEFAULT NULL,
  `adjtotalqty` int NOT NULL,
  `userid` int DEFAULT NULL,
  PRIMARY KEY (`adjustmentid`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adjustment`
--

LOCK TABLES `adjustment` WRITE;
/*!40000 ALTER TABLE `adjustment` DISABLE KEYS */;
INSERT INTO `adjustment` VALUES (1,'maintenance','2025-02-21 17:26:52','11',1000,11),(2,'maintenance','2025-02-21 17:35:26','',1000,11),(3,'maintenance','2025-02-21 17:37:03','',10000,11),(4,'maintenance','2025-02-21 17:37:18','',1000,11),(5,'maintenance','2025-03-11 16:05:20','',1,11),(6,'restocked','2025-03-11 16:06:47','',2,11);
/*!40000 ALTER TABLE `adjustment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `adjustment_detail`
--

DROP TABLE IF EXISTS `adjustment_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adjustment_detail` (
  `adjustmentid` int NOT NULL,
  `itemid` int NOT NULL,
  `adjustqty` int NOT NULL,
  PRIMARY KEY (`adjustmentid`),
  CONSTRAINT `adjustment_detail_ibfk_1` FOREIGN KEY (`adjustmentid`) REFERENCES `adjustment` (`adjustmentid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adjustment_detail`
--

LOCK TABLES `adjustment_detail` WRITE;
/*!40000 ALTER TABLE `adjustment_detail` DISABLE KEYS */;
INSERT INTO `adjustment_detail` VALUES (1,1,1000),(2,1,1000),(3,1,10000),(4,1,1000),(5,3,1),(6,3,2);
/*!40000 ALTER TABLE `adjustment_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `categoryid` int NOT NULL AUTO_INCREMENT,
  `categoryname` varchar(225) NOT NULL,
  `storeid` int NOT NULL,
  PRIMARY KEY (`categoryid`),
  KEY `storeid` (`storeid`),
  CONSTRAINT `category_ibfk_1` FOREIGN KEY (`storeid`) REFERENCES `store` (`storeid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (12,'ss',30),(13,'ssd',30),(14,'ssdf',30),(15,'sdfsd',30),(16,'asdasd',31),(17,'asdas',31),(18,'location 1',32),(19,'dsafasdf',32),(20,'dsafasdfsadf',32),(21,'sfds',33),(22,'sdfasd',33),(23,'sdfasdf',33),(24,'sdf',32),(25,'category 1',32),(26,'sadfsa',34);
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `itemid` int NOT NULL,
  `itemname` varchar(225) NOT NULL,
  `itemqty` int NOT NULL,
  `alertqty` int DEFAULT '0',
  `alertcon` varchar(225) DEFAULT NULL,
  `expdate` varchar(20) DEFAULT NULL,
  `alertdate` int DEFAULT NULL,
  `categoryid` int NOT NULL,
  PRIMARY KEY (`itemid`),
  KEY `item_ibfk_1` (`categoryid`),
  CONSTRAINT `item_ibfk_1` FOREIGN KEY (`categoryid`) REFERENCES `category` (`categoryid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
INSERT INTO `item` VALUES (1,'sdf1',1000,NULL,'',NULL,NULL,18),(2,'sdfsdf',98,NULL,'','2025-02-27',NULL,18),(3,'sdfsdf',2,NULL,NULL,'2025-02-27',NULL,25),(4,'sdfsdf',0,NULL,NULL,'2025-02-27',NULL,12),(5,'sdfsdf',0,NULL,'',NULL,NULL,18),(6,'sdfsdf',1,NULL,NULL,NULL,NULL,25),(7,'sdfsdf',0,NULL,NULL,NULL,NULL,12),(8,'sdfsdf',1,NULL,NULL,'2025-02-27',NULL,16),(9,'a111',1111,0,'',NULL,NULL,18),(10,'sdf',20,2,'gt',NULL,NULL,16),(11,'srtfjk',77,NULL,'','2025-02-28',NULL,18),(12,'qwerrt',11,1,'',NULL,NULL,18),(13,'gtads',100,10,'gte',NULL,NULL,25),(14,'itme sdkfs',1122,112,'gt',NULL,NULL,23),(15,'zzzz',111,1,'gt',NULL,NULL,26),(16,'qwqr',911,1000,'','2025-02-04',NULL,26),(17,'test',11,1,NULL,NULL,NULL,18),(18,'test',100,0,NULL,'null',NULL,26);
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userid` int NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userid` (`userid`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `user` (`userid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,11,'You have 13 stock alerts.',1,'2025-03-05 11:40:50'),(2,11,'You have 13 stock alerts.',1,'2025-03-05 12:48:19'),(3,11,'You have 14 stock alerts.',1,'2025-03-12 10:11:53');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `store`
--

DROP TABLE IF EXISTS `store`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `store` (
  `storeid` int NOT NULL AUTO_INCREMENT,
  `storename` varchar(225) NOT NULL,
  `userid` int NOT NULL,
  PRIMARY KEY (`storeid`),
  KEY `userid` (`userid`),
  CONSTRAINT `store_ibfk_1` FOREIGN KEY (`userid`) REFERENCES `user` (`userid`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `store`
--

LOCK TABLES `store` WRITE;
/*!40000 ALTER TABLE `store` DISABLE KEYS */;
INSERT INTO `store` VALUES (30,'ssdfss',11),(31,'sdff',11),(32,'store name 1',11),(33,'sdfsdf',11),(34,'aaa',11);
/*!40000 ALTER TABLE `store` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction`
--

DROP TABLE IF EXISTS `transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction` (
  `transactionid` int NOT NULL,
  `sourceid` int DEFAULT NULL,
  `targetid` int DEFAULT NULL,
  `trandate` datetime NOT NULL,
  `tranname` varchar(225) NOT NULL,
  `trantotalqty` int NOT NULL,
  `userid` int DEFAULT NULL,
  PRIMARY KEY (`transactionid`),
  KEY `transaction_ibfk_2` (`sourceid`),
  KEY `transaction_ibfk_3` (`targetid`),
  CONSTRAINT `transaction_ibfk_2` FOREIGN KEY (`sourceid`) REFERENCES `category` (`categoryid`) ON DELETE CASCADE,
  CONSTRAINT `transaction_ibfk_3` FOREIGN KEY (`targetid`) REFERENCES `category` (`categoryid`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction`
--

LOCK TABLES `transaction` WRITE;
/*!40000 ALTER TABLE `transaction` DISABLE KEYS */;
INSERT INTO `transaction` VALUES (1,NULL,NULL,'2025-02-13 14:48:47','IN',1333,11),(2,NULL,NULL,'2025-02-13 14:52:44','OUT',233,11),(3,18,25,'2025-02-13 14:55:57','TRAN',1,11),(4,25,12,'2025-02-13 15:02:17','TRAN',1,11),(5,12,25,'2025-02-13 15:02:51','TRAN',1,11),(6,NULL,NULL,'2025-02-13 15:03:32','IN',1,11),(7,NULL,NULL,'2025-02-13 15:03:55','IN',1,11),(8,18,25,'2025-02-13 15:04:20','TRAN',1,11),(9,25,12,'2025-02-13 15:04:55','TRAN',1,11),(10,12,25,'2025-02-13 15:05:44','TRAN',1,11),(11,18,25,'2025-02-17 05:39:59','TRAN',1,11),(12,18,16,'2025-02-17 05:40:31','TRAN',1,11),(13,NULL,NULL,'2025-02-18 08:04:54','IN',1111,11),(14,NULL,NULL,'2025-02-22 09:27:50','IN',20,11),(15,NULL,NULL,'2025-02-23 05:22:44','IN',77,11),(16,NULL,NULL,'2025-02-23 05:55:08','IN',11,11),(17,NULL,NULL,'2025-02-23 06:11:26','IN',100,11),(18,NULL,NULL,'2025-02-23 06:12:00','IN',1122,11),(19,NULL,NULL,'2025-02-23 06:19:34','IN',111,11),(20,NULL,NULL,'2025-02-23 06:26:55','IN',1111,11),(21,NULL,NULL,'2025-02-23 06:34:24','IN',111,11),(22,NULL,NULL,'2025-02-23 09:15:20','OUT',200,11),(23,18,26,'2025-02-23 10:21:07','TRAN',100,11);
/*!40000 ALTER TABLE `transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_detail`
--

DROP TABLE IF EXISTS `transaction_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction_detail` (
  `transactionid` int NOT NULL,
  `tranqty` int NOT NULL,
  `itemid` int NOT NULL,
  `titemid` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_detail`
--

LOCK TABLES `transaction_detail` WRITE;
/*!40000 ALTER TABLE `transaction_detail` DISABLE KEYS */;
INSERT INTO `transaction_detail` VALUES (1,1222,1,NULL),(1,111,2,NULL),(2,222,1,NULL),(2,11,2,NULL),(3,1,2,NULL),(4,1,3,NULL),(5,1,4,NULL),(6,1,2,NULL),(7,1,5,NULL),(8,1,5,NULL),(9,1,6,NULL),(10,1,7,NULL),(11,1,2,3),(12,1,2,8),(13,1111,9,NULL),(14,20,10,NULL),(15,77,11,NULL),(16,11,12,NULL),(17,100,13,NULL),(18,1122,14,NULL),(19,111,15,NULL),(20,1111,16,NULL),(21,111,17,NULL),(22,200,16,NULL),(23,100,17,18);
/*!40000 ALTER TABLE `transaction_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `userid` int NOT NULL AUTO_INCREMENT,
  `username` varchar(225) NOT NULL,
  `password` varchar(225) NOT NULL,
  `email` varchar(225) NOT NULL,
  `phoneno` varchar(15) DEFAULT NULL,
  `alerttime` time DEFAULT NULL,
  `notiread` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`userid`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (10,'aaa','aaaaaaaa','a@gmail.com','123456789',NULL,0),(11,'admin','admin222','admin@gmail.com','123213','18:11:00',0),(12,'admin1','admin222','admin1@gmail.com','6565656565',NULL,0),(13,'admin2323','12345678','admin2222@gmail.com','12312564654','12:00:00',0);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-03-13 18:36:40
