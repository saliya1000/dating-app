-- CreateTable
CREATE TABLE "Dismissal" (
    "id" SERIAL NOT NULL,
    "dismisserId" INTEGER NOT NULL,
    "dismissedId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dismissal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dismissal_dismisserId_dismissedId_key" ON "Dismissal"("dismisserId", "dismissedId");

-- AddForeignKey
ALTER TABLE "Dismissal" ADD CONSTRAINT "Dismissal_dismisserId_fkey" FOREIGN KEY ("dismisserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dismissal" ADD CONSTRAINT "Dismissal_dismissedId_fkey" FOREIGN KEY ("dismissedId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
