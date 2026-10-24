import { Elysia, t } from "elysia";
import cookie from "@elysiajs/cookie";
import { register, login, me } from "../services/auth.service";

export const authRoute = new Elysia({ prefix: "/api/auth" })
  .use(cookie())
  .post("/register", async ({ body }: any) => {
    const res = await register(body);
    return res;
  }, { body: t.Object({ name: t.String(), email: t.String(), password: t.String(), role: t.Optional(t.String()) }) })
  .post("/login", async ({ body, cookie }: any) => {
    const res = await login(body.email, body.password, cookie);
    return res;
  }, { body: t.Object({ email: t.String(), password: t.String() }) })
  .post("/logout", async ({ cookie }: any) => {
    cookie.set({ name: "campbridge_session", value: "", maxAge: 0, path: "/" });
    return { ok: true };
  })
  .get("/me", async ({ cookie }: any) => {
    const val = cookie?.campbridge_session?.value;
    const user = await me(val);
    return { user };
  });
