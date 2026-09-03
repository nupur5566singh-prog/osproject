import { z } from 'zod';

export const workspaceSchema = z.object({
  name: z
    .string()
    .min(2, 'Workspace name must be at least 2 characters')
    .max(50, 'Workspace name must be less than 50 characters'),
});

export type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

export const projectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(80, 'Project name must be less than 80 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  project_type: z.enum(['general', 'software'], {
    errorMap: () => ({ message: 'Please select a project type' }),
  }),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const signUpSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export type SignInFormValues = z.infer<typeof signInSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
