import { Router, Request, Response } from "express";
import { prisma } from "../index";

/** Routes for Google (and similar) sign-in. */
export const oauthRoutes = Router();

function publicUser(user: { id: string; email: string; name: string; role: string; passwordHash: string | null; emailVerified: boolean }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    hasPassword: Boolean(user.passwordHash),
    emailVerified: user.emailVerified,
  };
}

/** Find or create a user from a verified Google email and name. */
oauthRoutes.post("/", async (req: Request, res: Response) => {
  const { email, name, avatar, role } = req.body;

  if (!email) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const displayName =
    typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : email.split("@")[0];
  const requestedRole = role === "SELLER" ? "SELLER" : "BUYER";

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (user.suspendedAt) {
      res.status(403).json({ error: "החשבון הושעה" });
      return;
    }
    if (!user.avatar && avatar) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
    }
    res.json(publicUser(user));
    return;
  }

  user = await prisma.user.create({
    data: {
      name: displayName,
      email,
      avatar: avatar || null,
      role: requestedRole,
      emailVerified: true,
    },
  });

  res.json(publicUser(user));
});
