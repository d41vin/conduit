import { useState, useEffect } from "react";
import { BrowserProvider, Signer } from "ethers";
import { ConditionalPaymentSDK } from "@d41vin/conditional-payment-sdk";

// Use environment variable for contract address (will be set after deployment)
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";

export function useSDK() {
    const [sdk, setSdk] = useState<ConditionalPaymentSDK | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
            const init = async () => {
                try {
                    const provider = new BrowserProvider((window as any).ethereum);
                    const signer = await provider.getSigner();
                    const address = await signer.getAddress();

                    setSigner(signer);
                    setAccount(address);

                    const sdkInstance = new ConditionalPaymentSDK(CONTRACT_ADDRESS, signer);
                    setSdk(sdkInstance);
                } catch (e) {
                    console.error("Failed to initialize SDK:", e);
                    setError("Failed to connect wallet");
                }
            };

            init();
        }
    }, []);

    const connect = async () => {
        if (typeof window !== "undefined" && (window as any).ethereum) {
            try {
                await (window as any).ethereum.request({ method: "eth_requestAccounts" });
                window.location.reload(); // Reload to re-init SDK
            } catch (e) {
                console.error("Connection failed:", e);
                setError("User rejected connection");
            }
        } else {
            setError("No wallet found");
        }
    };

    return { sdk, signer, account, connect, error };
}
