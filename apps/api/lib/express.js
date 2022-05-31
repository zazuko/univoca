// TODO extracted from cube creator
export function isMultipart(req) {
  return req.get('content-type')?.includes('multipart/form-data')
}
