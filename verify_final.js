import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log("\n=== DATABASE VERIFICATION ===\n");

    const { data, error } = await supabase
        .from('unlocked_memories')
        .select('*');

    if (error) {
        console.error("❌ Error querying database:", error.message);
        process.exit(1);
    }

    if (!data || data.length === 0) {
        console.log("❌ Database table is EMPTY");
        console.log("\nThe game is not writing to database successfully.");
        console.log("Did you run: fix_unlocked_memories_rls.sql ?");
    } else {
        console.log(`✅ Found ${data.length} user(s) with unlocked memories:\n`);
        data.forEach(row => {
            console.log(`User ID: ${row.user_id}`);
            console.log(`Unlocked IDs: ${JSON.stringify(row.ids)}`);
            console.log(`Count: ${row.ids.length} photos`);
            console.log(`Last updated: ${row.updated_at}\n`);
        });
        console.log("✅ DATA IS IN DATABASE!");
        console.log("\nIf Gallery still shows locked:");
        console.log("1. Navigate to معرض الذكريات (Gallery)");
        console.log("2. Open Developer Console (F12)");
        console.log("3. Look for these messages:");
        console.log("   - '🎬 MemoriesGallery mounted'");
        console.log("   - 'Fetching unlocked memories'");
        console.log("   - 'Loaded unlocked IDs: [...]'");
        console.log("\nIf you DON'T see those messages:");
        console.log("- The Gallery page isn't loading");
        console.log("- Try refreshing the page");
    }

    process.exit(0);
}

verify();
