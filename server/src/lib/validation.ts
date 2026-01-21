import { z } from 'zod';

/**
 * Validation Schemas for Data Integrity
 * 
 * Critical for M0 Free Cluster (512MB storage limit):
 * - Prevents "junk data" from consuming storage
 * - Validates URLs before storing in database
 * - Ensures data quality and security
 */

// ✅ URL Validation Schema
// Accepts common URL formats: http, https, ftp, etc.
export const urlSchema = z.string().url({
  message: "Invalid URL format. Please provide a valid URL (e.g., https://example.com)"
});

// ✅ Array of URLs Validation
export const urlArraySchema = z.array(urlSchema).max(10, {
  message: "Maximum 10 URLs allowed per submission"
});

// ✅ Task Link Validation
// Used for both resourcesLink and submissionLink
export const taskLinkSchema = z.object({
  resourcesLink: z.array(urlSchema).optional().default([]),
  submissionLink: z.array(urlSchema).optional().default([]),
});

// ✅ Task Creation Validation
export const createTaskSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description too long (max 1000 characters)"),
  resourcesLink: z.array(urlSchema).max(10, "Maximum 10 resource links allowed").optional(),
  deadline: z.string().datetime().optional(),
  taskHours: z.number().min(0).max(100).optional(),
  team: z.string().optional(),
  targetPosition: z.enum(['Member', 'Team Leader', 'Both']).optional().default('Both'),
});

// ✅ Task Submission Validation
export const submitTaskSchema = z.object({
  submissionLink: z.array(urlSchema).min(1, "At least one submission link is required").max(5, "Maximum 5 submission links allowed"),
  status: z.enum(['Submitted']).optional(),
});

// ✅ Task Update Validation (Head/Admin)
export const updateTaskSchema = z.object({
  status: z.enum(['Pending', 'Submitted', 'Completed', 'Rejected']).optional(),
  submissionLink: z.array(urlSchema).max(5).optional(),
});

// ✅ Shared Credentials Schema (Login & Create)
export const credentialsSchema = z.object({
  email: z.string()
    .email("Strict format required: name@domain.com")
    .endsWith('@enactus.com', "Account must use @enactus.com domain")
    .min(5, "Email too short")
    .max(100, "Email too long"),
  password: z.string()
    .min(6, "Password must be at least 6 characters to ensure security")
    .max(50, "Password exceeds maximum length (50)"),
});

// ✅ Login Validation Schema
export const loginSchema = credentialsSchema;

// ✅ User Creation Validation Schema (Admin Dashboard)
export const createUserSchema = credentialsSchema.extend({
  name: z.string().min(3, "Full name must be at least 3 characters").max(50),
  role: z.enum(['General President', 'Vice President', 'Operation Director', 'Creative Director', 'HR', 'Head', 'Vice Head', 'Member']),
  department: z.enum(['General', 'IT', 'HR', 'PM', 'PR', 'FR', 'Logistics', 'Organization', 'Marketing', 'Multi-Media', 'Presentation']).optional(),
  team: z.string().max(50).optional(),
  position: z.enum(['Member', 'Team Leader']).optional().default('Member'),
  title: z.string().max(100).optional(),
});

// ✅ Hour Log Validation
export const createHourLogSchema = z.object({
  amount: z.number().min(0.5, "Minimum 0.5 hours").max(24, "Maximum 24 hours per entry"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description too long"),
});

/**
 * Helper function to validate data
 * 
 * Usage:
 * const result = validate(createTaskSchema, req.body);
 * if (!result.success) {
 *   return res.status(400).json({ errors: result.errors });
 * }
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Middleware wrapper for validation
 * 
 * Usage:
 * router.post('/tasks', validationMiddleware(createTaskSchema), createTask);
 */
export function validationMiddleware<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const result = validate(schema, req.body);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.errors.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
    req.validatedBody = result.data;
    next();
  };
}
