-- AlterTable
ALTER TABLE `businesses` ADD COLUMN `language` VARCHAR(191) NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE `printers` ADD COLUMN `bluetoothDeviceId` VARCHAR(191) NULL,
    ADD COLUMN `bluetoothDeviceName` VARCHAR(191) NULL;
