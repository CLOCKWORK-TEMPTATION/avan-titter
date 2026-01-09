/**
 * @file This file centralizes all agent configurations, making them easily accessible throughout the application.
 * It imports individual agent configurations and exports them as a single, frozen array to prevent modifications at runtime.
 */

import type { AIAgentConfig } from "../types/types";

/**
 * @const {ReadonlyArray<AgentConfig>} AGENT_CONFIGS
 * @description A frozen array of all agent configurations, categorized for clarity.
 * This structure ensures that the configurations cannot be altered at runtime, providing stability.
 */
export const AGENT_CONFIGS: ReadonlyArray<AIAgentConfig> = Object.freeze([]);
