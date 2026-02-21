# Question Bank Requirements & File Names

## Question Bank Files Location
All question bank files are located in: `src/data/`

---

## 1. RSCIT Question Bank
**File Name:** `rscit-questions-bank.json`

### Current Status:
- **Total Questions:** 15
- **Section A Questions:** 10
- **Section B Questions:** 5

### Requirements for 20 Exams:
- **Section A:** 20 exams × 15 questions = **300 unique questions needed**
- **Section B:** 20 exams × 35 questions = **700 unique questions needed**
- **Total Required:** **1,000 unique questions**

### Currently Missing:
- **Section A:** Need **290 more questions** (300 - 10 = 290)
- **Section B:** Need **695 more questions** (700 - 5 = 695)
- **Total Missing:** **985 questions**

### JSON Structure:
```json
{
  "questions": [
    {
      "section": "A",  // or "B"
      "category": "Introduction to Computer",
      "question_en": "What is RAM used for?",
      "question_hi": "RAM का उपयोग किस लिए किया जाता है?",
      "options_en": [
        "Temporary data storage",
        "Permanent data storage",
        "Input device",
        "Output device"
      ],
      "options_hi": [
        "अस्थायी डेटा संग्रहण",
        "स्थायी डेटा संग्रहण",
        "इनपुट डिवाइस",
        "आउटपुट डिवाइस"
      ],
      "correctAnswer": 0,
      "marks": 2,
      "explanation_en": "RAM (Random Access Memory) is used for temporary data storage...",
      "explanation_hi": "RAM (रैंडम एक्सेस मेमोरी) का उपयोग..."
    }
  ]
}
```

---

## 2. CCC Question Bank
**File Name:** `ccc-questions-bank.json`

### Current Status:
- **Total Questions:** 20

### Requirements for Multiple Exams:
- **Per Exam:** 100 questions
- **For 20 Exams:** 20 × 100 = **2,000 unique questions needed**

### Currently Missing:
- Need **1,980 more questions** (2,000 - 20 = 1,980)

### JSON Structure:
Same as RSCIT structure, but all questions go in one section.

---

## 3. Topic-Wise Question Bank
**File Name:** `topicwise-questions-bank.json`

### Current Status:
- **Total Questions Across All Topics:** 18 questions
- **Per Topic Breakdown:**
  - Computers and their evolution and types: 3 questions
  - Computer generations & Printers: 2 questions
  - All types of memory: 2 questions
  - Software and its types and hardware, input and output devices: 2 questions
  - All programming languages: 1 question
  - Data communication media: 1 question
  - Internet browsers and search engines, mail sites, viruses, and network media and topology: 2 questions
  - Microsoft Office (Word, Excel, PowerPoint): 2 questions
  - All shortcut keys: 2 questions
  - Important sorts of notes: 1 question

### Requirements:
- **Per Topic:** Minimum 100 questions recommended
- **Total Topics:** 10 topics
- **Total Required:** **1,000+ unique questions** (100 per topic)

### Currently Missing:
- Need approximately **982+ more questions** across all topics (1,000 - 18 = 982)

### JSON Structure:
```json
{
  "topics": {
    "topic-computers-evolution-types": {
      "topicName": "Computers and their evolution and types",
      "topicName_hi": "कंप्यूटर और उनका विकास और प्रकार",
      "questions": [
        {
          "question_en": "What is a computer?",
          "question_hi": "कंप्यूटर क्या है?",
          "options_en": [...],
          "options_hi": [...],
          "correctAnswer": 0,
          "explanation_en": "...",
          "explanation_hi": "..."
        }
      ]
    }
  }
}
```

---

## Important Notes:

1. **NO DUPLICATES:** Each question must test a UNIQUE concept
2. **Bilingual Required:** All questions must have both English (`question_en`) and Hindi (`question_hi`)
3. **Options:** All questions must have 4 options in both languages
4. **Correct Answer:** Must be 0, 1, 2, or 3 (0-indexed)
5. **No Tags:** Do NOT include tags like [V51], [V52] or "(Question 57)" in question text
6. **Marks:** RSCIT questions should have `"marks": 2`

---

## How to Add Questions:

1. Open the appropriate JSON file in `src/data/`
2. Add questions following the structure above
3. Ensure questions are unique and cover different topics/concepts
4. Save the file
5. Use the import buttons in Admin Panel to import questions

