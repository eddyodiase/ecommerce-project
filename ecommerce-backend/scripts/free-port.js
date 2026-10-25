import net from 'node:net';
import { execFileSync } from 'node:child_process';

const PORT = Number(process.env.PORT ?? 3000);

function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();

    tester.once('error', () => resolve(true));
    tester.once('listening', () => {
      tester.close(() => resolve(false));
    });

    tester.listen(port, '127.0.0.1');
  });
}

function getListeningPid(port) {
  try {
    const output = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Where-Object { $_.State -eq 'Listen' } | Select-Object -ExpandProperty OwningProcess -Unique`,
      ],
      { encoding: 'utf8' }
    );

    const pid = output
      .split(/\r?\n/)
      .map((value) => value.trim())
      .find((value) => /^\d+$/.test(value));

    return pid ? Number(pid) : null;
  } catch {
    return null;
  }
}

function freePort(port) {
  const pid = getListeningPid(port);

  if (!pid) {
    console.warn(
      `Port ${port} is already in use, but no listening process could be identified automatically. Please stop it manually.`
    );
    return;
  }

  console.log(`Detected stale process on port ${port} (PID ${pid}). Releasing it...`);
  execFileSync('taskkill', ['/PID', String(pid), '/F'], {
    stdio: 'inherit',
  });
  console.log(`Port ${port} is now free.`);
}

async function main() {
  if (!(await isPortInUse(PORT))) {
    return;
  }

  freePort(PORT);
}

main().catch((error) => {
  console.error('Unable to free port automatically:', error.message);
  process.exitCode = 1;
});

