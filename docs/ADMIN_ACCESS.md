# Admin Access in Traveloop

By design, the Traveloop initial database seed does not contain a hardcoded administrator account. This prevents an obvious security vulnerability (shipping with a known default admin).

All newly registered users are created with the default role of `"user"`.

## How to Promote a User to Admin

To grant a user access to the Admin Dashboard (and any other `requireAdmin` protected routes), you must manually promote them via the database.

1. **Find your user record in the database.**
   You can use Prisma Studio to easily browse the database:
   ```bash
   npm run db:studio
   ```

2. **Update the role.**
   Locate your user account in the `User` table.
   Change the `role` column from `"user"` to `"admin"`.
   Save the changes.

3. **Log back in.**
   Because the `role` is embedded in the JSON Web Token (JWT) at login, you will need to log out and log back into the application for the new `"admin"` role to be included in your token.

Once logged back in, navigating to the Admin Dashboard will show you the real system statistics instead of the "Access Denied" message.
