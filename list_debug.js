
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listAll() {
    const { data, error } = await supabase
        .from('gallery_media')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Found ${data.length} records.`);
    data.forEach(item => {
        // Log simplified output to spot weirdness easily
        console.log(`[${item.id}] ${item.url ? item.url.substring(0, 60) : 'NULL'}...`);
    });
}

listAll();
