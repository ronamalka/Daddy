import { Router, Request, Response } from "express";
import { prisma } from "../index";

export const oauthRoutes = Router();

oauthRoutes.post("/", async (req: Request, res: Response) => {
  const { email, name, avatar } = req.body;

  if (!email || !name) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    if (!user.avatar && avatar) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
    }
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    return;
  }

  user = await prisma.user.create({
    data: {
      name,
      email,
      avatar: avatar || null,
      role: "BUYER",
    },
  });

  res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});
