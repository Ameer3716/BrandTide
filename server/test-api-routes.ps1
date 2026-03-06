# Test API Routes

Write-Host "`n🧪 Testing BrandTide API Routes`n" -ForegroundColor Cyan

# Get auth token first (you'll need to update with your actual token)
$token = Read-Host "Enter your JWT token (get from browser localStorage)"

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host "`n1️⃣ Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    Write-Host "✅ Health Check: $($response.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $_" -ForegroundColor Red
}

Write-Host "`n2️⃣ Testing GET /api/auth/me..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/me" -Method GET -Headers $headers
    Write-Host "✅ User Profile Retrieved" -ForegroundColor Green
    Write-Host "   Name: $($response.data.user.name)"
    Write-Host "   Email: $($response.data.user.email)"
} catch {
    Write-Host "❌ Get Profile Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3️⃣ Testing POST /api/dashboard/init-sample..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/init-sample" -Method POST -Headers $headers
    Write-Host "✅ Sample Data Initialization" -ForegroundColor Green
    Write-Host "   Message: $($response.message)"
    Write-Host "   Initialized: $($response.data.initialized)"
} catch {
    Write-Host "❌ Init Sample Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4️⃣ Testing GET /api/dashboard/metrics..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/metrics?days=30" -Method GET -Headers $headers
    Write-Host "✅ Dashboard Metrics Retrieved" -ForegroundColor Green
    Write-Host "   Total Reviews: $($response.data.totalReviews)"
    Write-Host "   Sentiment Data Points: $($response.data.timeSeries.Length)"
} catch {
    Write-Host "❌ Get Metrics Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n5️⃣ Testing GET /api/dashboard/overview..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/dashboard/overview" -Method GET -Headers $headers
    Write-Host "✅ Dashboard Overview Retrieved" -ForegroundColor Green
    Write-Host "   Total Reviews: $($response.data.totalReviews)"
    Write-Host "   Positive: $($response.data.positiveReviews)"
    Write-Host "   Negative: $($response.data.negativeReviews)"
} catch {
    Write-Host "❌ Get Overview Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n6️⃣ Testing GET /api/reviews..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/reviews?page=1&limit=5" -Method GET -Headers $headers
    Write-Host "✅ Reviews Retrieved" -ForegroundColor Green
    Write-Host "   Count: $($response.data.reviews.Length)"
    Write-Host "   Total: $($response.data.total)"
    if ($response.data.reviews.Length -gt 0) {
        Write-Host "   First Review Text: $($response.data.reviews[0].text.Substring(0, [Math]::Min(50, $response.data.reviews[0].text.Length)))..."
    }
} catch {
    Write-Host "❌ Get Reviews Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ API Route Testing Complete!`n" -ForegroundColor Cyan
