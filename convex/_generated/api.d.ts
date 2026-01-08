/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_prompt from '../actions/prompt.js';
import type * as actions_ytProcessor from '../actions/ytProcessor.js';
import type * as blueprints from '../blueprints.js';
import type * as debug from '../debug.js';
import type * as services_GeminiService from '../services/GeminiService.js';
import type * as services_PlacesService from '../services/PlacesService.js';
import type * as services_TranscriptService from '../services/TranscriptService.js';
import type * as services_YoutubeService from '../services/YoutubeService.js';
import type * as users from '../users.js';
import type * as videos from '../videos.js';

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server';

declare const fullApi: ApiFromModules<{
  'actions/prompt': typeof actions_prompt;
  'actions/ytProcessor': typeof actions_ytProcessor;
  blueprints: typeof blueprints;
  debug: typeof debug;
  'services/GeminiService': typeof services_GeminiService;
  'services/PlacesService': typeof services_PlacesService;
  'services/TranscriptService': typeof services_TranscriptService;
  'services/YoutubeService': typeof services_YoutubeService;
  users: typeof users;
  videos: typeof videos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>;

export declare const components: {};
