import { redirect } from "react-router";

// https://www.youtube.com/watch?v=CcrgG5MjGOk
export function getToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    redirect("/login");
    throw new Error("Brak tokena. Zaloguj się.");
  }
  return token;
}
