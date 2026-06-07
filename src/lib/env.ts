export function isProductionEnvironment() {
  return process.env.APP_ENV === "production";
}

export function isDevelopmentBypassAllowed() {
  return !isProductionEnvironment() && process.env.ALLOW_DEV_AUTH_BYPASS === "true";
}
