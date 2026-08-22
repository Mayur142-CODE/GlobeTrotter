-- ==============================================================================
-- GlobeTrotter Database Seed File
-- Seeds destinations, activities, and demo profile data
-- ==============================================================================

-- 1. Seed Destinations (Cities)
INSERT INTO public.destinations (id, name, country, region, description, image_url, cost_index, popularity_score, latitude, longitude)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Rajkot', 'India', 'Asia', 'Cultural hub of Saurashtra with rich heritage and bustling artisan markets.', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800', 25, 78, 22.3039, 70.8022),
    ('11111111-1111-1111-1111-111111111102', 'Ahmedabad', 'India', 'Asia', 'India’s first UNESCO World Heritage City with historic pols and modern architecture.', 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=800', 30, 85, 23.0225, 72.5714),
    ('11111111-1111-1111-1111-111111111103', 'Mumbai', 'India', 'Asia', 'The City of Dreams — colonial architecture, marine drive, and vibrant street life.', 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800', 50, 95, 19.0760, 72.8777),
    ('11111111-1111-1111-1111-111111111104', 'Delhi', 'India', 'Asia', 'Historic capital featuring Mughal monuments, vibrant bazaars, and food culture.', 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800', 40, 94, 28.7041, 77.1025),
    ('11111111-1111-1111-1111-111111111105', 'Bengaluru', 'India', 'Asia', 'Garden City and tech capital known for lush parks, breweries, and modern culture.', 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800', 45, 90, 12.9716, 77.5946),
    ('11111111-1111-1111-1111-111111111106', 'New York', 'United States', 'Americas', 'The Big Apple — skyscrapers, Broadway, Central Park, and world-class arts.', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800', 90, 98, 40.7128, -74.0060),
    ('11111111-1111-1111-1111-111111111107', 'San Francisco', 'United States', 'Americas', 'Iconic Golden Gate Bridge, cable cars, and world-famous bay views.', 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800', 88, 92, 37.7749, -122.4194),
    ('11111111-1111-1111-1111-111111111108', 'London', 'United Kingdom', 'Europe', 'Royal parks, historic landmarks, and world-class museums along the Thames.', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800', 85, 96, 51.5074, -0.1278),
    ('11111111-1111-1111-1111-111111111109', 'Tokyo', 'Japan', 'Asia', 'Neon districts, serene shrines, and the finest culinary scene on Earth.', 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800', 80, 97, 35.6762, 139.6503),
    ('11111111-1111-1111-1111-111111111110', 'Paris', 'France', 'Europe', 'The City of Light — boulevards, boulangeries, and the Eiffel Tower at dusk.', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800', 82, 98, 48.8566, 2.3522),
    ('11111111-1111-1111-1111-111111111111', 'Kyoto', 'Japan', 'Asia', 'Bamboo groves, traditional tea ceremonies, and centuries-old temples.', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', 70, 89, 35.0116, 135.7681),
    ('11111111-1111-1111-1111-111111111112', 'Rome', 'Italy', 'Europe', 'Ancient Colosseum, Vatican wonders, and incredible Italian dining.', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800', 68, 93, 41.9028, 12.4964),
    ('11111111-1111-1111-1111-111111111113', 'Dubai', 'United Arab Emirates', 'Middle East', 'Futuristic architecture, luxury shopping, and desert safaris.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800', 84, 91, 25.2048, 55.2708),
    ('11111111-1111-1111-1111-111111111114', 'Sydney', 'Australia', 'Oceania', 'Sydney Opera House, Bondi Beach, and vibrant harbour life.', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800', 80, 90, -33.8688, 151.2093)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    region = EXCLUDED.region,
    description = EXCLUDED.description,
    cost_index = EXCLUDED.cost_index,
    popularity_score = EXCLUDED.popularity_score;
