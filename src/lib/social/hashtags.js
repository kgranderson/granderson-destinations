/**
 * Per-market hashtag strategy. Mix of:
 *  - high-volume umbrella tags (broad reach, lower conversion)
 *  - mid-volume location tags (best discovery)
 *  - niche aesthetic tags (best conversion)
 *  - branded
 *
 * Cap each post at 6 tags — Instagram's algorithm penalizes
 * tag-spam in 2025+ and editorial brands hold to 4–8.
 */
export const HASHTAG_BANK = {
  'palm-springs': {
    location: ['#palmsprings', '#palmspringslife', '#greaterpalmsprings', '#coachellavalley'],
    aesthetic: ['#midcenturymodern', '#midcenturyhome', '#desertstyle', '#palmspringsdesign', '#poolsidevibes'],
    seasonal: ['#coachella', '#stagecoach', '#modernismweek', '#indianwellstennis', '#bnpparibasopen'],
    branded: ['#grandersondestinations', '#destinationgh', '#casadelsolps'],
  },
  'san-miguel-de-allende': {
    location: ['#sanmiguel', '#sanmigueldeallende', '#sma', '#guanajuato', '#mexicotravel'],
    aesthetic: ['#colonialmexico', '#talavera', '#mexicaninteriors', '#parroquia', '#cobblestonestreets'],
    seasonal: ['#diadelmuertos', '#festivalcervantino', '#smajazzfest'],
    branded: ['#grandersondestinations', '#destinationgh', '#casatalavera'],
  },
};

/**
 * Returns a curated 5-6 hashtag set for a given market + theme.
 * Theme is one of: pool, kitchen, exterior, golden-hour, event,
 * neighborhood, lifestyle (free-form for the caption gen).
 */
export function buildHashtags({ market, theme = 'lifestyle', limit = 6 }) {
  const bank = HASHTAG_BANK[market];
  if (!bank) return [];
  const tags = [
    bank.location[0],                                              // anchor city
    bank.location[1],                                              // city secondary
    bank.aesthetic[Math.floor(Math.random() * bank.aesthetic.length)],
    ...(theme === 'event' ? [bank.seasonal[0]] : [bank.aesthetic[1]]),
    bank.branded[0],
    bank.branded[2] || bank.branded[1],
  ];
  // Dedup + cap
  return Array.from(new Set(tags)).filter(Boolean).slice(0, limit);
}
