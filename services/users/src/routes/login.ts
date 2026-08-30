import { Router, Request, Response } from "express";
import { compare } from "bcryptjs";
import { prisma } from "../index";

/** Routes for email-and-password login. */
export const loginRoutes = Router();

/** Check email and password and return the user if they match. */
loginRoutes.post("/", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (!user.passwordHash) {
    res.status(401).json({ error: "This account uses Google sign-in" });
    return;
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});
