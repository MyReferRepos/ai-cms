/**
 * Facebook Graph API Integration
 * Handles all interactions with Facebook Graph API
 */

export interface FacebookPageInfo {
  id: string
  name: string
  access_token: string
}

export interface FacebookPostResponse {
  id: string
  created_time?: string
}

export interface FacebookPostInsights {
  likes: number
  shares: number
  comments: number
  reach: number
}

export interface PublishToFacebookParams {
  pageAccessToken: string
  pageId: string
  message: string
  link?: string
  imageUrl?: string
}

export interface FacebookGroupInfo {
  id: string
  name: string
  description?: string
  member_count?: number
  privacy?: string
}

export interface FacebookGroupPost {
  id: string
  message?: string
  created_time: string
  from?: {
    id: string
    name: string
  }
}

export interface PublishToGroupParams {
  userAccessToken: string
  groupId: string
  message: string
  link?: string
}

/**
 * Get user's Facebook pages
 */
export async function getUserPages(userAccessToken: string): Promise<FacebookPageInfo[]> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Facebook API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching Facebook pages:', error)
    throw error
  }
}

/**
 * Get long-lived page access token
 */
export async function getLongLivedPageToken(
  pageId: string,
  shortLivedUserToken: string
): Promise<{ access_token: string; expires_in?: number }> {
  try {
    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET

    if (!appId || !appSecret) {
      throw new Error('Facebook App ID and Secret must be configured')
    }

    // First, exchange short-lived user token for long-lived user token
    const longLivedUserTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${appId}&` +
      `client_secret=${appSecret}&` +
      `fb_exchange_token=${shortLivedUserToken}`
    )

    if (!longLivedUserTokenResponse.ok) {
      const error = await longLivedUserTokenResponse.json()
      throw new Error(`Failed to get long-lived user token: ${error.error?.message}`)
    }

    const longLivedUserTokenData = await longLivedUserTokenResponse.json()
    const longLivedUserToken = longLivedUserTokenData.access_token

    // Then, get page access token using long-lived user token
    const pageTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?` +
      `fields=access_token&` +
      `access_token=${longLivedUserToken}`
    )

    if (!pageTokenResponse.ok) {
      const error = await pageTokenResponse.json()
      throw new Error(`Failed to get page token: ${error.error?.message}`)
    }

    const pageTokenData = await pageTokenResponse.json()

    return {
      access_token: pageTokenData.access_token,
      expires_in: longLivedUserTokenData.expires_in
    }
  } catch (error) {
    console.error('Error getting long-lived page token:', error)
    throw error
  }
}

/**
 * Publish content to Facebook page
 */
export async function publishToFacebook(
  params: PublishToFacebookParams
): Promise<FacebookPostResponse> {
  const { pageAccessToken, pageId, message, link, imageUrl } = params

  try {
    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`
    let body: any = {
      message,
      access_token: pageAccessToken,
    }

    // If there's an image, use the photos endpoint
    if (imageUrl) {
      endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`
      body = {
        url: imageUrl,
        caption: message,
        access_token: pageAccessToken,
      }
      if (link) {
        body.link = link
      }
    } else if (link) {
      // If there's a link but no image
      body.link = link
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Facebook publish error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error publishing to Facebook:', error)
    throw error
  }
}

/**
 * Delete a Facebook post
 */
export async function deleteFacebookPost(
  postId: string,
  pageAccessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?access_token=${pageAccessToken}`,
      {
        method: 'DELETE',
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Facebook delete error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Error deleting Facebook post:', error)
    throw error
  }
}

/**
 * Get post insights (metrics)
 */
export async function getPostInsights(
  postId: string,
  pageAccessToken: string
): Promise<FacebookPostInsights> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${postId}?` +
      `fields=likes.summary(true),shares,comments.summary(true)&` +
      `access_token=${pageAccessToken}`
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Facebook insights error:', error)
      // Return zeros if we can't get insights
      return { likes: 0, shares: 0, comments: 0, reach: 0 }
    }

    const data = await response.json()

    return {
      likes: data.likes?.summary?.total_count || 0,
      shares: data.shares?.count || 0,
      comments: data.comments?.summary?.total_count || 0,
      reach: 0, // Reach requires additional API calls with specific permissions
    }
  } catch (error) {
    console.error('Error fetching post insights:', error)
    return { likes: 0, shares: 0, comments: 0, reach: 0 }
  }
}

/**
 * Verify page access token is valid
 */
