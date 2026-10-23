CREATE TABLE IF NOT EXISTS `gyujtoelemek` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`szoveg` text NOT NULL,
	`kontextus` text,
	`kerdes` text,
	`allapot` enum('uj','veglegesitve') NOT NULL DEFAULT 'uj',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gyujtoelemek_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `projects` ADD `cel` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `allapot` enum('aktiv','majd_egyszer','kesz') DEFAULT 'aktiv' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `lista` enum('kovetkezo','varakozas','majd_egyszer','referencia') DEFAULT 'kovetkezo' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `kontextus` varchar(32);--> statement-breakpoint
ALTER TABLE `tasks` ADD `idoigeny` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `energia` enum('alacsony','kozepes','magas');--> statement-breakpoint
ALTER TABLE `tasks` ADD `varakozasKire` varchar(255);--> statement-breakpoint
ALTER TABLE `tasks` ADD `befejezve` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `utolsoAttekintes` timestamp;