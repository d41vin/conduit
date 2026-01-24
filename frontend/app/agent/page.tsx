"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSDK } from "@/lib/useSDK";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";

export default function AgentDashboard() {
    // Use the custom query that joins payments with proofs
    const payments = useQuery(api.payments.listSubmittedWithProofs, {});
    const verifyMutation = useMutation(api.payments.updateAfterVerification);
    const saveVerificationMutation = useMutation(api.verifications.create);

    const { sdk, connect, account } = useSDK();
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Payments are already filtered by the query
    const submittedPayments = payments || [];

    const handleVerify = async (payment: any, approved: boolean) => {
        if (!sdk) return;
        setProcessingId(payment._id);

        try {
            // 1. Verify on-chain
            console.log(`Verifying payment ${payment.onChainId} as ${approved ? "Approved" : "Rejected"}`);
            const tx = await sdk.verify(Number(payment.onChainId), approved);
            await tx.wait();

            // 2. Save verification record
            await saveVerificationMutation({
                paymentId: payment._id,
                onChainPaymentId: payment.onChainId,
                approved,
                confidence: 0.99, // Simulated confidence
                reason: approved ? "Proof verified successfully against criteria." : "Proof failed verification.",
                transactionHash: tx.hash,
            });

            // 3. Update payment status in DB
            await verifyMutation({
                onChainId: payment.onChainId,
                approved
            });

        } catch (e: any) {
            console.error("Verification failed", e);
            alert("Verification failed: " + (e.message || "Unknown error"));
        } finally {
            setProcessingId(null);
        }
    };

    if (!sdk) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[60vh]">
                <h1 className="text-2xl font-bold mb-4">Agent Verification Portal</h1>
                <p className="text-muted-foreground mb-6">Connect the authorized agent wallet to process verifications.</p>
                <Button onClick={connect} size="lg">Connect Agent Wallet</Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Pending Verifications</h1>
                    <p className="text-muted-foreground">Review and verify submitted proofs.</p>
                </div>
                <div className="bg-muted px-4 py-2 rounded-md font-mono text-sm border">
                    Agent: {account}
                </div>
            </div>

            <div className="grid gap-6">
                {submittedPayments.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">No payments waiting for verification.</p>
                    </div>
                ) : (
                    submittedPayments.map((payment) => (
                        <Card key={payment._id} className="border-l-4 border-l-yellow-500">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant="outline" className="mb-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                                            {payment.status}
                                        </Badge>
                                        <CardTitle className="text-xl">{payment.condition}</CardTitle>
                                        <CardDescription>Payment ID: {payment.onChainId}</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold block">${payment.amount} USDC</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="p-4 bg-muted rounded-md border">
                                        <div className="font-semibold text-sm mb-2 text-foreground">Proof Content</div>
                                        <div className="whitespace-pre-wrap text-sm font-mono text-muted-foreground">
                                            {payment.proofText || "No text content provided."}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                                        <span className="font-semibold">Hash:</span>
                                        <span className="truncate">{payment.proofHash || "Not synced"}</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-4">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleVerify(payment, true)}
                                        disabled={!!processingId}
                                    >
                                        {processingId === payment._id ? "Processing..." : "Approve & Release Funds"}
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        variant="destructive"
                                        onClick={() => handleVerify(payment, false)}
                                        disabled={!!processingId}
                                    >
                                        Reject Proof
                                    </Button>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-muted/50 py-3">
                                <Link href={`/payment/${payment.onChainId}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                    View Full Details & History &rarr;
                                </Link>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
