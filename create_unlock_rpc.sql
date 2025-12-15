-- Ensure updated_at column exists (Safety Check)
alter table unlocked_memories add column if not exists updated_at timestamp with time zone default now();

-- Function to atomically append a memory ID to the unlocked list
create or replace function append_unlocked_memory(p_user_id uuid, p_memory_id int)
returns void as $$
declare
  current_ids jsonb;
begin
  -- Get current IDs or empty array, locking the row for update if it exists
  select ids into current_ids
  from unlocked_memories
  where user_id = p_user_id;

  if not found then
    -- Insert new row if not exists
    insert into unlocked_memories (user_id, ids)
    values (p_user_id, jsonb_build_array(p_memory_id));
  else
    -- Update existing row if ID not present
    if not (current_ids @> to_jsonb(p_memory_id)) then
      update unlocked_memories
      set ids = ids || to_jsonb(p_memory_id),
          updated_at = now()
      where user_id = p_user_id;
    end if;
  end if;
end;
$$ language plpgsql security definer;

-- Function to atomically remove a memory ID from the unlocked list
create or replace function remove_unlocked_memory(p_user_id uuid, p_memory_id int)
returns void as $$
begin
  update unlocked_memories
  set ids = ids - to_jsonb(p_memory_id)::text, -- Remove element by value (requires text cast for jsonb - operator)? 
            -- correction: jsonb - text removes key or element. But removing by value from array is tricky in older postgres.
            -- Better approach: Use jsonb_path_query_array or filter.
            -- Simple approach: Use a filter query.
      updated_at = now()
  where user_id = p_user_id
    and ids @> to_jsonb(p_memory_id);
    
  -- Actually, the operator `ids - 'value'` treats it as a key if object, or index/value if array?
  -- Postgres `jsonb - text` removes string element from array. But our IDs are numbers.
  -- Postgres `jsonb - integer` removes element at INDEX.
  -- To remove by VALUE (number), we need:
  -- `select jsonb_agg(elem) from jsonb_array_elements(ids) elem where elem != to_jsonb(p_memory_id)`
  
  -- Let's rewrite the update using a subquery filter
  update unlocked_memories
  set ids = (
    select coalesce(jsonb_agg(elem), '[]'::jsonb)
    from jsonb_array_elements(ids) elem
    where elem::int != p_memory_id
  ),
  updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;
