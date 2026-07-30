import { preferences } from '@vben/preferences'

const EXTERNAL_PATH_RE = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i

function normalizeAppPath(candidate?: null | string) {
  const fallbackPath = preferences.app.defaultHomePath

  if (!candidate) {
    return fallbackPath
  }

  const decodedPath = decodeURIComponent(candidate).trim()

  if (!decodedPath || decodedPath.startsWith('#') || EXTERNAL_PATH_RE.test(decodedPath)) {
    return fallbackPath
  }

  return decodedPath.startsWith('/') ? decodedPath : fallbackPath
}

export { normalizeAppPath }
