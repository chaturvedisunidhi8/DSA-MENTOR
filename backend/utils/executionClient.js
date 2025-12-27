class ExecutionConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ExecutionConfigError";
    this.status = 503;
  }
}

class ExecutionServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "ExecutionServiceError";
    this.status = status;
  }
}

const languageMap = {
  javascript: { piston: { language: "javascript", version: "18.15.0" }, judge0: { id: 63 } },
  python: { piston: { language: "python", version: "3.10.0" }, judge0: { id: 71 } },
  java: { piston: { language: "java", version: "17.0.7" }, judge0: { id: 62 } },
  cpp: { piston: { language: "cpp", version: "17" }, judge0: { id: 54 } },
};

const toTrimmed = (value = "") => value.trim();
const stripTrailingSlash = (url) => (url || "").replace(/\/$/, "");

const getRuntimeConfig = (language) => {
  const normalized = (language || "").toLowerCase();
  const mapping = languageMap[normalized];
  if (!mapping) {
    throw new ExecutionConfigError(`Language '${language}' is not supported by the executor.`);
  }
  return { normalized, mapping };
};

const callPiston = async ({ baseUrl, apiKey, timeoutMs, language, code, stdin, mapping }) => {
  const url = `${stripTrailingSlash(baseUrl)}/api/v2/execute`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({
        language: mapping.piston.language,
        version: mapping.piston.version,
        files: [{ content: code }],
        stdin,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ExecutionServiceError(
        `Execution service responded with status ${response.status}: ${text}`,
        response.status
      );
    }

    const result = await response.json();
    return {
      stdout: result.run?.stdout || "",
      stderr: result.run?.stderr || "",
      timeMs: result.run?.time != null ? Math.round(result.run.time * 1000) : null,
      exitCode: result.run?.code ?? null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ExecutionServiceError("Execution timed out", 504);
    }
    if (error instanceof ExecutionServiceError) {
      throw error;
    }
    throw new ExecutionServiceError(error.message || "Execution failed");
  } finally {
    clearTimeout(timeout);
  }
};

const callJudge0 = async ({ baseUrl, apiKey, timeoutMs, language, code, stdin, mapping }) => {
  const url = `${stripTrailingSlash(baseUrl)}/submissions?base64_encoded=true&wait=true`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey ? { "X-Api-Key": apiKey } : {}),
      },
      body: JSON.stringify({
        language_id: mapping.judge0.id,
        source_code: Buffer.from(code).toString("base64"),
        stdin: Buffer.from(stdin || "").toString("base64"),
        redirect_stderr_to_stdout: true,
        cpu_time_limit: 4,
        memory_limit: 512000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new ExecutionServiceError(
        `Execution service responded with status ${response.status}: ${text}`,
        response.status
      );
    }

    const body = await response.json();
    return {
      stdout: body.stdout ? Buffer.from(body.stdout, "base64").toString() : "",
      stderr: body.stderr
        ? Buffer.from(body.stderr, "base64").toString()
        : body.compile_output
        ? Buffer.from(body.compile_output, "base64").toString()
        : "",
      timeMs: body.time != null ? Math.round(Number(body.time) * 1000) : null,
      exitCode: body.status?.id ?? null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ExecutionServiceError("Execution timed out", 504);
    }
    if (error instanceof ExecutionServiceError) {
      throw error;
    }
    throw new ExecutionServiceError(error.message || "Execution failed");
  } finally {
    clearTimeout(timeout);
  }
};

const executeSingle = async ({ language, code, stdin }) => {
  const baseUrl = process.env.EXECUTOR_BASE_URL;
  if (!baseUrl) {
    throw new ExecutionConfigError("Execution engine not configured. Set EXECUTOR_BASE_URL.");
  }

  const apiKey = process.env.EXECUTOR_API_KEY;
  const provider = (process.env.EXECUTOR_PROVIDER || "piston").toLowerCase();
  const timeoutMs = Number(process.env.EXECUTOR_TIMEOUT_MS || 8000);
  const { mapping, normalized } = getRuntimeConfig(language);

  if (provider === "judge0") {
    return callJudge0({ baseUrl, apiKey, timeoutMs, language: normalized, code, stdin, mapping });
  }

  return callPiston({ baseUrl, apiKey, timeoutMs, language: normalized, code, stdin, mapping });
};

const runTestCases = async ({ code, language, testCases }) => {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new ExecutionConfigError("No test cases configured for this problem.");
  }

  const results = [];
  let passedCount = 0;

  for (let idx = 0; idx < testCases.length; idx += 1) {
    const test = testCases[idx];
    const execution = await executeSingle({ language, code, stdin: test.input });
    const stdout = toTrimmed(execution.stdout);
    const expected = toTrimmed(test.output);
    const passed = stdout === expected;

    if (passed) {
      passedCount += 1;
    }

    results.push({
      index: idx,
      isHidden: Boolean(test.isHidden),
      input: test.input,
      expectedOutput: test.output,
      stdout,
      stderr: execution.stderr,
      timeMs: execution.timeMs,
      exitCode: execution.exitCode,
      passed,
    });
  }

  return {
    passedCount,
    totalTests: testCases.length,
    results,
  };
};

module.exports = {
  runTestCases,
  ExecutionConfigError,
  ExecutionServiceError,
};
