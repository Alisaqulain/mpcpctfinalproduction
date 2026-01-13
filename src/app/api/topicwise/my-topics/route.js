import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Subscription from "@/lib/models/Subscription";
import User from "@/lib/models/User";
import Topic from "@/lib/models/Topic";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret123";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;
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
        description: ''
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

    if (!subscription) {
      // Check if there are any subscriptions at all (for debugging)
      const allSubscriptions = await Subscription.find({ userId: userObjectId }).lean();
      console.log('All subscriptions for user:', allSubscriptions.length);
      if (allSubscriptions.length > 0) {
        console.log('Subscription details:', allSubscriptions.map(s => ({
          type: s.type,
          status: s.status,
          endDate: s.endDate,
          isExpired: s.endDate < new Date()
        })));
      }
      return NextResponse.json({ 
        error: "Active subscription required",
        isPaid: false 
      }, { status: 403 });
    }

    // User has subscription, show ALL topics from Topic collection
    // (Similar to admin - subscription grants access to all topics)
    const topics = await Topic.find({}).lean().sort({ createdAt: -1 });
    console.log('Subscribed user - Found topics:', topics.length);
    
    // Format topics to ensure proper structure
    const formattedTopics = topics.map(t => ({
      _id: t._id.toString(),
      topicId: t.topicId,
      topicName: t.topicName || '',
      topicName_hi: (t.topicName_hi !== undefined && t.topicName_hi !== null) ? t.topicName_hi : '',
      description: ''
    }));

    return NextResponse.json({ topics: formattedTopics, isPaid: true });
  } catch (error) {
    console.error('Error fetching user topics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch topics' }, { status: 500 });
  }
}

