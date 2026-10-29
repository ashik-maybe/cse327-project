import { Elysia, t } from "elysia";
import cookie from "@elysiajs/cookie";
import { loginSchema, registerSchema } from "@campbridge/shared";
import { register, login, me } from "../services/auth.service";
import { verifySession } from "../utils/session";

export const authRoute = new Elysia({ prefix: "/api/auth" })
  .use(cookie())
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
    async ({ body, cookie }: any) => {
      const input = loginSchema.parse(body);
      return login(input.email, input.password, cookie);
    },
    { body: t.Object({ email: t.String(), password: t.String() }) }
  )
  .post("/logout", async ({ cookie }: any) => {
    cookie.set({ name: "campbridge_session", value: "", maxAge: 0, path: "/", httpOnly: true, sameSite: "lax" });
    return { ok: true };
  })
  .get("/me", async ({ cookie }: any) => {
    const userId = verifySession(cookie?.campbridge_session?.value);
    return { user: await me(userId ?? undefined) };
  });
