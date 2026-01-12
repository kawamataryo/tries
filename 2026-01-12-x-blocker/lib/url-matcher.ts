// 制限対象のページパターン（タイマーが動作するページ）
const RESTRICTED_PATTERNS = [
  /^https?:\/\/(twitter|x)\.com\/home/,           // タイムライン
  /^https?:\/\/(twitter|x)\.com\/search/,         // 検索
  /^https?:\/\/(twitter|x)\.com\/explore/,        // トレンド
  /^https?:\/\/(twitter|x)\.com\/notifications/, // 通知
];

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
