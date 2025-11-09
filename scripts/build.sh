#!/bin/bash

# Check if DIRECT_URL is set, if not use DATABASE_URL
if [ -z "$DIRECT_URL" ]; then
  echo "⚠️  DIRECT_URL not set, using DATABASE_URL for both pooled and direct connections"
  export DIRECT_URL="$DATABASE_URL"
fi

# Run the actual build
echo "🔧 Generating Prisma Client..."
npx prisma generate

echo "📊 Pushing database schema..."
npx prisma db push --accept-data-loss

echo "🏗️  Building Next.js application..."
npx next build

echo "✅ Build complete!"
