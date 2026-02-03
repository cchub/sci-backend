# SCI Analysis Platform

## Description

The Social Interconnectedness Index (SCI) platform analyzes trade relationships and opportunities among African countries. The system processes economic data from Google Sheets and generates comprehensive trade reports with PDF outputs.

## Tech Stack

### Backend
- **Node.js** (v15.x) with Express.js framework
- **MongoDB** for data persistence
- **Redis** for caching and job queuing
- **Bull** for background job processing

### Data Sources & Integration
- **Google Sheets API** - Primary data source for trade and economic data
- **Google Drive API** - File storage and synchronization
- **Exchange Rates API** - Real-time currency conversion

### Document Generation
- **PDF Generation** - HTML-PDF, PDFKit, Hummus for report creation
- **EJS Templates** - Dynamic report templating
- **Email Templates** - Automated report distribution

### Infrastructure
- **Docker & Docker Compose** - Containerized deployment
- **PM2** - Process management
- **Winston** - Logging system
- **Swagger** - API documentation

## Data Flow & Google Sheets Integration

### Primary Data Sources
1. **Main Spreadsheet**: `1JwRPkg_c1lEXnyysb4x_hJEdRtla9EnerEn4NQBRQ9c`
   - Contains report metadata and configuration
   - Processed via `Report_info` sheet

2. **Google Drive Files**:
   - `comprehensive_dataset_wide.json` - Main trade dataset
   - `Section Level Data.json` - Sectoral analysis data
   - `Official exchange rate(2019).json` - Currency data

### Data Processing Pipeline
1. **Automated Sync**: Background workers fetch data from Google Sheets/Drive
2. **Data Transformation**: Raw data is processed and categorized
3. **Report Generation**: Dynamic PDF reports created using templates
4. **Caching**: Processed data cached in Redis for performance

### Key Features
- Real-time data synchronization from Google Sheets
- Automated foreign exchange rate updates
- Multi-country trade analysis (Kenya, Nigeria, Rwanda)
- PDF report generation with country-specific branding
- Email distribution system for reports

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Google Service Account credentials

### Setup

1. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Request credentials from kelly@cchub.africa
   ```

2. **Google Service Account**
   - Place your `drive.json` credentials file in the root directory
   - Ensure the service account has access to the required Google Sheets and Drive folders

3. **Start Services**
   ```bash
   docker-compose up -d --build
   ```

4. **View Logs**
   ```bash
   docker-compose logs -f app
   ```

### API Endpoints
- **Base URL**: `http://localhost:8282/api`
- **Documentation**: `http://localhost:8282/api-docs`
- **Health Check**: `http://localhost:8282/api/health`

### Background Jobs
The system runs automated jobs for:
- Daily foreign exchange rate updates
- Google Sheets data synchronization
- Report generation and distribution
- Data validation and cleanup

## Development

### Local Development
```bash
npm install
npm run start:development
```

### Testing
```bash
npm test
```

### Environment Variables
Key configuration variables:
- `SCI_ID` - Google Sheets document ID
- `ROOT_FOLDER_ID` - Google Drive root folder
- `MONGODB_CONNECTION_URI` - Database connection
- `REDIS_HOST` - Cache server configuration

## Architecture

```
Google Sheets/Drive → API Layer → Data Processing → MongoDB/Redis → Report Generation → PDF Output
```

The platform maintains a serverless-first approach with minimal database dependencies, leveraging Google Sheets as the primary data source for maximum flexibility and real-time updates.
