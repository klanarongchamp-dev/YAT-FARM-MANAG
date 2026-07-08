ALTER TABLE `activity_logs` MODIFY COLUMN `userName` varchar(128);--> statement-breakpoint
ALTER TABLE `activity_logs` MODIFY COLUMN `detail` text;--> statement-breakpoint
ALTER TABLE `farm_yields` MODIFY COLUMN `note` text;--> statement-breakpoint
ALTER TABLE `finance_transactions` MODIFY COLUMN `note` text;--> statement-breakpoint
ALTER TABLE `schedules` MODIFY COLUMN `label` varchar(128);