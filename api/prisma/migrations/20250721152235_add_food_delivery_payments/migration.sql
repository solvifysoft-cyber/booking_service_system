/*
  Warnings:

  - You are about to drop the column `cardNumber` on the `payment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `payment` DROP COLUMN `cardNumber`;

-- CreateTable
CREATE TABLE `_FoodDeliveryPayments` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_FoodDeliveryPayments_AB_unique`(`A`, `B`),
    INDEX `_FoodDeliveryPayments_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_FoodDeliveryPayments` ADD CONSTRAINT `_FoodDeliveryPayments_A_fkey` FOREIGN KEY (`A`) REFERENCES `FoodDelivery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_FoodDeliveryPayments` ADD CONSTRAINT `_FoodDeliveryPayments_B_fkey` FOREIGN KEY (`B`) REFERENCES `Payment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
