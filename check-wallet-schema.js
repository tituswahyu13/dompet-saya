const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const key = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1];

const supabase = createClient(url, key);

async function checkWalletSchema() {
  console.log("🔍 Checking Wallet Schema Implementation...\n");

  try {
    // Check if wallets table exists and has data
    console.log("1. Checking wallets table...");
    const { data: wallets, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .limit(5);

    if (walletError) {
      console.error("❌ Wallets table error:", walletError.message);
    } else {
      console.log(
        `✅ Wallets table exists! Found ${wallets?.length || 0} wallet(s)`
      );
      if (wallets && wallets.length > 0) {
        console.log("   Sample wallet:", JSON.stringify(wallets[0], null, 2));
      }
    }

    // Check if transaction table has new columns
    console.log("\n2. Checking transaction table columns...");
    const { data: transactions, error: txError } = await supabase
      .from("transaction")
      .select(
        "id, keterangan, wallet_id, is_transfer, transfer_to_wallet_id, transfer_from_wallet_id"
      )
      .limit(3);

    if (txError) {
      console.error("❌ Transaction columns error:", txError.message);
    } else {
      console.log("✅ Transaction table updated!");
      if (transactions && transactions.length > 0) {
        console.log(
          "   Sample transaction:",
          JSON.stringify(transactions[0], null, 2)
        );

        // Check how many transactions are linked to wallets
        const linkedCount = transactions.filter((t) => t.wallet_id).length;
        console.log(
          `   ${linkedCount}/${transactions.length} transactions have wallet_id`
        );
      }
    }

    // Check wallet_balances view
    console.log("\n3. Checking wallet_balances view...");
    const { data: balances, error: balanceError } = await supabase
      .from("wallet_balances")
      .select("*")
      .limit(5);

    if (balanceError) {
      console.error("❌ Wallet balances view error:", balanceError.message);
    } else {
      console.log("✅ Wallet balances view working!");
      if (balances && balances.length > 0) {
        balances.forEach((w) => {
          console.log(
            `   ${w.icon} ${w.name}: Rp ${
              w.current_balance?.toLocaleString("id-ID") || 0
            }`
          );
        });
      }
    }

    console.log("\n✨ Schema check complete!");
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

checkWalletSchema();
