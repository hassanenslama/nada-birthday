-- تحديث البايو لحساب حسانين
-- التاريخ: 22-12-2024

UPDATE public.user_profiles
SET 
    bio = 'والسيف في الغمد لا اخشي مضاربه وسيف عيني "ندى" في الحالتين بتار',
    -- هنخلي تاريخ التحديث هو التاريخ اللي طلبته
    bio_updated_at = '2024-12-22 22:22:00+00'
WHERE id = '1e965797-9b29-4851-bc13-fd51e5671bd6';

-- التأكد من التحديث
SELECT display_name, bio, bio_updated_at FROM public.user_profiles WHERE id = '1e965797-9b29-4851-bc13-fd51e5671bd6';
