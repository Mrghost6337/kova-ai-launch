/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as checkout from "../checkout.js";
import type * as food from "../food.js";
import type * as food101Dishes from "../food101Dishes.js";
import type * as foodCache from "../foodCache.js";
import type * as foodData from "../foodData.js";
import type * as foodProviders from "../foodProviders.js";
import type * as http from "../http.js";
import type * as plans from "../plans.js";
import type * as purchases from "../purchases.js";
import type * as users from "../users.js";
import type * as waitlist from "../waitlist.js";
import type * as waitlistEmail from "../waitlistEmail.js";
import type * as webhooks from "../webhooks.js";
import type * as webhooksNode from "../webhooksNode.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  checkout: typeof checkout;
  food: typeof food;
  food101Dishes: typeof food101Dishes;
  foodCache: typeof foodCache;
  foodData: typeof foodData;
  foodProviders: typeof foodProviders;
  http: typeof http;
  plans: typeof plans;
  purchases: typeof purchases;
  users: typeof users;
  waitlist: typeof waitlist;
  waitlistEmail: typeof waitlistEmail;
  webhooks: typeof webhooks;
  webhooksNode: typeof webhooksNode;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
