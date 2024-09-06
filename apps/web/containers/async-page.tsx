"use client";
import { Button } from "@/components/ui/button";
import { useChainStore } from "@/lib/stores/chain";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";

export default function Home() {
  const chainStore = useChainStore();

  return (
    <div className="">
      <nav>
        <div>
          {/*<Image src={} alt="" width={} height={} />*/}
          <h1>Mutuum Protocol</h1>
        </div>
        <Link href="/dashboard">
          <Button>Launch App</Button>
        </Link>
      </nav>

      <section>
        <div>
          <h1>Mutuum Protocol</h1>
          <p>I am still thinking of something</p>
        </div>
        <div>
          <Card>
            {/*<Image src={} alt="" width={} height={} />*/}
            <div>
              <h3>MINA</h3>
              <p>Mina Protocol</p>
              <p>$0.4155</p>
            </div>
          </Card>
          <Card>
            <h3>Block Number</h3>
            <p>{chainStore.block?.height ?? "-"}</p>
          </Card>
          <Card>
            <h3>Liquidity</h3>
            <p>$756,896</p>
          </Card>
          <Link href="/dashboard">
            <Button>Launch App</Button>
          </Link>
        </div>
      </section>

      <footer>
        {/*<Image src={} alt="" width={} height={} />*/}
        <h1>Mutuum Protocol</h1>
      </footer>
    </div>
  );
}
