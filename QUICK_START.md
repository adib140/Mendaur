# 🎯 QUICK START: Run Local & Fix Issues

## ⚡ Get Started in 5 Minutes

```powershell
# 1. Install dependencies
composer install

# 2. Setup environment
cp .env.local .env

# 3. Generate app key
php artisan key:generate

# 4. Create database
New-Item -ItemType File -Path database/database.sqlite -Force

# 5. Run migrations & seed
php artisan migrate
php artisan db:seed

# 6. Start server
php artisan serve
```

**Your API is now running at:** `http://localhost:8000`

---

## 🧪 Quick Test

```powershell
# Test login
$response = Invoke-RestMethod -Uri "http://localhost:8000/api/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"admin@mendaur.id","password":"password123"}'

$token = $response.token
Write-Host "Token: $token"

# Test authenticated endpoint
Invoke-RestMethod -Uri "http://localhost:8000/api/users/$($response.user.id)" `
    -Headers @{Authorization="Bearer $token"}
```

---

## 🛠️ Three Issues to Fix

### 1. ❌ Notifications System Missing
**Status:** Endpoints don't exist yet
**Fix Guide:** `NOTIFICATION_ENDPOINTS.md`
**Priority:** HIGH
**Time Estimate:** 30 minutes

**Quick Summary:**
- Create `NotifikasiController.php`
- Add routes to `api.php`
- Integrate `NotificationService` into existing controllers
- Test with provided curl commands

**Files to Create/Edit:**
- ✅ `app/Http/Controllers/NotifikasiController.php` (new)
- ✅ `app/Services/NotificationService.php` (new)
- ✅ `app/Models/Notifikasi.php` (check/update)
- ✅ `routes/api.php` (add routes)

---

### 2. ❌ OTP Email Not Sending on Railway
**Status:** Works locally (log driver), fails on Railway (Gmail SMTP)
**Fix Guide:** `OTP_DEBUGGING.md`
**Priority:** HIGH
**Time Estimate:** 20 minutes debugging + fix

**Quick Summary:**
- Add detailed logging to `OtpService.php`
- Create test endpoints to verify mail config
- Check if Gmail App Password expired
- Verify queue worker is running on Railway
- Test alternative email services if Gmail fails

**Quick Diagnostic:**
```powershell
# Test mail config endpoint
curl http://localhost:8000/api/test-mail-config

# Test OTP flow
curl -X POST http://localhost:8000/api/test-otp-flow `
    -H "Content-Type: application/json" `
    -d '{"email":"your-email@gmail.com"}'
```

**Files to Edit:**
- ✅ `app/Services/OtpService.php` (add logging)
- ✅ `routes/api.php` (add test endpoints)
- ✅ Check `Procfile` for queue worker

---

### 3. ❌ Safari/iOS Users Blocked
**Status:** CORS or session configuration issue
**Fix Guide:** `SAFARI_IOS_FIX.md`
**Priority:** HIGH
**Time Estimate:** 30 minutes

**Quick Summary:**
- Configure proper CORS headers
- Set `SESSION_SAME_SITE=none` and `SESSION_SECURE_COOKIE=true`
- Add `SANCTUM_STATEFUL_DOMAINS` with frontend domain
- Create diagnostic endpoints
- Add User-Agent logging middleware
- Update frontend to use `withCredentials: true`

**Quick Diagnostic:**
```powershell
# Test from Safari (on device or simulator)
curl https://your-railway-app.up.railway.app/api/safari-test
```

**Files to Edit:**
- ✅ `config/cors.php` (allow frontend domain)
- ✅ `config/session.php` (secure cookies, SameSite=none)
- ✅ `config/sanctum.php` (stateful domains)
- ✅ `.env` on Railway (session & CORS vars)
- ✅ Create `LogUserAgent` middleware

---

## 📝 Implementation Order

### Phase 1: Setup Local (5 min)
```powershell
composer install
cp .env.local .env
php artisan key:generate
New-Item -ItemType File -Path database/database.sqlite -Force
php artisan migrate
php artisan db:seed
php artisan serve
```

### Phase 2: Implement Notifications (30 min)
1. Create `NotifikasiController` (copy from NOTIFICATION_ENDPOINTS.md)
2. Create `NotificationService` (copy from NOTIFICATION_ENDPOINTS.md)
3. Add routes to `api.php`
4. Test endpoints with curl
5. Integrate into existing controllers (optional)

### Phase 3: Debug OTP Email (20 min)
1. Add logging to `OtpService` (copy from OTP_DEBUGGING.md)
2. Add test endpoints to `api.php`
3. Test locally with log driver
4. Test locally with Gmail SMTP
5. Deploy to Railway and test
6. Check Railway logs for errors

### Phase 4: Fix Safari/iOS (30 min)
1. Update `config/cors.php`
2. Update `config/session.php`
3. Update `.env` on Railway
4. Create `LogUserAgent` middleware
5. Add diagnostic endpoints
6. Test from Safari/iOS device
7. Check logs for issues

---

## 🔄 Development Workflow

### Local Development
```powershell
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Queue worker (for emails)
php artisan queue:work

# Terminal 3: Logs (watch for errors)
Get-Content storage/logs/laravel.log -Wait -Tail 50
```

### After Making Changes
```powershell
# Clear caches
php artisan config:clear
php artisan cache:clear

# Run migrations if DB changed
php artisan migrate

# Restart queue worker if needed
# Ctrl+C in terminal 2, then run again
php artisan queue:work
```

