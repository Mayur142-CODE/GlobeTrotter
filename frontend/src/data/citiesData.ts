import type { CityLocation } from '@/types/location';

export const citiesData: CityLocation[] = [
  // --- INDIA (IN) ---
  { id: 'in-rajkot', name: 'Rajkot', countryId: 'IN', countryName: 'India', state: 'Gujarat', latitude: 22.3039, longitude: 70.8022, timezone: 'Asia/Kolkata' },
  { id: 'in-ahmedabad', name: 'Ahmedabad', countryId: 'IN', countryName: 'India', state: 'Gujarat', latitude: 23.0225, longitude: 72.5714, timezone: 'Asia/Kolkata' },
  { id: 'in-surat', name: 'Surat', countryId: 'IN', countryName: 'India', state: 'Gujarat', latitude: 21.1702, longitude: 72.8311, timezone: 'Asia/Kolkata' },
  { id: 'in-vadodara', name: 'Vadodara', countryId: 'IN', countryName: 'India', state: 'Gujarat', latitude: 22.3072, longitude: 73.1812, timezone: 'Asia/Kolkata' },
  { id: 'in-mumbai', name: 'Mumbai', countryId: 'IN', countryName: 'India', state: 'Maharashtra', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { id: 'in-pune', name: 'Pune', countryId: 'IN', countryName: 'India', state: 'Maharashtra', latitude: 18.5204, longitude: 73.8567, timezone: 'Asia/Kolkata' },
  { id: 'in-nagpur', name: 'Nagpur', countryId: 'IN', countryName: 'India', state: 'Maharashtra', latitude: 21.1458, longitude: 79.0882, timezone: 'Asia/Kolkata' },
  { id: 'in-delhi', name: 'Delhi', countryId: 'IN', countryName: 'India', state: 'Delhi', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata' },
  { id: 'in-new-delhi', name: 'New Delhi', countryId: 'IN', countryName: 'India', state: 'Delhi', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
  { id: 'in-bengaluru', name: 'Bengaluru', countryId: 'IN', countryName: 'India', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { id: 'in-mysore', name: 'Mysore', countryId: 'IN', countryName: 'India', state: 'Karnataka', latitude: 12.2958, longitude: 76.6394, timezone: 'Asia/Kolkata' },
  { id: 'in-hyderabad', name: 'Hyderabad', countryId: 'IN', countryName: 'India', state: 'Telangana', latitude: 17.3850, longitude: 78.4867, timezone: 'Asia/Kolkata' },
  { id: 'in-chennai', name: 'Chennai', countryId: 'IN', countryName: 'India', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { id: 'in-coimbatore', name: 'Coimbatore', countryId: 'IN', countryName: 'India', state: 'Tamil Nadu', latitude: 11.0168, longitude: 76.9558, timezone: 'Asia/Kolkata' },
  { id: 'in-kolkata', name: 'Kolkata', countryId: 'IN', countryName: 'India', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { id: 'in-jaipur', name: 'Jaipur', countryId: 'IN', countryName: 'India', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873, timezone: 'Asia/Kolkata' },
  { id: 'in-udaipur', name: 'Udaipur', countryId: 'IN', countryName: 'India', state: 'Rajasthan', latitude: 24.5854, longitude: 73.7125, timezone: 'Asia/Kolkata' },
  { id: 'in-jodhpur', name: 'Jodhpur', countryId: 'IN', countryName: 'India', state: 'Rajasthan', latitude: 26.2389, longitude: 73.0243, timezone: 'Asia/Kolkata' },
  { id: 'in-lucknow', name: 'Lucknow', countryId: 'IN', countryName: 'India', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462, timezone: 'Asia/Kolkata' },
  { id: 'in-varanasi', name: 'Varanasi', countryId: 'IN', countryName: 'India', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739, timezone: 'Asia/Kolkata' },
  { id: 'in-agra', name: 'Agra', countryId: 'IN', countryName: 'India', state: 'Uttar Pradesh', latitude: 27.1767, longitude: 78.0081, timezone: 'Asia/Kolkata' },
  { id: 'in-chandigarh', name: 'Chandigarh', countryId: 'IN', countryName: 'India', state: 'Punjab/Haryana', latitude: 30.7333, longitude: 76.7794, timezone: 'Asia/Kolkata' },
  { id: 'in-amritsar', name: 'Amritsar', countryId: 'IN', countryName: 'India', state: 'Punjab', latitude: 31.6340, longitude: 74.8723, timezone: 'Asia/Kolkata' },
  { id: 'in-kochi', name: 'Kochi', countryId: 'IN', countryName: 'India', state: 'Kerala', latitude: 9.9312, longitude: 76.2673, timezone: 'Asia/Kolkata' },
  { id: 'in-thiruvananthapuram', name: 'Thiruvananthapuram', countryId: 'IN', countryName: 'India', state: 'Kerala', latitude: 8.5241, longitude: 76.9366, timezone: 'Asia/Kolkata' },
  { id: 'in-goa', name: 'Panaji (Goa)', countryId: 'IN', countryName: 'India', state: 'Goa', latitude: 15.4909, longitude: 73.8278, timezone: 'Asia/Kolkata' },
  { id: 'in-indore', name: 'Indore', countryId: 'IN', countryName: 'India', state: 'Madhya Pradesh', latitude: 22.7196, longitude: 75.8577, timezone: 'Asia/Kolkata' },
  { id: 'in-bhopal', name: 'Bhopal', countryId: 'IN', countryName: 'India', state: 'Madhya Pradesh', latitude: 23.2599, longitude: 77.4126, timezone: 'Asia/Kolkata' },
  { id: 'in-patna', name: 'Patna', countryId: 'IN', countryName: 'India', state: 'Bihar', latitude: 25.5941, longitude: 85.1376, timezone: 'Asia/Kolkata' },
  { id: 'in-bhubaneswar', name: 'Bhubaneswar', countryId: 'IN', countryName: 'India', state: 'Odisha', latitude: 20.2961, longitude: 85.8245, timezone: 'Asia/Kolkata' },
  { id: 'in-guwahati', name: 'Guwahati', countryId: 'IN', countryName: 'India', state: 'Assam', latitude: 26.1445, longitude: 91.7362, timezone: 'Asia/Kolkata' },
  { id: 'in-visakhapatnam', name: 'Visakhapatnam', countryId: 'IN', countryName: 'India', state: 'Andhra Pradesh', latitude: 17.6868, longitude: 83.2185, timezone: 'Asia/Kolkata' },

  // --- UNITED STATES (US) ---
  { id: 'us-new-york', name: 'New York', countryId: 'US', countryName: 'United States', state: 'New York', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { id: 'us-los-angeles', name: 'Los Angeles', countryId: 'US', countryName: 'United States', state: 'California', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  { id: 'us-san-francisco', name: 'San Francisco', countryId: 'US', countryName: 'United States', state: 'California', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
  { id: 'us-san-diego', name: 'San Diego', countryId: 'US', countryName: 'United States', state: 'California', latitude: 32.7157, longitude: -117.1611, timezone: 'America/Los_Angeles' },
  { id: 'us-chicago', name: 'Chicago', countryId: 'US', countryName: 'United States', state: 'Illinois', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },
  { id: 'us-houston', name: 'Houston', countryId: 'US', countryName: 'United States', state: 'Texas', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago' },
  { id: 'us-austin', name: 'Austin', countryId: 'US', countryName: 'United States', state: 'Texas', latitude: 30.2672, longitude: -97.7431, timezone: 'America/Chicago' },
  { id: 'us-dallas', name: 'Dallas', countryId: 'US', countryName: 'United States', state: 'Texas', latitude: 32.7767, longitude: -96.7970, timezone: 'America/Chicago' },
  { id: 'us-miami', name: 'Miami', countryId: 'US', countryName: 'United States', state: 'Florida', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York' },
  { id: 'us-orlando', name: 'Orlando', countryId: 'US', countryName: 'United States', state: 'Florida', latitude: 28.5383, longitude: -81.3792, timezone: 'America/New_York' },
  { id: 'us-seattle', name: 'Seattle', countryId: 'US', countryName: 'United States', state: 'Washington', latitude: 47.6062, longitude: -122.3321, timezone: 'America/Los_Angeles' },
  { id: 'us-boston', name: 'Boston', countryId: 'US', countryName: 'United States', state: 'Massachusetts', latitude: 42.3601, longitude: -71.0589, timezone: 'America/New_York' },
  { id: 'us-las-vegas', name: 'Las Vegas', countryId: 'US', countryName: 'United States', state: 'Nevada', latitude: 36.1699, longitude: -115.1398, timezone: 'America/Los_Angeles' },
  { id: 'us-denver', name: 'Denver', countryId: 'US', countryName: 'United States', state: 'Colorado', latitude: 39.7392, longitude: -104.9903, timezone: 'America/Denver' },
  { id: 'us-washington-dc', name: 'Washington D.C.', countryId: 'US', countryName: 'United States', state: 'District of Columbia', latitude: 38.9072, longitude: -77.0369, timezone: 'America/New_York' },

  // --- UNITED KINGDOM (GB) ---
  { id: 'gb-london', name: 'London', countryId: 'GB', countryName: 'United Kingdom', state: 'England', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { id: 'gb-manchester', name: 'Manchester', countryId: 'GB', countryName: 'United Kingdom', state: 'England', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London' },
  { id: 'gb-birmingham', name: 'Birmingham', countryId: 'GB', countryName: 'United Kingdom', state: 'England', latitude: 52.4862, longitude: -1.8904, timezone: 'Europe/London' },
  { id: 'gb-edinburgh', name: 'Edinburgh', countryId: 'GB', countryName: 'United Kingdom', state: 'Scotland', latitude: 55.9533, longitude: -3.1883, timezone: 'Europe/London' },
  { id: 'gb-glasgow', name: 'Glasgow', countryId: 'GB', countryName: 'United Kingdom', state: 'Scotland', latitude: 55.8642, longitude: -4.2518, timezone: 'Europe/London' },
  { id: 'gb-liverpool', name: 'Liverpool', countryId: 'GB', countryName: 'United Kingdom', state: 'England', latitude: 53.4084, longitude: -2.9916, timezone: 'Europe/London' },
  { id: 'gb-bristol', name: 'Bristol', countryId: 'GB', countryName: 'United Kingdom', state: 'England', latitude: 51.4545, longitude: -2.5879, timezone: 'Europe/London' },
  { id: 'gb-oxford', name: 'Oxford', countryId: 'GB', countryName: 'United Kingdom', state: 'England', latitude: 51.7520, longitude: -1.2577, timezone: 'Europe/London' },
  { id: 'gb-cambridge', name: 'Cambridge', countryId: 'GB', countryName: 'United Kingdom', state: 'England', latitude: 52.2053, longitude: 0.1218, timezone: 'Europe/London' },

  // --- JAPAN (JP) ---
  { id: 'jp-tokyo', name: 'Tokyo', countryId: 'JP', countryName: 'Japan', state: 'Kanto', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { id: 'jp-kyoto', name: 'Kyoto', countryId: 'JP', countryName: 'Japan', state: 'Kansai', latitude: 35.0116, longitude: 135.7681, timezone: 'Asia/Tokyo' },
  { id: 'jp-osaka', name: 'Osaka', countryId: 'JP', countryName: 'Japan', state: 'Kansai', latitude: 34.6937, longitude: 135.5023, timezone: 'Asia/Tokyo' },
  { id: 'jp-yokohama', name: 'Yokohama', countryId: 'JP', countryName: 'Japan', state: 'Kanagawa', latitude: 35.4437, longitude: 139.6380, timezone: 'Asia/Tokyo' },
  { id: 'jp-sapporo', name: 'Sapporo', countryId: 'JP', countryName: 'Japan', state: 'Hokkaido', latitude: 43.0618, longitude: 141.3545, timezone: 'Asia/Tokyo' },
  { id: 'jp-fukuoka', name: 'Fukuoka', countryId: 'JP', countryName: 'Japan', state: 'Kyushu', latitude: 33.5904, longitude: 130.4017, timezone: 'Asia/Tokyo' },
  { id: 'jp-hiroshima', name: 'Hiroshima', countryId: 'JP', countryName: 'Japan', state: 'Chugoku', latitude: 34.3853, longitude: 132.4553, timezone: 'Asia/Tokyo' },
  { id: 'jp-nara', name: 'Nara', countryId: 'JP', countryName: 'Japan', state: 'Kansai', latitude: 34.6851, longitude: 135.8048, timezone: 'Asia/Tokyo' },

  // --- FRANCE (FR) ---
  { id: 'fr-paris', name: 'Paris', countryId: 'FR', countryName: 'France', state: 'Île-de-France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { id: 'fr-nice', name: 'Nice', countryId: 'FR', countryName: 'France', state: "Provence-Alpes-Côte d'Azur", latitude: 43.7102, longitude: 7.2620, timezone: 'Europe/Paris' },
  { id: 'fr-lyon', name: 'Lyon', countryId: 'FR', countryName: 'France', state: 'Auvergne-Rhône-Alpes', latitude: 45.7640, longitude: 4.8357, timezone: 'Europe/Paris' },
  { id: 'fr-marseille', name: 'Marseille', countryId: 'FR', countryName: 'France', state: "Provence-Alpes-Côte d'Azur", latitude: 43.2965, longitude: 5.3698, timezone: 'Europe/Paris' },
  { id: 'fr-bordeaux', name: 'Bordeaux', countryId: 'FR', countryName: 'France', state: 'Nouvelle-Aquitaine', latitude: 44.8378, longitude: -0.5792, timezone: 'Europe/Paris' },
  { id: 'fr-strasbourg', name: 'Strasbourg', countryId: 'FR', countryName: 'France', state: 'Grand Est', latitude: 48.5734, longitude: 7.7521, timezone: 'Europe/Paris' },

  // --- GERMANY (DE) ---
  { id: 'de-berlin', name: 'Berlin', countryId: 'DE', countryName: 'Germany', state: 'Berlin', latitude: 52.5200, longitude: 13.4050, timezone: 'Europe/Berlin' },
  { id: 'de-munich', name: 'Munich', countryId: 'DE', countryName: 'Germany', state: 'Bavaria', latitude: 48.1351, longitude: 11.5820, timezone: 'Europe/Berlin' },
  { id: 'de-frankfurt', name: 'Frankfurt', countryId: 'DE', countryName: 'Germany', state: 'Hesse', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin' },
  { id: 'de-hamburg', name: 'Hamburg', countryId: 'DE', countryName: 'Germany', state: 'Hamburg', latitude: 53.5511, longitude: 9.9937, timezone: 'Europe/Berlin' },
  { id: 'de-cologne', name: 'Cologne', countryId: 'DE', countryName: 'Germany', state: 'North Rhine-Westphalia', latitude: 50.9375, longitude: 6.9603, timezone: 'Europe/Berlin' },

  // --- AUSTRALIA (AU) ---
  { id: 'au-sydney', name: 'Sydney', countryId: 'AU', countryName: 'Australia', state: 'New South Wales', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { id: 'au-melbourne', name: 'Melbourne', countryId: 'AU', countryName: 'Australia', state: 'Victoria', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne' },
  { id: 'au-brisbane', name: 'Brisbane', countryId: 'AU', countryName: 'Australia', state: 'Queensland', latitude: -27.4698, longitude: 153.0251, timezone: 'Australia/Brisbane' },
  { id: 'au-perth', name: 'Perth', countryId: 'AU', countryName: 'Australia', state: 'Western Australia', latitude: -31.9505, longitude: 115.8605, timezone: 'Australia/Perth' },
  { id: 'au-adelaide', name: 'Adelaide', countryId: 'AU', countryName: 'Australia', state: 'South Australia', latitude: -34.9285, longitude: 138.6007, timezone: 'Australia/Adelaide' },

  // --- CANADA (CA) ---
  { id: 'ca-toronto', name: 'Toronto', countryId: 'CA', countryName: 'Canada', state: 'Ontario', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  { id: 'ca-vancouver', name: 'Vancouver', countryId: 'CA', countryName: 'Canada', state: 'British Columbia', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver' },
  { id: 'ca-montreal', name: 'Montreal', countryId: 'CA', countryName: 'Canada', state: 'Quebec', latitude: 45.5017, longitude: -73.5673, timezone: 'America/Toronto' },
  { id: 'ca-calgary', name: 'Calgary', countryId: 'CA', countryName: 'Canada', state: 'Alberta', latitude: 51.0447, longitude: -114.0719, timezone: 'America/Edmonton' },
  { id: 'ca-ottawa', name: 'Ottawa', countryId: 'CA', countryName: 'Canada', state: 'Ontario', latitude: 45.4215, longitude: -75.6972, timezone: 'America/Toronto' },

  // --- ITALY (IT) ---
  { id: 'it-rome', name: 'Rome', countryId: 'IT', countryName: 'Italy', state: 'Lazio', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome' },
  { id: 'it-florence', name: 'Florence', countryId: 'IT', countryName: 'Italy', state: 'Tuscany', latitude: 43.7696, longitude: 11.2558, timezone: 'Europe/Rome' },
  { id: 'it-venice', name: 'Venice', countryId: 'IT', countryName: 'Italy', state: 'Veneto', latitude: 45.4408, longitude: 12.3155, timezone: 'Europe/Rome' },
  { id: 'it-milan', name: 'Milan', countryId: 'IT', countryName: 'Italy', state: 'Lombardy', latitude: 45.4642, longitude: 9.1900, timezone: 'Europe/Rome' },
  { id: 'it-naples', name: 'Naples', countryId: 'IT', countryName: 'Italy', state: 'Campania', latitude: 40.8518, longitude: 14.2681, timezone: 'Europe/Rome' },

  // --- SPAIN (ES) ---
  { id: 'es-barcelona', name: 'Barcelona', countryId: 'ES', countryName: 'Spain', state: 'Catalonia', latitude: 41.3851, longitude: 2.1734, timezone: 'Europe/Madrid' },
  { id: 'es-madrid', name: 'Madrid', countryId: 'ES', countryName: 'Spain', state: 'Community of Madrid', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid' },
  { id: 'es-seville', name: 'Seville', countryId: 'ES', countryName: 'Spain', state: 'Andalusia', latitude: 37.3891, longitude: -5.9845, timezone: 'Europe/Madrid' },
  { id: 'es-valencia', name: 'Valencia', countryId: 'ES', countryName: 'Spain', state: 'Valencian Community', latitude: 39.4699, longitude: -0.3763, timezone: 'Europe/Madrid' },

  // --- UAE (AE) ---
  { id: 'ae-dubai', name: 'Dubai', countryId: 'AE', countryName: 'United Arab Emirates', state: 'Dubai', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { id: 'ae-abu-dhabi', name: 'Abu Dhabi', countryId: 'AE', countryName: 'United Arab Emirates', state: 'Abu Dhabi', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai' },
  { id: 'ae-sharjah', name: 'Sharjah', countryId: 'AE', countryName: 'United Arab Emirates', state: 'Sharjah', latitude: 25.3463, longitude: 55.4209, timezone: 'Asia/Dubai' },

  // --- SINGAPORE (SG) ---
  { id: 'sg-singapore', name: 'Singapore', countryId: 'SG', countryName: 'Singapore', state: 'Central', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },

  // --- NETHERLANDS (NL) ---
  { id: 'nl-amsterdam', name: 'Amsterdam', countryId: 'NL', countryName: 'Netherlands', state: 'North Holland', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam' },
  { id: 'nl-rotterdam', name: 'Rotterdam', countryId: 'NL', countryName: 'Netherlands', state: 'South Holland', latitude: 51.9244, longitude: 4.4777, timezone: 'Europe/Amsterdam' },

  // --- SWITZERLAND (CH) ---
  { id: 'ch-zurich', name: 'Zurich', countryId: 'CH', countryName: 'Switzerland', state: 'Zurich', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich' },
  { id: 'ch-geneva', name: 'Geneva', countryId: 'CH', countryName: 'Switzerland', state: 'Geneva', latitude: 46.2044, longitude: 6.1432, timezone: 'Europe/Zurich' },
  { id: 'ch-lucerne', name: 'Lucerne', countryId: 'CH', countryName: 'Switzerland', state: 'Lucerne', latitude: 47.0502, longitude: 8.3093, timezone: 'Europe/Zurich' },

  // --- THAILAND (TH) ---
  { id: 'th-bangkok', name: 'Bangkok', countryId: 'TH', countryName: 'Thailand', state: 'Central', latitude: 13.7563, longitude: 100.5018, timezone: 'Asia/Bangkok' },
  { id: 'th-chiang-mai', name: 'Chiang Mai', countryId: 'TH', countryName: 'Thailand', state: 'North', latitude: 18.7883, longitude: 98.9853, timezone: 'Asia/Bangkok' },
  { id: 'th-phuket', name: 'Phuket', countryId: 'TH', countryName: 'Thailand', state: 'South', latitude: 7.8804, longitude: 98.3923, timezone: 'Asia/Bangkok' },

  // --- INDONESIA (ID) ---
  { id: 'id-jakarta', name: 'Jakarta', countryId: 'ID', countryName: 'Indonesia', state: 'Java', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { id: 'id-bali', name: 'Denpasar (Bali)', countryId: 'ID', countryName: 'Indonesia', state: 'Bali', latitude: -8.6705, longitude: 115.2126, timezone: 'Asia/Makassar' },

  // --- MALAYSIA (MY) ---
  { id: 'my-kuala-lumpur', name: 'Kuala Lumpur', countryId: 'MY', countryName: 'Malaysia', state: 'Federal Territory', latitude: 3.1390, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { id: 'my-penang', name: 'George Town (Penang)', countryId: 'MY', countryName: 'Malaysia', state: 'Penang', latitude: 5.4141, longitude: 100.3288, timezone: 'Asia/Kuala_Lumpur' },

  // --- NEW ZEALAND (NZ) ---
  { id: 'nz-auckland', name: 'Auckland', countryId: 'NZ', countryName: 'New Zealand', state: 'North Island', latitude: -36.8485, longitude: 174.7633, timezone: 'Pacific/Auckland' },
  { id: 'nz-queenstown', name: 'Queenstown', countryId: 'NZ', countryName: 'New Zealand', state: 'South Island', latitude: -45.0312, longitude: 168.6626, timezone: 'Pacific/Auckland' },

  // --- BRAZIL (BR) ---
  { id: 'br-sao-paulo', name: 'São Paulo', countryId: 'BR', countryName: 'Brazil', state: 'São Paulo', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo' },
  { id: 'br-rio-de-janeiro', name: 'Rio de Janeiro', countryId: 'BR', countryName: 'Brazil', state: 'Rio de Janeiro', latitude: -22.9068, longitude: -43.1729, timezone: 'America/Sao_Paulo' },

  // --- MEXICO (MX) ---
  { id: 'mx-mexico-city', name: 'Mexico City', countryId: 'MX', countryName: 'Mexico', state: 'CDMX', latitude: 19.4326, longitude: -99.1332, timezone: 'America/Mexico_City' },
  { id: 'mx-cancun', name: 'Cancun', countryId: 'MX', countryName: 'Mexico', state: 'Quintana Roo', latitude: 21.1619, longitude: -86.8515, timezone: 'America/Cancun' },

  // --- GREECE (GR) ---
  { id: 'gr-athens', name: 'Athens', countryId: 'GR', countryName: 'Greece', state: 'Attica', latitude: 37.9838, longitude: 23.7275, timezone: 'Europe/Athens' },
  { id: 'gr-santorini', name: 'Santorini', countryId: 'GR', countryName: 'Greece', state: 'South Aegean', latitude: 36.3932, longitude: 25.4615, timezone: 'Europe/Athens' },

  // --- PORTUGAL (PT) ---
  { id: 'pt-lisbon', name: 'Lisbon', countryId: 'PT', countryName: 'Portugal', state: 'Lisbon', latitude: 38.7223, longitude: -9.1393, timezone: 'Europe/Lisbon' },
  { id: 'pt-porto', name: 'Porto', countryId: 'PT', countryName: 'Portugal', state: 'Porto', latitude: 41.1579, longitude: -8.6291, timezone: 'Europe/Lisbon' },

  // --- TURKEY (TR) ---
  { id: 'tr-istanbul', name: 'Istanbul', countryId: 'TR', countryName: 'Turkey', state: 'Marmara', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { id: 'tr-cappadocia', name: 'Cappadocia', countryId: 'TR', countryName: 'Turkey', state: 'Central Anatolia', latitude: 38.6431, longitude: 34.8289, timezone: 'Europe/Istanbul' },

  // --- EGYPT (EG) ---
  { id: 'eg-cairo', name: 'Cairo', countryId: 'EG', countryName: 'Egypt', state: 'Cairo', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },

  // --- SOUTH AFRICA (ZA) ---
  { id: 'za-cape-town', name: 'Cape Town', countryId: 'ZA', countryName: 'South Africa', state: 'Western Cape', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg' },
  { id: 'za-johannesburg', name: 'Johannesburg', countryId: 'ZA', countryName: 'South Africa', state: 'Gauteng', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg' },
];
