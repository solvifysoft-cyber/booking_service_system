-- AlterTable
ALTER TABLE `payment` ADD COLUMN `paymentMethod` VARCHAR(191) NULL,
    ADD COLUMN `transactionRef` VARCHAR(191) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending';
