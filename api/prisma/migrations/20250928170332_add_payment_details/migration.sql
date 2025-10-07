-- AlterTable
ALTER TABLE `payment` ADD COLUMN `amount` DOUBLE NULL,
    ADD COLUMN `currency` VARCHAR(191) NULL,
    ADD COLUMN `gatewayResponse` VARCHAR(191) NULL,
    ADD COLUMN `message` VARCHAR(191) NULL;
