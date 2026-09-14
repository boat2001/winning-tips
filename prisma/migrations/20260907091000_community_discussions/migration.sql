CREATE TABLE "community_posts" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "authorId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "parentId" TEXT REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "body" TEXT NOT NULL,
 "sport" TEXT,
 "status" TEXT NOT NULL DEFAULT 'PENDING',
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "community_posts_status_check" CHECK ("status" IN ('PENDING','PUBLISHED','HIDDEN'))
);
CREATE INDEX "community_posts_status_parentId_createdAt_idx" ON "community_posts"("status","parentId","createdAt");
CREATE TABLE "community_reactions" (
 "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "postId" TEXT NOT NULL REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("userId","postId")
);
CREATE TABLE "community_reports" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "postId" TEXT NOT NULL REFERENCES "community_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "reason" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "community_reports_userId_postId_key" ON "community_reports"("userId","postId");
