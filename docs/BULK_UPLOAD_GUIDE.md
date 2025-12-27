# Bulk Problem Upload Guide

## Overview
The Bulk Problem Upload feature allows superadmins to upload multiple problems at once using CSV or JSON files. This is especially useful for importing curated problem sets like:
- **Blind 75** (75 problems)
- **NeetCode 150** (150 problems)
- **Striver's SDE Sheet** (179 problems)

## Features
✅ **Duplicate Detection**: Automatically skips problems with duplicate titles  
✅ **Validation**: Validates required fields and data formats  
✅ **Detailed Reports**: Shows successful, duplicate, and failed uploads  
✅ **Flexible Formats**: Supports both CSV and JSON  
✅ **Batch Processing**: Upload hundreds of problems in seconds  

## Access
**URL**: `/dashboard/admin/bulk-upload`  
**Permission**: Requires `create:problems` permission (Superadmin)  
**File Size Limit**: 10MB  

---

## CSV Format

### Required Fields
- `title` - Problem title (must be unique)
- `description` - Problem description
- `difficulty` - Must be "Easy", "Medium", or "Hard"
- `topics` - Comma-separated list (e.g., "Array,Hash Table,Dynamic Programming")

### Optional Fields
- `companies` - Comma-separated company names
- `constraints` - Problem constraints
- `inputFormat` - Input format description
- `outputFormat` - Expected output format
- `hints` - Pipe-separated hints (e.g., "Hint 1|Hint 2|Hint 3")
- `sampleInput1`, `sampleOutput1` - First test case
- `sampleInput2`, `sampleOutput2` - Second test case
- Add more test cases: `sampleInput3`, `sampleOutput3`, etc.

### CSV Example

```csv
title,description,difficulty,topics,companies,constraints,inputFormat,outputFormat,sampleInput1,sampleOutput1,sampleInput2,sampleOutput2
"Two Sum","Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.","Easy","Array,Hash Table","Google,Amazon,Microsoft","1 ≤ nums.length ≤ 10^4","First line: n and target. Second line: n integers","Two space-separated indices","5 9
2 7 11 15","0 1","4 6
3 2 4","0 2"
"Best Time to Buy and Sell Stock","You are given an array prices where prices[i] is the price of a given stock on the ith day. Find maximum profit.","Easy","Array,Dynamic Programming","Amazon,Facebook,Bloomberg","1 ≤ prices.length ≤ 10^5","First line: n. Second line: n space-separated prices","Single integer representing maximum profit","6
7 1 5 3 6 4","5","5
7 6 4 3 1","0"
"Contains Duplicate","Given an integer array nums, return true if any value appears at least twice.","Easy","Array,Hash Table","Google,Amazon","1 ≤ nums.length ≤ 10^5","First line: n. Second line: n integers","true or false","4
1 2 3 1","true","4
1 2 3 4","false"
"Product of Array Except Self","Given array nums, return array output where output[i] equals product of all elements except nums[i].","Medium","Array,Prefix Sum","Amazon,Microsoft,Facebook","2 ≤ nums.length ≤ 10^5","First line: n. Second line: n integers","Space-separated integers","4
1 2 3 4","24 12 8 6","5
-1 1 0 -3 3","0 0 9 0 0"
"Maximum Subarray","Find the contiguous subarray with the largest sum.","Medium","Array,Dynamic Programming,Divide and Conquer","Microsoft,Amazon,LinkedIn","1 ≤ nums.length ≤ 10^5","First line: n. Second line: n integers","Single integer","9
-2 1 -3 4 -1 2 1 -5 4","6","1
-1","-1"
```

---

## JSON Format

### Structure
```json
{
  "problems": [
    {
      "title": "Problem Title",
      "description": "Full problem description",
      "difficulty": "Easy|Medium|Hard",
      "topics": ["Topic1", "Topic2"],
      "companies": ["Company1", "Company2"],
      "constraints": "Constraints text",
      "inputFormat": "Input format description",
      "outputFormat": "Output format description",
      "hints": ["Hint 1", "Hint 2"],
      "sampleTestCases": [
        {
          "input": "sample input",
          "output": "expected output",
          "isHidden": false
        }
      ],
      "hiddenTestCases": [
        {
          "input": "hidden input",
          "output": "expected output",
          "isHidden": true
        }
      ],
      "starterCode": {
        "javascript": "function solution() {\n  // code\n}",
        "python": "def solution():\n    # code",
        "java": "public class Solution {\n    // code\n}",
        "cpp": "class Solution {\n    // code\n};"
      },
      "solution": {
        "approach": "Solution approach explanation",
        "code": "Complete solution code",
        "timeComplexity": "O(n)",
        "spaceComplexity": "O(1)"
      }
    }
  ]
}
```

