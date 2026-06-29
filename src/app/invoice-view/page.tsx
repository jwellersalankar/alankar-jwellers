'use-client'
import { GSTInvoicePDF } from '@/src/components/ui/GSTInvoicePDF'
import React from 'react'
import { InvoiceData } from '../billing/page'
import { PDFViewer } from '@react-pdf/renderer'

function Invoice() {
    const data : InvoiceData = {
        invoiceNo: '',
        date: '',
        customer: null,
        items: []
    }
  return (
    <div>
        Page
    </div>
  )
}

export default Invoice