const fs = require('fs');
const path = require('path');

// 创建简单的SVG占位图片
const createSVGPlaceholder = (name, emoji, color) => {
  return `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="200" fill="${color}"/>
  <text x="150" y="80" font-family="Arial, sans-serif" font-size="48" text-anchor="middle" fill="white">${emoji}</text>
  <text x="150" y="130" font-family="Arial, sans-serif" font-size="16" text-anchor="middle" fill="white">${name}</text>
</svg>`;
};

// 寿司图片数据
const sushiImages = [
  { name: 'salmon-nigiri', displayName: '三文鱼握寿司', emoji: '🍣', color: '#FF6B6B' },
  { name: 'tuna-sashimi', displayName: '金枪鱼刺身', emoji: '🐟', color: '#4ECDC4' },
  { name: 'california-roll', displayName: '加州卷', emoji: '🍙', color: '#45B7D1' },
  { name: 'tempura', displayName: '天妇罗', emoji: '🍤', color: '#FFA07A' },
  { name: 'eel-nigiri', displayName: '鳗鱼握寿司', emoji: '🍣', color: '#8B4513' },
  { name: 'uni', displayName: '海胆', emoji: '🦪', color: '#FFD700' },
  { name: 'dragon-roll', displayName: '龙卷', emoji: '🍱', color: '#32CD32' },
  { name: 'octopus-nigiri', displayName: '章鱼握寿司', emoji: '🐙', color: '#9370DB' },
  { name: 'salmon-sashimi', displayName: '三文鱼刺身', emoji: '🐟', color: '#FF69B4' },
  { name: 'shrimp-nigiri', displayName: '虾握寿司', emoji: '🍤', color: '#FF7F50' },
  { name: 'tuna-roll', displayName: '鲔鱼卷', emoji: '🍙', color: '#20B2AA' },
  { name: 'grilled-eel', displayName: '烤鳗鱼', emoji: '🐟', color: '#CD853F' }
];

// 确保images目录存在
const imagesDir = path.join(__dirname, '../public/images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// 生成SVG文件
sushiImages.forEach(sushi => {
  const svgContent = createSVGPlaceholder(sushi.displayName, sushi.emoji, sushi.color);
  const filePath = path.join(imagesDir, `${sushi.name}.svg`);
  
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created: ${sushi.name}.svg`);
});

console.log('所有寿司占位图片已生成完成！');
