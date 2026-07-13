const { ChatRoom, Message, User } = require('../models');
const { NotFoundError, ForbiddenError, BadRequestError } = require('../middleware/errorHandler');

const createRoom = async (req, res, next) => {
  try {
    const { name, type, participants, description } = req.body;
    const userId = req.userId;

    if (type === 'private' && participants.length !== 1) {
      throw new BadRequestError('Private chat requires exactly one other participant');
    }

    const allParticipants = [...new Set([userId.toString(), ...participants])];

    if (type === 'private') {
      const existingRoom = await ChatRoom.findOne({
        type: 'private',
        participants: { $all: allParticipants, $size: 2 },
      }).populate('participants', 'username email avatar status lastSeen');

      if (existingRoom) {
        return res.json({ room: existingRoom.toPublicJSON(userId) });
      }
    }

    const room = await ChatRoom.create({
      name: name || (type === 'private' ? '' : name),
      type,
      participants: allParticipants,
      admins: [userId],
      createdBy: userId,
      description: description || '',
    });

    await room.populate('participants', 'username email avatar status lastSeen');
    await room.populate('createdBy', 'username email avatar');

    res.status(201).json({ room: room.toPublicJSON(userId) });
  } catch (error) {
    next(error);
  }
};

const getMyRooms = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const userId = req.userId;

    const rooms = await ChatRoom.find({
      participants: userId,
      isActive: true,
    })
      .populate('participants', 'username email avatar status lastSeen')
      .populate('lastMessage')
      .populate('createdBy', 'username email avatar')
      .sort({ lastActivity: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ChatRoom.countDocuments({ participants: userId, isActive: true });

    res.json({
      rooms: rooms.map(r => r.toPublicJSON(userId)),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const room = await ChatRoom.findById(id)
      .populate('participants', 'username email avatar status lastSeen')
      .populate('admins', 'username email avatar')
      .populate('createdBy', 'username email avatar')
      .populate('lastMessage')
      .populate('pinnedMessages');

    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (!room.isParticipant(userId)) {
      throw new ForbiddenError('Not a participant of this room');
    }

    res.json({ room: room.toPublicJSON(userId) });
  } catch (error) {
    next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, avatar, settings } = req.body;
    const userId = req.userId;

    const room = await ChatRoom.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (!room.isAdmin(userId)) {
      throw new ForbiddenError('Only admins can update room info');
    }

    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (avatar) room.avatar = avatar;
    if (settings) room.settings = { ...room.settings, ...settings };

    await room.save();
    await room.populate('participants', 'username email avatar status lastSeen');

    res.json({ room: room.toPublicJSON(userId) });
  } catch (error) {
    next(error);
  }
};

const addParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { participants } = req.body;
    const userId = req.userId;

    const room = await ChatRoom.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (!room.isAdmin(userId) && room.settings.onlyAdminsCanAddMembers) {
      throw new ForbiddenError('Only admins can add members');
    }

    if (room.type === 'private') {
      throw new BadRequestError('Cannot add participants to private chat');
    }

    for (const participantId of participants) {
      await room.addParticipant(participantId);
    }

    await room.populate('participants', 'username email avatar status lastSeen');

    res.json({ room: room.toPublicJSON(userId) });
  } catch (error) {
    next(error);
  }
};

const removeParticipant = async (req, res, next) => {
  try {
    const { id, userId: participantId } = req.params;
    const userId = req.userId;

    const room = await ChatRoom.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    const isSelfRemove = participantId === userId.toString();
    const isAdmin = room.isAdmin(userId);

    if (!isSelfRemove && !isAdmin) {
      throw new ForbiddenError('Cannot remove other participants');
    }

    await room.removeParticipant(participantId);
    await room.populate('participants', 'username email avatar status lastSeen');

    res.json({ room: room.toPublicJSON(userId) });
  } catch (error) {
    next(error);
  }
};

const leaveRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const room = await ChatRoom.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    await room.removeParticipant(userId);

    if (room.participants.length === 0) {
      room.isActive = false;
      await room.save();
    }

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const room = await ChatRoom.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (!room.createdBy.equals(userId)) {
      throw new ForbiddenError('Only room creator can delete room');
    }

    room.isActive = false;
    await room.save();

    await Message.updateMany(
      { room: id },
      { isDeleted: true, deletedAt: new Date() }
    );

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getRoomParticipants = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const room = await ChatRoom.findById(id)
      .populate('participants', 'username email avatar status lastSeen customStatus')
      .populate('admins', 'username email avatar');

    if (!room || !room.isParticipant(userId)) {
      throw new ForbiddenError('Not a participant of this room');
    }

    const participants = room.participants.map(p => ({
      ...p.toPublicJSON(),
      isAdmin: room.admins.some(a => a.equals(p._id)),
    }));

    res.json({ participants });
  } catch (error) {
    next(error);
  }
};

const muteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { until } = req.body;
    const userId = req.userId;

    const room = await ChatRoom.findById(id);
    if (!room) {
      throw new NotFoundError('Room not found');
    }

    if (!room.isParticipant(userId)) {
      throw new ForbiddenError('Not a participant of this room');
    }

    room.mutedBy = room.mutedBy.filter(m => !m.user.equals(userId));
    if (until) {
      room.mutedBy.push({ user: userId, until: new Date(until) });
    }

    await room.save();
    res.json({ message: until ? 'Room muted' : 'Room unmuted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getMyRooms,
  getRoomById,
  updateRoom,
  addParticipants,
  removeParticipant,
  leaveRoom,
  deleteRoom,
  getRoomParticipants,
  muteRoom,
};