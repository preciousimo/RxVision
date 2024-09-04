"use server";
import { neon } from "@neondatabase/serverless";

export async function getData() {
    try {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error("DATABASE_URL is not defined");
        }
        const sql = neon(databaseUrl);
        const data = await sql`...`;
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error;
    }
}