const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PREFIXED_ID_RE = /^(evt|rsvp|usr|med)_[0-9a-f-]{36}$/i;

export function isValidEntityId(value: string) {
  return UUID_RE.test(value) || PREFIXED_ID_RE.test(value);
}
