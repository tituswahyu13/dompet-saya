import { supabase } from "./supabase";

/**
 * Auto-processes recurring transaction templates that are due
 * Runs client-side when the app loads or when manually triggered
 */
export async function processRecurringTransactions(userId: string) {
  try {
    // Step 1: Fetch all active recurring templates
    const { data: templates, error: fetchError } = await supabase
      .from("recurring_templates")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (fetchError) throw fetchError;
    if (!templates || templates.length === 0) return { processed: 0, errors: [] };

    const today = new Date();
    const currentDay = today.getDate();
    const processedTemplates: string[] = [];
    const errors: any[] = [];

    // Step 2: Check each template
    for (const template of templates) {
      // Check if template should execute today
      if (template.day_of_month !== currentDay) continue;

      // Check if already executed today
      if (template.last_generated) {
        const lastGenDate = new Date(template.last_generated);
        const isSameDay =
          lastGenDate.getDate() === today.getDate() &&
          lastGenDate.getMonth() === today.getMonth() &&
          lastGenDate.getFullYear() === today.getFullYear();

        if (isSameDay) continue; // Already executed today
      }

      // Step 3: Execute the transaction
      try {
        if (template.type === "transfer") {
          // Handle transfer (2 transactions)
          if (!template.target_wallet_id) {
            errors.push({
              template: template.keterangan,
              error: "Missing target wallet",
            });
            continue;
          }

          // Fetch wallet names
          const { data: wallets } = await supabase
            .from("wallet_balances")
            .select("id, name")
            .in("id", [template.wallet_id, template.target_wallet_id]);

          const fromWallet = wallets?.find((w) => w.id === template.wallet_id);
          const toWallet = wallets?.find((w) => w.id === template.target_wallet_id);

          // Withdrawal transaction
          await supabase.from("transaction").insert({
            user_id: userId,
            wallet_id: template.wallet_id,
            keterangan: `[AUTO] Transfer ke ${toWallet?.name || "Unknown"}`,
            kategori: "Transfer Keluar",
            income: 0,
            outcome: template.amount,
            saving: 0,
            tanggal: today.toISOString().split("T")[0],
            is_transfer: true,
            transfer_from_wallet_id: template.wallet_id,
            transfer_to_wallet_id: template.target_wallet_id,
          });

          // Deposit transaction
          await supabase.from("transaction").insert({
            user_id: userId,
            wallet_id: template.target_wallet_id,
            keterangan: `[AUTO] Transfer dari ${fromWallet?.name || "Unknown"}`,
            kategori: "Transfer Masuk",
            income: template.amount,
            outcome: 0,
            saving: 0,
            tanggal: today.toISOString().split("T")[0],
            is_transfer: true,
            transfer_from_wallet_id: template.wallet_id,
            transfer_to_wallet_id: template.target_wallet_id,
          });
        } else {
          // Handle regular transaction (income/outcome/saving)
          await supabase.from("transaction").insert({
            user_id: userId,
            wallet_id: template.wallet_id,
            keterangan: `[AUTO] ${template.keterangan}`,
            kategori: template.kategori,
            income: template.type === "income" ? template.amount : 0,
            outcome: template.type === "outcome" ? template.amount : 0,
            saving: template.type === "saving" ? template.amount : 0,
            tanggal: today.toISOString().split("T")[0],
            is_transfer: false,
          });
        }

        // Step 4: Update last_generated timestamp
        await supabase
          .from("recurring_templates")
          .update({ last_generated: new Date().toISOString() })
          .eq("id", template.id);

        processedTemplates.push(template.keterangan);
      } catch (error: any) {
        errors.push({
          template: template.keterangan,
          error: error.message,
        });
      }
    }

    return {
      processed: processedTemplates.length,
      templates: processedTemplates,
      errors,
    };
  } catch (error: any) {
    console.error("Error processing recurring transactions:", error);
    return { processed: 0, errors: [error.message] };
  }
}
