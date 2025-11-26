"use server";

import { signIn as _signIn } from "~/lib/security";

export async function signIn(initDataRaw: string) {
  return await _signIn(initDataRaw);
}
