"use server";

import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { handleError } from "../utils";
import { sendVerificationEmail, sendResetPasswordEmail } from "./email.actions";

const prisma = new PrismaClient();

function generateToken() {
    return uuidv4();
}

export async function createUser(user: CreateUserParams) {
    try {
        const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
        });
        if (existingUser) {
            throw new Error("User already exists with this email");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);

        const newUser = await prisma.user.create({
            data: {
                ...user,
                password: hashedPassword,
                userBio: user.userBio || "",
            },
        });

        const verificationToken = generateToken(); // Implement this function
        const verificationUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/verify-email?token=${verificationToken}`;
        
        await prisma.user.update({
            where: { id: newUser.id },
            data: { 
                verificationToken,
                verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
            }
        });

        await sendVerificationEmail(
            newUser.email,
            newUser.firstName || "User",
            verificationUrl,
        );

        return newUser;
    } catch (error: any) {
        console.error(error);
        handleError(error);
        throw new Error(
            error.message || "An error occurred during user registration",
        );
    }
}


export async function loginUser(email: string, password: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) throw new Error("Invalid credentials");

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error("Invalid credentials");

        return user;
    } catch (error) {
        handleError(error);
    }
}

export async function verifyEmail(token: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });
        if (!user) throw new Error("Invalid token or user not found");
        if (user.verificationExpires && user.verificationExpires < new Date()) {
            throw new Error("Verification token has expired");
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { 
                isEmailVerified: true,
                verificationToken: null,
                verificationExpires: null
            },
        });

        return updatedUser;
    } catch (error) {
        handleError(error);
    }
}

export async function requestPasswordReset(email: string) {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error("User not found");

        const resetToken = uuidv4(); // Generate a UUID token
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour expiry

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordExpires: resetExpires,
            },
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/reset-password?token=${resetToken}`;
        await sendResetPasswordEmail(user.email, user.firstName || "User", resetUrl);

        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function resetPassword(token: string, newPassword: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { resetPasswordToken: token },
        });
        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new Error("Invalid or expired token");
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null },
        });

        return updatedUser;
    } catch (error) {
        handleError(error);
    }
}


export async function getUserById(userId: number) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) throw new Error("User not found");
        return user;
    } catch (error) {
        handleError(error);
    }
}

export async function updateUser(userId: number, user: UpdateUserParams) {
    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: user,
        });
        if (!updatedUser) throw new Error("User update failed");
        return updatedUser;
    } catch (error) {
        handleError(error);
    }
}

export async function deleteUser(userId: number) {
    try {
        const userToDelete = await prisma.user.findUnique({
            where: { id: userId },
        });
        if (!userToDelete) {
            throw new Error("User not found");
        }

        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });

        return deletedUser;
    } catch (error) {
        handleError(error);
    }
}

export async function updateCredits(userId: number, creditFee: number) {
    try {
        const updatedUserCredits = await prisma.user.update({
            where: { id: userId },
            data: {
                creditBalance: {
                    increment: creditFee,
                },
            },
        });

        if (!updatedUserCredits) throw new Error("User credits update failed");

        return updatedUserCredits;
    } catch (error) {
        handleError(error);
    }
}

export async function getUserByEmail(email: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) throw new Error("User not found");

        return user;
    } catch (error) {
        handleError(error);
    }
}
