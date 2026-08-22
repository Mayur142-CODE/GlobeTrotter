-- ==============================================================================
-- Migration: 20260822000004_admin_and_public_profiles.sql
-- Description: Allow reading profiles and trips for admin oversight and shared itineraries
-- ==============================================================================

-- Allow reading profiles for traveler directory and admin panel
DROP POLICY IF EXISTS "Users can select own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow reading profiles" ON public.profiles;

CREATE POLICY "Allow reading profiles"
    ON public.profiles FOR SELECT
    TO public
    USING (true);

-- Ensure write protection remains strictly locked to authenticated user
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- Allow reading all trips for admin platform analytics (normal users will continue to query their own trips in user services)
DROP POLICY IF EXISTS "Allow reading trips for admin and sharing" ON public.trips;
CREATE POLICY "Allow reading trips for admin and sharing"
    ON public.trips FOR SELECT
    TO public
    USING (true);

-- Allow reading trip stops for analytics and shared itineraries
DROP POLICY IF EXISTS "Allow reading trip stops" ON public.trip_stops;
CREATE POLICY "Allow reading trip stops"
    ON public.trip_stops FOR SELECT
    TO public
    USING (true);

-- Allow reading trip activities for analytics and shared itineraries
DROP POLICY IF EXISTS "Allow reading trip activities" ON public.trip_activities;
CREATE POLICY "Allow reading trip activities"
    ON public.trip_activities FOR SELECT
    TO public
    USING (true);
