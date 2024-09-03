import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Index from "@/components/Dashboard";

export const metadata: Metadata = {
  title:
    "Rx Vision: a leading research platform for drug discovery",
  description: "...",
};

export default function Home() {
  return (
    <>
      <DefaultLayout>
        <Index/>
      </DefaultLayout>
    </>
  );
}