### JSON Example

```json
{
  "problems": [
    {
      "title": "Two Sum",
      "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
      "difficulty": "Easy",
      "topics": ["Array", "Hash Table"],
      "companies": ["Google", "Amazon", "Microsoft", "Facebook", "Apple"],
      "constraints": "• 2 ≤ nums.length ≤ 10^4\n• -10^9 ≤ nums[i] ≤ 10^9\n• -10^9 ≤ target ≤ 10^9\n• Only one valid answer exists",
      "inputFormat": "First line: n (array length) and target\nSecond line: n space-separated integers",
      "outputFormat": "Two space-separated indices (0-indexed)",
      "hints": [
        "Use a hash map to store the complement of each number",
        "A one-pass solution is possible",
        "For each number, check if target - number exists in the hash map"
      ],
      "sampleTestCases": [
        {
          "input": "4 9\n2 7 11 15",
          "output": "0 1",
          "isHidden": false
        },
        {
          "input": "3 6\n3 2 4",
          "output": "1 2",
          "isHidden": false
        },
        {
          "input": "2 6\n3 3",
          "output": "0 1",
          "isHidden": false
        }
      ],
      "hiddenTestCases": [
        {
          "input": "5 100\n10 20 30 40 50",
          "output": "3 4",
          "isHidden": true
        }
      ],
      "starterCode": {
        "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n    // Write your code here\n}",
        "python": "def two_sum(nums, target):\n    \"\"\"\n    :param nums: List[int]\n    :param target: int\n    :return: List[int]\n    \"\"\"\n    # Write your code here\n    pass",
        "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}",
        "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};"
      },
      "solution": {
        "approach": "Use a hash map to store each number and its index as we iterate. For each number, check if target - number exists in the map. If it does, return the indices.",
        "code": "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}",
        "timeComplexity": "O(n)",
        "spaceComplexity": "O(n)"
      }
    },
    {
      "title": "Reverse Linked List",
      "description": "Given the head of a singly linked list, reverse the list, and return the reversed list.",
      "difficulty": "Easy",
      "topics": ["Linked List", "Recursion"],
      "companies": ["Amazon", "Microsoft", "Facebook", "Google", "Apple"],
      "constraints": "• The number of nodes in the list is in the range [0, 5000]\n• -5000 ≤ Node.val ≤ 5000",
      "inputFormat": "First line: n (number of nodes)\nSecond line: n space-separated node values",
      "outputFormat": "Space-separated node values in reversed order",
      "hints": [
        "Think about changing the next pointers",
        "Can you solve it both iteratively and recursively?",
        "Keep track of previous, current, and next nodes"
      ],
      "sampleTestCases": [
        {
          "input": "5\n1 2 3 4 5",
          "output": "5 4 3 2 1",
          "isHidden": false
        },
        {
          "input": "2\n1 2",
          "output": "2 1",
          "isHidden": false
        },
        {
          "input": "0\n",
          "output": "",
          "isHidden": false
        }
      ],
      "starterCode": {
        "javascript": "/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nfunction reverseList(head) {\n    // Write your code here\n}",
        "python": "def reverse_list(head):\n    \"\"\"\n    :param head: ListNode\n    :return: ListNode\n    \"\"\"\n    # Write your code here\n    pass"
      }
    }
  ]
}
```

---

## Usage Instructions

### Step 1: Download Template
1. Navigate to `/dashboard/admin/bulk-upload`
2. Click "Download CSV Template" or "Download JSON Template"
3. Open the downloaded file in your preferred editor

### Step 2: Prepare Your Data
1. Fill in the template with your problem data
2. Ensure all required fields are present
3. Verify difficulty values are exactly "Easy", "Medium", or "Hard"
4. For CSV: Use comma-separated values for topics/companies
5. For JSON: Use proper array format

### Step 3: Upload
1. Click "Choose CSV or JSON file"
2. Select your prepared file
3. Click "Upload Problems"
4. Wait for processing to complete

### Step 4: Review Results
The upload will show:
- ✅ **Successful**: Problems added to database
- ⚠️ **Duplicates**: Problems skipped (title already exists)
- ❌ **Failed**: Problems with validation errors

