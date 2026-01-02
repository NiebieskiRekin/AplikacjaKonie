import nodemailer from "nodemailer";
import { ProcessEnv } from "../env";

export const transporter = nodemailer.createTransport({
  host: ProcessEnv.EMAIL_HOST,
  port: ProcessEnv.EMAIL_PORT,
  service: ProcessEnv.EMAIL_SERVICE_TYPE,
  auth: {
    user: ProcessEnv.EMAIL_USER,
    pass: ProcessEnv.EMAIL_PASS,
  },
});
