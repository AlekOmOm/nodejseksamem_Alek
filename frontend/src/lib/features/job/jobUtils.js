import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export function formatDuration(startedAt, finishedAt = null) {
  if (!startedAt) return null;

  const start = dayjs(startedAt);
  const end = finishedAt ? dayjs(finishedAt) : dayjs();
  const diff = end.diff(start);

  return dayjs.duration(diff).humanize();
}

export function formatDurationPrecise(startedAt, finishedAt = null) {
  if (!startedAt) return null;

  const start = dayjs(startedAt);
  const end = finishedAt ? dayjs(finishedAt) : dayjs();
  const diff = dayjs.duration(end.diff(start));

  const hours = Math.floor(diff.asHours());
  const minutes = diff.minutes();
  const seconds = diff.seconds();

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return "Unknown";

  return dayjs(timestamp).fromNow();
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
