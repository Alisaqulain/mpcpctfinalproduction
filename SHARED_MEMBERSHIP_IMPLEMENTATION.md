# Shared Membership Referral System - Implementation Summary

## Overview
This document describes the implementation of a "Shared Membership Referral System" with milestone-based rewards.

## Business Rules Implemented

### 1. Sharing Limits
- ✅ Maximum of 3 unique users can share a membership
- ✅ Each shared user must activate via a unique invite/referral link
- ✅ Shared users cannot be the owner
- ✅ Shared users cannot activate more than once

### 2. Rewards System
- ✅ **Shared Users**: Receive +1 extra month immediately upon activation
- ✅ **Owner (Ali)**: Receives +1 month ONLY when all 3 shared users have successfully activated
- ✅ No partial rewards (1 or 2 activations give 0 reward to owner)
- ✅ Owner reward is idempotent (granted only once)

### 3. Abuse Prevention
- ✅ Maximum share limit enforcement (3 users)
- ✅ Owner cannot activate their own subscription
- ✅ Duplicate activation prevention (unique constraint)
- ✅ Subscription must be active to share/activate

## Database Schema

### Updated Models

#### Subscription Model (`src/lib/models/Subscription.js`)
Added fields:
- `sharedLimit` (Number, default: 3) - Maximum number of users who can share
- `ownerRewardGranted` (Boolean, default: false) - Whether owner received reward
- `shareToken` (String, unique, sparse) - Unique token for sharing

#### SharedMembership Model (`src/lib/models/SharedMembership.js`)
New model with fields:
- `subscriptionId` (ObjectId, ref: Subscription) - The subscription being shared
- `sharedUserId` (ObjectId, ref: User) - User who activated the share
- `activatedAt` (Date) - When activation occurred
- `sharedUserSubscriptionId` (ObjectId, ref: Subscription) - Subscription created/extended for shared user

**Indexes:**
- Unique index on `(subscriptionId, sharedUserId)` to prevent duplicate activations
- Index on `subscriptionId` for efficient queries

## API Endpoints

### 1. Generate Share Link
**Endpoint:** `POST /api/shared-membership/generate-link`

**Request Body:**
```json
{
  "subscriptionId": "subscription_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "shareLink": "https://domain.com/shared-membership/activate?token=...",
  "shareToken": "token_here",
  "subscriptionId": "subscription_id"
}
```

**Features:**
- Generates unique share token if not exists
- Returns shareable link
- Verifies ownership

### 2. Activate Shared Membership
**Endpoint:** `POST /api/shared-membership/activate`

**Request Body:**
```json
{
  "shareToken": "token_from_link"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Shared membership activated successfully! You received +1 month added to your plan.",
  "activationId": "activation_id",
  "newEndDate": "2024-02-01T00:00:00.000Z"
}
```

**Features:**
- Validates share token
- Prevents owner activation
- Prevents duplicate activation
- Enforces 3-user limit
- Grants +1 month to shared user immediately
- Grants +1 month to owner when 3rd user activates

### 3. Get Share Progress
**Endpoint:** `GET /api/shared-membership/progress?subscriptionId=...`

**Response:**
```json
{
  "success": true,
  "subscription": {
    "_id": "subscription_id",
    "endDate": "2024-01-01T00:00:00.000Z",
    "ownerRewardGranted": false
  },
  "progress": {
    "activated": 2,
    "limit": 3,
    "remaining": 1,
    "usage": "2/3"
  },
  "rewardStatus": {
    "status": "pending",
    "message": "Owner reward pending (activate all 3 users to unlock)",
    "granted": false
  },
  "activations": [...]
}
```

### 4. Validate Token
**Endpoint:** `GET /api/shared-membership/validate-token?token=...`

**Response:**
```json
{
  "valid": true,
  "subscription": {
    "_id": "subscription_id",
    "type": "all",
    "ownerName": "Ali"
  },
  "message": "🎁 You get 1 extra month FREE by joining this shared membership",
  "remainingSlots": 2
}
```

## Frontend Pages

### 1. Owner Dashboard
**Route:** `/shared-membership`

**Features:**
- Generate share link
- View share progress (X/3 used)
- View reward status
- List activated users
- Copy share link to clipboard

