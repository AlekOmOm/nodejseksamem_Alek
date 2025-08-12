import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export function formatDuration(startedAt, finishedAt = null) {
  if (!startedAt) return null;
  // precise duration in seconds without dayjs
  const start = new Date(startedAt);
  const end = finishedAt ? new Date(finishedAt) : new Date();
  const diff = end.getTime() - start.getTime();
  const seconds = diff / 1000;
  return `${seconds.toFixed(2)}s`;
}

export function formatDurationPrecise(startedAt, finishedAt = null) {
  if (!startedAt) return null;
  // precise duration in seconds without dayjs
  const start = new Date(startedAt);
  const end = finishedAt ? new Date(finishedAt) : new Date();
  const diff = end.getTime() - start.getTime();

  return diff;
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return "Unknown";
  // precise duration in seconds without dayjs
  const start = new Date(timestamp);
  const end = new Date();
  const diff = end.getTime() - start.getTime();
  const seconds = diff / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(2)}s ago`;
  } else if (seconds < 3600) {
    return `${(seconds / 60).toFixed(0)}m ago`;
  } else {
    return `${(seconds / 3600).toFixed(0)}h ${((seconds % 3600) / 60).toFixed(
      0
    )}m ago`;
  }
}

export function formatExitCode(exitCode) {
  if (exitCode === undefined || exitCode === null) return null;
  return exitCode === 0 ? "Success (0)" : `Failed (${exitCode})`;
}

export function mapJobStatusToBadgeStatus(status) {
  switch (status) {
    case "completed":
      return "success";
    case "failed":
      return "error";
    case "running":
      return "loading";
    case "pending":
      return "pending";
    default:
      return "info";
  }
}

export function shouldShowFullCommand(command, commandName) {
  return command && commandName !== command;
}

export function isLongCommand(command, threshold = 50) {
  return command && command.length > threshold;
}
