"use client";
import { Button } from "@/components/ui/button";
import { useChainStore } from "@/lib/stores/chain";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    redirect("/dashboard");
  }, []);

  return (
    <Link href={"/dashboard"}>
      <Button>Dashboard</Button>
    </Link>
  );
}
