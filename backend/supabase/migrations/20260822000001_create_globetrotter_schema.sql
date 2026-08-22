-- ==============================================================================
-- Migration: 20260822000001_create_globetrotter_schema.sql
-- Description: Complete PostgreSQL database schema for GlobeTrotter travel planning
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Reusable function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to automatically create a profile entry when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        first_name,
        last_name,
        avatar_url
    )
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. TABLES CREATION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Extends Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    city TEXT,
    country TEXT,
    additional_info TEXT,
    avatar_url TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Trigger for auth.users signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for profiles updated_at
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 2. DESTINATIONS (Catalog of searchable cities/destinations)
-- ------------------------------------------------------------------------------
CREATE TABLE public.destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    country TEXT NOT NULL CHECK (char_length(trim(country)) > 0),
    region TEXT,
    description TEXT,
    image_url TEXT,
    cost_index INTEGER CHECK (cost_index IS NULL OR (cost_index >= 0 AND cost_index <= 100)),
    popularity_score INTEGER CHECK (popularity_score IS NULL OR (popularity_score >= 0 AND popularity_score <= 100)),
    latitude NUMERIC(9, 6),
    longitude NUMERIC(9, 6),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. ACTIVITIES (Catalog of activities per destination)
-- ------------------------------------------------------------------------------
CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    category TEXT,
    duration_minutes INTEGER CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    estimated_cost NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (estimated_cost >= 0),
    currency TEXT DEFAULT 'INR' NOT NULL,
    image_url TEXT,
    rating NUMERIC(3, 2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. TRIPS (User multi-city trip itineraries)
-- ------------------------------------------------------------------------------
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cover_photo_url TEXT,
    budget_limit NUMERIC(12, 2) CHECK (budget_limit IS NULL OR budget_limit >= 0),
    currency TEXT DEFAULT 'INR' NOT NULL,
    is_public BOOLEAN DEFAULT false NOT NULL,
    share_slug TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_trip_dates CHECK (end_date >= start_date)
);

-- Trigger for trips updated_at
CREATE TRIGGER trigger_trips_updated_at
    BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 5. TRIP STOPS (Ordered city destinations within a trip)
-- ------------------------------------------------------------------------------
CREATE TABLE public.trip_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    stop_order INTEGER NOT NULL DEFAULT 0 CHECK (stop_order >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_stop_dates CHECK (end_date >= start_date)
);

-- ------------------------------------------------------------------------------
-- 6. TRIP ACTIVITIES (Scheduled activities within a trip stop)
-- ------------------------------------------------------------------------------
CREATE TABLE public.trip_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stop_id UUID NOT NULL REFERENCES public.trip_stops(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    estimated_cost NUMERIC(12, 2) DEFAULT 0 NOT NULL CHECK (estimated_cost >= 0),
    notes TEXT,
    activity_order INTEGER NOT NULL DEFAULT 0 CHECK (activity_order >= 0),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT check_activity_times CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time)
);

-- ------------------------------------------------------------------------------
-- 7. TRIP EXPENSES (Budget tracking & actual expenses for a trip)
-- ------------------------------------------------------------------------------
CREATE TABLE public.trip_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    stop_id UUID REFERENCES public.trip_stops(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('transport', 'accommodation', 'activities', 'meals', 'other')),
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'INR' NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ------------------------------------------------------------------------------
-- 8. SAVED DESTINATIONS (User bookmarked/favorite destinations)
-- ------------------------------------------------------------------------------
CREATE TABLE public.saved_destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_saved_destination UNIQUE (user_id, destination_id)
);

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================

-- Profiles
CREATE INDEX idx_profiles_id ON public.profiles(id);

-- Destinations
CREATE INDEX idx_destinations_name ON public.destinations(name);
CREATE INDEX idx_destinations_country ON public.destinations(country);
CREATE INDEX idx_destinations_region ON public.destinations(region);
CREATE INDEX idx_destinations_popularity ON public.destinations(popularity_score);
CREATE INDEX idx_destinations_cost_index ON public.destinations(cost_index);

-- Activities
CREATE INDEX idx_activities_destination_id ON public.activities(destination_id);
CREATE INDEX idx_activities_category ON public.activities(category);
CREATE INDEX idx_activities_estimated_cost ON public.activities(estimated_cost);
CREATE INDEX idx_activities_duration ON public.activities(duration_minutes);
CREATE INDEX idx_activities_rating ON public.activities(rating);
CREATE INDEX idx_activities_name ON public.activities(name);

-- Trips
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_start_date ON public.trips(start_date);
CREATE INDEX idx_trips_end_date ON public.trips(end_date);
CREATE INDEX idx_trips_is_public ON public.trips(is_public);
CREATE INDEX idx_trips_share_slug ON public.trips(share_slug);

