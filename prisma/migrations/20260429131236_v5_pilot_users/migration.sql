-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testerName" TEXT NOT NULL DEFAULT 'Guest',
    "symbol" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "entry" TEXT NOT NULL,
    "actualExit" TEXT NOT NULL,
    "stop" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "entryTime" TEXT NOT NULL,
    "exitTime" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "pnl" REAL NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Trade" ("actualExit", "createdAt", "date", "direction", "entry", "entryTime", "exitTime", "id", "notes", "pnl", "quantity", "stop", "symbol", "target", "updatedAt") SELECT "actualExit", "createdAt", "date", "direction", "entry", "entryTime", "exitTime", "id", "notes", "pnl", "quantity", "stop", "symbol", "target", "updatedAt" FROM "Trade";
DROP TABLE "Trade";
ALTER TABLE "new_Trade" RENAME TO "Trade";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