**UI Elements:**
- Progress bar showing X/3 usage
- Reward status indicator (pending/granted)
- Share link input with copy button
- List of activated users with activation dates

### 2. Activation Page
**Route:** `/shared-membership/activate?token=...`

**Features:**
- Validates token on load
- Shows owner name and plan type
- Shows remaining slots
- Displays benefits (+1 month FREE)
- One-click activation button
- Success message with redirect

**UI Elements:**
- Large gift emoji (🎁)
- Clear benefit messaging
- Activation button
- Error handling for invalid/expired tokens

## Integration Points

### Profile Page Integration
Added a "Share Membership" button in the profile page (`/profile`) that:
- Only shows for active subscriptions
- Links to `/shared-membership` page
- Displays enticing message about +1 month reward

## Testing

### Test Coverage (`src/__tests__/api/shared-membership.test.js`)

**Test Cases:**
1. ✅ Generate share link for subscription owner
2. ✅ Prevent non-owners from generating links
3. ✅ Allow max 3 shared activations
4. ✅ Prevent 4th user activation
5. ✅ Ensure owner gets reward ONLY at 3/3
6. ✅ Ensure owner gets reward only once (idempotent)
7. ✅ Ensure shared users always get +1 month
8. ✅ Prevent owner from activating own subscription
9. ✅ Prevent duplicate activation by same user
10. ✅ Return correct share progress and reward status
11. ✅ Validate share tokens correctly
12. ✅ Reject invalid/expired tokens

## Usage Flow

### For Owner (Ali):
1. Purchase subscription
2. Go to Profile page → Click "Share Membership"
3. Generate share link
4. Share link with up to 3 friends
5. Monitor progress (1/3, 2/3, 3/3)
6. Receive +1 month reward when all 3 activate

### For Shared User:
1. Receive share link from owner
2. Click link → Redirected to activation page
3. See benefits (+1 month FREE)
4. Click "Activate Now"
5. Immediately receive +1 month added to plan
6. Redirected to profile page

## Security Features

1. **Authentication**: All endpoints require JWT token
2. **Authorization**: Owner verification for share operations
3. **Unique Constraints**: Database-level prevention of duplicates
4. **Token Validation**: Share tokens validated before activation
5. **Subscription Status**: Only active subscriptions can be shared
6. **Idempotency**: Owner reward granted only once

## Error Handling

All endpoints include comprehensive error handling:
- Invalid tokens → 404 with clear message
- Unauthorized access → 403 with explanation
- Limit reached → 400 with limit message
- Duplicate activation → 400 with "already activated" message
- Owner self-activation → 400 with "cannot activate own" message

## Future Enhancements (Optional)

1. Email notifications when users activate
2. Analytics dashboard for share performance
3. Custom share messages
4. Social media sharing buttons
5. Referral tracking and reporting

## Files Created/Modified

### Created:
- `src/lib/models/SharedMembership.js` - Shared membership model
- `src/app/api/shared-membership/generate-link/route.js` - Generate link API
- `src/app/api/shared-membership/activate/route.js` - Activate API
- `src/app/api/shared-membership/progress/route.js` - Progress API
- `src/app/api/shared-membership/validate-token/route.js` - Validate token API
- `src/app/shared-membership/page.jsx` - Owner dashboard
- `src/app/shared-membership/activate/page.jsx` - Activation page
- `src/__tests__/api/shared-membership.test.js` - Comprehensive tests
- `SHARED_MEMBERSHIP_IMPLEMENTATION.md` - This document

### Modified:
- `src/lib/models/Subscription.js` - Added shared membership fields
- `src/app/profile/page.jsx` - Added share membership button
- `src/__tests__/helpers/testDb.js` - Added test helpers for subscriptions and shared memberships

## Environment Variables

No new environment variables required. Uses existing:
- `JWT_SECRET` - For authentication
- `MONGODB_URI` - For database connection
- `NEXT_PUBLIC_BASE_URL` - For generating share links (optional, falls back to request headers)

## Deployment Notes

1. Database migration: Existing subscriptions will have `sharedLimit: 3` and `ownerRewardGranted: false` by default
2. No breaking changes to existing functionality
3. All new features are opt-in (users must generate share link)
4. Backward compatible with existing subscriptions
















