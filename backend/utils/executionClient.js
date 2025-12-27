/**
 * Local Code Execution Engine - Self-hosted sandbox
 * No external API dependencies - uses Node.js built-in modules
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
  javascript: { ext: '.js', cmd: 'node', timeout: 5000 },
  python: { ext: '.py', cmd: 'python3', timeout: 5000 },
  java: { ext: '.java', cmd: 'java', compileCmd: 'javac', timeout: 8000 },
  cpp: { ext: '.cpp', cmd: './a.out', compileCmd: 'g++', timeout: 8000 },
  c: { ext: '.c', cmd: './a.out', compileCmd: 'gcc', timeout: 8000 },
  csharp: { ext: '.cs', cmd: 'dotnet run', compileCmd: 'dotnet build', timeout: 10000 },
  ruby: { ext: '.rb', cmd: 'ruby', timeout: 5000 },
  go: { ext: '.go', cmd: 'go run', timeout: 8000 },
};

const toTrimmed = (value = "") => value.trim();

const getRuntimeConfig = (language) => {
  const normalized = (language || "").toLowerCase();
  const mapping = languageMap[normalized];
  if (!mapping) {
    throw new ExecutionConfigError(`Language '${language}' is not supported. Supported: ${Object.keys(languageMap).join(', ')}`);
  }
  return { normalized, mapping };
};

/**
 * Check if runtime is installed
 */
