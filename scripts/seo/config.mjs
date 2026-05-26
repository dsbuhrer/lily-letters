let siteUrl = 'https://thelilyletters.co';

export function setSiteUrl(url) {
  siteUrl = (url || siteUrl).replace(/\/$/, '');
}

export function getSiteUrl() {
  return siteUrl;
}