-- Trip Stops
CREATE INDEX idx_trip_stops_trip_id ON public.trip_stops(trip_id);
CREATE INDEX idx_trip_stops_destination_id ON public.trip_stops(destination_id);
CREATE INDEX idx_trip_stops_trip_order ON public.trip_stops(trip_id, stop_order);
CREATE INDEX idx_trip_stops_trip_start_date ON public.trip_stops(trip_id, start_date);

-- Trip Activities
CREATE INDEX idx_trip_activities_stop_id ON public.trip_activities(stop_id);
CREATE INDEX idx_trip_activities_activity_id ON public.trip_activities(activity_id);
CREATE INDEX idx_trip_activities_date ON public.trip_activities(activity_date);
CREATE INDEX idx_trip_activities_stop_order ON public.trip_activities(stop_id, activity_order);

-- Trip Expenses
CREATE INDEX idx_trip_expenses_trip_id ON public.trip_expenses(trip_id);
CREATE INDEX idx_trip_expenses_stop_id ON public.trip_expenses(stop_id);
CREATE INDEX idx_trip_expenses_category ON public.trip_expenses(category);
CREATE INDEX idx_trip_expenses_expense_date ON public.trip_expenses(expense_date);

-- Saved Destinations
CREATE INDEX idx_saved_destinations_user_id ON public.saved_destinations(user_id);
CREATE INDEX idx_saved_destinations_destination_id ON public.saved_destinations(destination_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on every application table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_destinations ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can select own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- DESTINATIONS RLS (Catalog Data - Read-only for all users)
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public select on destinations"
    ON public.destinations FOR SELECT
    TO public
    USING (true);

-- ------------------------------------------------------------------------------
-- ACTIVITIES RLS (Catalog Data - Read-only for all users)
-- ------------------------------------------------------------------------------
CREATE POLICY "Allow public select on activities"
    ON public.activities FOR SELECT
    TO public
    USING (true);

-- ------------------------------------------------------------------------------
-- TRIPS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own trips"
    ON public.trips FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public trips"
    ON public.trips FOR SELECT
    TO public
    USING (is_public = true);

CREATE POLICY "Users can insert own trips"
    ON public.trips FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
    ON public.trips FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
    ON public.trips FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- TRIP STOPS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view stops of own trips"
    ON public.trip_stops FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_stops.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view stops of public trips"
    ON public.trip_stops FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_stops.trip_id
            AND trips.is_public = true
        )
    );

CREATE POLICY "Users can insert stops to own trips"
    ON public.trip_stops FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_stops.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update stops of own trips"
    ON public.trip_stops FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_stops.trip_id
            AND trips.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_stops.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete stops of own trips"
    ON public.trip_stops FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_stops.trip_id
            AND trips.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- TRIP ACTIVITIES RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view activities of own trip stops"
    ON public.trip_activities FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trip_stops
            JOIN public.trips ON trips.id = trip_stops.trip_id
            WHERE trip_stops.id = trip_activities.stop_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view activities of public trips"
    ON public.trip_activities FOR SELECT
    TO public
    USING (
        EXISTS (
            SELECT 1 FROM public.trip_stops
            JOIN public.trips ON trips.id = trip_stops.trip_id
            WHERE trip_stops.id = trip_activities.stop_id
            AND trips.is_public = true
        )
    );

CREATE POLICY "Users can insert activities to own trip stops"
    ON public.trip_activities FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trip_stops
            JOIN public.trips ON trips.id = trip_stops.trip_id
            WHERE trip_stops.id = trip_activities.stop_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update activities of own trip stops"
    ON public.trip_activities FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trip_stops
            JOIN public.trips ON trips.id = trip_stops.trip_id
            WHERE trip_stops.id = trip_activities.stop_id
            AND trips.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trip_stops
            JOIN public.trips ON trips.id = trip_stops.trip_id
            WHERE trip_stops.id = trip_activities.stop_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete activities of own trip stops"
    ON public.trip_activities FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trip_stops
            JOIN public.trips ON trips.id = trip_stops.trip_id
            WHERE trip_stops.id = trip_activities.stop_id
            AND trips.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- TRIP EXPENSES RLS (Private to Trip Owner Only - Never exposed on public trips)
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view expenses of own trips"
    ON public.trip_expenses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_expenses.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert expenses to own trips"
    ON public.trip_expenses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_expenses.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update expenses of own trips"
    ON public.trip_expenses FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_expenses.trip_id
            AND trips.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_expenses.trip_id
            AND trips.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete expenses of own trips"
    ON public.trip_expenses FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.trips
            WHERE trips.id = trip_expenses.trip_id
            AND trips.user_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- SAVED DESTINATIONS RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view own saved destinations"
    ON public.saved_destinations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved destinations"
    ON public.saved_destinations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved destinations"
    ON public.saved_destinations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
