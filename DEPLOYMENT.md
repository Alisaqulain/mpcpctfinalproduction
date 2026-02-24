# 🚀 Deployment Guide - MPCPCT Web App

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account or local MongoDB
- Domain name (optional but recommended)
- Email service (Gmail SMTP, SendGrid, etc.)
- Razorpay account for payments
- Google Analytics account (optional)

## 🔧 Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mpcpctwebapp?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=no-reply@yourdomain.com

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Admin Credentials (will be seeded automatically)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PHONE=7869654042
ADMIN_PASSWORD=Admin@1234
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get the connection string and add it to `MONGODB_URI`

### Local MongoDB

```bash
# Install MongoDB locally
# Start MongoDB service
# Use connection string: mongodb://localhost:27017/mpcpctwebapp
```

## 📦 Installation & Build

```bash
# Install dependencies
npm install

# Add missing dependencies for production
npm install nodemailer

# Build the application
npm run build

# Start production server
npm start
```

## 🌐 Deployment Options

### 1. Vercel (Recommended)

1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 2. Netlify

1. Build the project: `npm run build`
2. Deploy the `out` folder (if using static export)
3. Add environment variables in Netlify dashboard

### 3. Railway

1. Connect your GitHub repo to Railway
2. Add environment variables
3. Deploy automatically

### 4. DigitalOcean App Platform

1. Connect your GitHub repo
2. Configure build settings
3. Add environment variables
4. Deploy

## 🔐 Security Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS policies
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB authentication
- [ ] Set up proper firewall rules

## 📧 Email Setup

### Gmail SMTP

1. Enable 2-factor authentication
2. Generate an App Password
3. Use the app password in `SMTP_PASS`

### SendGrid

1. Create SendGrid account
2. Get API key
3. Update SMTP settings accordingly

## 💳 Payment Setup (Razorpay)

1. Create Razorpay account
2. Get API keys from dashboard
3. Set up webhook endpoint: `https://yourdomain.com/api/webhooks/razorpay`
4. Configure webhook events: `payment.captured`, `order.paid`

## 📊 Analytics Setup

1. Create Google Analytics account
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `NEXT_PUBLIC_GA_ID`

## 🚀 Post-Deployment Steps

1. **Seed Admin User**
   ```bash
   # Visit: https://yourdomain.com/api/seed-admin
   # This creates the admin user with credentials: 7869654042 / Admin@1234
   ```

2. **Test Core Features**
   - [ ] User registration/login
   - [ ] Admin panel access
   - [ ] Exam functionality
   - [ ] Payment flow
   - [ ] Email notifications

3. **SEO Setup**
   - [ ] Update `NEXT_PUBLIC_SITE_URL` in environment
   - [ ] Submit sitemap to Google Search Console
   - [ ] Verify robots.txt is accessible

## 🔍 SEO Configuration

The app includes:
- ✅ Dynamic sitemap.xml
- ✅ robots.txt
- ✅ Google Analytics integration
- ✅ Meta tags and Open Graph
- ✅ Structured data for better search visibility

## 📱 Performance Optimization

- ✅ Next.js 15 with App Router
- ✅ Image optimization
- ✅ Code splitting
- ✅ Static generation where possible
- ✅ MongoDB indexing

## 🛠️ Monitoring & Maintenance

### Health Checks

```bash
# Check if app is running
curl https://yourdomain.com/api/profile

# Check database connection
curl https://yourdomain.com/api/admin/exams
```

### Logs

Monitor application logs for:
- Payment webhook failures
- Email sending errors
- Database connection issues
- Authentication problems

## 🆘 Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **Database Connection Issues**
   - Check MongoDB URI format
   - Verify network access
   - Check authentication credentials

3. **Payment Issues**
   - Verify Razorpay keys
   - Check webhook endpoint
   - Test with Razorpay test mode

4. **Email Not Sending**
   - Check SMTP credentials
   - Verify email service limits
   - Check spam folders

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test individual components
4. Contact support with specific error messages

## 🔄 Updates & Maintenance

### Regular Tasks

- [ ] Monitor subscription renewals
- [ ] Update exam questions
- [ ] Backup database regularly
- [ ] Update dependencies monthly
- [ ] Review analytics data

### Backup Strategy

```bash
# MongoDB backup
mongodump --uri="your-mongodb-uri" --out=backup/

# Restore
mongorestore --uri="your-mongodb-uri" backup/
```

---

## 🎉 Success!

Your MPCPCT Web App is now ready for production! 

**Admin Access:** `https://yourdomain.com/admin`
**Credentials:** `7869654042` / `Admin@1234`

**Key Features:**
- ✅ Multi-language support (Hindi/English)
- ✅ Subscription-based content access
- ✅ Payment integration with Razorpay
- ✅ Email notifications
- ✅ Admin panel for content management
- ✅ SEO optimized
- ✅ Mobile responsive
- ✅ Real-time exam results
- ✅ PDF result downloads
