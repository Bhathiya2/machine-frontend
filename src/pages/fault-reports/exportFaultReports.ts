import * as XLSX from 'xlsx'
import type { AppUser, FaultReport, Machine } from '@/pages/dashboard/types'

function formatDate(value: string): string {
  return value.includes('T') ? value.split('T')[0] : value
}

export function downloadFaultReportsExcel(
  reports: FaultReport[],
  machines: Machine[],
  users: AppUser[],
  filename = `fault-reports-${new Date().toISOString().slice(0, 10)}.xlsx`
) {
  const getMachineName = (id: string) => machines.find((m) => m.id === id)?.name ?? ''
  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? id

  const rows = reports.map((report) => ({
    'Report No': report.id,
    Machine: report.machineId,
    'Machine Name': getMachineName(report.machineId),
    Description: report.description,
    Severity: report.severity,
    Category: report.category,
    Status: report.status,
    'Reported By': getUserName(report.reportedBy),
    'Reported Date': formatDate(report.createdAt),
    'Work Order': report.convertedToWO ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(
    rows.length
      ? rows
      : [{
          'Report No': '',
          Machine: '',
          'Machine Name': '',
          Description: '',
          Severity: '',
          Category: '',
          Status: '',
          'Reported By': '',
          'Reported Date': '',
          'Work Order': '',
        }]
  )

  worksheet['!cols'] = [
    { wch: 12 },
    { wch: 12 },
    { wch: 24 },
    { wch: 48 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fault Reports')
  XLSX.writeFile(workbook, filename)
}
