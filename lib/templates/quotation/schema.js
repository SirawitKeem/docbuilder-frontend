import quotationContent from "./content.json";

export const quotationTemplate = {
  id: "quotation",
  type: "quotation",
  profileSchemaId: "quotation",
  name: "Quotation",
  fullName: "ใบเสนอราคามาตรฐาน",
  logo: "/quotation.png",
  content: quotationContent,
  issuer: {
    name: "CREST ZENDO CO., LTD.",
    nameTh: "บริษัท เครสท์ เซนโด จำกัด",
    taxId: "0105558073755 (สำนักงานใหญ่)",
    address: "The Connect 37, 8/40 Soi Chang Akat Uthit 10 Yaek 1-2, Donmueang, Bangkok 10210",
    phone: "02-103-1861",
    website: "www.crestzendo.com",
    email: "info@crestzendo.com",
    tagline: "PARTNER IN PERFORMANCE, COMMITTED TO YOUR SUCCESS",
  },
  fields: [
    { id: "bill_to_company", sharedKey: "bill_to_company", label: "ชื่อบริษัทลูกค้า (Bill To / To)", type: "text", required: true },
    { id: "attn_name", sharedKey: "attn_name", label: "ผู้ติดต่อ (Attn.)", type: "text", required: true },
    { id: "end_user", sharedKey: "end_user", label: "End User", type: "text", required: false },
    { id: "subject", sharedKey: "subject", label: "หัวข้อเรื่อง (Subject)", type: "text", required: false },
    { id: "am_name", sharedKey: "am_name", label: "ชื่อ Account Manager (AM)", type: "text", required: true },
    { id: "am_phone", sharedKey: "am_phone", label: "เบอร์โทรศัพท์ AM", type: "text", required: false },
    { id: "price_validity", sharedKey: "price_validity", label: "ระยะเวลาการยืนราคา (Price Validity)", type: "text", required: false },
    { id: "delivery_term", sharedKey: "delivery_term", label: "เงื่อนไขส่งมอบ (Delivery Term)", type: "text", required: false },
    { id: "credit_term", sharedKey: "credit_term", label: "เงื่อนไขชำระเงิน (Credit Term)", type: "text", required: false },
  ],
  defaultLineItems: [],
};
