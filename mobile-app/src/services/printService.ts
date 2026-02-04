import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface Ticket {
  id: string;
  repairNumber?: string;
  customerName?: string;
  contact?: string;
  clientId?: string;
  receivedBy?: string;
  imeiNo?: string;
  brand?: string;
  model?: string;
  serialNo?: string;
  softwareVersion?: string;
  warranty?: string;
  battery?: boolean;
  charger?: boolean;
  simCard?: boolean;
  memoryCard?: boolean;
  loanEquipment?: boolean;
  equipmentObs?: string;
  repairObs?: string;
  selectedServices?: string[];
  condition?: string;
  problem?: string;
  price?: number | string;
  budget?: number | string;
  createdAt?: string;
  serviceName?: string;
}

export interface CompanyInfo {
  shopName?: string;
  address?: string;
  companyEmail?: string;
  website?: string;
  contactNumber?: string;
}

function generateReceiptHTML(tickets: Ticket[], companyInfo?: CompanyInfo): string {
  const shopName = companyInfo?.shopName || 'Your Company Name';
  const address = companyInfo?.address || '';
  const email = companyInfo?.companyEmail || '';
  const website = companyInfo?.website || '';
  const phone = companyInfo?.contactNumber || '';

  let ticketsHTML = '';

  tickets.forEach((ticket, index) => {
    const repairNumber = ticket.repairNumber || ticket.id?.substring(0, 8) || 'N/A';
    const customerName = ticket.customerName || 'N/A';
    const contact = ticket.contact || 'N/A';
    const clientId = ticket.clientId || 'N/A';
    const receivedBy = ticket.receivedBy || 'N/A';
    const imeiNo = ticket.imeiNo || 'N/A';
    const brand = ticket.brand || 'N/A';
    const model = ticket.model || 'N/A';
    const serialNo = ticket.serialNo || 'N/A';
    const warranty = ticket.warranty || 'Without Warranty';
    const problem = ticket.problem || 'N/A';
    const condition = ticket.condition || 'N/A';
    const price = parseFloat(ticket.price as string) || 0;
    const budget = ticket.budget ? parseFloat(ticket.budget as string) : null;
    
    const services = ticket.selectedServices && ticket.selectedServices.length > 0
      ? ticket.selectedServices
      : ticket.serviceName ? [ticket.serviceName] : ['N/A'];

    const accessories = [];
    if (ticket.battery) accessories.push('Battery');
    if (ticket.charger) accessories.push('Charger');
    if (ticket.simCard) accessories.push('SIM Card');
    if (ticket.memoryCard) accessories.push('Memory Card');
    if (ticket.loanEquipment) accessories.push('Loan Equipment');

    const createdAt = ticket.createdAt 
      ? new Date(ticket.createdAt).toLocaleString()
      : new Date().toLocaleString();

    ticketsHTML += `
      <div style="page-break-after: ${index < tickets.length - 1 ? 'always' : 'auto'}; margin-bottom: 20px;">
        <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px;">
          <h1 style="margin: 0; font-size: 18px; font-weight: bold;">${shopName}</h1>
          ${address ? `<p style="margin: 5px 0; font-size: 12px;">${address}</p>` : ''}
          ${phone ? `<p style="margin: 5px 0; font-size: 12px;">Phone: ${phone}</p>` : ''}
          ${email ? `<p style="margin: 5px 0; font-size: 12px;">Email: ${email}</p>` : ''}
          ${website ? `<p style="margin: 5px 0; font-size: 12px;">Website: ${website}</p>` : ''}
        </div>

        <div style="margin-bottom: 15px;">
          <h2 style="font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Repair Ticket</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; font-weight: bold; width: 40%;">Repair Number:</td>
              <td style="padding: 5px;">${repairNumber}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold;">Date:</td>
              <td style="padding: 5px;">${createdAt}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Customer Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; font-weight: bold; width: 40%;">Name:</td>
              <td style="padding: 5px;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold;">Contact:</td>
              <td style="padding: 5px;">${contact}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold;">Client ID:</td>
              <td style="padding: 5px;">${clientId}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold;">Received By:</td>
              <td style="padding: 5px;">${receivedBy}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Device Information</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; font-weight: bold; width: 40%;">Brand:</td>
              <td style="padding: 5px;">${brand}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold;">Model:</td>
              <td style="padding: 5px;">${model}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold;">IMEI:</td>
              <td style="padding: 5px;">${imeiNo}</td>
            </tr>
            ${serialNo !== 'N/A' ? `
            <tr>
              <td style="padding: 5px; font-weight: bold;">Serial No:</td>
              <td style="padding: 5px;">${serialNo}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 5px; font-weight: bold;">Warranty:</td>
              <td style="padding: 5px;">${warranty}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Repair Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; font-weight: bold; width: 40%;">Problem:</td>
              <td style="padding: 5px;">${problem}</td>
            </tr>
            <tr>
              <td style="padding: 5px; font-weight: bold;">Condition:</td>
              <td style="padding: 5px;">${condition}</td>
            </tr>
          </table>
          ${services.length > 0 ? `
          <div style="margin-top: 10px;">
            <p style="font-weight: bold; margin-bottom: 5px;">Services:</p>
            <ul style="margin: 0; padding-left: 20px;">
              ${services.map(service => `<li>${service}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          ${ticket.equipmentObs ? `
          <div style="margin-top: 10px;">
            <p style="font-weight: bold; margin-bottom: 5px;">Equipment Observations:</p>
            <p style="margin: 0; padding: 5px; background: #f5f5f5; border-radius: 3px;">${ticket.equipmentObs}</p>
          </div>
          ` : ''}
          ${ticket.repairObs ? `
          <div style="margin-top: 10px;">
            <p style="font-weight: bold; margin-bottom: 5px;">Repair Observations:</p>
            <p style="margin: 0; padding: 5px; background: #f5f5f5; border-radius: 3px;">${ticket.repairObs}</p>
          </div>
          ` : ''}
        </div>

        ${accessories.length > 0 ? `
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #ccc; padding-bottom: 3px;">Accessories</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${accessories.map(acc => `<li>${acc}</li>`).join('')}
          </ul>
        </div>
        ` : ''}

        <div style="margin-top: 20px; border-top: 2px solid #000; padding-top: 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px; font-weight: bold; font-size: 16px;">Price:</td>
              <td style="padding: 5px; font-weight: bold; font-size: 16px; text-align: right;">€${price.toFixed(2)}</td>
            </tr>
            ${budget ? `
            <tr>
              <td style="padding: 5px; font-weight: bold;">Budget:</td>
              <td style="padding: 5px; text-align: right;">€${budget.toFixed(2)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; font-size: 11px; color: #666;">
          <p>Thank you for your business!</p>
          <p>Please keep this receipt for your records.</p>
        </div>
      </div>
    `;
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Repair Ticket Receipt</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 10px;
            }
            @page {
              margin: 10mm;
            }
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 20px;
            background: #fff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td {
            padding: 5px;
            border-bottom: 1px solid #eee;
          }
          h1, h2, h3 {
            color: #000;
          }
        </style>
      </head>
      <body>
        ${ticketsHTML}
      </body>
    </html>
  `;
}

export async function printTicket(ticket: Ticket, companyInfo?: CompanyInfo) {
  try {
    const html = generateReceiptHTML([ticket], companyInfo);
    
    const { uri } = await Print.printToFileAsync({ html });
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Print or Share Receipt',
      });
    } else {
      // Fallback: try to print directly
      await Print.printAsync({ uri });
    }
  } catch (error) {
    console.error('Error printing ticket:', error);
    throw error;
  }
}

export async function printTickets(tickets: Ticket[], companyInfo?: CompanyInfo) {
  try {
    const html = generateReceiptHTML(tickets, companyInfo);
    
    const { uri } = await Print.printToFileAsync({ html });
    
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Print or Share Receipt',
      });
    } else {
      // Fallback: try to print directly
      await Print.printAsync({ uri });
    }
  } catch (error) {
    console.error('Error printing tickets:', error);
    throw error;
  }
}
