-- Add sort_order column to wishes
alter table wishes add column if not exists sort_order bigint;

-- Initialize sort_order for existing items (using creatd_at as fallback)
with ranked_wishes as (
  select id, row_number() over (order by created_at) as rn
  from wishes
)
update wishes
set sort_order = ranked_wishes.rn
from ranked_wishes
where wishes.id = ranked_wishes.id;

-- Enable Realtime for this column is already done since we enabled table
