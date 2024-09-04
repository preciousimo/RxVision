"use server";

import { PrismaClient } from '@prisma/client';
import { handleError } from "../utils";

const prisma = new PrismaClient();

export async function createMoleculeGenerationHistory(
  payload: MoleculeGenerationHistoryType,
  userId: number,
) {
  try {
    const newHistoryEntry = await prisma.moleculeGenerationHistory.create({
      data: {
        ...payload,
        userId,
        generatedMolecules: {
          create: payload.generatedMolecules,
        },
      },
      include: {
        generatedMolecules: true,
        user: true,
      },
    });

    return newHistoryEntry;
  } catch (error) {
    console.error("Error creating history entry:", error);
    handleError(error);
  }
}


export async function getMoleculeGenerationHistoryByUser(userId: number) {
  try {
    const historyEntries = await prisma.moleculeGenerationHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        generatedMolecules: true,
        user: true,
      },
    });

    return historyEntries;
  } catch (error) {
    console.error("Error retrieving history entries:", error);
    handleError(error);
  }
}

export async function getMoleculeGenerationHistoryById(historyId: number) {
  try {
    const historyEntry = await prisma.moleculeGenerationHistory.findUnique({
      where: { id: historyId },
      include: {
        generatedMolecules: true,
        user: true,
      },
    });
    if (!historyEntry) throw new Error("History entry not found");

    return historyEntry;
  } catch (error) {
    console.error("Error retrieving history entry by ID:", error);
    handleError(error);
  }
}

export async function deleteMoleculeGenerationHistory(entryId: number) {
  try {
    const deletedEntry = await prisma.moleculeGenerationHistory.delete({
      where: { id: entryId },
    });

    return deletedEntry;
  } catch (error) {
    console.error("Error deleting history entry:", error);
    handleError(error);
  }
}
