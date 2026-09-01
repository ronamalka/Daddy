export {
  REQUEST_TEASER_TAKE,
  REQUEST_TEASER_SELECT,
  mapRequestTeasers,
  requestTeaserWhere,
  toRequestTeaser,
  type RequestTeaser,
} from "../../services/shared/request-teaser";

/** Hebrew relative age for a teaser timestamp (`now` is injectable for tests). */
export function relativeTimeHe(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) {
    return "";
  }
  const minutes = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 60_000));
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "אתמול";
  return `לפני ${days} ימים`;
}
