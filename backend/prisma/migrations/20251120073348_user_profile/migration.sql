/*
  Warnings:

  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "profilePic" TEXT,
ADD COLUMN     "username" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UserBio" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "interest1" TEXT NOT NULL,
    "interest2" TEXT NOT NULL,
    "interest3" TEXT NOT NULL,
    "music" TEXT NOT NULL,
    "hobby" TEXT NOT NULL,

    CONSTRAINT "UserBio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" SERIAL NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBio_userId_key" ON "UserBio"("userId");

-- AddForeignKey
ALTER TABLE "UserBio" ADD CONSTRAINT "UserBio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
