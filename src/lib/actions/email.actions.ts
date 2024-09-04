"use server";

import { PrismaClient } from '@prisma/client';
import { handleError } from "../utils";

const prisma = new PrismaClient();

export async function createGroup(
  groupName: string,
  creatorId: number,
  memberIds: number[] = [],
) {
  try {
    const newGroup = await prisma.group.create({
      data: {
        name: groupName,
        createdBy: { connect: { id: creatorId } },
        members: {
          connect: memberIds.map((id) => ({ id })),
        },
      },
      include: {
        members: true,
        createdBy: true,
      },
    });

    return newGroup;
  } catch (error) {
    console.error("Error creating group:", error);
    handleError(error);
  }
}

export async function addMemberToGroup(groupId: number, userId: number) {
  try {
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: true,
      },
    });

    return updatedGroup;
  } catch (error) {
    console.error("Error adding member to group:", error);
    handleError(error);
  }
}

export async function addMessageToGroup(
  groupId: number,
  userId: number,
  text: string,
) {
  try {
    const updatedGroup = await prisma.group.update({
      where: { id: groupId },
      data: {
        messages: {
          create: {
            sender: { connect: { id: userId } },
            text,
          },
        },
      },
      include: {
        messages: {
          include: {
            sender: true,
          },
        },
      },
    });

    return updatedGroup;
  } catch (error) {
    console.error("Error adding message to group:", error);
    handleError(error);
  }
}

export async function getGroupById(groupId: number) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        messages: {
          include: {
            sender: true,
          },
        },
        createdBy: true,
      },
    });
    if (!group) throw new Error("Group not found");

    return group;
  } catch (error) {
    console.error("Error retrieving group:", error);
    handleError(error);
  }
}

export async function getAllGroups() {
  try {
    const groups = await prisma.group.findMany({
      include: {
        members: true,
        messages: {
          include: {
            sender: true,
          },
        },
        createdBy: true,
      },
    });

    return groups;
  } catch (error) {
    console.error("Error retrieving groups:", error);
    handleError(error);
  }
}

export async function getGroupMessages(groupId: number) {
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        messages: {
          include: {
            sender: true,
          },
        },
      },
    });
    if (!group) throw new Error("Group not found");

    return group.messages;
  } catch (error) {
    console.error("Error retrieving group messages:", error);
    handleError(error);
  }
}
