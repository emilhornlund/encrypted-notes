import { z } from 'zod';

// Re-export DTO schemas for validation
export {
  LoginRequestSchema,
  RegisterRequestSchema,
  CreateNoteRequestSchema,
  UpdateNoteRequestSchema,
  SearchRequestSchema,
  AddTagRequestSchema,
} from '../dtos';

// Additional validation schemas for internal use
export const EmailSchema = z.string().email().toLowerCase();

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  );

export const UUIDSchema = z.string().uuid();

export const Base64Schema = z.string().regex(/^[A-Za-z0-9+/]*={0,2}$/);

export const HexSchema = z.string().regex(/^[0-9a-fA-F]+$/);