import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createMoleculeGenerationHistory(data: {
    smiles: string;
    numMolecules: number;
    minSimilarity: number;
    particles: number;
    iterations: number;
    generatedMolecules: { structure: string; score: number }[];
    userId: number;
}) {
    return await prisma.moleculeGenerationHistory.create({
        data: {
            smiles: data.smiles,
            numMolecules: data.numMolecules,
            minSimilarity: data.minSimilarity,
            particles: data.particles,
            iterations: data.iterations,
            user: { connect: { id: data.userId } },
            generatedMolecules: {
                create: data.generatedMolecules,
            },
        },
        include: {
            generatedMolecules: true,
            user: true,
        },
    });
}

export async function getMoleculeGenerationHistoryById(id: number) {
    return await prisma.moleculeGenerationHistory.findUnique({
        where: { id: id },
        include: {
            generatedMolecules: true,
            user: true,
        },
    });
}
