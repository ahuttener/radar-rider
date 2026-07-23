-- Inscrições de notificação push (Web Push), notificadas por país.
CREATE TABLE `PushSubscription` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `endpoint` VARCHAR(500) NOT NULL,
  `p256dh` VARCHAR(200) NOT NULL,
  `auth` VARCHAR(100) NOT NULL,
  `country` ENUM('IE', 'GB') NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `PushSubscription_endpoint_key`(`endpoint`),
  INDEX `PushSubscription_country_idx`(`country`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PushSubscription` ADD CONSTRAINT `PushSubscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
