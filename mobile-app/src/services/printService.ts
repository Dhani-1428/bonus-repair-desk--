import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { apiService } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Font sizes matching website format
  const baseFontSize = '10pt';
  const smallFontSize = '9pt';
  const titleFontSize = '12pt';
  const headerFontSize = '11pt';
  const lineHeight = '1.4';
  const printerType = 'a4'; // Default to A4 format
  const cellLayout = printerType === 'thermal' ? 'block' : 'table-cell';
  const cellWidth = printerType === 'thermal' ? '100%' : '50%';

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
    const serialNo = ticket.serialNo || '-';
    const warranty = ticket.warranty || 'Without Warranty';
    const problem = ticket.problem || '-';
    const price = parseFloat(ticket.price as string) || 0;
    
    // Parse selectedServices if it's a string
    let servicesArray = ticket.selectedServices;
    if (typeof servicesArray === 'string') {
      try {
        servicesArray = JSON.parse(servicesArray);
      } catch (e) {
        servicesArray = [];
      }
    }
    const services = Array.isArray(servicesArray) && servicesArray.length > 0
      ? servicesArray.join(', ')
      : (ticket.serviceName || 'N/A');

    // Format dates
    const entryDate = ticket.createdAt ? new Date(ticket.createdAt) : new Date();
    const formattedDate = entryDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = entryDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Format out date if available
    let outDateDisplay = '';
    if (ticket.deliveredDate) {
      const outDate = new Date(ticket.deliveredDate);
      const formattedOutDate = outDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const formattedOutTime = outDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      outDateDisplay = `<div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Out Date:</span> ${formattedOutDate} ${formattedOutTime}</div>`;
    }

    // Equipment check
    const simCard = ticket.simCard ? 'Yes' : 'No';
    const simTray = ticket.simTray ? 'Yes' : 'No';
    const memoryCard = ticket.memoryCard ? 'Yes' : 'No';
    const charger = ticket.charger ? 'Yes' : 'No';
    const battery = ticket.battery ? 'Yes' : 'No';
    const waterDamaged = ticket.waterDamaged ? 'Yes' : 'No';
    const equipmentObs = ticket.equipmentObs || '-';
    const repairObs = ticket.repairObs || '-';

    ticketsHTML += `
      <div style="font-family: Arial, sans-serif; width: 100%; font-size: ${baseFontSize}; line-height: ${lineHeight}; page-break-inside: avoid !important; page-break-after: ${index < tickets.length - 1 ? 'always' : 'auto'} !important; page-break-before: avoid !important; break-inside: avoid !important; break-after: avoid !important; break-before: avoid !important; margin: 0; padding: 0;">
        <div style="display: ${printerType === 'thermal' ? 'block' : 'table'}; width: 100%; margin: 0 0 4px 0; border-bottom: 1.5px solid #000; padding: 0 0 2px 0;">
          <div style="display: ${printerType === 'thermal' ? 'block' : 'table-row'};">
            <div style="display: ${cellLayout}; width: ${cellWidth}; vertical-align: top; padding-right: ${printerType === 'thermal' ? '0' : '6px'}; margin-bottom: ${printerType === 'thermal' ? '4px' : '0'};">
              <!-- Shop/Company Name (Top) -->
              <div style="font-weight: bold; font-size: ${titleFontSize}; margin: 0 0 2px 0; padding: 0; color: #000; line-height: ${lineHeight};">${shopName}</div>
              <!-- Company Information (Below Shop Name) -->
              ${address ? `<div style="margin: 0 0 2px 0; padding: 0; font-size: ${smallFontSize}; color: #000; line-height: ${lineHeight};">${address}</div>` : ''}
              ${email ? `<div style="margin: 0 0 2px 0; padding: 0; font-size: ${smallFontSize}; color: #000; line-height: ${lineHeight};">${email}</div>` : ''}
              ${website ? `<div style="margin: 0 0 2px 0; padding: 0; font-size: ${smallFontSize}; color: #000; line-height: ${lineHeight};">${website}</div>` : ''}
              ${phone && phone !== 'N/A' ? `<div style="margin: 0; padding: 0; font-size: ${smallFontSize}; color: #000; line-height: ${lineHeight};">${phone}</div>` : ''}
            </div>
            <div style="display: ${cellLayout}; width: ${cellWidth}; vertical-align: top; padding-left: ${printerType === 'thermal' ? '0' : '6px'}; margin-top: ${printerType === 'thermal' ? '4px' : '0'}; border-top: ${printerType === 'thermal' ? '1px solid #ccc' : 'none'}; padding-top: ${printerType === 'thermal' ? '4px' : '0'};">
              <div style="font-weight: bold; font-size: ${headerFontSize}; margin: 0 0 2px 0; padding: 0; color: #000; line-height: ${lineHeight};">Client ID: ${clientId}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: ${baseFontSize}; color: #000; line-height: ${lineHeight};"><strong>Name:</strong> ${customerName}</div>
              <div style="margin: 0 0 2px 0; padding: 0; font-size: ${baseFontSize}; color: #000; line-height: ${lineHeight};"><strong>Client Phone:</strong> ${contact}</div>
              <div style="margin: 0; padding: 0; font-size: ${baseFontSize}; color: #000; line-height: ${lineHeight};"><strong>Device Received By:</strong> ${receivedBy}</div>
            </div>
          </div>
        </div>
        
        <div style="margin: 6px 0;">
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Entry Date:</span> ${formattedDate} ${formattedTime}</div>
          ${outDateDisplay}
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Repair N°:</span> ${repairNumber}</div>
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">IMEI:</span> ${imeiNo}</div>
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Brand/Model:</span> ${brand} - ${model}</div>
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Laptop Serial N°:</span> ${serialNo}</div>
          <div style="margin: 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Warranty:</span> ${warranty}</div>
        </div>
        
        <div style="margin: 6px 0;">
          <div style="font-weight: bold; margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};">Equipment Check:</div>
          <div style="margin: 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">SIM Card:</span> ${simCard} | <span style="font-weight: bold;">SIM Tray:</span> ${simTray} | <span style="font-weight: bold;">Memory Card:</span> ${memoryCard} | <span style="font-weight: bold;">Charger:</span> ${charger} | <span style="font-weight: bold;">Battery:</span> ${battery} | <span style="font-weight: bold;">Water Damaged:</span> ${waterDamaged}</div>
        </div>
        
        <div style="margin: 6px 0;">
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Equipment Obs:</span> ${equipmentObs}</div>
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Repair Obs:</span> ${repairObs}</div>
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Services:</span> ${services}</div>
          <div style="margin: 0 0 4px 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Problem:</span> ${problem}</div>
          <div style="margin: 0; padding: 0; font-size: ${baseFontSize}; line-height: ${lineHeight};"><span style="font-weight: bold;">Budget:</span> €${price.toFixed(2)}</div>
        </div>
        
        <!-- Gap between device information and footer -->
        <div style="margin: 12px 0; height: 12px;"></div>
        
        <div style="margin: 6px 0; padding: 5px; background-color: #f0f0f0; text-align: center; font-weight: bold; font-size: ${baseFontSize}; border: 1px solid #ddd;">
          STORAGE TERMS AND CONDITIONS
        </div>
        
        <div style="margin-top: 6px; padding: 6px; background-color: #f9f9f9; font-size: ${smallFontSize}; line-height: 1.5; border: 1px solid #ddd;">
          <div style="text-align: justify; margin-bottom: 4px; font-size: ${smallFontSize};">
            The customer acknowledges that the device will be stored at the repair shop's premises. The repair shop is not responsible for any loss, theft, or damage to the device while it is in storage, except in cases of proven negligence by the repair shop.
          </div>
          <div style="text-align: justify; margin-bottom: 4px; font-size: ${smallFontSize};">
            The customer must collect the device within 30 days of completion of repair. After this period, the repair shop reserves the right to charge storage fees or dispose of the device if not collected within 90 days.
          </div>
          <div style="text-align: justify; margin-bottom: 4px; font-size: ${smallFontSize};">
            The customer is responsible for providing accurate contact information. The repair shop will attempt to contact the customer using the provided contact details, but is not liable if contact cannot be established.
          </div>
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
    // If companyInfo not provided, fetch from user data
    let finalCompanyInfo = companyInfo;
    if (!finalCompanyInfo) {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          // Try to fetch fresh user data from API to get latest company info
          try {
            const freshUser = await apiService.getUser(user.id);
            if (freshUser?.user) {
              finalCompanyInfo = {
                shopName: freshUser.user.shopName || freshUser.user.name || 'Your Company Name',
                address: freshUser.user.address || '',
                companyEmail: freshUser.user.companyEmail || '',
                website: freshUser.user.website || '',
                contactNumber: freshUser.user.contactNumber || '',
              };
            }
          } catch (apiError) {
            // Fallback to stored user data
            finalCompanyInfo = {
              shopName: user.shopName || user.name || 'Your Company Name',
              address: user.address || '',
              companyEmail: user.companyEmail || '',
              website: user.website || '',
              contactNumber: user.contactNumber || '',
            };
          }
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    }
    
    const html = generateReceiptHTML([ticket], finalCompanyInfo);
    
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
    // If companyInfo not provided, fetch from user data
    let finalCompanyInfo = companyInfo;
    if (!finalCompanyInfo) {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          // Try to fetch fresh user data from API to get latest company info
          try {
            const freshUser = await apiService.getUser(user.id);
            if (freshUser?.user) {
              finalCompanyInfo = {
                shopName: freshUser.user.shopName || freshUser.user.name || 'Your Company Name',
                address: freshUser.user.address || '',
                companyEmail: freshUser.user.companyEmail || '',
                website: freshUser.user.website || '',
                contactNumber: freshUser.user.contactNumber || '',
              };
            }
          } catch (apiError) {
            // Fallback to stored user data
            finalCompanyInfo = {
              shopName: user.shopName || user.name || 'Your Company Name',
              address: user.address || '',
              companyEmail: user.companyEmail || '',
              website: user.website || '',
              contactNumber: user.contactNumber || '',
            };
          }
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      }
    }
    
    const html = generateReceiptHTML(tickets, finalCompanyInfo);
    
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
