/* Silver River — the people of Peach Blossom Town. */
(function () {
  'use strict';
  const G = window.SilverRiver;
  G.NPC = {
    mei: { name: 'Mei', zh: '梅', color: '#d85b82', body: 'girl', look: { hair: 'ink', skin: 'warm', eyes: 'ink' }, outfit: { jacket: '#bfe3d0', collar: '#3f8f6a', inner: '#fffaf2', skirt: '#f4c9a0', bow: '#3f8f6a' }, style: 'buns' },
    tao: { name: 'Tao', zh: '桃', color: '#c98f3a', body: 'boy', look: { hair: 'chestnut', skin: 'fair', eyes: 'amber' }, outfit: { jacket: '#e9d8b8', collar: '#8a5a3a', inner: '#fffaf2', skirt: '#8a6a4a', bow: '#8a5a3a' } },
    prince: { name: 'Jing', zh: '景', color: '#3f5fb0', body: 'boy', look: { hair: 'ink', skin: 'porcelain', eyes: 'sky' }, outfit: { jacket: '#f0f3fa', collar: '#3f5fb0', inner: '#ffffff', skirt: '#dfe6f5', bow: '#e6b64d' } },
    wanyin: { name: 'Lady Wanyin', zh: '婉', color: '#9a5ab8', body: 'girl', look: { hair: 'ink', skin: 'porcelain', eyes: 'violet' }, outfit: { jacket: '#e9dcf7', collar: '#9a5ab8', inner: '#ffffff', skirt: '#c9a8e8', bow: '#e6b64d' }, style: 'updo' },
    gao: { name: 'Master Gao', zh: '高', color: '#b8433a', body: 'man', look: { hair: 'ink', skin: 'tan', eyes: 'ink' }, outfit: { jacket: '#5a4a3a', collar: '#b8433a', inner: '#f4efe6', skirt: '#3a3028', bow: '#b8433a' }, beard: true },
    wen: { name: 'Scholar Wen', zh: '文', color: '#2f4166', body: 'man', look: { hair: 'silver', skin: 'fair', eyes: 'ink' }, outfit: { jacket: '#dbe8f4', collar: '#2f4166', inner: '#ffffff', skirt: '#b9cde3', bow: '#2f4166' }, beard: true },
    liu: { name: 'Maestro Liu', zh: '柳', color: '#6f8f5b', body: 'man', look: { hair: 'silver', skin: 'warm', eyes: 'ink' }, outfit: { jacket: '#e6ecd9', collar: '#6f8f5b', inner: '#ffffff', skirt: '#c8d4b4', bow: '#6f8f5b' } },
    hua: { name: 'Madam Hua', zh: '華', color: '#c7364a', body: 'woman', look: { hair: 'ink', skin: 'porcelain', eyes: 'ink' }, outfit: { jacket: '#f3d6dc', collar: '#c7364a', inner: '#ffffff', skirt: '#8f2530', bow: '#e6b64d' }, style: 'updo' },
    jingci: { name: 'Abbess Jingci', zh: '靜', color: '#6b7584', body: 'woman', look: { hair: 'silver', skin: 'warm', eyes: 'ink' }, outfit: { jacket: '#cfd5dc', collar: '#6b7584', inner: '#ffffff', skirt: '#aeb6c2', bow: '#6b7584' }, style: 'updo' },
    bao: { name: 'Auntie Bao', zh: '包', color: '#d9772f', body: 'woman', look: { hair: 'chestnut', skin: 'warm', eyes: 'ink' }, outfit: { jacket: '#f2d6b0', collar: '#c9594f', inner: '#fffaf2', skirt: '#efe6d6', bow: '#c9594f' }, style: 'updo' },
    yue: { name: 'Dancer Yue', zh: '月', color: '#d9577f', body: 'woman', look: { hair: 'ink', skin: 'fair', eyes: 'violet' }, outfit: { jacket: '#ffd6e3', collar: '#d9577f', inner: '#ffffff', skirt: '#ff9fb9', bow: '#ffffff' }, style: 'updo' },
    xing: { name: 'Old Xing', zh: '星', color: '#2b2f63', body: 'man', look: { hair: 'silver', skin: 'fair', eyes: 'sky' }, outfit: { jacket: '#2b2f63', collar: '#e6c56a', inner: '#f4f0ff', skirt: '#23275a', bow: '#e6c56a' }, beard: true },
    lu: { name: 'Physician Lu', zh: '陸', color: '#5f9072', body: 'man', look: { hair: 'ink', skin: 'fair', eyes: 'ink' }, outfit: { jacket: '#e4efe3', collar: '#5f9072', inner: '#ffffff', skirt: '#cfe3d2', bow: '#5f9072' } },
    bai: { name: 'Immortal Bai', zh: '白', color: '#7fa7c9', body: 'man', look: { hair: 'silver', skin: 'porcelain', eyes: 'sky' }, outfit: { jacket: '#f4fbff', collar: '#9fd1ea', inner: '#ffffff', skirt: '#dff1fb', bow: '#9fd1ea' } },
    voice: { name: 'A voice among the stars', zh: '河', color: '#8f9ad8' },
    kid: { name: 'A boy from the lane', zh: '童', color: '#8a6a4a', body: 'boy', look: { hair: 'chestnut', skin: 'warm', eyes: 'ink' }, outfit: { jacket: '#c9b08e', collar: '#6b4a3a', inner: '#fffaf2', skirt: '#8a6a4a', bow: '#6b4a3a' } },
    shop: { name: 'The shopkeeper', zh: '商', color: '#8a6a4a', body: 'man', look: { hair: 'ink', skin: 'tan', eyes: 'ink' }, outfit: { jacket: '#8a6a4a', collar: '#4a3a2a', inner: '#fffaf2', skirt: '#5a4a3a', bow: '#4a3a2a' } },
  };
})();
