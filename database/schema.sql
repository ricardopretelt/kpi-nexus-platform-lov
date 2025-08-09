-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_admin BOOLEAN DEFAULT FALSE,
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

-- KPIs table
CREATE TABLE kpis (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    definition TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    topic_id INTEGER REFERENCES topics(id),
    data_specialist_id INTEGER REFERENCES users(id),
    business_specialist_id INTEGER REFERENCES users(id),
    dashboard_preview VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- KPI Versions table
CREATE TABLE kpi_versions (
    id SERIAL PRIMARY KEY,
    kpi_id INTEGER REFERENCES kpis(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    definition TEXT NOT NULL,
    sql_query TEXT NOT NULL,
    updated_by INTEGER REFERENCES users(id),
    changes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data with properly hashed passwords
-- Password for all users: "password123"
INSERT INTO users (username, email, password_hash, full_name, role, is_admin, force_password_change) VALUES
('john.doe', 'john.doe@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'John Doe', 'data_specialist', 't', 'f'),
('jane.smith', 'jane.smith@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Jane Smith', 'business_specialist', 'f', 'f'),
('emily.clark', 'emily.clark@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Emily Clark', 'data_specialist', 'f', 'f'),
('tom.brown', 'tom.brown@company.com', 'aa784089e796e8b4a4b6d3c92032c4755c6d7cf7520c7b66a722006232f05fa7', 'Tom Brown', 'business_specialist', 'f', 'f');

INSERT INTO topics (name, description, icon, color) VALUES
('Customer Retention', 'KPIs related to customer loyalty, churn, and acquisition', '', 'bg-blue-500'),
('Network Performance', 'Network uptime, quality, and performance metrics', '📡', 'bg-green-500'),
('Revenue Streams', 'Financial metrics and revenue-related KPIs', '💰', 'bg-purple-500');

INSERT INTO kpis (name, definition, sql_query, topic_id, data_specialist_id, business_specialist_id, dashboard_preview, status) VALUES
('Customer Churn Rate', 'Percentage of customers leaving the service monthly. This metric helps track customer retention and identify potential issues in service quality or customer satisfaction.', 
'SELECT (COUNT(CASE WHEN status = ''churned'' THEN 1 END) * 100.0) / COUNT(*) as churn_rate FROM customer_data WHERE date_trunc(''month'', churn_date) = date_trunc(''month'', CURRENT_DATE) GROUP BY date_trunc(''month'', churn_date);',
1, 1, 2, '/placeholder.svg?height=200&width=400&text=Churn+Rate+Dashboard', 'active'),

('Average Revenue Per User (ARPU)', 'Average monthly revenue generated per subscriber. This key financial metric helps assess the monetization effectiveness and customer value across different service tiers.',
'SELECT SUM(monthly_revenue) / COUNT(DISTINCT subscriber_id) as arpu FROM revenue_data WHERE date_trunc(''month'', billing_date) = date_trunc(''month'', CURRENT_DATE) AND subscriber_status = ''active'';',
3, 3, 4, '/placeholder.svg?height=200&width=400&text=ARPU+Dashboard', 'active'),

('Network Availability', 'Percentage of time network services are operational and accessible to customers. Critical metric for SLA compliance and customer satisfaction.',
'SELECT (SUM(uptime_minutes) * 100.0) / SUM(total_minutes) as availability_percentage FROM network_performance WHERE date_trunc(''day'', measurement_date) >= CURRENT_DATE - INTERVAL ''30 days'' GROUP BY network_region;',
2, 1, 2, '/placeholder.svg?height=200&width=400&text=Network+Availability', 'active'),

('Customer Acquisition Cost (CAC)', 'Total cost of acquiring a new customer, including marketing, sales, and onboarding expenses divided by the number of new customers acquired.',
'SELECT SUM(marketing_spend + sales_cost + onboarding_cost) / COUNT(DISTINCT new_customer_id) as cac FROM acquisition_costs ac JOIN new_customers nc ON ac.campaign_id = nc.acquisition_campaign WHERE date_trunc(''month'', nc.signup_date) = date_trunc(''month'', CURRENT_DATE);',
1, 3, 4, '/placeholder.svg?height=200&width=400&text=CAC+Dashboard', 'active'),

('Data Usage Per Subscriber', 'Average monthly data consumption per active subscriber across all service plans and device types.',
'SELECT AVG(monthly_data_usage_gb) as avg_data_usage, service_plan, device_type FROM subscriber_usage WHERE date_trunc(''month'', usage_date) = date_trunc(''month'', CURRENT_DATE) AND subscriber_status = ''active'' GROUP BY service_plan, device_type;',
2, 1, 2, '/placeholder.svg?height=200&width=400&text=Data+Usage+Trends', 'active');

INSERT INTO kpi_versions (kpi_id, version_number, definition, sql_query, updated_by, changes) VALUES
(1, 1, 'Initial definition of customer churn rate', 'SELECT COUNT(churned_customers) / COUNT(total_customers) FROM customer_data;', 1, 'Initial version created'),
(1, 2, 'Percentage of customers leaving the service monthly. This metric helps track customer retention and identify potential issues in service quality or customer satisfaction.', 
'SELECT (COUNT(CASE WHEN status = ''churned'' THEN 1 END) * 100.0) / COUNT(*) as churn_rate FROM customer_data WHERE date_trunc(''month'', churn_date) = date_trunc(''month'', CURRENT_DATE) GROUP BY date_trunc(''month'', churn_date);', 2, 'Enhanced definition and improved SQL query for monthly calculations'),
(2, 1, 'Average monthly revenue generated per subscriber. This key financial metric helps assess the monetization effectiveness and customer value across different service tiers.',
'SELECT SUM(monthly_revenue) / COUNT(DISTINCT subscriber_id) as arpu FROM revenue_data WHERE date_trunc(''month'', billing_date) = date_trunc(''month'', CURRENT_DATE) AND subscriber_status = ''active'';', 3, 'Initial version created with comprehensive definition'),
(3, 1, 'Percentage of time network services are operational and accessible to customers. Critical metric for SLA compliance and customer satisfaction.',
'SELECT (SUM(uptime_minutes) * 100.0) / SUM(total_minutes) as availability_percentage FROM network_performance WHERE date_trunc(''day'', measurement_date) >= CURRENT_DATE - INTERVAL ''30 days'' GROUP BY network_region;', 1, 'Initial version with 30-day rolling window'),
(4, 1, 'Total cost of acquiring a new customer, including marketing, sales, and onboarding expenses divided by the number of new customers acquired.',
'SELECT SUM(marketing_spend + sales_cost + onboarding_cost) / COUNT(DISTINCT new_customer_id) as cac FROM acquisition_costs ac JOIN new_customers nc ON ac.campaign_id = nc.acquisition_campaign WHERE date_trunc(''month'', nc.signup_date) = date_trunc(''month'', CURRENT_DATE);', 3, 'Initial comprehensive CAC calculation'),
(5, 1, 'Average monthly data consumption per active subscriber across all service plans and device types.',
'SELECT AVG(monthly_data_usage_gb) as avg_data_usage, service_plan, device_type FROM subscriber_usage WHERE date_trunc(''month'', usage_date) = date_trunc(''month'', CURRENT_DATE) AND subscriber_status = ''active'' GROUP BY service_plan, device_type;', 1, 'Initial data usage tracking by plan and device'); 