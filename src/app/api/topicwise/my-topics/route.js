import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import Topic from "@/lib/models/Topic";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(req) {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    const userId = payload.userId;

    await dbConnect();

    // Check if user is admin
    const user = await User.findById(userId);
    console.log('User ID:', userId);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User role:', user?.role);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user?.role === "admin") {
      // Admin can see all topics from Topic collection
      const topics = await Topic.find({}).lean().sort({ createdAt: 1 });
      console.log('Admin user - Found topics:', topics.length);
      const formattedTopics = topics.map(t => ({
        _id: t._id.toString(),
        topicId: t.topicId,
        topicName: t.topicName || '',
        topicName_hi: (t.topicName_hi !== undefined && t.topicName_hi !== null) ? t.topicName_hi : '',
        description: '',
        isFree: t.isFree || false
      }));
      console.log('Admin user - Formatted topics:', formattedTopics.length);
      return NextResponse.json({ topics: formattedTopics, isPaid: true });
    }

    // Use user._id (ObjectId) instead of userId (string) for consistency
    const userObjectId = user._id;

    // Check if user has active subscription
    // First check for "all" type subscription (unified subscription)
    let subscription = await Subscription.findOne({
      userId: userObjectId,
      type: "all",
      status: "active",
      endDate: { $gt: new Date() }
    });

    console.log('Subscription check - "all" type:', subscription ? 'Found' : 'Not found');

    // If no unified subscription, check for specific type subscription
    // Note: You may want to add "topicwise" as a subscription type
    if (!subscription) {
      subscription = await Subscription.findOne({
        userId: userObjectId,
        status: "active",
        endDate: { $gt: new Date() }
      });
      console.log('Subscription check - any active:', subscription ? 'Found' : 'Not found');
      if (subscription) {
        console.log('Found subscription type:', subscription.type, 'endDate:', subscription.endDate);
      }
    }

    // Get all topics - free topics are accessible to all, paid topics require subscription
    const allTopics = await Topic.find({}).lean().sort({ createdAt: 1 });
    console.log('All topics found:', allTopics.length);
    
    // Filter topics based on subscription
    let accessibleTopics = [];
    if (subscription) {
      // User has subscription, show ALL topics
      accessibleTopics = allTopics;
      console.log('Subscribed user - All topics accessible');
    } else {
      // User has no subscription, show only FREE topics
      accessibleTopics = allTopics.filter(t => t.isFree === true);
      console.log('Non-subscribed user - Free topics only:', accessibleTopics.length);
    }
    
    // Format topics to ensure proper structure
    const formattedTopics = accessibleTopics.map(t => ({
      _id: t._id.toString(),
      topicId: t.topicId,
      topicName: t.topicName || '',
      topicName_hi: (t.topicName_hi !== undefined && t.topicName_hi !== null) ? t.topicName_hi : '',
      description: '',
      isFree: t.isFree || false
    }));

    // If user has no subscription and no free topics, return error
    if (!subscription && accessibleTopics.length === 0) {
      return NextResponse.json({ 
        error: "Active subscription required",
        isPaid: false 
      }, { status: 403 });
    }

    return NextResponse.json({ 
      topics: formattedTopics, 
      isPaid: !!subscription 
    });
  } catch (error) {
    console.error('Error fetching user topics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch topics' }, { status: 500 });
  }
}










