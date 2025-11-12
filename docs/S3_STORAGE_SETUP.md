# S3 Storage Setup Guide

This AI CMS uses S3-compatible storage for media file management. This guide will help you set up storage with various providers.

## Why S3 Storage?

When deploying to serverless platforms like Vercel, the local filesystem is **read-only** and temporary. S3-compatible storage provides:

- ✅ Persistent file storage
- ✅ Scalable and reliable
- ✅ Works with Vercel, Netlify, and other serverless platforms
- ✅ Support for multiple providers (AWS S3, Cloudflare R2, DigitalOcean Spaces, etc.)

## Supported Providers

| Provider | Cost | Setup Difficulty | Recommended For |
|----------|------|------------------|-----------------|
| **Cloudflare R2** | Free 10GB storage | Easy | **Recommended** - Best for most users |
| AWS S3 | Pay-as-you-go | Medium | Enterprise, existing AWS users |
| DigitalOcean Spaces | $5/month (250GB) | Easy | DigitalOcean users |
| Backblaze B2 | Free 10GB, then pay | Easy | Cost-conscious users |
| MinIO | Self-hosted (free) | Hard | Self-hosting, development |

---

## Option 1: Cloudflare R2 (Recommended)

**Best choice for most users** - Free 10GB storage, no egress fees, fast global CDN.

### Step 1: Create R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Enter a bucket name (e.g., `my-cms-media`)
5. Click **Create bucket**

### Step 2: Create API Token

1. In R2 dashboard, go to **Manage R2 API Tokens**
2. Click **Create API token**
3. Set permissions: **Object Read & Write**
4. Click **Create API token**
5. Copy the **Access Key ID** and **Secret Access Key**

### Step 3: Configure Public Access

1. Open your bucket
2. Go to **Settings** tab
3. Under **Public access**, click **Allow Access**
4. Copy the **Public bucket URL**

### Step 4: Environment Variables

Add to your `.env` file:

```env
S3_ACCESS_KEY_ID="your-r2-access-key-id"
S3_SECRET_ACCESS_KEY="your-r2-secret-access-key"
S3_BUCKET_NAME="my-cms-media"
S3_REGION="auto"
S3_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
S3_PUBLIC_URL="https://pub-xxxxx.r2.dev"  # From step 3
```

**Find your account ID:**
- In Cloudflare dashboard, your account ID is in the URL: `dash.cloudflare.com/<account-id>/r2`

---

## Option 2: AWS S3

### Step 1: Create S3 Bucket

