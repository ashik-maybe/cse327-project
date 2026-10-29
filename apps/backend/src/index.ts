import { app } from "./app";
import { env } from "./env";

app.listen(env.port);
console.log(`CampBridge API listening on ${env.port}`);
