import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log("=== DIAGNOSTIC REPORT ===\n");

    // 1. Check all users
    console.log("1. Checking users...");
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
        console.log("Cannot list users (need service role key for this)");
        console.log("Skipping user check...\n");
    } else {
        console.log("Users found:", users?.users?.length);
        users?.users?.forEach(u => {
            console.log(`  - ${u.email} (ID: ${u.id})`);
        });
        console.log("");
    }

    // 2. Check unlocked_memories table
    console.log("2. Checking unlocked_memories table...");
    const { data: unlocks, error: unlocksError } = await supabase
        .from('unlocked_memories')
        .select('*');

    if (unlocksError) {
        console.error("Error fetching unlocks:", unlocksError);
    } else {
        console.log("Unlocked memories rows:", unlocks?.length || 0);
        unlocks?.forEach(row => {
            console.log(`\n  User ID: ${row.user_id}`);
            console.log(`  Unlocked IDs: ${JSON.stringify(row.ids)}`);
            console.log(`  Type of first ID: ${typeof row.ids[0]}`);
            console.log(`  Count: ${row.ids?.length || 0}`);
        });
        console.log("");
    }

    // 3. Test Realtime
    console.log("3. Testing Realtime subscription...");
    const channel = supabase
        .channel('test_realtime')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'unlocked_memories'
        }, (payload) => {
            console.log("✅ Realtime event received:", payload);
        })
        .subscribe((status) => {
            console.log("Subscription status:", status);
        });

    console.log("Waiting 3 seconds to see if subscription connects...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("\n=== END DIAGNOSTIC ===");
    process.exit(0);
}

diagnose();
