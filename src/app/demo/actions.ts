"use server";

import { getAuth } from "~/lib/security";

export async function demoAction() {
  "use server";

  const { isAuthorized, userData } = await getAuth();

  if (!isAuthorized) {
    return {
      message: "Not authorized",
    };
  }

  return {
    message: `Hello, ${userData?.username}!`,
  };
}
