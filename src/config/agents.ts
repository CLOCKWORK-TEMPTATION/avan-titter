// src/config/agents.ts

/**
 * Defines the structure for a single agent's configuration.
 */
export interface AgentConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
  topK: number;
}

/**
 * Defines the structure for all agent configurations.
 */
export interface AgentsConfig {
  default: AgentConfig;
  [key: string]: AgentConfig;
}

/**
 * The agent configurations object.
 */
export const agentsConfig: AgentsConfig = {
  default: {
    model: 'gemini-2.5-pro',
    temperature: 0.7,
    maxOutputTokens: 22048,
    topP: 1,
    topK: 1,
  },
  creativeAgent: {
    model: 'gemini-2.5-pro',
    temperature: 0.9,
    maxOutputTokens: 40096,
    topP: 1,
    topK: 1,
  },
  analysisAgent: {
    model: 'gemini-2.5-pro',
    temperature: 0.5,
    maxOutputTokens: 22048,
    topP: 1,
    topK: 1,
  },
};