1. Go to [AWS S3 Console](https://console.aws.amazon.com/s3)
2. Click **Create bucket**
3. Enter bucket name
4. Select region (e.g., `us-east-1`)
5. Uncheck **Block all public access** (for public media)
6. Click **Create bucket**

### Step 2: Configure Bucket Policy

1. Open your bucket
2. Go to **Permissions** tab
3. Click **Bucket Policy** > **Edit**
4. Add this policy (replace `YOUR-BUCKET-NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### Step 3: Create IAM User

1. Go to [IAM Console](https://console.aws.amazon.com/iam)
2. Create new user with **Programmatic access**
3. Attach policy: **AmazonS3FullAccess** (or create custom policy)
4. Save **Access Key ID** and **Secret Access Key**

### Step 4: Environment Variables

```env
S3_ACCESS_KEY_ID="your-aws-access-key"
S3_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="your-bucket-name"
S3_REGION="us-east-1"  # Your bucket region
# S3_ENDPOINT is not needed for AWS S3
# S3_PUBLIC_URL is not needed (will auto-generate)
```

---

## Option 3: DigitalOcean Spaces

### Step 1: Create Space

1. Go to [DigitalOcean Spaces](https://cloud.digitalocean.com/spaces)
2. Click **Create a Space**
3. Choose datacenter region
4. Enable **CDN** (recommended)
5. Name your space
6. Click **Create a Space**

### Step 2: Generate API Keys

1. Go to **API** section
2. Click **Spaces Keys** tab
3. Click **Generate New Key**
4. Name your key and save **Access Key** and **Secret Key**

### Step 3: Environment Variables

```env
S3_ACCESS_KEY_ID="your-do-spaces-key"
S3_SECRET_ACCESS_KEY="your-do-spaces-secret"
S3_BUCKET_NAME="your-space-name"
S3_REGION="nyc3"  # Your space region
S3_ENDPOINT="https://nyc3.digitaloceanspaces.com"
S3_PUBLIC_URL="https://your-space-name.nyc3.cdn.digitaloceanspaces.com"  # If CDN enabled
S3_FORCE_PATH_STYLE="true"
```

---

## Option 4: Backblaze B2

### Step 1: Create Bucket

1. Go to [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Navigate to **Buckets** > **Create a Bucket**
3. Name your bucket
4. Set **Files in Bucket are** to **Public**
5. Click **Create a Bucket**

### Step 2: Create Application Key

1. Go to **App Keys**
2. Click **Add a New Application Key**
3. Give it a name
4. Allow access to your bucket
5. Save **keyID** and **applicationKey**

### Step 3: Environment Variables

```env
S3_ACCESS_KEY_ID="your-b2-key-id"
S3_SECRET_ACCESS_KEY="your-b2-application-key"
S3_BUCKET_NAME="your-bucket-name"
S3_REGION="us-west-002"  # Your endpoint region
S3_ENDPOINT="https://s3.us-west-002.backblazeb2.com"
```

---

## Option 5: MinIO (Self-Hosted)

Good for development or if you want to self-host.

### Step 1: Install MinIO

```bash
# Docker
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"
```

### Step 2: Create Bucket

1. Open MinIO Console at http://localhost:9001
2. Login with credentials
3. Create a new bucket
4. Set bucket policy to **public** (for public access)

### Step 3: Environment Variables

```env
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET_NAME="cms-media"
S3_REGION="us-east-1"
S3_ENDPOINT="http://localhost:9000"
S3_FORCE_PATH_STYLE="true"
```

---

## Database Migration

After configuring S3, run the database migration to add new fields:

```bash
# Apply migration
psql $DATABASE_URL -f prisma/migrations/add_media_fields.sql

# Or use Prisma
npx prisma db push
```

---

## Vercel Deployment

### Step 1: Add Environment Variables

In your Vercel project settings:

1. Go to **Settings** > **Environment Variables**
2. Add all `S3_*` variables from your `.env` file
3. Click **Save**

### Step 2: Redeploy

```bash
# Trigger new deployment
git push origin main

# Or use Vercel CLI
vercel --prod
```

---

## Testing Upload

1. Login to your CMS admin panel
2. Go to **Media Library**
3. Upload a test image
4. Verify the file appears with correct thumbnail
5. Check your S3 bucket to confirm file exists

---

## Troubleshooting

### "S3 storage is not configured" Error

**Cause:** Missing or invalid environment variables

**Solution:**
1. Verify all required `S3_*` variables are set
2. Check for typos in variable names
3. Restart your development server
4. On Vercel, redeploy after adding variables

### Upload Returns 500 Error

**Cause:** Invalid credentials or bucket permissions

**Solution:**
1. Verify your Access Key and Secret Key are correct
2. Check bucket exists and is accessible
3. Ensure bucket allows public reads
4. Check endpoint URL is correct

### Images Not Loading

**Cause:** Incorrect public URL or bucket policy

**Solution:**
1. Verify `S3_PUBLIC_URL` is set correctly
2. Check bucket has public read access
3. Test direct URL access to uploaded file
4. Check CORS settings if using custom domain

### "Access Denied" Error

**Cause:** Insufficient IAM permissions

**Solution:**
1. Ensure IAM user/token has PutObject and DeleteObject permissions
2. Check bucket policy allows uploads
3. Verify ACL settings allow public-read

---

## Cost Optimization Tips

1. **Enable CDN** - Use Cloudflare R2's free CDN or CloudFront with S3
2. **Compress images** - The CMS automatically optimizes images with Sharp
3. **Lifecycle policies** - Auto-delete old thumbnails after X days
4. **Monitor usage** - Set up billing alerts

---

## Security Best Practices

1. **Never commit** `.env` file to git
2. **Rotate keys** regularly
3. **Use least privilege** - Only grant necessary permissions
4. **Enable MFA** on cloud accounts
5. **Use separate buckets** for dev/staging/production

---

## Features Implemented

✅ **File Upload** - Upload to S3 with validation
✅ **Image Optimization** - Auto-generate thumbnails and optimized versions
✅ **File Management** - Delete, update alt text
✅ **Batch Operations** - Delete multiple files at once
✅ **Search & Filter** - Find files by name, type, or date
✅ **Media Selector** - Pick images from library in post editor
✅ **Metadata Tracking** - Store dimensions, size, uploader info

---

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/yourusername/ai-cms/issues)
- Review the [troubleshooting section](#troubleshooting)
- Consult provider documentation linked above

---

**Recommended Setup:** Start with **Cloudflare R2** for the best balance of cost, performance, and ease of use.
