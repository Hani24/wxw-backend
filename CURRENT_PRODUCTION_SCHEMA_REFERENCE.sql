
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `AccessRecoveries` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `code` varchar(255) NOT NULL,
  `maxAge` int(11) unsigned DEFAULT 0,
  `isUsed` tinyint(1) DEFAULT 0,
  `usedAt` datetime DEFAULT NULL,
  `isExpired` tinyint(1) DEFAULT 0,
  `expiredAt` datetime DEFAULT NULL,
  `isResent` tinyint(1) DEFAULT 0,
  `resentAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `AccessRecoveries_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ApiNodes` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `nuid` varchar(255) NOT NULL,
  `ip` varchar(255) DEFAULT 'n/a',
  `lastSeenAt` datetime DEFAULT NULL,
  `isLocked` tinyint(1) DEFAULT 0,
  `lockedAt` datetime DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nuid` (`nuid`)
) ENGINE=InnoDB AUTO_INCREMENT=343 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CartItems` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `cartId` bigint(8) unsigned NOT NULL,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `menuItemId` bigint(8) unsigned NOT NULL,
  `amount` int(10) unsigned NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `cartId` (`cartId`),
  KEY `restaurantId` (`restaurantId`),
  KEY `menuItemId` (`menuItemId`),
  CONSTRAINT `CartItems_ibfk_1` FOREIGN KEY (`cartId`) REFERENCES `Carts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CartItems_ibfk_2` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CartItems_ibfk_3` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1190 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Carts` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `clientId` bigint(8) unsigned NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  CONSTRAINT `Carts_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Cities` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `stateId` bigint(8) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `isEnabled` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `stateId` (`stateId`),
  CONSTRAINT `Cities_ibfk_1` FOREIGN KEY (`stateId`) REFERENCES `States` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5978 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ClientNotifications` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `clientId` bigint(8) unsigned NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `image` varchar(255) DEFAULT 'notifications.default.png',
  `data` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `type` enum('info','adminMessage','courierMessage','supplierMessage','clientMessage','supplierAcceptedOrder','supplierCanceledOrder','supplierOrderDelayed','allSuppliersHaveConfirmed','clientConfirmedOrder','clientCanceledOrder','clientRejectedOrder','clientDintGetInTouch','courierAcceptedOrder','courierCanceledOrder','courierDeliveredOrder','courierHasCollectedTheOrders','paymentSucceeded','paymentFailed','paymentActionRequired','rateOrder','orderRated','orderRefunded','orderDiscarded') DEFAULT 'info',
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  CONSTRAINT `ClientNotifications_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=840 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ClientPaymentSettings` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `clientId` bigint(8) unsigned NOT NULL,
  `type` enum('Not selected','ApplePay','GooglePay','Card') DEFAULT 'Not selected',
  `paymentCardId` bigint(8) unsigned DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  KEY `paymentCardId` (`paymentCardId`),
  CONSTRAINT `ClientPaymentSettings_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ClientPaymentSettings_ibfk_2` FOREIGN KEY (`paymentCardId`) REFERENCES `PaymentCards` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Clients` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `isRestricted` tinyint(1) DEFAULT 0,
  `verifiedAt` datetime DEFAULT NULL,
  `restrictedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `customerId` varchar(255) DEFAULT NULL,
  `totalSpend` decimal(8,2) unsigned DEFAULT 0.00,
  `totalOrders` bigint(8) unsigned DEFAULT 0,
  `totalRejectedOrders` bigint(8) unsigned DEFAULT 0,
  `totalCanceledOrders` bigint(8) unsigned DEFAULT 0,
  `totalCompletedOrders` bigint(8) unsigned DEFAULT 0,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `lon` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  `lat` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `Clients_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CourierNotifications` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `courierId` bigint(8) unsigned NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `image` varchar(255) DEFAULT 'notifications.default.png',
  `data` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `type` enum('info','adminMessage','courierMessage','supplierMessage','clientMessage','supplierCanceledOrder','supplierOrderIsReady','supplierOrderCompleted','supplierOrderDelayed','courierOrderRequest','courierAcceptedOrder','courierCanceledOrder','courierDeliveredOrder','courierEmailVerificationRequired','courierKycVerificationRequired','courierRequestApproved','courierRequestRejected','clientCanceledOrder','clientRejectedOrder','clientDintGetInTouch','clientPaidOrder','orderRated','orderDiscarded','withdrawRequestApproved','withdrawRequestRejected','withdrawRequestCompleted') DEFAULT 'info',
  PRIMARY KEY (`id`),
  KEY `courierId` (`courierId`),
  CONSTRAINT `CourierNotifications_ibfk_1` FOREIGN KEY (`courierId`) REFERENCES `Couriers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=273 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CourierOrderRequests` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `courierId` bigint(8) unsigned NOT NULL,
  `orderId` bigint(8) unsigned NOT NULL,
  `isAccepted` tinyint(1) DEFAULT 0,
  `acceptedAt` datetime DEFAULT NULL,
  `isRejected` tinyint(1) DEFAULT 0,
  `rejectedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `courierId` (`courierId`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `CourierOrderRequests_ibfk_1` FOREIGN KEY (`courierId`) REFERENCES `Couriers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `CourierOrderRequests_ibfk_2` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=126 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CourierShifts` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `courierId` bigint(8) unsigned NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isStarted` tinyint(1) DEFAULT 0,
  `startedAt` datetime DEFAULT NULL,
  `isEnded` tinyint(1) DEFAULT 0,
  `endedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `courierId` (`courierId`),
  CONSTRAINT `CourierShifts_ibfk_1` FOREIGN KEY (`courierId`) REFERENCES `Couriers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CourierWithdrawRequests` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `courierId` bigint(8) unsigned NOT NULL,
  `amount` decimal(8,2) unsigned NOT NULL DEFAULT 0.00,
  `cardHolderName` varchar(255) DEFAULT '',
  `cardNumber` varchar(255) DEFAULT '',
  `isAccepted` tinyint(1) DEFAULT 0,
  `acceptedAt` datetime DEFAULT NULL,
  `isRejected` tinyint(1) DEFAULT 0,
  `rejectedAt` datetime DEFAULT NULL,
  `rejectionReason` text DEFAULT NULL,
  `isCompleted` tinyint(1) DEFAULT 0,
  `completedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isInitialized` tinyint(1) DEFAULT 0,
  `initializedAt` datetime DEFAULT NULL,
  `transferId` varchar(255) DEFAULT NULL,
  `payoutId` varchar(255) DEFAULT NULL,
  `isPartialyApproved` tinyint(1) DEFAULT 0,
  `approvedAmount` decimal(8,2) unsigned NOT NULL DEFAULT 0.00,
  `partialyApprovedReason` varchar(255) DEFAULT NULL,
  `refundedAmount` decimal(8,2) unsigned DEFAULT 0.00,
  `checksum` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `courierId` (`courierId`),
  CONSTRAINT `CourierWithdrawRequests_ibfk_1` FOREIGN KEY (`courierId`) REFERENCES `Couriers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `CourierWithdrawSettings` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `isEnabled` tinyint(1) DEFAULT 1,
  `minAmount` int(4) unsigned DEFAULT 5,
  `maxAmount` int(4) unsigned DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Couriers` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `isRestricted` tinyint(1) DEFAULT 0,
  `isOnline` tinyint(1) DEFAULT 0,
  `verifiedAt` datetime DEFAULT NULL,
  `restrictedAt` datetime DEFAULT NULL,
  `lastOnlineAt` datetime DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isRequestSent` tinyint(1) DEFAULT 0,
  `requestSentAt` datetime DEFAULT NULL,
  `hasActiveOrder` tinyint(1) DEFAULT 0,
  `activeOrderAt` datetime DEFAULT NULL,
  `activeOrderId` bigint(8) unsigned DEFAULT NULL,
  `isOrderRequestSent` tinyint(1) DEFAULT 0,
  `orderRequestSentAt` datetime DEFAULT NULL,
  `orderRequestSentByNuid` varchar(255) DEFAULT NULL,
  `balance` decimal(8,2) unsigned NOT NULL DEFAULT 0.00,
  `totalIncome` decimal(8,2) unsigned DEFAULT 0.00,
  `totalOrders` bigint(8) unsigned DEFAULT 0,
  `totalAcceptedOrders` bigint(8) unsigned DEFAULT 0,
  `totalRejectedOrders` bigint(8) unsigned DEFAULT 0,
  `totalCanceledOrders` bigint(8) unsigned DEFAULT 0,
  `totalRating` bigint(8) unsigned DEFAULT 0,
  `totalCompletedOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `accountId` varchar(255) DEFAULT NULL,
  `personId` varchar(255) DEFAULT NULL,
  `isKycCompleted` tinyint(1) DEFAULT 0,
  `kycCompletedAt` datetime DEFAULT NULL,
  `lat` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  `lon` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  `checksum` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `Couriers_activeOrderId_foreign_idx` (`activeOrderId`),
  CONSTRAINT `Couriers_activeOrderId_foreign_idx` FOREIGN KEY (`activeOrderId`) REFERENCES `Orders` (`id`),
  CONSTRAINT `Couriers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DailySummaryStatistics` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `totalClients` int(4) unsigned NOT NULL DEFAULT 0,
  `totalCouriers` int(4) unsigned NOT NULL DEFAULT 0,
  `totalEmployees` int(4) unsigned NOT NULL DEFAULT 0,
  `totalManagers` int(4) unsigned NOT NULL DEFAULT 0,
  `totalRestaurants` int(4) unsigned NOT NULL DEFAULT 0,
  `totalIncomeInCent` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalAcceptedOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalCanceledOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalPreparationTimeInSeconds` bigint(8) unsigned NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=350 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DeliveryAddresses` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `clientId` bigint(8) unsigned NOT NULL,
  `isDefault` tinyint(1) DEFAULT 0,
  `label` varchar(255) DEFAULT '',
  `street` varchar(255) DEFAULT '',
  `apartment` varchar(255) DEFAULT '',
  `description` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isOneTimeAddress` tinyint(1) DEFAULT 0,
  `city` varchar(255) DEFAULT '',
  `stateId` bigint(8) unsigned DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `lon` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  `lat` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  KEY `DeliveryAddresses_stateId_foreign_idx` (`stateId`),
  CONSTRAINT `DeliveryAddresses_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DeliveryAddresses_stateId_foreign_idx` FOREIGN KEY (`stateId`) REFERENCES `States` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DeliveryPriceSettings` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `unitPrice` decimal(8,2) unsigned NOT NULL,
  `unitType` enum('kilometer','meter','mile','feet') DEFAULT 'kilometer',
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `maxSearchSquareInDegrees` float unsigned DEFAULT 0.1,
  `maxSearchRadius` float unsigned DEFAULT 15,
  `baseFee` float unsigned NOT NULL DEFAULT 3.99,
  `serviceFeePercent` float unsigned DEFAULT 15,
  `deliveryPerUnitFeePercent` float unsigned DEFAULT 2,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DiscountCodes` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `code` varchar(255) NOT NULL,
  `discount` decimal(4,2) NOT NULL DEFAULT 0.00,
  `description` varchar(255) DEFAULT '',
  `usedTimes` int(10) unsigned NOT NULL DEFAULT 0,
  `expiresAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `type` enum('menu-discount','free-delivery') DEFAULT 'menu-discount',
  `totalDiscount` decimal(8,2) DEFAULT 0.00,
  `isDeleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `DiscountSettings` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `isEnabled` tinyint(1) DEFAULT 1,
  `maxDiscountPercent` int(1) unsigned DEFAULT 20,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `EmailVerifications` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `code` varchar(255) NOT NULL,
  `maxAge` int(11) unsigned DEFAULT 0,
  `isUsed` tinyint(1) DEFAULT 0,
  `isExpired` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `EmailVerifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=123 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Employees` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `verifiedAt` datetime DEFAULT NULL,
  `isRestricted` tinyint(1) DEFAULT 0,
  `restrictedAt` datetime DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `lastOnlineAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `restaurantId` bigint(8) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `Employees_restaurantId_foreign_idx` (`restaurantId`),
  CONSTRAINT `Employees_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Employees_restaurantId_foreign_idx` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Faqs` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `role` enum('client','courier','restaurant') DEFAULT 'client',
  `q` text NOT NULL,
  `a` text NOT NULL,
  `isDisabled` tinyint(1) DEFAULT 0,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `FavoriteMenuItems` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `clientId` bigint(8) unsigned NOT NULL,
  `menuItemId` bigint(8) unsigned NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  KEY `menuItemId` (`menuItemId`),
  CONSTRAINT `FavoriteMenuItems_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FavoriteMenuItems_ibfk_2` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `GlobalSummaryStatistics` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `totalClients` int(4) unsigned NOT NULL DEFAULT 0,
  `totalCouriers` int(4) unsigned NOT NULL DEFAULT 0,
  `totalEmployees` int(4) unsigned NOT NULL DEFAULT 0,
  `totalManagers` int(4) unsigned NOT NULL DEFAULT 0,
  `totalRestaurants` int(4) unsigned NOT NULL DEFAULT 0,
  `totalIncomeInCent` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalAcceptedOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalCanceledOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalPreparationTimeInSeconds` bigint(8) unsigned NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Managers` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `verifiedAt` datetime DEFAULT NULL,
  `isRestricted` tinyint(1) DEFAULT 0,
  `restrictedAt` datetime DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `lastOnlineAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `restaurantId` bigint(8) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `Managers_restaurantId_foreign_idx` (`restaurantId`),
  CONSTRAINT `Managers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Managers_restaurantId_foreign_idx` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `MasterNodes` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `nuid` varchar(255) NOT NULL,
  `ip` varchar(255) DEFAULT 'n/a',
  `lastSeenAt` datetime DEFAULT NULL,
  `isLocked` tinyint(1) DEFAULT 0,
  `lockedAt` datetime DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nuid` (`nuid`)
) ENGINE=InnoDB AUTO_INCREMENT=11800 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `MenuCategories` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurantId` (`restaurantId`),
  CONSTRAINT `MenuCategories_ibfk_1` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `MenuItems` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `menuCategoryId` bigint(8) unsigned NOT NULL,
  `image` varchar(255) NOT NULL DEFAULT '',
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `kcal` int(10) unsigned DEFAULT NULL,
  `proteins` int(10) unsigned DEFAULT NULL,
  `fats` int(10) unsigned DEFAULT NULL,
  `carbs` int(10) unsigned DEFAULT NULL,
  `price` decimal(8,2) NOT NULL DEFAULT 0.00,
  `rating` double unsigned NOT NULL DEFAULT 0,
  `isAvailable` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `order` int(10) unsigned NOT NULL DEFAULT 0,
  `totalRatings` bigint(8) unsigned DEFAULT 0,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurantId` (`restaurantId`),
  KEY `menuCategoryId` (`menuCategoryId`),
  CONSTRAINT `MenuItems_ibfk_1` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `MenuItems_ibfk_2` FOREIGN KEY (`menuCategoryId`) REFERENCES `MenuCategories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `OrderDeliveryAddresses` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `orderId` bigint(8) unsigned NOT NULL,
  `deliveryAddressId` bigint(8) unsigned DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `deliveryAddressId` (`deliveryAddressId`),
  CONSTRAINT `OrderDeliveryAddresses_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderDeliveryAddresses_ibfk_2` FOREIGN KEY (`deliveryAddressId`) REFERENCES `DeliveryAddresses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=629 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `OrderDeliveryTimes` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `orderId` bigint(8) unsigned NOT NULL,
  `deliveryDay` enum('today','tomorrow') DEFAULT 'today',
  `deliveryHour` enum('now','set-by-user') DEFAULT 'now',
  `deliveryTimeValue` int(2) unsigned DEFAULT 0,
  `deliveryTimeType` enum('NOT-SET','AM','PM') DEFAULT 'NOT-SET',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `OrderDeliveryTimes_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=434 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `OrderDeliveryTypes` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `orderId` bigint(8) unsigned NOT NULL,
  `type` enum('Conventional','Contactless') DEFAULT 'Conventional',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `OrderDeliveryTypes_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=658 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `OrderPaymentTypes` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `orderId` bigint(8) unsigned NOT NULL,
  `paymentCardId` bigint(8) unsigned DEFAULT NULL,
  `type` enum('Not selected','ApplePay','GooglePay','Card') DEFAULT 'Not selected',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `paymentCardId` (`paymentCardId`),
  CONSTRAINT `OrderPaymentTypes_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderPaymentTypes_ibfk_2` FOREIGN KEY (`paymentCardId`) REFERENCES `PaymentCards` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=427 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `OrderSupplierItems` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `orderSupplierId` bigint(8) unsigned NOT NULL,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `menuItemId` bigint(8) unsigned NOT NULL,
  `price` decimal(8,2) NOT NULL DEFAULT 0.00,
  `amount` int(11) NOT NULL DEFAULT 0,
  `totalPrice` decimal(8,2) NOT NULL DEFAULT 0.00,
  `isRatedByClient` tinyint(1) NOT NULL DEFAULT 0,
  `ratedAt` datetime DEFAULT NULL,
  `rating` int(1) unsigned NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orderSupplierId` (`orderSupplierId`),
  KEY `restaurantId` (`restaurantId`),
  KEY `menuItemId` (`menuItemId`),
  CONSTRAINT `OrderSupplierItems_ibfk_1` FOREIGN KEY (`orderSupplierId`) REFERENCES `OrderSuppliers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderSupplierItems_ibfk_2` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderSupplierItems_ibfk_3` FOREIGN KEY (`menuItemId`) REFERENCES `MenuItems` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1060 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `OrderSuppliers` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `orderId` bigint(8) unsigned NOT NULL,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `totalPrice` decimal(8,2) NOT NULL DEFAULT 0.00,
  `totalItems` int(11) NOT NULL DEFAULT 0,
  `isTakenByCourier` tinyint(1) NOT NULL DEFAULT 0,
  `takenByCourierAt` datetime DEFAULT NULL,
  `isCanceledByRestaurant` tinyint(1) NOT NULL DEFAULT 0,
  `canceledByRestaurantAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isAcceptedByRestaurant` tinyint(1) NOT NULL DEFAULT 0,
  `acceptedByRestaurantAt` datetime DEFAULT NULL,
  `isOrderReady` tinyint(1) NOT NULL DEFAULT 0,
  `orderReadyAt` datetime DEFAULT NULL,
  `cancellationReason` text NOT NULL,
  `isRestaurantNotified` tinyint(1) NOT NULL DEFAULT 0,
  `restaurantNotifiedAt` datetime DEFAULT NULL,
  `isOrderDelayed` tinyint(1) NOT NULL DEFAULT 0,
  `orderDelayedFor` int(10) unsigned DEFAULT 0,
  `isRestaurantAcknowledged` tinyint(1) NOT NULL DEFAULT 0,
  `restaurantAcknowledgedAt` datetime DEFAULT NULL,
  `isRequestCreated` tinyint(1) NOT NULL DEFAULT 0,
  `requestCreatedAt` datetime DEFAULT NULL,
  `isCourierArrived` tinyint(1) NOT NULL DEFAULT 0,
  `courierArrivedAt` datetime DEFAULT NULL,
  `orderDelayedAt` datetime DEFAULT NULL,
  `isAppliedToBalance` tinyint(1) NOT NULL DEFAULT 0,
  `appliedToBalanceAt` datetime DEFAULT NULL,
  `checksum` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `restaurantId` (`restaurantId`),
  CONSTRAINT `OrderSuppliers_ibfk_1` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `OrderSuppliers_ibfk_2` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=730 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Orders` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `clientId` bigint(8) unsigned NOT NULL,
  `status` enum('created','processing','delivered','canceled','refunded','discarded') DEFAULT 'created',
  `totalPrice` decimal(8,2) NOT NULL DEFAULT 0.00,
  `totalItems` int(10) unsigned NOT NULL DEFAULT 0,
  `isDeliveredByCourier` tinyint(1) NOT NULL DEFAULT 0,
  `deliveredByCourierAt` datetime DEFAULT NULL,
  `isCourierRatedByClient` tinyint(1) NOT NULL DEFAULT 0,
  `courierRatedByClientAt` datetime DEFAULT NULL,
  `courierRating` int(1) unsigned NOT NULL DEFAULT 0,
  `isRejectedByClient` tinyint(1) NOT NULL DEFAULT 0,
  `rejectedByClientAt` datetime DEFAULT NULL,
  `rejectionReason` text NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `discountAmount` decimal(4,2) NOT NULL DEFAULT 0.00,
  `discountCode` varchar(255) NOT NULL DEFAULT '',
  `courierId` bigint(8) unsigned DEFAULT NULL,
  `clientDescription` text DEFAULT NULL,
  `finalPrice` decimal(8,2) NOT NULL DEFAULT 0.00,
  `isCanceledByClient` tinyint(1) NOT NULL DEFAULT 0,
  `canceledByClientAt` datetime DEFAULT NULL,
  `cancellationReason` text NOT NULL,
  `paymentIntentId` varchar(255) DEFAULT NULL,
  `allSuppliersHaveConfirmed` tinyint(1) NOT NULL DEFAULT 0,
  `allSuppliersHaveConfirmedAt` datetime DEFAULT NULL,
  `isLocked` tinyint(1) DEFAULT 0,
  `lockedAt` datetime DEFAULT NULL,
  `isPaid` tinyint(1) NOT NULL DEFAULT 0,
  `deliveryPrice` decimal(8,2) unsigned NOT NULL DEFAULT 0.00,
  `deliveryPriceUnitPrice` decimal(8,2) unsigned NOT NULL DEFAULT 0.00,
  `deliveryPriceUnitType` enum('kilometer','meter','mile','feet') DEFAULT 'kilometer',
  `isClientActionRequired` tinyint(1) NOT NULL DEFAULT 0,
  `clientActionRequiredAt` datetime DEFAULT NULL,
  `isClientActionExecuted` tinyint(1) NOT NULL DEFAULT 0,
  `clientActionExecutedAt` datetime DEFAULT NULL,
  `isOrderRatedByClient` tinyint(1) NOT NULL DEFAULT 0,
  `orderRatedByClientAt` datetime DEFAULT NULL,
  `lockedByNuid` varchar(255) DEFAULT NULL,
  `paidAt` datetime DEFAULT NULL,
  `isPaymentRequestAllowed` tinyint(1) NOT NULL DEFAULT 0,
  `paymentRequestAllowedAt` datetime DEFAULT NULL,
  `isPaymentRequested` tinyint(1) NOT NULL DEFAULT 0,
  `paymentRequestedAt` datetime DEFAULT NULL,
  `isRefunded` tinyint(1) NOT NULL DEFAULT 0,
  `refundedAt` datetime DEFAULT NULL,
  `clientSecret` varchar(255) DEFAULT NULL,
  `lastCourierId` bigint(8) unsigned DEFAULT NULL,
  `isClientDidGetInTouch` tinyint(1) NOT NULL DEFAULT 0,
  `clientDidGetInTouchAt` datetime DEFAULT NULL,
  `isOrderRateRequestSent` tinyint(1) NOT NULL DEFAULT 0,
  `orderRateRequestSentAt` datetime DEFAULT NULL,
  `isPushedToProcessing` tinyint(1) NOT NULL DEFAULT 0,
  `pushedToProcessingAt` datetime DEFAULT NULL,
  `pushToProcessingAt` datetime DEFAULT NULL,
  `isFreeDelivery` tinyint(1) DEFAULT 0,
  `expectedDeliveryTime` datetime DEFAULT NULL,
  `totalPriceFee` decimal(8,2) unsigned NOT NULL DEFAULT 0.00,
  `deliveryPriceFee` decimal(8,2) unsigned NOT NULL DEFAULT 0.00,
  `discountType` varchar(255) DEFAULT NULL,
  `deliveryDistanceValue` float unsigned NOT NULL DEFAULT 0,
  `deliveryDistanceType` varchar(255) NOT NULL DEFAULT '',
  `checksum` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  KEY `Orders_courierId_foreign_idx` (`courierId`),
  CONSTRAINT `Orders_courierId_foreign_idx` FOREIGN KEY (`courierId`) REFERENCES `Couriers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Orders_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10000000657 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `PaymentCards` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `clientId` bigint(8) unsigned NOT NULL,
  `encCardHolderName` text NOT NULL,
  `encCardNumber` text NOT NULL,
  `encCardExpiryDate` text NOT NULL,
  `encCardCVV` text NOT NULL,
  `isUsedInPayment` tinyint(1) NOT NULL DEFAULT 0,
  `lastUsedAt` datetime DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isOneTimeCard` tinyint(1) DEFAULT 0,
  `isDefault` tinyint(1) DEFAULT 0,
  `paymentMethodId` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `clientId` (`clientId`),
  CONSTRAINT `PaymentCards_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Clients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `PrivacyPolicies` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `sectionTitle` varchar(255) NOT NULL DEFAULT 'Privacy-Policy',
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `PrivacyPolicyItems` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `privacyPolicyId` bigint(8) unsigned NOT NULL,
  `itemTitle` varchar(255) NOT NULL DEFAULT '',
  `itemText` text NOT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `privacyPolicyId` (`privacyPolicyId`),
  CONSTRAINT `PrivacyPolicyItems_ibfk_1` FOREIGN KEY (`privacyPolicyId`) REFERENCES `PrivacyPolicies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RestaurantNotifications` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `message` text NOT NULL,
  `image` varchar(255) DEFAULT 'notifications.default.png',
  `data` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `event` enum('info','adminMessage','courierMessage','supplierMessage','clientMessage','newUnpaidOrder','supplierCanceledOrder','supplierOrderIsReady','supplierOrderCompleted','clientConfirmedOrder','clientPaidOrder','clientCanceledOrder','clientRejectedOrder','clientDintGetInTouch','courierAssignedToOrder','courierCanceledOrder','courierArrived','courierGotOrder','orderHasBeenPaid','orderCompleted','orderRated','orderCanceled','orderDiscarded','adminP2pMessage','adminBroadcastMessage') DEFAULT 'info',
  `type` enum('info','adminMessage','courierMessage','supplierMessage','clientMessage','supplierCanceledOrder','supplierOrderIsReady','supplierOrderCompleted','clientConfirmedOrder','clientCanceledOrder','clientRejectedOrder','clientDintGetInTouch','clientPaidOrder','courierAcceptedOrder','courierCanceledOrder','courierArrived','courierDeliveredOrder','newUnpaidOrder','orderRated','orderCanceled','orderDiscarded') DEFAULT 'info',
  PRIMARY KEY (`id`),
  KEY `restaurantId` (`restaurantId`),
  CONSTRAINT `RestaurantNotifications_ibfk_1` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=983 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RestaurantStatistics` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `totalOrders` int(4) unsigned NOT NULL DEFAULT 0,
  `totalAcceptedOrders` int(4) unsigned NOT NULL DEFAULT 0,
  `totalCanceledOrders` int(4) unsigned NOT NULL DEFAULT 0,
  `totalIncomeInCent` int(4) unsigned NOT NULL DEFAULT 0,
  `totalPreparationTimeInSeconds` int(4) unsigned NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurantId` (`restaurantId`),
  CONSTRAINT `RestaurantStatistics_ibfk_1` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=302 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RestaurantTransfers` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `status` enum('none','transfered','completed','errored') DEFAULT 'none',
  `amount` decimal(8,2) NOT NULL DEFAULT 0.00,
  `isTransfered` tinyint(1) NOT NULL DEFAULT 0,
  `transferedAt` datetime DEFAULT NULL,
  `transferId` varchar(255) DEFAULT NULL,
  `transferError` text NOT NULL,
  `isPaidOut` tinyint(1) NOT NULL DEFAULT 0,
  `paidOutAt` datetime DEFAULT NULL,
  `paidOutError` text NOT NULL,
  `payoutId` varchar(255) DEFAULT NULL,
  `isInited` tinyint(1) NOT NULL DEFAULT 0,
  `initedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `checksum` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `restaurantId` (`restaurantId`),
  CONSTRAINT `RestaurantTransfers_ibfk_1` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RestaurantWithdrawSettings` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `isEnabled` tinyint(1) DEFAULT 1,
  `minAmount` int(4) unsigned DEFAULT 5,
  `maxAmount` int(4) unsigned DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `RestaurantWorkingTimes` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `restaurantId` bigint(8) unsigned NOT NULL,
  `mondayOpenAt` int(1) unsigned NOT NULL DEFAULT 9,
  `mondayCloseAt` int(1) unsigned NOT NULL DEFAULT 10,
  `tuesdayOpenAt` int(1) unsigned NOT NULL DEFAULT 9,
  `tuesdayCloseAt` int(1) unsigned NOT NULL DEFAULT 10,
  `wednesdayOpenAt` int(1) unsigned NOT NULL DEFAULT 9,
  `wednesdayCloseAt` int(1) unsigned NOT NULL DEFAULT 10,
  `thursdayOpenAt` int(1) unsigned NOT NULL DEFAULT 9,
  `thursdayCloseAt` int(1) unsigned NOT NULL DEFAULT 10,
  `fridayOpenAt` int(1) unsigned NOT NULL DEFAULT 9,
  `fridayCloseAt` int(1) unsigned NOT NULL DEFAULT 10,
  `saturdayOpenAt` int(1) unsigned NOT NULL DEFAULT 9,
  `saturdayCloseAt` int(1) unsigned NOT NULL DEFAULT 10,
  `sundayOpenAt` int(1) unsigned NOT NULL DEFAULT 9,
  `sundayCloseAt` int(1) unsigned NOT NULL DEFAULT 10,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isMondayOpen` tinyint(1) NOT NULL DEFAULT 0,
  `isTuesdayOpen` tinyint(1) NOT NULL DEFAULT 0,
  `isWednesdayOpen` tinyint(1) NOT NULL DEFAULT 0,
  `isThursdayOpen` tinyint(1) NOT NULL DEFAULT 0,
  `isFridayOpen` tinyint(1) NOT NULL DEFAULT 0,
  `isSaturdayOpen` tinyint(1) NOT NULL DEFAULT 0,
  `isSundayOpen` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `restaurantId` (`restaurantId`),
  CONSTRAINT `RestaurantWorkingTimes_ibfk_1` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Restaurants` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `name` varchar(255) DEFAULT '',
  `description` text DEFAULT NULL,
  `zip` varchar(255) DEFAULT '',
  `street` varchar(255) DEFAULT '',
  `rating` double NOT NULL DEFAULT 0,
  `type` enum('stationary','mobile') DEFAULT 'stationary',
  `isOpen` tinyint(1) DEFAULT 0,
  `isVerified` tinyint(1) DEFAULT 0,
  `isRestricted` tinyint(1) DEFAULT 0,
  `verifiedAt` datetime DEFAULT NULL,
  `restrictedAt` datetime DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `image` varchar(255) DEFAULT '',
  `cityId` bigint(8) unsigned DEFAULT NULL,
  `email` varchar(255) DEFAULT 'n/a',
  `phone` varchar(255) DEFAULT 'n/a',
  `website` varchar(255) DEFAULT 'n/a',
  `orderPrepTime` int(4) unsigned DEFAULT 30,
  `totalIncomeInCent` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalPreparationTimeInSeconds` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalAcceptedOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `totalCanceledOrders` bigint(8) unsigned NOT NULL DEFAULT 0,
  `comment` text DEFAULT NULL,
  `timezone` varchar(255) DEFAULT 'n/a',
  `lon` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  `lat` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  `personId` varchar(255) DEFAULT NULL,
  `accountId` varchar(255) DEFAULT NULL,
  `isKycCompleted` tinyint(1) DEFAULT 0,
  `kycCompletedAt` datetime DEFAULT NULL,
  `isOpeningHoursSet` tinyint(1) DEFAULT 0,
  `balance` decimal(8,2) unsigned NOT NULL DEFAULT 0.00,
  `checksum` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `Restaurants_cityId_foreign_idx` (`cityId`),
  CONSTRAINT `Restaurants_cityId_foreign_idx` FOREIGN KEY (`cityId`) REFERENCES `Cities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Restaurants_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SearchNearByClientSettings` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `unitType` enum('kilometer','meter','mile','feet') DEFAULT 'kilometer',
  `maxSearchSquareInDegrees` float unsigned DEFAULT 0.1,
  `maxSearchRadius` float unsigned DEFAULT 15,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Sessions` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `token` varchar(255) NOT NULL,
  `maxAge` int(11) unsigned DEFAULT 0,
  `fcmPushToken` varchar(255) DEFAULT '',
  `country` varchar(255) DEFAULT 'n/a',
  `timezone` varchar(255) DEFAULT 'n/a',
  `ip` varchar(255) DEFAULT 'n/a',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deviceId` varchar(255) DEFAULT '',
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `Sessions_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=423 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SmsVerifications` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `phone` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `maxAge` int(11) unsigned DEFAULT 0,
  `isExpired` tinyint(1) DEFAULT 0,
  `isUsed` tinyint(1) DEFAULT 0,
  `ip` varchar(255) DEFAULT '',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `States` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) DEFAULT 'n/a',
  `isEnabled` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SupportTicketFiles` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `supportTicketId` bigint(8) unsigned NOT NULL,
  `fileId` bigint(8) unsigned NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `supportTicketId` (`supportTicketId`),
  KEY `fileId` (`fileId`),
  CONSTRAINT `SupportTicketFiles_ibfk_1` FOREIGN KEY (`supportTicketId`) REFERENCES `SupportTickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SupportTicketFiles_ibfk_2` FOREIGN KEY (`fileId`) REFERENCES `Uploads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SupportTickets` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `orderId` bigint(8) unsigned DEFAULT NULL,
  `userType` enum('client','courier','restaurant','employee','manager','admin','root') DEFAULT 'client',
  `type` enum('last-order','other') DEFAULT 'last-order',
  `message` text NOT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `SupportTickets_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SupportTickets_ibfk_2` FOREIGN KEY (`orderId`) REFERENCES `Orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `TermsAndConditions` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `sectionTitle` varchar(255) NOT NULL DEFAULT 'Terms and conditions',
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `TermsAndConditionsItems` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `termsAndConditionsId` bigint(8) unsigned NOT NULL,
  `itemTitle` varchar(255) NOT NULL DEFAULT '',
  `itemText` text NOT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `termsAndConditionsId` (`termsAndConditionsId`),
  CONSTRAINT `TermsAndConditionsItems_ibfk_1` FOREIGN KEY (`termsAndConditionsId`) REFERENCES `TermsAndConditions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Uploads` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `fileType` enum('image','audio','video','document') DEFAULT 'image',
  `fileName` varchar(255) NOT NULL,
  `fileSize` int(11) unsigned NOT NULL DEFAULT 0,
  `fileMimeType` varchar(255) DEFAULT 'n/a',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `Uploads_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserSettings` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `userId` bigint(8) unsigned NOT NULL,
  `allowSendNotification` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `UserSettings_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=120 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Users` (
  `id` bigint(8) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `isEmailVerified` tinyint(1) DEFAULT 0,
  `phone` varchar(255) NOT NULL,
  `isPhoneVerified` tinyint(1) DEFAULT 0,
  `isRestricted` tinyint(1) DEFAULT 0,
  `password` varchar(255) NOT NULL,
  `lang` varchar(255) DEFAULT 'en',
  `role` enum('client','courier','restaurant','employee','manager','admin','root') DEFAULT 'client',
  `gender` enum('not-selected','male','female','other') DEFAULT 'not-selected',
  `image` varchar(255) DEFAULT 'default.male.png',
  `firstName` varchar(255) DEFAULT '',
  `lastName` varchar(255) DEFAULT '',
  `zip` varchar(255) DEFAULT '',
  `street` varchar(255) DEFAULT '',
  `birthday` datetime DEFAULT NULL,
  `timezone` varchar(255) DEFAULT 'n/a',
  `lastSeenAt` datetime NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cityId` bigint(8) unsigned DEFAULT NULL,
  `isNewUser` tinyint(1) DEFAULT 1,
  `restaurantId` bigint(8) unsigned DEFAULT NULL,
  `restrictedAt` datetime DEFAULT NULL,
  `isDeleted` tinyint(1) DEFAULT 0,
  `deletedAt` datetime DEFAULT NULL,
  `lat` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  `lon` decimal(11,8) NOT NULL DEFAULT 0.00000000,
  PRIMARY KEY (`id`),
  KEY `Users_cityId_foreign_idx` (`cityId`),
  KEY `Users_restaurantId_foreign_idx` (`restaurantId`),
  CONSTRAINT `Users_cityId_foreign_idx` FOREIGN KEY (`cityId`) REFERENCES `Cities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Users_restaurantId_foreign_idx` FOREIGN KEY (`restaurantId`) REFERENCES `Restaurants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=142 DEFAULT CHARSET=utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

