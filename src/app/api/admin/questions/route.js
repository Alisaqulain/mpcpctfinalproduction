import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Question from "@/lib/models/Question";
import { jwtVerify } from "jose";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;
  if (!token) return { ok: false, error: "Unauthorized" };
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (payload.role !== "admin") return { ok: false, error: "Forbidden" };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: "Unauthorized" };
  }
}

export async function GET(request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const examId = searchParams.get('examId');
  const sectionId = searchParams.get('sectionId');
  const partId = searchParams.get('partId');
  const filter = {};
  if (examId) filter.examId = examId;
  if (sectionId) filter.sectionId = sectionId;
  if (partId) filter.partId = partId;
  // Fetch questions - Mongoose will include all fields by default
  const questions = await Question.find(filter).sort({ createdAt: -1 });
  
  // Ensure imageUrl is ALWAYS included in response - never return undefined
  const questionsWithImageUrl = questions.map(q => {
    const qObj = q.toObject({ virtuals: false, getters: false });
    
    // Get imageUrl value from database
    // Mongoose returns undefined if field doesn't exist, null if it's explicitly null
    const imageUrlValue = qObj.imageUrl;
    
    console.log(`📤 Question ${qObj._id}: imageUrl from DB =`, imageUrlValue, 
      `(type: ${typeof imageUrlValue}, isNull: ${imageUrlValue === null}, isUndefined: ${imageUrlValue === undefined}, value: "${imageUrlValue}")`);
    
    // CRITICAL: Always include imageUrl in response
    // Use null instead of undefined (JSON doesn't support undefined)
    const result = { 
      ...qObj,
      imageUrl: imageUrlValue !== undefined && imageUrlValue !== null && imageUrlValue !== '' 
        ? String(imageUrlValue) 
        : null // Use null instead of undefined for JSON compatibility
    };
    
    return result;
  });
  
  console.log(`📤 Returning ${questionsWithImageUrl.length} questions from admin API`);
  questionsWithImageUrl.forEach((q, idx) => {
    console.log(`  Question ${idx + 1} (${q._id}):`, {
      question_en: q.question_en?.substring(0, 30),
      imageUrl: q.imageUrl || 'undefined',
      imageUrlType: typeof q.imageUrl,
      hasImageUrl: !!q.imageUrl
    });
  });
  
  return NextResponse.json({ questions: questionsWithImageUrl });
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    const body = await req.json();
    
    // Only map question/question_hi for MCQ questions
    if (body.questionType === 'MCQ' || !body.questionType) {
      // Map question/question_hi to question_en/question_hi for model compatibility
      if (body.question && !body.question_en) {
        body.question_en = body.question;
        delete body.question;
      }
      if (body.options && !body.options_en) {
        body.options_en = body.options;
        delete body.options;
      }
      
      // Ensure options_en is an array
      if (body.options_en && !Array.isArray(body.options_en)) {
        body.options_en = Array.isArray(body.options_en) ? body.options_en : [body.options_en];
      }
    }
    
    // Ensure examId, sectionId, and partId are strings
    if (body.examId) body.examId = String(body.examId);
    if (body.sectionId) body.sectionId = String(body.sectionId);
    if (body.partId) body.partId = String(body.partId);
    
    // Log imageUrl for debugging
    console.log('📷 POST request body keys:', Object.keys(body));
    console.log('📷 POST body.imageUrl:', body.imageUrl);
    console.log('📷 POST body.imageUrl type:', typeof body.imageUrl);
    console.log('📷 POST body.question_en:', body.question_en);
    console.log('📷 POST body.useImageForQuestion check:', body.question_en === '[Image Question]');
    console.log('📷 Full POST body:', JSON.stringify(body, null, 2));
    
    // CRITICAL FIX: Handle imageUrl explicitly
    // For image questions, imageUrl MUST be present and non-empty
    if (body.question_en === '[Image Question]') {
      // Validate imageUrl is present
      if (!body.imageUrl || typeof body.imageUrl !== 'string' || body.imageUrl.trim() === '') {
        console.error('❌ ERROR: Image question without valid imageUrl!', {
          imageUrl: body.imageUrl,
          type: typeof body.imageUrl
        });
        return NextResponse.json({ 
          error: 'Image question must have a valid imageUrl. Please upload an image first.' 
        }, { status: 400 });
      }
      
      // Ensure imageUrl is a clean string starting with /
      const cleanImageUrl = String(body.imageUrl).trim();
      if (!cleanImageUrl.startsWith('/')) {
        console.error('❌ ERROR: imageUrl must start with /', cleanImageUrl);
        return NextResponse.json({ 
          error: 'Invalid imageUrl format. Must start with /' 
        }, { status: 400 });
      }
      
      console.log('📷 Creating IMAGE question with imageUrl:', cleanImageUrl);
      
      // Create question with imageUrl - EXPLICITLY include it
      // Build the object step by step to ensure imageUrl is included
      const questionData = {
        examId: String(body.examId),
        sectionId: String(body.sectionId),
        partId: body.partId ? String(body.partId) : undefined,
        id: String(body.id),
        questionType: body.questionType || 'MCQ',
        question_en: body.question_en,
        question_hi: body.question_hi || '',
        options_en: Array.isArray(body.options_en) ? body.options_en : (body.options_en || []),
        options_hi: Array.isArray(body.options_hi) ? body.options_hi : (body.options_hi || []),
        correctAnswer: parseInt(body.correctAnswer) || 0,
        marks: parseInt(body.marks) || 1,
        negativeMarks: parseFloat(body.negativeMarks) || 0,
        isFree: body.isFree === true || body.isFree === 'true',
        solutionVideoLink: body.solutionVideoLink?.trim() || undefined,
        explanation_en: body.explanation_en?.trim() || undefined,
        explanation_hi: body.explanation_hi?.trim() || undefined,
      };
      
      // CRITICAL: Add imageUrl separately to ensure it's included
      questionData.imageUrl = String(cleanImageUrl); // Force to string
      
      // Add imageWidth and imageHeight if provided
      if (body.imageWidth && !isNaN(parseInt(body.imageWidth))) {
        questionData.imageWidth = parseInt(body.imageWidth);
      }
      if (body.imageHeight && !isNaN(parseInt(body.imageHeight))) {
        questionData.imageHeight = parseInt(body.imageHeight);
      }
      
      console.log('📷 Final questionData being saved:', {
        keys: Object.keys(questionData),
        imageUrl: questionData.imageUrl,
        imageUrl_type: typeof questionData.imageUrl,
        imageUrl_length: questionData.imageUrl?.length,
        imageWidth: questionData.imageWidth,
        imageHeight: questionData.imageHeight,
        question_en: questionData.question_en,
        hasImageUrl: 'imageUrl' in questionData
      });
      
      // Log what we're about to save
      console.log('📷 About to create question with data:', {
        imageUrl: questionData.imageUrl,
        imageUrlInData: 'imageUrl' in questionData,
        allKeys: Object.keys(questionData)
      });
      
      try {
        // CRITICAL: Ensure imageUrl is definitely a non-empty string
        // Mongoose might convert empty strings or undefined to null
        if (!questionData.imageUrl || typeof questionData.imageUrl !== 'string') {
          console.error('❌ CRITICAL: imageUrl is not a valid string before create!', {
            imageUrl: questionData.imageUrl,
            type: typeof questionData.imageUrl
          });
          return NextResponse.json({ 
            error: 'Invalid imageUrl value before saving' 
          }, { status: 400 });
        }
        
        // CRITICAL: Log exactly what we're passing to Mongoose
        console.log('📷 About to call Question.create with:', {
          imageUrl: questionData.imageUrl,
          imageUrlType: typeof questionData.imageUrl,
          imageUrlLength: questionData.imageUrl.length,
          imageUrlStartsWith: questionData.imageUrl.startsWith('/'),
          fullQuestionData: JSON.stringify(questionData, null, 2)
        });
        
        // FINAL SOLUTION: Use native MongoDB driver to bypass Mongoose issues
        // This ensures imageUrl is ALWAYS saved correctly
        await dbConnect(); // Ensure connection is established
        
        // Get native MongoDB collection
        const db = mongoose.connection.db;
        const collection = db.collection('questions');
        
        // Prepare document with imageUrl explicitly set
        const docToInsert = {
          ...questionData,
          imageUrl: String(cleanImageUrl), // Force to string
          imageWidth: questionData.imageWidth || undefined,
          imageHeight: questionData.imageHeight || undefined,
          solutionVideoLink: body.solutionVideoLink?.trim() || undefined,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        console.log('📷 Inserting directly to MongoDB:', {
          imageUrl: docToInsert.imageUrl,
          imageUrlType: typeof docToInsert.imageUrl,
          hasImageUrl: 'imageUrl' in docToInsert
        });
        
        // Insert using native MongoDB driver
        const insertResult = await collection.insertOne(docToInsert);
        const insertedId = insertResult.insertedId;
        
        console.log('✅ Document inserted with ID:', insertedId);
        
        // Fetch the inserted document
        const savedDoc = await collection.findOne({ _id: insertedId });
        const savedImageUrl = savedDoc?.imageUrl;
        
        console.log('📷 Saved document from MongoDB:', {
          imageUrl: savedImageUrl,
          imageUrlType: typeof savedImageUrl,
          imageUrlIsNull: savedImageUrl === null,
          imageUrlIsUndefined: savedImageUrl === undefined
        });
        
        // If imageUrl is still null/undefined, force update it
        if (!savedImageUrl || String(savedImageUrl).trim() === '') {
          console.error('❌ imageUrl not saved, forcing update...');
          await collection.updateOne(
            { _id: insertedId },
            { $set: { imageUrl: String(cleanImageUrl) } }
          );
          const recheck = await collection.findOne({ _id: insertedId });
          return NextResponse.json({ 
            question: {
              ...recheck,
              _id: recheck._id.toString(),
              imageUrl: String(cleanImageUrl)
            }
          });
        }
        
        // Return the saved document with proper formatting
        return NextResponse.json({ 
          question: {
            ...savedDoc,
            _id: savedDoc._id.toString(),
            imageUrl: String(savedImageUrl) // Always return as string
          }
        });
      } catch (createError) {
        console.error('❌ Error creating question:', createError);
        return NextResponse.json({ 
          error: 'Failed to create question: ' + (createError.message || 'Unknown error') 
        }, { status: 500 });
      }
      
    } else {
      // For text questions, don't include imageUrl (let it be undefined in DB)
      console.log('📷 Creating TEXT question (no imageUrl)');
      
      const questionData = { ...body };
      delete questionData.imageUrl; // Remove imageUrl for text questions
      
      const question = await Question.create(questionData);
      const savedQuestion = await Question.findById(question._id).lean(); // Use lean() for consistency
      
      // savedQuestion is already a plain object from lean()
      return NextResponse.json({ 
        question: {
          ...savedQuestion,
          imageUrl: savedQuestion?.imageUrl || null // Return null if not set
        }
      });
    }
  } catch (error) {
    console.error('Error creating question:', error);
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message).join(', ');
      return NextResponse.json({ error: `Validation error: ${errors}` }, { status: 400 });
    }
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json({ error: `Question with this ID already exists` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create question' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.error === "Forbidden" ? 403 : 401 });
    await dbConnect();
    const body = await req.json();
    
    if (!body._id) {
      return NextResponse.json({ error: "Question _id is required for update" }, { status: 400 });
    }

    // Only map question/question_hi for MCQ questions
    if (body.questionType === 'MCQ' || !body.questionType) {
      // Map question/question_hi to question_en/question_hi for model compatibility
      if (body.question && !body.question_en) {
        body.question_en = body.question;
        delete body.question;
      }
      if (body.options && !body.options_en) {
        body.options_en = body.options;
        delete body.options;
      }
      
      // Ensure options_en is an array
      if (body.options_en && !Array.isArray(body.options_en)) {
        body.options_en = Array.isArray(body.options_en) ? body.options_en : [body.options_en];
      }
    }
    
    // Ensure examId, sectionId, and partId are strings
    if (body.examId) body.examId = String(body.examId);
    if (body.sectionId) body.sectionId = String(body.sectionId);
    if (body.partId) body.partId = String(body.partId);
    
    // Log imageUrl for debugging
    console.log('📷 PUT request body:', JSON.stringify(body, null, 2));
    if (body.imageUrl) {
      console.log('📷 Updating question with imageUrl:', body.imageUrl);
    } else {
      console.log('⚠️ No imageUrl in update body');
    }
    
    const { _id, ...updateData } = body;
    // Ensure solutionVideoLink is properly handled
    if (updateData.solutionVideoLink !== undefined) {
      updateData.solutionVideoLink = updateData.solutionVideoLink?.trim() || undefined;
    }
    console.log('📷 Update data (without _id):', JSON.stringify(updateData, null, 2));
    console.log('📷 Updating question _id:', _id);
    console.log('📷 imageUrl in updateData:', updateData.imageUrl);
    
    // Verify the question exists and check current imageUrl before update
    const existingQuestion = await Question.findById(_id);
    if (existingQuestion) {
      console.log('📷 Existing question imageUrl BEFORE update:', existingQuestion.imageUrl);
    }
    
    // CRITICAL: Handle imageUrl explicitly
    // If it's an image question, ensure imageUrl is a string (not undefined)
    if (updateData.question_en === '[Image Question]') {
      if (updateData.imageUrl) {
        updateData.imageUrl = String(updateData.imageUrl).trim();
      } else if (!updateData.imageUrl && existingQuestion?.imageUrl) {
        // Preserve existing imageUrl if not provided in update
        updateData.imageUrl = existingQuestion.imageUrl;
      } else {
        console.error('❌ ERROR: Updating image question without imageUrl!');
        return NextResponse.json({ error: 'Image question must have an imageUrl' }, { status: 400 });
      }
    } else {
      // For text questions, remove imageUrl if it's empty
      if (!updateData.imageUrl || updateData.imageUrl.trim() === '') {
        updateData.imageUrl = null; // Set to null to clear it in DB
      }
    }
    
    // Handle imageWidth and imageHeight
    if (body.imageWidth && !isNaN(parseInt(body.imageWidth))) {
      updateData.imageWidth = parseInt(body.imageWidth);
    } else if (body.imageWidth === '' || body.imageWidth === null) {
      updateData.imageWidth = null; // Clear if empty string
    }
    if (body.imageHeight && !isNaN(parseInt(body.imageHeight))) {
      updateData.imageHeight = parseInt(body.imageHeight);
    } else if (body.imageHeight === '' || body.imageHeight === null) {
      updateData.imageHeight = null; // Clear if empty string
    }
    
    console.log('📷 Final updateData:', {
      keys: Object.keys(updateData),
      imageUrl: updateData.imageUrl,
      imageUrl_type: typeof updateData.imageUrl
    });
    
    // FINAL SOLUTION: Use native MongoDB driver for updates too
    // This ensures imageUrl is ALWAYS saved correctly
    const db = mongoose.connection.db;
    const collection = db.collection('questions');
    
    // Convert _id to ObjectId if it's a string
    const ObjectId = mongoose.Types.ObjectId;
    const questionObjectId = typeof _id === 'string' ? new ObjectId(_id) : _id;
    
    // Prepare update document with imageUrl explicitly set
    const updateDoc = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // If imageUrl is provided, ensure it's a string
    if (updateDoc.imageUrl !== undefined && updateDoc.imageUrl !== null) {
      updateDoc.imageUrl = String(updateDoc.imageUrl).trim();
    }
    
    console.log('📷 Updating directly in MongoDB:', {
      _id: questionObjectId,
      imageUrl: updateDoc.imageUrl,
      imageUrlType: typeof updateDoc.imageUrl
    });
    
    // Update using native MongoDB driver
    const updateResult = await collection.updateOne(
      { _id: questionObjectId },
      { $set: updateDoc }
    );
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    
    console.log('✅ Update result:', {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount
    });
    
    // Fetch the updated document
    const savedDoc = await collection.findOne({ _id: questionObjectId });
    
    if (!savedDoc) {
      return NextResponse.json({ error: "Question not found after update" }, { status: 404 });
    }
    
    console.log('✅ Question updated. imageUrl:', savedDoc?.imageUrl);
    console.log('✅ Question imageUrl type:', typeof savedDoc?.imageUrl);
    console.log('✅ Full updated question:', JSON.stringify(savedDoc, null, 2));
    
    // Return the updated document with proper formatting
    return NextResponse.json({ 
      question: {
        ...savedDoc,
        _id: savedDoc._id.toString(),
        imageUrl: savedDoc.imageUrl ? String(savedDoc.imageUrl) : null // Always return as string or null
      }
    });
  } catch (error) {
    console.error('Error updating question:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message).join(', ');
      return NextResponse.json({ error: `Validation error: ${errors}` }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update question' }, { status: 500 });
  }
}


