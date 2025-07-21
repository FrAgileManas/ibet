import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { prisma } from '@/lib/db';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = req.headers;
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occured', {
      status: 400,
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new NextResponse('Error processing webhook', { status: 500 });
  }

  return new NextResponse('Webhook processed successfully', { status: 200 });
}

async function handleUserCreated(userData: any) {
  try {
    await prisma.users.create({
      data: {
        id: userData.id,
        email: userData.email_addresses[0]?.email_address || '',
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
        balance: 0.00,
        is_admin: false,
      },
    });
    console.log(`User created: ${userData.id}`);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function handleUserUpdated(userData: any) {
  try {
    await prisma.users.update({
      where: { id: userData.id },
      data: {
        email: userData.email_addresses[0]?.email_address || '',
        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 'User',
        updated_at: new Date(),
      },
    });
    console.log(`User updated: ${userData.id}`);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

async function handleUserDeleted(userData: any) {
  try {
    // In a production app, you might want to soft delete or archive user data
    // For now, we'll keep the user record but mark them as inactive
    await prisma.users.update({
      where: { id: userData.id },
      data: {
        updated_at: new Date(),
        // You could add an 'active' field to track deleted users
      },
    });
    console.log(`User deleted: ${userData.id}`);
  } catch (error) {
    console.error('Error handling user deletion:', error);
    throw error;
  }
}