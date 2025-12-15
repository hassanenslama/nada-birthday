
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

run(supabaseUrl, supabaseAnonKey);

async function run(url, key) {
    const supabase = createClient(url, key);

    console.log("Checking public.user_profiles...");
    const { data: profiles, error } = await supabase.from('user_profiles').select('*');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log("Profiles found:", profiles.length);
    console.table(profiles);

    // Check specifically for Nada
    const nadaId = '977fb3ef-9f0d-44a6-8bde-c4c2f693db3d';
    const nada = profiles.find(p => p.id === nadaId);

    if (!nada) {
        console.log("ACA! Nada profile MISSING. Attempting to create...");
        const { error: insertError } = await supabase.from('user_profiles').insert({
            id: nadaId,
            display_name: 'Nada',
            profile_picture: null
            // username might not be in the table based on standard templates, but I'll omit it to be safe or check existing keys from the console.table output first if I could.
            // But I'll just try safe columns first.
        }).select();

        if (insertError) {
            console.error("Insert failed:", insertError);
            // If failed due to extra column, I might need to adjust.
        } else {
            console.log("SUCCESS! Created Nada profile.");
        }
    } else {
        console.log("Nada profile exists:", nada);
        if (nada.display_name === 'Hassanen') {
            console.log("CORRECTING NAME... Changing 'Hassanen' to 'Nada'...");
            const { error: updateError } = await supabase.from('user_profiles').update({ display_name: 'Nada' }).eq('id', nadaId);
            if (!updateError) console.log("SUCCESS! Name corrected.");
            else console.error("Update failed", updateError);
        }
    }
}

