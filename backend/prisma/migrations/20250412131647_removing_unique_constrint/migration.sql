/*
  Warnings:

  - A unique constraint covering the columns `[participantId,contestId]` on the table `Position` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Position_contestId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Position_participantId_contestId_key" ON "Position"("participantId", "contestId");
