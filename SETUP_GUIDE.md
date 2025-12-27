# 🚀 Quick Setup Guide for New Features

## Step 1: Install Dependencies

```bash
cd backend
npm install openai
```

## Step 2: Configure Environment Variables

Add to `backend/.env`:

```env
# OpenAI Configuration (Optional - falls back to keyword responses if not set)
OPENAI_API_KEY=sk-...your-key-here
OPENAI_MODEL=gpt-4    # or gpt-3.5-turbo for lower costs

# Your existing variables should already be here
MONGO_URI=mongodb://localhost:27017/dsa-mentor
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
# ... other existing vars
```

### Getting an OpenAI API Key:
1. Go to https://platform.openai.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create a new secret key
5. Copy and paste into your `.env` file

**Note:** The AI features will work without the API key using intelligent fallback responses, but for production-quality AI interactions, the API key is recommended.

## Step 3: Update Your Frontend Routes

Add these routes to your `frontend/src/App.jsx` (or wherever you define routes):

```jsx
import CareerTracksPage from './pages/client/CareerTracksPage';
import CareerTrackDetailPage from './pages/client/CareerTrackDetailPage';

// Inside your Routes:
<Route path="/dashboard/career-tracks" element={<CareerTracksPage />} />
<Route path="/dashboard/career-tracks/:slug" element={<CareerTrackDetailPage />} />
```

## Step 4: Add Navigation Link

In your dashboard/sidebar navigation, add:

```jsx
<NavLink to="/dashboard/career-tracks">
  <span className="icon">📚</span>
  Career Tracks
</NavLink>
```

## Step 5: Create Sample Career Track (Optional)

Use MongoDB Compass or your preferred tool to insert a sample track:

```javascript
db.careertracks.insertOne({
  title: "Google L4 Interview Track",
  slug: "google-l4-interview-track",
  description: "Prepare for Google L4 technical interviews with curated problems",
  longDescription: "This comprehensive track covers all topics commonly asked in Google L4 interviews, including arrays, strings, trees, graphs, dynamic programming, and system design.",
  category: "company-specific",
  targetRole: "Google L4 Software Engineer",
  difficulty: "intermediate",
  estimatedDuration: "6 weeks",
  icon: "🎯",
  color: "#4285f4",
  isPremium: false,
  isActive: true,
  tags: ["google", "l4", "faang", "interview"],
  modules: [
    {
      title: "Arrays & Strings Fundamentals",
      description: "Master array and string manipulation techniques",
      order: 1,
      icon: "📝",
      unlockRequirement: {
        type: "always_unlocked"
      },
      lessons: [
        {
          title: "Two Sum Problem",
          description: "Learn hashing techniques for array problems",
          problemId: "YOUR_PROBLEM_ID_HERE", // Replace with actual problem ID
          order: 1,
          estimatedTime: 30,
          resources: [
            {
              title: "Google Interview Guide",
              url: "https://example.com/guide",
              type: "article"
            }
          ]
        }
        // Add more lessons...
      ]
    }
    // Add more modules...
  ],
  enrollmentCount: 0,
  completionCount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## Step 6: Test the Features

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Career Tracks:**
   - Navigate to `/dashboard/career-tracks`
   - Should see your sample track
   - Click "Enroll Now"
   - View track details
   - Navigate through modules

4. **Test AI Integration:**
   - Start a mock interview
   - Send a message in the chat
   - Should get contextual AI responses
   - Submit code for AI-powered feedback

5. **Test Achievements:**
   - Solve a problem
   - Check `/dashboard/achievements`
   - Should see progress updated
   - Complete a career track lesson
   - New achievements should unlock

## Step 7: Monitor & Debug

### Check Backend Logs:
```bash
# You should see:
✅ Server running on port 5000
✅ MongoDB connected successfully
# If OpenAI is configured:
✅ OpenAI API configured
# If not:
⚠️  OpenAI API key not configured, using fallback responses
```

### Test API Endpoints:
```bash
# Get all tracks
curl http://localhost:5000/api/career-tracks

# Get specific track
curl http://localhost:5000/api/career-tracks/google-l4-interview-track

# Test with authentication (replace TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/career-tracks/TRACK_ID/enroll \
  -X POST
```

## Troubleshooting

### Issue: "OpenAI API error"
- Check your API key is correct
- Verify you have credits in your OpenAI account
- System will automatically fallback to keyword responses

### Issue: "Track not found"
- Ensure you created a sample track in MongoDB
- Check the slug matches the URL
- Verify `isActive: true`

### Issue: "Cannot enroll in track"
- Ensure you're logged in
- Check authentication token is valid
- Verify track exists and is active

### Issue: Frontend components not found
- Ensure files are in correct directories:
  - `frontend/src/pages/client/CareerTracksPage.jsx`
  - `frontend/src/pages/client/CareerTrackDetailPage.jsx`
  - `frontend/src/styles/CareerTracks.css`
  - `frontend/src/styles/CareerTrackDetail.css`

## Next Steps

1. **Create More Tracks:** Build comprehensive career tracks for different roles
2. **Implement Discussions:** Add the discussion controller and UI
3. **Add Leaderboards:** Implement competitive rankings
4. **Enable Mentor Role:** Build student management features
5. **Add Voice:** Integrate Web Speech API for voice interviews

## Cost Considerations

### OpenAI API Costs (as of Dec 2025):
- **GPT-4:** ~$0.03 per 1K tokens (input) + $0.06 per 1K tokens (output)
- **GPT-3.5-Turbo:** ~$0.001 per 1K tokens (cheaper but less capable)

**Estimated costs per interview:**
- With GPT-4: $0.10 - $0.30 per complete interview
- With GPT-3.5: $0.01 - $0.03 per complete interview

**Recommendations:**
- Start with GPT-4 for quality
- Implement caching for common questions
- Set up usage limits per user
- Consider GPT-3.5-turbo for high-traffic scenarios

## Support

For issues or questions:
1. Check `IMPLEMENTATION_SUMMARY.md` for detailed documentation
2. Review backend logs for error details
3. Test API endpoints directly with curl/Postman
4. Check MongoDB for data consistency

---

Happy coding! 🚀
