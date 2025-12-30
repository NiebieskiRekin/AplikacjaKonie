// import { ProcessEnv } from "../env";
// import { basicAuth } from "hono/basic-auth";
// import bcrypt from "bcrypt";

// export const adminAuthMiddleware = basicAuth({
//   verifyUser: async (username, password) => {
//     return (
//       username === "adam" &&
//       (await bcrypt.compare(password, ProcessEnv.ADMIN_PASSWORD_BCRYPT))
//     );
//   },
// });
