"use server";

import bcrypt from "bcrypt";
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client/edge'
import { handleError } from "../utils";
import { sendVerificationEmail, sendResetPasswordEmail } from "./email.actions";
import { withAccelerate } from '@prisma/extension-accelerate'

const prisma = new PrismaClient().$extends(withAccelerate())

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

        // First, create the user without verification info
        const newUser = await prisma.user.create({
            data: {
                ...user,
                password: hashedPassword,
                userBio: user.userBio || "",
            },
        });

        // Now, generate the verification token
        const verificationToken = uuidv4();
        const verificationUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/verify-email?token=${verificationToken}`;

        // Update the user with the verification info
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
        console.log("Verifying token:", token);

        // Validate token format
        if (!isValidUUID(token)) {
            return { status: 'invalid_format', message: "Invalid token format" };
        }

        const user = await prisma.user.findUnique({
            where: { verificationToken: token },
        });

        if (!user) {
            console.log("User not found for token:", token);
            return { status: 'not_found', message: "Invalid token or user not found" };
        }

        console.log("User found:", user);

        // Check if the verification token has expired
        if (user.verificationExpires && user.verificationExpires < new Date()) {
            return { status: 'expired', message: "Verification token has expired" };
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                isEmailVerified: true,
                verificationToken: null,
                verificationExpires: null,
            },
        });

        console.log("User verified successfully:", updatedUser);
        return { status: 'success', message: "Email verified successfully" };

    } catch (error) {
        console.error("Verification error:", error);
        return { status: 'error', message: "An unknown error occurred during verification" };
    }
}

function isValidUUID(uuid: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

export async function checkIfAlreadyVerified(token: string) {
    try {
        // First, try to find a user with this token
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { verificationToken: token },
                    { resetPasswordToken: token }
                ]
            }
        });

        if (!user) {
            return false; // No user found with this token
        }

        // Check if the user is already verified
        return user.isEmailVerified;
    } catch (error) {
        console.error("Error checking verification status:", error);
        return false; // Assume not verified in case of error
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
