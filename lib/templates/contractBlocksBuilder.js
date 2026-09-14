import nda from './nda/content.js';
import partner from './partner/content.js';
import dist from './distributor/content.js';

export function getNdaBlocks() {
  const blocks = [
    {
      id: 'b_nda_header',
      type: 'header',
      title: 'หัวกระดาษ',
      settings: {
        hasLogo: true,
        logoUrl: '/preview.webp',
        companyName: '{{company_name}}',
        companyNameEn: '{{company_name_en}}',
        taxId: '{{company_tax_id}}',
        address: '{{company_address}}',
        phone: '{{company_phone}}',
        email: '{{company_email}}',
        align: 'split',
      },
    },
    {
      id: 'b_nda_title',
      type: 'doc_title',
      title: 'หัวเรื่อง',
      settings: {
        titleText: nda.title?.titleTh || 'หนังสือสัญญาไม่เปิดเผยข้อมูล',
        subtitleText: nda.title?.titleEn || 'Non-Disclosure Agreement (NDA)',
        align: 'center',
      },
    },
    {
      id: 'b_nda_preamble',
      type: 'contract_preamble',
      title: 'คำนำสัญญาและคู่สัญญา',
      settings: {
        locationPrefix: nda.preamble?.locationPrefix || 'สัญญาฉบับนี้ทำขึ้น ณ',
        locationText: '{{contract_location}}',
        datePrefix: nda.preamble?.datePrefix || 'เมื่อวันที่',
        dateText: '{{contract_date}}',
        betweenLabel: nda.preamble?.betweenLabel || 'ระหว่าง:',
        party1Text: '{{company_name}} ' + (nda.preamble?.disclosingPartyBoilerplate || '') + ' ' + (nda.preamble?.disclosingPartyRole || '') + ' ฝ่ายหนึ่ง',
        andLabel: nda.preamble?.andLabel || 'และ',
        party2Text: '{{customer_company}} ' + (nda.preamble?.receivingPartyAddressPrefix || '') + ' {{customer_address}} ซึ่งต่อไปในสัญญานี้จะเรียกว่า ' + (nda.preamble?.receivingPartyRole || '') + ' อีกฝ่ายหนึ่ง',
        partiesSummary: nda.preamble?.partiesSummary || '',
        recital: nda.preamble?.recital || '',
      },
    },
  ];

  (nda.sections || []).forEach((sec, idx) => {
    blocks.push({
      id: "b_nda_sec_" + (sec.number || idx + 1),
      type: 'contract_section',
      title: sec.title,
      settings: {
        intro: sec.intro || null,
        content: sec.content || null,
        bullets: sec.bullets || null,
        subClauses: sec.subClauses || null,
        closing: sec.closing || null,
      },
    });
  });

  if (nda.witnessStatement) {
    blocks.push({
      id: 'b_nda_witness',
      type: 'text_block',
      title: 'พยานหลักฐาน',
      settings: {
        content: nda.witnessStatement,
      },
    });
  }

  blocks.push({
    id: 'b_nda_signatures',
    type: 'signatures',
    title: 'ลงนามทั้งสองฝ่าย',
    settings: {
      slots: [
        { id: 's1', name: '{{authorized_signatory_name}}', role: nda.signatures?.disclosingTitle || 'ผู้เปิดเผยข้อมูล (Disclosing Party)' },
        { id: 's2', name: '{{customer_signatory_name}}', role: nda.signatures?.receivingTitle || 'ผู้รับข้อมูล (Receiving Party)' },
      ],
    },
  });

  return blocks;
}

