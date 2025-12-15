-- إصلاح اسم ندى في قاعدة البيانات
-- المشكلة: حساب ندى (977fb3ef-9f0d-44a6-8bde-c4c2f693db3d) واخد اسم "Hassanen" بالغلط.
-- الحل: الكود ده هيعدل الاسم ويرجعه "Nada".

UPDATE public.user_profiles 
SET 
  display_name = 'Nada'
WHERE id = '977fb3ef-9f0d-44a6-8bde-c4c2f693db3d';

-- تأكيد الإصلاح (اختياري)
SELECT * FROM public.user_profiles WHERE id = '977fb3ef-9f0d-44a6-8bde-c4c2f693db3d';
