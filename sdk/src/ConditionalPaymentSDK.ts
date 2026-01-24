import { Contract, Interface, Signer, formatUnits, parseUnits } from "ethers";
import { ConditionalPaymentABI } from "./abi/ConditionalPayment";
import { PaymentStatus } from "./types";

export class ConditionalPaymentSDK {
    public contract: Contract;
    public interface: Interface;

    /**
     * Initialize the SDK with a contract address and signer/provider
     * @param address Deployed ConditionalPayment contract address
     * @param signerOrProvider Ethers signer or provider
     */
    constructor(address: string, public signerOrProvider: any) {
        this.contract = new Contract(address, ConditionalPaymentABI, signerOrProvider);
        this.interface = new Interface(ConditionalPaymentABI);
    }

    // ============ Read Functions ============

    /**
     * Get total number of payments created
     */
    async getPaymentCount(): Promise<number> {
        const count = await this.contract.paymentCounter();
        return Number(count);
    }

    /**
     * Get payment details by ID
     * @param paymentId Payment ID
     */
    async getPayment(paymentId: number) {
        const payment = await this.contract.getPayment(paymentId);
        return {
            id: Number(payment.id),
            principal: payment.principal,
            worker: payment.worker,
            verifier: payment.verifier,
            amount: formatUnits(payment.amount, 18), // Native token has 18 decimals
            conditionHash: payment.conditionHash,
            status: Number(payment.status) as PaymentStatus,
            createdAt: Number(payment.createdAt),
            deadline: Number(payment.deadline)
        };
    }

    // ============ Write Functions ============

    /**
     * Create a new payment
     * @param amount USDC/Native amount (e.g. "1.50")
     * @param conditionHash Hash of the condition text
     * @param verifier Address of the verifier
     * @param deadline Unix timestamp
     * @returns Transaction response
     */
    async createPayment(
        amount: string,
        conditionHash: string,
        verifier: string,
        deadline: number
    ) {
        // Send native currency (assuming 18 decimals for L1 native token)
        const value = parseUnits(amount, 18);
        return await this.contract.createPayment(conditionHash, verifier, deadline, { value });
    }

    /**
     * Accept a payment
     * @param paymentId Payment ID
     */
    async acceptPayment(paymentId: number) {
        return await this.contract.acceptPayment(paymentId);
    }

    /**
     * Submit proof for a payment
     * @param paymentId Payment ID
     * @param proofHash Hash of the proof content
     */
    async submitProof(paymentId: number, proofHash: string) {
        return await this.contract.submitProof(paymentId, proofHash);
    }

    /**
     * Verify a payment (Called by AI Agent)
     * @param paymentId Payment ID
     * @param approved True to release funds, false to reject
     */
    async verify(paymentId: number, approved: boolean) {
        return await this.contract.verify(paymentId, approved);
    }

    /**
     * Cancel payment (Principal only, before acceptance)
     * @param paymentId Payment ID
     */
    async cancelPayment(paymentId: number) {
        return await this.contract.cancelPayment(paymentId);
    }

    /**
     * Refund payment after timeout
     * @param paymentId Payment ID
     */
    async refundOnTimeout(paymentId: number) {
        return await this.contract.refundOnTimeout(paymentId);
    }
}
