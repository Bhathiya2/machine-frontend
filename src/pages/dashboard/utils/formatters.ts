export function warrantyStatus(installDate: string) {
  const install = new Date(installDate)
  const expires = new Date(install)
  expires.setFullYear(expires.getFullYear() + 1)
  const now = new Date()
  const active = now < expires
  return {
    active,
    label: active ? 'Active' : 'Expired',
    expires: expires.toISOString().split('T')[0],
  }
}

export function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function fmtCurrency(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}
