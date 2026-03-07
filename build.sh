#!/bin/bash
echo "Starting build process..."

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build Next.js app
echo "Building Next.js app..."
npm run build

echo "Build completed successfully!"