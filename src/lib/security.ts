import {
  isAuthDateInvalidError,
  isExpiredError,
  isSignatureInvalidError,
  isSignatureMissingError,
  isValid,
  parse,
} from "@telegram-apps/init-data-node";
import { cookies } from "next/headers";
import { env } from "~/env";

export const COOKIE_NAME = "tg-init-data";

function authenticate(initDataRaw: string) {
  const apiToken = env.TG_API_TOKEN;

  // For web environment or when init data is empty, handle gracefully
  if (!initDataRaw || initDataRaw === "") {
    console.log("Init data is empty");
    return {
      isAuthorized: false,
      initData: null,
    } as const;
  }

  // Check if it has the hash parameter
  if (!initDataRaw.includes("hash=")) {
    console.log("Hash parameter is missing");
    return {
      isAuthorized: false,
      initData: null,
    } as const;
  }

  try {
    // Use isValid for cleaner code
    const isValidInitData = isValid(initDataRaw, apiToken);

    if (isValidInitData) {
      const initData = parse(initDataRaw);
      return {
        isAuthorized: true,
        initData,
      } as const;
    } else {
      console.log("Init data is invalid");
      return {
        isAuthorized: false,
        initData: null,
      } as const;
    }
  } catch (e) {
    if (isSignatureInvalidError(e)) {
      console.log("Signature or hash is invalid");
    } else if (isSignatureMissingError(e)) {
      console.log("Hash parameter is missing");
    } else if (isAuthDateInvalidError(e)) {
      console.log("Auth date is invalid");
    } else if (isExpiredError(e)) {
      console.log("Init data is expired");
    } else {
      console.log("Unknown error", e);
    }
    return {
      isAuthorized: false,
      initData: null,
    } as const;
  }
}

export async function signIn(initDataRaw: string) {
  const result = authenticate(initDataRaw);

  if (result.isAuthorized) {
    (await cookies()).set(COOKIE_NAME, initDataRaw);
  }

  return result;
}

export async function getAuth() {
  const initDataRaw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!initDataRaw) {
    return {
      isAuthorized: false,
      userData: null,
    } as const;
  }

  const { initData, isAuthorized } = authenticate(initDataRaw);

  const user = initData?.user;
  return {
    isAuthorized,
    userData: user
      ? {
          firstName: user.first_name,
          username: user.username,
        }
      : null,
  } as const;
}
