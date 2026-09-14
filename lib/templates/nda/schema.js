import ndaContent from "./content.json";

export const ndaTemplate = {
  id: "nda",
  type: "contract",
  profileSchemaId: "contract",
  name: "NDA",
  fullName: "Non-Disclosure Agreement",
  logo: "/preview.webp",
  pageCount: 4,
  content: ndaContent,

  disclosingParty: {
    name: "บริษัท เครสท์ เซนโด จำกัด",
    address:
      "สำนักงานใหญ่ ตั้งอยู่เลขที่ 8/40 เดอะ คอนเนค 37 ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210 ประเทศไทย",
    signatoryName: "นายศรายุทธ โกสิยารักษ์",
    signatoryPosition: "CEO/Founder",
  },

  fields: [
    { id: "contract_location", sharedKey: "contract_location", label: "สถานที่ทำสัญญา", type: "text", page: 1, placeholder: "กรุงเทพมหานคร", required: false },
    { id: "contract_date_day", sharedKey: "contract_date_day", label: "วัน", type: "text", page: 1, placeholder: "17", required: true },
    { id: "contract_date_month", sharedKey: "contract_date_month", label: "เดือน", type: "text", page: 1, placeholder: "สิงหาคม", required: true },
    { id: "contract_date_year", sharedKey: "contract_date_year", label: "ปี พ.ศ.", type: "text", page: 1, placeholder: "2569", required: true },
    { id: "receiving_party_name", sharedKey: "counterparty_name", label: "ชื่อบริษัท/นิติบุคคล (ผู้รับข้อมูล)", type: "text", page: 1, placeholder: "บริษัท ตัวอย่าง จำกัด", required: true },
    { id: "receiving_party_address", sharedKey: "counterparty_address", label: "ที่อยู่สำนักงาน (ผู้รับข้อมูล)", type: "textarea", page: 1, placeholder: "เลขที่ ... แขวง/ตำบล ... เขต/อำเภอ ... จังหวัด ... รหัสไปรษณีย์ ...", required: true },
    { id: "receiving_signatory_name", sharedKey: "counterparty_signatory_name", label: "ชื่อผู้ลงนาม (ผู้รับข้อมูล)", type: "text", page: 4, placeholder: "ชื่อ-นามสกุล", required: true },
    { id: "receiving_signatory_position", sharedKey: "counterparty_signatory_position", label: "ตำแหน่ง", type: "text", page: 4, placeholder: "เช่น กรรมการผู้จัดการ", required: true },
    { id: "receiving_signature_line", sharedKey: "counterparty_signature_text", label: "ลายมือชื่อ (ผู้รับข้อมูล)", type: "text", page: 4, placeholder: "ลายมือชื่อ / การลงนาม (คู่สัญญา)", required: false },
    { id: "disclosing_party_name", sharedKey: "our_company_name", label: "ชื่อบริษัท (ผู้เปิดเผยข้อมูล)", type: "text", page: 4, placeholder: "บริษัท เครสท์ เซนโด จำกัด", required: false },
    { id: "disclosing_signatory_name", sharedKey: "our_signatory_name", label: "ชื่อผู้ลงนาม (ผู้เปิดเผยข้อมูล)", type: "text", page: 4, placeholder: "นายศรายุทธ โกสิยารักษ์", required: false },
    { id: "disclosing_signatory_position", sharedKey: "our_signatory_position", label: "ตำแหน่งผู้ลงนาม (ผู้เปิดเผยข้อมูล)", type: "text", page: 4, placeholder: "CEO/Founder", required: false },
    { id: "disclosing_signature_line", sharedKey: "our_signature_text", label: "ลายมือชื่อ (ผู้เปิดเผยข้อมูล)", type: "text", page: 4, placeholder: "ลายมือชื่อ / การลงนาม (ฝ่ายเรา)", required: false },
  ],
};

export function getCompletionStatus(values) {
  const requiredFields = ndaTemplate.fields.filter((f) => f.required);
  const filled = requiredFields.filter((f) => values[f.id]?.trim());
  return {
    total: requiredFields.length,
    filled: filled.length,
    isComplete: filled.length === requiredFields.length,
  };
}
