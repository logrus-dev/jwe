export interface UrlParams {
  schema: string | null;
  key: string | null;
}

export function readUrlParams(): UrlParams {
  const params = new URLSearchParams(window.location.search);
  return {
    schema: params.get('schema'),
    key: params.get('key'),
  };
}
