CREATE TABLE `account_deletion_requests` (
	`user_id` text PRIMARY KEY NOT NULL,
	`previous_status` text NOT NULL,
	`status` text NOT NULL,
	`requested_at` integer NOT NULL,
	`cancel_until` integer NOT NULL,
	`cancelled_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
