import { Elysia, t } from "elysia";
import { loginSchema, registerSchema } from "@campbridge/shared";
import { register, login, me } from "../services/auth.service";
import { cookieValue, verifySession } from "../utils/session";

export const authRoute = new Elysia({ prefix: "/api/auth" })
  .post(
    "/register",
    async ({ body }: any) => register(registerSchema.parse(body)),
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
        role: t.Optional(t.Union([t.Literal("volunteer"), t.Literal("team_lead")])),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }: any) => {
      const input = loginSchema.parse(body);
      const result = await login(input.email, input.password);
      set.headers["Set-Cookie"] = `campbridge_session=${encodeURIComponent(result.session)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`;
      return { user: result.user };
    },
    { body: t.Object({ email: t.String(), password: t.String() }) }
  )
  .post("/logout", async ({ set }: any) => {
    set.headers["Set-Cookie"] = "campbridge_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";
    return { ok: true };
  })
  .get("/me", async ({ cookie }: any) => {
    const userId = verifySession(cookieValue(cookie?.campbridge_session));
    return { user: await me(userId ?? undefined) };
  });
