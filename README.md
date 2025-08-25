# KPI Nexus Platform 📊

A comprehensive, enterprise-grade Key Performance Indicator (KPI) documentation and management platform designed to streamline the creation, approval, and maintenance of business metrics. Built with modern web technologies, KPI Nexus Platform provides a robust foundation for data teams, business analysts, and stakeholders to collaborate effectively on KPI definitions and implementations.

## 🎯 Value Proposition

KPI Nexus Platform addresses the critical need for centralized, version-controlled KPI documentation that bridges the gap between technical implementation and business understanding. By providing a structured workflow for KPI creation, approval, and maintenance, organizations can ensure data consistency, improve collaboration, and maintain a single source of truth for all business metrics.

**Target Audience**: Data teams, business analysts, product managers, and stakeholders who need to define, document, and maintain KPIs in a collaborative environment.

## 📋 Table of Contents

- [Features](#-features)
- [Demo/Screenshots](#-demoscreenshots)
- [Installation & Setup](#-installation--setup)
- [Usage/How to Run](#-usagehow-to-run)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack & Tools](#-tech-stack--tools)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [License](#-license)
- [Contact/Support](#-contactsupport)

## ✨ Features

### Core KPI Management
- **KPI Creation & Editing**: Comprehensive forms for defining KPIs with SQL queries, business definitions, and metadata
- **Version Control**: Complete versioning system with change tracking and approval workflows
- **Topic Organization**: Categorized KPI management with customizable topics and icons
- **Additional Content Blocks**: Support for code snippets, images, and rich text documentation

### User Management & Security
- **Role-Based Access Control**: Four distinct user roles (admin, data_specialist, business_specialist, user)
- **Authentication System**: JWT-based secure authentication with password management
- **User Invitation System**: Admin-controlled user onboarding with role assignment
- **Force Password Change**: Security feature for new or compromised accounts

### Approval Workflow
- **Multi-Stage Approval**: Configurable approval process for KPI versions
- **Notification System**: Real-time notifications for pending approvals and status changes
- **Approval History**: Complete audit trail of all approval decisions
- **Concurrent Approval Handling**: Robust handling of multiple approvers

### Data Visualization & Reporting
- **Dashboard Overview**: Centralized view of KPIs, topics, and pending items
- **Search & Filtering**: Advanced search capabilities across KPI metadata
- **Status Tracking**: Real-time visibility into KPI lifecycle and approval status
- **Export Capabilities**: Data export for reporting and analysis

### Technical Features
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live data synchronization using React Query
- **File Upload System**: Image upload support for KPI documentation
- **API-First Architecture**: RESTful API with comprehensive error handling

## 🚀 Installation & Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher (or yarn/bun)
- **PostgreSQL**: Version 15 or higher
- **Docker**: Version 20.10 or higher (optional, for containerized setup)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kpi-nexus-platform-lov
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   PORT=3001
   JWT_SECRET=
   DB_HOST=
   DB_USER=
   DB_PASSWORD=
   DB_NAME=
   DB_PORT=5432
   ```

### Database Setup

1. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE kpi_nexus;
   ```

2. **Initialize schema**
   ```bash
   psql -d kpi_nexus -f database/schema.sql
   ```

### Docker Setup (Alternative)

For containerized deployment, use the provided Docker Compose configuration:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Backend API on port 3001
- Frontend development server on port 8080

## 🚀 Usage/How to Run

### Development Mode

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Production Build

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm run preview
   ```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend (from backend directory)
npm run dev          # Start with nodemon
npm start            # Start production server
```

## 🏗️ Architecture Overview

KPI Nexus Platform follows a modern, scalable architecture pattern with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   PostgreSQL    │
│   (React + Vite)│◄──►│   (Express.js)  │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐           ┌─────────┐           ┌─────────┐
    │  State  │           │  Auth   │           │  Data   │
    │Management│           │Middleware│           │Persistence│
    └─────────┘           └─────────┘           └─────────┘
```

### Data Flow

1. **Authentication**: JWT-based authentication with role-based access control
2. **API Layer**: RESTful API endpoints with comprehensive error handling
3. **State Management**: React Context + React Query for server state
4. **Database**: PostgreSQL with structured schema for KPI management
5. **File Storage**: Local file system for image uploads and attachments

### Design Patterns

- **Context Pattern**: Authentication and user state management
- **Repository Pattern**: Data access abstraction in backend
- **Middleware Pattern**: Authentication and validation layers
- **Component Composition**: Reusable UI components with shadcn/ui

## 🛠️ Tech Stack & Tools

### Frontend Technologies
- **React 18.3.1**: Modern React with hooks and functional components
- **TypeScript 5.5.3**: Type-safe JavaScript development
- **Vite 5.4.1**: Fast build tool and development server
- **Tailwind CSS 3.4.11**: Utility-first CSS framework
- **shadcn/ui**: High-quality, accessible UI components

### Backend Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js 4.18.2**: Web application framework
- **PostgreSQL 15**: Relational database management system
- **JWT**: JSON Web Token authentication
- **Multer**: File upload handling

### Development Tools
- **ESLint**: Code quality and consistency
- **PostCSS**: CSS processing and optimization
- **React Router DOM**: Client-side routing
- **React Hook Form**: Form state management
- **Zod**: Schema validation

### State Management & Data Fetching
- **TanStack React Query**: Server state management
- **React Context**: Local state management
- **React Hook Form**: Form state and validation

### UI/UX Libraries
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Beautiful, customizable icons
- **Sonner**: Toast notifications
- **Recharts**: Data visualization components

## 🔄 How It Works

### Core Functionality

KPI Nexus Platform operates on a sophisticated workflow that ensures data quality and collaboration:

1. **KPI Definition**: Data specialists create KPIs with SQL queries, business definitions, and metadata
2. **Topic Organization**: KPIs are categorized into topics for better organization and discovery
3. **Version Control**: Each KPI modification creates a new version with change tracking
4. **Approval Workflow**: Business specialists review and approve KPI versions
5. **Publication**: Approved versions become active and visible to all users
6. **Maintenance**: Continuous improvement through feedback and iteration

### User Workflow

#### Data Specialist Journey
1. **Login** → Access to KPI creation and editing tools
2. **Create KPI** → Define metric, SQL query, and business context
3. **Submit for Review** → KPI enters approval workflow
4. **Iterate** → Make improvements based on feedback

#### Business Specialist Journey
1. **Review Queue** → View pending KPI approvals
2. **Evaluate** → Assess business relevance and accuracy
3. **Approve/Reject** → Make decision with feedback
4. **Monitor** → Track KPI performance and usage

#### Admin Journey
1. **User Management** → Invite users and assign roles
2. **System Configuration** → Manage topics and system settings
3. **Oversight** → Monitor platform usage and performance

### Data Processing Approach

- **Real-time Updates**: Live synchronization using React Query
- **Optimistic Updates**: Immediate UI feedback with background synchronization
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Data Validation**: Client and server-side validation using Zod schemas

## 📁 Project Structure

```
kpi-nexus-platform-lov/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── Dashboard.tsx        # Main dashboard component
│   │   ├── KPICreationTemplate.tsx  # KPI creation form
│   │   ├── KPIArticlePage.tsx   # KPI detail view
│   │   ├── UserManagement.tsx   # User administration
│   │   └── ...                  # Other UI components
│   ├── contexts/                 # React contexts
│   │   └── AuthContext.tsx      # Authentication context
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # Page components
│   │   ├── Index.tsx            # Main application entry
│   │   └── NotFound.tsx         # 404 error page
│   ├── services/                 # API services
│   │   └── api.ts               # API client and endpoints
│   ├── types/                    # TypeScript type definitions
│   │   └── kpi.ts               # KPI-related types
│   ├── App.tsx                   # Main application component
│   └── main.tsx                  # Application entry point
├── backend/                      # Backend Node.js application
│   ├── server.js                # Express.js server
│   ├── package.json             # Backend dependencies
│   └── ...                      # Backend utilities
├── database/                     # Database schema and migrations
│   └── schema.sql               # PostgreSQL schema definition
├── uploads/                      # File upload storage
├── public/                       # Static assets
├── docker-compose.yml            # Docker orchestration
├── Dockerfile                    # Container configuration
├── package.json                  # Frontend dependencies
└── README.md                     # This file
```

### Key Files and Purposes

- **`src/App.tsx`**: Main application routing and layout
- **`src/contexts/AuthContext.tsx`**: Authentication and user state management
- **`src/services/api.ts`**: API client and endpoint definitions
- **`backend/server.js`**: Express.js server with all API endpoints
- **`database/schema.sql`**: Complete database structure and initial data
- **`docker-compose.yml`**: Multi-service container orchestration

## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
Authenticate user and return JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "john.doe",
    "email": "john.doe@company.com",
    "role": "data_specialist"
  }
}
```

### KPI Management Endpoints

#### GET `/api/kpis`
Retrieve all KPIs with pagination and filtering.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "1",
    "name": "Monthly Revenue",
    "definition": "Total monthly revenue from all sources",
    "status": "active",
    "topics": [1, 2],
    "dataSpecialist": "John Doe",
    "businessSpecialist": "Jane Smith"
  }
]
```

#### POST `/api/kpis`
Create a new KPI.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "New KPI",
  "definition": "KPI description",
  "sqlQuery": "SELECT COUNT(*) FROM table",
  "topics": [1],
  "dataSpecialist": "John Doe",
  "businessSpecialist": "Jane Smith"
}
```

#### PUT `/api/kpis/:id`
Update an existing KPI.

#### DELETE `/api/kpis/:id`
Delete a KPI (admin only).

### User Management Endpoints

#### GET `/api/users`
Retrieve all users (admin only).

#### POST `/api/users/invite`
Invite a new user to the platform.

#### PUT `/api/users/:id`
Update user information.

### Approval Workflow Endpoints

#### GET `/api/pending-approvals`
Retrieve pending KPI approvals for the current user.

#### POST `/api/kpi-versions/:id/approve`
Approve a KPI version.

#### POST `/api/kpi-versions/:id/reject`
Reject a KPI version.

### File Upload Endpoints

#### POST `/api/kpi/upload-image`
Upload an image for KPI documentation.

**Headers:** `Authorization: Bearer <token>`

**Body:** `FormData` with image file

**Response:**
```json
{
  "success": true,
  "filePath": "/uploads/kpi-images/1234567890_abc123_image.jpg",
  "filename": "1234567890_abc123_image.jpg",
  "originalName": "image.jpg",
  "size": 1024000
}
```

## 🤝 Contributing

We welcome contributions to KPI Nexus Platform! Please follow these guidelines:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run lint
   ```
5. **Commit your changes**
   ```bash
   git commit -m "feat: add new feature description"
   ```
6. **Push to your branch**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Code Style Standards

- **TypeScript**: Strict typing with proper interfaces
- **React**: Functional components with hooks
- **CSS**: Tailwind CSS utility classes
- **Naming**: Descriptive, camelCase for variables, PascalCase for components
- **Comments**: JSDoc comments for complex functions

### Pull Request Process

1. **Description**: Clear description of changes and rationale
2. **Testing**: Include tests for new functionality
3. **Documentation**: Update relevant documentation
4. **Review**: Address feedback from code reviewers

## 🧪 Testing

### Running Tests

```bash
# Frontend tests (when implemented)
npm test

# Backend tests (when implemented)
cd backend
npm test

# E2E tests (when implemented)
npm run test:e2e
```

### Testing Frameworks

- **Unit Testing**: Jest (planned)
- **Component Testing**: React Testing Library (planned)
- **E2E Testing**: Playwright (planned)
- **API Testing**: Supertest (planned)

### Test Coverage

- **Target Coverage**: 80%+ for critical business logic
- **Coverage Areas**: Components, services, utilities, API endpoints
- **Testing Strategy**: Unit tests for business logic, integration tests for API, E2E tests for user workflows

## 🚀 Deployment

### Production Deployment

1. **Environment Configuration**
   ```bash
   # Set production environment variables
   NODE_ENV=
   JWT_SECRET=
   DB_HOST=
   ```

2. **Build and Deploy**
   ```bash
   # Build frontend
   npm run build
   
   # Deploy backend
   cd backend
   npm start
   ```

3. **Database Migration**
   ```bash
   psql -h your-db-host -U your-user -d kpi_nexus -f database/schema.sql
   ```

### Docker Deployment

```bash
# Production build
docker-compose -f docker-compose.prod.yml up -d

# Or build and run manually
docker build -t kpi-nexus .
docker run -p 3001:3001 -p 8080:8080 kpi-nexus
```

### Hosting Recommendations

- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: AWS EC2, Google Cloud Run, or Heroku
- **Database**: AWS RDS, Google Cloud SQL, or managed PostgreSQL service
- **File Storage**: AWS S3, Google Cloud Storage, or similar object storage

### Environment Variables

```env
# Production
NODE_ENV=production
PORT=3001
JWT_SECRET=
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
DB_PORT=5432
CORS_ORIGIN=
```

## 📄 License

All rights reserved.

**All Rights Reserved Summary:**
- ❌ No commercial use without permission
- ❌ No modification without permission  
- ❌ No distribution without permission
- ❌ No private use without permission
- ❌ No liability
- ❌ No warranty

Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.
