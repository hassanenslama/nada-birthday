-- Update Wishes Status Constraint
alter table wishes drop constraint if exists wishes_status_check;

alter table wishes add constraint wishes_status_check 
check (status in ('pending', 'waiting_confirmation', 'completed', 'pending_delete', 'deleted'));
