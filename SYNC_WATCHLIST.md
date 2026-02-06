# Watchlist Sync Feature

## Overview
Automatically sync watchlist markdown files to the Portfolio Dashboard Research tab.

## Structure

### Markdown Files
Located in `/data/` folder:
- `관심종목-미장.md` (US stocks)
- `관심종목-국장.md` (KR stocks)

### Format
```markdown
## (1) 보유 종목

### TICKER (Name)
- **확신도**: X
- **테시스**: ...
- **손절**: ...

## (2) 관심 종목

### TICKER (Name)
...

## (3) 보류

### TICKER (Name)
...
```

### Parser Logic
- Section `## (1) 보유 종목` → Folder `미장 > (1) 보유 종목`
- Stock `### INTC (Intel)` → Ticker=INTC, Name=Intel
- KR format: `### 삼성전자 (005930)` → Ticker=005930, Name=삼성전자

## Usage

### 1. Update Markdown Files
Edit the files in `/data/` folder:
```bash
vi data/관심종목-미장.md
vi data/관심종목-국장.md
```

### 2. Commit & Push
```bash
git add data/*.md
git commit -m "Update watchlist"
git push origin master
```

### 3. Sync in Dashboard
1. Go to Research tab
2. Click "🔄 Sync" button (top right)
3. Wait for sync to complete
4. View results in modal

## Sync Behavior

### Folders
- Auto-creates nested folder structure
- Format: `{market} > {category}`
- Example: `미장 > (1) 보유 종목`

### Stocks
- **New stocks**: Added to appropriate folder
- **Existing stocks**: Skipped (no update)
- **Invalid ticker**: Logged as error, skipped

### Result Modal
Shows:
- ✅ Added stocks count
- ⚠️ Skipped stocks count
- 📁 Folders created
- ❌ Errors (if any)

## API Endpoint

### `GET /api/research/sync-watchlist`

**Response:**
```json
{
  "added": 5,
  "skipped": 3,
  "errors": [],
  "details": {
    "foldersCreated": ["미장 > (1) 보유 종목"],
    "stocksAdded": ["INTC (Intel)", "GOOGL (Alphabet)"],
    "stocksSkipped": ["AMZN (Amazon)"]
  }
}
```

## Testing

### Local Test
1. Start dev server: `npm run dev`
2. Go to http://localhost:3000
3. Navigate to Research tab
4. Click Sync button

### Production Test
1. Deploy to Vercel (auto on push)
2. Visit https://portfolio-dashboard-jet-three.vercel.app
3. Navigate to Research tab
4. Click Sync button

## Troubleshooting

### "Failed to read file"
- Check if files exist in `/data/` folder
- Verify file encoding (UTF-8)

### "No stocks found"
- Check markdown format (must follow exact structure)
- Verify section headers: `## (1) ...`
- Verify stock headers: `### TICKER (Name)`

### Stocks not syncing
- Clear browser cache
- Check browser console for errors
- Verify DATABASE_URL in Vercel env vars

## Future Improvements

1. **Auto-sync on file change** (webhook)
2. **Bidirectional sync** (dashboard → markdown)
3. **Conflict resolution** (merge strategies)
4. **Validation** (ticker format, duplicate detection)
5. **Batch operations** (update existing stocks)

---

**Last Updated**: 2026-02-06  
**Author**: Justin (CTO)
