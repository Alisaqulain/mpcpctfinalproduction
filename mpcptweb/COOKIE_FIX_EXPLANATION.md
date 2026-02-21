# 401 Unauthorized Error - Cookie Issue Fix

## Problem Explanation

You were getting `401 (Unauthorized)` errors when accessing `/api/profile` on your hosted website. This happened because:

### Root Cause:
1. **Cookie Security Setting**: The authentication cookie was set with `secure: true` in production
2. **HTTP vs HTTPS**: When `secure: true`, cookies are **only sent over HTTPS connections**
3. **Your Setup**: You're accessing via `http://72.61.233.142:3000` (HTTP, not HTTPS)
4. **Result**: Even after login, the browser wouldn't send the cookie back to the server because:
   - Cookie is marked as `secure`
   - Connection is HTTP (not HTTPS)
   - Browser security prevents sending secure cookies over HTTP

### Why Multiple 401 Errors?
- The homepage (`page.js`) checks authentication on mount by calling `/api/profile`
- When not logged in, this returns 401 (expected behavior)
- React might render multiple times (strict mode, re-renders), causing multiple requests
- Each failed request shows a 401 error in console

## Solution Applied

### 1. Fixed Cookie Security Flag
Updated all cookie-setting routes to **dynamically detect HTTPS** instead of blindly using `secure: true` in production:

**Files Updated:**
- `src/app/api/login/route.js`
- `src/app/api/logout/route.js`
- `src/app/api/admin/login/route.js`

**New Logic:**
```javascript
// Check if request is over HTTPS
const isHttps = req.headers.get('x-forwarded-proto') === 'https' || 
                req.url?.startsWith('https://') ||
                process.env.NEXT_PUBLIC_FORCE_SECURE_COOKIE === 'true';

response.cookies.set("token", token, {
  httpOnly: true,
  secure: isHttps, // Only secure if actually using HTTPS
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60,
  path: "/"
});
```

### 2. Improved Error Handling
Updated `src/app/page.js` to:
- Suppress expected 401 errors (not logged in is normal)
- Only log unexpected errors
- Ensure cookies are sent with `credentials: 'include'`

## Recommendations

### For Production (Best Practice):

1. **Use HTTPS** (Recommended):
   - Set up SSL/TLS certificate (Let's Encrypt is free)
   - Use a reverse proxy (Nginx/Apache) with SSL
   - Access via `https://yourdomain.com` instead of IP
   - Cookies will then be secure and work properly

2. **If You Must Use HTTP**:
   - The fix above allows cookies to work over HTTP
   - **Warning**: This is less secure (cookies can be intercepted)
   - Only use for development/internal networks

3. **Environment Variable** (Optional):
   - Set `NEXT_PUBLIC_FORCE_SECURE_COOKIE=true` in `.env` to force secure cookies even over HTTP (not recommended)

### Testing:
1. Clear browser cookies
2. Login again
3. Check browser DevTools → Application → Cookies
4. Verify `token` cookie is present
5. Check Network tab - cookies should be sent with requests

## Technical Details

### Cookie Attributes Explained:
- **httpOnly**: Prevents JavaScript access (security)
- **secure**: Only sent over HTTPS (when true)
- **sameSite: "lax"**: Prevents CSRF attacks
- **path: "/"**: Available site-wide
- **maxAge**: Cookie expiration time

### Why This Matters:
- **Security**: Secure cookies prevent man-in-the-middle attacks
- **Compatibility**: HTTP sites need `secure: false` for cookies to work
- **Best Practice**: Always use HTTPS in production

## Status
✅ **Fixed**: Cookies now work over both HTTP and HTTPS
✅ **Improved**: Error handling suppresses expected 401s
⚠️ **Recommendation**: Set up HTTPS for production security


