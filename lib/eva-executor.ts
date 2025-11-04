import { z } from 'zod';

// EVA Agent Configuration
const EVA_AGENT_API_URL = process.env.EVA_AGENT_API_URL || '';
const EVA_REQUEST_TIMEOUT_MS = 600_000; // 10 minutes
const RUN_EVENT_STREAM_DATA_PREFIX = 'data: ';
const AGENT_NAME = 'eva_agent';
const VISIT_URL_TOOL_NAME = 'visit_url_tool';

// Types
export type ExecuteRunParams = {
  runId: string;
  userId: string;
  taskInstruction: string;
  goal: string;
};

export class WebAgentRunError extends Error {
  public readonly runId: string;

  constructor(message: string, runId: string) {
    super(message);
    this.name = 'WebAgentRunError';
    this.runId = runId;
  }
}

// Zod schemas for validation
const eventRoleEnum = z.enum(['user', 'model']);

const functionCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  args: z.record(z.unknown()),
});

const functionResponseDataSchema = z.object({
  status: z.string().nullable().optional(),
  streaming_url: z.string().nullable().optional(),
  urls_visited: z.array(z.string()).nullable().optional(),
});

const functionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  response: functionResponseDataSchema.nullable().optional(),
});

const partSchema = z.object({
  text: z.string().nullable().optional(),
  functionCall: functionCallSchema.nullable().optional(),
  functionResponse: functionResponseSchema.nullable().optional(),
  codeExecutionResult: z.record(z.unknown()).nullable().optional(),
});

const contentSchema = z.object({
  role: eventRoleEnum,
  parts: z.array(partSchema).default([]),
});

const evaEventSchema = z.object({
  id: z.string(),
  author: z.string(),
  content: contentSchema.nullable().optional(),
  timestamp: z.number(),
  invocationId: z.string(),
  errorCode: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  partial: z.boolean().default(false),
});

export type EvaEvent = z.infer<typeof evaEventSchema>;

export type EvaRunResult =
  | { status: 'running'; streamingUrl: string | null; event: EvaEvent }
  | { status: 'completed'; resultJson: Record<string, unknown> | null }
  | { status: 'failed'; error: string };

// Helper functions
function isFinalResponse(event: EvaEvent): boolean {
  if (event.errorCode || event.errorMessage) {
    return true;
  }

  if (!event.content || !event.content.parts) {
    return false;
  }

  const parts = event.content.parts;
  const hasFunctionCallOrResponse = parts.some(
    (p) =>
      (p.functionCall !== null && p.functionCall !== undefined) ||
      (p.functionResponse !== null && p.functionResponse !== undefined),
  );

  const trailingCodeResult =
    parts.length > 0 &&
    parts[parts.length - 1].codeExecutionResult !== null &&
    parts[parts.length - 1].codeExecutionResult !== undefined;

  return !(hasFunctionCallOrResponse || event.partial || trailingCodeResult);
}

function extractResult(session: {
  state?: { final_response?: string };
}): Record<string, unknown> | null {
  const finalResponse = session.state?.final_response;
  if (!finalResponse) {
    return null;
  }

  try {
    const parsed = JSON.parse(finalResponse);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    // If parsed is an array or primitive, wrap it
    return { result: parsed };
  } catch {
    // Invalid JSON - wrap in {result: finalResponse} for compatibility with db schema
    return { result: finalResponse };
  }
}

function extractStreamingUrl(event: EvaEvent): string | null {
  if (!event.content || !event.content.parts) {
    return null;
  }

  for (const part of event.content.parts) {
    if (
      part.functionResponse &&
      part.functionResponse.name === VISIT_URL_TOOL_NAME &&
      part.functionResponse.response
    ) {
      const streamingUrl = part.functionResponse.response.streaming_url;
      if (streamingUrl) {
        return streamingUrl;
      }
    }
  }
  return null;
}

// Core EVA functions
async function createEvaSession(
  runId: string,
  userId: string,
  taskInstruction: string,
): Promise<void> {
  const sessionUrl = `${EVA_AGENT_API_URL}/apps/${AGENT_NAME}/users/${userId}/sessions/${runId}`;

  const response = await fetch(sessionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ task_instruction: taskInstruction }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create EVA session:', errorText);
    throw new WebAgentRunError(`Failed to create session: ${errorText}`, runId);
  }
}

async function getEvaSession(
  runId: string,
  userId: string,
): Promise<{ state?: { final_response?: string } }> {
  const sessionUrl = `${EVA_AGENT_API_URL}/apps/${AGENT_NAME}/users/${userId}/sessions/${runId}`;

  const response = await fetch(sessionUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to get EVA session:', errorText);
    throw new WebAgentRunError(`Failed to get session: ${errorText}`, runId);
  }

  return response.json();
}

