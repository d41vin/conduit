export enum PaymentStatus {
    Created = 0,
    Accepted = 1,
    Submitted = 2,
    Released = 3,
    Refunded = 4
}

export interface PaymentSchema {
    id: number;
    principal: string;
    worker: string;
    verifier: string;
    amount: string; // Formatted USDC amount (string to avoid precision issues)
    conditionHash: string;
    status: PaymentStatus;
    createdAt: number;
    deadline: number;
}
