// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ConditionalPayment is ReentrancyGuard {
    // Error definitions
    error InvalidAmount();
    error InvalidDeadline();
    error InvalidAddress();
    error InvalidStatus();
    error PaymentNotFound();
    error NotAuthorized();
    error DeadlineNotExpired();
    error DeadlineExpired();
    error TransferFailed();

    // Enum for payment status
    enum PaymentStatus {
        Created, // 0
        Accepted, // 1
        Submitted, // 2
        Released, // 3
        Refunded // 4
    }

    struct Payment {
        uint256 id;
        address principal;
        address worker;
        address verifier;
        uint256 amount;
        bytes32 conditionHash;
        PaymentStatus status;
        uint256 createdAt;
        uint256 deadline;
    }

    // State variables
    uint256 public paymentCounter;
    mapping(uint256 => Payment) public payments;

    // Events
    event PaymentCreated(
        uint256 indexed paymentId,
        address indexed principal,
        address indexed verifier,
        uint256 amount,
        bytes32 conditionHash,
        uint256 deadline
    );

    event PaymentAccepted(uint256 indexed paymentId, address indexed worker);

    event ProofSubmitted(uint256 indexed paymentId, bytes32 proofHash);

    event PaymentVerified(uint256 indexed paymentId, bool approved);

    event PaymentReleased(
        uint256 indexed paymentId,
        address indexed worker,
        uint256 amount
    );

    event PaymentRefunded(
        uint256 indexed paymentId,
        address indexed principal,
        uint256 amount
    );

    constructor() {}

    /**
     * @notice Create a new conditional payment
     * @param _conditionHash Hash of the condition text (stored off-chain)
     * @param _verifier Address of the AI verifier agent
     * @param _deadline Unix timestamp when payment expires
     * @return paymentId The ID of the created payment
     */
    function createPayment(
        bytes32 _conditionHash,
        address _verifier,
        uint256 _deadline
    ) external payable nonReentrant returns (uint256 paymentId) {
        if (msg.value == 0) revert InvalidAmount();
        if (_deadline <= block.timestamp) revert InvalidDeadline();
        if (_verifier == address(0)) revert InvalidAddress();

        uint256 amount = msg.value;
        paymentCounter++;
        paymentId = paymentCounter;

        payments[paymentId] = Payment({
            id: paymentId,
            principal: msg.sender,
            worker: address(0),
            verifier: _verifier,
            amount: amount,
            conditionHash: _conditionHash,
            status: PaymentStatus.Created,
            createdAt: block.timestamp,
            deadline: _deadline
        });

        emit PaymentCreated(
            paymentId,
            msg.sender,
            _verifier,
            amount,
            _conditionHash,
            _deadline
        );
    }

    /**
     * @notice Accept a payment job as a worker
     * @param _paymentId The payment to accept
     */
    function acceptPayment(uint256 _paymentId) external {
        Payment storage payment = payments[_paymentId];

        if (payment.id == 0) revert PaymentNotFound();
        if (payment.status != PaymentStatus.Created) revert InvalidStatus();
        if (payment.deadline <= block.timestamp) revert DeadlineExpired();
        if (msg.sender == payment.principal) revert InvalidAddress(); // Principal cannot be worker

        payment.worker = msg.sender;
        payment.status = PaymentStatus.Accepted;

        emit PaymentAccepted(_paymentId, msg.sender);
    }

    /**
     * @notice Submit proof of completion (triggers off-chain verification)
     * @param _paymentId The payment ID
     * @param _proofHash Hash of the proof data
     */
    function submitProof(uint256 _paymentId, bytes32 _proofHash) external {
        Payment storage payment = payments[_paymentId];

        if (payment.id == 0) revert PaymentNotFound();
        if (payment.worker != msg.sender) revert NotAuthorized();
        if (payment.status != PaymentStatus.Accepted) revert InvalidStatus();
        if (payment.deadline <= block.timestamp) revert DeadlineExpired();

        payment.status = PaymentStatus.Submitted;

        emit ProofSubmitted(_paymentId, _proofHash);
    }

    /**
     * @notice Verify proof and release or reject payment (called by AI verifier)
     * @param _paymentId The payment ID
     * @param _approved Whether the proof is approved
     */
    function verify(uint256 _paymentId, bool _approved) external nonReentrant {
        Payment storage payment = payments[_paymentId];

        if (payment.id == 0) revert PaymentNotFound();
        if (msg.sender != payment.verifier) revert NotAuthorized();
        if (payment.status != PaymentStatus.Submitted) revert InvalidStatus();

        if (_approved) {
            payment.status = PaymentStatus.Released;
            _safeTransfer(payment.worker, payment.amount);
            emit PaymentReleased(_paymentId, payment.worker, payment.amount);
            emit PaymentVerified(_paymentId, true);
        } else {
            // If rejected, go back to Accepted status to allow resubmission
            // Or could go to Refunded depending on rules. For now, allow retry.
            payment.status = PaymentStatus.Accepted;
            emit PaymentVerified(_paymentId, false);
        }
    }

    /**
     * @notice Refund payment after deadline expires (anyone can call)
     * @param _paymentId The payment ID
     */
    function refundOnTimeout(uint256 _paymentId) external nonReentrant {
        Payment storage payment = payments[_paymentId];

        if (payment.id == 0) revert PaymentNotFound();
        if (
            payment.status == PaymentStatus.Released ||
            payment.status == PaymentStatus.Refunded
        ) revert InvalidStatus();
        if (payment.deadline > block.timestamp) revert DeadlineNotExpired();

        payment.status = PaymentStatus.Refunded;
        _safeTransfer(payment.principal, payment.amount);

        emit PaymentRefunded(_paymentId, payment.principal, payment.amount);
    }

    /**
     * @notice Cancel payment before it's accepted (principal only)
     * @param _paymentId The payment ID
     */
    function cancelPayment(uint256 _paymentId) external nonReentrant {
        Payment storage payment = payments[_paymentId];

        if (payment.id == 0) revert PaymentNotFound();
        if (msg.sender != payment.principal) revert NotAuthorized();
        if (payment.status != PaymentStatus.Created) revert InvalidStatus();

        payment.status = PaymentStatus.Refunded;
        _safeTransfer(payment.principal, payment.amount);

        emit PaymentRefunded(_paymentId, payment.principal, payment.amount);
    }

    function getPayment(
        uint256 _paymentId
    ) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    // Internal helper for safe transfer
    function _safeTransfer(address to, uint256 amount) internal {
        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }
}
