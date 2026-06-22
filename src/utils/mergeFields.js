export const MERGE_FIELDS = [
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'business_name', label: 'Business Name' },
  { key: 'industry', label: 'Industry' },
  { key: 'contact_title', label: 'Contact Title' },
  { key: 'contact_email', label: 'Contact Email' },
  { key: 'my_name', label: 'My Name' },
  { key: 'my_title', label: 'My Title' },
  { key: 'today_date', label: 'Today' },
  { key: 'next_week_date', label: 'Next Week' },
  { key: 'business_needs', label: 'Business Needs' },
  { key: 'business_offers', label: 'Business Offers' },
];

export function fillMergeFields(template, data) {
  let result = template;
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const replacements = {
    '{{contact_name}}': data.contact_name || data.contactName || '',
    '{{business_name}}': data.business_name || data.businessName || '',
    '{{industry}}': data.industry || '',
    '{{contact_title}}': data.contact_title || data.contactTitle || '',
    '{{contact_email}}': data.contact_email || data.contactEmail || '',
    '{{my_name}}': data.my_name || data.myName || '',
    '{{my_title}}': data.my_title || data.myTitle || '',
    '{{today_date}}': today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    '{{next_week_date}}': nextWeek.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    '{{business_needs}}': data.business_needs || data.needs || '',
    '{{business_offers}}': data.business_offers || data.offers || '',
  };
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.split(placeholder).join(value);
  }
  return result;
}

export function getSampleData() {
  return {
    contact_name: 'Jane Smith',
    business_name: 'Acme Corp',
    industry: 'Technology',
    contact_title: 'CEO',
    contact_email: 'jane@acmecorp.com',
    my_name: 'John Doe',
    my_title: 'Partnership Manager',
    business_needs: 'Software development services',
    business_offers: 'Cloud infrastructure solutions',
  };
}