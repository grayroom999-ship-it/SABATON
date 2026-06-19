// lib/knowledge.ts
export const knowledgeBase = [
  {
    category: 'shipping',
    content: 'We deliver free within Buea town. Delivery takes 24 hours. We deliver to Molyko, Mile 17, Great Soppo, and surrounding areas.'
  },
  {
    category: 'returns',
    content: 'We offer free size exchange within 7 days. Shoes must be unworn and in original packaging.'
  },
  {
    category: 'materials',
    content: 'We use 100% genuine leather from Ethiopian and Nigerian tanneries. Each shoe is handcrafted.'
  },
  {
    category: 'care',
    content: 'Clean your leather shoes with a soft cloth. Use leather conditioner every 3 months. Store in a cool, dry place.'
  },
  // 🆕 Seasonal offers / promotions
  {
    category: 'promotions',
    content: '🎉 Current offers: 10% off all loafers until the end of the month. Free shoe horn with every purchase of leather boots. Follow us on social media for flash sales!'
  }
];

export function findRelevantInfo(query: string): string {
  const results = knowledgeBase.filter(item => 
    query.toLowerCase().includes(item.category) || 
    item.content.toLowerCase().includes(query.toLowerCase())
  );
  return results.map(r => r.content).join('\n\n');
}