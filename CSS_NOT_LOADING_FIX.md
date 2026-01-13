# CSS Not Loading - Fix Guide

## 🔍 Root Cause

CSS files in Next.js are served through the Next.js server (port 3000), not as static files. The Nginx configuration was trying to serve them directly, which caused CSS not to load.

## ✅ Solution Applied

Updated Nginx configuration to **proxy all `/_next/` requests to Next.js** instead of serving them as static files.

## 🔧 Updated Nginx Configuration

The key change is in the `/_next/` location block:

```nginx
# Next.js static files (CSS, JS, fonts) - MUST be proxied to Next.js
location /_next/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    add_header Cache-Control "public, max-age=31536000, immutable";
    expires 365d;
    access_log off;
}
```

## 📋 Steps to Fix on Your Server

### 1. Update Nginx Configuration

```bash
# Edit the Nginx config
sudo nano /etc/nginx/sites-available/mpcpct

# Replace the /_next/static/ section with the new /_next/ block
# (Copy from the updated nginx-mpcpct.conf file)
```

### 2. Test Configuration

```bash
# Test Nginx configuration
sudo nginx -t
```

### 3. Reload Nginx

```bash
# If test passes, reload Nginx
sudo systemctl reload nginx
```

### 4. Verify Next.js is Running

```bash
# Check if Next.js is running on port 3000
pm2 status
# or
netstat -tulpn | grep 3000
# or
curl http://localhost:3000
```

### 5. Clear Browser Cache

- Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Or open DevTools → Network tab → Check "Disable cache"

## 🔍 Troubleshooting

### Issue: CSS still not loading after fix

**Check 1: Is Next.js running?**
```bash
pm2 status
# If not running:
cd /path/to/your/project
pm2 start npm --name "mpcpct" -- start
```

**Check 2: Check Nginx error logs**
```bash
sudo tail -f /var/log/nginx/mpcpct-error.log
```

**Check 3: Check Next.js logs**
```bash
pm2 logs mpcpct
```

**Check 4: Test CSS URL directly**
```bash
# In browser, check Network tab
# Look for CSS file requests like:
# https://mpcpct.com/_next/static/css/xxxxx.css
# If it returns 404 or 502, the proxy isn't working
```

**Check 5: Verify proxy_pass is correct**
```bash
# Make sure this line in Nginx config matches your Next.js port:
proxy_pass http://localhost:3000;
```

### Issue: 502 Bad Gateway

**Solution:**
- Next.js is not running or wrong port
- Start Next.js: `pm2 start npm --name "mpcpct" -- start`
- Check port: `netstat -tulpn | grep 3000`

### Issue: CSS loads but styles don't apply

**Solution:**
- Clear browser cache (hard refresh)
- Check browser console for CSS errors
- Verify CSS file is loading in Network tab

## 📝 Important Notes

1. **Next.js serves CSS internally** - Don't try to serve `/_next/` files as static files
2. **All `/_next/` requests must go to Next.js** - This includes CSS, JS, fonts, etc.
3. **Build must be done** - Run `npm run build` before starting production server
4. **Port 3000** - Make sure Next.js is running on port 3000 (or update Nginx config)

## ✅ Verification Checklist

- [ ] Nginx config updated with `/_next/` proxy block
- [ ] Nginx config tested (`nginx -t`)
- [ ] Nginx reloaded (`systemctl reload nginx`)
- [ ] Next.js is running (`pm2 status`)
- [ ] Next.js is accessible on port 3000
- [ ] Browser cache cleared
- [ ] CSS files loading in Network tab (check DevTools)

## 🚀 Quick Fix Commands

```bash
# 1. Update Nginx config
sudo nano /etc/nginx/sites-available/mpcpct
# (Paste updated config)

# 2. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 3. Restart Next.js
pm2 restart mpcpct

# 4. Check logs
pm2 logs mpcpct --lines 50
sudo tail -f /var/log/nginx/mpcpct-error.log
```

---

**After applying the fix, CSS should load correctly!**

