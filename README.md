# Tiles Inventory Management System

A comprehensive inventory management system built specifically for tiles showrooms and retailers. Features include product management, purchase orders, sales orders, inventory tracking, and detailed reporting with server-side pagination and advanced filtering.

## Features

### 🔐 Authentication
- Secure login system with JWT tokens
- Role-based access control (Admin/User)
- Session management with automatic logout

### 📦 Product Management
- Complete product catalog with brands, categories, and finish types
- Advanced filtering by brand, category, status, date range
- Server-side pagination for optimal performance
- Product specifications (dimensions, pieces per box, square feet per box)
- Image upload support with Cloudinary integration

### 🛒 Purchase Orders
- Create and manage purchase orders from suppliers
- Track order status (Pending, Confirmed, Received, Cancelled)
- Date range filtering and advanced search
- Automatic order number generation
- Supplier/brand management

### 💰 Sales Orders
- Customer order management
- Order tracking and status updates
- Customer information storage
- Discount and final amount calculations
- Delivery date tracking

### 📊 Inventory Management
- Real-time stock tracking by batches
- Location-based inventory management
- Low stock alerts and notifications
- Batch tracking with shade variations
- Purchase and selling price management
- Stock valuation reports

### 📈 Dashboard & Analytics
- Real-time inventory statistics
- Sales vs purchase analytics
- Low stock alerts
- Recent order tracking
- Visual charts and graphs

### 🔍 Advanced Features
- Server-side pagination for all data tables
- Advanced filtering and sorting options
- Date range filtering across all modules
- Export functionality for reports
- Responsive design for all devices
- Pixel-perfect UI/UX design

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with custom middleware
- **UI Components**: Radix UI with Tailwind CSS
- **Charts**: Recharts
- **Image Upload**: Cloudinary
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ (Note: Current version uses Node 18.20.8, but Next.js 16 requires Node 20+)
- PostgreSQL database
- Cloudinary account (for image uploads)

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tiles-inventory
   ```

2. **Install dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/tiles_inventory?schema=public"
   
   # JWT Secret
   JWT_SECRET="your-super-secret-jwt-key-here"
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Next.js
   NEXTAUTH_SECRET=your-secret-key
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed database with sample data
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Login Credentials

After running the seed script, you can login with:
- **Email**: admin@tiles.com
- **Password**: admin123

## Database Schema

The system uses the following main entities:

- **Users**: Authentication and user management
- **Brands**: Tile manufacturers and suppliers
- **Categories**: Product categorization (Floor Tiles, Wall Tiles, etc.)
- **FinishTypes**: Surface finish types (Glossy, Matt, etc.)
- **Products**: Complete product catalog
- **Locations**: Storage locations and warehouses
- **Batches**: Inventory tracking by batches with stock levels
- **PurchaseOrders**: Purchase order management
- **SalesOrders**: Sales order management
- **PurchaseItems/SalesItems**: Order line items

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - Get products with pagination and filtering
- `POST /api/products` - Create new product

### Brands
- `GET /api/brands` - Get brands with pagination
- `POST /api/brands` - Create new brand

### Categories
- `GET /api/categories` - Get categories with pagination
- `POST /api/categories` - Create new category

### Purchase Orders
- `GET /api/purchase-orders` - Get purchase orders with filtering
- `POST /api/purchase-orders` - Create new purchase order

### Sales Orders
- `GET /api/sales-orders` - Get sales orders with filtering
- `POST /api/sales-orders` - Create new sales order

### Inventory
- `GET /api/inventory` - Get inventory batches with filtering
- `POST /api/inventory` - Create new inventory batch

### Locations
- `GET /api/locations` - Get locations
- `POST /api/locations` - Create new location

## Key Features Implementation

### Server-Side Pagination
All data tables implement server-side pagination with:
- Configurable page sizes (10, 25, 50, 100)
- Total count and page information
- Navigation controls

### Advanced Filtering
Each module supports filtering by:
- Text search across multiple fields
- Date range filtering
- Status-based filtering
- Category/brand filtering
- Custom sorting options

### Authentication Middleware
- JWT-based authentication
- Route protection for all pages except login
- Automatic token validation
- Session management

### Responsive Design
- Mobile-first approach
- Responsive tables with horizontal scrolling
- Adaptive layouts for different screen sizes
- Touch-friendly interface

## Development Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
```

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── products/       # Product management
│   │   ├── brands/         # Brand management
│   │   ├── categories/     # Category management
│   │   ├── purchase-orders/# Purchase order management
│   │   ├── sales-orders/   # Sales order management
│   │   ├── inventory/      # Inventory management
│   │   └── locations/      # Location management
│   ├── brands/             # Brands page
│   ├── categories/         # Categories page
│   ├── inventory/          # Inventory page
│   ├── login/              # Login page
│   ├── products/           # Products page
│   ├── purchase-orders/    # Purchase orders page
│   ├── sales-orders/       # Sales orders page
│   ├── reports/            # Reports page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Dashboard page
├── components/
│   ├── layout/             # Layout components
│   │   ├── layout.tsx      # Main layout wrapper
│   │   └── sidebar.tsx     # Navigation sidebar
│   └── ui/                 # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── table.tsx
│       ├── select.tsx
│       ├── dialog.tsx
│       └── badge.tsx
├── lib/
│   ├── prisma.ts           # Prisma client configuration
│   └── utils.ts            # Utility functions
└── types/                  # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Note**: This system is designed specifically for tiles inventory management and includes industry-specific features like batch tracking, shade variations, and square footage calculations.