const mongoose = require('mongoose');
const config = require('../src/config');
const { connectDB } = require('../src/utils/database');
const User = require('../src/models/User');
const ChatRoom = require('../src/models/ChatRoom');
const Message = require('../src/models/Message');

const seedUsers = async () => {
  console.log('Seeding users...');
  
  // Clear existing users
  await User.deleteMany({});
  
  const users = [
    {
      username: 'admin',
      email: 'admin@test.com',
      password: 'Admin123',
      status: 'online',
      isActive: true,
    },
    {
      username: 'testuser',
      email: 'test@test.com',
      password: 'Password123',
      status: 'online',
      isActive: true,
    },
    {
      username: 'john_doe',
      email: 'john@test.com',
      password: 'Password123',
      status: 'away',
      isActive: true,
    },
    {
      username: 'jane_smith',
      email: 'jane@test.com',
      password: 'Password123',
      status: 'busy',
      isActive: true,
    },
    {
      username: 'bob_wilson',
      email: 'bob@test.com',
      password: 'Password123',
      status: 'offline',
      isActive: true,
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await User.create(userData);
    createdUsers.push(user);
    console.log(`Created user: ${user.username} (${user.email})`);
  }
  
  return createdUsers;
};

const seedRooms = async (users) => {
  console.log('Seeding rooms...');
  
  await ChatRoom.deleteMany({});
  
  const [user1, user2, user3, user4, user5] = users;
  
  // Create private chat rooms
  const privateRoom1 = await ChatRoom.create({
    type: 'private',
    participants: [users[0]._id, users[1]._id],
    createdBy: users[0]._id,
  });
  console.log('Created private room: admin <-> testuser');
  
  const privateRoom2 = await ChatRoom.create({
    type: 'private',
    participants: [users[1]._id, users[2]._id],
    createdBy: users[1]._id,
  });
  console.log('Created private room: testuser <-> john_doe');
  
  // Create group chat
  const groupRoom = await ChatRoom.create({
    type: 'group',
    name: 'General Chat',
    description: 'Welcome to the general chat room!',
    participants: users.map(u => u._id),
    admins: [users[0]._id],
    createdBy: users[0]._id,
  });
  console.log('Created group room: General Chat');
  
  return [privateRoom1, privateRoom2, groupRoom];
};

const seedMessages = async (rooms, users) => {
  console.log('Seeding messages...');
  
  await Message.deleteMany({});
  
  const [privateRoom1, privateRoom2, groupRoom] = rooms;
  
  // Messages for private room 1 (admin <-> testuser)
  await Message.create([
    {
      room: privateRoom1._id,
      sender: users[0]._id,
      content: 'Hey testuser! Welcome to the chat!',
      type: 'text',
    },
    {
      room: privateRoom1._id,
      sender: users[1]._id,
      content: 'Thanks admin! Happy to be here.',
      type: 'text',
    },
  ]);
  console.log('Created messages for private room 1');
  
  // Messages for group room
  await Message.create([
    {
      room: groupRoom._id,
      sender: users[0]._id,
      content: 'Welcome everyone to General Chat!',
      type: 'text',
    },
    {
      room: groupRoom._id,
      sender: users[2]._id,
      content: 'Hey everyone! John here.',
      type: 'text',
    },
    {
      room: groupRoom._id,
      sender: users[3]._id,
      content: 'Hi all! Jane here.',
      type: 'text',
    },
  ]);
  console.log('Created messages for group room');
};

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');
    
    const users = await seedUsers();
    const rooms = await seedRooms(users);
    await seedMessages(rooms, users);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\nTest credentials:');
    console.log('  admin@test.com / Admin123');
    console.log('  test@test.com / Password123');
    console.log('  john@test.com / Password123');
    console.log('  jane@test.com / Password123');
    console.log('  bob@test.com / Password123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();