You can download a detailed report of duplicates and failed entries.

---

## Duplicate Detection

The system prevents duplicate problems by checking the **title** field:
1. Each title is converted to a slug (lowercase, hyphenated)
2. Before insertion, existing slugs are queried
3. Problems with matching slugs are skipped
4. All skipped problems are reported in the results

**Example**: "Two Sum" → slug: "two-sum"

If a problem with title "Two Sum" already exists, uploading another "Two Sum" will be skipped.

---

## Validation Rules

### Required Field Validation
- `title`: Must not be empty
- `description`: Must not be empty
- `difficulty`: Must be "Easy", "Medium", or "Hard"
- `topics`: Must be an array with at least one topic

### Data Type Validation
- `topics`: Array of strings
- `companies`: Array of strings
- `hints`: Array of strings
- `sampleTestCases`: Array of objects with `input`, `output`, `isHidden`
- `starterCode`: Object with language keys

### Error Handling
- Invalid difficulty → Failed with error message
- Missing required field → Failed with error message
- Invalid JSON/CSV format → Upload rejected
- Duplicate title → Skipped (not failed)

---

## Best Practices

### ✅ DO
- Test with 5-10 problems first before large uploads
- Use the provided templates as a starting point
- Verify CSV encoding (UTF-8 recommended)
- Include sample test cases for better problem quality
- Use descriptive topics (Array, Hash Table, Dynamic Programming)
- Add constraints and format descriptions

### ❌ DON'T
- Upload files larger than 10MB
- Use inconsistent difficulty values ("easy" vs "Easy")
- Leave required fields empty
- Include duplicate titles in the same upload
- Use special characters that break CSV format

---

## Common Issues & Solutions

### Issue: "No valid problems found"
**Solution**: Check that your file has the correct format and required fields

### Issue: "Invalid file format"
**Solution**: Ensure file extension is .csv or .json

### Issue: All problems marked as duplicates
**Solution**: Check if problems already exist in database. Try different titles.

### Issue: CSV parsing error
**Solution**: 
- Ensure proper CSV formatting
- Quote fields containing commas or newlines
- Use UTF-8 encoding

### Issue: JSON parsing error
**Solution**:
- Validate JSON syntax using online validator
- Check for missing commas or brackets
- Ensure proper quote escaping

---

## API Endpoint

**POST** `/api/problems/bulk-upload`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body**:
```
bulkFile: <file> (CSV or JSON)
```

**Response**:
```json
{
  "success": true,
  "message": "Bulk upload completed. 45 problems added successfully.",
  "summary": {
    "totalProcessed": 50,
    "successful": 45,
    "duplicates": 3,
    "failed": 2
  },
  "details": {
    "duplicates": [
      {
        "title": "Two Sum",
        "reason": "Problem with this title already exists"
      }
    ],
    "failed": [
      {
        "title": "Invalid Problem",
        "reason": "Validation error: difficulty must be Easy, Medium, or Hard"
      }
    ]
  }
}
```

---

## Importing Curated Problem Sets

### Blind 75
Create a CSV/JSON with all 75 problems from the Blind 75 list. Ensure proper topics and difficulty levels.

### NeetCode 150
Download the NeetCode 150 list and format it according to the template.

### Striver's SDE Sheet
Convert Striver's 179 problems into the required format.

### Tips for Large Imports
1. Split into batches of 50-100 problems
2. Upload one batch at a time
3. Review results after each batch
4. Fix any failed entries before proceeding

---

## Technical Details

### File Storage
Uploaded files are temporarily stored in `backend/uploads/bulk/` and automatically deleted after processing.

### Processing Flow
1. File uploaded via multipart form
2. File parsed (CSV or JSON)
3. Data validation
4. Duplicate check (slug query)
5. Bulk insertion with error handling
6. Cleanup temporary file
7. Return detailed results

### Performance
- CSV: ~100 problems/second
- JSON: ~150 problems/second
- Database insertion: Optimized bulk insert
- Duplicate detection: Single query for all slugs

---

## Support

For issues or questions about bulk upload:
1. Check this documentation
2. Review upload error messages
3. Test with template files first
4. Contact system administrator

---

## Changelog

### v1.0.0 (2025-12-27)
- Initial release
- CSV and JSON support
- Duplicate detection
- Detailed reporting
- Template downloads