const checkRuntime = (command) => {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/**
 * Execute code locally with timeout and resource limits
 */
const executeSingle = async ({ language, code, stdin = '' }) => {
  const { mapping, normalized } = getRuntimeConfig(language);
  
  // Check if runtime is available
  if (!checkRuntime(mapping.cmd.split(' ')[0])) {
    throw new ExecutionConfigError(`${normalized} runtime not installed. Install ${mapping.cmd} to execute ${normalized} code.`);
  }
  
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsa-exec-'));
  const startTime = Date.now();
  
  try {
    let filePath, execCmd;
    
    switch (normalized) {
      case 'javascript':
        // Write JS file
        filePath = path.join(tempDir, `solution${mapping.ext}`);
        fs.writeFileSync(filePath, code);
        execCmd = `${mapping.cmd} ${filePath}`;
        break;
        
      case 'python':
        // Write Python file
        filePath = path.join(tempDir, `solution${mapping.ext}`);
        fs.writeFileSync(filePath, code);
        execCmd = `${mapping.cmd} ${filePath}`;
        break;
        
      case 'java':
        // Extract class name from code
        const classMatch = code.match(/public\s+class\s+(\w+)/);
        const className = classMatch ? classMatch[1] : 'Solution';
        filePath = path.join(tempDir, `${className}.java`);
        fs.writeFileSync(filePath, code);
        
        // Compile first
        try {
          execSync(`${mapping.compileCmd} ${filePath}`, {
            cwd: tempDir,
            timeout: mapping.timeout,
            stdio: 'pipe'
          });
        } catch (compileError) {
          return {
            stdout: '',
            stderr: compileError.stderr?.toString() || 'Compilation failed',
            timeMs: Date.now() - startTime,
            exitCode: 1
          };
        }
        execCmd = `cd ${tempDir} && ${mapping.cmd} ${className}`;
        break;
        
      case 'cpp':
        // Write C++ file
        filePath = path.join(tempDir, `solution${mapping.ext}`);
        fs.writeFileSync(filePath, code);
        
        // Compile first
        try {
          execSync(`${mapping.compileCmd} ${filePath} -o ${path.join(tempDir, 'a.out')}`, {
            timeout: mapping.timeout,
            stdio: 'pipe'
          });
        } catch (compileError) {
          return {
            stdout: '',
            stderr: compileError.stderr?.toString() || 'Compilation failed',
            timeMs: Date.now() - startTime,
            exitCode: 1
          };
        }
        execCmd = path.join(tempDir, 'a.out');
        break;
        
      case 'c':
        // Write C file
        filePath = path.join(tempDir, `solution${mapping.ext}`);
        fs.writeFileSync(filePath, code);
        
        // Compile first
        try {
          execSync(`${mapping.compileCmd} ${filePath} -o ${path.join(tempDir, 'a.out')}`, {
            timeout: mapping.timeout,
            stdio: 'pipe'
          });
        } catch (compileError) {
          return {
            stdout: '',
            stderr: compileError.stderr?.toString() || 'Compilation failed',
            timeMs: Date.now() - startTime,
            exitCode: 1
          };
        }
        execCmd = path.join(tempDir, 'a.out');
        break;
        
      case 'csharp':
        // Write C# file - requires a project structure
        const projectDir = path.join(tempDir, 'csproject');
        fs.mkdirSync(projectDir);
        
        // Create a minimal .csproj file
        const csprojContent = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0</TargetFramework>
  </PropertyGroup>
</Project>`;
        fs.writeFileSync(path.join(projectDir, 'Program.csproj'), csprojContent);
        
        // Write the C# code
        filePath = path.join(projectDir, 'Program.cs');
        fs.writeFileSync(filePath, code);
        
        // Build first
        try {
          execSync(`${mapping.compileCmd}`, {
            cwd: projectDir,
            timeout: mapping.timeout,
            stdio: 'pipe'
          });
        } catch (compileError) {
          return {
            stdout: '',
            stderr: compileError.stderr?.toString() || 'Build failed',
            timeMs: Date.now() - startTime,
            exitCode: 1
          };
        }
        execCmd = `cd ${projectDir} && ${mapping.cmd}`;
        break;
        
      case 'ruby':
        // Write Ruby file
        filePath = path.join(tempDir, `solution${mapping.ext}`);
        fs.writeFileSync(filePath, code);
        execCmd = `${mapping.cmd} ${filePath}`;
        break;
        
      case 'go':
        // Write Go file - requires proper module structure
        filePath = path.join(tempDir, `solution${mapping.ext}`);
        fs.writeFileSync(filePath, code);
        
        // Initialize go module
        try {
          execSync('go mod init solution', {
            cwd: tempDir,
            timeout: 3000,
            stdio: 'pipe'
          });
        } catch (modError) {
          // Module init failure is not critical, continue
        }
        
        execCmd = `cd ${tempDir} && ${mapping.cmd} solution.go`;
        break;
        
      default:
        throw new ExecutionConfigError(`Unsupported language: ${normalized}`);
    }
    
    // Execute with stdin
    const stdinPath = path.join(tempDir, 'input.txt');
    if (stdin) {
      fs.writeFileSync(stdinPath, stdin);
    }
    
    const result = execSync(execCmd, {
      input: stdin,
      timeout: mapping.timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB max output
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    return {
      stdout: result,
      stderr: '',
      timeMs: Date.now() - startTime,
      exitCode: 0
    };
    
  } catch (error) {
    // Handle execution errors
    if (error.killed || error.signal === 'SIGTERM') {
      throw new ExecutionServiceError('Execution timed out', 504);
    }
    
    return {
      stdout: error.stdout?.toString() || '',
      stderr: error.stderr?.toString() || error.message,
      timeMs: Date.now() - startTime,
      exitCode: error.status || 1
    };
    
  } finally {
    // Cleanup temp files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Failed to cleanup temp directory:', cleanupError);
    }
  }
};

/**
 * Run multiple test cases
 */
const runTestCases = async ({ code, language, testCases }) => {
  if (!Array.isArray(testCases) || testCases.length === 0) {
    throw new ExecutionConfigError("No test cases configured for this problem.");
  }

  const results = [];
  let passedCount = 0;

  for (let idx = 0; idx < testCases.length; idx += 1) {
    const test = testCases[idx];
    
    try {
      const execution = await executeSingle({ 
        language, 
        code, 
        stdin: test.input 
      });
      
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
    } catch (error) {
      // Handle per-test errors
      results.push({
        index: idx,
        isHidden: Boolean(test.isHidden),
        input: test.input,
        expectedOutput: test.output,
        stdout: '',
        stderr: error.message,
        timeMs: 0,
        exitCode: 1,
        passed: false,
      });
    }
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