export async function verifyPageToken(
  pageAccessToken: string
): Promise<{ isValid: boolean; expiresAt?: Date }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${pageAccessToken}`
    )

    if (!response.ok) {
      return { isValid: false }
    }

    // Check token expiration
    const debugResponse = await fetch(
      `https://graph.facebook.com/v18.0/debug_token?` +
      `input_token=${pageAccessToken}&` +
      `access_token=${pageAccessToken}`
    )

    if (debugResponse.ok) {
      const debugData = await debugResponse.json()
      const expiresAt = debugData.data?.expires_at

      return {
        isValid: true,
        expiresAt: expiresAt ? new Date(expiresAt * 1000) : undefined,
      }
    }

    return { isValid: true }
  } catch (error) {
    console.error('Error verifying page token:', error)
    return { isValid: false }
  }
}

// ============================================================================
// Facebook Groups API
// ============================================================================

/**
 * Get user's Facebook groups
 * Requires: groups_access_member_info permission
 */
export async function getUserGroups(userAccessToken: string): Promise<FacebookGroupInfo[]> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/groups?` +
      `fields=id,name,description,member_count,privacy&` +
      `access_token=${userAccessToken}`
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Facebook API error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching Facebook groups:', error)
    throw error
  }
}

/**
 * Get group details
 */
export async function getGroupDetails(
  groupId: string,
  userAccessToken: string
): Promise<FacebookGroupInfo> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${groupId}?` +
      `fields=id,name,description,member_count,privacy&` +
      `access_token=${userAccessToken}`
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Facebook API error: ${error.error?.message || 'Unknown error'}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching group details:', error)
    throw error
  }
}

/**
 * Publish content to Facebook group
 * Requires: publish_to_groups permission
 */
export async function publishToGroup(
  params: PublishToGroupParams
): Promise<FacebookPostResponse> {
  const { userAccessToken, groupId, message, link } = params

  try {
    const body: any = {
      message,
      access_token: userAccessToken,
    }

    if (link) {
      body.link = link
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${groupId}/feed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Facebook publish error: ${error.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error publishing to Facebook group:', error)
    throw error
  }
}

/**
 * Get user's posts in a specific group
 * This helps determine the last time user posted to the group
 */
export async function getUserGroupPosts(
  groupId: string,
  userId: string,
  userAccessToken: string,
  limit: number = 10
): Promise<FacebookGroupPost[]> {
  try {
    // Get group feed
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${groupId}/feed?` +
      `fields=id,message,created_time,from&` +
      `limit=${limit}&` +
      `access_token=${userAccessToken}`
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Facebook group posts error:', error)
      return []
    }

    const data = await response.json()
    const allPosts: FacebookGroupPost[] = data.data || []

    // Filter to only user's posts
    const userPosts = allPosts.filter(post => post.from?.id === userId)

    return userPosts
  } catch (error) {
    console.error('Error fetching user group posts:', error)
    return []
  }
}

/**
 * Get the last time user posted to a group
 */
export async function getLastPostTimeInGroup(
  groupId: string,
  userId: string,
  userAccessToken: string
): Promise<Date | null> {
  try {
    const posts = await getUserGroupPosts(groupId, userId, userAccessToken, 100)

    if (posts.length === 0) {
      return null
    }

    // Posts are returned in reverse chronological order, so first one is the latest
    const latestPost = posts[0]
    return new Date(latestPost.created_time)
  } catch (error) {
    console.error('Error getting last post time:', error)
    return null
  }
}

/**
 * Verify user access token is valid
 */
export async function verifyUserToken(
  userAccessToken: string
): Promise<{ isValid: boolean; userId?: string; expiresAt?: Date }> {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${userAccessToken}`
    )

    if (!response.ok) {
      return { isValid: false }
    }

    const userData = await response.json()

    // Check token expiration
    const debugResponse = await fetch(
      `https://graph.facebook.com/v18.0/debug_token?` +
      `input_token=${userAccessToken}&` +
      `access_token=${userAccessToken}`
    )

    if (debugResponse.ok) {
      const debugData = await debugResponse.json()
      const expiresAt = debugData.data?.expires_at

      return {
        isValid: true,
        userId: userData.id,
        expiresAt: expiresAt ? new Date(expiresAt * 1000) : undefined,
      }
    }

    return { isValid: true, userId: userData.id }
  } catch (error) {
    console.error('Error verifying user token:', error)
    return { isValid: false }
  }
}
