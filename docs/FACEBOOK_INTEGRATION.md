# Facebook Integration Guide

This guide explains how to set up and use the Facebook integration feature in AI CMS.

## Overview

The Facebook integration allows you to:

- Connect multiple Facebook pages to your CMS
- Publish CMS posts directly to Facebook
- Track post performance (likes, shares, comments)
- Schedule posts for later publication
- Manage all Facebook posts from one dashboard

## Prerequisites

Before you begin, make sure you have:

- A Facebook account with admin access to at least one Facebook page
- A Facebook Developer account
- Your CMS deployed and accessible via HTTPS (required for Facebook OAuth)

## Setup Instructions

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in the app details:
   - **App Name**: Choose a name (e.g., "My CMS")
   - **Contact Email**: Your email address
5. Click "Create App"

### Step 2: Configure Facebook Login

1. In your app dashboard, click "Add Product"
2. Find "Facebook Login" and click "Set Up"
3. Select "Web" as the platform
4. Enter your site URL (e.g., `https://yourdomain.com`)
5. Go to **Settings > Basic** and note your:
   - **App ID**
   - **App Secret** (click "Show" to reveal)

### Step 3: Configure OAuth Redirect URIs

1. In the left sidebar, click **Facebook Login > Settings**
2. Add your callback URL to **Valid OAuth Redirect URIs**:
   ```
   https://yourdomain.com/admin/facebook/callback
   ```
3. Click "Save Changes"

### Step 4: Add Required Permissions

1. Go to **App Review > Permissions and Features**
2. Request the following permissions:
   - `pages_show_list` - View list of pages
   - `pages_read_engagement` - Read page engagement data
   - `pages_manage_posts` - Create, edit and delete posts
   - `pages_manage_engagement` - Manage comments, reactions

Note: Some permissions may require app review by Facebook. For development and testing, you can use the app in Development Mode.

### Step 5: Configure Environment Variables

Add the following to your `.env` file:

```env
# Facebook Configuration
FACEBOOK_APP_ID="your-app-id-here"
FACEBOOK_APP_SECRET="your-app-secret-here"

# Optional: Custom encryption key (otherwise uses NEXTAUTH_SECRET)
ENCRYPTION_SECRET="your-encryption-secret"
```

### Step 6: Run Database Migration

Run the Prisma migration to create the Facebook tables:

```bash
npx prisma migrate deploy
```

Or if in development:

```bash
npx prisma migrate dev
```

### Step 7: Restart Your Application

Restart your Next.js application to load the new environment variables:

```bash
npm run dev
# or for production
npm run build && npm start
```

## Usage Guide

### Connecting a Facebook Page

1. Log in to your CMS admin panel
2. Navigate to **Facebook** in the main menu
3. Click **Connect Facebook Page**
4. You'll be redirected to Facebook to authorize the app
5. Select the Facebook pages you want to connect
6. Click "Continue" to complete the connection
7. You'll be redirected back to your CMS with the pages connected

### Publishing to Facebook

#### Option 1: Publish an Existing Post

1. Go to **Facebook** page in admin
2. In the "Publish to Facebook" section:
   - Select a **Facebook Page**
   - Select a **Post** from your CMS
   - The message will auto-populate with the post title and excerpt
   - Optionally edit the message
   - Choose whether to include the link and cover image
3. Click **Publish to Facebook**

#### Option 2: Custom Message

1. Go to **Facebook** page in admin
2. In the "Publish to Facebook" section:
   - Select a **Facebook Page**
   - Leave **Post** as "Custom message"
   - Write your custom message
3. Click **Publish to Facebook**

### Managing Facebook Posts

The **Publishing History** section shows all your Facebook posts with:

- **Status**: PENDING, PUBLISHED, FAILED, or DELETED
- **Engagement metrics**: Likes, shares, comments
- **Links** to view the post on Facebook
- **Actions**: Refresh insights, delete post

#### Refreshing Post Insights

Click the refresh icon next to a published post to update its engagement metrics (likes, shares, comments).

#### Deleting a Facebook Post

Click the trash icon to delete a post. This will:
1. Delete the post from Facebook (if published)
2. Remove the record from your CMS database

### Managing Connected Pages

In the **Connected Facebook Pages** section:

- **Enable/Disable** pages for publishing
- **View** connection details and expiration dates
- **Delete** page connections

## Security Features

### Token Encryption

