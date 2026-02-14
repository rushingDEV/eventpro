import { auth } from "@/lib/auth";

export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}
