import { Badge } from "../Components/lib/badge";

export function getAllBadgesWithProgress(user) {
  const unlocked = new Set(user.badge_terkumpul || []);
  const updatedBadgeList = [];

  Badge.forEach(b => {
    let progress = 0;
    if (b.kategori === "transaksi") progress = user.transaksi;
    if (b.kategori === "ajakan") progress = user.ajakan || 0;
    if (b.kategori === "sampah") progress = user.sampah_terkumpul || 0;

    const hasMetTarget = progress >= b.target;
    const isUnlocked = unlocked.has(b.kode_badge) || hasMetTarget;

    // Hybrid logic: auto-add badge to terkumpul if met target but not yet listed
    if (hasMetTarget && !unlocked.has(b.kode_badge)) {
      unlocked.add(b.kode_badge);
      // Optional: log or trigger reward logic here
    }

    updatedBadgeList.push({
      ...b,
      progress,
      isUnlocked,
    });
  });

  return updatedBadgeList;
}



export function getUnlockedBadges(user) {
  const unlocked = user.badge_terkumpul || [];

  return Badge.filter(b => unlocked.includes(b.kode_badge)).map(b => {
    let progress = 0;
    if (b.kategori === "transaksi") progress = user.transaksi;
    if (b.kategori === "ajakan") progress = user.ajakan || 0;

    return {
      ...b,
      progress,
    };
  });
}

export function getNextBadge(user) {
  const unlocked = user.badge_terkumpul || [];
  const remaining = Badge.filter(b => !unlocked.includes(b.kode_badge));
  const sorted = remaining.sort((a, b) => a.target - b.target);
  const next = sorted[0];

  if (!next) return null;

  let progress = 0;
  if (next.kategori === "transaksi") progress = user.transaksi;
  if (next.kategori === "ajakan") progress = user.ajakan || 0;

  return {
    ...next,
    progress,
  };
}

export function getBadgeProgressBar(badge) {
  const progress = badge.progress || 0;
  const target = badge.target || 1;
  return Math.min((progress / target) * 100, 100);
}

export function getBadgeStatus(badge) {
  return badge.progress >= badge.target ? "complete" : "in_progress";
}
