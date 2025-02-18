// src/index.ts
import express, { Express, Request, Response } from "express";
import { PORT } from "./env";
import { db } from "./db"
import {konie} from "./db/schema"

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  db.select().from(konie).then((value) => {
    const r = JSON.stringify(value);
    res.send("Express + TypeScript Server "+ r);
    console.log('Promise resolved with value: ' + r);
  })
  .catch((error) => {
    res.send("Express + TypeScript Server+  db error");
    console.error('Promise rejected with error: ' + error);
  });
  
});

app.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});
