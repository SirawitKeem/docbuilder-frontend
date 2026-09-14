export const fieldRegistry = {
  // 1. ข้อมูลบริษัทและผู้รับใบเสนอราคา (Bill To / Customer)
  bill_to_company: {
    label: "ชื่อบริษัทลูกค้า (Bill To / To)",
    type: "text",
    category: "company",
    placeholder: "เช่น บริษัท CS LoxInfo Public Company Limited",
  },
  counterparty_name: {
    label: "ชื่อบริษัท/นิติบุคคล",
    type: "text",
    category: "company",
    placeholder: "เช่น บริษัท ตัวอย่าง จำกัด",
  },
  counterparty_registration_number: {
    label: "เลขประจำตัวผู้เสียภาษี / เลขทะเบียนนิติบุคคล",
    type: "text",
    category: "company",
    placeholder: "0105558073755",
  },
  counterparty_address: {
    label: "ที่อยู่สำนักงาน",
    type: "textarea",
    category: "company",
    placeholder: "เลขที่ ... แขวง/ตำบล ... เขต/อำเภอ ... จังหวัด ... รหัสไปรษณีย์ ...",
  },

  // 2. ข้อมูลผู้ติดต่อ (Contact Persons)
  attn_name: {
    label: "ผู้ติดต่อ (Attn.)",
    type: "text",
    category: "contact",
    placeholder: "เช่น คุณ Sarun Phongpodchanan",
  },
  end_user: {
    label: "End User",
    type: "text",
    category: "contact",
    placeholder: "เช่น P.R. Foodland Co., Ltd.",
  },
  subject: {
    label: "หัวข้อเรื่อง (Subject)",
    type: "text",
    category: "business",
    placeholder: "เช่น CDNetworks Annual Services (WAF+DDoS+BOT)",
  },
  am_name: {
    label: "ชื่อ Account Manager (AM)",
    type: "text",
    category: "contact",
    placeholder: "เช่น Narin Rattanavajij / Channel Manager",
  },
  am_phone: {
    label: "เบอร์โทร AM",
    type: "text",
    category: "contact",
    placeholder: "+6682-44-686-95",
  },

  // 3. เงื่อนไขใบเสนอราคา (Quotation Terms)
  price_validity: {
    label: "ระยะเวลาการยืนราคา (Price Validity)",
    type: "text",
    category: "business",
    placeholder: "เช่น 20 Sept 2026 หรือ 30 days",
  },
  delivery_term: {
    label: "เงื่อนไขส่งมอบ (Delivery Term)",
    type: "text",
    category: "business",
    placeholder: "เช่น 7 days",
  },
  credit_term: {
    label: "เงื่อนไขชำระเงิน (Credit Term)",
    type: "text",
    category: "business",
    placeholder: "เช่น 30 days",
  },

  // 4. ข้อมูลการลงนามสัญญา (สำหรับ NDA / Agreement เท่านั้น)
  counterparty_signatory_name: {
    label: "ชื่อผู้ลงนามสัญญา",
    type: "text",
    category: "signatory",
    placeholder: "ชื่อ-นามสกุล",
  },
  counterparty_signatory_position: {
    label: "ตำแหน่งผู้ลงนามสัญญา",
    type: "text",
    category: "signatory",
    placeholder: "เช่น กรรมการผู้จัดการ",
  },
  our_company_name: {
    label: "ชื่อบริษัท/นิติบุคคล (ฝ่ายเรา)",
    type: "text",
    category: "company",
    placeholder: "บริษัท เครสท์ เซนโด จำกัด",
  },
  our_signatory_name: {
    label: "ชื่อผู้ลงนาม (ฝ่ายเรา)",
    type: "text",
    category: "signatory",
    placeholder: "นายศรายุทธ โกสิยารักษ์",
  },
  our_signatory_position: {
    label: "ตำแหน่งผู้ลงนาม (ฝ่ายเรา)",
    type: "text",
    category: "signatory",
    placeholder: "CEO/Founder",
  },

  // 5. ข้อมูลสำหรับหนังสือแจ้งและประกาศทางการ (Notification Letter)
  notification_recipient: {
    label: "เรียน / ผู้รับหนังสือ (To / Recipient)",
    type: "text",
    category: "notification",
    placeholder: "ท่านคู่ค้าและลูกค้าผู้มีอุปการคุณ / Valued Business Partners",
  },
  notification_subject: {
    label: "เรื่อง / หัวข้อหนังสือแจ้ง (Subject)",
    type: "text",
    category: "notification",
    placeholder: "แจ้งเปลี่ยนแปลงที่อยู่สำนักงานใหญ่ / Change of Head Office Address",
  },
  notification_effective_date: {
    label: "วันที่มีผลบังคับใช้ (ภาษาไทย)",
    type: "text",
    category: "notification",
    placeholder: "16 กันยายน 2569",
  },
  notification_effective_date_en: {
    label: "วันที่มีผลบังคับใช้ (ภาษาอังกฤษ)",
    type: "text",
    category: "notification",
    placeholder: "September 16, 2026",
  },
  notification_old_address_th: {
    label: "ที่อยู่เดิม (ภาษาไทย)",
    type: "textarea",
    category: "notification",
    placeholder: "45 ซอยโกสุมรวมใจ 37 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210",
  },
  notification_old_address_en: {
    label: "ที่อยู่เดิม (ภาษาอังกฤษ)",
    type: "textarea",
    category: "notification",
    placeholder: "45 Soi Kosum Ruam Chai 37, Don Mueang, Don Mueang, Bangkok 10210, Thailand",
  },
  notification_new_address_th: {
    label: "ที่อยู่ใหม่ (ภาษาไทย)",
    type: "textarea",
    category: "notification",
    placeholder: "18 ซอยโกสุมรวมใจ 35 แยก 4 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210",
  },
  notification_new_address_en: {
    label: "ที่อยู่ใหม่ (ภาษาอังกฤษ)",
    type: "textarea",
    category: "notification",
    placeholder: "18 Soi Kosum Ruam Chai 35 Yaek 4, Don Mueang, Don Mueang, Bangkok 10210, Thailand",
  },
  notification_signatory_name: {
    label: "ชื่อผู้มีอำนาจลงนาม (หนังสือแจ้งฯ)",
    type: "text",
    category: "notification",
    placeholder: "นายศรายุทธ  โกสิยารักษ์",
  },
  notification_signatory_position: {
    label: "ตำแหน่งผู้มีอำนาจลงนาม (หนังสือแจ้งฯ)",
    type: "text",
    category: "notification",
    placeholder: "กรรมการผู้จัดการ / CEO",
  },
};

export const categoryLabels = {
  company: "ข้อมูลบริษัท & ลูกค้า (Company / Customer)",
  contact: "ข้อมูลผู้ติดต่อ & ทีมขาย (Contact / AM)",
  business: "เงื่อนไขทางธุรกิจ & ใบเสนอราคา (Business & Terms)",
  signatory: "ข้อมูลผู้ลงนามสัญญา (Signatory - NDA/Agreement)",
  notification: "ข้อมูลหนังสือแจ้งทางการ (Notification Letter)",
};

// field ที่ถือเป็น "แกนกลาง" ของใบเสนอราคา
export const coreFieldKeys = [
  "bill_to_company",
  "attn_name",
  "am_name",
  "price_validity",
  "delivery_term",
  "credit_term",
];
