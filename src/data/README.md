# Learning Data Management System

This directory contains the JSON-based learning data management system for the MPCPCT application.

## Files

- `learningData.json` - Main data file containing all learning content
- `README.md` - This documentation file

## Data Structure

The `learningData.json` file contains the following structure:

```json
{
  "languages": {
    "main": [
      {
        "id": "hindi",
        "name": "Hindi",
        "subLanguages": [
          {
            "id": "ramington",
            "name": "Ramington Gail"
          },
          {
            "id": "inscript",
            "name": "Inscript"
          }
        ]
      },
      {
        "id": "english",
        "name": "English",
        "subLanguages": []
      }
    ]
  },
  "settings": {
    "durations": [3, 5, 10],
    "backspaceOptions": ["OFF", "ON"]
  },
  "sections": [
    {
      "id": "home",
      "name": "Home",
      "lessonNumber": 1,
      "description": "Home Row",
      "lessons": [
        {
          "id": "1.1",
          "title": "ASDF & JKL;",
          "description": "Basic home row keys",
          "difficulty": "beginner",
          "estimatedTime": "5 minutes"
        }
      ]
    }
  ],
  "metadata": {
    "version": "1.0",
    "lastUpdated": "2025-01-27",
    "totalLessons": 24,
    "difficultyLevels": ["beginner", "intermediate", "advanced"],
    "estimatedTotalTime": "120 minutes"
  }
}
```

## Usage

### 1. Reading Data

Use the utility functions in `src/lib/learningData.js`:

```javascript
import { getLearningData, getSections, getLessonsBySection } from '@/lib/learningData';

// Get all data
const data = getLearningData();

// Get specific sections
const sections = getSections();

// Get lessons for a section
const lessons = getLessonsBySection('home');
```

### 2. Admin Interface

Visit `/admin/learning` to access the admin interface where you can:
- View all sections and lessons
- Edit existing lessons
- Add new lessons
- Delete lessons

### 3. API Endpoints

The system provides REST API endpoints at `/api/learning`:

- `GET /api/learning` - Retrieve all learning data
- `POST /api/learning` - Update entire learning data
- `PUT /api/learning` - Update a specific lesson
- `DELETE /api/learning` - Delete a lesson

## Benefits of This Approach

1. **Maintainable**: All learning content is centralized in one JSON file
2. **Scalable**: Easy to add new sections, lessons, or languages
3. **Flexible**: Can be easily extended with new properties
4. **Version Control**: Changes can be tracked in Git
5. **Admin Interface**: Non-technical users can manage content
6. **API Integration**: Can be integrated with external systems

## Adding New Content

### Adding a New Section

1. Edit `learningData.json`
2. Add a new section object to the `sections` array
3. Update the `metadata.totalLessons` count
4. Update the `metadata.lastUpdated` date

### Adding a New Lesson

1. Use the admin interface at `/admin/learning`
2. Select the appropriate section
3. Click "Add New Lesson"
4. Fill in the lesson details
5. Save the lesson

### Adding a New Language

1. Edit `learningData.json`
2. Add a new language object to `languages.main`
3. Include any sub-languages if needed

## Best Practices

1. **Keep IDs Unique**: Ensure all lesson and section IDs are unique
2. **Consistent Naming**: Use consistent naming conventions for titles and descriptions
3. **Regular Backups**: Keep backups of the JSON file before major changes
4. **Test Changes**: Always test changes in development before deploying
5. **Update Metadata**: Remember to update the metadata when adding/removing content

## Troubleshooting

### Common Issues

1. **JSON Syntax Errors**: Use a JSON validator to check syntax
2. **Missing IDs**: Ensure all lessons have unique IDs
3. **File Permissions**: Ensure the web server can read/write the JSON file
4. **Caching Issues**: Clear browser cache if changes don't appear

### Validation

The system includes basic validation:
- Required fields are checked
- Data structure is validated
- File permissions are verified

## Future Enhancements

Potential improvements for the system:

1. **Database Integration**: Move from JSON to a proper database
2. **User Progress Tracking**: Track individual user progress
3. **Content Versioning**: Add version control for content changes
4. **Bulk Import/Export**: Add CSV/Excel import/export functionality
5. **Content Templates**: Add templates for common lesson types
6. **Media Integration**: Support for images, videos, and audio files
7. **Multi-language Support**: Full internationalization support
8. **Analytics**: Track lesson completion and user engagement