// Main executor function
export async function* executeEvaRun(
  params: ExecuteRunParams,
): AsyncGenerator<EvaRunResult, void, unknown> {
  const { runId, userId, taskInstruction, goal } = params;

  try {
    console.log('Starting EVA run', runId);

    await createEvaSession(runId, userId, taskInstruction);
    console.log('Created EVA agent session for run', runId);

    const streamUrl = `${EVA_AGENT_API_URL}/run_sse`;
    const streamPayload = {
      app_name: AGENT_NAME,
      user_id: userId,
      session_id: runId,
      new_message: {
        role: 'user',
        parts: [{ text: goal }],
      },
    };

    // Using fetch for external EVA agent API
    const response = await fetch(streamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(streamPayload),
      signal: AbortSignal.timeout(EVA_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMsg = `Stream request failed: ${response.status}, ${errorText}`;
      console.error('Stream request failed:', response.status, errorText);
      yield {
        status: 'failed',
        error: errorMsg,
      };
      return;
    }

    if (!response.body) {
      const errorMsg = 'Response body is null';
      console.error(errorMsg);
      yield {
        status: 'failed',
        error: errorMsg,
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith(RUN_EVENT_STREAM_DATA_PREFIX)) {
            continue;
          }

          const eventDataStr = line.slice(RUN_EVENT_STREAM_DATA_PREFIX.length);

          let eventData: unknown;
          try {
            eventData = JSON.parse(eventDataStr);
          } catch {
            console.warn('Failed to parse SSE event:', line);
            continue;
          }

          // Validate event with Zod
          const parseResult = evaEventSchema.safeParse(eventData);
          if (!parseResult.success) {
            console.warn('Failed to validate event:', parseResult.error);
            continue;
          }

          const event = parseResult.data;
          const streamingUrl = extractStreamingUrl(event);

          yield {
            status: 'running',
            streamingUrl,
            event,
          };
        }
      }
    } finally {
      reader.releaseLock();
    }

    const evaSession = await getEvaSession(runId, userId);
    const resultJson = extractResult(evaSession);
    yield {
      status: 'completed',
      resultJson,
    };

    console.log('EVA run finished successfully', runId);
  } catch (error) {
    console.error('EVA execution failed for run', runId, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    yield {
      status: 'failed',
      error: errorMessage,
    };
  }
}

// Simplified interface for integration with existing code
export interface ExecutionResult {
  success: boolean;
  extractedData: Record<string, any>;
  screenshot?: string;
  error?: string;
  logs: string[];
  accuracy?: {
    matchedFields: number;
    totalFields: number;
    accuracyScore: number;
  };
}

export async function executeEvaWorkflow(
  siteUrl: string,
  projectInstructions: string,
  columnSchema: any[],
  groundTruthData: Record<string, any> | null,
  onStreamingUrl?: (url: string) => void,
): Promise<ExecutionResult> {
  const logs: string[] = [];
  const runId = `run_${Date.now()}`;
  const userId = 'mino_user';

  // Build the goal with site URL and instructions
  const goal = `Visit ${siteUrl} and ${projectInstructions}`;

  logs.push(`Starting EVA agent for ${siteUrl}`);
  logs.push(`Goal: ${goal}`);

  try {
    let finalResult: Record<string, unknown> | null = null;
    let lastStreamingUrl: string | null = null;

    for await (const result of executeEvaRun({
      runId,
      userId,
      taskInstruction: projectInstructions,
      goal,
    })) {
      if (result.status === 'running') {
        if (result.streamingUrl && result.streamingUrl !== lastStreamingUrl) {
          lastStreamingUrl = result.streamingUrl;
          logs.push(`Live browser stream: ${result.streamingUrl}`);
          // Properly await the callback to ensure streaming URL is saved
          if (onStreamingUrl) {
            try {
              await onStreamingUrl(result.streamingUrl);
              logs.push(`Streaming URL callback completed successfully`);
            } catch (error) {
              console.error('Error in streaming URL callback:', error);
              logs.push(`Warning: Failed to save streaming URL`);
            }
          }
        }

        // Log event details
        if (result.event.content?.parts) {
          for (const part of result.event.content.parts) {
            if (part.text) {
              logs.push(`EVA: ${part.text}`);
            }
            if (part.functionCall) {
              logs.push(`Tool call: ${part.functionCall.name}`);
            }
          }
        }
      } else if (result.status === 'completed') {
        finalResult = result.resultJson;
        logs.push('EVA agent completed successfully');
      } else if (result.status === 'failed') {
        logs.push(`EVA agent failed: ${result.error}`);
        return {
          success: false,
          extractedData: {},
          error: result.error,
          logs,
        };
      }
    }

    if (!finalResult) {
      return {
        success: false,
        extractedData: {},
        error: 'No result returned from EVA agent',
        logs,
      };
    }

    // Calculate accuracy if ground truth is provided
    let accuracy;
    if (groundTruthData) {
      const groundTruthKeys = Object.keys(groundTruthData);
      let matchedFields = 0;

      for (const key of groundTruthKeys) {
        const gtValue = String(groundTruthData[key]).toLowerCase().trim();
        const extractedValue = String(finalResult[key] || '').toLowerCase().trim();

        if (gtValue === extractedValue) {
          matchedFields++;
          logs.push(`✓ ${key}: Match (${gtValue})`);
        } else {
          logs.push(`✗ ${key}: Mismatch (expected: ${gtValue}, got: ${extractedValue})`);
        }
      }

      const totalFields = groundTruthKeys.length;
      const accuracyScore = totalFields > 0 ? (matchedFields / totalFields) * 100 : 0;

      accuracy = {
        matchedFields,
        totalFields,
        accuracyScore,
      };

      logs.push(`Accuracy: ${accuracyScore.toFixed(1)}% (${matchedFields}/${totalFields} fields)`);
    }

    return {
      success: true,
      extractedData: finalResult,
      logs,
      accuracy,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logs.push(`Error: ${errorMsg}`);

    return {
      success: false,
      extractedData: {},
      error: errorMsg,
      logs,
    };
  }
}
