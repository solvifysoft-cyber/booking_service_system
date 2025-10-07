/*
  Warnings:

  - You are about to drop the column `description` on the `fooddelivery` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `fooddelivery` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `fooddelivery` DROP COLUMN `description`,
    DROP COLUMN `image`,
    ADD COLUMN `foodDescription` VARCHAR(191) NULL,
    ADD COLUMN `foodImage` VARCHAR(191) NULL,
    ADD COLUMN `ingredients` VARCHAR(191) NULL;
