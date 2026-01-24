"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSDK } from "@/lib/useSDK";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { id } from "ethers";
import { useUser } from "@clerk/nextjs";

// Default verifier (Agent) address - typically an env var
const VERIFIER_ADDRESS = process.env.NEXT_PUBLIC_VERIFIER_ADDRESS || "0x0000000000000000000000000000000000000000";

export default function CreatePayment() {
    const router = useRouter();
    const { user } = useUser();
    const { sdk, connect, account, error: walletError } = useSDK();
    const createPaymentMutation = useMutation(api.payments.create);

    const [formData, setFormData] = useState({
        amount: "",
        condition: "",
        deadlineDays: "7",
        verifier: ""
    });

    const [status, setStatus] = useState<"idle" | "approving" | "creating" | "saving" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sdk || !account) return;

        setStatus("approving");
        setErrorMessage("");

        try {
            setStatus("creating");

            // 1. Encrypt/Hash condition
            const conditionHash = id(formData.condition);
            // Calculate deadline
            const deadline = Math.floor(Date.now() / 1000) + (parseInt(formData.deadlineDays) * 24 * 60 * 60);

            // 2. Create Payment on-chain
            const txCreate = await sdk.createPayment(
                formData.amount,
                conditionHash,
                formData.verifier || VERIFIER_ADDRESS,
                deadline
            );

            setStatus("saving");
            const receipt = await txCreate.wait(); // Wait for confirmation

            // Find the PaymentCreated event to get the paymentId
            // In a real app we'd parse logs, but for now we might rely on the return value if it was a call, 
            // but it's a transaction. The receipt logs contain the ID.
            // However, we can also query the latest payment or just pass the params to backend to verify.
            // The SDK wrappers don't parse events automatically yet.
            // Better approach for MVP: get the transaction hash and payment count or similar.
            // The Convex backend needs the OnChainID.
            // Let's parse the logs or assume we can find it.
            // Contract emits PaymentCreated(paymentId, ...)

            // Basic log parsing (simplified for MVP)
            // We will loop through logs to find the topic for PaymentCreated
            // id("PaymentCreated(uint256,address,address,uint256,bytes32,uint256)")

            // For this MVP, let's fetch the latest payment count *before* and then assume it increased, 
            // OR better, parse the event from the receipt logs.

            let paymentId = "0";
            // Try to parse logs using SDK interface
            for (const log of receipt!.logs) {
                try {
                    const parsed = sdk.interface.parseLog({ topics: log.topics as string[], data: log.data });
                    if (parsed && parsed.name === "PaymentCreated") {
                        paymentId = parsed.args[0].toString();
                        break;
                    }
                } catch (e) {
                    // ensure we ignore logs we can't parse (like USDC logs)
                }
            }

            // 4. Save to Convex
            await createPaymentMutation({
                onChainId: paymentId,
                transactionHash: receipt!.hash,
                principalAddress: account,
                principalUserId: user?.id,
                verifierAddress: formData.verifier || VERIFIER_ADDRESS,
                amount: parseFloat(formData.amount),
                condition: formData.condition,
                conditionHash: conditionHash,
                deadline: deadline,
            });

            setStatus("success");
            setTimeout(() => router.push("/"), 2000);

        } catch (e: any) {
            console.error(e);
            setStatus("error");
            setErrorMessage(e.reason || e.message || "Something went wrong");
        }
    };

    if (!sdk) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <h2 className="text-2xl font-bold">Connect Wallet</h2>
                <p className="text-muted-foreground">You need to connect your wallet to create a payment.</p>
                <Button onClick={connect} size="lg">Connect Wallet</Button>
                {walletError && <p className="text-red-500">{walletError}</p>}
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Payment</CardTitle>
                    <CardDescription>
                        Create a conditional payment verified by an AI agent.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (USDC)</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                placeholder="100.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                                disabled={status !== "idle" && status !== "error"}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="verifier">Verifier Address (Agent)</Label>
                            <Input
                                id="verifier"
                                type="text"
                                placeholder="0x..."
                                value={formData.verifier}
                                onChange={(e) => setFormData({ ...formData, verifier: e.target.value })}
                                required
                                disabled={status !== "idle" && status !== "error"}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="condition">Condition (What needs to be done?)</Label>
                            <Textarea
                                id="condition"
                                placeholder="e.g. Translate the attached document to Spanish..."
                                value={formData.condition}
                                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                required
                                className="h-32"
                                disabled={status !== "idle" && status !== "error"}
                            />
                            <p className="text-xs text-muted-foreground">
                                This text will be hashed on-chain. The full text is stored securely off-chain.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="deadline">Deadline (Days)</Label>
                            <Input
                                id="deadline"
                                type="number"
                                min="1"
                                max="365"
                                value={formData.deadlineDays}
                                onChange={(e) => setFormData({ ...formData, deadlineDays: e.target.value })}
                                required
                                disabled={status !== "idle" && status !== "error"}
                            />
                        </div>

                        {status === "error" && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-md text-sm">
                                Error: {errorMessage}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                            disabled={status !== "idle" && status !== "error"}
                        >
                            {status === "idle" && "Create Payment"}
                            {status === "approving" && "Approving USDC..."}
                            {status === "creating" && "Creating Payment..."}
                            {status === "saving" && "Saving Details..."}
                            {status === "success" && "Success! Redirecting..."}
                            {status === "error" && "Try Again"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
