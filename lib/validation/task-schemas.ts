import { z } from 'zod';

export const taskSchema = z.object({
  title: z
    .string()
    .min(2, 'Task title must be at least 2 characters')
    .max(200, 'Task title must be less than 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).default('none'),
  assignee_id: z.string().uuid().nullable().optional(),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  parent_task_id: z.string().uuid().nullable().optional(),
});

export type TaskFormValues = z.infer<typeof taskSchema>;

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
});

export type CommentFormValues = z.infer<typeof commentSchema>;

export const labelSchema = z.object({
  name: z
    .string()
    .min(1, 'Label name is required')
    .max(30, 'Label name must be less than 30 characters'),
  color: z.string().min(1, 'Color is required'),
});

export type LabelFormValues = z.infer<typeof labelSchema>;
