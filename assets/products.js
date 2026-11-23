/* ════════════════════════════════════════════════════════════
   PRODUCTS — the shop catalogue. Shared by the shop pages and the
   private stock page (/admin). Stock counts are NOT set here: set
   them on /admin and the shop marks sizes Sold Out automatically.
   oos:[...] still works for sizes you want to hide by hand.
   ════════════════════════════════════════════════════════════ */
const products = [
 {
    id:1, category:'polo', badge:'new',
    name:' Bamszn OG green Polo', edition:'Stay Fly Edition',
    price:'$36.15', ngn:'₦48,000', amountNGN:48000, payLink:'',
    desc:'The one that started it all. The green OG Polo is cut from heavyweight piqué cotton with our signature embroidered "bamszn" badge on the collar when raised. Clean, structured, and built to last beyond one season.',
    sizes:['XS','S','M','L','XL','XXL'], oos:['XS'], available:false,
    material:'100% Premium Cotton Piqué', fit:'Regular / Fit',
    imgSrc:'https://i.postimg.cc/FsKmD4rD/IMG-1831.png',
    imgSrc2:'', swatch:'#111'
  },
  {
    id:2, category:'polo', badge:'ltd',
    name:'bamszn midnight crush ', edition:'Signature Edition',
    price:'$18.08', ngn:'₦25,000', amountNGN:25000, payLink:'',
    desc:"Soft on the eye, tough in the game. Limited run — once it's gone, it's gone.",
    sizes:['S','M','L','XL'], oos:[], available:false,
    material:'100% Premium Cotton, Midnight blue', fit:'Slim / Bodycon',
    imgSrc:'https://i.postimg.cc/Z5NFz5cz/copy-67E974A1-0A34-4329-BB50-80B29AF48DD3.png',
    imgSrc2:'https://i.postimg.cc/JnrbXcWs/copy-1F5E2FCB-EFA1-490B-8FF6-1D4EFCBABCEA.png', swatch:'#d4a0a0'
  },
  {
    id:3, category:'polo', badge:'ltd',
    name:'Burgundy Bamszn Polo', edition:'ltd Edition',
    price:'$36.15', ngn:'₦48,000', amountNGN:48000, payLink:'',
    desc:'Clean burgundy base, a combination built for the big moments. The Gold Edition is the centrepiece of The 001 Drop. Wear it like a trophy.',
    sizes:['S','M','L','XL','XXL'], oos:['XXL'], available:false,
    material:'100% Premium Cotton Piqué', fit:'Regular / Fit',
    imgSrc:'https://i.postimg.cc/26p8KXck/IMG-1832.png',
    imgSrc2:'', swatch:'#f0ede8'
  },
  {
    id:4, category:'polo', badge:'ltd',
    name:'Pink bam.szn Polo', edition:'New Edition',
    price:'$36.15', ngn:'₦48,000', amountNGN:48000, payLink:'',
    desc:'The everyday essential. cut in pink. Wear it alone, layer it — this one works every time.',
    sizes:['S','M','L','XL','XXL'], oos:[], available:false,
    material:'250gsm Heavyweight Cotton', fit:'Regular / Fit',
    imgSrc:'https://i.postimg.cc/W1C2dHPk/IMG-1833.png',
    imgSrc2:'', swatch:'#111'
  },
  {
    id:5, category:'tee', badge:null,
    name:'No Off Szn Tee', edition:'Graphic Edition',
    price:'$18.00', ngn:'₦28000', amountNGN:28000, payLink:'',
    desc:'Full-chest graphic tee with the Bam.szn manifesto printed in pink glitter . This is the statement piece — bold, loud, and impossible to ignore.',
    sizes:['S','M','L','XL'], oos:['S'], available:false,
    material:'180gsm Cotton', fit:'Regular / Relaxed',
    imgSrc:'https://i.postimg.cc/yxDkyr2Q/bamszn-glitter-tee.png',
    imgSrc2:'', swatch:'#777'
  },
  {
    id:6, category:'set', badge:'SOON',
    name:'Bamszn After hours ', edition:'Matching Set — Red',
    price:'$28.92', ngn:'₦40,000', amountNGN:40000, payLink:'',
    desc:'The full Bams experience. Cute, confident and made to move. A little sweet, a little bold, always in your own szn. An entire vibe — co-ord ready.',
    sizes:['S','M','L','XL'], oos:[], available:false,
    material:'100% waffle cotton — Co-ord Set', fit:'Matching / Relaxed',
    imgSrc:'https://i.postimg.cc/7YsbWDxv/freepik-bamsszn-project-20260918151747g4TM-removebg-preview.png',
    imgSrc2:'', swatch:'#C00000'
  },
   {
    id:7, category:'set', badge:'SOON',
    name:'Miss bamszn', edition:'Matching Set — Red',
    price:'$28.92', ngn:'₦40,000', amountNGN:40000, payLink:'',
    desc:'The full Bams experience. Cute, confident and made to move. A little sweet, a little bold, always in your own szn. An entire vibe — co-ord ready.',
    sizes:['S','M','L','XL'], oos:[], available:false,
    material:'100% waffle cotton — Co-ord Set', fit:'Matching / Relaxed',
    imgSrc:'https://i.postimg.cc/7YsbWDxv/freepik-bamsszn-project-20260918151747g4TM-removebg-preview.png',
    imgSrc2:'', swatch:'#C00000'
  },
];
