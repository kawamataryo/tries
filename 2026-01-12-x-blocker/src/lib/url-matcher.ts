// 制限対象のページパターン（X/Twitter全体）
// - ここを狭くすると、X内の遷移やログインフロー等で「対象外」になりやすく、
//   制御が不安定になるため、X/Twitter配下は基本すべて対象にする。
const RESTRICTED_PATTERNS = [/^https?:\/\/(twitter|x)\.com(\/|$)/];

// 除外対象のページパターン（タイマーが停止するページ）
const EXCLUDED_PATTERNS = [
  /^https?:\/\/(twitter|x)\.com\/compose/,           // 投稿画面
  /^https?:\/\/(twitter|x)\.com\/messages\/compose/, // DM画面
  /^https?:\/\/(twitter|x)\.com\/messages/,          // DM画面全般
];

/**
 * URLが制限対象ページかどうかを判定
 */
export function isRestrictedPage(url: string): boolean {
  return RESTRICTED_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * URLが除外対象ページかどうかを判定
 */
export function isExcludedPage(url: string): boolean {
  return EXCLUDED_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * URLがX/Twitterのページかどうかを判定
 */
export function isXPage(url: string): boolean {
  return /^https?:\/\/(twitter|x)\.com/.test(url);
}

/**
 * URLがタイマー対象ページかどうかを判定
 * 制限対象ページかつ除外対象ページでない場合にtrue
 */
export function isTimerTargetPage(url: string): boolean {
  return isRestrictedPage(url) && !isExcludedPage(url);
}
