import partnerContent from "./content.json";

export const partnerTemplate = {
  id: "partner",
  type: "contract",
  profileSchemaId: "contract",
  name: "Partner Agreement",
  fullName: "Partner Agreement",
  logo: "/Partner-logo.webp",
  pageCount: 5,
  content: partnerContent,

  distributorParty: {
    name: "บริษัท เครสท์ เซนโด จำกัด",
    registrationNumber: "0105558073755",
    address:
      "สำนักงานใหญ่ ตั้งอยู่เลขที่ 8/40 เดอะ คอนเนค 37 ซอยช่างอากาศอุทิศ 10 แยก 1-2 แขวงดอนเมือง เขตดอนเมือง กรุงเทพมหานคร 10210 ประเทศไทย",
    signatoryName: "นายศรายุทธ โกสิยารักษ์",
    signatoryPosition: "CEO/Founder",
  },

  fields: [
    {
      id: "contract_date_day",
      sharedKey: "contract_date_day",
      label: "วัน",
      type: "text",
      page: 1,
      placeholder: "17",
      required: true,
    },
    {
      id: "contract_date_month",
      sharedKey: "contract_date_month",
      label: "เดือน",
      type: "text",
      page: 1,
      placeholder: "สิงหาคม",
      required: true,
    },
    {
      id: "contract_date_year",
      sharedKey: "contract_date_year",
      label: "ปี พ.ศ.",
      type: "text",
      page: 1,
      placeholder: "2569",
      required: true,
    },
    {
      id: "reseller_name",
      sharedKey: "counterparty_name",
      label: "ชื่อบริษัท Reseller",
      type: "text",
      page: 1,
      placeholder: "บริษัท ตัวอย่าง จำกัด",
      required: true,
    },
    {
      id: "reseller_registration_number",
      sharedKey: "counterparty_registration_number",
      label: "เลขทะเบียนนิติบุคคล (Reseller)",
      type: "text",
      page: 1,
      placeholder: "0000000000000",
      required: true,
    },
    {
      id: "reseller_address",
      sharedKey: "counterparty_address",
      label: "ที่อยู่สำนักงาน (Reseller)",
      type: "textarea",
      page: 1,
      placeholder: "เลขที่ ... แขวง/ตำบล ... เขต/อำเภอ ... จังหวัด ... รหัสไปรษณีย์ ...",
      required: true,
    },
    {
      id: "reseller_signatory_name",
      sharedKey: "counterparty_signatory_name",
      label: "ชื่อผู้ลงนาม (Reseller)",
      type: "text",
      page: 5,
      placeholder: "ชื่อ-นามสกุล",
      required: true,
    },
    {
      id: "reseller_signatory_position",
      sharedKey: "counterparty_signatory_position",
      label: "ตำแหน่งผู้ลงนาม",
      type: "text",
      page: 5,
      placeholder: "เช่น กรรมการผู้จัดการ",
      required: true,
    },
  ],
};

export function getCompletionStatus(values, template = partnerTemplate) {
  const requiredFields = template.fields.filter((f) => f.required);
  const filled = requiredFields.filter((f) => values[f.id]?.trim());
  return {
    total: requiredFields.length,
    filled: filled.length,
    isComplete: filled.length === requiredFields.length,
  };
}
