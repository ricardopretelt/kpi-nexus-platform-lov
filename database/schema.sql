-- Users table
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Topics table
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    color VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI Versions table - Create FIRST (no dependencies)
CREATE TABLE kpi_versions (
    id SERIAL PRIMARY KEY,
    kpi_id INTEGER, -- Will reference kpis table
    version_number INTEGER NOT NULL,
    definition TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    topics JSONB NOT NULL,
    data_specialist_id INTEGER REFERENCES users(id),
    business_specialist_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    additional_blocks JSONB,
    updated_by INTEGER REFERENCES users(id),
    change_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPIs table - Create SECOND (references kpi_versions)
CREATE TABLE kpis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    active_version INTEGER REFERENCES kpi_versions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Now add the foreign key constraint to kpi_versions
ALTER TABLE kpi_versions ADD CONSTRAINT fk_kpi_versions_kpi_id 
    FOREIGN KEY (kpi_id) REFERENCES kpis(id) ON DELETE CASCADE;

-- Insert initial data
INSERT INTO users (username, email, password_hash, full_name, role, is_admin, is_active, force_password_change) VALUES
('john.doe', 'john.doe@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'John Doe', 'data_specialist', 't', 't', 'f'),
('jane.smith', 'jane.smith@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Jane Smith', 'business_specialist', 'f', 't', 'f'),
('emily.clark', 'emily.clark@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Emily Clark', 'data_specialist', 'f', 't', 'f'),
('tom.brown', 'tom.brown@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Tom Brown', 'business_specialist', 'f', 't', 'f');

INSERT INTO topics (name, description, icon, color) VALUES
('Customer Retention', 'KPIs related to customer loyalty, churn, and acquisition', '', 'bg-blue-500'),
('Network Performance', 'Network uptime, quality, and performance metrics', '📡', 'bg-green-500'),
('Revenue Streams', 'Financial metrics and revenue-related KPIs', '💰', 'bg-purple-500');

-- Insert KPIs first (without active_version initially)
INSERT INTO kpis (name, created_at, updated_at) VALUES
('Customer Churn Rate', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Average Revenue Per User (ARPU)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Network Availability', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Customer Acquisition Cost (CAC)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Data Usage Per Subscriber', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert KPI versions with proper kpi_id references
INSERT INTO kpi_versions (kpi_id, version_number, definition, sql_query, topics, data_specialist_id, business_specialist_id, status, additional_blocks, updated_by, change_description) VALUES
(1, 1, 'Percentage of customers leaving the service monthly. This metric helps track customer retention and identify potential issues in service quality or customer satisfaction.', 
'SELECT (COUNT(CASE WHEN status = ''churned'' THEN 1 END) * 100.0) / COUNT(*) as churn_rate FROM customer_data WHERE date_trunc(''month'', churn_date) = date_trunc(''month'', CURRENT_DATE) GROUP BY date_trunc(''month'', churn_date);',
'[1]', 1, 2, 'active', 
'[{"id": "dashboard-churn-rate", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=Churn+Rate+Dashboard"}]', 1, 'Initial version created'),

(2, 1, 'Average monthly revenue generated per subscriber. This key financial metric helps assess the monetization effectiveness and customer value across different service tiers.',
'SELECT SUM(monthly_revenue) / COUNT(DISTINCT subscriber_id) as arpu FROM revenue_data WHERE date_trunc(''month'', billing_date) = date_trunc(''month'', CURRENT_DATE) AND subscriber_status = ''active'';',
'[3]', 3, 4, 'active',
'[{"id": "dashboard-arpu", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=ARPU+Dashboard"}]', 3, 'Initial version created'),

(3, 1, 'Percentage of time network services are operational and accessible to customers. Critical metric for SLA compliance and customer satisfaction.',
'SELECT (SUM(uptime_minutes) * 100.0) / SUM(total_minutes) as availability_percentage FROM network_performance WHERE date_trunc(''day'', measurement_date) >= CURRENT_DATE - INTERVAL ''30 days'' GROUP BY network_region;',
'[2]', 1, 2, 'active',
'[{"id": "dashboard-network-availability", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=Network+Availability"}]', 1, 'Initial version created'),

(4, 1, 'Total cost of acquiring a new customer, including marketing, sales, and onboarding expenses divided by the number of new customers acquired.',
'SELECT SUM(marketing_spend + sales_cost + onboarding_cost) / COUNT(DISTINCT new_customer_id) as cac FROM acquisition_costs ac JOIN new_customers nc ON ac.campaign_id = nc.acquisition_campaign WHERE date_trunc(''month'', nc.signup_date) = date_trunc(''month'', CURRENT_DATE);',
'[1, 3]', 3, 4, 'active',
'[{"id": "dashboard-cac", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=CAC+Dashboard"}]', 3, 'Initial version created'),

(5, 1, 'Average monthly data consumption per active subscriber across all service plans and device types.',
'SELECT AVG(monthly_data_usage_gb) as avg_data_usage, service_plan, device_type FROM subscriber_usage WHERE date_trunc(''month'', usage_date) = date_trunc(''month'', CURRENT_DATE) AND subscriber_status = ''active'' GROUP BY service_plan, device_type;',
'[2]', 1, 2, 'active',
'[{"id": "dashboard-data-usage", "title": "", "subtitle": "", "text": "", "endContent": "image", "imageUrl": "/placeholder.svg?height=200&width=400&text=Data+Usage+Trends"}]', 1, 'Initial version created');

-- Now update KPIs to reference their active versions
UPDATE kpis SET active_version = 1 WHERE id = 1;
UPDATE kpis SET active_version = 2 WHERE id = 2;
UPDATE kpis SET active_version = 3 WHERE id = 3;
UPDATE kpis SET active_version = 4 WHERE id = 4;
UPDATE kpis SET active_version = 5 WHERE id = 5; 

-- Approvals for KPI versions
CREATE TABLE IF NOT EXISTS kpi_approvals (
    id SERIAL PRIMARY KEY,
    kpi_version_id INTEGER NOT NULL REFERENCES kpi_versions(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (kpi_version_id, user_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL, -- e.g. 'approval_request', 'version_approved', 'version_rejected'
    message TEXT NOT NULL,
    kpi_version_id INTEGER REFERENCES kpi_versions(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: kpi_versions.status remains VARCHAR(20); now used values:
-- 'pending_approval' | 'active' | 'inactive' | 'rejected' 