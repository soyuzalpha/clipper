-- CreateTable
CREATE TABLE "AIRequestLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "task" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'mock',
    "model" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorKind" TEXT,
    "durationMs" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "AIRequestLog_createdAt_idx" ON "AIRequestLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIRequestLog_task_createdAt_idx" ON "AIRequestLog"("task", "createdAt");
