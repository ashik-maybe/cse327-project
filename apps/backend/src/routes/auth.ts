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
    async ({ body, setCookie }: any) => {
      const input = loginSchema.parse(body);
      return login(input.email, input.password, setCookie);
    },
    { body: t.Object({ email: t.String(), password: t.String() }) }
  )
  .post("/logout", async ({ removeCookie }: any) => {
    removeCookie("campbridge_session");
    return { ok: true };
  })
  .get("/me", async ({ cookie }: any) => {
    const userId = verifySession(cookie?.campbridge_session);
    return { user: await me(userId ?? undefined) };
  });
