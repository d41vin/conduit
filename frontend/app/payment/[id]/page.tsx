"use client";

import { use, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useSDK } from "@/lib/useSDK";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatDistance } from "date-fns";
import { id } from "ethers";
import { useUser } from "@clerk/nextjs";

export default function PaymentDetails({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const onChainId = unwrappedParams.id;

    const payment = useQuery(api.payments.getByOnChainId, { onChainId });
    const paymentProof = useQuery(api.proofs.getByOnChainPaymentId, { onChainPaymentId: onChainId });
    const { user } = useUser();
    const { sdk, connect, account } = useSDK();

    const acceptMutation = useMutation(api.payments.accept);
    const submitProofMutation = useMutation(api.payments.markSubmitted);
    const saveProofMutation = useMutation(api.proofs.create);

    const [proofText, setProofText] = useState("");
    const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const isPrincipal = account && payment?.principalAddress.toLowerCase() === account.toLowerCase();
    const isWorker = account && payment?.workerAddress?.toLowerCase() === account.toLowerCase();

    // Actions
    const handleAccept = async () => {
        if (!sdk || !payment) return;
        setStatus("processing");
        try {
            const tx = await sdk.acceptPayment(Number(payment.onChainId));
            await tx.wait();

            await acceptMutation({
                onChainId: payment.onChainId,
                workerAddress: account!,
                workerUserId: user?.id,
            });
            setStatus("success");
        } catch (e: any) {
            console.error(e);
            setStatus("error");
            setErrorMessage(e.reason || e.message);
        }
    };

    const handleSubmitProof = async () => {
        if (!sdk || !payment) return;
        setStatus("processing");
        try {
            // 1. Hash the proof content
            const proofHash = id(proofText);

            // 2. Submit on-chain
            const tx = await sdk.submitProof(Number(payment.onChainId), proofHash);
            await tx.wait();

            // 3. Update Convex
            await saveProofMutation({
                paymentId: payment._id,
                onChainPaymentId: payment.onChainId,
                proofType: "text",
                proofText: proofText,
                proofHash: proofHash,
                submittedBy: account!,
            });

            await submitProofMutation({ onChainId: payment.onChainId });

            setStatus("success");
        } catch (e: any) {
            console.error(e);
            setStatus("error");
            setErrorMessage(e.reason || e.message);
        }
    };

    if (payment === undefined) {
        return <div className="p-8 text-center">Loading payment details...</div>;
    }

    if (payment === null) {
        return <div className="p-8 text-center text-red-500">Payment not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 container">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant={payment.status === "Released" ? "default" : "outline"} className="text-lg px-4 py-1">
                                    {payment.status}
                                </Badge>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-green-600">${payment.amount} USDC</div>
                                    <div className="text-sm text-muted-foreground">Escrow Amount</div>
                                </div>
                            </div>
                            <CardTitle className="text-2xl mb-2">Task Condition</CardTitle>
                            <CardDescription className="text-base text-foreground bg-muted p-4 rounded-md font-mono whitespace-pre-wrap">
                                {payment.condition}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                                <div>
                                    <div className="text-muted-foreground">Principal</div>
                                    <div className="font-mono truncate" title={payment.principalAddress}>{payment.principalAddress}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Verifier (Agent)</div>
                                    <div className="font-mono truncate" title={payment.verifierAddress}>{payment.verifierAddress}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Worker</div>
                                    <div className="font-mono truncate">
                                        {payment.workerAddress || "Unassigned"}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Deadline</div>
                                    <div>{new Date(payment.deadline * 1000).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDistance(new Date(payment.deadline * 1000), new Date(), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Proof Section */}
                    {(payment.status === "Submitted" || payment.status === "Released") && paymentProof && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Submitted Proof</CardTitle>
                                <CardDescription>Worker submitted this evidence for verification.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="bg-muted p-4 rounded-md whitespace-pre-wrap">
                                    {paymentProof.proofText}
                                </div>
                                <div className="mt-2 text-xs font-mono text-muted-foreground">
                                    Hash: {paymentProof.proofHash}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {!sdk ? (
                                <Button onClick={connect} className="w-full">Connect Wallet to Interact</Button>
                            ) : (
                                <>
                                    {/* ACCEPT FLOW */}
                                    {payment.status === "Created" && (
                                        <div className="space-y-2">
                                            {isPrincipal ? (
                                                <div className="text-sm text-center text-muted-foreground">
                                                    Waiting for a worker to accept.
                                                </div>
                                            ) : (
                                                <Button onClick={handleAccept} disabled={status === "processing"} className="w-full bg-green-600 hover:bg-green-700">
                                                    {status === "processing" ? "Processing..." : "Accept Job"}
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* SUBMIT FLOW */}
                                    {payment.status === "Accepted" && (
                                        <div className="space-y-4">
                                            {isWorker ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="proof">Work Proof (Text/Link)</Label>
                                                        <Textarea
                                                            id="proof"
                                                            placeholder="Paste completed work or link here..."
                                                            value={proofText}
                                                            onChange={(e) => setProofText(e.target.value)}
                                                        />
                                                    </div>
                                                    <Button onClick={handleSubmitProof} disabled={status === "processing" || !proofText} className="w-full">
                                                        {status === "processing" ? "Submitting..." : "Submit Proof"}
                                                    </Button>
                                                </>
                                            ) : (
                                                <div className="text-sm text-center text-muted-foreground">
                                                    Job is in progress by worker.<br />
                                                    <span className="font-mono text-xs">{payment.workerAddress?.slice(0, 6)}...{payment.workerAddress?.slice(-4)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* VERIFICATION FLOW */}
                                    {payment.status === "Submitted" && (
                                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md text-sm text-blue-800">
                                            Proof submitted. <br />
                                            <strong>AI Agent</strong> is verifying...
                                        </div>
                                    )}

                                    {payment.status === "Released" && (
                                        <div className="bg-green-50 border border-green-200 p-4 rounded-md text-sm text-center text-green-800 font-bold">
                                            Payment Released!
                                        </div>
                                    )}

                                    {status === "error" && (
                                        <div className="text-red-500 text-sm mt-2">{errorMessage}</div>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
