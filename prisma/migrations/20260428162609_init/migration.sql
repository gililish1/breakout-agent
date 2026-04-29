-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
