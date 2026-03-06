# BrandTide API Testing Guide

## Quick Test Commands (PowerShell)

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
```

### 2. Register New User
```powershell
$registerBody = @{
    name = "Test User"
    email = "test@example.com"
    password = "test123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body $registerBody

$token = $response.data.token
Write-Host "Token: $token"
```

### 3. Login
```powershell
$loginBody = @{
    email = "demo@brandtide.com"
    password = "demo123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody

$token = $response.data.token
Write-Host "Token: $token"
```

### 4. Get Current User (requires token)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

### 5. Classify Single Review
```powershell
$classifyBody = @{
    text = "This product is absolutely amazing! Best purchase ever."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/reviews/classifier/single" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $classifyBody
```

### 6. Create Review
```powershell
$reviewBody = @{
    text = "Great product with excellent battery life!"
    productId = "P-100"
    productName = "Aurora X1"
    brand = "Aurora"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/reviews" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $reviewBody
```

### 7. Get User Reviews
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/reviews?page=1&limit=10" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

### 8. Get Dashboard Metrics
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/metrics?days=30" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
```

### 9. Batch Classify Reviews
```powershell
$batchBody = @{
    reviews = @(
        @{ text = "Amazing quality and fast shipping!" }
        @{ text = "Product broke after one week. Disappointed." }
        @{ text = "Average product, nothing special." }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "http://localhost:5000/api/reviews/classifier/batch" `
    -Method POST `
    -ContentType "application/json" `
    -Headers @{ Authorization = "Bearer $token" } `
    -Body $batchBody
```

---

## Complete Test Script

Save this as `test-api.ps1`:

```powershell
# BrandTide API Test Script

$baseUrl = "http://localhost:5000"
$apiUrl = "$baseUrl/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BrandTide API Testing Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1] Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✓ Server is healthy" -ForegroundColor Green
    Write-Host $health | ConvertTo-Json
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Login with Demo Account
Write-Host "[2] Logging in with demo account..." -ForegroundColor Yellow
$loginBody = @{
    email = "demo@brandtide.com"
    password = "demo123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.data.token
    $user = $loginResponse.data.user
    
    Write-Host "✓ Login successful" -ForegroundColor Green
    Write-Host "User: $($user.name) ($($user.email))" -ForegroundColor Cyan
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Cyan
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Get Current User
Write-Host "[3] Getting current user info..." -ForegroundColor Yellow
try {
    $meResponse = Invoke-RestMethod -Uri "$apiUrl/auth/me" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $token" }
    
    Write-Host "✓ User info retrieved" -ForegroundColor Green
    Write-Host $meResponse.data.user | ConvertTo-Json
} catch {
    Write-Host "✗ Failed to get user info: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Classify Single Review
Write-Host "[4] Classifying single review..." -ForegroundColor Yellow
$classifyBody = @{
    text = "This product exceeded my expectations! Highly recommended."
} | ConvertTo-Json

try {
    $classifyResponse = Invoke-RestMethod -Uri "$apiUrl/reviews/classifier/single" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body $classifyBody
    
    Write-Host "✓ Classification successful" -ForegroundColor Green
    Write-Host "Label: $($classifyResponse.data.label)" -ForegroundColor Cyan
    Write-Host "Confidence: $($classifyResponse.data.confidence)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Classification failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: Create Review
Write-Host "[5] Creating new review..." -ForegroundColor Yellow
$reviewBody = @{
    text = "Excellent product quality and customer service!"
    productId = "P-100"
    productName = "Aurora X1"
    brand = "Aurora"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$apiUrl/reviews" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body $reviewBody
    
    Write-Host "✓ Review created successfully" -ForegroundColor Green
    Write-Host "Review ID: $($createResponse.data._id)" -ForegroundColor Cyan
    Write-Host "Sentiment: $($createResponse.data.sentiment.label) ($($createResponse.data.sentiment.confidence))" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Failed to create review: $_" -ForegroundColor Red
}

Write-Host ""

# Test 6: Get Dashboard Metrics
Write-Host "[6] Fetching dashboard metrics..." -ForegroundColor Yellow
try {
    $metricsResponse = Invoke-RestMethod -Uri "$apiUrl/dashboard/metrics?days=30" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $token" }
    
    Write-Host "✓ Metrics retrieved" -ForegroundColor Green
    Write-Host "Total Reviews: $($metricsResponse.data.totalReviews)" -ForegroundColor Cyan
    Write-Host "Sentiment Distribution:" -ForegroundColor Cyan
    $metricsResponse.data.sentimentDistribution | ForEach-Object {
        Write-Host "  $($_.name): $($_.value)" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Failed to fetch metrics: $_" -ForegroundColor Red
}

Write-Host ""

# Test 7: Batch Classification
Write-Host "[7] Batch classifying reviews..." -ForegroundColor Yellow
$batchBody = @{
    reviews = @(
        @{ text = "Love it! Best purchase this year." }
        @{ text = "Terrible quality. Very disappointed." }
        @{ text = "It's okay, nothing special." }
    )
} | ConvertTo-Json -Depth 3

try {
    $batchResponse = Invoke-RestMethod -Uri "$apiUrl/reviews/classifier/batch" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $token" } `
        -Body $batchBody
    
    Write-Host "✓ Batch classification successful" -ForegroundColor Green
    $batchResponse.data | ForEach-Object {
        Write-Host "  '$($_.text.Substring(0, 30))...' -> $($_.label) ($($_.confidence))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "✗ Batch classification failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   All Tests Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
```

---

## Error Testing

### Test Invalid Login
```powershell
$invalidLogin = @{
    email = "wrong@example.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $invalidLogin
} catch {
    Write-Host "Expected error: $($_.Exception.Message)"
}
```

### Test Unauthorized Access
```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method GET
} catch {
    Write-Host "Expected 401 error: $($_.Exception.Message)"
}
```

### Test Invalid Token
```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" `
        -Method GET `
        -Headers @{ Authorization = "Bearer invalid_token_here" }
} catch {
    Write-Host "Expected token error: $($_.Exception.Message)"
}
```

---

## Run Complete Test Suite

```powershell
# Save the complete test script above as test-api.ps1
.\test-api.ps1
```

---

## Expected Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

---

## Notes

- Ensure backend is running on port 5000
- Run MongoDB before testing
- Seed database for demo data: `cd server; npm run seed`
- Token expires after 7 days by default
