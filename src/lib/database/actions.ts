"use server";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

export async function getData() {
    try {
        const data = await prisma.$queryRaw`...`; // Your query here
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}