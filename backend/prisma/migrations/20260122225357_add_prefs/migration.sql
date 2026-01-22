-- AlterTable
ALTER TABLE "UserBio" ADD COLUMN     "prefHobby" TEXT,
ADD COLUMN     "prefInterest" TEXT,
ADD COLUMN     "prefMusic" TEXT;

-- CreateTable
CREATE TABLE "BannedInquiry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedInquiry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BannedInquiry" ADD CONSTRAINT "BannedInquiry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
