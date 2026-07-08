CREATE TABLE `activity_logs` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userName` varchar(128) DEFAULT 'System',
	`action` varchar(128) NOT NULL,
	`detail` text DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL DEFAULT 'ESP8266 Node',
	`type` varchar(64) NOT NULL DEFAULT 'esp8266',
	`status` enum('online','offline') NOT NULL DEFAULT 'offline',
	`mode` enum('auto','manual') NOT NULL DEFAULT 'auto',
	`pumpStatus` enum('on','off') NOT NULL DEFAULT 'off',
	`lastSeen` timestamp DEFAULT CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `devices_id` PRIMARY KEY(`id`),
	CONSTRAINT `devices_deviceId_unique` UNIQUE(`deviceId`)
);
--> statement-breakpoint
CREATE TABLE `farm_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(64) NOT NULL,
	`message` text NOT NULL,
	`value` float,
	`threshold` float,
	`isRead` boolean NOT NULL DEFAULT false,
	`triggeredAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `farm_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `farm_yields` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cropName` varchar(128) NOT NULL,
	`kg` decimal(10,2) NOT NULL,
	`grade` enum('A','B') NOT NULL,
	`pricePerKg` decimal(10,2) NOT NULL,
	`totalValue` decimal(12,2) NOT NULL,
	`date` varchar(10) NOT NULL,
	`note` text DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `farm_yields_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `finance_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('income','expense') NOT NULL,
	`category` varchar(64) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`date` varchar(10) NOT NULL,
	`note` text DEFAULT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `finance_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`time` varchar(5) NOT NULL,
	`duration` int NOT NULL DEFAULT 10,
	`enabled` boolean NOT NULL DEFAULT true,
	`label` varchar(128) DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schedules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sensor_readings` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`deviceId` varchar(64) NOT NULL,
	`temperature` float,
	`humidity` float,
	`soilMoisture` float,
	`light` float,
	`recordedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `sensor_readings_id` PRIMARY KEY(`id`)
);
