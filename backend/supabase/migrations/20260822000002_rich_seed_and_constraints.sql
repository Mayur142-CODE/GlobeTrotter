-- ==============================================================================
-- Migration: 20260822000002_rich_seed_and_constraints.sql
-- Description: Expand destination & activity catalog, verify cascading constraints
-- ==============================================================================

-- 1. Ensure foreign key on delete cascades are established
ALTER TABLE public.trip_stops
    DROP CONSTRAINT IF EXISTS trip_stops_trip_id_fkey,
    ADD CONSTRAINT trip_stops_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;

ALTER TABLE public.trip_stops
    DROP CONSTRAINT IF EXISTS trip_stops_destination_id_fkey,
    ADD CONSTRAINT trip_stops_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE CASCADE;

ALTER TABLE public.trip_activities
    DROP CONSTRAINT IF EXISTS trip_activities_stop_id_fkey,
    ADD CONSTRAINT trip_activities_stop_id_fkey FOREIGN KEY (stop_id) REFERENCES public.trip_stops(id) ON DELETE CASCADE;

ALTER TABLE public.trip_activities
    DROP CONSTRAINT IF EXISTS trip_activities_activity_id_fkey,
    ADD CONSTRAINT trip_activities_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.activities(id) ON DELETE CASCADE;

ALTER TABLE public.trip_expenses
    DROP CONSTRAINT IF EXISTS trip_expenses_trip_id_fkey,
    ADD CONSTRAINT trip_expenses_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;

ALTER TABLE public.saved_destinations
    DROP CONSTRAINT IF EXISTS saved_destinations_destination_id_fkey,
    ADD CONSTRAINT saved_destinations_destination_id_fkey FOREIGN KEY (destination_id) REFERENCES public.destinations(id) ON DELETE CASCADE;

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_trip_activities_stop_order ON public.trip_activities(stop_id, activity_order);
CREATE INDEX IF NOT EXISTS idx_trip_expenses_trip_date ON public.trip_expenses(trip_id, expense_date);
CREATE INDEX IF NOT EXISTS idx_saved_destinations_user ON public.saved_destinations(user_id);
