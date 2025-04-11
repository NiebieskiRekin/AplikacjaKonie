export async function tryParseJson(response: Response): Promise<any | null> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (err) {
      console.warn("Nie udało się sparsować JSON-a:", err);
      return null;
    }
  }
  return null;
}
