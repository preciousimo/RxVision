import { PrismaClient } from '@prisma/client';
import { handleError } from '@/lib/utils';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();


export async function createUser(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    photo: string;
}) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    try {
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                photo: data.photo,
                userBio: "",
                createdAt: new Date(),
            },
        });
        return user;
    } catch (error) {
        throw handleError(error);
    }
}

export async function getUserByEmail(email: string) {
    return await prisma.user.findUnique({
        where: { email: email },
    });
}

export async function updateUser(id: number, data: Partial<typeof prisma.user.create>) {
    return await prisma.user.update({
        where: { id: id },
        data: data,
    });
}

export async function deleteUser(id: number) {
    return await prisma.user.delete({
        where: { id: id },
    });
}

export async function getAllUsers() {
    return await prisma.user.findMany();
}
