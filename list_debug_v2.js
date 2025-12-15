
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findSuspicious() {
    const { data, error } = await supabase
        .from('gallery_media')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Scanning ${data.length} records...`);
    data.forEach(item => {
        if (!item.url || (!item.url.startsWith('/images') && !item.url.startsWith('http'))) {
            console.log(`[SUSPICIOUS] ID: ${item.id}`);
            console.log(`URL: ${item.url}`);
            console.log('---');
        } else if (item.url.includes('{')) {
            console.log(`[JSON DETECTED] ID: ${item.id}`);
            console.log(`URL: ${item.url}`);
            console.log('---');
        }
    });
}

findSuspicious();
