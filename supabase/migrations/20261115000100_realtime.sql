-- Live dashboards: let Supabase Realtime announce changes to these tables.
--
-- The dashboards listen for these announcements and reload their charts the
-- moment an order is placed, paid or moved along. Row Level Security still
-- applies: each signed-in user only hears about rows they are allowed to read.
--
-- Run this once in the SQL Editor, after the init migration. Without it the
-- dashboards still update, but only every 30 seconds.
alter publication supabase_realtime add table
  public.orders,
  public.order_items,
  public.products,
  public.farms,
  public.pools;
