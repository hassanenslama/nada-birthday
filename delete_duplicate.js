
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteDuplicate() {
    const idToDelete = '4bd904a0-db2c-4afa-b07f-3ba9cb6c05b5';
    console.log("Deleting album:", idToDelete);
    const { error } = await supabase.from('albums').delete().eq('id', idToDelete);
    if (error) console.error("Error deleting:", error);
    else console.log("Deleted successfully.");
}

deleteDuplicate();
