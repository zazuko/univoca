import slugify from 'slugify'

export function slugifyName(term) {
  return slugify(term.value, {
    lower: true,
    trim: true,
  })
}
