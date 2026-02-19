import { Router, Response } from 'express';
import { body, param } from 'express-validator';
import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { authenticate, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getCachedTasks, setCachedTasks, invalidateTaskCache } from '../utils/cache';

const router = Router();

// All task routes require authentication
router.use(authenticate);

// GET /api/tasks
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = String(req.user!._id);

    // Check cache
    const cached = await getCachedTasks(userId);
    if (cached) {
      res.status(200).json({ tasks: JSON.parse(cached), fromCache: true });
      return;
    }

    const tasks = await Task.find({ owner: userId })
      .sort({ createdAt: -1 })
      .lean();

    // Cache result
    await setCachedTasks(userId, tasks);

    res.status(200).json({ tasks, fromCache: false });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 chars'),
    body('status').optional().isIn(['pending', 'completed']).withMessage('Status must be pending or completed'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, description, status, dueDate } = req.body;
      const userId = String(req.user!._id);

      const task = await Task.create({
        title,
        description,
        status: status || 'pending',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        owner: userId,
      });

      await invalidateTaskCache(userId);

      res.status(201).json({ message: 'Task created', task });
    } catch (error) {
      res.status(500).json({ message: 'Error creating task' });
    }
  }
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  [
    param('id').custom((v) => mongoose.Types.ObjectId.isValid(v)).withMessage('Invalid task ID'),
    body('title').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Title max 200 chars'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description max 1000 chars'),
    body('status').optional().isIn(['pending', 'completed']).withMessage('Status must be pending or completed'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = String(req.user!._id);

      const task = await Task.findOne({ _id: id, owner: userId });
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      const { title, description, status, dueDate } = req.body;
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) task.status = status;
      if (dueDate !== undefined) task.dueDate = new Date(dueDate);

      await task.save();
      await invalidateTaskCache(userId);

      res.status(200).json({ message: 'Task updated', task });
    } catch (error) {
      res.status(500).json({ message: 'Error updating task' });
    }
  }
);

// DELETE /api/tasks/:id
router.delete(
  '/:id',
  [
    param('id').custom((v) => mongoose.Types.ObjectId.isValid(v)).withMessage('Invalid task ID'),
  ],
  validate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = String(req.user!._id);

      const task = await Task.findOneAndDelete({ _id: id, owner: userId });
      if (!task) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      await invalidateTaskCache(userId);

      res.status(200).json({ message: 'Task deleted' });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting task' });
    }
  }
);

export default router;