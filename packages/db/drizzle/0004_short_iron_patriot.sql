CREATE TABLE "link_previews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"description" text,
	"image_url" text,
	"domain" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_link_previews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"link_preview_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_link_previews" ADD CONSTRAINT "post_link_previews_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_link_previews" ADD CONSTRAINT "post_link_previews_link_preview_id_link_previews_id_fk" FOREIGN KEY ("link_preview_id") REFERENCES "public"."link_previews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "link_previews_url_idx" ON "link_previews" USING btree ("url");--> statement-breakpoint
CREATE INDEX "post_link_previews_post_idx" ON "post_link_previews" USING btree ("post_id");