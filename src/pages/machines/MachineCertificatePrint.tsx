import React from 'react'
import type { Machine } from '@/pages/dashboard/types'

interface Props {
  machine: Machine
}

export const MachineCertificatePrint: React.FC<Props> = ({ machine }) => {
  return (
    <div className="print-only fixed inset-0 z-[9999] bg-white text-black p-8 text-sm font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          .print-only, .print-only * { visibility: visible !important; }
          .print-only { position: absolute; left: 0; top: 0; width: 100%; min-height: 100vh; background: white; margin: 0; padding: 0; }
          @page { size: A4 portrait; margin: 15mm; }
        }
        @media screen {
          .print-only { display: none !important; }
        }
        .cert-table { width: 100%; border-collapse: collapse; }
        .cert-table th, .cert-table td { border: 1px solid #000; padding: 4px 8px; vertical-align: top; }
        .bg-gray-custom { background-color: #d9d9d9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-red-custom { background-color: #a84242 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .label { font-weight: 600; }
      ` }} />

      <div className="mx-auto max-w-4xl border-2 border-black p-1 m-8 mt-12">
        <table className="cert-table border-2 border-black">
          <tbody>
            {/* HEADER */}
            <tr>
              <td colSpan={4} className="bg-gray-custom text-center text-xl font-bold py-2 border-b-2 border-black">
                Installation Certificate
              </td>
            </tr>
            <tr>
              <td className="bg-red-custom w-[40%] text-center p-4 align-middle" rowSpan={3}>
                <h1 className="text-[3rem] font-bold tracking-widest lowercase m-0 text-white leading-none">gbos</h1>
              </td>
              <td className="w-[30%] px-2 py-1 text-xs">Reference: {machine.cert_reference || ''}</td>
              <td colSpan={2} className="w-[30%] px-2 py-1 text-xs">Calibration: {machine.cert_calibration || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs">Date: {machine.sign_date || machine.installDate}</td>
              <td colSpan={2} className="px-2 py-1 text-xs">Warranty: {machine.cert_warranty || '1 Year'}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs">Technician: {machine.installedBy}</td>
              <td colSpan={2} className="px-2 py-1 text-xs">Contract: <span className="text-blue-600 underline">{machine.cert_contract || 'gbos@gboslaser.com'}</span></td>
            </tr>

            {/* CLIENT DETAILS */}
            <tr>
              <td colSpan={4} className="bg-gray-custom font-bold text-center border-y-2 border-black tracking-wider uppercase text-[13px] py-1">
                CLIENT DETAILS
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right w-[20%]">Name:</td>
              <td className="px-2 py-1 text-xs w-[30%]">{machine.client_name || machine.name || ''}</td>
              <td className="px-2 py-1 text-xs label text-right w-[20%]">Customer code:</td>
              <td className="px-2 py-1 text-xs w-[30%]">{machine.client_customer_code || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">Contact Person:</td>
              <td className="px-2 py-1 text-xs">{machine.client_contact_person || ''}</td>
              <td className="px-2 py-1 text-xs label text-right">Job title:</td>
              <td className="px-2 py-1 text-xs">{machine.client_job_title || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">Phone Number:</td>
              <td className="px-2 py-1 text-xs">{machine.client_phone_number || ''}</td>
              <td className="px-2 py-1 text-xs label text-right">Email:</td>
              <td className="px-2 py-1 text-xs">{machine.client_email || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right uppercase">SYSTEM:</td>
              <td className="px-2 py-1 text-xs font-semibold">{machine.client_system || 'Laser marking'}</td>
              <td className="px-2 py-1 text-xs label text-right">Installation date:</td>
              <td className="px-2 py-1 text-xs">{machine.installDate || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">Model:</td>
              <td className="px-2 py-1 text-xs font-semibold">{machine.model || ''}</td>
              <td className="px-2 py-1 text-xs label text-right">Expired date:</td>
              <td className="px-2 py-1 text-xs">{machine.client_expired_date || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">Serial Number:</td>
              <td className="px-2 py-1 text-xs font-semibold">{machine.id || ''}</td>
              <td className="px-2 py-1 text-xs label text-right">Date of manufacture:</td>
              <td className="px-2 py-1 text-xs">{machine.client_date_of_manufacture || ''}</td>
            </tr>

            {/* Technical Information */}
            <tr>
              <td colSpan={4} className="bg-gray-custom font-bold text-center border-y-2 border-black tracking-wider text-[13px] py-1">
                Technical Information
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">Frequency (Hz):</td>
              <td className="px-2 py-1 text-xs">{machine.tech_freq || ''}</td>
              <td className="px-2 py-1 text-xs label text-right">Voltage (V):</td>
              <td className="px-2 py-1 text-xs">{machine.tech_voltage || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">Amperage (A):</td>
              <td className="px-2 py-1 text-xs">{machine.tech_amp || ''}</td>
              <td className="px-2 py-1 text-xs label text-right">Total MC Power:</td>
              <td className="px-2 py-1 text-xs">{machine.tech_total_mc_power || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">UPS System:</td>
              <td className="px-2 py-1 text-xs">{machine.tech_ups || ''}</td>
              <td className="px-2 py-1 text-xs label text-right">Chiller Cooling System:</td>
              <td className="px-2 py-1 text-xs">{machine.tech_chiller_cooling_system || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">Chiller Absorbed Power:</td>
              <td className="px-2 py-1 text-xs">{machine.tech_chiller_absorbed_power || ''}</td>
              <td className="px-2 py-1 text-xs label text-right">Smoke Extractor:</td>
              <td className="px-2 py-1 text-xs">{machine.tech_smoke_extractor || ''}</td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs label text-right">Room Temp (°C):</td>
              <td className="px-2 py-1 text-xs">{machine.tech_room_temp || ''}</td>
              <td className="px-2 py-1 text-xs"></td>
              <td className="px-2 py-1 text-xs"></td>
            </tr>
            <tr>
              <td colSpan={4} className="h-4"></td>
            </tr>

            {/* CUSTOMER SIGNATURE */}
            <tr>
              <td colSpan={4} className="border-t-2 border-black p-0">
                <table className="w-full h-full border-collapse">
                  <tbody>
                    <tr>
                      <td colSpan={3} className="px-2 py-1 text-xs font-bold uppercase border-b border-black">CUSTOMER SIGNATURE</td>
                    </tr>
                    <tr>
                      <td className="w-[40%] px-4 pt-10 pb-4 align-bottom border-r border-black">
                        <div className="text-[10px] text-gray-700">SIGNATURE AND STAMP:</div>
                        <div className="mt-8 border-b border-black w-[90%]"></div>
                        <div className="text-[10px] text-gray-700 mt-2">SIGNED BY: {machine.sign_signed_by || ''}</div>
                      </td>
                      <td className="w-[30%] px-4 py-4 align-middle border-r border-black text-xs">
                        <div className="flex items-center justify-end mb-4">
                          <span className="mr-2 text-[10px]">COMPLETED</span>
                          <div className={`w-24 h-4 border border-black ${machine.sign_completed ? 'bg-black !important' : ''}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="mr-2 text-[10px]">INCOMPLETED</span>
                          <div className={`w-24 h-4 border border-black ${machine.sign_incompleted ? 'bg-black !important' : ''}`} style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}></div>
                        </div>
                      </td>
                      <td className="w-[30%] px-4 pt-10 pb-4 align-bottom">
                        <div className="text-[10px] text-gray-700">TECHNICIAN'S SIGNATURE:</div>
                        <div className="mt-8 border-b border-black w-[90%] text-sm mb-1">{machine.sign_technician_signature || ''}</div>
                        <div className="text-[10px] text-gray-700 mt-2">DATE: {machine.sign_date || ''}</div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}