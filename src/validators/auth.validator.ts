import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'El email es requerido',
      })
      .email('Formato de email inválido')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'La contraseña es requerida',
      })
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'El email es requerido',
      })
      .email('Formato de email inválido')
      .toLowerCase()
      .trim(),
    password: z
      .string({
        required_error: 'La contraseña es requerida',
      })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
      ),
    firstName: z
      .string({
        required_error: 'El nombre es requerido',
      })
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .trim(),
    lastName: z
      .string({
        required_error: 'El apellido es requerido',
      })
      .min(2, 'El apellido debe tener al menos 2 caracteres')
      .max(50, 'El apellido no puede exceder 50 caracteres')
      .trim(),
    organizationId: z
      .string()
      .optional(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({
        required_error: 'El refresh token es requerido',
      })
      .min(1, 'Refresh token inválido'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string({
        required_error: 'La contraseña actual es requerida',
      })
      .min(1),
    newPassword: z
      .string({
        required_error: 'La nueva contraseña es requerida',
      })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
      ),
    confirmPassword: z
      .string({
        required_error: 'La confirmación de contraseña es requerida',
      }),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }),
});

export const resetPasswordRequestSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'El email es requerido',
      })
      .email('Formato de email inválido')
      .toLowerCase()
      .trim(),
  }),
});

export const resetPasswordSchema = z.object({
  params: z.object({
    token: z.string({
      required_error: 'Token de reset es requerido',
    }),
  }),
  body: z.object({
    password: z
      .string({
        required_error: 'La nueva contraseña es requerida',
      })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'
      ),
    confirmPassword: z
      .string({
        required_error: 'La confirmación de contraseña es requerida',
      }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }),
});

// Types inferidos de los schemas
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];