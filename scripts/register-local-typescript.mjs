import { registerHooks } from "node:module";
registerHooks({ resolve(specifier,context,next) {
  const local = context.parentURL?.includes("/lib/") && specifier.startsWith("./") && !/\.[a-z]+$/i.test(specifier);
  return next(local ? `${specifier}.ts` : specifier,context);
} });
