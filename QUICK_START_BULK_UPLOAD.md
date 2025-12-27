# Quick Start: Bulk Problem Upload

## 🚀 Get Started in 3 Steps

### Step 1: Access the Feature
1. Log in as **Superadmin**
2. Navigate to Admin Dashboard: `/dashboard/admin`
3. Click **"Bulk Upload Problems"** button (📤 icon)

### Step 2: Download Template
1. On the bulk upload page, click:
   - **"Download CSV Template"** (recommended for beginners)
   - OR **"Download JSON Template"** (for advanced users)
2. Open the downloaded template file

### Step 3: Upload Your Problems
1. Fill in the template with your problem data
2. Click **"Choose CSV or JSON file"**
3. Select your completed file
4. Click **"Upload Problems"**
5. Review the results!

---

## 📋 Quick Templates

### Minimal CSV (4 Required Fields)
```csv
title,description,difficulty,topics
"Two Sum","Find two numbers that add to target","Easy","Array,Hash Table"
"Reverse String","Reverse a string","Easy","String,Two Pointers"
```

### Complete CSV (All Fields)
```csv
title,description,difficulty,topics,companies,constraints,inputFormat,outputFormat,sampleInput1,sampleOutput1
"Two Sum","Given array and target, return indices","Easy","Array,Hash Table","Google,Amazon","2 ≤ n ≤ 10^4","n and target, then n integers","Two indices","4 9
2 7 11 15","0 1"
```

---

## ✅ Validation Checklist

Before uploading, verify:
- [ ] **Title**: Unique, descriptive name
- [ ] **Description**: Clear problem statement
- [ ] **Difficulty**: Exactly "Easy", "Medium", or "Hard" (case-sensitive)
- [ ] **Topics**: At least one topic (comma-separated in CSV)
- [ ] **File Format**: .csv or .json extension
- [ ] **File Size**: Under 10MB

---

## 📊 Understanding Results

### Success Summary
```
✅ Successful: 45    → Problems added to database
⚠️ Duplicates: 3     → Problems with existing titles (skipped)
❌ Failed: 2         → Problems with validation errors
```

### What to Do Next
- **All Successful?** → Great! Continue with more uploads
- **Some Duplicates?** → Normal if updating library
- **Some Failed?** → Download error report, fix issues, re-upload

---

## 🎯 Quick Import: Popular Problem Sets

### Blind 75 (75 Problems)
1. Find Blind 75 list online
2. Copy problem data to CSV template
3. Upload → Instant 75-problem library!

### NeetCode 150 (150 Problems)
1. Visit NeetCode website
2. Export problem list
3. Format as CSV/JSON
4. Upload → 150 more problems!

### Striver's SDE Sheet (179 Problems)
1. Access Striver's sheet
2. Convert to our format
3. Upload → Interview-ready library!

---

## 🐛 Common Issues & Fixes

### Issue: "No valid problems found"
**Fix**: Ensure CSV has header row and data rows

### Issue: "All problems are duplicates"
**Fix**: Problems with these titles already exist. Use unique titles.

### Issue: "Difficulty validation failed"
**Fix**: Change "easy" to "Easy", "medium" to "Medium", "hard" to "Hard"

### Issue: "Invalid file type"
**Fix**: Save as .csv (not .xlsx) or .json

---

## 💡 Pro Tips

1. **Start Small**: Test with 5-10 problems first
2. **Use Templates**: Always start from downloaded templates
3. **UTF-8 Encoding**: Save CSV files as UTF-8
4. **Quote Fields**: In CSV, quote fields with commas or newlines
5. **Batch Upload**: Upload 50-200 problems at a time for best performance
6. **Review Results**: Always check the summary before continuing

---

## 📞 Need Help?

- **Full Guide**: See `docs/BULK_UPLOAD_GUIDE.md`
- **Format Details**: Click "Show Format Details" on upload page
- **Sample Data**: Use `docs/sample_problems_blind75.csv`
- **Technical Docs**: See `docs/BULK_UPLOAD_IMPLEMENTATION.md`

---

## 🎉 Success!

Once uploaded, your problems are:
- ✅ Immediately available to all users
- ✅ Searchable and filterable
- ✅ Integrated with the practice system
- ✅ Ready for interview simulations

**Start building your problem library now!** 🚀
