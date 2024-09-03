import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createGroup(data: {
    name: string;
    createdBy: number;
    members: number[];
    messages?: { senderId: number; text: string }[];
}) {
    return await prisma.group.create({
        data: {
            name: data.name,
            createdBy: { connect: { id: data.createdBy } },
            members: { connect: data.members.map(id => ({ id })) },
            messages: data.messages
                ? {
                      create: data.messages.map(message => ({
                          sender: { connect: { id: message.senderId } },
                          text: message.text,
                      })),
                  }
                : undefined,
        },
        include: { members: true, messages: true },
    });
}

export async function addUserToGroup(groupId: number, userId: number) {
    return await prisma.group.update({
        where: { id: groupId },
        data: {
            members: {
                connect: { id: userId },
            },
        },
        include: { members: true },
    });
}

export async function removeUserFromGroup(groupId: number, userId: number) {
    return await prisma.group.update({
        where: { id: groupId },
        data: {
            members: {
                disconnect: { id: userId },
            },
        },
        include: { members: true },
    });
}

export async function addMessageToGroup(groupId: number, senderId: number, text: string) {
    return await prisma.message.create({
        data: {
            text: text,
            group: { connect: { id: groupId } },
            sender: { connect: { id: senderId } },
        },
    });
}

export async function getGroupById(id: number) {
    return await prisma.group.findUnique({
        where: { id: id },
        include: { members: true, messages: true, createdBy: true },
    });
}

export async function getAllGroups() {
    return await prisma.group.findMany({
        include: { members: true, messages: true, createdBy: true },
    });
}
