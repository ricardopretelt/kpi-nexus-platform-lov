-- Users table with system user reference (john.doe as system user)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    force_password_change BOOLEAN DEFAULT FALSE,
    created_by INTEGER DEFAULT 1, -- Default to john.doe (ID 1)
    updated_by INTEGER DEFAULT 1, -- Default to john.doe (ID 1)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topics table
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    created_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    updated_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPIs table
CREATE TABLE kpis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    updated_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI Versions table
CREATE TABLE kpi_versions (
    id SERIAL PRIMARY KEY,
    kpi_id INTEGER NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    definition TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    topics JSONB NOT NULL,
    data_specialist_id INTEGER REFERENCES users(id),
    business_specialist_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    additional_blocks JSONB,
    created_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    updated_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI Active Versions mapping table
CREATE TABLE kpi_active_versions (
    id SERIAL PRIMARY KEY,
    kpi_id INTEGER NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
    kpi_version_id INTEGER NOT NULL REFERENCES kpi_versions(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kpi_id)
);

-- Approvals for KPI versions
CREATE TABLE IF NOT EXISTS kpi_approvals (
    id SERIAL PRIMARY KEY,
    kpi_version_id INTEGER NOT NULL REFERENCES kpi_versions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    updated_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kpi_version_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    kpi_version_id INTEGER REFERENCES kpi_versions(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER NOT NULL DEFAULT 1 REFERENCES users(id), -- john.doe
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO users (username, email, password_hash, full_name, role, is_admin, is_active, force_password_change, created_by, updated_by) VALUES
('john.doe', 'john.doe@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'John Doe', 'data_specialist', 't', 't', 'f', 1, 1),
('jane.smith', 'jane.smith@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Jane Smith', 'business_specialist', 'f', 't', 'f', 1, 1),
('emily.clark', 'emily.clark@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Emily Clark', 'data_specialist', 'f', 't', 'f', 1, 1),
('tom.brown', 'tom.brown@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Tom Brown', 'business_specialist', 'f', 't', 'f', 1, 1);

INSERT INTO topics (name, description, icon, created_by, updated_by) VALUES
('Customer Retention', 'KPIs related to customer loyalty, churn, and acquisition', '🧑‍💼', 1, 1),
('Network Performance', 'Network uptime, quality, and performance metrics', '📡', 1, 1),
('Revenue Streams', 'Financial metrics and revenue-related KPIs', '💰', 1, 1);

-- Insert KPIs
INSERT INTO kpis (name, created_by, updated_by, created_at, updated_at) VALUES
('Customer Churn Rate', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Average Revenue Per User (ARPU)', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Network Availability', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Customer Acquisition Cost (CAC)', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Data Usage Per Subscriber', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert KPI versions (can reference kpis safely)
INSERT INTO kpi_versions (kpi_id, version_number, definition, sql_query, topics, data_specialist_id, business_specialist_id, status, additional_blocks, created_by, updated_by, change_description) VALUES
(1, 1, 'Percentage of customers leaving the service monthly. This metric helps track customer retention and identify potential issues in service quality or customer satisfaction.', 
'SELECT (COUNT(CASE WHEN status = ''churned'' THEN 1 END) * 100.0) / COUNT(*) as churn_rate FROM customer_data WHERE date_trunc(''month'', churn_date) = date_trunc(''month'', CURRENT_DATE) GROUP BY date_trunc(''month'', churn_date);',
'[1]', 1, 2, 'active', 
'[{"id": "dashboard-churn-rate", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=Churn+Rate+Dashboard"}]', 1, 1, 'Initial version created'),

(2, 1, 'Average monthly revenue generated per subscriber. This key financial metric helps assess the monetization effectiveness and customer value across different service tiers.',
'SELECT SUM(monthly_revenue) / COUNT(DISTINCT subscriber_id) as arpu FROM revenue_data WHERE date_trunc(''month'', billing_date) = date_trunc(''month'', CURRENT_DATE) AND subscriber_status = ''active'';',
'[3]', 3, 4, 'active',
'[{"id": "dashboard-arpu", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=ARPU+Dashboard"}]', 1, 1, 'Initial version created'),

(3, 1, 'Percentage of time network services are operational and accessible to customers. Critical metric for SLA compliance and customer satisfaction.',
'SELECT (SUM(uptime_minutes) * 100.0) / SUM(total_minutes) as availability_percentage FROM network_performance WHERE date_trunc(''day'', measurement_date) >= CURRENT_DATE - INTERVAL ''30 days'' GROUP BY network_region;',
'[2]', 1, 2, 'active',
'[{"id": "dashboard-network-availability", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=Network+Availability"}]', 1, 1, 'Initial version created'),

(4, 1, 'Total cost of acquiring a new customer, including marketing, sales, and onboarding expenses divided by the number of new customers acquired.',
'SELECT SUM(marketing_spend + sales_cost + onboarding_cost) / COUNT(DISTINCT new_customer_id) as cac FROM acquisition_costs ac JOIN new_customers nc ON ac.campaign_id = nc.acquisition_campaign WHERE date_trunc(''month'', nc.signup_date) = date_trunc(''month'', CURRENT_DATE);',
'[1, 3]', 3, 4, 'active',
'[{"id": "dashboard-cac", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=CAC+Dashboard"}]', 1, 1, 'Initial version created'),

(5, 1, 'Average monthly data consumption per active subscriber across all service plans and device types.',
'SELECT AVG(monthly_data_usage_gb) as avg_data_usage, service_plan, device_type FROM subscriber_usage WHERE date_trunc(''month'', usage_date) = date_trunc(''month'', CURRENT_DATE) AND subscriber_status = ''active'' GROUP BY service_plan, device_type;',
'[2]', 1, 2, 'active',
'[{"id": "dashboard-data-usage", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=Data+Usage+Trends"}]', 1, 1, 'Initial version created');

-- Insert active version mappings (establishes the active versions without UPDATEs)
INSERT INTO kpi_active_versions (kpi_id, kpi_version_id, created_by) VALUES
(1, 1, 1), -- Customer Churn Rate -> version 1
(2, 2, 1), -- ARPU -> version 1  
(3, 3, 1), -- Network Availability -> version 1
(4, 4, 1), -- CAC -> version 1
(5, 5, 1); -- Data Usage -> version 1

-- Note: kpi_versions.status remains VARCHAR(20); now used values:
-- 'pending' | 'active' | 'inactive' | 'rejected' 