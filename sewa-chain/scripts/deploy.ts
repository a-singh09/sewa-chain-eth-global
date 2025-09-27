// Deployment script for SewaChain smart contracts
import hre from "hardhat";

async function main() {
  console.log("🚀 Starting SewaChain contract deployment...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.warn(
      "⚠️  Low balance detected. You may need more ETH for deployment.",
    );
  }

  // Deploy URIDRegistry contract
  console.log("\\n📄 Deploying URIDRegistry contract...");
  const URIDRegistry = await hre.ethers.getContractFactory("URIDRegistry");
  const uridRegistry = await URIDRegistry.deploy();
  await uridRegistry.waitForDeployment();
  const uridRegistryAddress = await uridRegistry.getAddress();

  console.log("✅ URIDRegistry deployed to:", uridRegistryAddress);

  // Deploy DistributionTracker contract
  console.log("\\n📄 Deploying DistributionTracker contract...");
  const DistributionTracker = await hre.ethers.getContractFactory(
    "DistributionTracker",
  );
  const distributionTracker = await DistributionTracker.deploy();
  await distributionTracker.waitForDeployment();
  const distributionTrackerAddress = await distributionTracker.getAddress();

  console.log(
    "✅ DistributionTracker deployed to:",
    distributionTrackerAddress,
  );

  // Verify deployment by calling view functions
  console.log("\\n🔍 Verifying deployments...");

  try {
    const totalFamilies = await uridRegistry.getTotalFamilies();
    console.log("📊 URIDRegistry - Total families:", totalFamilies.toString());

    const totalDistributions = await distributionTracker.totalDistributions();
    console.log(
      "📊 DistributionTracker - Total distributions:",
      totalDistributions.toString(),
    );

    // Test cooldown periods
    const foodCooldown = await distributionTracker.DEFAULT_FOOD_COOLDOWN();
    console.log(
      "⏰ Food cooldown period:",
      (Number(foodCooldown) / 3600).toString(),
      "hours",
    );
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }

  // Display deployment summary
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("─".repeat(50));
  console.log(`URIDRegistry:       ${uridRegistryAddress}`);
  console.log(`DistributionTracker: ${distributionTrackerAddress}`);
  console.log("─".repeat(50));

  // Generate environment variables
  console.log("\n🔧 Environment Variables:");
  console.log("─".repeat(50));
  console.log(`NEXT_PUBLIC_URID_REGISTRY_ADDRESS=${uridRegistryAddress}`);
  console.log(
    `NEXT_PUBLIC_DISTRIBUTION_TRACKER_ADDRESS=${distributionTrackerAddress}`,
  );
  console.log("─".repeat(50));

  // Gas usage summary
  const deploymentReceipts = await Promise.all([
    uridRegistry.deploymentTransaction()?.wait(),
    distributionTracker.deploymentTransaction()?.wait(),
  ]);

  const totalGasUsed = deploymentReceipts.reduce((total, receipt) => {
    return total + (receipt?.gasUsed || 0n);
  }, 0n);

  console.log("\n⛽ Gas Usage Summary:");
  console.log("─".repeat(50));
  console.log(`Total Gas Used: ${totalGasUsed.toString()}`);
  console.log(
    `Estimated Cost: ${hre.ethers.formatEther(totalGasUsed * 20000000000n)} ETH (at 20 gwei)`,
  );
  console.log("─".repeat(50));

  console.log("\n✨ Ready to integrate with frontend!");
}

// Run deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
