/*
  Warnings:

  - You are about to drop the column `banned` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `payment` ADD COLUMN `bookingLocation` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `service` ADD COLUMN `locationType` ENUM('CUSTOM', 'PROVIDER', 'HYBRID') NOT NULL DEFAULT 'PROVIDER';

-- AlterTable
ALTER TABLE `user` DROP COLUMN `banned`;
