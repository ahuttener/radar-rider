-- Enforcement de moderação no usuário: suspensão temporária e banimento.
ALTER TABLE `User`
  ADD COLUMN `suspendedUntil` DATETIME(3) NULL,
  ADD COLUMN `suspensionReason` VARCHAR(200) NULL,
  ADD COLUMN `bannedAt` DATETIME(3) NULL,
  ADD COLUMN `banReason` VARCHAR(200) NULL;

-- Rate limiting persistido (multi-processo). Cada tentativa é uma linha.
CREATE TABLE `RateHit` (
  `id` VARCHAR(191) NOT NULL,
  `bucket` VARCHAR(40) NOT NULL,
  `identifier` VARCHAR(190) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `RateHit_bucket_identifier_createdAt_idx`(`bucket`, `identifier`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
