"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistance } from "date-fns";

export default function Home() {
  const payments = useQuery(api.payments.listAvailable, { limit: 50 });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex justify-between items-center py-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Find tasks, submit work, get paid in USDC. Verified by AI.
          </p>
        </div>
        <Link href="/create">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700">
            Create Payment
          </Button>
        </Link>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {payments === undefined ? (
          // Loading skeletons
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-64 bg-muted/50" />
          ))
        ) : payments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-xl text-muted-foreground">No active payments found.</p>
            <Button variant="link" asChild className="mt-2">
              <Link href="/create">Be the first to create one!</Link>
            </Button>
          </div>
        ) : (
          payments.map((payment) => (
            <Card key={payment._id} className="flex flex-col hover:border-indigo-500/50 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <Badge variant="outline" className="mb-2">
                    {payment.status}
                  </Badge>
                  <span className="font-mono text-lg font-bold text-green-600">
                    ${payment.amount} USDC
                  </span>
                </div>
                <CardTitle className="line-clamp-2">{payment.condition}</CardTitle>
                <CardDescription className="line-clamp-1 font-mono text-xs text-muted-foreground mt-1">
                  ID: {payment.onChainId}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-sm text-muted-foreground">
                  <p>Deadline: {new Date(payment.deadline * 1000).toLocaleDateString()}</p>
                  <p className="text-xs mt-1">
                    Expires {formatDistance(new Date(payment.deadline * 1000), new Date(), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/payment/${payment.onChainId}`} className="w-full">
                  <Button className="w-full" variant="secondary">
                    View Details
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
