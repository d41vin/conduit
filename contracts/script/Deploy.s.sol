// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ConditionalPayment} from "../src/ConditionalPayment.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        ConditionalPayment conditionalPayment = new ConditionalPayment();

        console.log(
            "ConditionalPayment deployed at:",
            address(conditionalPayment)
        );

        vm.stopBroadcast();
    }
}
