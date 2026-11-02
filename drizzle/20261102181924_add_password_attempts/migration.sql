CREATE TABLE `password_attempts` (
	`client_key` text PRIMARY KEY,
	`attempts` integer NOT NULL,
	`window_started_at` integer NOT NULL
);
