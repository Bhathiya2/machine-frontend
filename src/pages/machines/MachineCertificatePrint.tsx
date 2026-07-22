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
        .cert-table th, .cert-table td { border: 1px solid #000; padding: 4px 8px; vertical-align: middle; }
        .bg-gray-custom { background-color: #d9d9d9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .bg-red-custom { background-color: #a84242 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      ` }} />

      <div className="mx-auto max-w-4xl border-2 border-black p-1 m-8 mt-12">
        <table className="cert-table border-2 border-black">
          <tbody>
            <tr>
              <td colSpan={2} className="bg-gray-custom text-center text-xl font-bold py-2 border-b-2 border-black">
                Installation Certificate
              </td>
            </tr>
            <tr>
              <td className="bg-red-custom w-[40%] text-center p-4">
                {/* GBOS Logo Placeholder */}
                <h1 className="text-[3rem] font-bold tracking-widest lowercase m-0 text-white leading-none">gbos</h1>
              </td>
              <td className="w-[60%] p-0">
                <table className="w-full h-full border-collapse">
                  <tbody>
                    <tr>
                      <td className="border-b border-r border-black px-2 py-1 text-xs w-[30%]">Reference: {machine.cert_reference || ''}</td>
                      <td className="border-b border-black px-2 py-1 text-xs w-[70%]">Calibration: {machine.cert_calibration || ''}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black px-2 py-1 text-xs">Date: {machine.sign_date || machine.installDate}</td>
                      <td className="border-b border-black px-2 py-1 text-xs">warranty: {machine.cert_warranty || '1 Year'}</td>
                    </tr>
                    <tr>
                      <td className="border-b border-r border-black px-2 py-1 text-xs">Technician: {machine.installedBy}</td>
                      <td className="border-b border-black px-2 py-1 text-xs">Contract: <span className="text-blue-600 underline">{machine.cert_contract || 'gbos@gboslaser.com'}</span></td>
                    </tr>
                    <tr><td className="border-b border-r border-black p-2 h-6"></td><td className="border-b border-black p-2"></td></tr>
                    <tr><td className="border-r border-black p-2 h-6"></td><td className="p-2"></td></tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* CLIENT DETAILS */}
            <tr>
              <td colSpan={2} className="bg-gray-custom font-bold text-center border-y-2 border-black tracking-wider uppercase text-[13px] py-1">
                CLIENT DETAILS
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs font-semibold text-right border-r border-black w-[35%]">Name:</td>
              <td className="px-2 py-1 text-xs border-black flex items-center justify-between w-[65%]">
                <div className="w-1/2">{machine.client_name || machine.name || 'NEO Denim'}</div>
                <div className="w-1/2 flex border-l border-black pl-2">
                  <div className="font-semibold mr-2">Customer code:</div>
                  <div>{machine.client_customer_code || ''}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs font-semibold text-right border-r border-black w-[35%]">Contact Person:</td>
              <td className="px-2 py-1 text-xs border-black flex items-center justify-between w-[65%]">
                <div className="w-1/2">{machine.client_contact_person || ''}</div>
                <div className="w-1/2 flex border-l border-black pl-2">
                  <div className="font-semibold mr-2">Job title:</div>
                  <div>{machine.client_job_title || ''}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs font-semibold text-right border-r border-black w-[35%]">Phone Number:</td>
              <td className="px-2 py-1 text-xs border-black flex items-center justify-between w-[65%]">
                <div className="w-1/2">{machine.client_phone_number || ''}</div>
                <div className="w-1/2 flex border-l border-black pl-2">
                  <div className="font-semibold mr-2">Email:</div>
                  <div>{machine.client_email || ''}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs font-semibold text-right border-r border-black uppercase tracking-wider w-[35%]">SYSTEM:</td>
              <td className="px-2 py-1 text-xs border-black flex items-center justify-between w-[65%]">
                <div className="w-1/2 font-semibold">{machine.client_system || 'Laser marking'}</div>
                <div className="w-1/2 flex border-l border-black pl-2">
                  <div className="font-semibold mr-2">Installation date:</div>
                  <div>{machine.installDate || ''}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs font-semibold text-right border-r border-black w-[35%]">Model:</td>
              <td className="px-2 py-1 text-xs border-black flex items-center justify-between w-[65%]">
                <div className="w-1/2 font-semibold">{machine.model || 'XXP5-600Compact'}</div>
                <div className="w-1/2 flex border-l border-black pl-2">
                  <div className="font-semibold mr-2">Expired date:</div>
                  <div>{machine.client_expired_date || ''}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="px-2 py-1 text-xs font-semibold text-right border-r border-black w-[35%]">Serial Number:</td>
              <td className="px-2 py-1 text-xs border-black flex items-center justify-between w-[65%]">
                <div className="w-1/2 font-semibold">{machine.id || 'D2509292618'}</div>
                <div className="w-1/2 flex border-l border-black pl-2">
                  <div className="font-semibold mr-2">Date of manufacture:</div>
                  <div>{machine.client_date_of_manufacture || ''}</div>
                </div>
              </td>
            </tr>

            {/* Technical Information */}
            <tr>
              <td colSpan={2} className="bg-gray-custom font-bold text-center border-y-2 border-black tracking-wider text-[13px] py-1">
                Technical Information
              </td>
            </tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black w-[45%]">Freq - {machine.tech_freq || '50HZ'}</td><td className="px-2 py-1 text-xs w-[55%] border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black">Voltage - {machine.tech_voltage || '400 Volt'}</td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black">Amp - {machine.tech_amp || '20A'}</td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black">Total MC Power - {machine.tech_total_mc_power || '7.8 Kw'}</td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black">UPS - {machine.tech_ups || '15 kva online'}</td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black">Chiller Cooling system- {machine.tech_chiller_cooling_system || ''}</td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black">Chiller Absorbed Power- {machine.tech_chiller_absorbed_power || ''}</td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black">Smoke Extractor - {machine.tech_smoke_extractor || ''}</td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black">Room temp 25*c (requirement 23-25*c) {machine.tech_room_temp || ''}</td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>
            <tr><td className="px-2 py-1 text-xs border-r border-black h-6"></td><td className="px-2 py-1 text-xs border-black border-r-0"></td></tr>

            {/* CUSTOMER SIGNATURE */}
            <tr>
              <td colSpan={2} className="border-t-2 border-black p-0">
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
