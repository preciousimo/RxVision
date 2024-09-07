"use server";

import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { handleError } from "../utils";

const prisma = new PrismaClient().$extends(withAccelerate())

export async function createGroup(
    groupName: string,
    creatorId: number,
    memberIds: number[] = [],
  ) {
    try {
      const members = Array.from(new Set([creatorId, ...memberIds]));
  
      const newGroup = await prisma.group.create({
        data: {
          name: groupName,
          createdBy: {
            connect: { id: creatorId },
          },
          members: {
            connect: members.map((id) => ({ id })),
          },
        },
        include: {
          members: true,
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
    const group = await prisma.group.update({
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

    return group;
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
    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        messages: {
          create: {
            senderId: userId,
            text,
          },
        },
      },
      include: {
        messages: true,
      },
    });

    return group;
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
        messages: true,
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
        messages: true,
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