All Facebook access tokens are encrypted using AES-256-GCM encryption before being stored in the database. This ensures that even if your database is compromised, the tokens remain secure.

### Token Expiration

Long-lived page access tokens are used, which typically last 60 days. The system tracks expiration dates and you'll need to reconnect pages when tokens expire.

### Permission Scopes

The integration only requests the minimum required permissions:
- View your pages
- Read engagement data
- Manage posts
- Manage engagement (comments, reactions)

## Troubleshooting

### "Facebook App ID is not configured"

**Solution**: Make sure you've added `FACEBOOK_APP_ID` to your `.env` file and restarted your application.

### "Failed to get Facebook authorization URL"

**Solution**: Check that:
1. Your `FACEBOOK_APP_ID` is correct
2. Your `NEXTAUTH_URL` or `APP_URL` is set correctly
3. Your application is accessible via HTTPS

### "This Facebook page is already connected"

**Solution**: Each Facebook page can only be connected once. If you need to reconnect, delete the existing connection first.

### "Failed to publish to Facebook"

**Possible causes**:
1. **Token expired**: Reconnect the Facebook page
2. **Page access revoked**: Check your Facebook page permissions
3. **Invalid content**: Make sure your message meets Facebook's content policies
4. **API rate limits**: Wait a few minutes and try again

### "Invalid page access token"

**Solution**: The token may have expired or been revoked. Reconnect the Facebook page.

## API Endpoints

If you want to integrate Facebook publishing into your own workflows, here are the available API endpoints:

### Accounts Management

```
GET    /api/facebook/accounts          - List all connected accounts
POST   /api/facebook/accounts          - Connect new account
GET    /api/facebook/accounts/:id      - Get account details
PATCH  /api/facebook/accounts/:id      - Update account
DELETE /api/facebook/accounts/:id      - Delete account
```

### Posts Management

```
GET    /api/facebook/posts             - List all Facebook posts
POST   /api/facebook/posts             - Publish to Facebook
GET    /api/facebook/posts/:id         - Get post with insights
DELETE /api/facebook/posts/:id         - Delete Facebook post
```

### Utilities

```
GET    /api/facebook/auth-url          - Get OAuth authorization URL
POST   /api/facebook/pages             - Get user's pages (requires access token)
POST   /api/facebook/exchange-token    - Exchange code for access token
```

## Database Schema

### FacebookAccount Table

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| userId | String | Owner user ID |
| pageId | String | Facebook page ID |
| pageName | String | Facebook page name |
| pageAccessToken | String | Encrypted access token |
| tokenExpiresAt | DateTime | Token expiration date |
| isActive | Boolean | Whether page is active |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### FacebookPost Table

| Field | Type | Description |
|-------|------|-------------|
| id | String | Unique identifier |
| postId | String | Related CMS post ID |
| facebookAccountId | String | Related account ID |
| facebookPostId | String | Facebook's post ID |
| status | Enum | PENDING, PUBLISHED, FAILED, DELETED |
| message | String | Post message |
| link | String | Attached link |
| imageUrl | String | Attached image URL |
| publishedAt | DateTime | Publication timestamp |
| scheduledAt | DateTime | Scheduled publication time |
| likes | Int | Number of likes |
| shares | Int | Number of shares |
| comments | Int | Number of comments |
| reach | Int | Post reach |
| errorMessage | String | Error message if failed |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

## Best Practices

1. **Keep tokens fresh**: Reconnect pages before tokens expire
2. **Monitor metrics**: Regularly check post performance in the Publishing History
3. **Test in Development Mode**: Use Facebook's Development Mode before going live
4. **Respect rate limits**: Don't publish too many posts in quick succession
5. **Follow Facebook policies**: Ensure all content complies with Facebook's community standards

## Limitations

- **Token expiration**: Long-lived tokens expire after ~60 days and need renewal
- **Rate limits**: Facebook has rate limits for API calls
- **Permissions**: Some features require Facebook app review
- **Content restrictions**: All posts must comply with Facebook's content policies

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review Facebook's [Platform Documentation](https://developers.facebook.com/docs/)
3. Check your Facebook app's error logs
4. Review server logs for detailed error messages

## Additional Resources

- [Facebook Graph API Documentation](https://developers.facebook.com/docs/graph-api/)
- [Facebook Pages API](https://developers.facebook.com/docs/pages/)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [App Review Process](https://developers.facebook.com/docs/app-review/)
