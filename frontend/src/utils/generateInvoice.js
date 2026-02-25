/**
 * Invoice Generator Utility
 * Generates a professional PDF invoice using jsPDF + autotable
 * Brand: Burhani Collection | Theme: Reddish-Pink
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Brand & Theme ────────────────────────────────────────────────────────────
const BRAND_NAME = 'Burhani Collection';
const BRAND_EMAIL = 'burhanicollection78653@gmail.com';
const BRAND_WEBSITE = 'www.burhanicollection.com';
const BRAND_TAGLINE = 'Premium Islamic Clothing & Lifestyle';

// Reddish-pink palette
const C = {
    primary: [203, 32, 75],   // deep reddish-pink  #CB204B
    primaryDark: [160, 15, 55],   // darker shade       #A00F37
    primaryLight: [253, 230, 238], // very light pink    #FDE6EE
    accent: [220, 50, 90],   // medium pink-red    #DC325A
    white: [255, 255, 255],
    dark: [30, 15, 25],   // near-black
    grayDark: [60, 40, 50],
    gray: [100, 80, 90],
    grayLight: [230, 220, 225],
    grayBg: [250, 246, 248],
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `Rs. ${Number(n).toFixed(2)}`;

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const STATUS_COLORS = {
    pending: [234, 179, 8],
    confirmed: [59, 130, 246],
    shipped: [168, 85, 247],
    delivered: [34, 197, 94],
    cancelled: [239, 68, 68],
};

// ── Draw a filled rounded rect (manual, since jsPDF roundedRect is limited) ──
const fillRect = (doc, x, y, w, h, color) => {
    doc.setFillColor(...color);
    doc.rect(x, y, w, h, 'F');
};

// ── Main Export ──────────────────────────────────────────────────────────────
export const generateInvoice = (order) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const M = 14;   // margin
    const colW = (pageW - M * 2 - 6) / 2;

    // ── HEADER BAND ──────────────────────────────────────────────────────────
    fillRect(doc, 0, 0, pageW, 46, C.primary);

    // Brand name
    doc.setTextColor(...C.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(BRAND_NAME, M, 17);

    // Tagline
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 190, 210);
    doc.text(BRAND_TAGLINE, M, 24);

    // Website / contact under brand
    doc.setFontSize(7.5);
    doc.setTextColor(255, 210, 225);
    doc.text(BRAND_EMAIL, M, 30);
    doc.text(BRAND_WEBSITE, M, 36);

    // INVOICE title (right-aligned)
    doc.setTextColor(...C.white);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageW - M, 20, { align: 'right' });

    // Invoice meta (right)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(255, 200, 215);
    const invNo = `INV-${String(order.id).padStart(5, '0')}`;
    doc.text(`Invoice No : ${invNo}`, pageW - M, 29, { align: 'right' });
    doc.text(`Order No   : #${order.id}`, pageW - M, 35, { align: 'right' });
    doc.text(`Date       : ${formatDate(order.created_at)}`, pageW - M, 41, { align: 'right' });

    // ── THIN ACCENT LINE under header ────────────────────────────────────────
    fillRect(doc, 0, 46, pageW, 3, C.accent);

    let y = 57;

    // ── STATUS BADGE ─────────────────────────────────────────────────────────
    const statusKey = (order.status || 'pending').toLowerCase();
    const badgeColor = STATUS_COLORS[statusKey] || [107, 114, 128];
    doc.setFillColor(...badgeColor);
    doc.roundedRect(M, y - 5, 36, 8, 2, 2, 'F');
    doc.setTextColor(...C.white);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text((order.status || 'pending').toUpperCase(), M + 18, y + 0.5, { align: 'center' });

    y += 11;

    // ── INFO CARDS ROW ───────────────────────────────────────────────────────
    const cardH = 56;

    // Helper: draw info card
    const drawCard = (x, title, lines, iconLabel) => {
        // Card background
        doc.setFillColor(...C.grayBg);
        doc.roundedRect(x, y, colW, cardH, 3, 3, 'F');
        doc.setDrawColor(...C.grayLight);
        doc.roundedRect(x, y, colW, cardH, 3, 3, 'S');

        // Header bar (reddish-pink)
        doc.setFillColor(...C.primary);
        doc.roundedRect(x, y, colW, 10, 3, 3, 'F');
        // flatten bottom corners of header
        fillRect(doc, x, y + 6, colW, 4, C.primary);

        doc.setTextColor(...C.white);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), x + 4, y + 7);

        // Content lines
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        let lineY = y + 17;
        lines.forEach(({ label, value, bold }) => {
            doc.setTextColor(...C.gray);
            doc.setFontSize(7);
            doc.text(label, x + 4, lineY - 2);
            doc.setTextColor(...C.grayDark);
            doc.setFontSize(bold ? 9 : 8.5);
            doc.setFont('helvetica', bold ? 'bold' : 'normal');
            const wrapped = doc.splitTextToSize(String(value || 'N/A'), colW - 8);
            doc.text(wrapped, x + 4, lineY + 3);
            lineY += (wrapped.length > 1 ? wrapped.length * 4.5 + 2 : 9);
            doc.setFont('helvetica', 'normal');
        });
    };

    // Payment method label
    const payLabel =
        order.payment_method === 'razorpay' ? 'Online (Razorpay)'
            : order.payment_method === 'whatsapp' ? 'WhatsApp / COD'
                : (order.payment_method || 'N/A');

    drawCard(M, 'Customer Information', [
        { label: 'NAME', value: order.customer_name, bold: true },
        { label: 'EMAIL', value: order.customer_email || 'N/A' },
        { label: 'PHONE', value: order.customer_phone },
        { label: 'PAYMENT', value: payLabel },
    ]);

    drawCard(M + colW + 6, 'Shipping Address', [
        { label: 'DELIVER TO', value: order.customer_name, bold: true },
        { label: 'ADDRESS', value: order.address },
    ]);

    y += cardH + 10;

    // ── TRANSACTION ID (if available) ────────────────────────────────────────
    if (order.razorpay_payment_id) {
        fillRect(doc, M, y - 3, pageW - M * 2, 10, C.primaryLight);
        doc.setTextColor(...C.primaryDark);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('Transaction ID:', M + 4, y + 3.5);
        doc.setFont('helvetica', 'normal');
        doc.text(order.razorpay_payment_id, M + 38, y + 3.5);
        y += 14;
    }

    // ── SECTION TITLE: Order Items ────────────────────────────────────────────
    fillRect(doc, M, y - 2, pageW - M * 2, 9, C.primaryLight);
    doc.setDrawColor(...C.primary);
    doc.setLineWidth(0.5);
    doc.line(M, y - 2, M, y + 7);          // left accent line
    doc.setTextColor(...C.primaryDark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER ITEMS', M + 5, y + 4.5);
    y += 11;

    // ── TABLE ────────────────────────────────────────────────────────────────
    const subtotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
    const shipping = order.total_amount - subtotal;

    autoTable(doc, {
        startY: y,
        margin: { left: M, right: M },
        head: [['#', 'Product Name', 'Size', 'Color', 'Unit Price', 'Qty', 'Total']],
        body: (order.items || []).map((item, idx) => [
            idx + 1,
            item.product_name || 'N/A',
            item.selected_size || '-',
            item.selected_color || '-',
            fmt(item.price),
            item.quantity,
            fmt(item.price * item.quantity),
        ]),
        foot: [
            [
                { content: 'Subtotal', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: C.grayBg, textColor: C.grayDark } },
                { content: fmt(subtotal), styles: { fontStyle: 'bold', fillColor: C.grayBg, textColor: C.grayDark } },
            ],
            [
                { content: 'Shipping', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: C.grayBg, textColor: C.grayDark } },
                { content: shipping === 0 ? 'FREE' : fmt(shipping), styles: { fontStyle: 'bold', fillColor: C.grayBg, textColor: C.grayDark } },
            ],
            [
                { content: 'GRAND TOTAL', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: C.primary, textColor: C.white } },
                { content: fmt(order.total_amount), styles: { fontStyle: 'bold', fillColor: C.primary, textColor: C.white } },
            ],
        ],
        headStyles: {
            fillColor: C.primaryDark,
            textColor: C.white,
            fontStyle: 'bold',
            fontSize: 8.5,
            cellPadding: 3,
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: C.grayDark,
            cellPadding: 3,
        },
        alternateRowStyles: { fillColor: [252, 248, 250] },
        columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'center', fontStyle: 'bold' },
            6: { halign: 'right', fontStyle: 'bold' },
        },
        showFoot: 'lastPage',
        footStyles: { fontSize: 9, cellPadding: 3 },
        tableLineColor: C.grayLight,
        tableLineWidth: 0.2,
    });

    // ── THANK YOU FOOTER CARD ────────────────────────────────────────────────
    const afterTable = doc.lastAutoTable.finalY + 10;

    doc.setFillColor(...C.primaryLight);
    doc.setDrawColor(...C.accent);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, afterTable, pageW - M * 2, 16, 3, 3, 'FD');

    doc.setTextColor(...C.primaryDark);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Thank you for shopping with ${BRAND_NAME}!`, pageW / 2, afterTable + 6.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(160, 60, 90);
    doc.text(`For any queries, contact us at ${BRAND_EMAIL}`, pageW / 2, afterTable + 12.5, { align: 'center' });

    // ── PAGE FOOTER ──────────────────────────────────────────────────────────
    fillRect(doc, 0, pageH - 10, pageW, 10, C.primaryDark);
    doc.setTextColor(255, 200, 215);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
        `${BRAND_NAME}  |  ${BRAND_EMAIL}  |  ${BRAND_WEBSITE}`,
        M, pageH - 3.5
    );
    doc.text(
        `Invoice ${invNo}  |  Generated: ${new Date().toLocaleDateString('en-IN')}`,
        pageW - M, pageH - 3.5,
        { align: 'right' }
    );

    // ── SAVE ─────────────────────────────────────────────────────────────────
    doc.save(`BurhaniCollection_Invoice_${order.id}.pdf`);
};
