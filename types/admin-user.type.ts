import { z } from "zod";

const adminUserPermissionSchema = z.object({
  designation: z.object({
    id: z.string(),
    name: z.string(),
  }),
  branches: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
    }),
  ),
});

export const adminUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  phoneCountryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(1, "Phone number is required").regex(/^\d+$/, "Phone number must contain only digits"),
  address: z.string().max(500),
  password: z.union([
    z.string().min(6, "Password must be at least 6 characters"),
    z.literal("")
  ]).optional(),
  role: z.string().min(1, "Role is required"),
  permissions: adminUserPermissionSchema,
});

export type AdminUserSchema = z.infer<typeof adminUserSchema>;

