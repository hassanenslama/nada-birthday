
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://otzgnpwolxycdkulchfz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90emducHdvbHh5Y2RrdWxjaGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NzQ2MTEsImV4cCI6MjA4MTA1MDYxMX0.U5WNEitmIIrU56WnoZxT5kOUQbsnYE7vhXPK5oAPHDQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function scanMedia() {
    const { data: media, error } = await supabase
        .from('gallery_media')
        .select('id, url, title, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Scanned ${media.length} items.`);

    const validFiles = [
        '1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg',
        '10.jpg', '11.jpg', '12.jpg', '13.jpg', '14.jpg', '15.jpg', '16.jpg', '17.jpg', '18.jpg',
        'New Text Document.txt'
    ];

    media.forEach(item => {
        let isSuspicious = false;

        if (!item.url) {
            console.log(`[EMPTY URL] ID: ${item.id}`);
            isSuspicious = true;
        } else if (item.url.includes('[object Object]')) {
            console.log(`[OBJECT OBJECT] ID: ${item.id} | URL: ${item.url}`);
            isSuspicious = true;
        } else if (item.url.startsWith('/images/timeline/')) {
            // Check if file exists in our known list
            const filename = item.url.replace('/images/timeline/', '');
            if (!validFiles.includes(filename)) {
                console.log(`[MISSING FILE] ID: ${item.id} | URL: ${item.url}`);
                isSuspicious = true;
            }
        } else if (!item.url.startsWith('http')) {
            console.log(`[WEIRD URL] ID: ${item.id} | URL: ${item.url}`);
            isSuspicious = true;
        }

        if (isSuspicious) {
            // console.log('---');
        }
    });
}

scanMedia();