export function getPartnerBlocks() {
  const blocks = [
    {
      id: 'b_partner_header',
      type: 'header',
      title: 'หัวกระดาษ',
      settings: {
        hasLogo: true,
        logoUrl: '/Partner-logo.webp',
        companyName: '{{company_name}}',
        companyNameEn: '{{company_name_en}}',
        taxId: '{{company_tax_id}}',
        address: '{{company_address}}',
        phone: '{{company_phone}}',
        email: '{{company_email}}',
        align: 'split',
      },
    },
    {
      id: 'b_partner_title',
      type: 'doc_title',
      title: 'หัวเรื่อง',
      settings: {
        titleText: partner.title?.titleTh || 'สัญญาแต่งตั้งพันธมิตรตัวแทนจำหน่าย',
        subtitleText: partner.title?.titleEn || 'Partner Agreement',
        align: 'center',
      },
    },
    {
      id: 'b_partner_preamble',
      type: 'contract_preamble',
      title: 'คำนำสัญญาและคู่สัญญา',
      settings: {
        locationPrefix: 'สัญญาฉบับนี้ทำขึ้น ณ',
        locationText: '{{contract_location}}',
        datePrefix: partner.preamble?.datePrefix || 'เมื่อวันที่',
        dateText: '{{contract_date}}',
        betweenLabel: partner.preamble?.betweenLabel || 'ระหว่าง:',
        party1Text: '{{company_name}} เลขทะเบียนนิติบุคคล {{company_tax_id}} {{company_address}} ' + (partner.preamble?.distributorPartyRole || ''),
        andLabel: partner.preamble?.andLabel || 'กับ',
        party2Text: '{{customer_company}} เลขทะเบียนนิติบุคคล {{customer_tax_id}} สำนักงานใหญ่ ตั้งอยู่เลขที่ {{customer_address}} ' + (partner.preamble?.resellerPartyRole || ''),
        recital: partner.preamble?.recital || '',
      },
    },
  ];

  (partner.sections || []).forEach((sec, idx) => {
    blocks.push({
      id: "b_partner_sec_" + (sec.number || idx + 1),
      type: 'contract_section',
      title: sec.title,
      settings: {
        intro: sec.intro || null,
        content: sec.content || null,
        bullets: sec.bullets || null,
        subClauses: sec.subClauses || null,
        distributorObligations: sec.distributorObligations || null,
        resellerObligations: sec.resellerObligations || null,
        closing: sec.closing || null,
      },
    });
  });

  if (partner.witnessStatement) {
    blocks.push({
      id: 'b_partner_witness',
      type: 'text_block',
      title: 'พยานหลักฐาน',
      settings: {
        content: partner.witnessStatement,
      },
    });
  }

  blocks.push({
    id: 'b_partner_signatures',
    type: 'signatures',
    title: 'ลงนามแต่งตั้ง',
    settings: {
      slots: [
        { id: 's1', name: '{{authorized_signatory_name}}', role: 'ผู้จัดจำหน่ายหลัก (Distributor)' },
        { id: 's2', name: '{{customer_signatory_name}}', role: 'ตัวแทนจำหน่าย (Reseller)' },
      ],
    },
  });

  return blocks;
}

export function getDistributorBlocks() {
  const blocks = [
    {
      id: 'b_dist_header',
      type: 'header',
      title: 'หัวกระดาษ',
      settings: {
        hasLogo: true,
        logoUrl: '/preview.webp',
        companyName: '{{company_name}}',
        companyNameEn: '{{company_name_en}}',
        taxId: '{{company_tax_id}}',
        address: '{{company_address}}',
        phone: '{{company_phone}}',
        email: '{{company_email}}',
        align: 'split',
      },
    },
    {
      id: 'b_dist_title',
      type: 'doc_title',
      title: 'หัวเรื่อง',
      settings: {
        titleText: dist.title?.titleTh || 'สัญญาแต่งตั้งและจัดจำหน่ายซอฟต์แวร์',
        subtitleText: dist.title?.titleEn || 'Distributor and Reseller Master Agreement',
        align: 'center',
      },
    },
    {
      id: 'b_dist_preamble',
      type: 'contract_preamble',
      title: 'คำนำสัญญาและคู่สัญญา',
      settings: {
        locationPrefix: dist.preamble?.locationPrefix || 'สัญญาฉบับนี้ทำขึ้น ณ',
        locationText: '{{contract_location}}',
        datePrefix: dist.preamble?.datePrefix || 'เมื่อวันที่',
        dateText: '{{contract_date}}',
        betweenLabel: dist.preamble?.betweenLabel || 'ระหว่าง:',
        party1Text: '{{company_name}} {{company_address}} ซึ่งต่อไปในสัญญานี้จะเรียกว่า ' + (dist.preamble?.distributorPartyRole || ' ผู้จัดจำหน่ายหลัก (Distributor)') + ' ฝ่ายหนึ่ง',
        andLabel: dist.preamble?.andLabel || 'กับ',
        party2Text: '{{customer_company}} สำนักงานใหญ่ ตั้งอยู่เลขที่ {{customer_address}} (ซึ่งต่อไปในสัญญานี้จะเรียกว่า ' + (dist.preamble?.resellerPartyRole || 'ตัวแทนจำหน่ายต่อ') + ') อีกฝ่ายหนึ่ง',
        recital: dist.preamble?.recital || '',
      },
    },
  ];

  (dist.sections || []).forEach((sec, idx) => {
    blocks.push({
      id: "b_dist_sec_" + (sec.number || idx + 1),
      type: 'contract_section',
      title: sec.title,
      settings: {
        intro: sec.intro || null,
        content: sec.content || null,
        bullets: sec.bullets || null,
        subClauses: sec.subClauses || null,
        distributorObligations: sec.distributorObligations || null,
        resellerObligations: sec.resellerObligations || null,
        closing: sec.closing || null,
      },
    });
  });

  if (dist.witnessStatement) {
    blocks.push({
      id: 'b_dist_witness',
      type: 'text_block',
      title: 'พยานหลักฐาน',
      settings: {
        content: dist.witnessStatement,
      },
    });
  }

  blocks.push({
    id: 'b_dist_signatures',
    type: 'signatures',
    title: 'ลงนามคู่สัญญา',
    settings: {
      slots: [
        { id: 's1', name: '{{authorized_signatory_name}}', role: 'ผู้จัดจำหน่ายหลัก (Distributor)' },
        { id: 's2', name: '{{customer_signatory_name}}', role: 'ตัวแทนจำหน่ายต่อ (Reseller)' },
      ],
    },
  });

  return blocks;
}
