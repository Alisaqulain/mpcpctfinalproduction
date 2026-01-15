# Nginx Setup Guide for MPCPCT.com

## 📋 Prerequisites

- Ubuntu/Debian server with Nginx installed
- Domain name: mpcpct.com pointing to your server IP
- Next.js application running on port 3000
- Root or sudo access

## 🔧 Installation Steps

### 1. Install Nginx (if not installed)

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d mpcpct.com -d www.mpcpct.com

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

### 3. Create Nginx Configuration

```bash
# Copy the configuration file
sudo nano /etc/nginx/sites-available/mpcpct
```

**Paste the configuration from `nginx-mpcpct.conf`**

### 4. Update Paths in Configuration

Edit the configuration file and update these paths to match your server:

```bash
sudo nano /etc/nginx/sites-available/mpcpct
```

**Update these lines:**
- `root /var/www/mpcpct/public;` → Your project's public folder path
- `alias /var/www/mpcpct/.next/static/;` → Your project's .next/static folder path
- `alias /var/www/mpcpct/public/uploads/;` → Your project's uploads folder path
- `proxy_pass http://localhost:3000;` → Change port if your Next.js runs on different port

**Example if your project is in `/home/user/mpcpctfinalproduction`:**
```nginx
root /home/user/mpcpctfinalproduction/public;
alias /home/user/mpcpctfinalproduction/.next/static/;
alias /home/user/mpcpctfinalproduction/public/uploads/;
```

### 5. Enable the Site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mpcpct /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

### 6. Set Up PM2 for Next.js (Recommended)

```bash
# Install PM2
sudo npm install -g pm2

# Navigate to your project
cd /path/to/your/project

# Build the project
npm run build

# Start with PM2
pm2 start npm --name "mpcpct" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 7. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

## 🔍 Verification

### Test Nginx Configuration
```bash
sudo nginx -t
```

### Check Nginx Status
```bash
sudo systemctl status nginx
```

### Check PM2 Status
```bash
pm2 status
pm2 logs mpcpct
```

### Test Your Site
```bash
# Test HTTP redirect
curl -I http://mpcpct.com

# Test HTTPS
curl -I https://www.mpcpct.com
```

## 📝 Important Notes

### 1. **SSL Certificate Paths**
After running `certbot`, it will automatically update the SSL paths. If you need to update manually:
```bash
# Find your certificate paths
sudo certbot certificates
```

### 2. **Next.js Port**
- Default Next.js port is 3000
- If using different port, update `proxy_pass http://localhost:3000;`
- Make sure Next.js is running: `pm2 status`

### 3. **File Permissions**
```bash
# Set proper permissions for uploads folder
sudo chown -R www-data:www-data /path/to/your/project/public/uploads
sudo chmod -R 755 /path/to/your/project/public/uploads
```

### 4. **Log Files**
Monitor logs for issues:
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/mpcpct-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/mpcpct-error.log

# PM2 logs
pm2 logs mpcpct
```

## 🚨 Troubleshooting

### Issue: 502 Bad Gateway
**Solution:**
- Check if Next.js is running: `pm2 status`
- Check Next.js logs: `pm2 logs mpcpct`
- Verify port 3000 is correct in Nginx config

### Issue: SSL Certificate Error
**Solution:**
- Run: `sudo certbot --nginx -d mpcpct.com -d www.mpcpct.com`
- Check certificate: `sudo certbot certificates`

### Issue: Static Files Not Loading
**Solution:**
- Verify file paths in Nginx config
- Check file permissions: `ls -la /path/to/files`
- Ensure files exist in the specified directories

### Issue: Uploads Not Working
**Solution:**
- Check uploads folder permissions
- Verify `client_max_body_size 10M;` in config
- Check Next.js logs for upload errors

## 🔄 Maintenance

### Reload Nginx After Changes
```bash
sudo nginx -t  # Test first
sudo systemctl reload nginx
```

### Restart Next.js App
```bash
pm2 restart mpcpct
```

### Update SSL Certificate (Auto-renewal)
```bash
# Certbot auto-renews, but you can test:
sudo certbot renew --dry-run
```

## 📊 Performance Optimization

The configuration includes:
- ✅ Gzip compression
- ✅ Static file caching
- ✅ HTTP/2 support
- ✅ Security headers
- ✅ SSL optimization

## 🔐 Security Checklist

- [x] HTTPS enforced
- [x] Security headers added
- [x] Hidden files blocked
- [x] SSL/TLS configured
- [x] Firewall configured

---

**Configuration File Location:** `/etc/nginx/sites-available/mpcpct`
**Symlink Location:** `/etc/nginx/sites-enabled/mpcpct`









