
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteBroken() {
    const idToDelete = '0bce0c07-7771-4722-aa46-d144a0f2d7d7';
    console.log(`Deleting ID: ${idToDelete}...`);

    const { error } = await supabase
        .from('gallery_media')
        .delete()
        .eq('id', idToDelete);

    if (error) {
        console.error('Error deleting:', error);
    } else {
        console.log('Successfully deleted broken record.');
    }
}

deleteBroken();
