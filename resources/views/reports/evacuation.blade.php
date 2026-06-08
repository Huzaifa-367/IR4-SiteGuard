<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Evacuation Report — {{ $siteName }}</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; color: #111; }
        h1 { font-size: 1.25rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; }
        th, td { border: 1px solid #ddd; padding: 0.4rem 0.6rem; text-align: left; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <h1>Evacuation Report</h1>
    <p>{{ $siteName }} · Generated {{ $generatedAt }} · On-site count: {{ $onSiteCount }}</p>
    <table>
        <thead>
            <tr>
                <th>Worker</th>
                <th>Contractor</th>
                <th>Last zone</th>
                <th>Last seen</th>
                <th>Muster status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($personnel as $person)
                <tr>
                    <td>{{ $person['worker'] ?? $person['tag_epc'] }}</td>
                    <td>{{ $person['contractor'] ?? '—' }}</td>
                    <td>{{ $person['last_zone'] ?? '—' }}</td>
                    <td>{{ $person['last_seen_at'] ?? '—' }}</td>
                    <td>{{ $person['muster_status'] ?? 'unknown' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
