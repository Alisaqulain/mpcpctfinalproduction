# Image 404 Error Fix - Uploads Not Loading

## 🔍 Problem

Images uploaded through admin panel return 404 error:
```
https://www.mpcpct.com/uploads/question-images/1768293048806_dubai1.png
404 (Not Found)
```

## ✅ Solution Applied

Updated Nginx configuration to **proxy `/uploads/` requests to Next.js** instead of serving them directly. Next.js automatically serves files from the `public/` folder.

## 🔧 Updated Nginx Configuration

**Changed from:**
```nginx
location /uploads/ {
    alias /var/www/mpcpct/public/uploads/;
    ...
}
```

**Changed to:**
```nginx
location /uploads/ {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    expires 30d;
    add_header Cache-Control "public";
    access_log off;
}
```

## 📋 Steps to Fix on Your Server

### 1. Update Nginx Configuration

```bash
# Edit Nginx config
sudo nano /etc/nginx/sites-available/mpcpct

# Replace the /uploads/ location block with the new one
# (Copy from updated nginx-mpcpct.conf)
```

### 2. Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# If test passes, reload
sudo systemctl reload nginx
```

### 3. Verify File Exists on Server

```bash
# Check if the uploaded file exists
ls -la /path/to/your/project/public/uploads/question-images/

# Check file permissions
# Files should be readable by the user running Next.js
chmod -R 755 /path/to/your/project/public/uploads/
```

### 4. Verify Next.js Can Serve the File

```bash
# Test directly on Next.js (bypassing Nginx)
curl http://localhost:3000/uploads/question-images/1768293048806_dubai1.png

# If this works, the issue is Nginx configuration
# If this fails, the issue is file location or permissions
```

### 5. Check Next.js Logs

```bash
# Check if Next.js is receiving the request
pm2 logs mpcpct --lines 50

# Look for any errors related to file serving
```

## 🔍 Troubleshooting

### Issue: Still getting 404 after fix

**Check 1: File exists?**
```bash
# Find your project path
cd /path/to/your/project
ls -la public/uploads/question-images/

# If folder doesn't exist, create it
mkdir -p public/uploads/question-images
chmod -R 755 public/uploads/
```

**Check 2: File permissions**
```bash
# Make sure files are readable
chmod 644 public/uploads/question-images/*
chmod 755 public/uploads/question-images/

# Check ownership (should match Next.js user)
ls -la public/uploads/question-images/
```

**Check 3: Next.js is running?**
```bash
pm2 status
# If not running:
cd /path/to/your/project
pm2 start npm --name "mpcpct" -- start
```

**Check 4: Test direct access**
```bash
# Test if Next.js serves the file
curl -I http://localhost:3000/uploads/question-images/1768293048806_dubai1.png

# Should return 200 OK, not 404
```

**Check 5: Nginx error logs**
```bash
# Check Nginx error logs
sudo tail -f /var/log/nginx/mpcpct-error.log

# Look for permission denied or file not found errors
```

### Issue: 502 Bad Gateway

**Solution:**
- Next.js is not running on port 3000
- Start Next.js: `pm2 restart mpcpct`
- Check port: `netstat -tulpn | grep 3000`

### Issue: File exists but still 404

**Possible causes:**
1. **Wrong path in Nginx config** - Check the `root` directive
2. **File permissions** - Files not readable
3. **Next.js not serving public folder** - Check Next.js logs
4. **Cache issue** - Clear browser cache

## 🚀 Quick Fix Commands

```bash
# 1. Update Nginx config
sudo nano /etc/nginx/sites-available/mpcpct
# (Update /uploads/ location block)

# 2. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 3. Check file exists
ls -la /path/to/your/project/public/uploads/question-images/

# 4. Fix permissions if needed
chmod -R 755 /path/to/your/project/public/uploads/

# 5. Restart Next.js
pm2 restart mpcpct

# 6. Test the image URL
curl -I http://localhost:3000/uploads/question-images/1768293048806_dubai1.png
```

## 📝 Important Notes

1. **Next.js serves `public/` folder automatically** - Files in `public/uploads/` are accessible at `/uploads/`
2. **Proxy to Next.js** - Don't try to serve `/uploads/` directly from Nginx
3. **File permissions** - Ensure files are readable (644 for files, 755 for directories)
4. **Path must match** - The URL `/uploads/question-images/file.png` maps to `public/uploads/question-images/file.png`

## ✅ Verification Checklist

- [ ] Nginx config updated with `/uploads/` proxy block
- [ ] Nginx config tested (`nginx -t`)
- [ ] Nginx reloaded (`systemctl reload nginx`)
- [ ] File exists in `public/uploads/question-images/`
- [ ] File permissions are correct (644)
- [ ] Directory permissions are correct (755)
- [ ] Next.js is running (`pm2 status`)
- [ ] Direct test works (`curl http://localhost:3000/uploads/...`)
- [ ] Browser cache cleared

## 🔄 Alternative: Serve Directly from Nginx (If Proxy Doesn't Work)

If proxying doesn't work, you can serve directly (but update the path):

```nginx
location /uploads/ {
    alias /path/to/your/project/public/uploads/;
    expires 30d;
    add_header Cache-Control "public";
    access_log off;
    
    # Ensure proper MIME types
    types {
        image/png png;
        image/jpeg jpg jpeg;
        image/gif gif;
        image/webp webp;
    }
    default_type application/octet-stream;
}
```

**But the proxy method is recommended** because Next.js handles it automatically.

---

**After applying the fix, images should load correctly!**









