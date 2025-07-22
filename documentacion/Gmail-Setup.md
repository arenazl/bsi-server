### Paso 2: Generar App Password
**¡Perfecto! Ya tienes 2FA habilitado. Ahora genera la App Password:**

1. **Usa este link directo:** 🔗 [App Passwords](https://myaccount.google.com/apppasswords)

2. **O navega manualmente:**
   - Ve a [Google Account Seguridad](https://myaccount.google.com/security)
   - Busca la sección **"Contraseñas de aplicaciones"** (debería aparecer ahora)
   - Haz click en "Contraseñas de aplicaciones"

3. **Crear la contraseña:**
   - Selecciona "Aplicación: **Correo**"
   - Selecciona "Dispositivo: **Otro (nombre personalizado)**"
   - Escribe "**BSI Server**"
   - Haz click en "Generar"

4. **¡IMPORTANTE!** Copia la contraseña de 16 caracteres que aparece:
   ```
   Formato: xxxx xxxx xxxx xxxx
   Ejemplo: abcd efgh ijkl mnop
   ```

### ⚠️ NOTA: La contraseña solo se muestra UNA VEZ
Guárdala inmediatamente en tu archivo `.env`

### Paso 3: Configurar variables de entorno
Actualiza tu archivo `.env`:

```env
EMAIL_USER=arenazl@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # ← App Password de 16 caracteres
```

### Paso 4: Verificar configuración
La configuración en `keys.ts` ya está preparada para usar las variables de entorno:

```typescript
emailConfig: {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,     // ← desde .env
    pass: process.env.EMAIL_PASSWORD  // ← App Password desde .env
  }
}
```

## Configuración alternativa (Outlook)

Si prefieres usar Outlook en lugar de Gmail:

```typescript
emailConfig: {
  host: 'smtp-mail.outlook.com',
  port: 587,
  secure: false,
  auth: {
    user: 'tu-email@outlook.com',
    pass: 'tu-contraseña-normal'  // Outlook permite contraseñas normales
  }
}
```

## Verificar que funcione
Una vez configurada la App Password, el sistema enviará emails automáticamente cuando ocurran errores.
