// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ConditionalPayment.sol";

/**
 * @title ConditionalPaymentTest
 * @notice Tests for the core happy path: create → accept → submit → verify → release
 * using Native Currency (Arc/USDC)
 */
contract ConditionalPaymentTest is Test {
    ConditionalPayment public escrow;

    address public principal = makeAddr("principal");
    address public worker = makeAddr("worker");
    address public verifier = makeAddr("verifier");

    uint256 constant AMOUNT = 100 * 1e18; // 100 Native Token (assuming 18 decimals usually, but if USDC is native it might be 6 or 18. Treating as unit)
    bytes32 constant CONDITION_HASH = keccak256("Deliver a working website");
    bytes32 constant PROOF_HASH = keccak256("Here is the proof of completion");

    function setUp() public {
        // Deploy escrow contract (no constructor args)
        escrow = new ConditionalPayment();

        // Fund principal with Native Token
        vm.deal(principal, 1000 * 1e18);
    }

    // ============ Happy Path Tests ============

    function test_CreatePayment() public {
        uint256 deadline = block.timestamp + 7 days;
        uint256 principalBalanceBefore = principal.balance;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        assertEq(paymentId, 1);

        ConditionalPayment.Payment memory payment = escrow.getPayment(
            paymentId
        );
        assertEq(payment.principal, principal);
        assertEq(payment.worker, address(0));
        assertEq(payment.verifier, verifier);
        assertEq(payment.amount, AMOUNT);
        assertEq(payment.conditionHash, CONDITION_HASH);
        assertEq(
            uint256(payment.status),
            uint256(ConditionalPayment.PaymentStatus.Created)
        );
        assertEq(payment.deadline, deadline);

        // Verify Funds transferred to escrow
        assertEq(address(escrow).balance, AMOUNT);
        assertEq(principal.balance, principalBalanceBefore - AMOUNT);
    }

    function test_AcceptPayment() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.prank(worker);
        escrow.acceptPayment(paymentId);

        ConditionalPayment.Payment memory payment = escrow.getPayment(
            paymentId
        );
        assertEq(payment.worker, worker);
        assertEq(
            uint256(payment.status),
            uint256(ConditionalPayment.PaymentStatus.Accepted)
        );
    }

    function test_SubmitProof() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.prank(worker);
        escrow.acceptPayment(paymentId);

        vm.prank(worker);
        escrow.submitProof(paymentId, PROOF_HASH);

        ConditionalPayment.Payment memory payment = escrow.getPayment(
            paymentId
        );
        assertEq(
            uint256(payment.status),
            uint256(ConditionalPayment.PaymentStatus.Submitted)
        );
    }

    function test_VerifyAndRelease() public {
        uint256 deadline = block.timestamp + 7 days;
        uint256 workerBalanceBefore = worker.balance;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.prank(worker);
        escrow.acceptPayment(paymentId);

        vm.prank(worker);
        escrow.submitProof(paymentId, PROOF_HASH);

        // Verifier approves
        vm.prank(verifier);
        escrow.verify(paymentId, true);

        ConditionalPayment.Payment memory payment = escrow.getPayment(
            paymentId
        );
        assertEq(
            uint256(payment.status),
            uint256(ConditionalPayment.PaymentStatus.Released)
        );

        // Verify Funds transferred to worker
        assertEq(worker.balance, workerBalanceBefore + AMOUNT);
        assertEq(address(escrow).balance, 0);
    }

    function test_VerifyReject_AllowsResubmit() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.prank(worker);
        escrow.acceptPayment(paymentId);

        vm.prank(worker);
        escrow.submitProof(paymentId, PROOF_HASH);

        // Verifier rejects
        vm.prank(verifier);
        escrow.verify(paymentId, false);

        ConditionalPayment.Payment memory payment = escrow.getPayment(
            paymentId
        );
        // Status should be back to Accepted, allowing resubmission
        assertEq(
            uint256(payment.status),
            uint256(ConditionalPayment.PaymentStatus.Accepted)
        );

        // Worker can resubmit
        bytes32 newProofHash = keccak256("Here is the updated proof");
        vm.prank(worker);
        escrow.submitProof(paymentId, newProofHash);

        payment = escrow.getPayment(paymentId);
        assertEq(
            uint256(payment.status),
            uint256(ConditionalPayment.PaymentStatus.Submitted)
        );
    }

    function test_CancelPayment() public {
        uint256 deadline = block.timestamp + 7 days;
        uint256 principalBalanceBefore = principal.balance;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        assertEq(principal.balance, principalBalanceBefore - AMOUNT);

        vm.prank(principal);
        escrow.cancelPayment(paymentId);

        ConditionalPayment.Payment memory payment = escrow.getPayment(
            paymentId
        );
        assertEq(
            uint256(payment.status),
            uint256(ConditionalPayment.PaymentStatus.Refunded)
        );

        // Principal gets refund
        assertEq(principal.balance, principalBalanceBefore);
    }

    function test_RefundOnTimeout() public {
        uint256 deadline = block.timestamp + 7 days;
        uint256 principalBalanceBefore = principal.balance;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.prank(worker);
        escrow.acceptPayment(paymentId);

        // Fast forward past deadline
        vm.warp(deadline + 1);

        // Anyone can trigger refund
        escrow.refundOnTimeout(paymentId);

        ConditionalPayment.Payment memory payment = escrow.getPayment(
            paymentId
        );
        assertEq(
            uint256(payment.status),
            uint256(ConditionalPayment.PaymentStatus.Refunded)
        );

        // Principal gets refund
        assertEq(principal.balance, principalBalanceBefore);
    }

    // ============ Access Control Tests ============

    function test_RevertWhen_NonWorkerSubmitsProof() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.prank(worker);
        escrow.acceptPayment(paymentId);

        // Someone else tries to submit proof
        address attacker = makeAddr("attacker");
        vm.prank(attacker);
        vm.expectRevert(ConditionalPayment.NotAuthorized.selector);
        escrow.submitProof(paymentId, PROOF_HASH);
    }

    function test_RevertWhen_NonVerifierVerifies() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.prank(worker);
        escrow.acceptPayment(paymentId);

        vm.prank(worker);
        escrow.submitProof(paymentId, PROOF_HASH);

        // Someone else tries to verify
        address attacker = makeAddr("attacker");
        vm.prank(attacker);
        vm.expectRevert(ConditionalPayment.NotAuthorized.selector);
        escrow.verify(paymentId, true);
    }

    function test_RevertWhen_NonPrincipalCancels() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        // Someone else tries to cancel
        vm.prank(worker);
        vm.expectRevert(ConditionalPayment.NotAuthorized.selector);
        escrow.cancelPayment(paymentId);
    }

    // ============ Edge Case Tests ============

    function test_RevertWhen_AcceptExpiredPayment() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        // Fast forward past deadline
        vm.warp(deadline + 1);

        vm.prank(worker);
        vm.expectRevert(ConditionalPayment.DeadlineExpired.selector);
        escrow.acceptPayment(paymentId);
    }

    function test_RevertWhen_RefundBeforeDeadline() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.expectRevert(ConditionalPayment.DeadlineNotExpired.selector);
        escrow.refundOnTimeout(paymentId);
    }

    function test_RevertWhen_CancelAfterAccepted() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        uint256 paymentId = escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            deadline
        );

        vm.prank(worker);
        escrow.acceptPayment(paymentId);

        vm.prank(principal);
        vm.expectRevert(ConditionalPayment.InvalidStatus.selector);
        escrow.cancelPayment(paymentId);
    }

    function test_RevertWhen_ZeroAmount() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        vm.expectRevert(ConditionalPayment.InvalidAmount.selector);
        // Using low-level call to check revert for 0 value, but createPayment checks msg.value
        // But solidity compiler might handle it?
        // Actually, createPayment checks `if (msg.value == 0) revert InvalidAmount();`
        escrow.createPayment{value: 0}(CONDITION_HASH, verifier, deadline);
    }

    function test_RevertWhen_PastDeadline() public {
        uint256 pastDeadline = block.timestamp - 1;

        vm.prank(principal);
        vm.expectRevert(ConditionalPayment.InvalidDeadline.selector);
        escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            verifier,
            pastDeadline
        );
    }

    function test_RevertWhen_ZeroVerifier() public {
        uint256 deadline = block.timestamp + 7 days;

        vm.prank(principal);
        vm.expectRevert(ConditionalPayment.InvalidAddress.selector);
        escrow.createPayment{value: AMOUNT}(
            CONDITION_HASH,
            address(0),
            deadline
        );
    }
}
