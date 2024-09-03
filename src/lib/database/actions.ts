"use server";
import { neon } from "@neondatabase/serverless";

export async function getData() {
    const databaseUrl = process.env.DATABASE_URL || "null";
    const sql = neon(databaseUrl);
    const data = await sql`...`;
    return data;
}
