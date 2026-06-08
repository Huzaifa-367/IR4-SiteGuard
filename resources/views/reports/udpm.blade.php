<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>UDPM Report — {{ $siteName }} — {{ $weekStart }}</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; color: #111; }
        h1 { font-size: 1.25rem; margin-bottom: 0.25rem; }
        h2 { font-size: 1rem; margin-top: 1.5rem; border-bottom: 1px solid #ccc; padding-bottom: 0.25rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; font-size: 0.875rem; }
        th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; }
        th { background: #f5f5f5; }
        .meta { color: #555; font-size: 0.875rem; }
    </style>
</head>
<body>
    <h1>UDPM-GM-0058 Weekly Report</h1>
    <p class="meta">{{ $siteName }} ({{ $siteCode }}) · Week {{ $weekLabel }} · {{ $weekStart }} — {{ $weekEnd }}</p>

    @foreach($sections as $key => $section)
        <h2>Section {{ strtoupper($key) }}</h2>
        <pre style="white-space: pre-wrap; font-size: 0.8rem;">{{ json_encode($section, JSON_PRETTY_PRINT) }}</pre>
    @endforeach
</body>
</html>