### Deploy to Railway
```powershell
git add .
git commit -m "Fix: notifications, OTP, Safari/iOS"
git push origin master
```

Railway will auto-deploy. Check logs:
```powershell
railway logs --tail
```

---

## 📊 Testing Checklist

### Notifications
- [ ] GET `/api/notifications` returns user notifications
- [ ] GET `/api/notifications/unread-count` returns count
- [ ] PATCH `/api/notifications/{id}/read` marks as read
- [ ] POST `/api/notifications/mark-all-read` marks all
- [ ] DELETE `/api/notifications/{id}` deletes notification
- [ ] Notifications created when points earned
- [ ] Notifications created when badge earned
- [ ] Notifications created when withdrawal approved/rejected
- [ ] Notifications created when redemption status changes

### OTP Email
- [ ] POST `/api/forgot-password/send-otp` sends email (local log)
- [ ] Email appears in `storage/logs/laravel.log`
- [ ] POST `/api/forgot-password/verify-otp` validates OTP
- [ ] OTP expires after 5 minutes
- [ ] Test endpoint `/test-mail-config` returns correct config
- [ ] Test endpoint `/test-otp-flow` completes successfully
- [ ] Production: Email sent via Gmail SMTP
- [ ] Production: Check Railway logs for errors
- [ ] Production: Verify queue worker running

### Safari/iOS
- [ ] Test `/api/safari-test` from Safari (desktop)
- [ ] Test `/api/safari-test` from iOS Safari (device)
- [ ] Test login from Safari
- [ ] Test authenticated endpoints from Safari
- [ ] Cookies are set correctly
- [ ] CORS headers present in response
- [ ] No "Network Error" or "CORS blocked"
- [ ] Works with "Prevent Cross-Site Tracking" ON
- [ ] Check Railway logs for Safari requests
- [ ] User-Agent middleware logs Safari requests

---

## 🐛 Common Issues

### "Database file does not exist"
```powershell
New-Item -ItemType File -Path database/database.sqlite -Force
php artisan migrate:fresh --seed
```

### "419 CSRF Token Mismatch"
```powershell
php artisan config:clear
php artisan cache:clear
```

### "Queue not processing"
```powershell
# Make sure queue worker is running
php artisan queue:work

# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

### "Changes not reflected"
```powershell
php artisan config:clear
php artisan cache:clear
php artisan route:clear
composer dump-autoload
```

### "Email not sending"
```powershell
# Check logs
Get-Content storage/logs/laravel.log -Tail 100

# Check mail config
curl http://localhost:8000/api/test-mail-config

# Test with log driver first
# In .env: MAIL_MAILER=log
```

---

## 📚 Documentation Reference

| Issue | Document | Priority | Time |
|-------|----------|----------|------|
| Local Setup | `LOCAL_DEVELOPMENT_GUIDE.md` | ⭐⭐⭐ | 5 min |
| Notifications | `NOTIFICATION_ENDPOINTS.md` | ⭐⭐⭐ | 30 min |
| OTP Email | `OTP_DEBUGGING.md` | ⭐⭐⭐ | 20 min |
| Safari/iOS | `SAFARI_IOS_FIX.md` | ⭐⭐⭐ | 30 min |

---

## 🎯 Success Criteria

### ✅ Local Development
- [x] Server runs at `http://localhost:8000`
- [x] Can login with test accounts
- [x] Database migrations successful
- [x] Logs visible in `storage/logs/laravel.log`

### ✅ Notifications System
- [ ] All 5 endpoints working
- [ ] Notifications created automatically
- [ ] Unread count accurate
- [ ] Can mark as read
- [ ] Can delete notifications

### ✅ OTP Email
- [ ] Works locally with log driver
- [ ] Works locally with Gmail SMTP
- [ ] Works on Railway with Gmail SMTP
- [ ] Emails delivered within 1 minute
- [ ] OTP codes valid for 5 minutes
- [ ] Clear error messages in logs

### ✅ Safari/iOS Access
- [ ] Safari desktop can access API
- [ ] iOS Safari can access API
- [ ] Login works from Safari
- [ ] Authenticated requests work
- [ ] No CORS errors
- [ ] Cookies set correctly

---

## 🆘 Need Help?

1. **Check logs first:**
   ```powershell
   Get-Content storage/logs/laravel.log -Tail 100
   ```

2. **Clear all caches:**
   ```powershell
   php artisan config:clear
   php artisan cache:clear
   php artisan route:clear
   php artisan view:clear
   ```

3. **Check environment:**
   ```powershell
   php artisan about
   ```

4. **Test specific endpoints:**
   - Notifications: `/api/notifications`
   - OTP: `/api/test-otp-flow`
   - Safari: `/api/safari-test`

5. **Check Railway:**
   ```powershell
   railway logs --tail
   railway status
   ```

---

## 🚀 Ready to Start?

```powershell
# Start local development
composer install && cp .env.local .env && php artisan key:generate && New-Item -ItemType File -Path database/database.sqlite -Force && php artisan migrate && php artisan db:seed && php artisan serve
```

Then follow guides:
1. `NOTIFICATION_ENDPOINTS.md` - Implement notification system
2. `OTP_DEBUGGING.md` - Debug OTP email sending
3. `SAFARI_IOS_FIX.md` - Fix Safari/iOS access

Good luck! 🎉
