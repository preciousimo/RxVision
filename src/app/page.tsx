import { Metadata } from "next";
import DefaultLayout from "@/components/Layouts/DefaultLayout";

export const metadata: Metadata = {
  title:
    "Rx Vision: a leading research platform for drug discovery",
  description: "...",
};

export default function Home() {
  return (
    <>
      <DefaultLayout>
        <p>Hello Dashboard Page!!</p>
      </DefaultLayout>
    </>
  );
}